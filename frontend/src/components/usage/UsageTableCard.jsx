import React, { useEffect, useState } from "react";
import { cardStyle, colors, formatDate, Icon } from "../energy/dashboardTheme";

// Usage table actions are passed down from the page so state stays centralized.
function UsageTableCard({
  rows,
  onAdd,
  onView,
  onEdit,
  onDelete,
  busyId,
  dayFilter,
  monthFilter,
  yearFilter,
  onDayFilterChange,
  onMonthFilterChange,
  onYearFilterChange,
  dayOptions,
  monthOptions,
  yearOptions,
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const visibleRows = rows.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  // Reset paging when the filters change the underlying result set.
  useEffect(() => {
    setPage(1);
  }, [rows.length, dayFilter, monthFilter, yearFilter]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

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
          {/* Keep the records table open to all entries by default, with date/month/year filters for faster lookup. */}
          <select value={dayFilter} onChange={(event) => onDayFilterChange(event.target.value)} style={selectStyle}>
            {dayOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
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
              visibleRows.map((row) => (
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
      {totalPages > 1 ? (
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginTop: "14px", flexWrap: "wrap" }}>
          <span style={{ color: colors.muted, fontSize: "14px" }}>
            Page {page} of {totalPages}
          </span>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              disabled={page === 1}
              style={{ ...pageButtonStyle, opacity: page === 1 ? 0.55 : 1 }}
            >
              Previous
            </button>
            <button
              type="button"
              onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
              disabled={page === totalPages}
              style={{ ...pageButtonStyle, opacity: page === totalPages ? 0.55 : 1 }}
            >
              Next
            </button>
          </div>
        </div>
      ) : null}
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

const pageButtonStyle = {
  padding: "9px 14px",
  borderRadius: "12px",
  border: `1px solid ${colors.border}`,
  background: "#ffffff",
  color: colors.text,
  fontWeight: "700",
  cursor: "pointer",
};

const ROWS_PER_PAGE = 8;

export default UsageTableCard;
