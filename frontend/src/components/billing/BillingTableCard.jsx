import React from "react";
import { cardStyle, colors, formatCurrency, formatMonthYear, getStatusTone, Icon } from "../energy/dashboardTheme";

// Billing table actions are passed down from the page so data refresh logic stays centralized.
function BillingTableCard({ rows, onCreate, onGenerate, generating, onView, onRegenerate, busyId }) {
  return (
    <div style={{ ...cardStyle, padding: "24px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <h3 style={{ margin: 0, fontSize: "18px", color: colors.text }}>Bill History</h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <button onClick={onCreate} style={buttonStyle(colors.green, "#ffffff", "none")}>
            <Icon name="plus" color="#ffffff" size={16} />
            Create Bill
          </button>
          <button onClick={onGenerate} disabled={generating} style={buttonStyle("#ffffff", colors.text, `1px solid ${colors.border}`)}>
            <Icon name="refresh" color={colors.text} size={16} />
            {generating ? "Generating..." : "Generate Bill"}
          </button>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "760px" }}>
          <thead>
            <tr style={{ color: colors.muted, textAlign: "left" }}>
              {["Period", "Units (kWh)", "Amount (Rs.)", "Status", "Paid On", "Actions"].map((label) => (
                <th key={label} style={{ padding: "14px 12px", borderBottom: `1px solid ${colors.border}`, fontWeight: "700" }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => {
                const tone = getStatusTone(row.status, row.dueDate);
                return (
                  <tr key={row._id}>
                    <td style={cellStyle(true)}>{formatMonthYear(row.month, row.year)}</td>
                    <td style={cellStyle()}>{Number(row.totalUnits || 0).toFixed(1)}</td>
                    <td style={cellStyle(true)}>{formatCurrency(row.totalCost)}</td>
                    <td style={cellStyle()}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          padding: "6px 12px",
                          borderRadius: "999px",
                          background: tone.background,
                          color: tone.text,
                          border: `1px solid ${tone.border}`,
                          fontSize: "13px",
                          fontWeight: "700",
                          textTransform: "capitalize",
                        }}
                      >
                        {tone.label}
                      </span>
                    </td>
                    <td style={cellStyle()}>{row.paidAt ? new Date(row.paidAt).toLocaleDateString("en-US", { day: "numeric", month: "short" }) : "-"}</td>
                    <td style={cellStyle()}>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <ActionButton icon="eye" onClick={() => onView(row)} title="View bill details" />
                        <ActionButton
                          icon="refresh"
                          onClick={() => onRegenerate(row)}
                          disabled={busyId === row._id}
                          title="Regenerate bill"
                        />
                        <ActionButton icon="trash" danger disabled title="Admin-only delete" />
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan="6" style={{ padding: "28px 12px", textAlign: "center", color: colors.muted }}>
                  No bills found yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function buttonStyle(background, color, border) {
  return {
    border,
    background,
    color,
    padding: "12px 16px",
    borderRadius: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    cursor: "pointer",
    fontWeight: "700",
  };
}

function cellStyle(strong) {
  return {
    padding: "18px 12px",
    borderBottom: `1px solid ${colors.border}`,
    color: colors.text,
    fontWeight: strong ? "700" : "500",
  };
}

function ActionButton({ icon, danger = false, onClick, disabled = false, title }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "34px",
        height: "34px",
        borderRadius: "10px",
        border: "none",
        background: danger ? colors.redSoft : colors.slateSoft,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: danger ? colors.red : colors.text,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.7 : 1,
      }}
      title={title}
    >
      <Icon name={icon} color={danger ? colors.red : colors.text} size={15} />
    </button>
  );
}

export default BillingTableCard;
