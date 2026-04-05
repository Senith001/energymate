import React, { useEffect, useState } from "react";

function FeedbackPage() {
  const defaultFeedback = {
    subject: "Good Dashboard UI",
    category: "Dashboard",
    rating: "4",
    message: "Dashboard layout is simple, clean, and easy to understand.",
    date: "2026-04-01",
    status: "Reviewed",
  };

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Dashboard");
  const [rating, setRating] = useState("5");
  const [message, setMessage] = useState("");

  const [lastFeedback, setLastFeedback] = useState(() => {
    const savedFeedback = localStorage.getItem("lastFeedback");
    return savedFeedback ? JSON.parse(savedFeedback) : defaultFeedback;
  });

  useEffect(() => {
    localStorage.setItem("lastFeedback", JSON.stringify(lastFeedback));
  }, [lastFeedback]);

  const pageCard = {
    background: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
    padding: "24px",
  };

  const fieldCard = (bg) => ({
    background: bg,
    borderRadius: "18px",
    padding: "18px",
  });

  const inputStyle = {
    width: "100%",
    padding: "14px 16px",
    borderRadius: "14px",
    border: "1px solid #d1d5db",
    fontSize: "16px",
    outline: "none",
    boxSizing: "border-box",
    background: "#ffffff",
  };

  const handleSubmitFeedback = () => {
    if (subject.trim() === "" || message.trim() === "") {
      alert("Please fill all fields");
      return;
    }

    const today = new Date().toISOString().split("T")[0];

    const newFeedback = {
      subject,
      category,
      rating,
      message,
      date: today,
      status: "Submitted",
    };

    setLastFeedback(newFeedback);

    setSubject("");
    setCategory("Dashboard");
    setRating("5");
    setMessage("");

    alert("Feedback submitted successfully");
  };

  const getRatingStars = (value) => {
    const count = parseInt(value, 10);
    return "⭐".repeat(count);
  };

  return (
    <div style={{ background: "#f3f4f6", minHeight: "100vh", padding: "10px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "48px",
              fontWeight: "800",
              margin: "0 0 8px 0",
              color: "#111827",
            }}
          >
            Feedback
          </h1>
          <p style={{ margin: 0, fontSize: "20px", color: "#374151" }}>
            Share your experience and suggestions about the system 💬
          </p>
        </div>

        <button
          onClick={handleSubmitFeedback}
          style={{
            background: "#0b8f3a",
            color: "white",
            border: "none",
            borderRadius: "16px",
            padding: "16px 24px",
            fontSize: "18px",
            fontWeight: "700",
            cursor: "pointer",
            boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
          }}
        >
          Submit Feedback
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.3fr 0.7fr",
          gap: "20px",
        }}
      >
        <div style={pageCard}>
          <h2
            style={{
              fontSize: "30px",
              margin: "0 0 18px 0",
              color: "#111827",
            }}
          >
            Feedback Form
          </h2>

          <div style={{ display: "grid", gap: "18px" }}>
            <div style={fieldCard("#fbf5e7")}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                Subject
              </label>
              <input
                type="text"
                placeholder="Enter feedback subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                style={inputStyle}
              />
            </div>

            <div style={fieldCard("#e8f7ed")}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                Category
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

            <div style={fieldCard("#eef2ff")}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                Rating
              </label>
              <select
                value={rating}
                onChange={(e) => setRating(e.target.value)}
                style={inputStyle}
              >
                <option value="5">5 - Excellent</option>
                <option value="4">4 - Good</option>
                <option value="3">3 - Average</option>
                <option value="2">2 - Poor</option>
                <option value="1">1 - Very Poor</option>
              </select>
            </div>

            <div style={fieldCard("#fdf2f8")}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                Message
              </label>
              <textarea
                rows="6"
                placeholder="Write your feedback here"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                style={{ ...inputStyle, resize: "none" }}
              ></textarea>
            </div>
          </div>
        </div>

        <div style={pageCard}>
          <h2
            style={{
              fontSize: "28px",
              margin: "0 0 18px 0",
              color: "#111827",
            }}
          >
            Your Last Feedback
          </h2>

          <div
            style={{
              background: "#fbf5e7",
              borderRadius: "18px",
              padding: "18px",
              marginBottom: "16px",
            }}
          >
            <div style={{ fontSize: "32px", marginBottom: "10px" }}>⭐</div>
            <h3 style={{ margin: "0 0 8px 0", fontSize: "24px", color: "#111827" }}>
              {lastFeedback.subject}
            </h3>
            <p style={{ margin: "0 0 8px 0", color: "#d97706", fontWeight: "700" }}>
              Rating: {getRatingStars(lastFeedback.rating)} ({lastFeedback.rating}/5)
            </p>
            <p style={{ margin: "0 0 8px 0", color: "#374151", fontWeight: "600" }}>
              Category: {lastFeedback.category}
            </p>
            <p style={{ margin: 0, color: "#374151", lineHeight: 1.6 }}>
              {lastFeedback.message}
            </p>
          </div>

          <div
            style={{
              background: "#e8f7ed",
              borderRadius: "18px",
              padding: "18px",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", fontSize: "22px", color: "#111827" }}>
              Feedback Status
            </h3>
            <p style={{ margin: "0 0 8px 0", color: "#374151" }}>
              Submitted Date: {lastFeedback.date}
            </p>
            <p style={{ margin: 0, color: "#166534", fontWeight: "700" }}>
              Status: {lastFeedback.status}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FeedbackPage;