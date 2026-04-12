import React from "react";
import { cardStyle, colors } from "../energy/dashboardTheme";

function UsageBars({ title, data }) {
  const points = data && data.length ? data : [];
  const max = Math.max(...points.map((item) => item.units), 10);
  const ticks = 4;
  // Increase the SVG plotting area so the chart uses more of the available card space.
  const chartHeight = 300;
  const chartWidth = 760;
  const leftPadding = 58;
  const bottomPadding = 34;
  const innerWidth = chartWidth - leftPadding - 18;
  const innerHeight = chartHeight - bottomPadding - 10;
  const barWidth = points.length ? Math.min(38, innerWidth / (points.length * 1.7)) : 30;
  const slot = points.length ? innerWidth / points.length : 80;

  return (
    <div style={{ ...cardStyle, padding: "24px", minHeight: "350px", width: "100%", display: "flex", flexDirection: "column" }}>
      <h3 style={{ margin: "0 0 28px 0", fontSize: "18px", fontWeight: "600", color: colors.text }}>{title}</h3>
      {points.length ? (
        <div style={{ width: "100%", overflowX: "auto", flex: 1 }}>
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: "100%", minWidth: "580px", display: "block" }}>
            {[...Array(ticks + 1)].map((_, index) => {
              const value = (max / ticks) * (ticks - index);
              const y = 10 + (innerHeight / ticks) * index;
              return (
                <g key={index}>
                  <line x1={leftPadding} x2={chartWidth - 12} y1={y} y2={y} stroke="#d6dde6" strokeDasharray="4 4" />
                  <text x={8} y={y + 4} fill={colors.muted} fontSize="12">
                    {Math.round(value)} kWh
                  </text>
                </g>
              );
            })}

            <line x1={leftPadding} x2={chartWidth - 12} y1={10 + innerHeight} y2={10 + innerHeight} stroke="#94a3b8" />

            {points.map((item, index) => {
              const height = Math.max(10, (item.units / max) * (innerHeight - 6));
              const x = leftPadding + slot * index + (slot - barWidth) / 2;
              const y = 10 + innerHeight - height;
              return (
                <g key={`${item.label}-${index}`}>
                  <rect x={x} y={y} width={barWidth} height={height} rx="7" fill={colors.green} />
                  <text x={x + barWidth / 2} y={chartHeight - 10} textAnchor="middle" fill={colors.muted} fontSize="12">
                    {item.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      ) : (
        <div style={{ color: colors.muted, padding: "50px 0", textAlign: "center", flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          No usage records available for the last 7 days.
        </div>
      )}
    </div>
  );
}

export default UsageBars;