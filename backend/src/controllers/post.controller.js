import Post from "../models/Post.js";

// @desc    Create new post
// @route   POST /api/posts
// @access  Private/Admin
export const createPost = async (req, res, next) => {
  try {
    const { title, summary, content } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ message: "Image is required" });
    }

    const imagePath = `/uploads/posts/${req.file.filename}`;

    const post = await Post.create({
      title,
      summary,
      content,
      image: imagePath,
      author: req.user._id,
    });

    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
};

// @desc    Get all active posts
// @route   GET /api/posts
// @access  Public
export const getPosts = async (req, res, next) => {
  try {
    const posts = await Post.find().sort({ createdAt: -1 });
    res.status(200).json(posts);
  } catch (error) {
    next(error);
  }
};

// @desc    Get post by ID
// @route   GET /api/posts/:id
// @access  Public
export const getPostById = async (req, res, next) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }
    res.status(200).json(post);
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
      return res.status(404).json({ message: "Post not found" });
    }
    await Post.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: "Post removed" });
  } catch (error) {
    next(error);
  }
};
