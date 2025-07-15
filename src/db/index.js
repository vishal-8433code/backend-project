import mongoose from "mongoose"

const DBconnect = async() => {
    try {
     const connection = await mongoose.connect(process.env.MONGODB_URL)
     console.log(`your database hass been connected at the host of ${connection}`)
    } catch (error) {
        console.log("conection has been failed in db folder ")
        process.exit(1)
    }
}
export default DBconnect