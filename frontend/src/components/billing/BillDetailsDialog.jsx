import React from "react";
import { cardStyle, colors, formatCurrency, formatMonthYear, getStatusTone } from "../energy/dashboardTheme";

const overlayStyle = {
  position: "fixed",
  inset: 0,
  background: "rgba(15, 23, 42, 0.35)",
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "center",
  padding: "20px",
  zIndex: 50,
  overflowY: "auto",
};

// Shared bill summary layout used for both read-only bill viewing and calculator previews.
export function BillSummaryContent({ bill, householdName, previewMode = false, footer = null }) {
  const statusTone = previewMode
    ? { background: colors.blueSoft, color: colors.blue, label: "preview" }
    : getStatusTone(bill.status, bill.dueDate);

  return (
    <>
      <div
        style={{
          padding: "26px 28px 20px",
          borderBottom: `1px solid ${colors.border}`,
          display: "grid",
          gap: "18px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" }}>
          <div style={{ display: "grid", gap: "8px" }}>
            <div style={{ color: colors.muted, fontSize: "14px", fontWeight: "600" }}>{householdName || "Household"}</div>
            <h3 style={{ margin: 0, fontSize: "26px", color: colors.text }}>
              {formatMonthYear(bill.month, bill.year)} {previewMode ? "Preview" : "Bill"}
            </h3>
            <div style={{ color: colors.muted }}>
              {previewMode
                ? "Preview the estimated charges before saving this bill."
                : "Detailed bill summary with charges, readings, and important dates."}
            </div>
          </div>

          <div
            style={{
              alignSelf: "start",
              padding: "8px 14px",
              borderRadius: "999px",
              background: statusTone.background,
              color: statusTone.color,
              fontWeight: "800",
              textTransform: "capitalize",
            }}
          >
            {statusTone.label}
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
          <HeroTile label="Total Cost" value={formatCurrency(bill.totalCost)} tone="green" />
          <HeroTile label="Subtotal" value={formatCurrency(bill.subTotal)} tone="blue" />
          <HeroTile label="Total Units" value={`${Number(bill.totalUnits || 0).toFixed(1)} kWh`} tone="amber" />
          <HeroTile label="Billing Period" value={formatMonthYear(bill.month, bill.year)} tone="red" />
        </div>

        <div
          style={{
            padding: "12px 14px",
            borderRadius: "14px",
            background: colors.amberSoft,
            color: colors.text,
            fontSize: "14px",
            lineHeight: 1.5,
          }}
        >
          This bill is an estimate based on recorded usage and the tariff currently configured in the system.
        </div>
      </div>

      <div style={{ padding: "24px 28px 28px", display: "grid", gap: "22px" }}>
        <Section title="Meter Details">
          <div style={infoGridStyle}>
            <InfoTile label="Previous Reading" value={bill.previousReading ?? "-"} />
            <InfoTile label="Current Reading" value={bill.currentReading ?? "-"} />
            <InfoTile label="Household Name" value={householdName || "Household"} />
            <InfoTile label="Status" value={previewMode ? "Preview" : toTitleCase(bill.status || "unpaid")} />
          </div>
        </Section>

        <Section title="Charge Breakdown">
          <div style={{ display: "grid", gap: "12px" }}>
            <BreakdownRow label="Energy Charge" value={formatCurrency(bill.energyCharge)} />
            <BreakdownRow label="Fixed Charge" value={formatCurrency(bill.fixedCharge)} />
            <BreakdownRow label="Subtotal" value={formatCurrency(bill.subTotal)} highlight />
            <BreakdownRow label="SSCL" value={formatCurrency(bill.sscl)} />
            <BreakdownRow label="Total Cost" value={formatCurrency(bill.totalCost)} total />
          </div>
        </Section>

        <Section title="Energy Charge Breakdown">
          {bill.breakdown?.length ? (
            <div style={{ display: "grid", gap: "12px" }}>
              {bill.breakdown.map((item, index) => (
                <div
                  key={`${item.range}-${index}`}
                  style={{
                    padding: "16px 18px",
                    borderRadius: "16px",
                    background: "#f4f7fa",
                    display: "grid",
                    gap: "8px",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "14px", flexWrap: "wrap" }}>
                    <strong style={{ color: colors.text }}>{item.range}</strong>
                    <strong style={{ color: colors.text }}>{formatCurrency(item.cost)}</strong>
                  </div>
                  <div style={{ color: colors.muted, fontSize: "14px" }}>
                    {Number(item.units || 0).toFixed(1)} units x Rs. {Number(item.rate || 0).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text="No energy charge breakdown is available for this bill yet." />
          )}
        </Section>

        {!previewMode ? (
          <Section title="Important Dates">
            <div style={infoGridStyle}>
              <InfoTile label="Due Date" value={formatDateValue(bill.dueDate)} />
              <InfoTile label="Paid Date" value={formatDateValue(bill.paidAt)} />
              <InfoTile label="Created At" value={formatDateValue(bill.createdAt)} />
              <InfoTile label="Updated At" value={formatDateValue(bill.updatedAt)} />
            </div>
          </Section>
        ) : null}

        {footer}
      </div>
    </>
  );
}

// This dialog is read-only so viewing a bill stays separate from updating it.
function BillDetailsDialog({ open, bill, onClose, householdName }) {
  if (!open || !bill) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
        style={{
          ...cardStyle,
          width: "100%",
          maxWidth: "860px",
          padding: "0",
          margin: "20px 0",
          maxHeight: "calc(100vh - 40px)",
          overflowY: "auto",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <BillSummaryContent
          bill={bill}
          householdName={householdName}
          footer={
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", flexWrap: "wrap" }}>
              <button type="button" onClick={onClose} style={buttonStyle("secondary")}>
                Close
              </button>
            </div>
          }
        />
      </div>
    </div>
  );
}

// Simple section wrapper so the bill view reads like one organized sheet.
function Section({ title, children }) {
  return (
    <div style={{ display: "grid", gap: "12px" }}>
      <div style={{ color: colors.text, fontSize: "16px", fontWeight: "800" }}>{title}</div>
      {children}
    </div>
  );
}

// Highlight key bill numbers at the top before the detailed breakdown.
function HeroTile({ label, value, tone }) {
  const palette = heroToneMap[tone] || heroToneMap.blue;

  return (
    <div
      style={{
        padding: "18px",
        borderRadius: "18px",
        background: palette.background,
        display: "grid",
        gap: "8px",
      }}
    >
      <span style={{ color: colors.muted, fontSize: "13px", fontWeight: "600" }}>{label}</span>
      <strong style={{ color: colors.text, fontSize: "24px", lineHeight: 1.2, wordBreak: "break-word" }}>{value}</strong>
    </div>
  );
}

// Shared row styling for the main charge summary list.
function BreakdownRow({ label, value, highlight = false, total = false }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        gap: "12px",
        padding: "14px 16px",
        borderRadius: "14px",
        background: total ? colors.greenSoft : highlight ? "#eef6ff" : "#f4f7fa",
        color: total ? colors.green : colors.text,
        fontWeight: total || highlight ? "800" : "700",
      }}
    >
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}

// Reusable key-value tile for dates, readings, and household details.
function InfoTile({ label, value }) {
  return (
    <div
      style={{
        padding: "14px 16px",
        borderRadius: "14px",
        background: "#f4f7fa",
        display: "grid",
        gap: "6px",
      }}
    >
      <span style={{ color: colors.muted, fontSize: "13px" }}>{label}</span>
      <strong style={{ color: colors.text, wordBreak: "break-word" }}>{value}</strong>
    </div>
  );
}

// Keep empty breakdown sections readable without collapsing the layout.
function EmptyState({ text }) {
  return (
    <div
      style={{
        padding: "18px",
        borderRadius: "16px",
        background: "#f4f7fa",
        color: colors.muted,
      }}
    >
      {text}
    </div>
  );
}

// Normalize optional date fields to a simple display value for the dialog.
function formatDateValue(value) {
  return value ? new Date(value).toLocaleDateString("en-US") : "-";
}

// Keep stored status strings readable in the details view.
function toTitleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const infoGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "12px",
};

const heroToneMap = {
  green: { background: colors.greenSoft },
  blue: { background: colors.blueSoft },
  amber: { background: colors.amberSoft },
  red: { background: colors.redSoft },
};

// Match the dialog footer buttons to the rest of the dashboard actions.
function buttonStyle(kind) {
  if (kind === "secondary") {
    return {
      padding: "11px 18px",
      borderRadius: "12px",
      border: `1px solid ${colors.border}`,
      background: "#ffffff",
      color: colors.text,
      cursor: "pointer",
      fontWeight: "700",
    };
  }

  return {
    padding: "11px 18px",
    borderRadius: "12px",
    border: "none",
    background: colors.green,
    color: "#ffffff",
    cursor: "pointer",
    fontWeight: "700",
  };
}

export default BillDetailsDialog;

