import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import {
  FiArrowRight, FiZap, FiStar, FiCheck, FiChevronDown,
  FiTrendingDown, FiCpu, FiSmile, FiHome, FiDollarSign,
  FiBarChart2, FiTarget, FiHeart, FiFileText
} from "react-icons/fi";
import { useAuth } from "../context/AuthContext";
import { getPosts } from "../services/postService";
import api from "../services/api";

// ─── Counter ───────────────────────────────────────────────────────────
function Counter({ target, suffix = "" }) {
  const [n, setN] = useState(0);
  const ref = useRef(null);
  const done = useRef(false);
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting && !done.current) {
        done.current = true;
        let start = null;
        const step = (ts) => {
          if (!start) start = ts;
          const p = Math.min((ts - start) / 1800, 1);
          setN(Math.floor((1 - Math.pow(1 - p, 3)) * target));
          if (p < 1) requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
      }
    }, { threshold: 0.3 });
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [target]);
  return <span ref={ref}>{n.toLocaleString()}{suffix}</span>;
}

// ─── Global CSS ─────────────────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:ital,wght@0,400;0,500;0,600;0,700;0,800;0,900;1,400&display=swap');

  *, *::before, *::after { box-sizing: border-box; }
  .em { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; scroll-behavior: smooth; }

  /* Keyframes */
  @keyframes float1  { 0%,100%{transform:translateY(0)}    50%{transform:translateY(-16px)} }
  @keyframes float2  { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-22px) rotate(2deg)} }
  @keyframes ticker  { 0%{transform:translateX(0)} 100%{transform:translateX(-50%)} }
  @keyframes blob1   { 0%,100%{transform:scale(1) translate(0,0)}    50%{transform:scale(1.1) translate(30px,-15px)} }
  @keyframes blob2   { 0%,100%{transform:scale(1) translate(0,0)}    50%{transform:scale(0.9) translate(-20px,20px)} }
  @keyframes fadeUp  { from{opacity:0;transform:translateY(30px)} to{opacity:1;transform:translateY(0)} }
  @keyframes shimmer { 0%{background-position:200% 0} 100%{background-position:-200% 0} }
  @keyframes pulse2  { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.7;transform:scale(.95)} }

  .float1 { animation: float1 5s ease-in-out infinite; }
  .float2 { animation: float2 7s ease-in-out infinite; }
  .ticker-anim { animation: ticker 32s linear infinite; white-space:nowrap; }
  .blob1 { animation: blob1 9s ease-in-out infinite; }
  .blob2 { animation: blob2 11s ease-in-out infinite; }
  .fade-up { animation: fadeUp 0.7s cubic-bezier(0.16,1,0.3,1) both; }

  .gtext {
    background: linear-gradient(135deg,#4ade80,#22d3ee,#4ade80);
    background-size: 300% auto;
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    animation: shimmer 5s linear infinite;
  }

  /* Buttons */
  .btn-g {
    display:inline-flex; align-items:center; gap:8px;
    background:linear-gradient(135deg,#16a34a,#059669);
    color:white; font-weight:700; font-size:15px;
    padding:13px 28px; border-radius:50px; border:none; cursor:pointer;
    box-shadow:0 6px 24px rgba(22,163,74,.4); text-decoration:none;
    transition:all .3s ease;
  }
  .btn-g:hover { transform:translateY(-3px); box-shadow:0 12px 36px rgba(22,163,74,.5); }

  .btn-o {
    display:inline-flex; align-items:center; gap:8px;
    background:transparent; color:white; font-weight:600; font-size:15px;
    padding:13px 28px; border-radius:50px;
    border:2px solid rgba(255,255,255,.4); text-decoration:none;
    transition:all .3s ease;
  }
  .btn-o:hover { background:rgba(255,255,255,.12); border-color:white; }

  /* Nav */
  .nav-link {
    color:inherit; text-decoration:none; font-weight:600; font-size:14px;
    position:relative; padding-bottom:2px;
    transition:color .2s;
  }
  .nav-link::after {
    content:''; position:absolute; bottom:0; left:0; right:0; height:2px;
    background:#16a34a; transform:scaleX(0); transform-origin:left;
    transition:transform .3s ease;
  }
  .nav-link:hover::after { transform:scaleX(1); }

  /* Cards */
  .card {
    background:white; border-radius:20px;
    border:1px solid #f1f5f9;
    transition:all .35s cubic-bezier(0.16,1,0.3,1);
  }
  .card:hover { transform:translateY(-6px); box-shadow:0 20px 60px rgba(0,0,0,.1); }

  /* Step number badge */
  .step-num {
    position:absolute; top:-14px; left:50%; transform:translateX(-50%);
    width:28px; height:28px; border-radius:50%;
    background:linear-gradient(135deg,#16a34a,#4ade80);
    color:white; font-weight:900; font-size:13px;
    display:flex; align-items:center; justify-center;
    box-shadow: 0 4px 12px rgba(22,163,74,.4);
  }

  /* Image zoom */
  .img-wrap { overflow:hidden; border-radius:16px; }
  .img-wrap img { transition:transform .6s cubic-bezier(0.16,1,0.3,1); width:100%; height:100%; object-fit:cover; }
  .img-wrap:hover img { transform:scale(1.07); }

  /* Testimonial */
  .tcard {
    background:white; border-radius:20px; padding:28px;
    box-shadow:0 4px 24px rgba(0,0,0,.07);
    border:1px solid #f0fdf4;
    transition:all .3s ease;
  }
  .tcard:hover { transform:translateY(-5px); box-shadow:0 16px 48px rgba(0,0,0,.12); }

  /* Feature tag pill */
  .ftag {
    display:inline-flex; align-items:center; gap:5px;
    font-size:11px; font-weight:700; padding:4px 10px;
    border-radius:50px; letter-spacing:.02em;
  }

  /* Scroll bounce */
  @keyframes sbounce { 0%,100%{transform:translateX(-50%) translateY(0)} 50%{transform:translateX(-50%) translateY(6px)} }
  .sbounce { animation: sbounce 1.4s ease-in-out infinite; }
`;

// ─── Data ─────────────────────────────────────────────────────────────
const STEPS = [
  { e: <FiHome />, color: "#3b82f6", title: "Register Your Home", desc: "Add your house details, rooms and appliances in minutes. No tech skills needed." },
  { e: <FiBarChart2 />, color: "#10b981", title: "Track Your Usage", desc: "See exactly how much electricity every room uses — in real time." },
  { e: <FiCpu />, color: "#a855f7", title: "Get AI Advice", desc: "Gemini AI reads your data and gives plain-English tips to cut waste." },
  { e: <FiDollarSign />, color: "#f59e0b", title: "Save Every Month", desc: "Watch your bills shrink and track how much you've saved in total." },
];

// ─── Main ──────────────────────────────────────────────────────────────
export default function LandingPage() {
  const { user } = useAuth();
  const [posts, setPosts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [postsLoading, setPostsLoading] = useState(true);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Fetch News/Posts
    getPosts()
      .then((res) => {
        const list = Array.isArray(res.data?.data) ? res.data.data
          : Array.isArray(res.data) ? res.data
            : [];
        setPosts(list);
      })
      .catch(() => setPosts([]))
      .finally(() => setPostsLoading(false));

    // Fetch Featured Feedback
    api.get("/feedback/public/featured")
      .then(res => setReviews(res.data || []))
      .catch(err => console.error("Featured feedback error:", err));

    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  return (
    <>
      <style>{CSS}</style>
      <div className="em min-h-screen bg-white text-gray-900">

        {/* ══ NAVBAR ══════════════════════════════════ */}
        <nav
          className="fixed top-0 left-0 right-0 z-50"
          style={{
            padding: scrolled ? "10px 0" : "18px 0",
            background: scrolled ? "rgba(255,255,255,0.97)" : "transparent",
            backdropFilter: scrolled ? "blur(20px)" : "none",
            boxShadow: scrolled ? "0 2px 24px rgba(0,0,0,.08)" : "none",
            transition: "all .3s ease",
          }}
        >
          <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            {/* Logo */}
            <Link to="/home" style={{ display: "flex", alignItems: "center", gap: 10, textDecoration: "none" }}>
              <img src="/logo.png" alt="EnergyMate Logo" style={{ width: 36, height: 36, borderRadius: 10, boxShadow: "0 4px 16px rgba(22,163,74,.4)", objectFit: "cover" }} />
              <span style={{ fontWeight: 900, fontSize: 18, color: scrolled ? "#111" : "white" }}>Energy<span style={{ color: "#16a34a" }}>Mate</span></span>
            </Link>

            {/* Links */}
            <div style={{ display: "flex", alignItems: "center", gap: 32 }}>
              {[["#how", "How it works"], ["#features", "Features"], ["#love", "Reviews"]].map(([href, label]) => (
                <a key={href} href={href} className="nav-link" style={{ color: scrolled ? "#374151" : "rgba(255,255,255,.8)" }}>{label}</a>
              ))}
              <Link to="/ai" style={{ color: "#16a34a", fontWeight: 800, fontSize: 14, textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}>
                <FiZap size={14} fill="currentColor" /> AI Hub
              </Link>
              {user
                ? <Link to="/profile" className="nav-link" style={{ color: scrolled ? "#374151" : "rgba(255,255,255,.8)" }}>My Profile</Link>
                : <Link to="/login" className="nav-link" style={{ color: scrolled ? "#374151" : "rgba(255,255,255,.8)" }}>Login</Link>
              }
            </div>

            {/* CTA */}
            <Link to={user ? "/" : "/register"} className="btn-g" style={{ fontSize: 14, padding: "10px 22px" }}>
              {user ? "Dashboard" : "Get Started — Free"}
              <FiArrowRight size={14} />
            </Link>
          </div>
        </nav>

        {/* ══ HERO ════════════════════════════════════ */}
        <section style={{ position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", overflow: "hidden", background: "linear-gradient(155deg,#052e16 0%,#14532d 45%,#065f46 100%)" }}>
          {/* Background photo */}
          <img src="https://images.unsplash.com/photo-1487958449943-2429e8be8625?q=80&w=2100&fit=crop" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: 0.18 }} />

          {/* Glowing blobs */}
          <div className="blob1" style={{ position: "absolute", top: "-10%", right: "-5%", width: 480, height: 480, borderRadius: "50%", background: "radial-gradient(circle,rgba(74,222,128,.28),transparent 70%)", filter: "blur(50px)", pointerEvents: "none" }} />
          <div className="blob2" style={{ position: "absolute", bottom: "-5%", left: "8%", width: 320, height: 320, borderRadius: "50%", background: "radial-gradient(circle,rgba(34,211,238,.18),transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />

          {/* Floating UI preview cards */}
          <div className="float1" style={{ position: "absolute", right: 40, top: "22%", zIndex: 2, display: "none" }} id="card-float-a">
            <div style={{ background: "rgba(255,255,255,.1)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 20, padding: "18px 22px", width: 240, boxShadow: "0 24px 64px rgba(0,0,0,.3)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <div style={{ width: 32, height: 32, borderRadius: 10, background: "rgba(74,222,128,.25)", display: "flex", alignItems: "center", justifyContent: "center", color: "#4ade80" }}>
                  <FiTrendingDown size={18} />
                </div>
                <span style={{ color: "rgba(255,255,255,.7)", fontSize: 12, fontWeight: 600 }}>vs last month</span>
              </div>
              <p style={{ color: "white", fontWeight: 900, fontSize: 36, lineHeight: 1, margin: 0 }}>↓ 18%</p>
              <p style={{ color: "#4ade80", fontSize: 12, fontWeight: 600, marginTop: 6 }}>You saved 34 kWh! 🎉</p>
            </div>
          </div>
          <div className="float2" style={{ position: "absolute", right: 60, bottom: "28%", zIndex: 2, display: "none" }} id="card-float-b">
            <div style={{ background: "rgba(255,255,255,.08)", backdropFilter: "blur(16px)", border: "1px solid rgba(255,255,255,.15)", borderRadius: 18, padding: "16px 18px", width: 220, boxShadow: "0 16px 48px rgba(0,0,0,.25)" }}>
              <p style={{ color: "rgba(255,255,255,.55)", fontSize: 11, fontWeight: 700, marginBottom: 6, display: "flex", alignItems: "center", gap: 4 }}><FiCpu size={12} /> AI noticed:</p>
              <p style={{ color: "white", fontSize: 13, fontWeight: 600, lineHeight: 1.4 }}>"AC running 4hrs extra daily this week"</p>
              <p style={{ color: "#fbbf24", fontSize: 11, fontWeight: 700, marginTop: 8, display: "flex", alignItems: "center", gap: 4 }}><FiZap size={12} /> Save LKR 1,200/mo with 1 fix</p>
            </div>
          </div>

          {/* Hero content */}
          <div style={{ position: "relative", zIndex: 3, maxWidth: 1200, margin: "0 auto", padding: "120px 24px 80px", width: "100%" }}>
            <div style={{ maxWidth: 680 }}>

              {/* Badge */}
              <div style={{ display: "inline-flex", alignItems: "center", gap: 10, background: "rgba(255,255,255,.1)", border: "1px solid rgba(255,255,255,.2)", backdropFilter: "blur(10px)", borderRadius: 50, padding: "8px 18px", marginBottom: 28 }}>
                <span style={{ width: 8, height: 8, borderRadius: "50%", background: "#4ade80", display: "inline-block", animation: "pulse2 2s ease infinite" }} />
                <span style={{ color: "rgba(255,255,255,.85)", fontSize: 13, fontWeight: 600, display: "flex", alignItems: "center", gap: 6 }}>
                  <FiSmile size={14} /> Welcome — let's save energy together!
                </span>
              </div>

              {/* Headline */}
              <h1 style={{ color: "white", fontWeight: 900, fontSize: "clamp(44px,6vw,72px)", lineHeight: 1.08, marginBottom: 24 }}>
                Stop Guessing<br />
                <span className="gtext">Your Electric Bill.</span><br />
                <span style={{ fontSize: "70%", fontWeight: 700, opacity: 0.85 }}>Master Your Energy Savings.</span>
              </h1>

              {/* Subtext */}
              <p style={{ color: "rgba(255,255,255,.6)", fontSize: 19, lineHeight: 1.7, maxWidth: 540, marginBottom: 32 }}>
                EnergyMate tracks your home's energy, spots wasteful habits, and gives you a personal AI energy coach — all completely free.
              </p>

              {/* Checklist */}
              <div style={{ marginBottom: 40 }}>
                {[
                  "Cut your electricity bill by up to 30%",
                  "AI-powered tips tailored to your exact home",
                  "Know your next bill before it even arrives",
                ].map((item, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12 }}>
                    <div style={{ width: 22, height: 22, borderRadius: "50%", background: "linear-gradient(135deg,#16a34a,#4ade80)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <FiCheck size={12} color="white" strokeWidth={3} />
                    </div>
                    <span style={{ color: "rgba(255,255,255,.85)", fontSize: 15, fontWeight: 500 }}>{item}</span>
                  </div>
                ))}
              </div>

              {/* Buttons */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 14, marginBottom: 40 }}>
                <Link to={user ? "/" : "/register"} className="btn-g" style={{ fontSize: 16, padding: "14px 32px" }}>
                  {user ? "Open Dashboard" : "Create Free Account"}
                  <FiArrowRight />
                </Link>
                <Link to="/ai" className="btn-o" style={{ fontSize: 16, padding: "14px 32px" }}>
                  <FiZap size={16} /> Try AI Hub
                </Link>
              </div>

              {/* Social proof */}
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <div style={{ display: "flex" }}>
                  {["👩", "👨", "🧕", "👩‍🦱", "🧔"].map((a, i) => (
                    <div key={i} style={{ width: 38, height: 38, borderRadius: "50%", border: "2px solid rgba(74,222,128,.5)", background: "rgba(22,101,52,.6)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, marginLeft: i === 0 ? 0 : -10, zIndex: 5 - i }}>
                      {a}
                    </div>
                  ))}
                </div>
                <div>
                  <div style={{ display: "flex", gap: 2, marginBottom: 3 }}>
                    {[...Array(5)].map((_, i) => <FiStar key={i} size={13} color="#fbbf24" fill="#fbbf24" />)}
                  </div>
                  <p style={{ color: "rgba(255,255,255,.45)", fontSize: 12, fontWeight: 600 }}>Trusted by 12,000+ Sri Lankan families</p>
                </div>
              </div>
            </div>
          </div>

          {/* Scroll hint */}
          <div className="sbounce" style={{ position: "absolute", bottom: 28, left: "50%", color: "rgba(255,255,255,.3)", zIndex: 4 }}>
            <FiChevronDown size={22} />
          </div>
        </section>

        {/* ══ PREMIUM SCROLLING TICKER ═══════════════ */}
        <div style={{ background: "#022c22", borderTop: "1px solid rgba(74,222,128,0.2)", borderBottom: "1px solid rgba(74,222,128,0.2)", padding: "16px 0", overflow: "hidden", display: "flex", alignItems: "center" }}>
          <style>{`
            @keyframes tickerScroll {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
            .ticker-text-wrapper {
              display: flex;
              width: max-content;
              animation: tickerScroll 25s linear infinite;
            }
            .ticker-item {
              color: rgba(255,255,255,0.9);
              font-weight: 700;
              font-size: 13px;
              letter-spacing: 0.08em;
              text-transform: uppercase;
              margin: 0 40px;
              white-space: nowrap;
              display: flex;
              align-items: center;
              gap: 12px;
            }
            .ticker-dot {
              color: #4ade80;
              font-size: 16px;
            }
          `}</style>

          <div className="ticker-text-wrapper">
            {[...Array(2)].map((_, i) => (
              <React.Fragment key={i}>
                <span className="ticker-item"><span className="ticker-dot">⚡</span> Reduce Bills</span>
                <span className="ticker-item"><span className="ticker-dot">🌿</span> Sustainable Future</span>
                <span className="ticker-item"><span className="ticker-dot">🧠</span> AI-Powered Insights</span>
                <span className="ticker-item"><span className="ticker-dot">🛡️</span> Real-Time Tracking</span>
                <span className="ticker-item"><span className="ticker-dot">💰</span> Maximize Savings</span>
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* ══ HOW IT WORKS ════════════════════════════ */}
        <section id="how" style={{ padding: "96px 24px", background: "#f9fafb" }}>
          <div style={{ maxWidth: 1100, margin: "0 auto" }}>
            <div style={{ textAlign: "center", marginBottom: 64 }}>
              <span style={{ display: "inline-block", background: "#dcfce7", color: "#15803d", fontSize: 11, fontWeight: 800, padding: "5px 14px", borderRadius: 50, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>How EnergyMate Works</span>
              <h2 style={{ fontWeight: 900, fontSize: "clamp(32px,4vw,46px)", color: "#111", lineHeight: 1.2, marginBottom: 12 }}>
                Up and running in <span style={{ color: "#16a34a" }}>4 simple steps</span>
              </h2>
              <p style={{ color: "#6b7280", fontSize: 18, maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>No tutorial needed. If you can send a WhatsApp message, you can use EnergyMate.</p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))", gap: 24 }}>
              {STEPS.map((s, i) => (
                <div key={i} style={{ padding: "40px 24px", textAlign: "center", borderRadius: 24, position: "relative", boxShadow: "0 10px 40px rgba(0,0,0,.04)", border: "1px solid rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.6)", backdropFilter: "blur(20px)" }}>
                  <div style={{ display: "inline-block", background: "white", border: "1px solid #e5e7eb", color: "#4b5563", padding: "4px 14px", borderRadius: 50, fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, marginBottom: 24, boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>Step {i + 1}</div>
                  <div style={{ width: 80, height: 80, margin: "0 auto 24px", borderRadius: "50%", background: `linear-gradient(135deg, ${s.color}22, ${s.color}11)`, border: `1px solid ${s.color}30`, color: s.color, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 16px 32px ${s.color}15` }}>
                    {React.cloneElement(s.e, { size: 36, strokeWidth: 1.5 })}
                  </div>
                  <h3 style={{ fontWeight: 900, fontSize: 19, color: "#111", marginBottom: 12 }}>{s.title}</h3>
                  <p style={{ color: "#6b7280", fontSize: 15, lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ STATS ════════════════════════════════════ */}
        <section style={{ background: "linear-gradient(135deg,#14532d,#065f46)", padding: "64px 24px", position: "relative", overflow: "hidden" }}>

          {/* Highly Visible Animated Image Background */}
          <style>{`
            @keyframes scrollBackground {
              0% { background-position: 0 0; }
              100% { background-position: -100px -100px; }
            }
          `}</style>
          <div
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0, bottom: 0,
              zIndex: 0,
              opacity: 0.3,
              backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'50\' height=\'50\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%234ade80\' fill-opacity=\'1\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
              backgroundSize: "60px 60px",
              animation: "scrollBackground 6s linear infinite"
            }}
          />
          {/* Subtle overlay to ensure cards remain totally legible */}
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(135deg, rgba(20,83,45,0.7), rgba(6,95,70,0.85))", zIndex: 0 }} />

          <div style={{ position: "relative", zIndex: 1, maxWidth: 1000, margin: "0 auto", display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 40, textAlign: "center" }}>
            {[
              { val: 12000, suf: "+", label: "Happy Families", e: <FiHome size={32} strokeWidth={2} /> },
              { val: 24, suf: ".5%", label: "Average Savings", e: <FiDollarSign size={32} strokeWidth={2} /> },
              { val: 4, suf: " AI Tools", label: "Powered by Gemini", e: <FiCpu size={32} strokeWidth={2} /> },
              { val: 99, suf: "%", label: "Satisfaction Rate", e: <FiStar size={32} strokeWidth={2} /> },
            ].map((s, i) => (
              <div key={i} style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 24, padding: "36px 20px", display: "flex", flexDirection: "column", alignItems: "center", position: "relative", overflow: "hidden", boxShadow: "0 20px 40px rgba(0,0,0,0.2)" }}>
                {/* Subtle top left glow inside card */}
                <div style={{ position: "absolute", top: -30, left: -30, width: 140, height: 140, background: "radial-gradient(circle, rgba(110,231,183,0.12), transparent 70%)", borderRadius: "50%", pointerEvents: "none" }} />

                <div style={{ display: "flex", justifyContent: "center", marginBottom: 20, zIndex: 2 }}>
                  <div style={{ width: 72, height: 72, borderRadius: "50%", background: "linear-gradient(135deg, rgba(255,255,255,0.12), rgba(255,255,255,0.03))", display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid rgba(255,255,255,0.15)", color: "#a7f3d0", boxShadow: "0 12px 32px rgba(0,0,0,0.25)" }}>
                    {s.e}
                  </div>
                </div>
                <p style={{ fontWeight: 900, fontSize: "clamp(36px, 4vw, 44px)", color: "white", lineHeight: 1, zIndex: 2, textShadow: "0 4px 12px rgba(0,0,0,0.2)" }}>
                  <Counter target={s.val} suffix={s.suf} />
                </p>
                <p style={{ color: "rgba(255,255,255,.65)", fontSize: 14, fontWeight: 700, marginTop: 10, zIndex: 2, letterSpacing: "0.03em", textTransform: "uppercase" }}>{s.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ══ FEATURES — bento grid ═══════════════════ */}
        <section id="features" style={{ padding: "96px 24px", background: "white" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>

            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: 56 }}>
              <span style={{ display: "inline-block", background: "#eff6ff", color: "#1d4ed8", fontSize: 11, fontWeight: 800, padding: "5px 14px", borderRadius: 50, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>Platform Features</span>
              <h2 style={{ fontWeight: 900, fontSize: "clamp(30px,4vw,48px)", color: "#111", lineHeight: 1.2, marginBottom: 12 }}>Your Complete Energy Toolkit</h2>
              <p style={{ color: "#6b7280", fontSize: 18, maxWidth: 500, margin: "0 auto" }}>Four powerful tools built to slash your bill — all in one app.</p>
            </div>

            {/* Bento grid — row 1 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>

              {/* BIG card — Smart Dashboard (left, tall) */}
              <Link to="/ai" style={{ textDecoration: "none", gridRow: "span 1" }}>
                <div className="img-wrap" style={{ height: 380, borderRadius: 24, position: "relative" }}>
                  <img src="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=1200&fit=crop" alt="Smart Dashboard" />
                  {/* overlay */}
                  <div style={{ position: "absolute", inset: 0, background: "linear-gradient(160deg, rgba(15,23,42,.2) 0%, rgba(15,23,42,.85) 100%)", borderRadius: 24 }} />
                  {/* content */}
                  <div style={{ position: "absolute", inset: 0, padding: 32, display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(59,130,246,.25)", backdropFilter: "blur(8px)", border: "1px solid rgba(59,130,246,.4)", borderRadius: 50, padding: "5px 14px", marginBottom: 16, width: "fit-content" }}>
                      <FiBarChart2 size={13} color="#93c5fd" />
                      <span style={{ color: "#93c5fd", fontSize: 12, fontWeight: 700 }}>Smart Dashboard</span>
                    </div>
                    <h3 style={{ color: "white", fontWeight: 900, fontSize: 28, lineHeight: 1.25, marginBottom: 10 }}>See your whole home's energy — at a glance</h3>
                    <p style={{ color: "rgba(255,255,255,.65)", fontSize: 15, lineHeight: 1.65, marginBottom: 20 }}>All rooms, appliances, usage trends and billing history organized in one beautiful dashboard.</p>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "#60a5fa", fontSize: 14, fontWeight: 700 }}>
                      Explore Dashboard <FiArrowRight size={14} />
                    </div>
                  </div>
                </div>
              </Link>

              {/* RIGHT column — 2 smaller cards stacked */}
              <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

                {/* AI Coach */}
                <Link to="/ai" style={{ textDecoration: "none", flex: 1 }}>
                  <div className="img-wrap" style={{ height: 180, borderRadius: 24, position: "relative" }}>
                    <img src="https://images.unsplash.com/photo-1677696795873-5f1fb5e9a5cc?q=80&w=900&fit=crop" alt="AI Coach" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?q=80&w=900&fit=crop"; }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(110deg, rgba(5,46,22,.3) 0%, rgba(5,46,22,.88) 100%)", borderRadius: 24 }} />
                    <div style={{ position: "absolute", inset: 0, padding: "24px 28px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(16,185,129,.2)", backdropFilter: "blur(8px)", border: "1px solid rgba(16,185,129,.35)", borderRadius: 50, padding: "4px 12px", marginBottom: 10, width: "fit-content" }}>
                        <FiCpu size={12} color="#6ee7b7" />
                        <span style={{ color: "#6ee7b7", fontSize: 11, fontWeight: 700 }}>AI Energy Coach</span>
                      </div>
                      <h3 style={{ color: "white", fontWeight: 900, fontSize: 20, lineHeight: 1.3, marginBottom: 6 }}>Your personal AI adviser — powered by Gemini</h3>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#4ade80", fontSize: 13, fontWeight: 700 }}>
                        Try it <FiArrowRight size={13} />
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Bill Predictions */}
                <Link to="/ai" style={{ textDecoration: "none", flex: 1 }}>
                  <div className="img-wrap" style={{ height: 180, borderRadius: 24, position: "relative" }}>
                    <img src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=900&fit=crop" alt="Bill Predictions" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1504868584819-f8e8b4b6d7e3?q=80&w=900&fit=crop"; }} />
                    <div style={{ position: "absolute", inset: 0, background: "linear-gradient(110deg, rgba(88,28,135,.3) 0%, rgba(88,28,135,.88) 100%)", borderRadius: 24 }} />
                    <div style={{ position: "absolute", inset: 0, padding: "24px 28px", display: "flex", flexDirection: "column", justifyContent: "flex-end" }}>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(168,85,247,.2)", backdropFilter: "blur(8px)", border: "1px solid rgba(168,85,247,.35)", borderRadius: 50, padding: "4px 12px", marginBottom: 10, width: "fit-content" }}>
                        <FiTarget size={12} color="#d8b4fe" />
                        <span style={{ color: "#d8b4fe", fontSize: 11, fontWeight: 700 }}>Bill Predictions</span>
                      </div>
                      <h3 style={{ color: "white", fontWeight: 900, fontSize: 20, lineHeight: 1.3, marginBottom: 6 }}>Know your next bill before it arrives</h3>
                      <div style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "#c4b5fd", fontSize: 13, fontWeight: 700 }}>
                        See forecast <FiArrowRight size={13} />
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>

            {/* Row 2 — wide bottom card */}
            <Link to="/ai" style={{ textDecoration: "none" }}>
              <div className="img-wrap" style={{ height: 220, borderRadius: 24, position: "relative" }}>
                <img src="https://images.unsplash.com/photo-1554224155-6726b3ff858f?q=80&w=2000&fit=crop" alt="Cost Strategies" onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?q=80&w=2000&fit=crop"; }} />
                <div style={{ position: "absolute", inset: 0, background: "linear-gradient(90deg, rgba(20,83,45,.94) 0%, rgba(20,83,45,.6) 55%, transparent 100%)", borderRadius: 24 }} />
                <div style={{ position: "absolute", inset: 0, padding: "36px 44px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ maxWidth: 520 }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 7, background: "rgba(250,204,21,.15)", backdropFilter: "blur(8px)", border: "1px solid rgba(250,204,21,.3)", borderRadius: 50, padding: "4px 12px", marginBottom: 14 }}>
                      <FiDollarSign size={12} color="#fde68a" />
                      <span style={{ color: "#fde68a", fontSize: 11, fontWeight: 700 }}>Cost Strategies</span>
                    </div>
                    <h3 style={{ color: "white", fontWeight: 900, fontSize: 26, lineHeight: 1.25, marginBottom: 10 }}>
                      Step-by-step plans with real LKR savings — not vague advice
                    </h3>
                    <p style={{ color: "rgba(255,255,255,.65)", fontSize: 15, lineHeight: 1.6 }}>
                      AI creates a personalised cost-cutting plan based on your actual usage patterns and Sri Lankan tariff rates.
                    </p>
                  </div>
                  <div style={{ flexShrink: 0, marginLeft: 32 }}>
                    <div style={{ background: "rgba(255,255,255,.12)", backdropFilter: "blur(12px)", border: "1px solid rgba(255,255,255,.2)", borderRadius: 20, padding: "18px 24px", textAlign: "center", minWidth: 160 }}>
                      <p style={{ color: "white", fontWeight: 900, fontSize: 40, lineHeight: 1, margin: "0 0 4px" }}>30%</p>
                      <p style={{ color: "rgba(255,255,255,.6)", fontSize: 13, fontWeight: 600 }}>avg. bill reduction</p>
                      <div style={{ marginTop: 16 }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(22,163,74,.9)", color: "white", fontWeight: 700, fontSize: 13, padding: "8px 18px", borderRadius: 50 }}>
                          Start saving <FiArrowRight size={13} />
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Link>

          </div>
        </section>

        {/* ══ AI HUB BANNER ═══════════════════════════ */}
        <section style={{ position: "relative", padding: "96px 24px", background: "linear-gradient(155deg,#020c14,#0d2137,#051b2c)", overflow: "hidden" }}>
          {/* Background glow */}
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 600, height: 400, borderRadius: "50%", background: "radial-gradient(ellipse,rgba(16,185,129,.15),transparent 70%)", pointerEvents: "none" }} />
          <div style={{ position: "relative", zIndex: 1, maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: "rgba(16,185,129,.1)", border: "1px solid rgba(16,185,129,.3)", borderRadius: 50, padding: "7px 18px", marginBottom: 28 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", display: "inline-block", animation: "pulse2 2s ease infinite" }} />
              <span style={{ color: "#6ee7b7", fontSize: 13, fontWeight: 700 }}>Powered by Google Gemini AI</span>
            </div>
            <h2 style={{ fontWeight: 900, fontSize: "clamp(34px,5vw,58px)", color: "white", lineHeight: 1.1, marginBottom: 20 }}>
              One hub.<br /><span className="gtext">All your AI tools.</span>
            </h2>
            <p style={{ color: "rgba(255,255,255,.5)", fontSize: 19, maxWidth: 520, margin: "0 auto 40px", lineHeight: 1.7 }}>
              Recommendations, Energy Tips, Cost Strategies and Predictions — beautifully organized in one place.
            </p>
            <Link to="/ai" className="btn-g" style={{ fontSize: 17, padding: "16px 40px", boxShadow: "0 10px 40px rgba(16,185,129,.5)" }}>
              <FiZap size={18} /> Launch AI Hub
            </Link>
          </div>
        </section>

        {/* ══ TESTIMONIALS ════════════════════════════ */}
        {reviews.length > 0 && (
          <section id="love" style={{ padding: "48px 24px", background: "#f9fafb" }}>
            <div style={{ maxWidth: 1100, margin: "0 auto" }}>
              <div style={{ textAlign: "center", marginBottom: 32 }}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#fef9c3", color: "#854d0e", fontSize: 11, fontWeight: 800, padding: "5px 14px", borderRadius: 50, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 16 }}>
                  <FiHeart size={12} fill="currentColor" /> Real Stories
                </span>
                <h2 style={{ fontWeight: 900, fontSize: "clamp(32px,4vw,46px)", color: "#111", lineHeight: 1.2, marginBottom: 12 }}>Sri Lankan Families Love EnergyMate</h2>
                <p style={{ color: "#6b7280", fontSize: 18, maxWidth: 440, margin: "0 auto" }}>Real results from real people — not made-up marketing numbers.</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(280px,1fr))", gap: 24 }}>
                {reviews.map((t, i) => (
                  <div key={i} className="tcard">
                    <div style={{ display: "flex", gap: 4, marginBottom: 18 }}>
                      {[...Array(t.rating || 5)].map((_, j) => <FiStar key={j} size={16} color="#fbbf24" fill="#fbbf24" />)}
                    </div>
                    <p style={{ color: "#374151", fontSize: 15, lineHeight: 1.75, fontStyle: "italic", marginBottom: 24 }}>"{t.message}"</p>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 44, height: 44, borderRadius: "50%", background: "#f0fdf4", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: "bold", color: "#166534" }}>
                        {t.name ? t.name[0].toUpperCase() : "U"}
                      </div>
                      <div>
                        <p style={{ fontWeight: 800, fontSize: 15, color: "#111", margin: 0 }}>{t.name || "Anonymous"}</p>
                        <p style={{ color: "#9ca3af", fontSize: 12, fontWeight: 600, margin: "2px 0 0" }}>Member since {new Date(t.createdAt).getFullYear()}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* ══ ARTICLES SECTION ════════════════════════ */}
        <section style={{ padding: "0 24px 64px", background: "#f9fafb" }}>
          <div style={{ maxWidth: 1200, margin: "0 auto" }}>

            {/* Static + Dynamic articles header */}
            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 16, marginBottom: 48 }}>
              <div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "#dcfce7", color: "#15803d", fontSize: 11, fontWeight: 800, padding: "5px 14px", borderRadius: 50, letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 14 }}>
                  <FiZap size={13} fill="currentColor" /> Expert Knowledge
                </span>
                <h2 style={{ fontWeight: 900, fontSize: "clamp(26px,3.5vw,40px)", color: "#111", lineHeight: 1.2, margin: 0 }}>
                  Insights & Guides
                </h2>
              </div>
              <Link to="/ai" style={{ display: "inline-flex", alignItems: "center", gap: 7, color: "#16a34a", fontWeight: 700, fontSize: 14, textDecoration: "none", padding: "10px 20px", background: "#f0fdf4", borderRadius: 50, border: "1px solid #bbf7d0" }}>
                Explore AI Tools <FiArrowRight size={14} />
              </Link>
            </div>

            {/* Loading skeletons */}
            {postsLoading && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: 24 }}>
                {[1, 2, 3].map((k) => (
                  <div key={k} style={{ borderRadius: 20, overflow: "hidden", background: "white", border: "1px solid #f1f5f9" }}>
                    <div style={{ height: 200, background: "linear-gradient(90deg,#f1f5f9 25%,#e2e8f0 50%,#f1f5f9 75%)", backgroundSize: "200% 100%", animation: "shimmer 1.5s infinite" }} />
                    <div style={{ padding: "18px 20px" }}>
                      {[40, 100, 75, 30].map((w, i) => (
                        <div key={i} style={{ height: i === 0 ? 10 : 14, borderRadius: 6, background: "#f1f5f9", marginBottom: 10, width: `${w}%` }} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Combined articles grid (static + admin posts) */}
            {!postsLoading && (() => {
              // Use only real admin posts
              const allPosts = posts.map(p => ({
                _id: p._id,
                image: `http://localhost:5001${p.image}`,
                date: new Date(p.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" }),
                tag: "💡 Insights",
                tagColor: "#eef2ff",
                tagText: "#4338ca",
                title: p.title,
                summary: p.summary,
                author: p.author?.name || "Admin",
                link: `/news/${p._id}`,
              }));
              if (allPosts.length === 0) {
                return (
                  <div className="card !py-12 border-dashed border-2 flex flex-col items-center justify-center text-center">
                    <div className="text-gray-300 mb-4"><FiFileText size={48} /></div>
                    <h3 className="text-xl font-bold text-gray-800">No updates yet</h3>
                    <p className="text-gray-500 max-w-xs mx-auto">Check back soon for the latest energy-saving news and guide updates from our team.</p>
                  </div>
                );
              }

              return (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(290px,1fr))", gap: 24 }}>
                  {allPosts.map((article, idx) => (
                    <Link
                      key={article._id}
                      to={article.link}
                      style={{ textDecoration: "none" }}
                    >
                      <div
                        className="card"
                        style={{
                          background: "white",
                          overflow: "hidden",
                          height: "100%",
                          display: "flex",
                          flexDirection: "column",
                          boxShadow: "0 2px 16px rgba(0,0,0,.06)",
                        }}
                      >
                        {/* Image */}
                        <div className="img-wrap" style={{ height: 200, position: "relative", flexShrink: 0 }}>
                          <img
                            src={article.image}
                            alt={article.title}
                            style={{ objectFit: "cover", width: "100%", height: "100%", filter: "none" }}
                            onError={(e) => { e.target.src = "https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=800&fit=crop"; }}
                          />
                          {/* Very subtle overlay */}
                          <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,.03)" }} />
                          {/* Date */}
                          <div style={{ position: "absolute", bottom: 12, left: 14 }}>
                            <span style={{ color: "rgba(255,255,255,.9)", fontSize: 11, fontWeight: 700, background: "rgba(0,0,0,.4)", backdropFilter: "blur(6px)", padding: "3px 8px", borderRadius: 6 }}>
                              {article.date}
                            </span>
                          </div>
                          {/* Author (admin posts only) */}
                          {article.author && (
                            <div style={{ position: "absolute", bottom: 12, right: 14 }}>
                              <span style={{ color: "white", fontSize: 11, fontWeight: 700, background: "rgba(22,163,74,.8)", backdropFilter: "blur(6px)", padding: "3px 8px", borderRadius: 6 }}>
                                ✍️ {article.author}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Content */}
                        <div style={{ padding: "18px 20px", flex: 1, display: "flex", flexDirection: "column" }}>
                          {/* Tag pill */}
                          <span style={{ display: "inline-block", background: article.tagColor, color: article.tagText, fontSize: 11, fontWeight: 700, padding: "3px 10px", borderRadius: 50, marginBottom: 10 }}>
                            {article.tag}
                          </span>
                          <h3 style={{ fontWeight: 800, fontSize: 16, color: "#111", lineHeight: 1.45, marginBottom: 8, flex: 1 }}>
                            {article.title}
                          </h3>
                          <p style={{ color: "#6b7280", fontSize: 13, lineHeight: 1.65, marginBottom: 16, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                            {article.summary}
                          </p>
                          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "#16a34a", fontSize: 13, fontWeight: 700 }}>
                            Read article <FiArrowRight size={13} />
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              );
            })()}
          </div>
        </section>

        {/* ══ FINAL CTA ════════════════════════════════ */}
        <section style={{ position: "relative", padding: "96px 24px", overflow: "hidden" }}>
          <img src="https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?q=80&w=2100&fit=crop" alt="" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover" }} />
          <div style={{ position: "absolute", inset: 0, background: "rgba(5,46,22,.88)" }} />
          <div style={{ position: "relative", zIndex: 1, maxWidth: 680, margin: "0 auto", textAlign: "center" }}>
            <div style={{ fontSize: 56, marginBottom: 20 }}>🌿</div>
            <h2 style={{ fontWeight: 900, fontSize: "clamp(32px,5vw,54px)", color: "white", lineHeight: 1.15, marginBottom: 18 }}>
              Ready to take control of<br />
              <span style={{ color: "#4ade80" }}>your energy bill?</span>
            </h2>
            <p style={{ color: "rgba(255,255,255,.55)", fontSize: 19, maxWidth: 500, margin: "0 auto 36px", lineHeight: 1.7 }}>
              Join 12,000+ Sri Lankan families who are already saving money and living more sustainably.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 14, marginBottom: 20 }}>
              <Link to={user ? "/" : "/register"} className="btn-g" style={{ fontSize: 17, padding: "15px 36px" }}>
                {user ? "Go to Dashboard" : "Join Free Today"} <FiArrowRight />
              </Link>
              <Link to="/ai" className="btn-o" style={{ fontSize: 17, padding: "15px 36px" }}>
                <FiZap size={17} /> Explore AI Hub
              </Link>
            </div>
            <p style={{ color: "rgba(255,255,255,.25)", fontSize: 13 }}>No credit card required • Free forever for individuals</p>
          </div>
        </section>

        {/* ══ FOOTER ═══════════════════════════════════ */}
        <footer style={{ background: "#020c07", padding: "48px 24px", textAlign: "center" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 16 }}>
            <img src="/logo.png" alt="EnergyMate" style={{ width: 32, height: 32, borderRadius: 8, objectFit: "cover" }} />
            <span style={{ color: "white", fontWeight: 900, fontSize: 16 }}>Energy<span style={{ color: "#16a34a" }}>Mate</span></span>
          </div>
          <p style={{ color: "rgba(255,255,255,.2)", fontSize: 14, marginBottom: 4 }}>© 2026 EnergyMate — Sri Lanka Sustainable Energy Initiative</p>
          <p style={{ color: "rgba(255,255,255,.1)", fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>Built with <FiHeart size={10} fill="currentColor" /> for our Group Project • Powered by Google Gemini AI</p>
        </footer>
      </div>
    </>
  );
}
