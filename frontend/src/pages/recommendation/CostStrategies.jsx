import React from "react";
import { FiTrendingDown, FiRefreshCw, FiDollarSign, FiClock, FiDatabase } from "react-icons/fi";
import { generateCostStrategies } from "../../services/recommendationService";
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
const DIFFICULTY_COLORS = {
  Easy:   "bg-green-100 text-green-700",
  Medium: "bg-amber-100 text-amber-700",
  Hard:   "bg-red-100   text-red-700",
};

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

// ─────────────────────────────────────────────────────────
// Strategy Card
// ─────────────────────────────────────────────────────────
function StrategyCard({ strategy }) {
  if (!strategy) return null;
  const {
    title, summary, details = [], expectedSavings,
    timeframe, difficulty, learnMore,
  } = strategy;

  return (
    <div className="card flex flex-col gap-4">
      {/* Header */}
      {title && (
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center text-xl flex-shrink-0">💰</div>
          <div className="flex-1">
            <h3 className="font-bold text-gray-900 text-lg">{title}</h3>
            <div className="flex gap-2 mt-1 flex-wrap">
              {difficulty && (
                <span className={`text-xs px-2 py-0.5 rounded-lg font-semibold ${DIFFICULTY_COLORS[difficulty] || DIFFICULTY_COLORS.Medium}`}>
                  {difficulty}
                </span>
              )}
              {timeframe && (
                <span className="text-xs px-2 py-0.5 rounded-lg bg-gray-100 text-gray-600 font-medium">
                  🕐 {timeframe}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Summary */}
      {summary && (
        <div className="px-4 py-3 bg-indigo-50 rounded-xl border border-indigo-100">
          <p className="text-xs font-semibold text-indigo-500 uppercase tracking-wide mb-1">Strategy Overview</p>
          <p className="text-sm text-indigo-900 leading-relaxed">{summary}</p>
        </div>
      )}

      {/* Action Steps */}
      {details.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Action Steps</p>
          <ul className="space-y-2">
            {details.map((step, i) => (
              <li key={i} className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i + 1}</span>
                <span className="text-sm text-gray-700 leading-relaxed">{step}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      {(expectedSavings || learnMore) && (
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 flex-wrap gap-2">
          <div className="flex gap-2 flex-wrap">
            {expectedSavings?.unitsPerMonth != null && (
              <span className="text-xs bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg font-semibold">💧 {expectedSavings.unitsPerMonth} kWh/mo</span>
            )}
            {expectedSavings?.costLKR != null && (
              <span className="text-xs bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg font-semibold">💰 LKR {expectedSavings.costLKR}/mo</span>
            )}
          </div>
          {learnMore && (
            <a href={learnMore} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:text-blue-700 font-medium">Learn more →</a>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────
export default function CostStrategies() {
  const { householdId, loading: hhLoading, error: hhError } = useHousehold();

  const {
    data: rawData, loading, error, generated,
    generatedAt, fromCache, cooldown, generate,
  } = useAiGenerate(generateCostStrategies);

  // Normalise: backend sends { strategy: {...}, generatedAt, fromCache }
  const strategy = rawData?.strategy || rawData?.data?.strategy
    || (rawData && !rawData.strategy && !Array.isArray(rawData) && typeof rawData === "object" && rawData.title
        ? rawData : null);

  if (hhLoading) return <LoadingSpinner fullPage text="Loading your household..." />;
  if (hhError || !householdId) return <ErrorState message={hhError || "No household found."} />;

  const handleGenerate = () => generate(householdId);

  return (
    <div className="space-y-6 fade-in">
      <PageHeader title="Cost Strategies" subtitle="AI-generated plans to reduce your electricity bill" />

      {/* Hero */}
      <div className="card bg-gradient-to-br from-blue-700 via-indigo-700 to-violet-700 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-56 h-56 bg-white rounded-full" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white rounded-full" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">💰</div>
              <div>
                <p className="text-blue-200 text-sm font-medium">Powered by</p>
                <p className="font-bold text-lg">Google Gemini AI</p>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Optimize Your Energy Costs</h2>
            <p className="text-blue-100 text-sm max-w-lg leading-relaxed">
              Get a personalized cost-reduction plan based on your billing history and appliance usage.
            </p>
          </div>
          <button
            onClick={handleGenerate}
            disabled={loading || cooldown > 0}
            id="btn-generate-strategies"
            className="flex-shrink-0 inline-flex items-center gap-3 bg-white text-indigo-700 font-bold px-6 py-3.5 rounded-xl
              hover:bg-indigo-50 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed
              hover:scale-105 active:scale-95"
          >
            {loading ? (
              <><span className="w-5 h-5 border-2 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />Generating...</>
            ) : cooldown > 0 ? (
              <><FiClock className="w-5 h-5" />Wait {cooldown}s</>
            ) : (
              <><FiTrendingDown className="w-5 h-5" />{generated ? "Regenerate" : "Generate Strategy"}</>
            )}
          </button>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card">
          <div className="flex flex-col items-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center text-3xl mb-4 animate-pulse">🤖</div>
            <LoadingSpinner size="md" />
            <p className="text-gray-600 font-medium mt-4">Analyzing your spending patterns...</p>
            <p className="text-gray-400 text-sm mt-1">Gemini is crafting your personalized strategy</p>
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && <ErrorState message={error} onRetry={cooldown === 0 ? handleGenerate : undefined} />}

      {/* Result */}
      {!loading && !error && strategy && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            {/* Meta bar */}
            <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
                  <FiDollarSign className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900">Your Cost Reduction Plan</p>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    {generatedAt && <span className="flex items-center gap-1"><FiClock className="w-3 h-3" />{timeAgo(generatedAt)}</span>}
                    {fromCache && <span className="flex items-center gap-1 text-blue-500"><FiDatabase className="w-3 h-3" />Cached</span>}
                  </div>
                </div>
              </div>
              <button onClick={handleGenerate} disabled={loading || cooldown > 0} className="btn-secondary text-sm disabled:opacity-50">
                <FiRefreshCw className="w-3.5 h-3.5" />
                {cooldown > 0 ? `Refresh in ${cooldown}s` : "Regenerate"}
              </button>
            </div>
            <StrategyCard strategy={strategy} />
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="card bg-gradient-to-br from-green-50 to-emerald-50 border border-green-100">
              <div className="text-center">
                <div className="text-4xl mb-2">🎯</div>
                <p className="font-bold text-gray-900 mb-1">Quick Wins</p>
                <p className="text-sm text-gray-500 leading-relaxed">Start with these steps for fastest results.</p>
              </div>
              {strategy?.details?.length > 0 && (
                <div className="mt-4 space-y-2">
                  {strategy.details.slice(0, 3).map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm text-gray-700">
                      <span className="w-5 h-5 bg-green-500 text-white rounded-full text-xs flex items-center justify-center font-bold flex-shrink-0">{i + 1}</span>
                      <span className="line-clamp-1">{step}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="card border border-blue-100 bg-blue-50">
              <p className="text-sm font-semibold text-blue-800 mb-2">💡 Pro Tip</p>
              <p className="text-xs text-blue-700 leading-relaxed">
                Track your progress monthly. Implementing even 2-3 strategies can reduce your bill by 15–30%.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Empty */}
      {!loading && !error && !strategy && (
        <EmptyState
          icon="💰"
          title={generated ? "No strategy returned" : "Ready to save money?"}
          description={generated ? "The AI didn't return a strategy. Please try again." : 'Click "Generate Strategy" to get a personalized cost-reduction plan.'}
          action={
            <button onClick={handleGenerate} disabled={cooldown > 0} className="btn-primary disabled:opacity-50">
              <FiTrendingDown className="w-4 h-4" />
              {cooldown > 0 ? `Try again in ${cooldown}s` : (generated ? "Try Again" : "Generate Strategy")}
            </button>
          }
        />
      )}
    </div>
  );
}
