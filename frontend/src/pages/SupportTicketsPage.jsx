import React from "react";

function SupportTicketsPage() {
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

  const badgeStyle = (bg, color = "#111827") => ({
    display: "inline-block",
    background: bg,
    color,
    borderRadius: "999px",
    padding: "8px 16px",
    fontWeight: "700",
    fontSize: "15px",
  });

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
            Support Tickets
          </h1>
          <p style={{ margin: 0, fontSize: "20px", color: "#374151" }}>
            Create and track your own support requests 🎫
          </p>
        </div>

        <button
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
          + Create Ticket
        </button>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.25fr 0.75fr",
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
            Create New Ticket
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
                placeholder="Enter ticket subject"
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
                Issue Category
              </label>
              <select style={inputStyle}>
                <option>Appliance Issue</option>
                <option>Room Issue</option>
                <option>Energy Target Issue</option>
                <option>Billing Issue</option>
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
                Priority
              </label>
              <select style={inputStyle}>
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
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
                Description
              </label>
              <textarea
                rows="6"
                placeholder="Describe your issue"
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
            Your Recent Tickets
          </h2>

          <div
            style={{
              background: "#fbf5e7",
              borderRadius: "18px",
              padding: "18px",
              marginBottom: "14px",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", fontSize: "22px", color: "#111827" }}>
              T001 - Appliance not updating
            </h3>
            <p style={{ margin: "0 0 10px 0", color: "#374151" }}>
              Created: 2026-04-01
            </p>
            <span style={badgeStyle("#fef3c7", "#b45309")}>Open</span>
          </div>

          <div
            style={{
              background: "#e8f7ed",
              borderRadius: "18px",
              padding: "18px",
              marginBottom: "14px",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", fontSize: "22px", color: "#111827" }}>
              T002 - Room details missing
            </h3>
            <p style={{ margin: "0 0 10px 0", color: "#374151" }}>
              Created: 2026-03-29
            </p>
            <span style={badgeStyle("#dbeafe", "#1d4ed8")}>In Progress</span>
          </div>

          <div
            style={{
              background: "#eef2ff",
              borderRadius: "18px",
              padding: "18px",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", fontSize: "22px", color: "#111827" }}>
              T003 - Feedback submission issue
            </h3>
            <p style={{ margin: "0 0 10px 0", color: "#374151" }}>
              Created: 2026-03-25
            </p>
            <span style={badgeStyle("#dff3e8", "#166534")}>Resolved</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SupportTicketsPage;