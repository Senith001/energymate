import React, { useEffect, useState } from "react";
import { cardStyle, colors } from "../energy/dashboardTheme";
import { validateBillForm } from "../../utils/billingValidation";

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

// This dialog updates only bill values; payment state is handled separately from edits.
function BillUpdateDialog({ open, bill, onClose, onSubmit, submitting, submitError = "" }) {
  const [form, setForm] = useState({
    month: "",
    year: "",
    mode: "units",
    totalUnits: "",
    previousReading: "",
    currentReading: "",
  });
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (open && bill) {
      setFormError("");
      setForm({
        month: bill.month ?? "",
        year: bill.year ?? "",
        mode: bill.previousReading != null || bill.currentReading != null ? "readings" : "units",
        totalUnits: bill.totalUnits ?? "",
        previousReading: bill.previousReading ?? "",
        currentReading: bill.currentReading ?? "",
      });
    }
  }, [bill, open]);

  if (!open || !bill) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...cardStyle, width: "100%", maxWidth: "620px", padding: "24px" }} onClick={(event) => event.stopPropagation()}>
        <h3 style={{ margin: "0 0 18px 0", fontSize: "22px", color: colors.text }}>Update Bill</h3>
        {formError || submitError ? <InlineError text={formError || submitError} /> : null}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const validationError = validateBillForm(form);
            setFormError(validationError);
            if (validationError) return;
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
                // Keep the billing period fixed during updates so edits do not accidentally move a bill into another month.
                disabled
                value={form.month}
              />
            </label>
            <label style={labelStyle}>
              Year
              <input
                style={inputStyle}
                type="number"
                min="2000"
                max="2100"
                disabled
                value={form.year}
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
                  step="0.1"
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
                  step="0.1"
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
                step="0.1"
                value={form.totalUnits}
                onChange={(event) => setForm({ ...form, totalUnits: event.target.value })}
              />
            </label>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px", flexWrap: "wrap" }}>
            <button type="button" onClick={onClose} className="btn-secondary shadow-sm" style={buttonStyle("secondary")}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="inline-flex items-center gap-2 rounded-xl bg-[#10a36c] px-4 py-2 text-white font-semibold shadow-sm transition-all duration-200 hover:bg-[#0d8b5c] focus:outline-none focus:ring-2 focus:ring-[#10a36c] focus:ring-offset-2 disabled:opacity-70" style={{ ...buttonStyle("primary"), opacity: submitting ? 0.7 : 1 }}>
              {submitting ? "Saving..." : "Update Bill"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Reuse the standard primary/secondary dialog button styling.
function buttonStyle(kind) {
  if (kind === "secondary") {
    return {
      padding: "11px 18px",
      borderRadius: "12px",
      cursor: "pointer",
      fontWeight: "700",
    };
  }

  return {
    padding: "11px 18px",
    borderRadius: "12px",
    cursor: "pointer",
    fontWeight: "700",
  };
}

// Toggle between direct units and meter-reading update modes.
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

// Inline error banner for update failures returned from the page handler.
function InlineError({ text }) {
  return (
    <div
      style={{
        marginBottom: "16px",
        padding: "12px 14px",
        borderRadius: "12px",
        background: colors.redSoft,
        color: colors.red,
        fontWeight: "600",
      }}
    >
      {text}
    </div>
  );
}

export default BillUpdateDialog;
