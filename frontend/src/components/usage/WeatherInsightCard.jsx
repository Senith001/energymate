import React, { useState } from "react";
import { cardStyle, colors, Icon } from "../energy/dashboardTheme";

function WeatherInsightCard({
  city,
  weather,
  tip,
  sourceLabel,
  locationMode,
  customCity,
  onLocationModeChange,
  onCustomCityChange,
  onApplyCustomCity,
}) {
  const details = weather || {};
  const [showSettings, setShowSettings] = useState(false);
  // Match the card accent to the backend insight so the weather state reads quickly at a glance.
  const tone = getWeatherTone(tip);

  return (
    <div style={{ ...cardStyle, padding: "24px", position: "relative", minHeight: "350px", width: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px", marginBottom: "22px" }}>
        <h3 style={{ margin: 0, fontSize: "18px", fontWeight: "600", color: colors.text }}>Weather Impact</h3>
        <div style={{ position: "relative" }}>
          <button
            type="button"
            onClick={() => setShowSettings((current) => !current)}
            style={settingsButtonStyle}
            title="Weather settings"
          >
            <span aria-hidden="true">&#9881;</span>
          </button>
          {showSettings ? (
            <div style={settingsPanelStyle}>
              <div style={{ color: colors.text, fontSize: "14px", fontWeight: "700", marginBottom: "10px" }}>Weather Location</div>
              <div style={{ display: "grid", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => {
                    onLocationModeChange("browser");
                    setShowSettings(false);
                  }}
                  style={pillStyle(locationMode === "browser")}
                >
                  Current Location
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLocationModeChange("household");
                    setShowSettings(false);
                  }}
                  style={pillStyle(locationMode === "household")}
                >
                  Household City
                </button>
                <button
                  type="button"
                  onClick={() => onLocationModeChange("custom")}
                  style={pillStyle(locationMode === "custom")}
                >
                  Custom City
                </button>
              </div>
              {locationMode === "custom" ? (
                <div style={{ display: "grid", gap: "8px", marginTop: "10px" }}>
                  <input
                    type="text"
                    value={customCity}
                    onChange={(event) => onCustomCityChange(event.target.value)}
                    placeholder="Enter city"
                    style={inputStyle}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onApplyCustomCity();
                      setShowSettings(false);
                    }}
                    style={applyButtonStyle}
                  >
                    Apply
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", flex: 1, justifyContent: "center" }}>
        <div
          style={{
            width: "68px",
            height: "68px",
            borderRadius: "20px",
            background: tone.soft,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: "16px",
          }}
        >
          <Icon name="cloud" color={tone.main} size={32} />
        </div>
        <div style={{ fontSize: "22px", fontWeight: "800", color: colors.text, marginBottom: "6px" }}>
          {details.temperature != null ? `${details.temperature}${String.fromCharCode(176)}C` : "-"}
        </div>
        <div style={{ color: colors.muted, marginBottom: "4px" }}>{details.description || "Current conditions unavailable"}</div>
        <div
          style={{
            marginTop: 0,
            marginBottom: "12px",
            color: tone.main,
            fontSize: "13px",
            fontWeight: "400",
          }}
        >
          location: {sourceLabel || "Household City"}
        </div>

        <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", justifyContent: "center", color: colors.muted }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Icon name="drop" color={colors.muted} size={16} />
            {details.humidity != null ? `${details.humidity}%` : "-"}
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
          background: tone.soft,
          color: tone.main,
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

function getWeatherTone(tip = "") {
  const normalizedTip = tip.toLowerCase();

  if (normalizedTip.includes("high temperatures")) {
    return { main: colors.amber, soft: colors.amberSoft };
  }

  if (normalizedTip.includes("moderate temperatures")) {
    return { main: colors.green, soft: colors.greenSoft };
  }

  return { main: colors.blue, soft: colors.blueSoft };
}

function pillStyle(active) {
  return {
    padding: "9px 12px",
    borderRadius: "999px",
    border: `1px solid ${active ? colors.green : colors.border}`,
    background: active ? colors.greenSoft : "#ffffff",
    color: active ? colors.green : colors.text,
    fontWeight: "700",
    cursor: "pointer",
  };
}

const inputStyle = {
  flex: "1 1 160px",
  minWidth: "0",
  padding: "10px 12px",
  borderRadius: "12px",
  border: `1px solid ${colors.border}`,
  fontSize: "14px",
  boxSizing: "border-box",
};

const applyButtonStyle = {
  padding: "10px 14px",
  borderRadius: "12px",
  border: "none",
  background: colors.green,
  color: "#ffffff",
  fontWeight: "700",
  cursor: "pointer",
};

const settingsButtonStyle = {
  width: "38px",
  height: "38px",
  borderRadius: "12px",
  border: `1px solid ${colors.border}`,
  background: "#ffffff",
  color: colors.text,
  cursor: "pointer",
  fontSize: "18px",
  lineHeight: 1,
};

const settingsPanelStyle = {
  position: "absolute",
  top: "46px",
  right: 0,
  width: "220px",
  padding: "14px",
  borderRadius: "16px",
  border: `1px solid ${colors.border}`,
  background: "#ffffff",
  boxShadow: "0 18px 40px rgba(15, 23, 42, 0.12)",
  zIndex: 2,
};
