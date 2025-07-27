import { User } from "../models/user.models.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
        console.log("AccessToken from Cookie:", req.cookies?.accessToken);
console.log("Authorization Header:", req.header("Authorization"));

        if (!token) {
            throw new ApiError(400, "comethind went wrong to find jwt token")
        }
        const decodedJwt = jwt.verify(token, process.env.ACCESS_SECRET_TOKEN)

        const user = await User.findById(decodedJwt?._id).select("-password")

        if (!user) {
            throw new ApiError(400, "jwt token not found")
        }
        req.user = user
        next()
        
    } catch (error) {
console.error(error?.message,"token has been failed")
    }
})