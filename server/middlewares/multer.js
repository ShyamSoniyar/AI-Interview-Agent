import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Resolve from this file, not process.cwd(), so the server works from any directory
const uploadDir = path.join(__dirname, "..", "public");

fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // basename strips any path segments — originalname is attacker-controlled
    const safeName = path
      .basename(file.originalname)
      .replace(/[^a-zA-Z0-9._-]/g, "_")
      .slice(-100);
    cb(null, `${Date.now()}-${safeName}`);
  },
});

export const upload = multer({
  storage: storage,
  limits: { fileSize: 1024 * 1024 * 5, files: 1 }, // 5MB, single file
  fileFilter: (req, file, cb) => {
    if (file.mimetype !== "application/pdf") {
      return cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "resume"));
    }
    cb(null, true);
  },
});
