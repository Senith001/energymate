import React from "react";

function Navbar() {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "flex-end",
        alignItems: "center",
        marginBottom: "18px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "18px",
        }}
      >
        <div
          style={{
            width: "62px",
            height: "62px",
            borderRadius: "50%",
            background: "#f3f4f6",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "28px",
            position: "relative",
            boxShadow: "0 3px 10px rgba(0,0,0,0.06)",
          }}
        >
          🔔
          <div
            style={{
              position: "absolute",
              top: "6px",
              right: "8px",
              width: "18px",
              height: "18px",
              borderRadius: "50%",
              background: "#ef4444",
              color: "white",
              fontSize: "11px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "700",
            }}
          >
            1
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "14px",
            background: "#f3f4f6",
            padding: "10px 18px",
            borderRadius: "999px",
            boxShadow: "0 3px 10px rgba(0,0,0,0.06)",
          }}
        >
          <div
            style={{
              width: "46px",
              height: "46px",
              borderRadius: "50%",
              background: "#e5e7eb",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "26px",
            }}
          >
            👤
          </div>

          <div
            style={{
              fontSize: "18px",
              fontWeight: "700",
              color: "#111827",
            }}
          >
            User: Silva Family
          </div>

          <div style={{ fontSize: "18px", color: "#374151" }}>▼</div>
        </div>
      </div>
    </div>
  );
}

export default Navbar;