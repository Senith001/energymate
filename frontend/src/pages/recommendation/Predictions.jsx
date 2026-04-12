import React from "react";
import {
  FiActivity, FiRefreshCw, FiTrendingUp, FiTrendingDown, FiMinus, FiClock, FiDatabase,
} from "react-icons/fi";
import { generatePredictions } from "../../services/recommendationService";
import {
  LoadingSpinner,
  EmptyState,
  ErrorState,
  PageHeader,
} from "../../components/ui/SharedComponents";
import { useHousehold } from "../../hooks/useHousehold";
import { useAiGenerate } from "../../hooks/useAiGenerate";

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
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

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// ─────────────────────────────────────────────────────────
// Trend Icon
// ─────────────────────────────────────────────────────────
function TrendIcon({ value, prev }) {
  if (prev == null || value == null) return <FiMinus className="w-4 h-4 text-gray-400" />;
  if (value > prev) return <FiTrendingUp className="w-4 h-4 text-red-500" />;
  if (value < prev) return <FiTrendingDown className="w-4 h-4 text-green-500" />;
  return <FiMinus className="w-4 h-4 text-gray-400" />;
}

// ─────────────────────────────────────────────────────────
// Mini Bar Chart
// ─────────────────────────────────────────────────────────
function MiniBarChart({ data }) {
  if (!data?.length) return null;
  const values = data.map((d) => d.predictedConsumption || 0);
  const max = Math.max(...values, 1);
  return (
    <div className="flex items-end gap-1 h-16">
      {values.map((v, i) => (
        <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${MONTH_NAMES[(data[i].month - 1) % 12]}: ${v} kWh`}>
          <div
            className="w-full rounded-t-sm bg-gradient-to-t from-blue-600 to-blue-400 min-h-[4px] transition-all duration-500"
            style={{ height: `${(v / max) * 100}%` }}
          />
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Predictions Table
// ─────────────────────────────────────────────────────────
function PredictionsTable({ rows }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead>
          <tr className="bg-gray-50 border-b border-gray-100">
            <th className="text-left px-4 py-3 font-semibold text-gray-600">Month</th>
            <th className="text-right px-4 py-3 font-semibold text-gray-600">Predicted (kWh)</th>
            <th className="text-center px-4 py-3 font-semibold text-gray-600">Trend</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-50">
          {rows.map((row, i) => {
            const prev = i > 0 ? rows[i - 1].predictedConsumption : null;
            const usage = row.predictedConsumption;
            const isUp = prev != null && usage > prev;
            const isDown = prev != null && usage < prev;
            return (
              <tr key={i} className="hover:bg-slate-50 transition-colors fade-in" style={{ animationDelay: `${i * 30}ms` }}>
                <td className="px-4 py-3.5">
                  <span className="font-semibold text-gray-900">
                    {MONTH_NAMES[(row.month - 1) % 12]} {row.year}
                  </span>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className={`font-mono font-semibold ${isUp ? "text-red-600" : isDown ? "text-green-600" : "text-gray-800"}`}>
                    {usage}
                  </span>
                </td>
                <td className="px-4 py-3.5 flex justify-center">
                  <TrendIcon value={usage} prev={prev} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Insight Card
// ─────────────────────────────────────────────────────────
function InsightCard({ insight, index }) {
  const ICONS = ["🔮", "📊", "⚡", "💡", "🌱", "🏆"];
  const title = typeof insight === "object" ? insight.title : null;
  const text = typeof insight === "string" ? insight
    : insight?.description || insight?.text || insight?.insight || null;
  if (!title && !text) return null;
  return (
    <div className="flex items-start gap-4 p-5 rounded-2xl bg-white border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] fade-in flex-col md:flex-row" style={{ animationDelay: `${index * 60}ms` }}>
      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-xl flex-shrink-0 transition-transform duration-200 hover:scale-105">
        {ICONS[index % ICONS.length]}
      </div>
      <div className="flex-1">
        {title && <h3 className="font-bold text-slate-900 text-[13px] mb-1 leading-snug">{title}</h3>}
        {text && <p className="text-[13px] text-slate-600 font-medium leading-relaxed">{text}</p>}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────
export default function Predictions() {
  const { householdId, loading: hhLoading, error: hhError } = useHousehold();

  const {
    data: rawData, loading, error, generated,
    generatedAt, fromCache, cooldown, generate, setData, setError
  } = useAiGenerate(generatePredictions);

  const handleSeedData = async () => {
    try {
      setData(null);
      setError(null);
      const token = localStorage.getItem("token");
      const headers = { Authorization: `Bearer ${token}`, "Content-Type": "application/json" };

      const bills = [
        { month: 1, year: 2025, totalUnits: 185 },
        { month: 2, year: 2025, totalUnits: 210 },
        { month: 3, year: 2025, totalUnits: 195 }
      ];

      for (const b of bills) {
        await fetch(`http://localhost:5001/api/bills`, {
          method: "POST",
          headers,
          body: JSON.stringify({ householdId, ...b })
        });
      }

      // Auto-trigger prediction generating after seeding
      generate(householdId);
    } catch (err) {
      setError("Failed to seed data.");
    }
  };

  // Normalise: response.data → { prediction: { predictionTable, insights, summary } }
  const predObj = rawData?.prediction || rawData?.data?.prediction || rawData || {};
  const rows = Array.isArray(predObj?.predictionTable) ? predObj.predictionTable : [];
  const insights = Array.isArray(predObj?.insights) ? predObj.insights : [];
  const summary = typeof predObj?.summary === "string" ? predObj.summary : null;

  if (hhLoading) return <LoadingSpinner fullPage text="Loading your household..." />;
  if (hhError || !householdId) return <ErrorState message={hhError || "No household found."} />;

  const handleGenerate = () => generate(householdId);

  // Quick stats
  const usages = rows.map((r) => r.predictedConsumption);
  const avgUsage = usages.length ? Math.round(usages.reduce((a, b) => a + b, 0) / usages.length) : null;
  const peakUsage = usages.length ? Math.max(...usages) : null;
  const lowUsage = usages.length ? Math.min(...usages) : null;

  return (
    <div className="space-y-6 fade-in">
      <PageHeader title="Energy Predictions" subtitle="AI-powered monthly energy usage and cost forecasting" />

      {/* Hero CTA */}
      <div className="bg-white rounded-[32px] p-8 md:p-12 border border-slate-200 shadow-[0_8px_30px_rgba(0,0,0,0.04)] relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-10">
        <div className="absolute inset-0 opacity-[0.03]">
          <div className="absolute -top-10 -right-10 w-96 h-96 bg-emerald-500 rounded-full blur-3xl" />
        </div>
        
        <div className="relative z-10 flex flex-col items-start max-w-xl">
          <div className="flex items-center gap-2 mb-6 px-3 py-1.5 bg-emerald-50 border border-emerald-100 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-emerald-700 text-[11px] font-bold uppercase tracking-widest">Smart AI Engine</p>
          </div>
          
          <h2 className="text-4xl md:text-4xl font-black mb-4 text-slate-900 tracking-tight leading-tight">
            Monthly <span className="text-emerald-600">Forecasting & Insights</span>
          </h2>
          <p className="text-slate-500 text-base leading-relaxed font-medium mb-8">
            Predict your upcoming energy consumption with incredible precision using machine learning models trained on your household's exact billing history.
          </p>
          
          <button
            onClick={handleGenerate}
            disabled={loading || cooldown > 0}
            id="btn-generate-predictions"
            className="flex-shrink-0 inline-flex items-center gap-3 bg-emerald-600 text-white font-bold px-7 py-3.5 rounded-xl
              hover:bg-emerald-700 transition-all duration-200 shadow-md shadow-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed
              hover:scale-[1.02] active:scale-[0.98]"
          >
            {loading ? (
              <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />Predicting...</>
            ) : cooldown > 0 ? (
              <><FiClock className="w-5 h-5" />Wait {cooldown}s</>
            ) : (
              <><FiActivity className="w-5 h-5" />{generated ? "Regenerate" : "Generate Predictions"}</>
            )}
          </button>
        </div>

        <div className="relative z-10 hidden md:flex items-center justify-center w-64 h-64 flex-shrink-0 animate-[bounce_4s_ease-in-out_infinite]">
          <img src="/assets/hero_predictions.png" alt="Energy Usage Predictions Concept" className="w-full h-full object-contain drop-shadow-[0_20px_30px_rgba(16,185,129,0.15)]" />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl mb-4 animate-pulse">🔮</div>
          <LoadingSpinner size="md" />
          <p className="text-slate-700 font-bold mt-5">Analyzing historical data and forecasting...</p>
          <p className="text-slate-400 text-sm mt-1.5 font-medium">This may take a few seconds</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && <ErrorState message={error} onRetry={cooldown === 0 ? handleGenerate : undefined} />}

      {/* AI Summary */}
      {!loading && !error && summary && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
          <p className="font-bold text-slate-900 mb-2">📋 AI Forecast Summary</p>
          <p className="text-[13px] text-slate-600 leading-relaxed font-medium">{summary}</p>
        </div>
      )}

      {/* Results */}
      {!loading && !error && rows.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Table */}
            <div className="lg:col-span-2 card">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-center">
                    <FiActivity className="w-6 h-6 text-slate-700" />
                  </div>
                  <div>
                    <p className="font-bold text-slate-900 text-base">Monthly Predictions</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <span>{rows.length} months forecasted</span>
                      {generatedAt && <span className="flex items-center gap-1"><FiClock className="w-3 h-3" />{timeAgo(generatedAt)}</span>}
                      {fromCache && <span className="flex items-center gap-1 text-blue-500"><FiDatabase className="w-3 h-3" />Cached</span>}
                    </div>
                  </div>
                </div>
                <button onClick={handleGenerate} disabled={loading || cooldown > 0} className="btn-secondary text-sm disabled:opacity-50">
                  <FiRefreshCw className="w-3.5 h-3.5" />
                  {cooldown > 0 ? `Refresh in ${cooldown}s` : "Refresh"}
                </button>
              </div>
              <PredictionsTable rows={rows} />
            </div>

            {/* Sidebar */}
            <div className="space-y-4">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)]">
                <p className="font-bold text-[13px] text-slate-900 mb-1">Usage Trend</p>
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-5">Predicted kWh per month</p>
                <MiniBarChart data={rows} />
                <div className="flex justify-between text-[10px] uppercase font-bold text-slate-400 mt-3">
                  {rows.slice(0, 4).map((r, i) => (
                    <span key={i}>{MONTH_NAMES[(r.month - 1) % 12]}</span>
                  ))}
                </div>
              </div>

              {/* Quick stats */}
              <div className="card border border-gray-100">
                <p className="font-semibold text-sm text-gray-800 mb-3">Quick Stats</p>
                <div className="space-y-3">
                  {avgUsage != null && <div className="flex justify-between text-sm"><span className="text-gray-500">Avg Monthly</span><span className="font-semibold text-gray-900">{avgUsage} kWh</span></div>}
                  {peakUsage != null && <div className="flex justify-between text-sm"><span className="text-gray-500">Peak Month</span><span className="font-semibold text-red-600">{peakUsage} kWh</span></div>}
                  {lowUsage != null && <div className="flex justify-between text-sm"><span className="text-gray-500">Lowest Month</span><span className="font-semibold text-green-600">{lowUsage} kWh</span></div>}
                </div>
              </div>
            </div>
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
                <span className="w-7 h-7 bg-purple-100 rounded-lg flex items-center justify-center text-sm">🔮</span>
                AI Insights
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {insights.map((ins, i) => <InsightCard key={i} insight={ins} index={i} />)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Empty */}
      {!loading && !error && rows.length === 0 && (
        <EmptyState
          icon="🔮"
          title={generated ? "No predictions returned" : "Ready to see the future?"}
          description={generated ? "The AI didn't return prediction data." : 'Click "Generate Predictions" to forecast your upcoming energy usage. If you get an error that you need usage data, click Seed Test Data below.'}
          action={
            <div className="flex gap-4 items-center">
              <button onClick={handleGenerate} disabled={cooldown > 0} className="btn-primary disabled:opacity-50">
                <FiActivity className="w-4 h-4" />
                {cooldown > 0 ? `Try again in ${cooldown}s` : (generated ? "Try Again" : "Generate Predictions")}
              </button>

              {!generated && (
                <button onClick={handleSeedData} className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm">
                  Seed Test Data
                </button>
              )}
            </div>
          }
        />
      )}
    </div>
  );
}
