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
import { useHousehold }  from "../../hooks/useHousehold";
import { useAiGenerate } from "../../hooks/useAiGenerate";

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function timeAgo(isoStr) {
  if (!isoStr) return "";
  const diffMs = Date.now() - new Date(isoStr).getTime();
  const mins   = Math.floor(diffMs / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

const MONTH_NAMES = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

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
  const max    = Math.max(...values, 1);
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
            const prev  = i > 0 ? rows[i - 1].predictedConsumption : null;
            const usage = row.predictedConsumption;
            const isUp  = prev != null && usage > prev;
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
  const title = typeof insight === "object" ? insight.title       : null;
  const text  = typeof insight === "string" ? insight
              : insight?.description || insight?.text || insight?.insight || null;
  if (!title && !text) return null;
  return (
    <div className="flex items-start gap-3 p-4 rounded-xl bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100 fade-in" style={{ animationDelay: `${index * 60}ms` }}>
      <span className="text-xl flex-shrink-0">{ICONS[index % ICONS.length]}</span>
      <div>
        {title && <p className="font-semibold text-sm text-gray-900 mb-0.5">{title}</p>}
        {text  && <p className="text-sm text-gray-700 leading-relaxed">{text}</p>}
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
  const rows     = Array.isArray(predObj?.predictionTable) ? predObj.predictionTable : [];
  const insights = Array.isArray(predObj?.insights)        ? predObj.insights        : [];
  const summary  = typeof predObj?.summary === "string"    ? predObj.summary         : null;

  if (hhLoading) return <LoadingSpinner fullPage text="Loading your household..." />;
  if (hhError || !householdId) return <ErrorState message={hhError || "No household found."} />;

  const handleGenerate = () => generate(householdId);

  // Quick stats
  const usages = rows.map((r) => r.predictedConsumption);
  const avgUsage  = usages.length ? Math.round(usages.reduce((a, b) => a + b, 0) / usages.length) : null;
  const peakUsage = usages.length ? Math.max(...usages) : null;
  const lowUsage  = usages.length ? Math.min(...usages) : null;

  return (
    <div className="space-y-6 fade-in">
      <PageHeader title="Energy Predictions" subtitle="AI-powered monthly energy usage and cost forecasting" />

      {/* Hero */}
      <div className="card bg-gradient-to-br from-violet-700 via-purple-700 to-fuchsia-700 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-8 -right-8 w-52 h-52 bg-white rounded-full" />
          <div className="absolute -bottom-12 -left-8 w-60 h-60 bg-white rounded-full" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">🔮</div>
              <div>
                <p className="text-purple-200 text-sm font-medium">Powered by</p>
                <p className="font-bold text-lg">Google Gemini AI</p>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Monthly Forecasting &amp; Insights</h2>
            <p className="text-purple-100 text-sm max-w-lg leading-relaxed">
              Predict your upcoming energy consumption using machine learning trained on your household's billing history.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading || cooldown > 0}
            id="btn-generate-predictions"
            className="flex-shrink-0 inline-flex items-center gap-3 bg-white text-purple-700 font-bold px-6 py-3.5 rounded-xl
              hover:bg-purple-50 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed
              hover:scale-105 active:scale-95"
          >
            {loading ? (
              <><span className="w-5 h-5 border-2 border-purple-200 border-t-purple-600 rounded-full animate-spin" />Predicting...</>
            ) : cooldown > 0 ? (
              <><FiClock className="w-5 h-5" />Wait {cooldown}s</>
            ) : (
              <><FiActivity className="w-5 h-5" />{generated ? "Regenerate" : "Generate Predictions"}</>
            )}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card">
          <div className="flex flex-col items-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-purple-50 flex items-center justify-center text-3xl mb-4 animate-pulse">🔮</div>
            <LoadingSpinner size="md" />
            <p className="text-gray-600 font-medium mt-4">Analyzing historical data and forecasting...</p>
            <p className="text-gray-400 text-sm mt-1">This may take a few seconds</p>
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && <ErrorState message={error} onRetry={cooldown === 0 ? handleGenerate : undefined} />}

      {/* AI Summary */}
      {!loading && !error && summary && (
        <div className="card bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-100">
          <p className="font-semibold text-gray-900 mb-1">📋 AI Forecast Summary</p>
          <p className="text-sm text-gray-700 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Results */}
      {!loading && !error && rows.length > 0 && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Table */}
            <div className="lg:col-span-2 card">
              <div className="flex items-center justify-between mb-5 flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-purple-50 rounded-xl flex items-center justify-center">
                    <FiActivity className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Monthly Predictions</p>
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
              <div className="card bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100">
                <p className="font-semibold text-sm text-gray-800 mb-1">Usage Trend</p>
                <p className="text-xs text-gray-500 mb-4">Predicted kWh per month</p>
                <MiniBarChart data={rows} />
                <div className="flex justify-between text-xs text-gray-400 mt-2">
                  {rows.slice(0, 4).map((r, i) => (
                    <span key={i}>{MONTH_NAMES[(r.month - 1) % 12]}</span>
                  ))}
                </div>
              </div>

              {/* Quick stats */}
              <div className="card border border-gray-100">
                <p className="font-semibold text-sm text-gray-800 mb-3">Quick Stats</p>
                <div className="space-y-3">
                  {avgUsage  != null && <div className="flex justify-between text-sm"><span className="text-gray-500">Avg Monthly</span><span className="font-semibold text-gray-900">{avgUsage} kWh</span></div>}
                  {peakUsage != null && <div className="flex justify-between text-sm"><span className="text-gray-500">Peak Month</span><span className="font-semibold text-red-600">{peakUsage} kWh</span></div>}
                  {lowUsage  != null && <div className="flex justify-between text-sm"><span className="text-gray-500">Lowest Month</span><span className="font-semibold text-green-600">{lowUsage} kWh</span></div>}
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
