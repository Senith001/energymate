import React, { useEffect, useState } from "react";
import { colors, cardStyle, formatCurrency } from "../energy/dashboardTheme";
import { validateBillForm } from "../../utils/billingValidation";
import { getTariff } from "../../utils/billingAPI";
import { getEstimatedCost } from "../../utils/usageAPI";
import { BillSummaryContent } from "./BillDetailsDialog";

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

// This dialog can either create a bill directly or preview a calculated bill before saving it.
function BillDialog({
  open,
  onClose,
  onSubmit,
  submitting,
  month,
  year,
  householdId = "",
  calculatorMode = false,
  submitError = "",
}) {
  const [form, setForm] = useState({
    month: month || new Date().getMonth() + 1,
    year: year || new Date().getFullYear(),
    mode: "units",
    source: calculatorMode ? "manual" : "manual",
    totalUnits: "",
    previousReading: "",
    currentReading: "",
  });
  const [formError, setFormError] = useState("");
  const [preview, setPreview] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setFormError("");
      setPreview(null);
      setForm({
        month: month || new Date().getMonth() + 1,
        year: year || new Date().getFullYear(),
        mode: "units",
        source: calculatorMode ? "manual" : "manual",
        totalUnits: "",
        previousReading: "",
        currentReading: "",
      });
    }
  }, [month, open, year, calculatorMode]);

  if (!open) return null;

  // Reset any previous preview when the form changes so saved bills always match what is visible.
  function updateForm(patch) {
    setPreview(null);
    setFormError("");
    setForm((current) => ({ ...current, ...patch }));
  }

  async function handleCalculate() {
    try {
      setPreviewLoading(true);
      setFormError("");

      if (form.source === "usage") {
        if (!householdId) {
          throw new Error("A household must be selected before using usage entries.");
        }

        const estimatePayload = await getEstimatedCost(householdId, Number(form.month), Number(form.year));
        setPreview(estimatePayload.data || estimatePayload);
        return;
      }

      const validationError = validateBillForm(form);
      if (validationError) {
        throw new Error(validationError);
      }

      const tariffPayload = await getTariff();
      const tariff = tariffPayload.data || tariffPayload;
      const totalUnits =
        form.mode === "readings"
          ? Number(form.currentReading) - Number(form.previousReading)
          : Number(form.totalUnits);

      setPreview(calculateManualPreview(totalUnits, tariff));
    } catch (err) {
      setFormError(err.message || "Unable to calculate the bill.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();

    if (!calculatorMode) {
      const validationError = validateBillForm(form);
      setFormError(validationError);
      if (validationError) return;
      onSubmit({ ...form, source: "manual" });
      return;
    }

    if (!preview) {
      await handleCalculate();
      return;
    }

    onSubmit({ ...form, source: form.source, preview });
  }

  const title = calculatorMode ? "Calculate Bill" : "Add Bill";
  const submitLabel = calculatorMode ? (preview ? "Save Bill" : "Calculate Bill") : "Add Bill";

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div
        style={{
          ...cardStyle,
          width: "100%",
          maxWidth: preview ? "860px" : "620px",
          padding: preview ? "0" : "24px",
          maxHeight: "calc(100vh - 40px)",
          overflowY: "auto",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        {!preview ? (
          <>
        <h3 style={{ margin: "0 0 18px 0", fontSize: "22px", color: colors.text }}>{title}</h3>
        {formError || submitError ? <InlineError text={formError || submitError} /> : null}
        <form onSubmit={handleSubmit} style={{ display: "grid", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
            <label style={labelStyle}>
              Month
              <input
                style={inputStyle}
                type="number"
                min="1"
                max="12"
                value={form.month}
                onChange={(event) => updateForm({ month: event.target.value })}
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
                onChange={(event) => updateForm({ year: event.target.value })}
              />
            </label>
          </div>

          {calculatorMode ? (
            <div style={{ display: "grid", gap: "10px" }}>
              <div style={{ color: colors.text, fontWeight: "600" }}>Calculation Source</div>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                <button type="button" onClick={() => updateForm({ source: "manual" })} style={pillStyle(form.source === "manual")}>
                  Enter Details
                </button>
                <button type="button" onClick={() => updateForm({ source: "usage" })} style={pillStyle(form.source === "usage")}>
                  Use Current Usage
                </button>
              </div>
            </div>
          ) : null}

          {form.source === "manual" ? (
            <>
              <div style={{ display: "grid", gap: "10px" }}>
                <div style={{ color: colors.text, fontWeight: "600" }}>Entry Mode</div>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  <button type="button" onClick={() => updateForm({ mode: "units" })} style={pillStyle(form.mode === "units")}>
                    Total Units
                  </button>
                  <button type="button" onClick={() => updateForm({ mode: "readings" })} style={pillStyle(form.mode === "readings")}>
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
                      onChange={(event) => updateForm({ previousReading: event.target.value })}
                    />
                  </label>
                  <label style={labelStyle}>
                    Current Reading
                    <input
                      style={inputStyle}
                      type="number"
                      min="0"
                      value={form.currentReading}
                      onChange={(event) => updateForm({ currentReading: event.target.value })}
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
                    onChange={(event) => updateForm({ totalUnits: event.target.value })}
                  />
                </label>
              )}
            </>
          ) : (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: "14px",
                background: colors.blueSoft,
                color: colors.text,
                lineHeight: 1.5,
              }}
            >
              The calculator will estimate this bill from the current saved usage entries for the selected month and year.
            </div>
          )}

          {preview ? <PreviewCard preview={preview} /> : null}

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", marginTop: "8px", flexWrap: "wrap" }}>
            <button type="button" onClick={onClose} style={buttonStyle("secondary")}>
              Cancel
            </button>
            <button type="submit" disabled={submitting || previewLoading} style={{ ...buttonStyle("primary"), opacity: submitting || previewLoading ? 0.7 : 1 }}>
              {previewLoading ? "Calculating..." : submitting ? "Saving..." : submitLabel}
            </button>
          </div>
        </form>
          </>
        ) : (
          <BillSummaryContent
            bill={{ ...preview, month: Number(form.month), year: Number(form.year) }}
            householdName=""
            previewMode
            footer={
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", flexWrap: "wrap" }}>
                <button type="button" onClick={() => setPreview(null)} style={buttonStyle("secondary")}>
                  Back
                </button>
                <button type="button" onClick={onClose} style={buttonStyle("secondary")}>
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => onSubmit({ ...form, source: form.source, preview })}
                  disabled={submitting}
                  style={{ ...buttonStyle("primary"), opacity: submitting ? 0.7 : 1 }}
                >
                  {submitting ? "Saving..." : "Save Bill"}
                </button>
              </div>
            }
          />
        )}
      </div>
    </div>
  );
}

// Mirror the backend tariff logic so manual bills can be previewed before any bill record is created.
function calculateManualPreview(totalUnits, tariff) {
  const slabs = totalUnits <= 60 ? tariff.tariffLow : tariff.tariffHigh;
  let remaining = totalUnits;
  let energyCharge = 0;
  let fixedCharge = 0;
  const breakdown = [];
  let prevLimit = 0;

  for (const slab of slabs) {
    if (remaining <= 0) break;

    const upTo = slab.upTo === null ? Infinity : slab.upTo;
    const slabWidth = upTo === Infinity ? remaining : upTo - prevLimit;
    const unitsInSlab = Math.min(remaining, slabWidth);
    const cost = +(unitsInSlab * slab.rate).toFixed(2);

    breakdown.push({
      range: `${prevLimit + 1}-${prevLimit + unitsInSlab} kWh`,
      units: unitsInSlab,
      rate: slab.rate,
      cost,
    });

    energyCharge += cost;
    if (slab.fixedCharge > fixedCharge) fixedCharge = slab.fixedCharge;
    remaining -= unitsInSlab;
    prevLimit = upTo === Infinity ? prevLimit + unitsInSlab : upTo;
  }

  const subTotal = +(energyCharge + fixedCharge).toFixed(2);
  const sscl = +(subTotal * tariff.ssclRate).toFixed(2);
  const totalCost = +(subTotal + sscl).toFixed(2);

  return {
    totalUnits,
    energyCharge: +energyCharge.toFixed(2),
    fixedCharge,
    subTotal,
    sscl,
    totalCost,
    breakdown,
  };
}

// Reuse the standard primary/secondary dialog button styling.
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

// Toggle between the available calculator or entry modes without leaving the dialog.
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

export default BillDialog;
