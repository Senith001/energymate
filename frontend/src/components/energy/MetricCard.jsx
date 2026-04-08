import React from "react";
import { colors, cardStyle, Icon } from "./dashboardTheme";

const toneMap = {
  green: { background: colors.greenSoft, iconBg: "#d9efe2", icon: colors.green, border: colors.green },
  amber: { background: colors.amberSoft, iconBg: "#ffedb6", icon: colors.amber, border: colors.amber },
  blue: { background: colors.blueSoft, iconBg: "#d8e7ff", icon: colors.blue, border: colors.blue },
  red: { background: colors.redSoft, iconBg: "#ffd9d9", icon: colors.red, border: colors.red },
};

function MetricCard({ title, value, subtitle, trend, icon, tone = "green" }) {
  const palette = toneMap[tone] || toneMap.green;

  return (
    <div
      style={{
        ...cardStyle,
        background: palette.background,
        border: `1px solid ${palette.border}`,
        padding: "24px",
        minWidth: 0,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "16px" }}>
        <div style={{ minWidth: 0 }}>
          <div style={{ color: colors.muted, fontWeight: "600", marginBottom: "10px" }}>{title}</div>
          <div style={{ color: colors.text, fontSize: "24px", fontWeight: "800", marginBottom: "8px" }}>{value}</div>
          <div style={{ color: colors.muted }}>{subtitle}</div>
        </div>
        <div
          style={{
            width: "46px",
            height: "46px",
            borderRadius: "16px",
            background: palette.iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Icon name={icon} color={palette.icon} />
        </div>
      </div>

      {trend ? (
        <div style={{ display: "flex", gap: "8px", marginTop: "18px", fontSize: "14px", flexWrap: "wrap" }}>
          <span style={{ color: trend.value >= 0 ? colors.red : colors.green, fontWeight: "700" }}>
            {trend.value >= 0 ? "↑" : "↓"} {Math.abs(trend.value).toFixed(1)}%
          </span>
          <span style={{ color: colors.muted }}>{trend.label}</span>
        </div>
      ) : null}
    </div>
  );
}

export default MetricCard;
