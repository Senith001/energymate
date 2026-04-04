import React from "react";

function Dashboard() {
  const cardStyle = {
    background: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
    padding: "24px",
  };

  const topStatStyle = {
    background: "#ffffff",
    borderRadius: "18px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
    padding: "18px 24px",
    minWidth: "190px",
  };

  const roomCardStyle = (bg) => ({
    background: bg,
    borderRadius: "20px",
    padding: "18px 20px",
    marginBottom: "14px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
  });

  const usageBadgeStyle = (bg, color = "#111827") => ({
    display: "inline-block",
    background: bg,
    color,
    borderRadius: "999px",
    padding: "8px 16px",
    fontWeight: "700",
    fontSize: "16px",
  });

  return (
    <div style={{ background: "#f3f4f6", minHeight: "100vh", padding: "10px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: "20px",
          flexWrap: "wrap",
          marginBottom: "20px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "54px",
              fontWeight: "800",
              margin: "0 0 8px 0",
              color: "#111827",
            }}
          >
            Dashboard
          </h1>
          <p
            style={{
              fontSize: "20px",
              margin: 0,
              color: "#374151",
            }}
          >
            Welcome to your Household Energy Monitor 👋
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "14px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          <div style={topStatStyle}>
            <div style={{ fontSize: "18px", color: "#166534", fontWeight: "700", marginBottom: "6px" }}>
              Total Members
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800" }}>5</div>
          </div>

          <div style={topStatStyle}>
            <div style={{ fontSize: "18px", color: "#d97706", fontWeight: "700", marginBottom: "6px" }}>
              Monthly Budget
            </div>
            <div style={{ fontSize: "28px", fontWeight: "800" }}>LKR 6,500</div>
          </div>

          <button
            style={{
              background: "#0b8f3a",
              color: "white",
              border: "none",
              borderRadius: "16px",
              padding: "18px 24px",
              fontSize: "18px",
              fontWeight: "700",
              cursor: "pointer",
              boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
            }}
          >
            + Add Appliance
          </button>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.2fr 1.1fr 1fr",
          gap: "20px",
          marginBottom: "20px",
        }}
      >
        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
            }}
          >
            <h2 style={{ fontSize: "28px", margin: 0, color: "#111827" }}>
              Monthly Energy Usage
            </h2>
            <div style={{ fontSize: "28px" }}>✨</div>
          </div>

          <div
            style={{
              width: "280px",
              height: "140px",
              borderTopLeftRadius: "280px",
              borderTopRightRadius: "280px",
              border: "28px solid #e5e7eb",
              borderBottom: "0",
              margin: "18px auto 10px auto",
              position: "relative",
              background:
                "conic-gradient(from 180deg, #22c55e 0deg 72deg, #facc15 72deg 126deg, #f59e0b 126deg 152deg, #ef4444 152deg 180deg, transparent 180deg 360deg)",
            }}
          >
            <div
              style={{
                position: "absolute",
                left: "50%",
                top: "78%",
                transform: "translate(-50%, -50%)",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "50px", fontWeight: "800", lineHeight: 1 }}>
                120
              </div>
              <div style={{ fontSize: "22px", color: "#111827" }}>kWh</div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              width: "280px",
              margin: "0 auto",
              color: "#4b5563",
              fontSize: "18px",
            }}
          >
            <span>0</span>
            <span>300</span>
          </div>

          <div style={{ marginTop: "18px", fontSize: "18px", color: "#111827" }}>
            <span style={{ color: "#f59e0b", fontWeight: "800" }}>—</span> Target: 150 kWh
          </div>
        </div>

        <div style={cardStyle}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "14px",
            }}
          >
            <h2 style={{ fontSize: "28px", margin: 0, color: "#111827" }}>
              Monthly Cost
            </h2>
            <div
              style={{
                width: "58px",
                height: "58px",
                borderRadius: "50%",
                background: "#e8f7ed",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                fontSize: "28px",
              }}
            >
              💵
            </div>
          </div>

          <div
            style={{
              fontSize: "54px",
              fontWeight: "800",
              color: "#111827",
              marginBottom: "14px",
            }}
          >
            LKR 5,240
          </div>

          <div
            style={{
              display: "inline-block",
              background: "#e8f7ed",
              color: "#15803d",
              padding: "8px 16px",
              borderRadius: "999px",
              fontWeight: "700",
              marginBottom: "18px",
            }}
          >
            ↓ 15% vs Last Month
          </div>

          <div style={{ marginTop: "10px" }}>
            <svg viewBox="0 0 420 150" style={{ width: "100%", height: "150px" }}>
              <defs>
                <linearGradient id="greenFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#22c55e" stopOpacity="0.35" />
                  <stop offset="100%" stopColor="#22c55e" stopOpacity="0.03" />
                </linearGradient>
              </defs>
              <path
                d="M20 110 C70 85, 110 130, 160 88 S245 72, 300 95 S360 70, 400 55"
                fill="none"
                stroke="#16a34a"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <path
                d="M20 110 C70 85, 110 130, 160 88 S245 72, 300 95 S360 70, 400 55 L400 140 L20 140 Z"
                fill="url(#greenFill)"
              />
              <circle cx="100" cy="112" r="6" fill="white" stroke="#16a34a" strokeWidth="3" />
              <circle cx="220" cy="78" r="6" fill="white" stroke="#16a34a" strokeWidth="3" />
              <circle cx="312" cy="92" r="6" fill="#d1d5db" />
              <circle cx="400" cy="55" r="6" fill="white" stroke="#16a34a" strokeWidth="3" />
            </svg>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: "18px",
                color: "#6b7280",
                marginTop: "-8px",
              }}
            >
              <span>Jan</span>
              <span>Feb</span>
              <span>Mar</span>
              <span>Apr</span>
            </div>
          </div>
        </div>

        <div style={cardStyle}>
          <h2 style={{ fontSize: "28px", margin: "0 0 24px 0", color: "#111827" }}>
            Energy Targets
          </h2>

          <div style={{ marginBottom: "28px" }}>
            <div style={{ color: "#374151", fontSize: "18px", marginBottom: "8px" }}>
              Monthly kWh Target
            </div>
            <div style={{ fontSize: "24px", fontWeight: "800", marginBottom: "10px" }}>
              150 kWh
            </div>
            <div style={{ height: "10px", background: "#e5e7eb", borderRadius: "999px" }}>
              <div
                style={{
                  width: "68%",
                  height: "10px",
                  background: "#16a34a",
                  borderRadius: "999px",
                }}
              ></div>
            </div>
          </div>

          <div style={{ marginBottom: "28px" }}>
            <div style={{ color: "#374151", fontSize: "18px", marginBottom: "8px" }}>
              Monthly Cost Target
            </div>
            <div style={{ fontSize: "24px", fontWeight: "800", marginBottom: "10px" }}>
              LKR 6,500
            </div>
            <div style={{ height: "10px", background: "#e5e7eb", borderRadius: "999px" }}>
              <div
                style={{
                  width: "76%",
                  height: "10px",
                  background: "#16a34a",
                  borderRadius: "999px",
                }}
              ></div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginTop: "14px",
            }}
          >
            <span style={{ fontSize: "18px", color: "#374151" }}>Currency</span>
            <div
              style={{
                background: "#f3f4f6",
                borderRadius: "14px",
                padding: "10px 18px",
                fontWeight: "700",
                fontSize: "20px",
              }}
            >
              LKR ▼
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1.8fr 0.8fr",
          gap: "20px",
        }}
      >
        <div style={cardStyle}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "0.9fr 1.4fr",
              gap: "20px",
            }}
          >
            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <h2 style={{ fontSize: "28px", margin: 0 }}>Rooms</h2>
                <button
                  style={{
                    background: "#ffffff",
                    border: "2px solid #d1d5db",
                    borderRadius: "14px",
                    padding: "10px 18px",
                    color: "#15803d",
                    fontWeight: "700",
                    cursor: "pointer",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
                  }}
                >
                  + Add Room
                </button>
              </div>

              <div style={roomCardStyle("#fbf1db")}>
                <div style={{ fontSize: "36px" }}>🛋️</div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: "800" }}>Living Room</div>
                  <div style={{ color: "#4b5563", fontSize: "18px" }}>3 appliances</div>
                </div>
              </div>

              <div style={roomCardStyle("#e4f1ea")}>
                <div style={{ fontSize: "36px" }}>🍴</div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: "800" }}>Kitchen</div>
                  <div style={{ color: "#4b5563", fontSize: "18px" }}>2 appliances</div>
                </div>
              </div>

              <div style={roomCardStyle("#f8e9e9")}>
                <div style={{ fontSize: "36px" }}>🛏️</div>
                <div>
                  <div style={{ fontSize: "20px", fontWeight: "800" }}>Bed Room</div>
                  <div style={{ color: "#4b5563", fontSize: "18px" }}>1 appliance</div>
                </div>
              </div>
            </div>

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "16px",
                }}
              >
                <h2 style={{ fontSize: "28px", margin: 0 }}>Appliances</h2>
                <button
                  style={{
                    background: "#ffffff",
                    border: "2px solid #d1d5db",
                    borderRadius: "14px",
                    padding: "10px 18px",
                    color: "#15803d",
                    fontWeight: "700",
                    cursor: "pointer",
                    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
                  }}
                >
                  + Add Appliance
                </button>
              </div>

              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
                    <th style={{ padding: "14px", borderRadius: "10px 0 0 10px" }}>Name</th>
                    <th style={{ padding: "14px" }}>Wattage</th>
                    <th style={{ padding: "14px" }}>Daily Usage</th>
                    <th style={{ padding: "14px", borderRadius: "0 10px 10px 0" }}>Cost/mo</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "16px 14px" }}>Rice Cooker</td>
                    <td style={{ padding: "16px 14px" }}>700 W</td>
                    <td style={{ padding: "16px 14px" }}>
                      <span style={usageBadgeStyle("#fbf1db")}>1.5 hrs</span>
                    </td>
                    <td style={{ padding: "16px 14px" }}>LKR 1,260</td>
                  </tr>

                  <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
                    <td style={{ padding: "16px 14px" }}>Refrigerator</td>
                    <td style={{ padding: "16px 14px" }}>150 W</td>
                    <td style={{ padding: "16px 14px" }}>
                      <span style={usageBadgeStyle("#dff3e8", "#166534")}>24 hrs</span>
                    </td>
                    <td style={{ padding: "16px 14px" }}>LKR 3,240</td>
                  </tr>

                  <tr>
                    <td style={{ padding: "16px 14px" }}>AC (1.5 Ton)</td>
                    <td style={{ padding: "16px 14px" }}>1800 W</td>
                    <td style={{ padding: "16px 14px" }}>
                      <span style={usageBadgeStyle("#fbf1db")}>5 hrs</span>
                    </td>
                    <td style={{ padding: "16px 14px" }}>LKR 2,700</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div style={{ ...cardStyle, background: "#fbf5e7" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "18px",
            }}
          >
            <h2 style={{ fontSize: "28px", margin: 0 }}>Energy Tips</h2>
            <div style={{ fontSize: "34px" }}>💡</div>
          </div>

          <div style={{ fontSize: "20px", marginBottom: "18px" }}>✅ Turn off unused lights</div>
          <div style={{ fontSize: "20px", marginBottom: "18px" }}>✅ Use energy-saving TV</div>
          <div style={{ fontSize: "20px", marginBottom: "18px" }}>✅ Maintain Refrigerator</div>
        </div>
      </div>

      <div
        style={{
          textAlign: "center",
          marginTop: "20px",
          color: "#374151",
          fontSize: "18px",
        }}
      >
        © 2025 PowerSave | Save Energy, Save Money! 🌱
      </div>
    </div>
  );
}

export default Dashboard;