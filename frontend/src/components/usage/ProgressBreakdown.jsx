import React from "react";
import { cardStyle, colors } from "../energy/dashboardTheme";

const fills = [colors.green, "#fbbf24", "#4f8df7", "#ef4444", "#9d4edd", "#3db7b9"];

function ProgressBreakdown({ title, items, labelKey, unitLabel = "kWh" }) {
  return (
    <div style={{ ...cardStyle, padding: "24px" }}>
      <h3 style={{ margin: "0 0 22px 0", fontSize: "18px", color: colors.text }}>{title}</h3>
      <div style={{ display: "grid", gap: "18px" }}>
        {items.length ? (
          items.map((item, index) => (
            <div key={`${item[labelKey]}-${index}`}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "12px",
                  marginBottom: "8px",
                  color: colors.text,
                }}
              >
                <strong style={{ fontWeight: "700" }}>{item[labelKey]}</strong>
                <span style={{ color: colors.muted }}>
                  {item.value.toFixed(1)} {unitLabel} ({item.percentage.toFixed(1)}%)
                </span>
              </div>
              <div style={{ height: "11px", borderRadius: "999px", background: "#edf1f5", overflow: "hidden" }}>
                <div
                  style={{
                    width: `${Math.min(item.percentage, 100)}%`,
                    height: "100%",
                    borderRadius: "999px",
                    background: fills[index % fills.length],
                  }}
                />
              </div>
            </div>
          ))
        ) : (
          <div style={{ color: colors.muted }}>No room allocation data available yet.</div>
        )}
      </div>
    </div>
  );
}

export default ProgressBreakdown;
