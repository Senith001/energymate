import React from "react";

function RoomsPage() {
  const pageCard = {
    background: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
    padding: "24px",
  };

  const roomCard = (bg) => ({
    background: bg,
    borderRadius: "22px",
    padding: "22px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
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
            Rooms
          </h1>
          <p style={{ margin: 0, fontSize: "20px", color: "#374151" }}>
            Manage rooms and see appliance distribution by room 🛏️
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
          + Add Room
        </button>
      </div>

      <div style={pageCard}>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "20px",
          }}
        >
          <div style={roomCard("#fbf1db")}>
            <div style={{ fontSize: "42px", marginBottom: "12px" }}>🛋️</div>
            <h2 style={{ margin: "0 0 10px 0", fontSize: "28px", color: "#111827" }}>
              Living Room
            </h2>
            <p style={{ margin: "0 0 8px 0", color: "#374151", fontSize: "18px" }}>
              Appliances: 3
            </p>
            <p style={{ margin: "0 0 8px 0", color: "#374151", fontSize: "18px" }}>
              Floor: Ground Floor
            </p>
            <p style={{ margin: 0, color: "#374151", fontSize: "18px" }}>
              Status: Active
            </p>
          </div>

          <div style={roomCard("#e4f1ea")}>
            <div style={{ fontSize: "42px", marginBottom: "12px" }}>🍴</div>
            <h2 style={{ margin: "0 0 10px 0", fontSize: "28px", color: "#111827" }}>
              Kitchen
            </h2>
            <p style={{ margin: "0 0 8px 0", color: "#374151", fontSize: "18px" }}>
              Appliances: 2
            </p>
            <p style={{ margin: "0 0 8px 0", color: "#374151", fontSize: "18px" }}>
              Floor: Ground Floor
            </p>
            <p style={{ margin: 0, color: "#374151", fontSize: "18px" }}>
              Status: Active
            </p>
          </div>

          <div style={roomCard("#f8e9e9")}>
            <div style={{ fontSize: "42px", marginBottom: "12px" }}>🛏️</div>
            <h2 style={{ margin: "0 0 10px 0", fontSize: "28px", color: "#111827" }}>
              Bedroom
            </h2>
            <p style={{ margin: "0 0 8px 0", color: "#374151", fontSize: "18px" }}>
              Appliances: 1
            </p>
            <p style={{ margin: "0 0 8px 0", color: "#374151", fontSize: "18px" }}>
              Floor: First Floor
            </p>
            <p style={{ margin: 0, color: "#374151", fontSize: "18px" }}>
              Status: Active
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default RoomsPage;