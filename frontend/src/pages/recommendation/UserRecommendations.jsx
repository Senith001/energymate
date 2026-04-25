// src/pages/user/UserRecommendations.jsx
import React, { useState, useEffect, useCallback } from "react";
import {
  FiZap, FiTrendingDown, FiActivity, FiClock, FiDatabase,
  FiRefreshCw, FiCopy, FiCheck, FiChevronDown, FiChevronUp,
  FiAlertCircle, FiCheckCircle, FiTarget, FiDollarSign,
} from "react-icons/fi";
import {
  getRecommendationHistory,
} from "../../services/recommendationService";
import { useHousehold } from "../../hooks/useHousehold";
import {
  LoadingSpinner, EmptyState, ErrorState, PageHeader,
} from "../../components/ui/SharedComponents";

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/* ═══════════════════════════════════════════════════════╗
   HELPERS
╚══════════════════════════════════════════════════════ */
const PRIORITY_STYLES = {
  High: { bg: "bg-red-50", text: "text-red-600", dot: "bg-red-400", border: "border-red-100" },
  Medium: { bg: "bg-amber-50", text: "text-amber-600", dot: "bg-amber-400", border: "border-amber-100" },
  Low: { bg: "bg-green-50", text: "text-green-600", dot: "bg-green-400", border: "border-green-100" },
};
const CATEGORY_ICONS = { lighting: "💡", appliances: "🔌", cooling: "❄️", cooking: "🍳", general: "⚡" };
const DIFFICULTY_STYLES = {
  Easy: "bg-green-100 text-green-700",
  Medium: "bg-amber-100 text-amber-700",
  Hard: "bg-red-100 text-red-700",
};

function timeAgo(iso) {
  if (!iso) return "";
  const m = Math.floor((Date.now() - new Date(iso)) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

/* ═══════════════════════════════════════════════════════╗
   TIP DETAIL CARD
╚══════════════════════════════════════════════════════ */
function TipDetailCard({ tip, index }) {
  const [copied, setCopied] = useState(false);
  const [open, setOpen] = useState(false);

  const { title, description, problem, recommendation, priority, category,
    learnMore, implementation = [], expectedSavings } = tip;

  // Support both DB format (description) and live format (recommendation)
  const mainText = recommendation || description || "";
  const issueText = problem || "";
  const steps = implementation.length > 0 ? implementation : [];
  const pc = PRIORITY_STYLES[priority] || PRIORITY_STYLES.Medium;
  const icon = CATEGORY_ICONS[category?.toLowerCase()] || "⚡";

  const handleCopy = () => {
    navigator.clipboard.writeText(`${title} — ${mainText}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`bg-white rounded-2xl border ${open ? "border-emerald-200 shadow-md" : "border-slate-200"} overflow-hidden transition-all duration-200`}>
      {/* Header — always visible */}
      <div
        className="flex items-start gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors"
        onClick={() => setOpen(o => !o)}
      >
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ${pc.bg}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            {priority && (
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold ${pc.bg} ${pc.text}`}>
                <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
                {priority} Priority
              </span>
            )}
            {category && (
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{category}</span>
            )}
          </div>
          <h4 className="font-bold text-slate-900 text-sm leading-snug">{title}</h4>
          {!open && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{mainText}</p>}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0 ml-2">
          <button onClick={e => { e.stopPropagation(); handleCopy(); }} className="text-slate-300 hover:text-slate-600 transition-colors p-1">
            {copied ? <FiCheck className="w-3.5 h-3.5 text-emerald-500" /> : <FiCopy className="w-3.5 h-3.5" />}
          </button>
          {open ? <FiChevronUp className="w-4 h-4 text-slate-400" /> : <FiChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Expanded details */}
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          {/* Problem */}
          {issueText && (
            <div className="px-3 py-2.5 bg-red-50 rounded-xl border border-red-100">
              <p className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-1 flex items-center gap-1">
                <FiAlertCircle className="w-3 h-3" /> Issue Detected
              </p>
              <p className="text-xs text-red-800 font-medium leading-relaxed">{issueText}</p>
            </div>
          )}

          {/* Recommendation */}
          {mainText && (
            <div className="px-3 py-2.5 bg-emerald-50 rounded-xl border border-emerald-100">
              <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider mb-1 flex items-center gap-1">
                <FiCheckCircle className="w-3 h-3" /> AI Recommendation
              </p>
              <p className="text-xs text-emerald-900 font-medium leading-relaxed">{mainText}</p>
            </div>
          )}

          {/* Action steps */}
          {steps.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Action Plan</p>
              <ul className="space-y-1.5">
                {steps.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                    <span className="w-4 h-4 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Savings + learn more */}
          {(expectedSavings || learnMore) && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
              <div className="flex gap-2 flex-wrap">
                {expectedSavings?.unitsPerMonth != null && (
                  <span className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-bold">
                    🎯 {expectedSavings.unitsPerMonth} kWh/mo
                  </span>
                )}
                {expectedSavings?.costLKR != null && (
                  <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg font-bold">
                    ✨ LKR {expectedSavings.costLKR}/mo
                  </span>
                )}
              </div>
              {learnMore && (
                <a href={learnMore} target="_blank" rel="noopener noreferrer"
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 transition-colors">
                  Learn Details →
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════╗
   STRATEGY DETAIL CARD
╚══════════════════════════════════════════════════════ */
function StrategyDetailCard({ record }) {
  const [open, setOpen] = useState(false);
  // Support both nested strategies array and flat strategy object
  const s = record.strategies?.[0] || record.strategy || {};
  const { title, summary, details = [], expectedSavings, timeframe, difficulty, priority, learnMore } = s;

  if (!title && !summary) return null;

  return (
    <div className={`bg-white rounded-2xl border ${open ? "border-emerald-200 shadow-md" : "border-slate-200"} overflow-hidden transition-all duration-200`}>
      {/* Header */}
      <div className="flex items-start gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setOpen(o => !o)}>
        <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl flex-shrink-0">💰</div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">
              {new Date(record.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            {difficulty && (
              <span className={`text-[10px] px-2 py-0.5 rounded-lg font-bold ${DIFFICULTY_STYLES[difficulty] || DIFFICULTY_STYLES.Medium}`}>
                {difficulty}
              </span>
            )}
            {timeframe && (
              <span className="text-[10px] px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 font-bold">
                🕐 {timeframe}
              </span>
            )}
          </div>
          <h4 className="font-bold text-slate-900 text-sm leading-snug">{title}</h4>
          {!open && <p className="text-xs text-slate-500 mt-1 line-clamp-1">{summary}</p>}
        </div>
        <div className="flex-shrink-0 ml-2">
          {open ? <FiChevronUp className="w-4 h-4 text-slate-400" /> : <FiChevronDown className="w-4 h-4 text-slate-400" />}
        </div>
      </div>

      {/* Expanded */}
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-slate-100 pt-3">
          {/* Summary */}
          {summary && (
            <div className="px-3 py-2.5 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Strategy Overview</p>
              <p className="text-xs text-slate-700 font-medium leading-relaxed">{summary}</p>
            </div>
          )}

          {/* Action steps */}
          {details.length > 0 && (
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Action Steps</p>
              <ul className="space-y-1.5">
                {details.map((step, i) => (
                  <li key={i} className="flex items-start gap-2 text-xs text-slate-600">
                    <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center text-[9px] font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                    {step}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Savings */}
          {(expectedSavings || learnMore) && (
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 flex-wrap gap-2">
              <div className="flex gap-2 flex-wrap">
                {expectedSavings?.unitsPerMonth != null && (
                  <span className="text-[11px] bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg font-bold">
                    🎯 {expectedSavings.unitsPerMonth} kWh/mo
                  </span>
                )}
                {expectedSavings?.costLKR != null && (
                  <span className="text-[11px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-lg font-bold">
                    ✨ LKR {expectedSavings.costLKR}/mo
                  </span>
                )}
              </div>
              {learnMore && (
                <a href={learnMore} target="_blank" rel="noopener noreferrer"
                  className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700">
                  Learn Details →
                </a>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════╗
   PREDICTION ROW
╚══════════════════════════════════════════════════════ */
function PredictionRecord({ record }) {
  const [open, setOpen] = useState(false);
  const table = record.predictionTable || [];
  const insights = record.predictionInsights || [];

  return (
    <div className={`bg-white rounded-2xl border ${open ? "border-emerald-200 shadow-md" : "border-slate-200"} overflow-hidden transition-all duration-200`}>
      {/* Header */}
      <div className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-50 transition-colors" onClick={() => setOpen(o => !o)}>
        <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-xl flex-shrink-0">🔮</div>
        <div className="flex-1">
          <h4 className="font-bold text-slate-900 text-sm">
            Forecast — {new Date(record.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
          </h4>
          <p className="text-xs text-slate-500 mt-0.5">
            {table.length} months predicted · {insights.length} insights
          </p>
        </div>
        {/* Quick peek — first 3 months */}
        <div className="hidden sm:flex gap-2 mr-3">
          {table.slice(0, 3).map((p, i) => {
            const monthStr = typeof p.month === "string"
              ? p.month
              : `${p.year || ""}-${String(p.month || "").padStart(2, "0")}`;
            const parts = monthStr.split("-");
            const mIdx = parseInt(parts[1] || p.month) - 1;
            const yr = parts[0] || p.year;
            return (
              <div key={i} className="text-center px-2 py-1 bg-slate-50 rounded-lg border border-slate-100">
                <p className="text-[9px] font-bold text-slate-400 uppercase">{MONTH_NAMES[mIdx] || "—"}</p>
                <p className="text-[11px] font-bold text-emerald-600">{p.predictedConsumption} kWh</p>
              </div>
            );
          })}
        </div>
        {open ? <FiChevronUp className="w-4 h-4 text-slate-400 flex-shrink-0" /> : <FiChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />}
      </div>

      {/* Expanded — full table */}
      {open && (
        <div className="border-t border-slate-100">
          {/* Table */}
          {table.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="text-left px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Month</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Predicted (kWh)</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-slate-500 uppercase tracking-wide">Est. Cost (LKR)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                  {table.map((p, i) => {
                    // Handle both "YYYY-MM" string format and {year, month} object format
                    let mIdx, yr;
                    if (typeof p.month === "string" && p.month.includes("-")) {
                      const parts = p.month.split("-");
                      yr = parts[0];
                      mIdx = parseInt(parts[1]) - 1;
                    } else {
                      mIdx = (parseInt(p.month) || 1) - 1;
                      yr = p.year || "";
                    }
                    const cost = p.predictedCostLKR;
                    return (
                      <tr key={i} className="hover:bg-slate-50 transition-colors">
                        <td className="px-4 py-3 font-semibold text-slate-800 text-sm">
                          {MONTH_NAMES[mIdx] || "—"} {yr}
                        </td>
                        <td className="px-4 py-3 text-right font-mono font-bold text-emerald-600 text-sm">
                          {p.predictedConsumption}
                        </td>
                        <td className="px-4 py-3 text-right font-mono text-slate-700 text-sm font-semibold">
                          {cost != null && cost > 0
                            ? `LKR ${Number(cost).toLocaleString()}`
                            : <span className="text-slate-300">—</span>
                          }
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Insights */}
          {insights.length > 0 && (
            <div className="p-4 border-t border-slate-100">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-3">AI Insights</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insights.map((ins, i) => (
                  <div key={i} className="flex items-start gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-100">
                    <span className="text-base flex-shrink-0">{"🔮📊⚡💡".split("")[i] || "💡"}</span>
                    <div>
                      {ins.title && <p className="text-xs font-bold text-slate-800 mb-0.5">{ins.title}</p>}
                      {ins.description && <p className="text-[11px] text-slate-500 leading-relaxed">{ins.description}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════╗
   MAIN PAGE
╚══════════════════════════════════════════════════════ */
export default function UserRecommendations() {
  const { householdId, loading: hhLoading, error: hhError } = useHousehold();
  const [activeTab, setActiveTab] = useState("tips");
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
    } catch {
      setHistoryError("Failed to load history.");
    } finally {
      setHistoryLoading(false);
    }
  }, [householdId, activeTab]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  if (hhLoading) return <LoadingSpinner fullPage text="Loading your household..." />;
  if (hhError || !householdId) return <ErrorState message={hhError || "No household found."} />;

  const TABS = [
    { id: "tips", label: "Energy Tips", icon: <FiZap /> },
    { id: "costs", label: "Cost Plans", icon: <FiTrendingDown /> },
    { id: "predictions", label: "Forecasts", icon: <FiActivity /> },
  ];

  return (
    <div className="space-y-6 fade-in">
      <PageHeader title="My Recommendations" subtitle="Explore energy-saving insights tailored to your home" />

      {/* Tab switcher */}
      <div className="flex p-1 bg-slate-100 rounded-2xl w-fit overflow-x-auto shadow-inner">
        {TABS.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200 whitespace-nowrap
              ${activeTab === tab.id ? "bg-white text-emerald-600 shadow-md" : "text-slate-500 hover:text-slate-700"}`}>
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      {/* Archive banner */}
      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-800 text-sm font-medium">
          <FiClock className="w-4 h-4" />
          Archive Viewer — previously generated insights
        </div>
        <button onClick={fetchHistory} className="text-emerald-600 hover:text-emerald-700 text-xs font-bold flex items-center gap-1">
          <FiRefreshCw className={historyLoading ? "animate-spin" : ""} /> Refresh
        </button>
      </div>

      {/* Content */}
      <div className="min-h-[400px]">

        {historyLoading && <LoadingSpinner text="Loading history..." />}
        {historyError && <ErrorState message={historyError} onRetry={fetchHistory} />}

        {!historyLoading && !historyError && (

          /* ── TIPS ─────────────────────────────────── */
          activeTab === "tips" ? (
            history.length === 0
              ? <EmptyState icon="⚡" title="No Tip History" description="Generate your first energy tips from the AI Energy Tips tab." />
              : (
                <div className="space-y-6">
                  {history.map(record => (
                    <div key={record._id} className="space-y-3">
                      {/* Record header */}
                      <div className="flex items-center gap-2 px-1">
                        <FiDatabase className="w-3.5 h-3.5 text-slate-400" />
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                          Generated {new Date(record.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} at {new Date(record.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <span className="text-xs text-slate-300">· {record.tips?.length || 0} tips</span>
                      </div>
                      {/* Tip cards */}
                      <div className="space-y-2">
                        {(record.tips || []).map((tip, idx) => (
                          <TipDetailCard key={idx} tip={tip} index={idx} />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )

            /* ── COST PLANS ───────────────────────────── */
          ) : activeTab === "costs" ? (
            history.length === 0
              ? <EmptyState icon="💰" title="No Strategy History" description="Generate your first cost strategy from the Cost Strategies tab." />
              : (
                <div className="space-y-3">
                  {history.map(record => (
                    <StrategyDetailCard key={record._id} record={record} />
                  ))}
                </div>
              )

            /* ── PREDICTIONS ──────────────────────────── */
          ) : (
            history.length === 0
              ? <EmptyState icon="🔮" title="No Forecast History" description="Generate your first energy forecast from the Predictions tab." />
              : (
                <div className="space-y-3">
                  {history.map(record => (
                    <PredictionRecord key={record._id} record={record} />
                  ))}
                </div>
              )
          )
        )}
      </div>
    </div>
  );
}