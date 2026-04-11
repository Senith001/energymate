import React, { useState, useEffect, useCallback } from "react";
import { FiCheckCircle, FiCircle, FiSearch, FiRefreshCw } from "react-icons/fi";
import { 
  getHouseholdRecommendations, 
  updateRecommendationStatus,
  generateEnergyTips,
  generateCostStrategies,
  generatePredictions
} from "../../services/recommendationService";
import { useAiGenerate } from "../../hooks/useAiGenerate";
import { useHousehold } from "../../hooks/useHousehold";
import {
  LoadingSpinner,
  EmptyState,
  ErrorState,
  PageHeader,
  PriorityBadge,
  CategoryBadge,
} from "../../components/ui/SharedComponents";
import { 
  FiZap, 
  FiTrendingDown, 
  FiActivity, 
  FiClock, 
  FiDatabase,
  FiTrendingUp,
  FiMinus,
  FiCopy,
  FiCheck,
  FiStar,
} from "react-icons/fi";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ─────────────────────────────────────────────────────────
// Helpers & Sub-components for AI
// ─────────────────────────────────────────────────────────
const PRIORITY_COLORS = {
  High: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400", ring: "ring-red-200" },
  Medium: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-400", ring: "ring-amber-200" },
  Low: { bg: "bg-green-50", text: "text-green-600", dot: "bg-green-400", ring: "ring-green-200" },
};

const CATEGORY_ICONS = {
  lighting: "💡",
  appliances: "🔌",
  cooling: "❄️",
  cooking: "🍳",
  general: "⚡",
};

const TIP_ICONS = ["💡", "⚡", "🌿", "🔌", "🌙", "☀️", "🏠", "💰", "🌊", "♻️"];

function timeAgo(isoStr) {
  if (!isoStr) return "";
  const diffMs = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function TipCard({ tip, index }) {
  const [copied, setCopied] = useState(false);
  const isObj = tip && typeof tip === "object";
  const { title, problem, recommendation, priority, category, learnMore, implementation = [], expectedSavings } = tip;
  
  const handleCopy = () => {
    navigator.clipboard.writeText(`${title} | ${recommendation}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const icon = CATEGORY_ICONS[category?.toLowerCase()] || TIP_ICONS[index % TIP_ICONS.length];
  const pc = PRIORITY_COLORS[priority] || PRIORITY_COLORS.Medium;

  return (
    <div className="card card-hover group fade-in flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200 ${pc.bg}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold mb-1.5 ${pc.bg} ${pc.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
            {priority} Priority
          </span>
          <h3 className="font-bold text-gray-900 text-sm leading-snug">{title}</h3>
        </div>
        <button onClick={handleCopy} className="text-gray-300 hover:text-gray-600">
          {copied ? <FiCheck className="text-green-500" /> : <FiCopy />}
        </button>
      </div>
      <div className="px-3 py-2 bg-red-50 rounded-lg border border-red-100">
        <p className="text-[10px] font-bold text-red-400 uppercase mb-0.5">Problem</p>
        <p className="text-xs text-red-800">{problem}</p>
      </div>
      <div className="px-3 py-2 bg-green-50 rounded-lg border border-green-100">
        <p className="text-[10px] font-bold text-green-500 uppercase mb-0.5">Solution</p>
        <p className="text-xs text-green-900">{recommendation}</p>
      </div>
    </div>
  );
}

const DIFFICULTY_COLORS = {
  Easy: "bg-green-100 text-green-700",
  Medium: "bg-amber-100 text-amber-700",
  Hard: "bg-red-100   text-red-700",
};

function StrategyCard({ strategy }) {
  if (!strategy) return null;
  const { title, summary, details = [], expectedSavings, timeframe, difficulty } = strategy;
  return (
    <div className="card flex flex-col gap-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl">🎯</div>
        <div className="flex-1">
          <h3 className="font-bold text-gray-900 text-base">{title}</h3>
          <div className="flex gap-2 mt-1">
            <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold uppercase ${DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.Medium}`}>
              {difficulty}
            </span>
          </div>
        </div>
      </div>
      <p className="text-sm text-gray-600 leading-relaxed italic border-l-2 border-blue-200 pl-3">{summary}</p>
      <ul className="space-y-2">
        {details.map((step, i) => (
          <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i+1}</span>
            {step}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Temporarily mapping toast to console since ToastContext is team dependent
const useToast = () => ({
  success: (msg) => console.log("SUCCESS:", msg),
  error: (msg) => console.error("ERROR:", msg),
  info: (msg) => console.info("INFO:", msg),
  warning: (msg) => console.warn("WARNING:", msg)
});

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

  const [activeTab, setActiveTab ] = useState("expert"); // 'expert', 'tips', 'costs', 'predictions'

  const [recommendations, setRecommendations] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterPriority, setFilterPriority] = useState("");
  const [appliedStatus, setAppliedStatus] = useState({}); // { id: bool }

  // ── AI Hooks ─────────────────────────────────────────────
  const aiTips = useAiGenerate(generateEnergyTips);
  const aiCosts = useAiGenerate(generateCostStrategies);
  const aiPreds = useAiGenerate(generatePredictions);

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

  // ── Auto-load AI data on switch ────────────────────────
  useEffect(() => {
    if (!householdId) return;
    if (activeTab === "tips" && !aiTips.generated && !aiTips.loading) aiTips.generate(householdId);
    if (activeTab === "costs" && !aiCosts.generated && !aiCosts.loading) aiCosts.generate(householdId);
    if (activeTab === "predictions" && !aiPreds.generated && !aiPreds.loading) aiPreds.generate(householdId);
  }, [activeTab, householdId]);

  // Stats for Expert Advice
  const appliedCount = Object.values(appliedStatus).filter(Boolean).length;
  const totalCount = recommendations.length;
  const categories = [...new Set(recommendations.map((r) => r.category).filter(Boolean))];
  const priorities = ["low", "medium", "high"];

  if (householdLoading) return <LoadingSpinner fullPage text="Loading your household..." />;
  if (householdError || !householdId) return <ErrorState message={householdError || "No household found."} />;

  return (
    <div className="space-y-6 fade-in">
      {/* Page Header */}
      <PageHeader
        title="My Recommendations"
        subtitle="Explore energy-saving insights tailored to your home"
      />

      {/* Tab Switcher */}
      <div className="flex p-1 bg-gray-100 rounded-2xl w-fit max-w-full overflow-x-auto shadow-inner no-scrollbar">
        {[
          { id: "expert", name: "Expert Picks", icon: <FiStar /> },
          { id: "tips", name: "Energy Tips", icon: <FiZap /> },
          { id: "costs", name: "Cost Plans", icon: <FiTrendingDown /> },
          { id: "predictions", name: "Forecasts", icon: <FiActivity /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap
              ${activeTab === tab.id 
                ? "bg-white text-blue-600 shadow-md scale-100" 
                : "text-gray-500 hover:text-gray-700 hover:bg-gray-200/50 scale-95 opacity-80"
              }`}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {/* ── TAB: EXPERT PICKS ────────────────────────────── */}
        {activeTab === "expert" && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            {/* Progress Banner */}
            {!loading && totalCount > 0 && (
              <div className="card bg-gradient-to-r from-blue-600 to-indigo-500 text-white !py-5 shadow-lg relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 text-9xl">🌿</div>
                <div className="relative z-10 flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-blue-100 text-sm font-medium mb-1">Your Progress</p>
                    <p className="text-3xl font-bold">{appliedCount} / {totalCount}</p>
                    <p className="text-blue-100 text-sm mt-0.5">expert tips implemented</p>
                  </div>
                  <div className="flex-1 max-w-xs">
                    <div className="flex justify-between text-sm text-blue-100 mb-1.5">
                      <span>Completion</span>
                      <span>{totalCount > 0 ? Math.round((appliedCount / totalCount) * 100) : 0}%</span>
                    </div>
                    <div className="h-3 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-3 bg-white rounded-full transition-all duration-700"
                        style={{ width: `${totalCount > 0 ? (appliedCount / totalCount) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="card !py-4 shadow-sm border border-gray-100">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                  <input
                    className="input pl-9"
                    placeholder="Search titles or labels..."
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
                  {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {loading ? (
              <LoadingSpinner fullPage text="Updating list..." />
            ) : filtered.length === 0 ? (
              <EmptyState icon="💡" title="Not found" description="Try a different search or filter." />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
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
        )}

        {/* ── TAB: AI TIPS ─────────────────────────────────── */}
        {activeTab === "tips" && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            {aiTips.loading ? (
              <LoadingSpinner fullPage text="Gemini is analyzing energy spikes..." />
            ) : aiTips.error ? (
              <ErrorState message={aiTips.error} onRetry={() => aiTips.generate(householdId)} />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {(Array.isArray(aiTips.data?.tips) ? aiTips.data.tips : aiTips.data || []).map((tip, i) => (
                  <TipCard key={i} tip={tip} index={i} />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── TAB: COST PLANS ──────────────────────────────── */}
        {activeTab === "costs" && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            {aiCosts.loading ? (
              <LoadingSpinner fullPage text="Calculating potential savings..." />
            ) : aiCosts.error ? (
              <ErrorState message={aiCosts.error} onRetry={() => aiCosts.generate(householdId)} />
            ) : (
              <div className="max-w-3xl mx-auto">
                <StrategyCard strategy={aiCosts.data?.strategy || aiCosts.data} />
              </div>
            )}
          </div>
        )}

        {/* ── TAB: FORECASTS ────────────────────────────────── */}
        {activeTab === "predictions" && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            {aiPreds.loading ? (
              <LoadingSpinner fullPage text="Simulating upcoming months..." />
            ) : aiPreds.error ? (
              <ErrorState message={aiPreds.error} onRetry={() => aiPreds.generate(householdId)} />
            ) : (
              <div className="card space-y-4">
                <p className="text-sm text-gray-600 leading-relaxed italic pr-4 border-l-4 border-purple-200 pl-3">
                  {aiPreds.data?.summary || aiPreds.data?.prediction?.summary || "AI-powered usage forecast based on historic data."}
                </p>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                  {(aiPreds.data?.predictionTable || aiPreds.data?.prediction?.predictionTable || []).slice(0, 6).map((p, i) => (
                    <div key={i} className="p-3 bg-gray-50 rounded-xl text-center border border-gray-100">
                      <p className="text-[10px] text-gray-400 font-bold uppercase">{MONTH_NAMES[(p.month - 1) % 12]}</p>
                      <p className="text-lg font-mono font-bold text-gray-800">{p.predictedConsumption}<span className="text-[10px] ml-0.5">kWh</span></p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

