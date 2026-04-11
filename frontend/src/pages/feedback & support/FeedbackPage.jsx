import React, { useEffect, useState } from "react";
import api from "../../services/api";
import { useAuth } from "../../context/AuthContext";

function FeedbackPage() {
  const { user } = useAuth();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Dashboard");
  const [rating, setRating] = useState("5");
  const [message, setMessage] = useState("");
  const [lastFeedback, setLastFeedback] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchLastFeedback = async () => {
    try {
      setLoading(true);
      const response = await api.get("/feedback/my");
      if (response.data && response.data.length > 0) {
        setLastFeedback(response.data[0]); // Most recent
      }
    } catch (error) {
      console.error("Failed to fetch feedback history:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLastFeedback();
  }, []);

  const handleSubmitFeedback = async () => {
    if (subject.trim() === "" || message.trim() === "") {
      alert("Please fill all fields");
      return;
    }

    try {
      const payload = {
        name: user?.name || "User",
        email: user?.email || "",
        subject,
        category,
        rating: Number(rating),
        message,
      };

      await api.post("/feedback", payload);
      
      setSubject("");
      setCategory("Dashboard");
      setRating("5");
      setMessage("");

      alert("Feedback submitted successfully");
      fetchLastFeedback(); // Refresh the card
    } catch (error) {
      console.error("Failed to submit feedback:", error);
      alert("Error submitting feedback. Please try again.");
    }
  };

  const getRatingStars = (value) => {
    const count = parseInt(value, 10);
    return "⭐".repeat(count);
  };

  const containerStyle = {
    background: "linear-gradient(135deg, #f0fdf4 0%, #e0f2fe 100%)",
    minHeight: "100vh",
    padding: "40px",
    fontFamily: "'Outfit', 'Inter', sans-serif",
    color: "#1e293b",
  };

  const glassPanel = {
    background: "rgba(255, 255, 255, 0.7)",
    backdropFilter: "blur(12px)",
    WebkitBackdropFilter: "blur(12px)",
    borderRadius: "32px",
    border: "1px solid rgba(255, 255, 255, 0.4)",
    boxShadow: "0 10px 40px rgba(0,0,0,0.04)",
    padding: "32px",
  };

  const fieldCard = (bg) => ({
    background: "white",
    borderRadius: "20px",
    padding: "24px",
    border: "1px solid #f1f5f9",
    boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
    transition: "all 0.2s ease",
  });

  const inputStyle = {
    width: "100%",
    padding: "16px 20px",
    borderRadius: "16px",
    border: "2px solid #f1f5f9",
    fontSize: "17px",
    fontWeight: "500",
    outline: "none",
    boxSizing: "border-box",
    background: "#f8fafc",
    transition: "border-color 0.2s, box-shadow 0.2s",
    marginTop: "10px",
  };

  if (loading) return (
    <div style={{ ...containerStyle, display: "flex", justifyContent: "center", alignItems: "center" }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ fontSize: "50px", animation: "pulse 2s infinite" }}>💬</div>
        <h2 style={{ fontWeight: "600", color: "#059669" }}>Processing User Voice...</h2>
      </div>
    </div>
  );

  return (
    <div style={containerStyle}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-end",
          marginBottom: "48px",
          gap: "16px",
        }}
      >
        <div>
          <span style={{ background: "#dcfce7", color: "#166534", padding: "6px 14px", borderRadius: "999px", fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px" }}>
            Community Support
          </span>
          <h1
            style={{
              fontSize: "56px",
              fontWeight: "900",
              margin: "12px 0 8px 0",
              color: "#0f172a",
              letterSpacing: "-1px"
            }}
          >
            Feedback
          </h1>
          <p style={{ margin: 0, fontSize: "22px", color: "#64748b" }}>
            Help us refine the EnergyMate experience 
          </p>
        </div>

        <button
          onClick={handleSubmitFeedback}
          style={{
            background: "linear-gradient(to right, #10b981, #059669)", 
            color: "white", 
            border: "none",
            borderRadius: "20px",
            padding: "18px 36px",
            fontSize: "18px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "0 10px 25px rgba(16, 185, 129, 0.4)",
          }}
        >
          Submit Contribution
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 0.8fr",
          gap: "32px",
        }}
      >
        <div style={glassPanel}>
          <h2
            style={{
              fontSize: "32px",
              fontWeight: "900",
              margin: "0 0 32px 0",
              color: "#0f172a",
              letterSpacing: "-1px"
            }}
          >
            New Entry
          </h2>

          <div style={{ display: "grid", gap: "24px" }}>
            <div style={fieldCard()}>
              <label
                style={{
                  display: "block",
                  fontWeight: "800",
                  color: "#475569",
                  fontSize: "15px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}
              >
                Subject
              </label>
              <input
                type="text"
                placeholder="What's this about?"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
              <div style={fieldCard()}>
                <label
                  style={{
                    display: "block",
                    fontWeight: "800",
                    color: "#475569",
                    fontSize: "15px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}
                >
                  Feature Area
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  style={inputStyle}
                >
                  <option>Dashboard</option>
                  <option>Rooms</option>
                  <option>Appliances</option>
                  <option>Support</option>
                  <option>Other</option>
                </select>
              </div>

              <div style={fieldCard()}>
                <label
                  style={{
                    display: "block",
                    fontWeight: "800",
                    color: "#475569",
                    fontSize: "15px",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px"
                  }}
                >
                  System Rating
                </label>
                <select
                  value={rating}
                  onChange={(e) => setRating(e.target.value)}
                  style={inputStyle}
                >
                  <option value="5">⭐⭐⭐⭐⭐ Excellent</option>
                  <option value="4">⭐⭐⭐⭐ Good</option>
                  <option value="3">⭐⭐⭐ Average</option>
                  <option value="2">⭐⭐ Poor</option>
                  <option value="1">⭐ Very Poor</option>
                </select>
              </div>
            </div>

            <div style={fieldCard()}>
              <label
                style={{
                  display: "block",
                  fontWeight: "800",
                  color: "#475569",
                  fontSize: "15px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}
              >
                Detailed Message
              </label>
              <textarea
                rows="6"
                placeholder="Share your thoughts or report an issue..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{ ...inputStyle, resize: "none" }}
              ></textarea>
            </div>
          </div>
        </div>

        <div style={glassPanel}>
          <h2
            style={{
              fontSize: "28px",
              fontWeight: "900",
              margin: "0 0 24px 0",
              color: "#0f172a",
              letterSpacing: "-1px"
            }}
          >
            Your Highlights
          </h2>

          {!lastFeedback ? (
            <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
              <p>You haven't submitted any feedback yet. Share your thoughts using the form!</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div
                style={{
                  background: "white",
                  borderRadius: "24px",
                  padding: "24px",
                  border: "1px solid #f1f5f9",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.02)",
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "16px" }}>⭐</div>
                <h3 style={{ margin: "0 0 8px 0", fontSize: "22px", fontWeight: "800", color: "#1e293b" }}>
                  {lastFeedback.subject}
                </h3>
                <div style={{ display: "flex", gap: "12px", marginBottom: "16px", flexWrap: "wrap" }}>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#d97706", background: "#fff7ed", padding: "4px 10px", borderRadius: "8px" }}>
                    {getRatingStars(lastFeedback.rating)}
                  </span>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#0284c7", background: "#f0f9ff", padding: "4px 10px", borderRadius: "8px" }}>
                    {lastFeedback.category}
                  </span>
                </div>
                <p style={{ margin: 0, color: "#475569", lineHeight: 1.6, fontSize: "15px" }}>
                  {lastFeedback.message}
                </p>
              </div>

              <div
                style={{
                  background: "rgba(16, 185, 129, 0.05)",
                  borderRadius: "24px",
                  padding: "24px",
                  border: "1px solid rgba(16, 185, 129, 0.1)",
                }}
              >
                <h3 style={{ margin: "0 0 12px 0", fontSize: "18px", fontWeight: "800", color: "#065f46" }}>
                  Official Response
                </h3>
                <p style={{ margin: "0 0 12px 0", color: "#065f46", fontSize: "14px", fontWeight: "600" }}>
                  Submitted: {new Date(lastFeedback.createdAt).toLocaleDateString()}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                   <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10b981" }}></span>
                   <span style={{ color: "#059669", fontWeight: "800", fontSize: "14px", textTransform: "uppercase", letterSpacing: "1px" }}>
                     Status: {lastFeedback.status}
                   </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default FeedbackPage;