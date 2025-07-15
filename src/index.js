import dotenv from "dotenv";
dotenv.config();
import DBconnect from "./db/index.js";
import app from "./app.js"

DBconnect()
    .then(() => {
app.listen(process.env.PORT,() => {
    console.log(`your server hass been connected at is port`, process.env.PORT)
})
    }).catch((error) => {
        app.on("error" ,(error) => {
            console.log("something error in data base connection")
        })
        console.log("database connection has been failed")
    })








