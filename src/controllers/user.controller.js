import asyncHandler from "../utils/asyncHandler.js";
import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import uploadOnCloudinary from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponseErr.js";
import fs from "fs";
import jwt from "jsonwebtoken"

const registerUser = asyncHandler(async (req, res) => {
  const { email, password, username, fullName } = req.body;

  // 🧠 Validate required fields
  if ([email, password, username, fullName].some(field => field?.trim() === "")) {
    throw new ApiError(400, "Please fill in all required fields.");
  }

  console.log("Password Received:", password);

  // 🧠 Check for existing user
  const existedUser = await User.findOne({
    $or: [{ email }, { username }]
  });

  if (existedUser) {
    throw new ApiError(409, "User already exists. Try a different email or username.");
  }

  // 🖼️ Handle file paths
  const avatarLocalPath = req.files?.avatar?.[0]?.path;
  const coverImageLocalPath = req.files?.coverImage?.[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar file is missing.");
  }

  let avatar = null;
  let coverImage = null;

  // ✅ Upload avatar to Cloudinary
  try {
    avatar = await uploadOnCloudinary(avatarLocalPath);
    console.log("✅ Avatar Response =>", avatar);

    if (fs.existsSync(avatarLocalPath)) {
      fs.unlinkSync(avatarLocalPath);
    }

  } catch (error) {
    console.error("❌ Avatar upload or delete error:", error);
    throw new ApiError(500, "Avatar upload failed.");
  }


  // ✅ Upload cover image if available
  if (coverImageLocalPath) {
    try {
      coverImage = await uploadOnCloudinary(coverImageLocalPath);
      console.log("✅ Cover Image =>", coverImage);

      if (fs.existsSync(coverImageLocalPath)) {
        fs.unlinkSync(coverImageLocalPath);
      }

    } catch (error) {
      console.warn("Cover image upload failed:", error);
    }
  }


  // 🧠 Create user in DB
  const user = await User.create({
    fullName,
    avatar: avatar?.secure_url || "",
    coverImage: coverImage?.secure_url || "",
    email,
    password,
    username: username.toLowerCase()
  });

  // 🔐 Remove sensitive fields from response
  const createdUser = await User.findById(user._id).select("-password -refreshToken");

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while creating the user.");
  }

  // 🎉 Send success response
  return res.status(200).json(
    new ApiResponse(createdUser, "User has been successfully created", 200)
  );
});

const generateAccessAndRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId)
    const accessToken = user.generateAccessToken()
    const refreshToken = user.generateRefreshToken()

    user.refreshToken = refreshToken
    await user.save({ validateBeforeSave: false })

    return { accessToken, refreshToken }
  } catch (error) {
    throw new ApiError(500, "something went wrong in generate tokens")
  }
}

const loginUser = asyncHandler(async (req, res) => {
  if (!req.body) {
    throw new Error("Request body is missing");
  }
  const { email, username, password } = req.body

  if (!email && !username) {
    throw new ApiError(400, "please send your email or username")
  }

  const user = await User.findOne({
    $or: [{ username }, { email }]
  })
  if (!user) {
    throw new ApiError(404, "user does not exist")
  }
  const isPasswordValid = await user.isPasswordCorrect(password)
  if (!isPasswordValid) {
    throw new ApiError(401, "password is incorrect")
  }
  const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user._id)

  const loggedInUser = await User.findById(user._id).select("-password")
  if (!loggedInUser) {
    throw new ApiError(404, "user not logged in")
  }

  const options = {
    httpOnly: true,
    secure: true
  }
  return res.status(200)
    .cookie("accessToken", accessToken, options)

    .cookie("refreshToken", refreshToken, options)

    .json(
      new ApiResponse(
        {
          user: loggedInUser,
          accessToken,
          refreshToken
        },
        "user sucessfully login",
        console.log("user login sucessfully"),
        200,
      )
    )


})

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id,
    {
      $set: {
        refreshToken: undefined
      },
    },
    { new: true }
  )
  const options = {
    httpOnly: true,
    secure: true
  }
  res
    .status(200)
    .clearCookie("refreshToken", options)
    .clearCookie("accessToken", options)
    .json(
      ApiResponse(200, "user sucessfully logout"),
      console.log("user logout sucessfully")
    )
})

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized refresh token")
  }
  try {
    const decodeToken = jwt.verify(incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    )
    const user = await User.findById(decodeToken?._id)
    if (!user) {
      throw new ApiError(401, "invalid user token")
    }

    if (incomingRefreshToken !== user?._id) {
      throw new ApiError(401, "they are not same tokens")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshTokens(user?._id)

    const options = {
      httpOnly: true,
      secure: true
    }
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            accessToken,
            refreshToken
          },
          "acess token generate sucessfully"
        )
      )
  } catch (error) {
    throw new ApiError(400, error.mgs),
    console.log("something error in generate access token")
  }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword } = req.body
  const user = await User.findById(req.user?._id)
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

  if (!isPasswordCorrect) {
    throw new ApiError("password is incorrect please check your password", 401)
  }
  user.password = newPassword
  await user.save({ validateBeforeSave: false })

  return res.status(200)
    .json(
      new ApiResponse(200, "password change sucessfully")
    )
})

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200)
    .json(200, req.user, "user fetch sucessfully")
})

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body
  if (!(fullName || email)) {
    throw new ApiError(401, "please fill fullName and email fieds")
  }
  const user = await User.findByIdAndUpdate(req.user._id,
    {
      $set: {
        email,
        fullName
      }
    }, { new: true }
  ).select("-password")

  return res
    .status(200)
    .json(
      new ApiResponse(200, "user details updated sucessfully", user)
    )
})

const updatedCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.file?.path
  if (!coverImageLocalPath) {
    throw new ApiError(404, "coverImage local path not found")
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  if (!coverImage) {
    throw new ApiError(404, "coverImage local path not found")
  }
  const updateCoverImage = await User.findByIdAndUpdate(req.user?._id,
    {
      $set: {
        coverImage: coverImage.secure_url
      }
    },
    { new: true }).select("-password")

  return res
    .status(200)
    .json(
      new ApiResponse(200,updateCoverImage, "avatar updated sucessfully")
    )
})

const updatedAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.file?.path
  if (!avatarLocalPath) {
    throw new ApiError(404, "avatat local path not found")
  }
  const Avatar = await uploadOnCloudinary(avatarLocalPath)
  if (!Avatar) {
    throw new ApiError(404, "avatat local path not found")
  }
  const updateAvatar = await User.findByIdAndUpdate(req.user?._id,
    {
      $set: {
        avatar: Avatar.secure_url
      }
    },
    { new: true }).select("-password")

  return res
    .status(200)
    .json(
      new ApiResponse(200, updateAvatar, "avatar updated sucessfully")
    )
})


export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updatedAvatar,
  updatedCoverImage
};

