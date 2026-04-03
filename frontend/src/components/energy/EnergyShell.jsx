// Temporary standalone shell for testing the Usage and Billing pages.
// This file can be removed once those pages are connected to the real app layout and navigation.

import React from "react";
import { Link } from "react-router-dom";
import { cardStyle, colors, Icon } from "./dashboardTheme";

function tabStyle(active) {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "12px 22px",
    borderRadius: "14px",
    textDecoration: "none",
    fontWeight: "700",
    color: active ? colors.text : colors.muted,
    background: active ? "#ffffff" : "transparent",
    boxShadow: active ? "0 2px 6px rgba(15, 23, 42, 0.05)" : "none",
    minWidth: "150px",
  };
}

function EnergyShell({ activeTab, children }) {
  return (
    <div style={{ minHeight: "100vh", background: colors.background, padding: "10px" }}>
      <div
        style={{
          ...cardStyle,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 24px",
          marginBottom: "26px",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "14px",
              background: colors.green,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Icon name="zap" color="#ffffff" />
          </div>
          <div style={{ fontSize: "20px", fontWeight: "800", color: colors.text }}>EnergyTrack</div>
        </div>

        <div
          style={{
            background: "#e9edf2",
            borderRadius: "16px",
            padding: "6px",
            display: "flex",
            gap: "6px",
            flexWrap: "wrap",
          }}
        >
          <Link to="/usage" style={tabStyle(activeTab === "usage")}>
            <Icon name="zap" size={16} />
            Usage
          </Link>
          <Link to="/billing" style={tabStyle(activeTab === "billing")}>
            <Icon name="bill" size={16} />
            Billing
          </Link>
        </div>
      </div>

      {children}
    </div>
  );
}

export default EnergyShell;


