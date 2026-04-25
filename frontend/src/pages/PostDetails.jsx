// src/pages/PostDetails.jsx
import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { getPostById, getPosts } from "../services/postService";
import { FiArrowLeft, FiCalendar, FiUser, FiClock, FiHeart, FiArrowRight } from "react-icons/fi";

const BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5001";

export default function PostDetails() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [related, setRelated] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    const fetchAll = async () => {
      try {
        const [postRes, allRes] = await Promise.all([
          getPostById(id),
          getPosts(),
        ]);
        const p = postRes.data?.data || postRes.data;
        const all = Array.isArray(allRes.data?.data) ? allRes.data.data
          : Array.isArray(allRes.data) ? allRes.data : [];
        setPost(p);
        setRelated(all.filter(x => x._id !== p?._id).slice(0, 4));
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load the article.");
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const readingTime = post
    ? Math.max(1, Math.ceil(post.content.split(/\s+/).length / 200))
    : 0;

  /* ── Loading ─────────────────────────────────── */
  if (loading) return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "#f8fafc", fontFamily: "system-ui,sans-serif" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ width: 44, height: 44, border: "4px solid #dcfce7", borderTop: "4px solid #16a34a", borderRadius: "50%", animation: "spin .8s linear infinite", margin: "0 auto 14px" }} />
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        <p style={{ color: "#64748b", fontWeight: 600, fontSize: 14 }}>Loading article...</p>
      </div>
    </div>
  );

  /* ── Error ───────────────────────────────────── */
  if (error || !post) return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 12, fontFamily: "system-ui,sans-serif" }}>
      <div style={{ fontSize: 52 }}>😕</div>
      <h2 style={{ fontWeight: 800, fontSize: 22, color: "#1e293b", margin: 0 }}>Article not found</h2>
      <p style={{ color: "#64748b", margin: 0 }}>{error || "This article may have been removed."}</p>
      <Link to="/home" style={{ marginTop: 8, display: "inline-flex", alignItems: "center", gap: 7, padding: "10px 22px", background: "#16a34a", color: "white", fontWeight: 700, borderRadius: 50, textDecoration: "none", fontSize: 14 }}>
        <FiArrowLeft size={14} /> Back to Home
      </Link>
    </div>
  );

  const paragraphs = post.content.split("\n").map(p => p.trim()).filter(Boolean);

  return (
    <div style={{ minHeight: "100vh", background: "white", fontFamily: "'Plus Jakarta Sans',system-ui,sans-serif", color: "#1e293b" }}>

      {/* ── Sticky Nav ─────────────────────────── */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(2,44,58,0.97)", backdropFilter: "blur(16px)",
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        padding: "0 32px", height: 56,
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <Link to="/home"
          style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.75)", fontWeight: 600, fontSize: 14, textDecoration: "none" }}
          onMouseEnter={e => e.currentTarget.style.color = "#4ade80"}
          onMouseLeave={e => e.currentTarget.style.color = "rgba(255,255,255,0.75)"}
        >
          <FiArrowLeft size={15} /> Back to EnergyMate
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ width: 28, height: 28, background: "#16a34a", borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 13 }}>E</div>
          <span style={{ color: "white", fontWeight: 800, fontSize: 15 }}>Energy<span style={{ color: "#4ade80" }}>Mate</span></span>
        </div>
      </nav>

      {/* ── Hero Image — blurred sides fix ─────── */}
      <div style={{ position: "relative", width: "100%", height: 460, overflow: "hidden", background: "#0a0a0a" }}>
        {/* Blurred background layer — fills black/white side bars */}
        <div style={{
          position: "absolute", inset: 0,
          backgroundImage: `url(${BASE_URL}${post.image})`,
          backgroundSize: "cover", backgroundPosition: "center",
          filter: "blur(22px) brightness(0.35)",
          transform: "scale(1.12)",
        }} />
        {/* Actual image centered */}
        <img
          src={`${BASE_URL}${post.image}`}
          alt={post.title}
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center center" }}
          onError={e => { e.target.src = "https://placehold.co/1200x460/022c3a/10b981?text=EnergyMate"; }}
        />
        {/* Bottom gradient */}
        <div style={{ position: "absolute", inset: 0, background: "linear-gradient(to top, rgba(2,12,20,0.88) 0%, rgba(2,12,20,0.4) 50%, rgba(2,12,20,0.1) 100%)" }} />

        {/* Overlay content */}
        <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "28px 48px", maxWidth: 900 }}>
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(22,163,74,0.2)", border: "1px solid rgba(22,163,74,0.4)", color: "#4ade80", fontSize: 11, fontWeight: 800, padding: "4px 13px", borderRadius: 50, letterSpacing: "0.07em", textTransform: "uppercase", marginBottom: 14 }}>
            ✦ Insights &amp; Guides
          </span>
          <h1 style={{ fontSize: "clamp(22px,3vw,40px)", fontWeight: 900, color: "white", lineHeight: 1.2, letterSpacing: "-0.02em", marginBottom: 16, maxWidth: 780, textShadow: "0 2px 12px rgba(0,0,0,0.5)" }}>
            {post.title}
          </h1>
          <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
              <div style={{ width: 30, height: 30, borderRadius: "50%", background: "rgba(22,163,74,0.25)", border: "1px solid rgba(22,163,74,0.4)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FiUser size={13} color="#4ade80" />
              </div>
              <span style={{ color: "white", fontWeight: 700, fontSize: 13 }}>{post.author?.name || "EnergyMate Team"}</span>
            </div>
            <span style={{ color: "rgba(255,255,255,0.4)" }}>•</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: 600 }}>
              <FiCalendar size={12} />
              {new Date(post.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </div>
            <span style={{ color: "rgba(255,255,255,0.4)" }}>•</span>
            <div style={{ display: "flex", alignItems: "center", gap: 5, color: "rgba(255,255,255,0.65)", fontSize: 13, fontWeight: 600 }}>
              <FiClock size={12} /> {readingTime} min read
            </div>
          </div>
        </div>
      </div>

      {/* ── Body + Sidebar ─────────────────────── */}
      <div style={{ maxWidth: 1180, margin: "0 auto", padding: "48px 24px 64px", display: "grid", gridTemplateColumns: "1fr 340px", gap: 48, alignItems: "start" }}>

        {/* ── LEFT: Article content ────────────── */}
        <main>
          {/* Lead quote */}
          <div style={{ borderLeft: "4px solid #16a34a", paddingLeft: 22, marginBottom: 36 }}>
            <p style={{ fontSize: "clamp(15px,1.6vw,19px)", fontWeight: 400, color: "#475569", lineHeight: 1.85, fontStyle: "italic", margin: 0 }}>
              {post.summary}
            </p>
          </div>

          {/* Dot divider */}
          <div style={{ display: "flex", alignItems: "center", gap: 14, marginBottom: 36 }}>
            <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
            <div style={{ width: 7, height: 7, borderRadius: "50%", background: "#16a34a" }} />
            <div style={{ flex: 1, height: 1, background: "#f1f5f9" }} />
          </div>

          {/* Paragraphs */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {paragraphs.map((para, i) => (
              <p key={i} style={{ fontSize: 17, color: "#374151", lineHeight: 1.9, margin: 0, fontWeight: 400 }}>
                {para}
              </p>
            ))}
          </div>

          {/* Bottom author */}
          <div style={{ marginTop: 52, paddingTop: 24, borderTop: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: "#dcfce7", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <FiUser size={17} color="#16a34a" />
              </div>
              <div>
                <p style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "#0f172a" }}>{post.author?.name || "EnergyMate Team"}</p>
                <p style={{ margin: 0, fontSize: 12, color: "#94a3b8", fontWeight: 500 }}>
                  {new Date(post.createdAt).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
                </p>
              </div>
            </div>
            <Link to="/home" style={{ display: "inline-flex", alignItems: "center", gap: 7, padding: "9px 18px", background: "#f8fafc", border: "1px solid #e2e8f0", color: "#475569", fontWeight: 700, fontSize: 13, borderRadius: 50, textDecoration: "none" }}>
              <FiArrowLeft size={13} /> More Articles
            </Link>
          </div>
        </main>

        {/* ── RIGHT: Sidebar ───────────────────── */}
        <aside style={{ position: "sticky", top: 72 }}>

          {/* Related posts */}
          {related.length > 0 && (
            <div style={{ background: "white", border: "1px solid #f1f5f9", borderRadius: 20, overflow: "hidden", boxShadow: "0 4px 24px rgba(0,0,0,0.06)" }}>
              <div style={{ padding: "18px 20px", borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <h3 style={{ margin: 0, fontWeight: 800, fontSize: 14, color: "#0f172a" }}>More Articles</h3>
                <Link to="/home" style={{ fontSize: 12, fontWeight: 700, color: "#16a34a", textDecoration: "none", display: "flex", alignItems: "center", gap: 4 }}>
                  View all <FiArrowRight size={11} />
                </Link>
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                {related.map((p, i) => (
                  <Link
                    key={p._id}
                    to={`/news/${p._id}`}
                    style={{ textDecoration: "none", display: "flex", gap: 14, padding: "16px 20px", borderBottom: i < related.length - 1 ? "1px solid #f8fafc" : "none", transition: "background .2s" }}
                    onMouseEnter={e => e.currentTarget.style.background = "#f8fafc"}
                    onMouseLeave={e => e.currentTarget.style.background = "white"}
                  >
                    {/* Thumbnail */}
                    <div style={{ width: 72, height: 72, borderRadius: 12, overflow: "hidden", flexShrink: 0, background: "#f1f5f9" }}>
                      <img
                        src={`${BASE_URL}${p.image}`}
                        alt={p.title}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={e => { e.target.src = "https://placehold.co/72x72/dcfce7/16a34a?text=E"; }}
                      />
                    </div>
                    {/* Text */}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 10, color: "#16a34a", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Insights
                      </p>
                      <h4 style={{ margin: "0 0 6px", fontWeight: 700, fontSize: 14, color: "#0f172a", lineHeight: 1.4, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {p.title}
                      </h4>
                      <p style={{ margin: 0, fontSize: 11, color: "#94a3b8", fontWeight: 600 }}>
                        {new Date(p.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </p>
                    </div>
                  </Link>
                ))}
              </div>

              <div style={{ padding: "14px 20px", borderTop: "1px solid #f1f5f9", background: "#f8fafc" }}>
                <Link to="/home" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6, color: "#16a34a", fontWeight: 700, fontSize: 13, textDecoration: "none" }}>
                  Explore AI Tools <FiArrowRight size={13} />
                </Link>
              </div>
            </div>
          )}

          {/* CTA Card */}
          <div style={{ marginTop: 20, background: "linear-gradient(135deg,#052e16,#065f46)", borderRadius: 20, padding: "24px 20px", textAlign: "center" }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⚡</div>
            <h4 style={{ color: "white", fontWeight: 800, fontSize: 16, margin: "0 0 8px" }}>Save on Your Energy Bill</h4>
            <p style={{ color: "rgba(255,255,255,0.6)", fontSize: 13, lineHeight: 1.6, margin: "0 0 16px" }}>
              Get AI-powered tips tailored to your home's exact usage.
            </p>
            <Link to="/ai" style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "10px 20px", background: "#16a34a", color: "white", fontWeight: 700, fontSize: 13, borderRadius: 50, textDecoration: "none", boxShadow: "0 4px 16px rgba(22,163,74,0.4)" }}>
              Try AI Hub <FiArrowRight size={13} />
            </Link>
          </div>

        </aside>
      </div>

      {/* ── Footer ─────────────────────────────── */}
      <footer style={{ background: "#011e28", borderTop: "1px solid #022c3a", padding: "36px 24px", textAlign: "center" }}>
        <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <div style={{ width: 26, height: 26, background: "#16a34a", borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 900, fontSize: 12 }}>E</div>
          <span style={{ color: "white", fontWeight: 800, fontSize: 15 }}>Energy<span style={{ color: "#4ade80" }}>Mate</span></span>
        </div>
        <p style={{ color: "rgba(255,255,255,0.3)", fontSize: 13, margin: "0 0 4px", fontWeight: 500 }}>
          © 2026 EnergyMate — Sri Lanka Sustainable Energy Initiative
        </p>
        <p style={{ color: "rgba(255,255,255,0.15)", fontSize: 12, margin: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 4 }}>
          Developed with <FiHeart size={10} style={{ fill: "#ef4444", color: "#ef4444" }} /> for a greener Sri Lanka
        </p>
      </footer>
    </div>
  );
}