import React, { useEffect, useState } from "react";
import { cardStyle, colors, formatCurrency, formatMonthYear, getStatusTone, Icon } from "../energy/dashboardTheme";

// Billing table actions are passed down from the page so data refresh logic stays centralized.
// Render the bill history table with period filters and row-level actions.
function BillingTableCard({
  rows,
  onCreate,
  onGenerate,
  generating,
  onView,
  onUpdate,
  onMarkPaid,
  onMarkUnpaid,
  onRegenerate,
  busyId,
  payingId,
  monthFilter,
  yearFilter,
  onMonthFilterChange,
  onYearFilterChange,
  monthOptions,
  yearOptions,
}) {
  const [page, setPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(rows.length / ROWS_PER_PAGE));
  const visibleRows = rows.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  // Reset paging when month or year filters change the visible bill history.
  useEffect(() => {
    setPage(1);
  }, [rows.length, monthFilter, yearFilter]);

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
        <h3 style={{ margin: 0, fontSize: "20px", fontWeight: "800", color: colors.text }}>Bill History</h3>
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", alignItems: "center" }}>
          {/* Keep the bill history open by default, with optional month and year filters. */}
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
          <button onClick={onCreate} style={buttonStyle(colors.green, "#ffffff", "none")}>
            <Icon name="plus" color="#ffffff" size={16} />
            Add Bill
          </button>
          <button onClick={onGenerate} disabled={generating} style={buttonStyle(colors.greenSoft, colors.green, `1px solid rgba(42, 140, 95, 0.18)`)}>
            <Icon name="refresh" color={colors.green} size={16} />
            {generating ? "Generating..." : "Generate Bill"}
          </button>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px", tableLayout: "auto" }}>
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
              visibleRows.map((row) => {
                const tone = getStatusTone(row.status, row.dueDate);
                const isPaid = tone.label === "paid";
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
                    <td style={actionCellStyle}>
                      <div style={{ display: "inline-flex", gap: "8px", flexWrap: "nowrap", alignItems: "center" }}>
                        <ActionButton icon="eye" onClick={() => onView(row)} title="View bill details" />
                        <ActionButton
                          icon="edit"
                          tone="blue"
                          onClick={() => onUpdate(row)}
                          disabled={isPaid}
                          title={isPaid ? "Paid bills cannot be edited" : "Update bill"}
                        />
                        <ActionButton
                          icon="refresh"
                          onClick={() => onRegenerate(row)}
                          disabled={isPaid || busyId === row._id}
                          title={isPaid ? "Paid bills cannot be regenerated" : "Regenerate bill"}
                        />
                        <StatusActionButton
                          paid={isPaid}
                          onClick={() => (isPaid ? onMarkUnpaid(row) : onMarkPaid(row))}
                          disabled={payingId === row._id}
                        />
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

// Keep the top table actions visually consistent with the dashboard buttons.
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

// Reuse one cell style so the history table stays visually consistent across columns.
function cellStyle(strong) {
  return {
    padding: "18px 12px",
    borderBottom: `1px solid ${colors.border}`,
    color: colors.text,
    fontWeight: strong ? "700" : "500",
  };
}

const actionCellStyle = {
  ...cellStyle(),
  width: "1%",
  whiteSpace: "nowrap",
  verticalAlign: "middle",
};

// Compact icon-only action used for view, edit, and regenerate actions.
function ActionButton({ icon, danger = false, tone = "neutral", onClick, disabled = false, title }) {
  const isBlue = tone === "blue";
  const isGreen = tone === "green";
  const background = danger ? colors.redSoft : isBlue ? colors.blueSoft : isGreen ? colors.greenSoft : colors.slateSoft;
  const color = danger ? colors.red : isBlue ? colors.blue : isGreen ? colors.green : colors.text;

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
        color,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.7 : 1,
      }}
      title={title}
    >
      <Icon name={icon} color={color} size={15} />
    </button>
  );
}

// Separate payment-state action so bill editing and payment updates stay distinct.
function StatusActionButton({ paid, onClick, disabled }) {
  const background = paid ? colors.redSoft : colors.greenSoft;
  const color = paid ? colors.red : colors.green;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      style={{
        border: "none",
        background,
        color,
        minWidth: "74px",
        padding: "5px 8px",
        borderRadius: "10px",
        cursor: disabled ? "not-allowed" : "pointer",
        fontWeight: "700",
        fontSize: "10px",
        lineHeight: 1.2,
        textAlign: "center",
        whiteSpace: "nowrap",
        opacity: disabled ? 0.7 : 1,
      }}
      title={paid ? "Mark bill as unpaid" : "Mark bill as paid"}
    >
      {paid ? "Mark Unpaid" : "Mark Paid"}
    </button>
  );
}

const selectStyle = {
  minWidth: "150px",
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

export default BillingTableCard;