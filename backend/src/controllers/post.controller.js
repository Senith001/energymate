// src/controllers/post.controller.js
import Post from "../models/Post.js";
import fs from "fs";
import path from "path";

// @desc    Create new post
// @route   POST /api/posts
// @access  Private/Admin
export const createPost = async (req, res, next) => {
  try {
    const { title, summary, content } = req.body;

    if (!req.file) {
      return res.status(400).json({ success: false, message: "Image is required" });
    }

    const imagePath = `/uploads/posts/${req.file.filename}`;

    const post = await Post.create({
      title,
      summary,
      content,
      image: imagePath,
      author: req.user._id,
    });

    const populated = await post.populate("author", "name");
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Get all posts
// @route   GET /api/posts
// @access  Public
export const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find()
      .sort({ createdAt: -1 })
      .populate("author", "name");
    res.status(200).json({ success: true, data: posts });
  } catch (error) {
    next(error);
  }
};

// @desc    Get post by ID
// @route   GET /api/posts/:id
// @access  Public
export const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id).populate("author", "name");
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }
    res.status(200).json({ success: true, data: post });
  } catch (error) {
    next(error);
  }
};

// @desc    Update post (title, summary, content, optionally image)
// @route   PUT /api/posts/:id
// @access  Private/Admin
export const updatePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    const { title, summary, content } = req.body;
    if (title) post.title = title;
    if (summary) post.summary = summary;
    if (content) post.content = content;

    // If a new image was uploaded, delete the old one and update path
    if (req.file) {
      const oldImagePath = path.join(process.cwd(), post.image);
      if (fs.existsSync(oldImagePath)) {
        fs.unlinkSync(oldImagePath);
      }
      post.image = `/uploads/posts/${req.file.filename}`;
    }

    await post.save();
    const populated = await post.populate("author", "name");
    res.status(200).json({ success: true, data: populated });
  } catch (error) {
    next(error);
  }
};

// @desc    Delete post by ID
// @route   DELETE /api/posts/:id
// @access  Private/Admin
export const deletePost = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // Delete the image file from disk
    const imagePath = path.join(process.cwd(), post.image);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Post deleted successfully" });
  } catch (error) {
    next(error);
  }
};