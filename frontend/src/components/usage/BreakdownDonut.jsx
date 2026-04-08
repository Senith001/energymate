import React from "react";
import { cardStyle, colors } from "../energy/dashboardTheme";

const segmentColors = ["#2a8c5f", "#fbbf24", "#3b82f6", "#ef4444", "#9d4edd", "#3db7b9"];

function polarToCartesian(cx, cy, r, angle) {
  const rad = ((angle - 90) * Math.PI) / 180;
  return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
}

function donutArc(cx, cy, r, startAngle, endAngle) {
  const start = polarToCartesian(cx, cy, r, endAngle);
  const end = polarToCartesian(cx, cy, r, startAngle);
  const largeArc = endAngle - startAngle <= 180 ? 0 : 1;
  return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 0 ${end.x} ${end.y}`;
}

function BreakdownDonut({ title, items, labelKey, actionLabel, onAction }) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  let start = 0;

  return (
    <div style={{ ...cardStyle, padding: "24px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "22px", flexWrap: "wrap" }}>
        <h3 style={{ margin: 0, fontSize: "18px", color: colors.text }}>{title}</h3>
        {onAction ? (
          <button
            type="button"
            onClick={onAction}
            // This action is optional so the same card can stay reusable outside the appliance-hours flow.
            style={{
              border: "none",
              background: colors.green,
              color: "#ffffff",
              padding: "8px 12px",
              borderRadius: "12px",
              fontWeight: "700",
              cursor: "pointer",
            }}
          >
            {actionLabel || "Action"}
          </button>
        ) : null}
      </div>
      <div style={{ display: "flex", gap: "26px", alignItems: "center", flexWrap: "wrap" }}>
        <div style={{ width: "220px", height: "220px", flexShrink: 0 }}>
          <svg viewBox="0 0 220 220" style={{ width: "100%", height: "100%" }}>
            <circle cx="110" cy="110" r="70" stroke="#e9edf2" strokeWidth="36" fill="none" />
            {items.map((item, index) => {
              const percentage = total ? (item.value / total) * 100 : 0;
              const end = start + (percentage / 100) * 360;
              const path = donutArc(110, 110, 70, start, end);
              const node = (
                <path
                  key={`${item[labelKey]}-${index}`}
                  d={path}
                  stroke={segmentColors[index % segmentColors.length]}
                  strokeWidth="36"
                  fill="none"
                  strokeLinecap="butt"
                />
              );
              start = end;
              return node;
            })}
            <circle cx="110" cy="110" r="44" fill="#ffffff" />
          </svg>
        </div>

        <div style={{ flex: 1, minWidth: "220px", display: "grid", gap: "12px" }}>
          {items.length ? (
            items.map((item, index) => (
              <div key={`${item[labelKey]}-${index}`} style={{ display: "flex", justifyContent: "space-between", gap: "12px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px", color: colors.text }}>
                  <span
                    style={{
                      width: "12px",
                      height: "12px",
                      borderRadius: "999px",
                      background: segmentColors[index % segmentColors.length],
                      display: "inline-block",
                    }}
                  />
                  <span>{item[labelKey]}</span>
                </div>
                <strong>{item.percentage.toFixed(1)}%</strong>
              </div>
            ))
          ) : (
            <div style={{ color: colors.muted }}>No appliance allocation data available yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default BreakdownDonut;
