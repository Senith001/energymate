import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowLeft, FiZap, FiTrendingDown, FiActivity,
  FiCheckCircle, FiChevronRight
} from "react-icons/fi";

import EnergyTips from "./recommendation/EnergyTips";
import CostStrategies from "./recommendation/CostStrategies";
import Predictions from "./recommendation/Predictions";
import UserRecommendations from "./recommendation/UserRecommendations";

// ─── Tab Config ────────────────────────────────────────────────────────────────
const TABS = [
  {
    id: "recommendations",
    label: "My Recommendations",
    emoji: "🏠",
    icon: <FiCheckCircle className="w-5 h-5" />,
    tagline: "Admin-curated expert tips",
    heroBg: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=2070&auto=format&fit=crop",
    accent: "#10b981",
    accentDark: "#059669",
    gradientFrom: "#064e3b",
    gradientTo: "#065f46",
    pill: "from-emerald-500 to-green-400",
    component: <UserRecommendations />,
  },
  {
    id: "energy-tips",
    label: "AI Energy Tips",
    emoji: "⚡",
    icon: <FiZap className="w-5 h-5" />,
    tagline: "Gemini-powered live analysis",
    heroBg: "https://images.unsplash.com/photo-1509391366360-1e97fb5c26b5?q=80&w=2070&auto=format&fit=crop",
    accent: "#f59e0b",
    accentDark: "#d97706",
    gradientFrom: "#78350f",
    gradientTo: "#92400e",
    pill: "from-amber-500 to-orange-400",
    component: <EnergyTips />,
  },
  {
    id: "cost-strategies",
    label: "Cost Strategies",
    emoji: "💰",
    icon: <FiTrendingDown className="w-5 h-5" />,
    tagline: "Slash your electricity bill",
    heroBg: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2070&auto=format&fit=crop",
    accent: "#3b82f6",
    accentDark: "#2563eb",
    gradientFrom: "#1e3a8a",
    gradientTo: "#1e40af",
    pill: "from-blue-500 to-indigo-500",
    component: <CostStrategies />,
  },
  {
    id: "predictions",
    label: "Predictions",
    emoji: "🔮",
    icon: <FiActivity className="w-5 h-5" />,
    tagline: "Forecast your future usage",
    heroBg: "https://images.unsplash.com/photo-1518770660439-4636190af475?q=80&w=2070&auto=format&fit=crop",
    accent: "#a855f7",
    accentDark: "#9333ea",
    gradientFrom: "#3b0764",
    gradientTo: "#4c1d95",
    pill: "from-purple-500 to-violet-500",
    component: <Predictions />,
  },
];

export default function AIHubPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [animating, setAnimating] = useState(false);
  const active = TABS[activeTab];

  const switchTab = (i) => {
    if (i === activeTab) return;
    setAnimating(true);
    setTimeout(() => {
      setActiveTab(i);
      setAnimating(false);
    }, 250);
  };

  // Particle-like floating dots animation (CSS keyframes injected inline)
  const globalStyles = `
    @keyframes float-slow { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-20px) rotate(5deg)} }
    @keyframes float-medium { 0%,100%{transform:translateY(0px)} 50%{transform:translateY(-14px)} }
    @keyframes float-fast { 0%,100%{transform:translateY(0px) rotate(0deg)} 50%{transform:translateY(-8px) rotate(-3deg)} }
    @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
    @keyframes fade-slide-up { from{opacity:0;transform:translateY(24px)} to{opacity:1;transform:translateY(0)} }
    @keyframes hero-scale { 0%{transform:scale(1.08)} 100%{transform:scale(1)} }
    @keyframes pulse-ring { 0%{box-shadow:0 0 0 0 rgba(var(--accent-rgb),0.4)} 70%{box-shadow:0 0 0 16px rgba(var(--accent-rgb),0)} 100%{box-shadow:0 0 0 0 rgba(var(--accent-rgb),0)} }
    .float-slow { animation: float-slow 7s ease-in-out infinite; }
    .float-medium { animation: float-medium 5s ease-in-out infinite; }
    .float-fast { animation: float-fast 3.5s ease-in-out infinite; }
    .animate-fade-slide-up { animation: fade-slide-up 0.6s cubic-bezier(0.16,1,0.3,1) both; }
    .hero-img { animation: hero-scale 0.9s ease-out both; }
    .content-enter { animation: fade-slide-up 0.4s cubic-bezier(0.16,1,0.3,1) both; }
  `;

  return (
    <>
      <style>{globalStyles}</style>

      <div
        className="min-h-screen font-sans"
        style={{ background: `linear-gradient(135deg, ${active.gradientFrom} 0%, ${active.gradientTo} 100%)`, transition: "background 0.8s ease" }}
      >
        {/* ── TOP NAVBAR ── */}
        <nav className="sticky top-0 z-50 backdrop-blur-lg bg-black/30 border-b border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-white/70 hover:text-white text-sm font-medium transition-colors py-1.5 px-3 rounded-lg hover:bg-white/10"
              >
                <FiArrowLeft className="w-4 h-4" />
                Dashboard
              </Link>
              <div className="h-5 w-px bg-white/20" />
              <Link to="/home" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-white/15 flex items-center justify-center text-white font-black text-sm">⚡</div>
                <span className="font-black text-white text-lg tracking-tight">
                  ENERGY<span style={{ color: active.accent }}>MATE</span>
                </span>
              </Link>
            </div>
            <div
              className="flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/20 bg-white/10 backdrop-blur"
              style={{ boxShadow: `0 0 20px ${active.accent}40` }}
            >
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: active.accent }} />
              <span className="text-xs font-bold text-white">AI Engine Active</span>
            </div>
          </div>
        </nav>

        {/* ── HERO SECTION ── */}
        <div className="relative h-[520px] overflow-hidden">
          {/* Photo background */}
          <img
            key={active.heroBg}
            src={active.heroBg}
            alt=""
            className="hero-img absolute inset-0 w-full h-full object-cover"
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-black/60" />
          <div
            className="absolute inset-0 transition-all duration-700"
            style={{ background: `linear-gradient(135deg, ${active.gradientFrom}cc 0%, transparent 60%)` }}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent" />

          {/* Floating decorative blobs */}
          <div className="float-slow absolute top-10 right-20 w-32 h-32 rounded-full opacity-30" style={{ background: active.accent, filter: "blur(40px)" }} />
          <div className="float-medium absolute bottom-20 right-[30%] w-20 h-20 rounded-full opacity-20" style={{ background: active.accent, filter: "blur(30px)" }} />
          <div className="float-fast absolute top-[30%] left-[15%] w-16 h-16 rounded-full opacity-15" style={{ background: "#ffffff", filter: "blur(20px)" }} />

          {/* Hero Text */}
          <div className="relative z-10 max-w-7xl mx-auto px-6 h-full flex flex-col justify-center">
            <div className="animate-fade-slide-up max-w-3xl">
              {/* Gemini badge */}
              <div className="inline-flex items-center gap-2 mb-5 px-4 py-2 rounded-full border border-white/20 bg-white/10 backdrop-blur text-white/80 text-xs font-bold tracking-wider uppercase">
                <span>⚡</span>
                Powered by Google Gemini AI
              </div>

              <h1 className="text-5xl md:text-7xl font-black text-white leading-[1.05] mb-4 drop-shadow-2xl">
                Your Personal
                <br />
                <span
                  className="inline-block"
                  style={{ color: active.accent, textShadow: `0 0 60px ${active.accent}80` }}
                >
                  AI Energy Hub
                </span>
              </h1>
              <p className="text-white/70 text-lg md:text-xl max-w-2xl leading-relaxed">
                Four AI-powered tools in one command center. Recommendations, smart tips, cost strategies, and energy predictions — all tailored to your household.
              </p>
            </div>

            {/* Stat chips */}
            <div className="flex flex-wrap gap-3 mt-8 animate-fade-slide-up" style={{ animationDelay: "0.15s" }}>
              {[
                { label: "AI Models", value: "Gemini 2.5" },
                { label: "Avg Savings", value: "24.5%" },
                { label: "Personalized", value: "Your Data" },
              ].map((s) => (
                <div key={s.label} className="px-4 py-2 rounded-full bg-white/10 backdrop-blur border border-white/20 text-white text-sm font-semibold">
                  <span className="opacity-60 mr-2">{s.label}:</span>{s.value}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── TAB SELECTOR ── */}
        <div className="bg-black/30 backdrop-blur-lg border-b border-white/10 sticky top-[57px] z-40">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex gap-1">
              {TABS.map((tab, i) => (
                <button
                  key={tab.id}
                  onClick={() => switchTab(i)}
                  className="flex items-center gap-2.5 px-5 py-4 text-sm font-semibold relative transition-all duration-200 group whitespace-nowrap"
                  style={{
                    color: activeTab === i ? active.accent : "rgba(255,255,255,0.5)",
                  }}
                >
                  <span className="text-lg">{tab.emoji}</span>
                  <span className="hidden md:inline">{tab.label}</span>
                  {/* Active underline */}
                  {activeTab === i && (
                    <div
                      className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full"
                      style={{ background: active.accent }}
                    />
                  )}
                  {/* Hover underline */}
                  <div
                    className="absolute bottom-0 left-0 right-0 h-0.5 rounded-full opacity-0 group-hover:opacity-40 transition-opacity"
                    style={{ background: "white" }}
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── CONTENT AREA ── */}
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-10">

          {/* Tab Header Banner */}
          <div
            key={`banner-${activeTab}`}
            className="content-enter flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-8 p-6 rounded-2xl border border-white/10 bg-white/10 backdrop-blur-sm"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl"
                style={{ background: `${active.accent}25`, border: `2px solid ${active.accent}50` }}
              >
                {active.emoji}
              </div>
              <div>
                <h2 className="text-white font-black text-2xl">{active.label}</h2>
                <p className="text-white/50 text-sm mt-0.5">{active.tagline}</p>
              </div>
            </div>
            {/* Next tab nudge */}
            {activeTab < TABS.length - 1 && (
              <button
                onClick={() => switchTab(activeTab + 1)}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white/60 hover:text-white border border-white/20 hover:bg-white/10 transition-all"
              >
                Next: {TABS[activeTab + 1].emoji} {TABS[activeTab + 1].label}
                <FiChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* White card panel for existing components */}
          <div
            key={`content-${activeTab}`}
            className={`rounded-3xl overflow-hidden shadow-2xl transition-opacity duration-250 ${animating ? "opacity-0" : "content-enter"}`}
            style={{ boxShadow: `0 32px 80px ${active.accent}30, 0 0 0 1px ${active.accent}20` }}
          >
            {/* Coloured top strip */}
            <div
              className="h-1.5"
              style={{ background: `linear-gradient(90deg, ${active.accent}, ${active.accentDark})` }}
            />
            {/* Inner light panel */}
            <div className="bg-[#f8fafc] p-6 md:p-8 min-h-[500px]">
              <div key={active.id}>
                {active.component}
              </div>
            </div>
          </div>

          {/* ── Bottom Nav Pills ── */}
          <div className="flex flex-wrap justify-center gap-3 mt-10 mb-4">
            {TABS.map((tab, i) => (
              <button
                key={tab.id}
                onClick={() => switchTab(i)}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-bold transition-all duration-300 ${
                  activeTab === i
                    ? "text-white shadow-lg scale-105"
                    : "text-white/60 bg-white/10 hover:bg-white/20 hover:text-white"
                }`}
                style={activeTab === i ? {
                  background: `linear-gradient(135deg, ${active.accent}, ${active.accentDark})`,
                  boxShadow: `0 8px 24px ${active.accent}50`
                } : {}}
              >
                <span>{tab.emoji}</span>
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* ── FOOTER ── */}
        <footer className="border-t border-white/10 py-8 text-center bg-black/20">
          <p className="text-white/30 text-sm">
            © 2026 EnergyMate AI Hub — Powered by Google Gemini •{" "}
            <Link to="/home" className="hover:text-white transition-colors" style={{ color: active.accent }}>
              Back to Home
            </Link>
          </p>
        </footer>
      </div>
    </>
  );
}
