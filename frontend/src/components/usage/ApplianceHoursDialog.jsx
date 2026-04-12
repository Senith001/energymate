import React, { useEffect, useMemo, useState } from "react";
import { cardStyle, colors } from "../energy/dashboardTheme";

function ApplianceHoursDialog({
  open,
  appliances,
  logs,
  selectedPeriod,
  saving,
  submitError,
  editingLogId,
  initialLog,
  onClose,
  onSubmit,
  onEdit,
  onDelete,
}) {
  const [form, setForm] = useState({
    applianceId: "",
    date: new Date().toISOString().slice(0, 10),
    hoursUsed: "",
  });
  const [selectedLogDate, setSelectedLogDate] = useState("all");

  useEffect(() => {
    if (!open) return;

    // When editing, preload the saved log; otherwise start from a clean create form.
    if (initialLog) {
      setForm({
        applianceId: initialLog.applianceId || "",
        date: toLocalDateInputValue(initialLog.date),
        hoursUsed: String(initialLog.hoursUsed ?? ""),
      });
      return;
    }

    setForm((current) => ({
      applianceId: current.applianceId || appliances[0]?._id || "",
      date: current.date || new Date().toISOString().slice(0, 10),
      hoursUsed: current.hoursUsed || "",
    }));
  }, [open, appliances, initialLog]);

  useEffect(() => {
    if (!open) return;

    // Default the log viewer to the form date so users land on one day's entries instead of the whole month.
    setSelectedLogDate(initialLog ? toLocalDateInputValue(initialLog.date) : toLocalDateInputValue(new Date()));
  }, [open, initialLog]);

  const sortedLogs = useMemo(() => {
    // Keep the latest log at the top so quick corrections are easy right after saving.
    return [...logs].sort((a, b) => new Date(b.date) - new Date(a.date));
  }, [logs]);

  const visibleLogs = useMemo(() => {
    if (selectedLogDate === "all") return sortedLogs;
    return sortedLogs.filter((log) => toLocalDateInputValue(log.date) === selectedLogDate);
  }, [selectedLogDate, sortedLogs]);

  function handleToggleShowAll() {
    setSelectedLogDate((current) => (current === "all" ? form.date || toLocalDateInputValue(new Date()) : "all"));
  }

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(15, 23, 42, 0.35)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1200,
        padding: "24px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          ...cardStyle,
          width: "min(760px, 100%)",
          maxWidth: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          overflowX: "hidden",
          padding: "24px",
          boxSizing: "border-box",
        }}
        onClick={(event) => event.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "12px", marginBottom: "18px" }}>
          <div>
            <div style={{ fontSize: "22px", fontWeight: "800", color: colors.text }}>
              {editingLogId ? "Edit Appliance Hours" : "Log Appliance Hours"}
            </div>
            <div style={{ color: colors.muted, marginTop: "6px" }}>
              Save daily hours for appliances in {selectedPeriod.label} so the breakdown uses real activity when available.
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={ghostButtonStyle}
          >
            Close
          </button>
        </div>

        <div
          style={{
            display: "grid",
            // Use wider wrapping columns here so date and hours fields drop to the next row instead of causing horizontal scroll.
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            gap: "14px",
            marginBottom: "14px",
            alignItems: "start",
            width: "100%",
          }}
        >
          <Field label="Appliance">
            <select
              value={form.applianceId}
              onChange={(event) => setForm((current) => ({ ...current, applianceId: event.target.value }))}
              style={inputStyle}
            >
              <option value="">Select appliance</option>
              {appliances.map((appliance) => (
                <option key={appliance._id} value={appliance._id}>
                  {appliance.name}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Date">
            <input
              type="date"
              value={form.date}
              onChange={(event) => setForm((current) => ({ ...current, date: event.target.value }))}
              style={inputStyle}
            />
          </Field>

          <Field label="Hours Used">
            <input
              type="number"
              min="0"
              max="24"
              step="0.1"
              placeholder="e.g. 3.5"
              value={form.hoursUsed}
              onChange={(event) => setForm((current) => ({ ...current, hoursUsed: event.target.value }))}
              style={inputStyle}
            />
          </Field>
        </div>

        {submitError ? (
          <div
            style={{
              background: colors.redSoft,
              color: colors.red,
              borderRadius: "12px",
              padding: "12px 14px",
              marginBottom: "14px",
            }}
          >
            {submitError}
          </div>
        ) : null}

        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "22px" }}>
          <button
            type="button"
            onClick={() => onSubmit(form)}
            disabled={saving}
            style={{
              border: "none",
              background: colors.green,
              color: "#ffffff",
              padding: "11px 16px",
              borderRadius: "12px",
              fontWeight: "700",
              cursor: saving ? "not-allowed" : "pointer",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? "Saving..." : editingLogId ? "Save Changes" : "Save Hours"}
          </button>
        </div>

        <div>
          <div style={{ fontSize: "17px", fontWeight: "800", color: colors.text, marginBottom: "12px" }}>
            Logged Hours for {selectedPeriod.label}
          </div>

          <div style={{ display: "grid", gap: "8px", marginBottom: "14px" }}>
            <span style={{ fontWeight: "700", color: colors.text }}>View Logs for Date</span>
            <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
              <input
                type="date"
                value={selectedLogDate === "all" ? "" : selectedLogDate}
                onChange={(event) => setSelectedLogDate(event.target.value || "all")}
                style={{ ...inputStyle, minWidth: "210px", width: "auto" }}
              />
              <button
                type="button"
                onClick={handleToggleShowAll}
                style={ghostButtonStyle}
              >
                {selectedLogDate === "all" ? "Show Today" : "Show All"}
              </button>
            </div>
          </div>

          {visibleLogs.length ? (
            <div style={{ display: "grid", gap: "10px" }}>
              {visibleLogs.map((log) => {
                const applianceName = appliances.find((item) => item._id === log.applianceId)?.name || "Appliance";
                return (
                  <div
                    key={log._id}
                    style={{
                      border: `1px solid ${colors.border}`,
                      borderRadius: "14px",
                      padding: "14px 16px",
                      display: "flex",
                      justifyContent: "space-between",
                      gap: "12px",
                      flexWrap: "wrap",
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: "700", color: colors.text }}>{applianceName}</div>
                      <div style={{ color: colors.muted, marginTop: "4px" }}>
                        {new Date(log.date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
                      <div style={{ fontWeight: "700", color: colors.text }}>{Number(log.hoursUsed || 0).toFixed(1)} hrs</div>
                      <button type="button" onClick={() => onEdit(log)} style={miniButtonStyle}>
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => onDelete(log)}
                        style={{ ...miniButtonStyle, background: colors.redSoft, color: colors.red, border: `1px solid ${colors.redSoft}` }}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: colors.muted }}>
              {sortedLogs.length
                ? "No appliance-hour logs match the selected date."
                : "No appliance-hour logs yet for this period."}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label style={{ display: "grid", gap: "8px", color: colors.text }}>
      <span style={{ fontWeight: "700" }}>{label}</span>
      {children}
    </label>
  );
}

const inputStyle = {
  width: "100%",
  borderRadius: "12px",
  border: `1px solid ${colors.border}`,
  padding: "11px 12px",
  outline: "none",
  background: "#ffffff",
  color: colors.text,
  boxSizing: "border-box",
};

const ghostButtonStyle = {
  border: `1px solid ${colors.border}`,
  background: "#ffffff",
  color: colors.text,
  padding: "10px 14px",
  borderRadius: "12px",
  fontWeight: "700",
  cursor: "pointer",
};

const miniButtonStyle = {
  border: `1px solid ${colors.blueSoft}`,
  background: colors.blueSoft,
  color: colors.blue,
  padding: "8px 10px",
  borderRadius: "10px",
  fontWeight: "700",
  cursor: "pointer",
};

export default ApplianceHoursDialog;

function toLocalDateInputValue(value) {
  const date = new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}