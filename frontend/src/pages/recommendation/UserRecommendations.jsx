import React, { useState, useEffect, useCallback } from "react";
import { FiCheckCircle, FiCircle, FiSearch, FiRefreshCw } from "react-icons/fi";
import {
  getRecommendationHistory,
  updateRecommendationStatus,
} from "../../services/recommendationService";
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
            <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
            {step}
          </li>
        ))}
      </ul>
    </div>
  );
}

// Feedack helpers
const showLocalToast = (msg) => {
  console.log("EnergyMate Feedack:", msg);
};

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
  const { householdId, loading: householdLoading, error: householdError } = useHousehold();

  const [activeTab, setActiveTab] = useState("tips"); // 'tips', 'costs', 'predictions'

  const [history, setHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);

  const fetchHistory = useCallback(async () => {
    if (!householdId) return;
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const typeMap = { tips: "tips", costs: "strategy", predictions: "prediction" };
      const { data } = await getRecommendationHistory(householdId, typeMap[activeTab]);
      setHistory(data.data || []);
    } catch (err) {
      setHistoryError("Failed to load history.");
    } finally {
      setHistoryLoading(false);
    }
  }, [householdId, activeTab]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);
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
          { id: "tips", name: "Energy Tips", icon: <FiZap /> },
          { id: "costs", name: "Cost Plans", icon: <FiTrendingDown /> },
          { id: "predictions", name: "Forecasts", icon: <FiActivity /> },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 whitespace-nowrap
              ${activeTab === tab.id
                ? "bg-white text-emerald-600 shadow-md scale-100"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50 scale-95 opacity-80"
              }`}
          >
            {tab.icon}
            {tab.name}
          </button>
        ))}
      </div>

      {/* History Notification */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-800 text-sm font-medium">
          <FiClock className="w-4 h-4" />
          Archive Viewer: Displaying previously generated insights.
        </div>
        <button
          onClick={fetchHistory}
          className="text-emerald-600 hover:text-emerald-700 text-xs font-bold flex items-center gap-1"
        >
          <FiRefreshCw className={historyLoading ? "animate-spin" : ""} />
          Refresh History
        </button>
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">

        {/* ── TAB: AI TIPS ─────────────────────────────────── */}
        {activeTab === "tips" && (
          <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-300">
            {/* HISTORY */}
            {history.length > 0 ? (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FiClock className="text-slate-400" />
                  Past Tip Generations
                </h2>
                <div className="space-y-6">
                  {history.map((record) => (
                    <div key={record._id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-4 flex items-center gap-1 tracking-wider">
                        <FiDatabase /> Generated {new Date(record.createdAt).toLocaleDateString()} at {new Date(record.createdAt).toLocaleTimeString()}
                      </p>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {(record.tips || []).map((t, idx) => (
                          <div key={idx} className="p-4 bg-slate-50 rounded-xl border border-slate-100 hover:shadow-md transition-shadow">
                            <h4 className="font-bold text-sm text-slate-900 mb-1.5">{t.title}</h4>
                            <p className="text-[12px] text-slate-600 line-clamp-3 leading-relaxed">{t.description}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState icon="⚡" title="No History Found" description="You have no previously recorded Energy Tips." />
            )}
          </div>
        )}

        {/* ── TAB: COST PLANS ──────────────────────────────── */}
        {activeTab === "costs" && (
          <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-300">
            {/* HISTORY */}
            {history.length > 0 ? (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FiClock className="text-slate-400" />
                  Past Cost Strategies
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                  {history.map((record) => (
                    <div key={record._id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm flex flex-col gap-3">
                      <div className="flex justify-between items-start mb-1">
                        <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                          {new Date(record.createdAt).toLocaleDateString()}
                        </p>
                        <span className="text-[10px] px-3 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 rounded-md font-bold uppercase tracking-wide">SAVINGS PLAN</span>
                      </div>
                      <h4 className="font-bold text-[15px] text-slate-900 leading-snug">{(record.strategies?.[0] || record.strategy)?.title}</h4>
                      <p className="text-[13px] text-slate-500 line-clamp-2 leading-relaxed">{(record.strategies?.[0] || record.strategy)?.summary}</p>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState icon="💰" title="No History Found" description="You have no previously recorded Cost Strategies." />
            )}
          </div>
        )}

        {/* ── TAB: FORECASTS ────────────────────────────────── */}
        {activeTab === "predictions" && (
          <div className="space-y-10 animate-in slide-in-from-bottom-2 duration-300">
            {/* HISTORY */}
            {history.length > 0 ? (
              <div className="space-y-4 pt-4 border-t border-slate-100">
                <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                  <FiClock className="text-slate-400" />
                  Past Forecast Records
                </h2>
                <div className="space-y-5">
                  {history.map((record) => (
                    <div key={record._id} className="p-6 bg-white border border-slate-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
                      <div>
                        <p className="text-sm font-bold text-slate-900 mb-1">Forecast Archive - {new Date(record.createdAt).toLocaleDateString()}</p>
                        <p className="text-[11px] text-slate-500 font-bold uppercase tracking-wider">{record.predictionInsights?.length || 0} insights generated</p>
                      </div>
                      <div className="flex -space-x-2">
                        {record.predictionTable?.slice(0, 5).map((p, idx) => (
                          <div key={idx} className="w-10 h-10 rounded-full bg-slate-50 border-2 border-white flex items-center justify-center text-[10px] font-bold text-emerald-600 shadow-sm z-10 hover:z-20 hover:scale-110 transition-transform cursor-default" title={`Predicted: ${p.predictedConsumption} kWh`}>
                            {p.predictedConsumption}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <EmptyState icon="🔮" title="No History Found" description="You have no previously recorded Forecasts." />
            )}
          </div>
        )}
      </div>
    </div>
  );
}