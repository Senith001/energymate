import React, { useEffect, useState } from "react";
import { colors, cardStyle } from "../energy/dashboardTheme";
import { validateUsageForm } from "../../utils/usageValidation";

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

// Reuse the same dialog for both creating and editing usage entries.
function UsageEntryDialog({
  open,
  onClose,
  onSubmit,
  submitting,
  submitError = "",
  initialValues = null,
  title = "Add Usage Entry",
  submitLabel = "Save Entry",
}) {
  const defaultForm = {
    date: new Date().toISOString().slice(0, 10),
    entryType: "manual",
    unitsUsed: "",
    previousReading: "",
    currentReading: "",
  };
  const [form, setForm] = useState(defaultForm);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (open) {
      setFormError("");
      // Fill the form with an existing record when the dialog is used for editing.
      setForm({
        date: initialValues?.date ? new Date(initialValues.date).toISOString().slice(0, 10) : defaultForm.date,
        entryType: initialValues?.entryType || defaultForm.entryType,
        unitsUsed: initialValues?.unitsUsed ?? defaultForm.unitsUsed,
        previousReading: initialValues?.previousReading ?? defaultForm.previousReading,
        currentReading: initialValues?.currentReading ?? defaultForm.currentReading,
      });
    }
  }, [defaultForm.currentReading, defaultForm.date, defaultForm.entryType, defaultForm.previousReading, defaultForm.unitsUsed, initialValues, open]);

  if (!open) return null;

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={{ ...cardStyle, width: "100%", maxWidth: "520px", padding: "24px" }} onClick={(event) => event.stopPropagation()}>
        <h3 style={{ margin: "0 0 18px 0", fontSize: "22px", color: colors.text }}>{title}</h3>
        {formError || submitError ? <InlineError text={formError || submitError} /> : null}
        <form
          onSubmit={(event) => {
            event.preventDefault();
            const nextError = validateUsageForm(form);
            setFormError(nextError);
            if (nextError) return;
            onSubmit(form);
          }}
          style={{ display: "grid", gap: "16px" }}
        >
          <label style={labelStyle}>
            Date
            <input
              // Keep the original day fixed during edits so updates do not accidentally move historical usage records.
              style={{
                ...inputStyle,
                background: initialValues ? colors.slateSoft : "#ffffff",
                color: initialValues ? colors.muted : colors.text,
                cursor: initialValues ? "not-allowed" : "text",
              }}
              type="date"
              value={form.date}
              onChange={(event) => setForm({ ...form, date: event.target.value })}
              disabled={Boolean(initialValues)}
            />
          </label>

          <label style={labelStyle}>
            Entry Type
            <select
              style={inputStyle}
              value={form.entryType}
              onChange={(event) => setForm({ ...form, entryType: event.target.value })}
            >
              <option value="manual">Manual</option>
              <option value="meter">Meter Reading</option>
            </select>
          </label>

          {form.entryType === "meter" ? (
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
              Units Used (kWh)
              <input
                style={inputStyle}
                type="number"
                min="0"
                value={form.unitsUsed}
                onChange={(event) => setForm({ ...form, unitsUsed: event.target.value })}
              />
            </label>
          )}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px", flexWrap: "wrap" }}>
            <button type="button" onClick={onClose} style={{ ...buttonStyle("secondary") }}>
              Cancel
            </button>
            <button type="submit" disabled={submitting} style={{ ...buttonStyle("primary"), opacity: submitting ? 0.7 : 1 }}>
              {submitting ? "Saving..." : submitLabel}
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

export default UsageEntryDialog;
