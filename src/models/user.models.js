import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const userSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true
        },
        fullname: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        password: {
            type: String,
            required: [true, " type password at least 6 character"]
        },
        avatar: {
            type: String,
            required: true
        },
        coverImage: {
            type: String,
            required: true,
        },
        refreshToken: {
            type: String,
        },
        watchHistory: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Video"
            }
        ]
    },
    {
        timestamps: true
    }
)
userSchema.pre("save" , async function(next) {
    if (!this.modified("password")) return next();

        this.password = await bcrypt.hash(this.password,10)
        next()
});
userSchema.methods.isPasswordCorrect = async function(password) {
    return await bcrypt.compare(password,this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign({
        _id:this.id,
        fullname:this.fullname,
        email:this.email,
        username:this.username
    },
    process.env.ACCESS_SECRET_TOKEN,
    {expiresIn:process.env.ACCESS_TOKEN_EXPIRY}
)
}

userSchema.methods.generateRefreshToken = function () {
   return jwt.sign({
    _id:this.id
   },
   process.env.REFRESH_TOKEN_SECRET,
   {expiresIn:REFRESH_TOKEN_EXPIRY}
) 
}
export const User = mongoose.model("User", userSchema);