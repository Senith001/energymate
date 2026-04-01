import React from "react";

function HouseholdPage() {
  const pageCard = {
    background: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
    padding: "24px",
  };

  const statCard = {
    background: "#ffffff",
    borderRadius: "20px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
    padding: "20px",
    textAlign: "center",
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
            Household
          </h1>
          <p style={{ margin: 0, fontSize: "20px", color: "#374151" }}>
            View your household details and family information 🏠
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
          Edit Household
        </button>
      </div>

      <div style={{ ...pageCard, marginBottom: "20px" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "20px",
            flexWrap: "wrap",
          }}
        >
          <div
            style={{
              width: "90px",
              height: "90px",
              borderRadius: "50%",
              background: "#e8f7ed",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "46px",
            }}
          >
            🏠
          </div>

          <div>
            <h2
              style={{
                margin: "0 0 10px 0",
                fontSize: "36px",
                color: "#111827",
                fontWeight: "800",
              }}
            >
              Silva Family
            </h2>
            <p style={{ margin: "0 0 6px 0", fontSize: "18px", color: "#374151" }}>
              Registered Household User
            </p>
            <p style={{ margin: 0, fontSize: "18px", color: "#6b7280" }}>
              Colombo, Sri Lanka
            </p>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        <div style={statCard}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>👨‍👩‍👧‍👦</div>
          <h3 style={{ margin: "0 0 8px 0", color: "#166534" }}>Members</h3>
          <p style={{ margin: 0, fontSize: "28px", fontWeight: "800", color: "#111827" }}>
            5
          </p>
        </div>

        <div style={statCard}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>🛏️</div>
          <h3 style={{ margin: "0 0 8px 0", color: "#166534" }}>Rooms</h3>
          <p style={{ margin: 0, fontSize: "28px", fontWeight: "800", color: "#111827" }}>
            3
          </p>
        </div>

        <div style={statCard}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>⚡</div>
          <h3 style={{ margin: "0 0 8px 0", color: "#166534" }}>Appliances</h3>
          <p style={{ margin: 0, fontSize: "28px", fontWeight: "800", color: "#111827" }}>
            6
          </p>
        </div>

        <div style={statCard}>
          <div style={{ fontSize: "32px", marginBottom: "8px" }}>💰</div>
          <h3 style={{ margin: "0 0 8px 0", color: "#d97706" }}>Budget</h3>
          <p style={{ margin: 0, fontSize: "28px", fontWeight: "800", color: "#111827" }}>
            LKR 6,500
          </p>
        </div>
      </div>

      <div style={pageCard}>
        <h2
          style={{
            fontSize: "30px",
            margin: "0 0 18px 0",
            color: "#111827",
          }}
        >
          Household Details
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, 1fr)",
            gap: "18px",
          }}
        >
          <div
            style={{
              background: "#fbf5e7",
              borderRadius: "18px",
              padding: "18px",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", color: "#111827" }}>Household Name</h3>
            <p style={{ margin: 0, fontSize: "18px", color: "#374151" }}>Silva Family</p>
          </div>

          <div
            style={{
              background: "#e8f7ed",
              borderRadius: "18px",
              padding: "18px",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", color: "#111827" }}>Location</h3>
            <p style={{ margin: 0, fontSize: "18px", color: "#374151" }}>Colombo</p>
          </div>

          <div
            style={{
              background: "#eef2ff",
              borderRadius: "18px",
              padding: "18px",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", color: "#111827" }}>Monthly Energy Target</h3>
            <p style={{ margin: 0, fontSize: "18px", color: "#374151" }}>150 kWh</p>
          </div>

          <div
            style={{
              background: "#fdf2f8",
              borderRadius: "18px",
              padding: "18px",
            }}
          >
            <h3 style={{ margin: "0 0 10px 0", color: "#111827" }}>Monthly Budget Limit</h3>
            <p style={{ margin: 0, fontSize: "18px", color: "#374151" }}>LKR 6,500</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HouseholdPage;