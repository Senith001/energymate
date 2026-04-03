import React from "react";
import { cardStyle, colors, formatDate, Icon } from "../energy/dashboardTheme";

// Usage table actions are passed down from the page so state stays centralized.
function UsageTableCard({ rows, onAdd, onView, onEdit, onDelete, busyId }) {
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
        <h3 style={{ margin: 0, fontSize: "18px", color: colors.text }}>Usage Records</h3>
        <button
          onClick={onAdd}
          style={{
            border: "none",
            background: colors.green,
            color: "#ffffff",
            padding: "12px 18px",
            borderRadius: "14px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            cursor: "pointer",
            fontWeight: "700",
          }}
        >
          <Icon name="plus" color="#ffffff" size={16} />
          Add Entry
        </button>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "760px" }}>
          <thead>
            <tr style={{ color: colors.muted, textAlign: "left" }}>
              {["Date", "Type", "Units (kWh)", "Prev. Reading", "Curr. Reading", "Actions"].map((label) => (
                <th key={label} style={{ padding: "14px 12px", borderBottom: `1px solid ${colors.border}`, fontWeight: "700" }}>
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={row._id}>
                  <td style={cellStyle(true)}>{formatDate(row.date)}</td>
                  <td style={cellStyle()}>
                    <span
                      style={{
                        padding: "6px 12px",
                        borderRadius: "999px",
                        background: row.entryType === "meter" ? colors.greenSoft : colors.slateSoft,
                        color: row.entryType === "meter" ? colors.green : colors.text,
                        fontSize: "13px",
                        fontWeight: "700",
                        textTransform: "lowercase",
                      }}
                    >
                      {row.entryType}
                    </span>
                  </td>
                  <td style={cellStyle(true)}>{Number(row.unitsUsed || 0).toFixed(1)}</td>
                  <td style={cellStyle()}>{row.previousReading ?? "-"}</td>
                  <td style={cellStyle()}>{row.currentReading ?? "-"}</td>
                  <td style={cellStyle()}>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <ActionButton icon="eye" onClick={() => onView(row)} title="View entry" />
                      <ActionButton icon="edit" onClick={() => onEdit(row)} title="Edit entry" />
                      <ActionButton
                        icon="trash"
                        danger
                        onClick={() => onDelete(row)}
                        disabled={busyId === row._id}
                        title="Delete entry"
                      />
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" style={{ padding: "28px 12px", textAlign: "center", color: colors.muted }}>
                  No usage records found yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
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
        cursor: disabled ? "wait" : "pointer",
        opacity: disabled ? 0.7 : 1,
      }}
      title={title}
    >
      <Icon name={icon} color={danger ? colors.red : colors.text} size={15} />
    </button>
  );
}

export default UsageTableCard;
