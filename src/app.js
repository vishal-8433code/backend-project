import express from "express"
import cors from "cors"
import cookieparser from "cookie-parser"

const app = express()

app.use(cors({origin : process.env.ORIGIN , credentials:true}))
app.use(express.json({limit:"16kb"}))
app.use(express.urlencoded({extended:true,limit : "16kb"}))
app.use(express.static("public"))
app.use(cookieparser())

// routes are here
import userRoutes from "./routes/user.routes.js";

app.use("/api/v1/users" , userRoutes);

export default app