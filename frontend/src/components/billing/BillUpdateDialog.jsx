import React, { useEffect, useState } from "react";
import { cardStyle, colors } from "../energy/dashboardTheme";

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

const labelStyle = { display: "grid", gap: "8px", color: colors.text, fontWeight: "600" };

// This dialog updates editable bill fields from the bill controller.
function BillUpdateDialog({ open, bill, onClose, onSubmit, submitting }) {
  const [form, setForm] = useState({
    month: "",
    year: "",
    mode: "units",
    totalUnits: "",
    previousReading: "",
    currentReading: "",
    status: "unpaid",
    paidAt: "",
  });

  useEffect(() => {
    if (open && bill) {
      setForm({
        month: bill.month ?? "",
        year: bill.year ?? "",
        mode: bill.previousReading != null || bill.currentReading != null ? "readings" : "units",
        totalUnits: bill.totalUnits ?? "",
        previousReading: bill.previousReading ?? "",
        currentReading: bill.currentReading ?? "",
        status: bill.status || "unpaid",
        paidAt: bill.paidAt ? new Date(bill.paidAt).toISOString().slice(0, 10) : "",
      });
    }
  }, [bill, open]);

  if (!open || !bill) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...cardStyle, width: "100%", maxWidth: "620px", padding: "24px" }} onClick={(event) => event.stopPropagation()}>
        <h3 style={{ margin: "0 0 18px 0", fontSize: "22px", color: colors.text }}>Update Bill</h3>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit(form);
          }}
          style={{ display: "grid", gap: "16px" }}
        >
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
            <label style={labelStyle}>
              Month
              <input
                style={inputStyle}
                type="number"
                min="1"
                max="12"
                value={form.month}
                onChange={(event) => setForm({ ...form, month: event.target.value })}
              />
            </label>
            <label style={labelStyle}>
              Year
              <input
                style={inputStyle}
                type="number"
                min="2000"
                max="2100"
                value={form.year}
                onChange={(event) => setForm({ ...form, year: event.target.value })}
              />
            </label>
          </div>

          <div style={{ display: "grid", gap: "10px" }}>
            <div style={{ color: colors.text, fontWeight: "600" }}>Update Mode</div>
            <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
              <button type="button" onClick={() => setForm({ ...form, mode: "units" })} style={pillStyle(form.mode === "units")}>
                Total Units
              </button>
              <button type="button" onClick={() => setForm({ ...form, mode: "readings" })} style={pillStyle(form.mode === "readings")}>
                Meter Readings
              </button>
            </div>
          </div>

          {form.mode === "readings" ? (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
              <label style={labelStyle}>
                Previous Reading
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  value={form.previousReading}
                  onChange={(event) => setForm({ ...form, previousReading: event.target.value })}
                />
              </label>
              <label style={labelStyle}>
                Current Reading
                <input
                  style={inputStyle}
                  type="number"
                  min="0"
                  value={form.currentReading}
                  onChange={(event) => setForm({ ...form, currentReading: event.target.value })}
                />
              </label>
            </div>
          ) : (
            <label style={labelStyle}>
              Total Units (kWh)
              <input
                style={inputStyle}
                type="number"
                min="0"
                value={form.totalUnits}
                onChange={(event) => setForm({ ...form, totalUnits: event.target.value })}
              />
            </label>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
            <label style={labelStyle}>
              Status
              <select style={inputStyle} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })}>
                <option value="unpaid">Unpaid</option>
                <option value="paid">Paid</option>
              </select>
            </label>
            <label style={labelStyle}>
              Paid Date
              <input
                style={inputStyle}
                type="date"
                value={form.paidAt}
                onChange={(event) => setForm({ ...form, paidAt: event.target.value })}
              />
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px", flexWrap: "wrap" }}>
            <button type="button" onClick={onClose} style={buttonStyle("secondary")}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} style={{ ...buttonStyle("primary"), opacity: submitting ? 0.7 : 1 }}>
              {submitting ? "Saving..." : "Update Bill"}
            </button>
          </div>
        </form>
      </div>
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

function pillStyle(active) {
  return {
    padding: "10px 14px",
    borderRadius: "999px",
    border: `1px solid ${active ? colors.green : colors.border}`,
    background: active ? colors.greenSoft : "#ffffff",
    color: active ? colors.green : colors.text,
    fontWeight: "700",
    cursor: "pointer",
  };
}

export default BillUpdateDialog;
