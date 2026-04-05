import React from "react";
import { cardStyle, colors, formatDate, Icon } from "../energy/dashboardTheme";

// Usage table actions are passed down from the page so state stays centralized.
function UsageTableCard({
  rows,
  onAdd,
  onView,
  onEdit,
  onDelete,
  busyId,
  monthFilter,
  yearFilter,
  onMonthFilterChange,
  onYearFilterChange,
  monthOptions,
  yearOptions,
}) {
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
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
          {/* Keep the records table open to all entries by default, with separate month and year filters. */}
          <select value={monthFilter} onChange={(event) => onMonthFilterChange(event.target.value)} style={selectStyle}>
            {monthOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          <select value={yearFilter} onChange={(event) => onYearFilterChange(event.target.value)} style={selectStyle}>
            {yearOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
                      <ActionButton icon="edit" tone="blue" onClick={() => onEdit(row)} title="Edit entry" />
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

function ActionButton({ icon, danger = false, tone = "neutral", onClick, disabled = false, title }) {
  const isBlue = tone === "blue" && !danger;
  const background = danger ? colors.redSoft : isBlue ? colors.blueSoft : colors.slateSoft;
  const iconColor = danger ? colors.red : isBlue ? colors.blue : colors.text;

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
        background,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: iconColor,
        cursor: disabled ? "wait" : "pointer",
        opacity: disabled ? 0.7 : 1,
      }}
      title={title}
    >
      <Icon name={icon} color={iconColor} size={15} />
    </button>
  );
}

const selectStyle = {
  minWidth: "170px",
  padding: "10px 12px",
  borderRadius: "12px",
  border: `1px solid ${colors.border}`,
  background: "#ffffff",
  color: colors.text,
  fontSize: "14px",
  outline: "none",
};

export default UsageTableCard;
