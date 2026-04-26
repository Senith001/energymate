import multer from "multer";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

// Cloudinary Configuration
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const fileFilter = (req, file, cb) => {
  const allowed = ["image/jpeg", "image/png", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only JPG, PNG, WEBP images allowed"));
  }
  cb(null, true);
};

// ── AVATAR UPLOAD (Cloudinary) ──────────────────────────
const avatarStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "energymate/avatars",
    allowed_formats: ["jpg", "png", "webp"],
    public_id: (req, file) => `avatar_${req.user._id}_${Date.now()}`,
  },
});

export const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter,
  limits: { fileSize: 2 * 1024 * 1024 },
});

// ── POST IMAGE UPLOAD (Cloudinary) ──────────────────────
const postStorage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "energymate/posts",
    allowed_formats: ["jpg", "png", "webp"],
    public_id: (req, file) => `post_${Date.now()}`,
  },
});

export const uploadPostImage = multer({
  storage: postStorage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 },
});

// ── BACKUP DISK STORAGE (For reference or local) ───────
// Keep this if you want to support local uploads without Cloudinary
const localDiskStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(process.cwd(), "uploads", "posts");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `post_${Date.now()}${ext}`);
  },
});