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
      className="min-w-0 rounded-[28px] border px-6 py-6 shadow-[0_18px_40px_rgba(15,23,42,0.06)] transition-all duration-200"
      style={{
        ...cardStyle,
        background: palette.background,
        border: `1px solid ${palette.border}`,
      }}
    >
      <div className="flex justify-between gap-4">
        <div className="min-w-0">
          <div className="mb-2.5 text-[15px] font-semibold" style={{ color: colors.muted }}>
            {title}
          </div>
          <div className="mb-2 text-[24px] font-extrabold leading-tight md:text-[26px]" style={{ color: colors.text }}>
            {value}
          </div>
          <div style={{ color: colors.muted }}>{subtitle}</div>
        </div>
        <div
          className="flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl"
          style={{
            background: palette.iconBg,
          }}
        >
          <Icon name={icon} color={palette.icon} />
        </div>
      </div>

      {trend ? (
        <div className="mt-[18px] flex flex-wrap gap-2 text-sm">
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
