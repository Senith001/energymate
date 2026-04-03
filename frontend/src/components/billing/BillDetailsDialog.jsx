import React, { useEffect, useState } from "react";
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

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: "12px",
  border: `1px solid ${colors.border}`,
  fontSize: "14px",
  boxSizing: "border-box",
};

// This dialog shows one bill and lets the user update non-admin fields like payment status.
function BillDetailsDialog({ open, bill, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState({ status: "unpaid", paidAt: "" });

  useEffect(() => {
    if (open && bill) {
      setForm({
        status: bill.status || "unpaid",
        paidAt: bill.paidAt ? new Date(bill.paidAt).toISOString().slice(0, 10) : "",
      });
    }
  }, [bill, open]);

  if (!open || !bill) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...cardStyle, width: "100%", maxWidth: "560px", padding: "24px" }} onClick={(event) => event.stopPropagation()}>
        <h3 style={{ margin: "0 0 18px 0", fontSize: "22px", color: colors.text }}>
          {formatMonthYear(bill.month, bill.year)} Bill
        </h3>

        <div style={{ display: "grid", gap: "12px", marginBottom: "18px" }}>
          <InfoRow label="Units Used" value={`${Number(bill.totalUnits || 0).toFixed(1)} kWh`} />
          <InfoRow label="Total Cost" value={formatCurrency(bill.totalCost)} />
          <InfoRow label="Energy Charge" value={formatCurrency(bill.energyCharge)} />
          <InfoRow label="Fixed Charge" value={formatCurrency(bill.fixedCharge)} />
          <InfoRow label="SSCL" value={formatCurrency(bill.sscl)} />
          <InfoRow label="Due Date" value={bill.dueDate ? new Date(bill.dueDate).toLocaleDateString("en-US") : "-"} />
        </div>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(form);
          }}
          style={{ display: "grid", gap: "14px" }}
        >
          <label style={{ display: "grid", gap: "8px", color: colors.text, fontWeight: "600" }}>
            Status
            <select style={inputStyle} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
              <option value="unpaid">Unpaid</option>
              <option value="paid">Paid</option>
            </select>
          </label>

          <label style={{ display: "grid", gap: "8px", color: colors.text, fontWeight: "600" }}>
            Paid Date
            <input
              style={inputStyle}
              type="date"
              value={form.paidAt}
              onChange={(event) => setForm({ ...form, paidAt: event.target.value })}
            />
          </label>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px", flexWrap: "wrap" }}>
            <button type="button" onClick={onClose} style={buttonStyle("secondary")}>
              Close
            </button>
            <button type="submit" disabled={submitting} style={{ ...buttonStyle("primary"), opacity: submitting ? 0.7 : 1 }}>
              {submitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
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
