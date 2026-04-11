import React, { useState, useEffect, useCallback } from "react";
import { FiCheckCircle, FiCircle, FiSearch, FiRefreshCw } from "react-icons/fi";
import { getHouseholdRecommendations, updateRecommendationStatus } from "../../services/recommendationService";
import {
  LoadingSpinner,
  EmptyState,
  ErrorState,
  PageHeader,
  PriorityBadge,
  CategoryBadge,
} from "../../components/ui/SharedComponents";
// Temporarily mapping toast to console since ToastContext is team dependent
const useToast = () => ({
  success: (msg) => console.log("SUCCESS:", msg),
  error: (msg) => console.error("ERROR:", msg),
  info: (msg) => console.info("INFO:", msg),
  warning: (msg) => console.warn("WARNING:", msg)
});
import { useHousehold } from "../../hooks/useHousehold";

// ─────────────────────────────────────────────────────────
// Recommendation Card
// ─────────────────────────────────────────────────────────
function RecommendationCard({ rec, onToggle }) {
  const [applied, setApplied] = useState(rec.status === "applied");

  const handleToggle = () => {
    setApplied((prev) => !prev);
    onToggle(rec._id || rec.id, !applied);
  };

  return (
    <div
      className={`card card-hover group fade-in transition-all duration-300 relative overflow-hidden
        ${applied ? "border-l-4 border-green-400" : "border-l-4 border-transparent"}`}
    >
      {/* Applied ribbon */}
      {applied && (
        <div className="absolute top-3 right-3">
          <span className="badge badge-green text-xs">Applied ✓</span>
        </div>
      )}

      <div className="flex flex-col gap-3">
        {/* Badges */}
        <div className="flex items-center gap-2 flex-wrap">
          <CategoryBadge category={rec.category} />
          <PriorityBadge priority={rec.priority} />
        </div>

        {/* Title */}
        <h3 className="font-bold text-gray-900 text-base leading-snug pr-16">
          {rec.title}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 leading-relaxed">
          {rec.description}
        </p>

        {/* Tags */}
        {Array.isArray(rec.tags) && rec.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {rec.tags.map((tag, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 mt-1">
          {rec.learnMoreUrl ? (
            <a
              href={rec.learnMoreUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 hover:text-blue-700 font-medium transition-colors"
            >
              Learn More →
            </a>
          ) : (
            <span />
          )}

          <button
            onClick={handleToggle}
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200
              ${applied
                ? "bg-green-50 text-green-700 hover:bg-red-50 hover:text-red-600"
                : "bg-gray-100 text-gray-600 hover:bg-green-50 hover:text-green-700"
              }`}
          >
            {applied ? (
              <>
                <FiCheckCircle className="w-3.5 h-3.5" />
                Mark as Not Applied
              </>
            ) : (
              <>
                <FiCircle className="w-3.5 h-3.5" />
                Mark as Applied
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────
export default function UserRecommendations() {
  const toast = useToast();
  const { householdId, loading: householdLoading, error: householdError } = useHousehold();

  const [recommendations, setRecommendations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [appliedStatus, setAppliedStatus] = useState({}); // { id: bool }

  const fetchRecommendations = useCallback(async () => {
    if (!householdId) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await getHouseholdRecommendations(householdId);
      const list = data.templates || data.recommendations || data.data || (Array.isArray(data) ? data : []);
      setRecommendations(list);
      // Init applied status from data
      const initStatus = {};
      list.forEach((r) => {
        initStatus[r._id || r.id] = r.status === "applied";
      });
      setAppliedStatus(initStatus);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load recommendations.");
    } finally {
      setLoading(false);
    }
  }, [householdId]);

  useEffect(() => {
    fetchRecommendations();
  }, [fetchRecommendations]);

  // ── Filter ─────────────────────────────────────────────
  useEffect(() => {
    let list = [...recommendations];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.title?.toLowerCase().includes(q) ||
          r.description?.toLowerCase().includes(q)
      );
    }
    if (filterCategory) {
      list = list.filter(
        (r) => r.category?.toLowerCase() === filterCategory.toLowerCase()
      );
    }
    if (filterPriority) {
      list = list.filter(
        (r) => r.priority?.toLowerCase() === filterPriority.toLowerCase()
      );
    }
    setFiltered(list);
  }, [recommendations, search, filterCategory, filterPriority]);

  // ── Toggle applied status (database persisted) ───────────
  const handleToggle = async (id, value) => {
    // Optimistic update
    setAppliedStatus((prev) => ({ ...prev, [id]: value }));
    try {
      const status = value ? "applied" : "active";
      await updateRecommendationStatus(householdId, id, status);
      toast.success(value ? "Marked as applied! 🎉" : "Marked as not applied.");
    } catch (err) {
      // Revert if API fails
      setAppliedStatus((prev) => ({ ...prev, [id]: !value }));
      toast.error("Failed to save status. Please try again.");
    }
  };

  // Stats
  const appliedCount = Object.values(appliedStatus).filter(Boolean).length;
  const totalCount = recommendations.length;

  const categories = [...new Set(recommendations.map((r) => r.category).filter(Boolean))];
  const priorities = ["low", "medium", "high"];

  // Gate: wait for household lookup
  if (householdLoading) return <LoadingSpinner fullPage text="Loading your household..." />;
  if (householdError || !householdId) return <ErrorState message={householdError || "No household found. Please create one first."} />;

  return (
    <div className="space-y-6 fade-in">
      {/* Page Header */}
      <PageHeader
        title="My Recommendations"
        subtitle="Personalized energy-saving tips for your household"
      >
        <button
          onClick={fetchRecommendations}
          className="btn-secondary"
          disabled={loading}
        >
          <FiRefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </PageHeader>

      {/* Progress Banner */}
      {!loading && totalCount > 0 && (
        <div className="card bg-gradient-to-r from-green-600 to-emerald-500 text-white !py-5">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-green-100 text-sm font-medium mb-1">Your Progress</p>
              <p className="text-3xl font-bold">
                {appliedCount} / {totalCount}
              </p>
              <p className="text-green-100 text-sm mt-0.5">recommendations applied</p>
            </div>
            <div className="flex-1 max-w-xs">
              <div className="flex justify-between text-sm text-green-100 mb-1.5">
                <span>Progress</span>
                <span>{totalCount > 0 ? Math.round((appliedCount / totalCount) * 100) : 0}%</span>
              </div>
              <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-3 bg-white rounded-full transition-all duration-500"
                  style={{
                    width: `${totalCount > 0 ? (appliedCount / totalCount) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="card !py-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              className="input pl-9"
              placeholder="Search recommendations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="input w-40"
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <select
            className="input w-36"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="">All Priorities</option>
            {priorities.map((p) => (
              <option key={p} value={p}>
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <LoadingSpinner fullPage text="Fetching your recommendations..." />
      ) : error ? (
        <ErrorState message={error} onRetry={fetchRecommendations} />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="💡"
          title="No recommendations found"
          description={
            search || filterCategory || filterPriority
              ? "Try adjusting your filters."
              : "No recommendations are available for your household yet."
          }
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
          {filtered.map((rec) => (
            <RecommendationCard
              key={rec._id || rec.id}
              rec={{ ...rec, status: appliedStatus[rec._id || rec.id] ? "applied" : "not_applied" }}
              onToggle={handleToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
