import api from "./api";

// Create a new post (multipart/form-data)
export const createPost = (formData) => {
  return api.post("/posts", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};

// Get all posts (public)
export const getPosts = () => {
  return api.get("/posts");
};

// Get single post by ID (public)
export const getPostById = (id) => {
  return api.get(`/posts/${id}`);
};

// Delete post by ID
export const deletePost = (id) => {
  return api.delete(`/posts/${id}`);
};
