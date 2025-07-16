import dotenv from "dotenv";
dotenv.config();

import DBconnect from "./db/index.js";
import app from "./app.js";

const PORT = process.env.PORT || 3000;

DBconnect()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`✅ Server started on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("❌ Failed to connect to the database:", error);
    process.exit(1);
  });


app.on("error", (err) => {
  console.error("❌ Express app error:", err);
});








