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
  High: { bg: "bg-slate-100", text: "text-slate-800", dot: "bg-emerald-500", ring: "ring-emerald-200" },
  Medium: { bg: "bg-white border border-slate-200", text: "text-slate-700", dot: "bg-emerald-400", ring: "ring-emerald-100" },
  Low: { bg: "bg-white border border-slate-100", text: "text-slate-500", dot: "bg-emerald-300", ring: "ring-slate-50" },
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
      className="bg-white rounded-2xl p-5 border border-slate-200 shadow-[0_4px_20px_rgba(0,0,0,0.03)] flex flex-col gap-4"
    >
      {/* Header */}
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0 transition-transform duration-200 ${pc.bg}`}>
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          {priority && (
            <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-bold mb-1.5 bg-slate-50 text-slate-600 border border-slate-200`}>
              <span className={`w-1.5 h-1.5 rounded-full ${pc.dot}`} />
              {priority} Priority
            </span>
          )}
          {title && <h3 className="font-bold text-slate-900 text-base leading-snug">{title}</h3>}
        </div>
        <button onClick={handleCopy} className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors" title="Copy">
          {copied ? <FiCheck className="w-4 h-4 text-emerald-500" /> : <FiCopy className="w-4 h-4" />}
        </button>
      </div>

      {/* Problem */}
      {problem && (
        <div className="px-4 py-3 bg-slate-50 rounded-xl border border-slate-200">
          <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">Issue Detected</p>
          <p className="text-sm text-slate-700 leading-relaxed font-medium">{problem}</p>
        </div>
      )}

      {/* Recommendation */}
      {recommendation && (
        <div className="px-4 py-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
          <p className="text-[11px] font-bold text-emerald-600 uppercase tracking-wider mb-1">AI Recommendation</p>
          <p className="text-sm text-emerald-900 leading-relaxed font-medium">{recommendation}</p>
        </div>
      )}

      {/* Steps */}
      {steps.length > 0 && (
        <div className="mt-2">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Action Plan</p>
          <ul className="space-y-2">
            {steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2.5 text-sm text-slate-600 font-medium">
                <span className="mt-0.5 w-4 h-4 rounded-full bg-slate-100 text-slate-500 flex items-center justify-center text-[10px] font-bold flex-shrink-0 border border-slate-200">{i + 1}</span>
                {step}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Footer */}
      {(savings || learnMore) && (
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2 flex-wrap gap-2">
          <div className="flex gap-2 flex-wrap">
            {savings?.unitsPerMonth != null && (
               <span className="text-xs bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md font-bold">🎯 {savings.unitsPerMonth} kWh/mo</span>
            )}
            {savings?.costLKR != null && (
               <span className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-1 rounded-md font-bold">✨ LKR {savings.costLKR}/mo</span>
            )}
          </div>
          {learnMore && (
            <a href={learnMore} target="_blank" rel="noopener noreferrer" className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition">Learn Details →</a>
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
      className="flex-shrink-0 inline-flex items-center gap-3 bg-emerald-600 text-white font-bold px-7 py-3.5 rounded-xl
        hover:bg-emerald-700 transition-all duration-200 shadow-md shadow-emerald-500/20 disabled:opacity-60 disabled:cursor-not-allowed
        hover:scale-[1.02] active:scale-[0.98]"
    >
      {loading ? (
        <>
          <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
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
      <PageHeader title="AI Energy Tips" subtitle="Smart, personalized energy-saving recommendations for your home" />

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
            Personalized <span className="text-emerald-600">Energy Tips</span>
          </h2>
          <p className="text-slate-500 text-base leading-relaxed font-medium mb-8">
            Our AI engine analyzes your household's historical billing data and appliance usage array to generate actionable, cost-saving recommendations effortlessly.
          </p>
          
          <GenerateButton cooldown={cooldown} loading={loading} generated={generated} onClick={handleGenerate} />
        </div>

        <div className="relative z-10 hidden md:flex items-center justify-center w-64 h-64 flex-shrink-0 animate-[bounce_4s_ease-in-out_infinite]">
          <img src="/assets/hero_energy_tips.png" alt="Smart Lightbulb Energy Concept" className="w-full h-full object-contain drop-shadow-[0_20px_30px_rgba(16,185,129,0.15)]" />
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col items-center py-12">
          <div className="w-16 h-16 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-3xl mb-4 animate-pulse">🤖</div>
          <LoadingSpinner size="md" />
          <p className="text-slate-700 font-bold mt-5">Gemini is analyzing your energy data...</p>
          <p className="text-slate-400 text-sm mt-1.5 font-medium">This may take a moment</p>
        </div>
      )}

      {/* Error */}
      {!loading && error && <ErrorState message={error} onRetry={cooldown === 0 ? handleGenerate : undefined} />}

      {/* Results */}
      {!loading && !error && tips.length > 0 && (
        <>
          {/* Meta bar */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-center">
                <FiZap className="w-6 h-6 text-slate-700" />
              </div>
              <div>
                <p className="font-bold text-slate-900 text-base">{tips.length} Tips Generated</p>
                <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mt-0.5">
                  {generatedAt && (
                    <span className="flex items-center gap-1">
                      <FiClock className="w-3 h-3" />
                      {timeAgo(generatedAt)}
                    </span>
                  )}
                  {fromCache && (
                    <span className="flex items-center gap-1 text-slate-400">
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
