import multer from "multer";
import fs from "fs";
import path from "path";

// ✅ Ensure "./public/temp" folder exists
const tempDir = path.resolve("public/temp");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // ✅ Using original name as requested
  },
});

export const upload = multer({ storage });
