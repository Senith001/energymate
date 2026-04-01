import React from "react";

function AppliancesPage() {
  const pageCard = {
    background: "#ffffff",
    borderRadius: "24px",
    boxShadow: "0 4px 15px rgba(0,0,0,0.08)",
    padding: "24px",
  };

  const badgeStyle = (bg, color = "#111827") => ({
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
            Appliances
          </h1>
          <p style={{ margin: 0, fontSize: "20px", color: "#374151" }}>
            Manage your household appliances and monitor energy use ⚡
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
          + Add Appliance
        </button>
      </div>

      <div style={pageCard}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#f3f4f6", textAlign: "left" }}>
              <th style={{ padding: "16px", borderRadius: "12px 0 0 12px" }}>Appliance</th>
              <th style={{ padding: "16px" }}>Room</th>
              <th style={{ padding: "16px" }}>Wattage</th>
              <th style={{ padding: "16px" }}>Daily Usage</th>
              <th style={{ padding: "16px" }}>Cost/Month</th>
              <th style={{ padding: "16px", borderRadius: "0 12px 12px 0" }}>Status</th>
            </tr>
          </thead>

          <tbody>
            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={{ padding: "18px 16px" }}>Rice Cooker</td>
              <td style={{ padding: "18px 16px" }}>Kitchen</td>
              <td style={{ padding: "18px 16px" }}>700 W</td>
              <td style={{ padding: "18px 16px" }}>
                <span style={badgeStyle("#fbf1db")}>1.5 hrs</span>
              </td>
              <td style={{ padding: "18px 16px" }}>LKR 1,260</td>
              <td style={{ padding: "18px 16px" }}>
                <span style={badgeStyle("#dff3e8", "#166534")}>Active</span>
              </td>
            </tr>

            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={{ padding: "18px 16px" }}>Refrigerator</td>
              <td style={{ padding: "18px 16px" }}>Kitchen</td>
              <td style={{ padding: "18px 16px" }}>150 W</td>
              <td style={{ padding: "18px 16px" }}>
                <span style={badgeStyle("#dff3e8", "#166534")}>24 hrs</span>
              </td>
              <td style={{ padding: "18px 16px" }}>LKR 3,240</td>
              <td style={{ padding: "18px 16px" }}>
                <span style={badgeStyle("#dff3e8", "#166534")}>Active</span>
              </td>
            </tr>

            <tr style={{ borderBottom: "1px solid #e5e7eb" }}>
              <td style={{ padding: "18px 16px" }}>AC (1.5 Ton)</td>
              <td style={{ padding: "18px 16px" }}>Living Room</td>
              <td style={{ padding: "18px 16px" }}>1800 W</td>
              <td style={{ padding: "18px 16px" }}>
                <span style={badgeStyle("#fbf1db")}>5 hrs</span>
              </td>
              <td style={{ padding: "18px 16px" }}>LKR 2,700</td>
              <td style={{ padding: "18px 16px" }}>
                <span style={badgeStyle("#dff3e8", "#166534")}>Active</span>
              </td>
            </tr>

            <tr>
              <td style={{ padding: "18px 16px" }}>LED TV</td>
              <td style={{ padding: "18px 16px" }}>Living Room</td>
              <td style={{ padding: "18px 16px" }}>120 W</td>
              <td style={{ padding: "18px 16px" }}>
                <span style={badgeStyle("#eef2ff", "#3730a3")}>4 hrs</span>
              </td>
              <td style={{ padding: "18px 16px" }}>LKR 860</td>
              <td style={{ padding: "18px 16px" }}>
                <span style={badgeStyle("#dff3e8", "#166534")}>Active</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default AppliancesPage;