import React from "react";
import { FiZap, FiRefreshCw, FiCopy, FiCheck, FiClock, FiDatabase } from "react-icons/fi";
import { generateEnergyTips } from "../../services/recommendationService";
import {
  LoadingSpinner,
  EmptyState,
  ErrorState,
  PageHeader,
} from "../../components/ui/SharedComponents";
import { useHousehold } from "../../hooks/useHousehold";
import { useAiGenerate } from "../../hooks/useAiGenerate";
import { useState } from "react";

// ─────────────────────────────────────────────────────────
// Helpers
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

// ─────────────────────────────────────────────────────────
// Tip Card
// ─────────────────────────────────────────────────────────
function TipCard({ tip, index }) {
  const [copied, setCopied] = useState(false);

  const isObj = tip && typeof tip === "object";
  const title = isObj ? tip.title : null;
  const problem = isObj ? tip.problem : null;
  const recommendation = isObj ? tip.recommendation : (typeof tip === "string" ? tip : null);
  const priority = isObj ? tip.priority : null;
  const category = isObj ? tip.category : null;
  const learnMore = isObj ? tip.learnMore : null;
  const steps = isObj && Array.isArray(tip.implementation) ? tip.implementation : [];
  const savings = isObj ? tip.expectedSavings : null;

  const copyText = [title, problem, recommendation, ...steps].filter(Boolean).join(" | ");
  const handleCopy = () => {
    navigator.clipboard.writeText(copyText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const icon = CATEGORY_ICONS[category] || TIP_ICONS[index % TIP_ICONS.length];
  const pc = PRIORITY_COLORS[priority] || PRIORITY_COLORS.Medium;

  return (
    <div
      className="card card-hover group fade-in flex flex-col gap-3"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      {/* Header */}
      <div className="flex items-start gap-3">
        <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 group-hover:scale-110 transition-transform duration-200 ${pc.bg}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          {priority && (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-xs font-semibold mb-1.5 ${pc.bg} ${pc.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
              {priority} Priority
            </span>
          )}
          {title && <h3 className="font-bold text-gray-900 text-sm leading-snug">{title}</h3>}
        </div>
        <button onClick={handleCopy} className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-colors" title="Copy">
          {copied ? <FiCheck className="w-4 h-4 text-green-500" /> : <FiCopy className="w-4 h-4" />}
        </button>
      </div>

      {/* Problem */}
      {problem && (
        <div className="px-3 py-2 bg-red-50 rounded-lg border border-red-100">
          <p className="text-xs font-semibold text-red-500 uppercase tracking-wide mb-0.5">Problem</p>
          <p className="text-sm text-red-800 leading-relaxed">{problem}</p>
        </div>
      )}

      {/* Recommendation */}
      {recommendation && (
        <div className="px-3 py-2 bg-green-50 rounded-lg border border-green-100">
          <p className="text-xs font-semibold text-green-600 uppercase tracking-wide mb-0.5">Recommendation</p>
          <p className="text-sm text-green-900 leading-relaxed">{recommendation}</p>
        </div>
      )}

      {/* Steps */}
      {steps.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1.5">How to do it</p>
          <ul className="space-y-1">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                <span className="mt-0.5 w-4 h-4 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      {(savings || learnMore) && (
        <div className="flex items-center justify-between pt-2 border-t border-gray-100 mt-auto flex-wrap gap-2">
          <div className="flex gap-2 flex-wrap">
            {savings?.unitsPerMonth != null && (
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-lg font-semibold">💧 {savings.unitsPerMonth} kWh/mo</span>
            )}
            {savings?.costLKR != null && (
              <span className="text-xs bg-emerald-50 text-emerald-700 px-2 py-1 rounded-lg font-semibold">💰 LKR {savings.costLKR}/mo</span>
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
// Generate Button (with cooldown countdown)
// ─────────────────────────────────────────────────────────
function GenerateButton({ cooldown, loading, generated, onClick }) {
  const disabled = loading || cooldown > 0;
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      id="btn-generate-tips"
      className="flex-shrink-0 inline-flex items-center gap-3 bg-white text-orange-600 font-bold px-6 py-3.5 rounded-xl
        hover:bg-orange-50 transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-60 disabled:cursor-not-allowed
        hover:scale-105 active:scale-95"
    >
      {loading ? (
        <>
          <span className="w-5 h-5 border-2 border-orange-200 border-t-orange-600 rounded-full animate-spin" />
          Generating...
        </>
      ) : cooldown > 0 ? (
        <>
          <FiClock className="w-5 h-5" />
          Wait {cooldown}s
        </>
      ) : (
        <>
          <FiZap className="w-5 h-5" />
          {generated ? "Regenerate Tips" : "Generate Tips"}
        </>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────────────────
export default function EnergyTips() {
  const { householdId, loading: hhLoading, error: hhError } = useHousehold();

  const {
    data: rawData, loading, error, generated,
    generatedAt, fromCache, cooldown, generate,
  } = useAiGenerate(generateEnergyTips);

  // Normalize tips from the response payload
  const tips = Array.isArray(rawData?.tips) ? rawData.tips
    : Array.isArray(rawData?.data?.tips) ? rawData.data.tips
      : Array.isArray(rawData) ? rawData
        : [];

  if (hhLoading) return <LoadingSpinner fullPage text="Loading your household..." />;
  if (hhError || !householdId) return <ErrorState message={hhError || "No household found."} />;

  const handleGenerate = () => generate(householdId);

  return (
    <div className="space-y-6 fade-in">
      <PageHeader title="AI Energy Tips" subtitle="Gemini-powered personalized energy-saving recommendations" />

      {/* Hero CTA */}
      <div className="card bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute -top-10 -right-10 w-48 h-48 bg-white rounded-full" />
          <div className="absolute -bottom-16 -left-10 w-64 h-64 bg-white rounded-full" />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl">🤖</div>
              <div>
                <p className="text-orange-100 text-sm font-medium">Powered by</p>
                <p className="font-bold text-lg">Google Gemini AI</p>
              </div>
            </div>
            <h2 className="text-2xl font-bold mb-2">Get Personalized Energy Tips</h2>
            <p className="text-orange-100 text-sm max-w-lg leading-relaxed">
              Gemini analyzes your household's billing history and appliances to generate actionable energy-saving recommendations.
            </p>
          </div>
          <GenerateButton cooldown={cooldown} loading={loading} generated={generated} onClick={handleGenerate} />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="card">
          <div className="flex flex-col items-center py-12">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 flex items-center justify-center text-3xl mb-4 animate-pulse">🤖</div>
            <LoadingSpinner size="md" />
            <p className="text-gray-600 font-medium mt-4">Gemini is analyzing your energy data...</p>
            <p className="text-gray-400 text-sm mt-1">This may take a moment</p>
          </div>
        </div>
      )}

      {/* Error */}
      {!loading && error && <ErrorState message={error} onRetry={cooldown === 0 ? handleGenerate : undefined} />}

      {/* Results */}
      {!loading && !error && tips.length > 0 && (
        <>
          {/* Meta bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
                <FiZap className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-gray-900">{tips.length} Tips Generated</p>
                <div className="flex items-center gap-2 text-xs text-gray-400">
                  {generatedAt && (
                    <span className="flex items-center gap-1">
                      <FiClock className="w-3 h-3" />
                      {timeAgo(generatedAt)}
                    </span>
                  )}
                  {fromCache && (
                    <span className="flex items-center gap-1 text-blue-500">
                      <FiDatabase className="w-3 h-3" />
                      Cached
                    </span>
                  )}
                </div>
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading || cooldown > 0}
              className="btn-secondary text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FiRefreshCw className="w-3.5 h-3.5" />
              {cooldown > 0 ? `Refresh in ${cooldown}s` : "Regenerate"}
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tips.map((tip, i) => <TipCard key={i} tip={tip} index={i} />)}
          </div>
        </>
      )}

      {/* Empty — not yet generated */}
      {!loading && !error && tips.length === 0 && !generated && (
        <EmptyState
          icon="⚡"
          title="No tips yet"
          description='Click "Generate Tips" to get AI-powered energy-saving recommendations tailored to your household.'
          action={<button onClick={handleGenerate} className="btn-primary"><FiZap className="w-4 h-4" />Generate Tips</button>}
        />
      )}

      {!loading && !error && tips.length === 0 && generated && (
        <EmptyState
          icon="🤔"
          title="No tips returned"
          description="The AI didn't return any tips. Please try again."
          action={
            <button onClick={handleGenerate} disabled={cooldown > 0} className="btn-secondary disabled:opacity-50">
              <FiRefreshCw className="w-4 h-4" />
              {cooldown > 0 ? `Try again in ${cooldown}s` : "Try Again"}
            </button>
          }
        />
      )}
    </div>
  );
}
