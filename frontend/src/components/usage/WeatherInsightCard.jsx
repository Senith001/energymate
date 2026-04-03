import React from "react";
import { cardStyle, colors, Icon } from "../energy/dashboardTheme";

function WeatherInsightCard({ city, weather, tip }) {
  const details = weather || {};

  return (
    <div style={{ ...cardStyle, padding: "24px" }}>
      <h3 style={{ margin: "0 0 22px 0", fontSize: "18px", color: colors.text }}>Weather Impact</h3>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>
        <div
          style={{
            width: "68px",
            height: "68px",
            borderRadius: "20px",
            background: colors.amberSoft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
          }}
        >
          <Icon name="cloud" color={colors.amber} size={32} />
        </div>
        <div style={{ fontSize: "22px", fontWeight: "800", color: colors.text, marginBottom: "6px" }}>
          {details.temperature != null ? `${details.temperature}°C` : "—"}
        </div>
        <div style={{ color: colors.muted, marginBottom: "18px" }}>{details.description || "Current conditions unavailable"}</div>

        <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", justifyContent: "center", color: colors.muted }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Icon name="drop" color={colors.muted} size={16} />
            {details.humidity != null ? `${details.humidity}%` : "—"}
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Icon name="thermo" color={colors.muted} size={16} />
            {city || "Unknown city"}
          </span>
        </div>
      </div>

      <div
        style={{
          marginTop: "24px",
          background: colors.amberSoft,
          color: colors.amber,
          borderRadius: "16px",
          padding: "14px 16px",
          lineHeight: 1.5,
        }}
      >
        {tip || "Weather-based energy insight will appear once data is available."}
      </div>
    </div>
  );
}

export default WeatherInsightCard;
