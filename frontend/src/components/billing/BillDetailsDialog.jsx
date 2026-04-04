import React from "react";
import { cardStyle, colors, formatCurrency, formatMonthYear } from "../energy/dashboardTheme";

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

// This dialog is read-only so viewing a bill stays separate from updating it.
function BillDetailsDialog({ open, bill, onClose, householdName }) {
  if (!open || !bill) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...cardStyle, width: "100%", maxWidth: "760px", padding: "24px" }} onClick={(event) => event.stopPropagation()}>
        <h3 style={{ margin: "0 0 18px 0", fontSize: "22px", color: colors.text }}>
          {formatMonthYear(bill.month, bill.year)} Bill
        </h3>

        <div style={{ display: "grid", gap: "18px" }}>
          <Section title="Bill Summary">
            <div style={infoGridStyle}>
              <InfoTile label="Status" value={toTitleCase(bill.status || "unpaid")} />
              <InfoTile label="Total Units" value={`${Number(bill.totalUnits || 0).toFixed(1)} kWh`} />
              <InfoTile label="Subtotal" value={formatCurrency(bill.subTotal)} />
              <InfoTile label="Total Cost" value={formatCurrency(bill.totalCost)} />
            </div>
          </Section>

          <Section title="Meter Details">
            <div style={infoGridStyle}>
              <InfoTile label="Previous Reading" value={bill.previousReading ?? "-"} />
              <InfoTile label="Current Reading" value={bill.currentReading ?? "-"} />
              <InfoTile label="Household Name" value={householdName || "Selected Household"} />
              <InfoTile label="Billing Period" value={formatMonthYear(bill.month, bill.year)} />
            </div>
          </Section>

          <Section title="Charge Breakdown">
            <div style={{ display: "grid", gap: "12px" }}>
              <InfoRow label="Energy Charge" value={formatCurrency(bill.energyCharge)} />
              <InfoRow label="Fixed Charge" value={formatCurrency(bill.fixedCharge)} />
              <InfoRow label="Subtotal" value={formatCurrency(bill.subTotal)} />
              <InfoRow label="SSCL" value={formatCurrency(bill.sscl)} />
              <InfoRow label="Total Cost" value={formatCurrency(bill.totalCost)} />
              {bill.breakdown?.length ? (
                <div style={{ display: "grid", gap: "10px" }}>
                  {bill.breakdown.map((item, index) => (
                    <InfoRow
                      key={`${item.range}-${index}`}
                      label={`${item.range} (${Number(item.units || 0).toFixed(1)} units × Rs. ${Number(item.rate || 0).toFixed(2)})`}
                      value={formatCurrency(item.cost)}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          </Section>

          <Section title="Important Dates">
            <div style={infoGridStyle}>
              <InfoTile label="Due Date" value={formatDateValue(bill.dueDate)} />
              <InfoTile label="Paid Date" value={formatDateValue(bill.paidAt)} />
              <InfoTile label="Created At" value={formatDateValue(bill.createdAt)} />
              <InfoTile label="Updated At" value={formatDateValue(bill.updatedAt)} />
            </div>
          </Section>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "20px", flexWrap: "wrap" }}>
          <button type="button" onClick={onClose} style={buttonStyle("secondary")}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <div style={{ display: "grid", gap: "12px" }}>
      <div style={{ color: colors.text, fontSize: "16px", fontWeight: "800" }}>{title}</div>
      {children}
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

function formatDateValue(value) {
  return value ? new Date(value).toLocaleDateString("en-US") : "-";
}

function toTitleCase(value) {
  return value.charAt(0).toUpperCase() + value.slice(1);
}

const infoGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: "12px",
};

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
