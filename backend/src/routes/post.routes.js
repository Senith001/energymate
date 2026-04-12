import express from "express";
import { 
  createPost, 
  getPosts, 
  getPostById, 
  deletePost 
} from "../controllers/post.controller.js";
import { protect, authorize } from "../middlewares/auth.middleware.js";
import { uploadPostImage } from "../middlewares/upload.middleware.js";

const router = express.Router();

router.route("/")
  .get(getPosts)
  .post(protect, authorize("admin", "superadmin"), uploadPostImage.single("image"), createPost);

router.route("/:id")
  .get(getPostById)
  .delete(protect, authorize("admin", "superadmin"), deletePost);

export default router;
