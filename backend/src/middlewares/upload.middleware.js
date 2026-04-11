import multer from "multer";
import path from "path";
import fs from "fs";

const uploadDir = path.join(
  process.cwd(),
  "uploads",
  "user avatars"
);

// Automatically create folder if not exists
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `avatar_${req.user._id}_${Date.now()}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, WEBP images allowed"));
  }
  cb(null, true);
};

export const uploadAvatar = multer({
  storage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
});

const postUploadDir = path.join(
  process.cwd(),
  "uploads",
  "posts"
);

if (!fs.existsSync(postUploadDir)) {
  fs.mkdirSync(postUploadDir, { recursive: true });
}

const postStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, postUploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `post_${Date.now()}${ext}`);
  },
});

export const uploadPostImage = multer({
  storage: postStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
});