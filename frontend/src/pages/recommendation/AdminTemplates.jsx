import React, { useState, useEffect, useCallback } from "react";
import {
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiSearch,
  FiFilter,
  FiExternalLink,
  FiTag,
  FiGrid,
  FiList,
} from "react-icons/fi";
import {
  getAdminTemplates,
  createAdminTemplate,
  updateAdminTemplate,
  deleteAdminTemplate,
} from "../../services/recommendationService";
import {
  LoadingSpinner,
  EmptyState,
  ErrorState,
  PageHeader,
  Modal,
  PriorityBadge,
  CategoryBadge,
  Toggle,
} from "../../components/ui/SharedComponents";
// Temporarily mapping toast to console since ToastContext is team dependent
const useToast = () => ({
  success: (msg) => console.log("SUCCESS:", msg),
  error: (msg) => console.error("ERROR:", msg),
  info: (msg) => console.info("INFO:", msg),
  warning: (msg) => console.warn("WARNING:", msg)
});

// ─────────────────────────────────────────────────────────
// Form Component
// ─────────────────────────────────────────────────────────
const EMPTY_FORM = {
  title: "",
  description: "",
  category: "",
  priority: "medium",
  tags: "",
  learnMoreUrl: "",
  isActive: true,
};

const CATEGORIES = [
  "Lighting",
  "Appliances",
  "HVAC",
  "Water Heating",
  "Insulation",
  "Solar",
  "Behavior",
  "General",
];
const PRIORITIES = ["low", "medium", "high"];

function TemplateForm({ initial, onSubmit, onCancel, loading }) {
  const [form, setForm] = useState(initial || EMPTY_FORM);
  const [errors, setErrors] = useState({});

  const set = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const validate = () => {
    const e = {};
    if (!form.title.trim()) e.title = "Title is required";
    if (!form.description.trim()) e.description = "Description is required";
    if (!form.category) e.category = "Category is required";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const payload = {
      ...form,
      tags: form.tags
        ? form.tags.split(",").map((t) => t.trim()).filter(Boolean)
        : [],
    };
    onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Title */}
      <div>
        <label className="label">Title *</label>
        <input
          className={`input ${errors.title ? "border-red-400 focus:ring-red-400" : ""}`}
          placeholder="e.g. Switch to LED Bulbs"
          value={form.title}
          onChange={(e) => set("title", e.target.value)}
        />
        {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title}</p>}
      </div>

      {/* Description */}
      <div>
        <label className="label">Description *</label>
        <textarea
          className={`input resize-none h-24 ${errors.description ? "border-red-400 focus:ring-red-400" : ""}`}
          placeholder="Describe the recommendation..."
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
        />
        {errors.description && (
          <p className="text-red-500 text-xs mt-1">{errors.description}</p>
        )}
      </div>

      {/* Category & Priority */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="label">Category *</label>
          <select
            className={`input ${errors.category ? "border-red-400 focus:ring-red-400" : ""}`}
            value={form.category}
            onChange={(e) => set("category", e.target.value)}
          >
            <option value="">Select category</option>
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          {errors.category && (
            <p className="text-red-500 text-xs mt-1">{errors.category}</p>
          )}
        </div>
        <div>
          <label className="label">Priority</label>
          <select
            className="input"
            value={form.priority}
            onChange={(e) => set("priority", e.target.value)}
          >
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Tags */}
      <div>
        <label className="label">Tags (comma-separated)</label>
        <input
          className="input"
          placeholder="e.g. energy-saving, lighting, quick-win"
          value={form.tags}
          onChange={(e) => set("tags", e.target.value)}
        />
      </div>

      {/* Learn More URL */}
      <div>
        <label className="label">Learn More URL</label>
        <input
          className="input"
          type="url"
          placeholder="https://..."
          value={form.learnMoreUrl}
          onChange={(e) => set("learnMoreUrl", e.target.value)}
        />
      </div>

      {/* Active Toggle */}
      <div className="flex items-center justify-between py-2 px-4 bg-gray-50 rounded-xl">
        <div>
          <p className="text-sm font-medium text-gray-800">Active</p>
          <p className="text-xs text-gray-500">
            Visible to users when enabled
          </p>
        </div>
        <Toggle checked={form.isActive} onChange={(v) => set("isActive", v)} />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
        <button type="button" onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button type="submit" disabled={loading} className="btn-primary">
          {loading ? <span className="spinner w-4 h-4" /> : null}
          {initial?._id ? "Save Changes" : "Create Template"}
        </button>
      </div>
    </form>
  );
}

// ─────────────────────────────────────────────────────────
// Template Card Component
// ─────────────────────────────────────────────────────────
function TemplateCard({ template, onEdit, onDelete, onToggle, toggling }) {
  const tags = Array.isArray(template.tags) ? template.tags : [];

  return (
    <div className="card card-hover group fade-in flex flex-col gap-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <CategoryBadge category={template.category} />
            <PriorityBadge priority={template.priority} />
            {!template.isActive && (
              <span className="badge badge-gray">Inactive</span>
            )}
          </div>
          <h3 className="font-bold text-gray-900 text-base leading-snug mt-1">
            {template.title}
          </h3>
        </div>

        {/* Status toggle */}
        <div className="flex-shrink-0 pt-1">
          <Toggle
            checked={template.isActive}
            onChange={() => onToggle(template)}
            disabled={toggling === template._id}
          />
        </div>
      </div>

      {/* Description */}
      <p className="text-sm text-gray-600 leading-relaxed line-clamp-3">
        {template.description}
      </p>

      {/* Tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium"
            >
              <FiTag className="w-3 h-3" />
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Footer actions */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-auto">
        <div className="flex items-center gap-2">
          {template.learnMoreUrl && (
            <a
              href={template.learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              <FiExternalLink className="w-3 h-3" />
              Learn More
            </a>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => onEdit(template)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
            title="Edit"
          >
            <FiEdit2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(template)}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
            title="Delete"
          >
            <FiTrash2 className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Delete Confirmation Dialog
// ─────────────────────────────────────────────────────────
function DeleteConfirmDialog({ template, onConfirm, onCancel, loading }) {
  return (
    <div className="text-center py-2">
      <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl">
        🗑️
      </div>
      <h3 className="text-lg font-bold text-gray-900 mb-1">Delete Template?</h3>
      <p className="text-sm text-gray-500 mb-6">
        Are you sure you want to delete{" "}
        <span className="font-semibold text-gray-700">"{template?.title}"</span>?
        This action cannot be undone.
      </p>
      <div className="flex gap-3 justify-center">
        <button onClick={onCancel} className="btn-secondary">
          Cancel
        </button>
        <button
          onClick={onConfirm}
          disabled={loading}
          className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-xl transition-all duration-200 disabled:opacity-60"
        >
          {loading ? <span className="spinner w-4 h-4" /> : null}
          Delete
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────
export default function AdminTemplates() {
  const toast = useToast();
  const [templates, setTemplates] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [viewMode, setViewMode] = useState("grid"); // "grid" | "list"

  // Modals
  const [showCreate, setShowCreate] = useState(false);
  const [editTemplate, setEditTemplate] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [toggling, setToggling] = useState(null);

  // ── Fetch ──────────────────────────────────────────────
  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getAdminTemplates();
      const list = data.templates || data.data || data || [];
      setTemplates(list);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load templates.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  // ── Filter ─────────────────────────────────────────────
  useEffect(() => {
    let list = [...templates];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (t) =>
          t.title?.toLowerCase().includes(q) ||
          t.description?.toLowerCase().includes(q) ||
          t.category?.toLowerCase().includes(q)
      );
    }
    if (filterCategory) {
      list = list.filter((t) => t.category?.toLowerCase() === filterCategory.toLowerCase());
    }
    if (filterPriority) {
      list = list.filter((t) => t.priority?.toLowerCase() === filterPriority.toLowerCase());
    }
    setFiltered(list);
  }, [templates, search, filterCategory, filterPriority]);

  // ── Create ─────────────────────────────────────────────
  const handleCreate = async (payload) => {
    setFormLoading(true);
    try {
      await createAdminTemplate(payload);
      toast.success("Template created successfully!");
      setShowCreate(false);
      fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create template.");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Edit ───────────────────────────────────────────────
  const handleEdit = async (payload) => {
    setFormLoading(true);
    try {
      await updateAdminTemplate(editTemplate._id, payload);
      toast.success("Template updated successfully!");
      setEditTemplate(null);
      fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to update template.");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Delete ─────────────────────────────────────────────
  const handleDelete = async () => {
    setFormLoading(true);
    try {
      await deleteAdminTemplate(deleteTarget._id);
      toast.success("Template deleted.");
      setDeleteTarget(null);
      fetchTemplates();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete template.");
    } finally {
      setFormLoading(false);
    }
  };

  // ── Toggle Active ──────────────────────────────────────
  const handleToggle = async (template) => {
    setToggling(template._id);
    try {
      await updateAdminTemplate(template._id, { isActive: !template.isActive });
      toast.success(
        `Template ${!template.isActive ? "activated" : "deactivated"}.`
      );
      fetchTemplates();
    } catch (err) {
      toast.error("Failed to update template status.");
    } finally {
      setToggling(null);
    }
  };

  // ── Stats ──────────────────────────────────────────────
  const stats = {
    total: templates.length,
    active: templates.filter((t) => t.isActive).length,
    high: templates.filter((t) => t.priority === "high").length,
  };

  // ─────────────────────────────────────────────────────
  return (
    <div className="space-y-6 fade-in">
      {/* Page Header */}
      <PageHeader
        title="Recommendation Templates"
        subtitle="Manage energy-saving recommendations shown to users"
      >
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary"
          id="btn-create-template"
        >
          <FiPlus className="w-4 h-4" />
          New Template
        </button>
      </PageHeader>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 text-xl flex-shrink-0">
            📋
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            <p className="text-xs text-gray-500 font-medium">Total Templates</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600 text-xl flex-shrink-0">
            ✅
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.active}</p>
            <p className="text-xs text-gray-500 font-medium">Active</p>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center text-red-500 text-xl flex-shrink-0">
            🔴
          </div>
          <div>
            <p className="text-2xl font-bold text-gray-900">{stats.high}</p>
            <p className="text-xs text-gray-500 font-medium">High Priority</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="card !py-4">
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          {/* Search */}
          <div className="relative flex-1 min-w-0">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              className="input pl-9"
              placeholder="Search templates..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="search-templates"
            />
          </div>

          {/* Category Filter */}
          <div className="flex items-center gap-2">
            <FiFilter className="text-gray-400 w-4 h-4 flex-shrink-0" />
            <select
              className="input w-40"
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <select
            className="input w-36"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>

          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 rounded-xl p-1 gap-1">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white shadow text-blue-600" : "text-gray-400 hover:text-gray-600"
                }`}
            >
              <FiGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-lg transition-colors ${viewMode === "list" ? "bg-white shadow text-blue-600" : "text-gray-400 hover:text-gray-600"
                }`}
            >
              <FiList className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner fullPage text="Loading templates..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchTemplates} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="📭"
          title="No templates found"
          description={
            search || filterCategory || filterPriority
              ? "Try adjusting your filters."
              : "Create your first recommendation template to get started."
          }
          action={
            !search && !filterCategory && !filterPriority ? (
              <button onClick={() => setShowCreate(true)} className="btn-primary">
                <FiPlus className="w-4 h-4" />
                Create Template
              </button>
            ) : null
          }
        />
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((t) => (
            <TemplateCard
              key={t._id}
              template={t}
              onEdit={setEditTemplate}
              onDelete={setDeleteTarget}
              onToggle={handleToggle}
              toggling={toggling}
            />
          ))}
        </div>
      ) : (
        /* List view */
        <div className="card !p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left px-5 py-3 font-semibold text-gray-600">Title</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 font-semibold text-gray-600 hidden lg:table-cell">Priority</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Status</th>
                <th className="text-center px-4 py-3 font-semibold text-gray-600">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map((t) => (
                <tr key={t._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="font-medium text-gray-900 leading-tight">{t.title}</div>
                    <div className="text-gray-400 text-xs mt-0.5 line-clamp-1">{t.description}</div>
                  </td>
                  <td className="px-4 py-3.5 hidden md:table-cell">
                    <CategoryBadge category={t.category} />
                  </td>
                  <td className="px-4 py-3.5 hidden lg:table-cell">
                    <PriorityBadge priority={t.priority} />
                  </td>
                  <td className="px-4 py-3.5 text-center">
                    <Toggle
                      checked={t.isActive}
                      onChange={() => handleToggle(t)}
                      disabled={toggling === t._id}
                    />
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex items-center justify-center gap-1">
                      <button
                        onClick={() => setEditTemplate(t)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget(t)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-5 py-3 bg-gray-50 border-t border-gray-100 text-xs text-gray-500">
            Showing {filtered.length} of {templates.length} templates
          </div>
        </div>
      )}

      {/* ── Create Modal ─────────────────────────────── */}
      <Modal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        title="Create New Template"
        size="md"
      >
        <TemplateForm
          onSubmit={handleCreate}
          onCancel={() => setShowCreate(false)}
          loading={formLoading}
        />
      </Modal>

      {/* ── Edit Modal ───────────────────────────────── */}
      <Modal
        isOpen={!!editTemplate}
        onClose={() => setEditTemplate(null)}
        title="Edit Template"
        size="md"
      >
        <TemplateForm
          initial={{
            ...editTemplate,
            tags: Array.isArray(editTemplate?.tags)
              ? editTemplate.tags.join(", ")
              : editTemplate?.tags || "",
          }}
          onSubmit={handleEdit}
          onCancel={() => setEditTemplate(null)}
          loading={formLoading}
        />
      </Modal>

      {/* ── Delete Modal ─────────────────────────────── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Delete"
        size="sm"
      >
        <DeleteConfirmDialog
          template={deleteTarget}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
          loading={formLoading}
        />
      </Modal>
    </div>
  );
}
