// src/services/postService.js
import api from "./api";

// Create a new post (multipart/form-data)
export const createPost = (formData) =>
  api.post("/posts", formData, { headers: { "Content-Type": "multipart/form-data" } });

// Update existing post (multipart/form-data — image optional)
export const updatePost = (id, formData) =>
  api.put(`/posts/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } });

// Get all posts (public)
export const getPosts = () => api.get("/posts");

// Get single post by ID (public)
export const getPostById = (id) => api.get(`/posts/${id}`);

// Delete post by ID
export const deletePost = (id) => api.delete(`/posts/${id}`);