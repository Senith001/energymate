import React from "react";
import { cardStyle, colors, formatDate } from "../energy/dashboardTheme";

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.35)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "20px",
  zIndex: 50,
};

// This dialog shows one usage record without putting the form into edit mode.
function UsageDetailsDialog({ open, usage, onClose }) {
  if (!open || !usage) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...cardStyle, width: "100%", maxWidth: "520px", padding: "24px" }} onClick={(event) => event.stopPropagation()}>
        <h3 style={{ margin: "0 0 18px 0", fontSize: "22px", color: colors.text }}>Usage Entry Details</h3>

        <div style={{ display: "grid", gap: "12px" }}>
          <InfoRow label="Date" value={formatDate(usage.date)} />
          <InfoRow label="Entry Type" value={usage.entryType || "-"} />
          <InfoRow label="Units Used" value={`${Number(usage.unitsUsed || 0).toFixed(1)} kWh`} />
          <InfoRow label="Previous Reading" value={usage.previousReading ?? "-"} />
          <InfoRow label="Current Reading" value={usage.currentReading ?? "-"} />
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "18px" }}>
          <button
            type="button"
            onClick={onClose}
            style={{
              padding: "11px 18px",
              borderRadius: "12px",
              border: `1px solid ${colors.border}`,
              background: "#ffffff",
              color: colors.text,
              cursor: "pointer",
              fontWeight: "700",
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
        padding: "12px 14px",
        borderRadius: "12px",
        background: "#f4f7fa",
      }}
    >
      <span style={{ color: colors.muted }}>{label}</span>
      <strong style={{ color: colors.text }}>{value}</strong>
    </div>
  );
}

export default UsageDetailsDialog;
