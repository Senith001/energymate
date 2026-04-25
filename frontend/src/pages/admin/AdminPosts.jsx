// src/pages/admin/AdminPosts.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import { FiPlus, FiTrash2, FiImage, FiEdit2, FiEye, FiCalendar, FiUser } from "react-icons/fi";
import { getPosts, createPost, updatePost, deletePost } from "../../services/postService";
import {
  LoadingSpinner,
  EmptyState,
  ErrorState,
  PageHeader,
  Modal,
} from "../../components/ui/SharedComponents";

const BASE_URL = import.meta.env.VITE_API_URL
  ? import.meta.env.VITE_API_URL.replace('/api', '')
  : "http://localhost:5001";

/* ─────────────────────────────────────────────────────────
   Post Form — used for both Create and Edit
───────────────────────────────────────────────────────── */
function PostForm({ onSubmit, onCancel, loading, initialData }) {
  const isEdit = !!initialData;
  const [form, setForm] = useState({
    title: initialData?.title || "",
    summary: initialData?.summary || "",
    content: initialData?.content || "",
  });
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(
    initialData?.image ? `${BASE_URL}${initialData.image}` : null
  );
  const [errors, setErrors] = useState({});
  const fileInputRef = useRef(null);

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.summary.trim()) e.summary = "Summary is required";
    if (!form.content.trim()) e.content = "Content is required";
    if (!isEdit && !file) e.file = "Image is required";
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
    if (file) formData.append("image", file);
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Title */}
      <div>
        <label className="label">Post Title *</label>
        <input
          className={`input ${errors.title ? "border-red-400 focus:ring-red-400" : ""}`}
          placeholder="e.g. New Energy Policy Announced"
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
          placeholder="A quick 1-2 sentence preview shown on the home page..."
          value={form.summary}
          onChange={(e) => set("summary", e.target.value)}
        />
        {errors.summary && <p className="text-red-500 text-xs mt-1">{errors.summary}</p>}
      </div>

      {/* Image Upload */}
      <div>
        <label className="label">Cover Image {isEdit ? "(leave empty to keep current)" : "*"}</label>
        <div
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer transition-colors
            ${errors.file ? "border-red-400 bg-red-50" : "border-slate-200 hover:border-emerald-400 bg-slate-50 hover:bg-emerald-50/30"}`}
        >
          {preview ? (
            <img src={preview} alt="Preview" className="h-36 object-contain mb-2 rounded-lg shadow-sm" />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center text-slate-400 mb-2 shadow-sm border border-slate-100">
              <FiImage className="w-5 h-5" />
            </div>
          )}
          <p className="text-sm font-semibold text-slate-600">
            {file ? file.name : preview ? "Click to change image" : "Click to select image (JPG, PNG)"}
          </p>
          <p className="text-xs text-slate-400 mt-1">Max 5MB</p>
        </div>
        <input type="file" accept="image/*" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
        {errors.file && <p className="text-red-500 text-xs mt-1">{errors.file}</p>}
      </div>

      {/* Content */}
      <div>
        <label className="label">Full Article Content *</label>
        <textarea
          className={`input resize-none h-44 ${errors.content ? "border-red-400" : ""}`}
          placeholder="Write the full article content here. Use new lines to separate paragraphs."
          value={form.content}
          onChange={(e) => set("content", e.target.value)}
        />
        {errors.content && <p className="text-red-500 text-xs mt-1">{errors.content}</p>}
        <p className="text-xs text-slate-400 mt-1">{form.content.length} characters</p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
        <button type="button" onClick={onCancel} className="btn-secondary">Cancel</button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
          {isEdit ? "Save Changes" : "Publish Post"}
        </button>
      </div>
    </form>
  );
}

/* ─────────────────────────────────────────────────────────
   Post Card
───────────────────────────────────────────────────────── */
function PostCard({ post, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.04)] flex flex-col hover:shadow-[0_8px_30px_rgba(0,0,0,0.08)] transition-all duration-200 hover:-translate-y-0.5">
      {/* Image */}
      <div className="h-48 overflow-hidden bg-slate-100 relative">
        <img
          src={`${BASE_URL}${post.image}`}
          alt={post.title}
          className="w-full h-full object-cover transition-transform duration-300 hover:scale-105"
          onError={(e) => { e.target.src = "https://placehold.co/600x400/e2e8f0/94a3b8?text=No+Image"; }}
        />
        {/* Date badge */}
        <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-white/90 backdrop-blur-sm px-2.5 py-1 rounded-lg text-xs font-bold text-slate-700 shadow-sm">
          <FiCalendar className="w-3 h-3" />
          {new Date(post.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col">
        <h3 className="font-bold text-slate-900 text-base leading-snug mb-2 line-clamp-2">{post.title}</h3>
        <p className="text-sm text-slate-500 leading-relaxed line-clamp-2 mb-4">{post.summary}</p>

        {/* Author */}
        <div className="flex items-center gap-2 mb-4">
          <div className="w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center">
            <FiUser className="w-3 h-3 text-emerald-600" />
          </div>
          <span className="text-xs font-semibold text-slate-500">{post.author?.name || "Admin"}</span>
        </div>

        {/* Actions */}
        <div className="mt-auto pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
          <a
            href={`/news/${post._id}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-emerald-600 transition-colors"
          >
            <FiEye className="w-3.5 h-3.5" /> Preview
          </a>
          <div className="flex gap-2">
            <button
              onClick={() => onEdit(post)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors"
              title="Edit Post"
            >
              <FiEdit2 className="w-3.5 h-3.5" /> Edit
            </button>
            <button
              onClick={() => onDelete(post._id)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
              title="Delete Post"
            >
              <FiTrash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────
   Main Page
───────────────────────────────────────────────────────── */
export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editPost, setEditPost] = useState(null); // post object being edited
  const [formLoading, setFormLoading] = useState(false);

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getPosts();
      // Handle both { data: [...] } and plain array responses
      const list = res.data?.data || res.data || [];
      setPosts(list);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load posts.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  // Create
  const handleCreate = async (formData) => {
    setFormLoading(true);
    try {
      await createPost(formData);
      setShowCreate(false);
      fetchPosts();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to publish post. Ensure image size is under 5MB.");
    } finally {
      setFormLoading(false);
    }
  };

  // Edit
  const handleEdit = async (formData) => {
    setFormLoading(true);
    try {
      await updatePost(editPost._id, formData);
      setEditPost(null);
      fetchPosts();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to update post.");
    } finally {
      setFormLoading(false);
    }
  };

  // Delete
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this post? This cannot be undone.")) return;
    try {
      await deletePost(id);
      fetchPosts();
    } catch (err) {
      alert("Failed to delete post.");
    }
  };

  return (
    <div className="space-y-6 fade-in">
      <PageHeader
        title="Manage Public Posts"
        subtitle="Create and edit articles shown on the home page Insights section"
      >
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <FiPlus className="w-4 h-4" /> Publish New Post
        </button>
      </PageHeader>

      {/* Stats bar */}
      {!loading && !error && posts.length > 0 && (
        <div className="flex items-center gap-3 px-1">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            {posts.length} {posts.length === 1 ? "article" : "articles"} published
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <LoadingSpinner fullPage text="Loading posts..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchPosts} />
      ) : posts.length === 0 ? (
        <EmptyState
          icon="📝"
          title="No Published Posts"
          description="Create your first post to show it in the Insights & Guides section on the home page."
          action={
            <button onClick={() => setShowCreate(true)} className="btn-primary">
              <FiPlus className="w-4 h-4" /> Publish First Post
            </button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onEdit={setEditPost}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Publish New Post"
        size="lg"
      >
        <PostForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          loading={formLoading}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={!!editPost}
        onClose={() => setEditPost(null)}
        title="Edit Post"
        size="lg"
      >
        <PostForm
          onSubmit={handleEdit}
          onCancel={() => setEditPost(null)}
          loading={formLoading}
          initialData={editPost}
        />
      </Modal>
    </div>
  );
}