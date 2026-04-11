import React, { useState, useEffect, useCallback, useRef } from "react";
import { FiPlus, FiTrash2, FiImage, FiFileText } from "react-icons/fi";
import { getPosts, createPost, deletePost } from "../../services/postService";
import {
  LoadingSpinner,
  EmptyState,
  ErrorState,
  PageHeader,
  Modal,
} from "../../components/ui/SharedComponents";

function PostForm({ onSubmit, onCancel, loading }) {
  const [form, setForm] = useState({ title: "", summary: "", content: "" });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.summary.trim()) e.summary = "Summary is required";
    if (!form.content.trim()) e.content = "Content is required";
    if (!file) e.file = "Image is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleFileChange = (e) => {
    const selected = e.target.files[0];
    if (selected) {
      setFile(selected);
      setPreview(URL.createObjectURL(selected));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;

    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("summary", form.summary);
    formData.append("content", form.content);
    formData.append("image", file);

    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="label">Post Title *</label>
        <input
          className={`input ${errors.title ? "border-red-400 focus:ring-red-400" : ""}`}
          placeholder="e.g. New Energy Polices Announced"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
      </div>

      {/* Summary */}
      <div>
        <label className="label">Short Summary *</label>
        <input
          className={`input ${errors.summary ? "border-red-400" : ""}`}
          placeholder="A quick 1-2 sentence preview for the Landing Page card..."
          value={form.summary}
          onChange={(e) => set("summary", e.target.value)}
        />
        {errors.summary && <p className="text-red-500 text-xs mt-1">{errors.summary}</p>}
      </div>

      {/* Image Upload */}
      <div>
        <label className="label">Cover Image *</label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors ${errors.file ? "border-red-400 bg-red-50" : "border-gray-300 hover:border-blue-400 bg-gray-50 hover:bg-blue-50/50"}`}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="h-32 object-contain mb-2 rounded shadow-sm" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center text-gray-400 mb-2 shadow-sm">
              <FiImage className="w-5 h-5" />
            </div>
          )}
          <p className="text-sm font-medium text-gray-700">
            {file ? file.name : "Click to select an image (JPG, PNG)"}
          </p>
        </div>
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleFileChange}
        />
        {errors.file && <p className="text-red-500 text-xs mt-1">{errors.file}</p>}
      </div>

      {/* Content */}
      <div>
        <label className="label">Full Post Content *</label>
        <textarea
          className={`input resize-none h-40 ${errors.content ? "border-red-400" : ""}`}
          placeholder="Write the full article content here..."
          value={form.content}
          onChange={(e) => set("content", e.target.value)}
        />
        {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content}</p>}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <span className="spinner w-4 h-4" /> : null}
          Publish Post
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────
export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [formLoading, setFormLoading] = useState(false);

  // ── Fetch ──────────────────────────────────────────────
  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getPosts();
      setPosts(data || []);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load posts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // ── Create ─────────────────────────────────────────────
  const handleCreate = async (formData) => {
    setFormLoading(true);
    try {
      await createPost(formData);
      setShowCreate(false);
      fetchPosts();
    } catch (err) {
      alert("Failed to publish post. Ensure image size is under 5MB.");
      console.error(err);
    } finally {
      setFormLoading(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this public post?")) return;
    try {
      await deletePost(id);
      fetchPosts();
    } catch (err) {
      alert("Failed to delete.");
    }
  };

  // ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6 fade-in">
      {/* Page Header */}
      <PageHeader
        title="Manage Public Posts"
        subtitle="Create dynamic articles to show on the Landing Page"
      >
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary"
        >
          <FiPlus className="w-4 h-4" />
          Publish New Post
        </button>
      </PageHeader>

      {/* Content */}
      {loading ? (
        <LoadingSpinner fullPage text="Loading posts..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchPosts} />
      ) : posts.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No Published Posts"
          description="Create your first post to replace the default static cards on the Landing Page."
          action={
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <FiPlus className="w-4 h-4" />
              Publish Post
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {posts.map((post) => (
            <div key={post._id} className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 flex flex-col hover:shadow-md transition">
              <div className="h-48 overflow-hidden relative bg-gray-100">
                <img
                  src={`http://localhost:5001${post.image}`}
                  alt={post.title}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-gray-900 text-lg mb-2 leading-snug">{post.title}</h3>
                <p className="text-sm text-gray-500 mb-4 line-clamp-2">{post.summary}</p>
                <div className="mt-auto pt-4 border-t border-gray-50 flex justify-between items-center">
                  <span className="text-xs font-medium text-gray-400">
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => handleDelete(post._id)}
                    className="flex justify-center items-center w-8 h-8 rounded-full text-red-500 hover:bg-red-50 transition"
                    title="Delete Post"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Create Modal ─────────────────────────────── */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Publish New Public Post"
        size="lg"
      >
        <PostForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          loading={formLoading}
        />
      </Modal>
    </div>
  );
}
