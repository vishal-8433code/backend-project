import { v2 as cloudinary } from 'cloudinary'
import fs from "fs"

cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.API_KEY,
    api_secret: process.env.API_SECRET
});

const UploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
    console.log(response,"response capture")
        return response;

    } catch (error) {
        fs.unlinkSync(localFilePath) 
        return null;
    }
}
export { UploadOnCloudinary }
// yo code bs ek file ko cloudinary pe store krane ke liye hai and jb bhi kisi file ko store karana hoga to har baar iss function ko call krna hoga