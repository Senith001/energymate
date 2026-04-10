import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";
import api from "../../services/api";
import {
  adminButtonStyle,
  adminCardStyle,
  adminColors,
  adminInputStyle,
  formatAdminCurrency,
} from "../../components/energy/adminTheme";

function AdminTariffPage() {
  const [form, setForm] = useState(null);
  const [draft, setDraft] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  // Load the current domestic tariff once so admins can inspect and edit the live rule set.
  useEffect(() => {
    async function loadTariff() {
      try {
        setLoading(true);
        const response = await api.get("/tariffs");
        const nextTariff = normalizeTariff(response.data?.data || response.data);
        setForm(nextTariff);
        setDraft(nextTariff);
      } catch (err) {
        setError(err.response?.data?.message || "Unable to load the tariff configuration.");
      } finally {
        setLoading(false);
      }
    }

    loadTariff();
  }, []);

  // Edit mode writes into a draft copy so the saved tariff stays viewable until save succeeds.
  function updateSlab(group, index, field, value) {
    setDraft((current) => {
      const nextGroup = [...current[group]];
      nextGroup[index] = {
        ...nextGroup[index],
        [field]: value === "" ? "" : Number(value),
      };

      return { ...current, [group]: nextGroup };
    });
  }

  async function handleSave() {
    try {
      setSaving(true);
      setError("");
      setMessage("");

      // Save the whole tariff set together so slab edits and SSCL changes stay consistent.
      const payload = {
        tariffLow: sanitizeSlabs(draft.tariffLow),
        tariffHigh: sanitizeSlabs(draft.tariffHigh),
        ssclRate: Number(draft.ssclRate),
      };

      const response = await api.put("/tariffs", payload);
      const nextTariff = normalizeTariff(response.data?.data || response.data);
      setForm(nextTariff);
      setDraft(nextTariff);
      setEditing(false);
      setMessage("Tariff configuration updated successfully.");
    } catch (err) {
      setError(err.response?.data?.message || "Unable to save tariff changes.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div style={{ display: "grid", gap: "8px" }}>
        <div>
          <Link to="/admin/usage-billing" style={backLinkStyle}>
            <FiArrowLeft size={16} />
            Back
          </Link>
        </div>
        <h1 style={{ margin: 0, color: adminColors.text, fontSize: "32px", fontWeight: "700", lineHeight: 1.2 }}>Tariff Settings</h1>
        <p style={{ margin: 0, color: adminColors.muted }}>
          Review and update the domestic tariff slabs used by usage estimates, bill generation, and bill previews.
        </p>
      </div>

      {error ? <Message tone="error" text={error} /> : null}
      {message ? <Message tone="success" text={message} /> : null}

      {loading || !form || !draft ? (
        <Message tone="info" text="Loading tariff configuration..." />
      ) : (
        <div style={{ ...adminCardStyle, padding: "28px", display: "grid", gap: "24px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: "16px", alignItems: "flex-start", flexWrap: "wrap" }}>
            <div style={{ display: "grid", gap: "8px" }}>
              <div style={{ color: adminColors.muted, fontSize: "13px", fontWeight: "700", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Domestic Tariff Overview
              </div>
              <h3 style={{ margin: 0, color: adminColors.text, fontSize: "28px" }}>Current Billing Rules</h3>
              <p style={{ margin: 0, color: adminColors.muted, maxWidth: "640px", lineHeight: 1.6 }}>
                Low usage, high usage, and SSCL values are managed together here so the full tariff stays internally consistent.
              </p>
            </div>

            <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
              {!editing ? (
                <button
                  type="button"
                  onClick={() => {
                    // Reset the draft from the last saved tariff every time edit mode starts.
                    setDraft(form);
                    setEditing(true);
                    setMessage("");
                    setError("");
                  }}
                  style={smallAdminButtonStyle("primary")}
                >
                  Edit Tariff
                </button>
              ) : null}
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
            <SummaryTile label="Low Usage Slabs" value={String(draft.tariffLow.length)} tone="amber" />
            <SummaryTile label="High Usage Slabs" value={String(draft.tariffHigh.length)} tone="blue" />
            <SummaryTile label="SSCL Rate" value={Number(draft.ssclRate).toFixed(3)} tone="green" />
          </div>

          <div style={{ display: "grid", gap: "18px" }}>
            <TariffSection
              title="Low Usage Tariff"
              subtitle="Applied when total usage stays within the lower domestic range."
              slabs={draft.tariffLow}
              groupKey="tariffLow"
              onChange={updateSlab}
              editable={editing}
            />

            <TariffSection
              title="High Usage Tariff"
              subtitle="Applied once a household moves beyond the lower domestic slab structure."
              slabs={draft.tariffHigh}
              groupKey="tariffHigh"
              onChange={updateSlab}
              editable={editing}
            />

            <div
              style={{
                border: `1px solid ${adminColors.border}`,
                borderRadius: "20px",
                padding: "20px",
                background: "#f8fafc",
                display: "grid",
                gap: "10px",
                maxWidth: "360px",
              }}
            >
              <div style={{ color: adminColors.text, fontSize: "16px", fontWeight: "800" }}>SSCL Rate</div>
              <div style={{ color: adminColors.muted, lineHeight: 1.5 }}>
                This value is applied after the subtotal is calculated from energy and fixed charges.
              </div>
              {editing ? (
                <input
                  style={adminInputStyle}
                  type="number"
                  min="0"
                  step="0.001"
                  value={draft.ssclRate}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      ssclRate: event.target.value === "" ? "" : Number(event.target.value),
                    }))
                  }
                />
              ) : (
                <div style={{ overflowX: "auto" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                      <tr style={{ borderBottom: `1px solid ${adminColors.border}` }}>
                        <TableHead>Field</TableHead>
                        <TableHead>Value</TableHead>
                      </tr>
                    </thead>
                    <tbody>
                      <tr>
                        <PlainTableCell>SSCL Rate</PlainTableCell>
                        <PlainTableCell>{Number(form.ssclRate).toFixed(3)}</PlainTableCell>
                      </tr>
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {editing ? (
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", flexWrap: "wrap", paddingTop: "4px" }}>
              <button type="button" onClick={handleSave} disabled={saving} style={{ ...smallAdminButtonStyle("primary"), opacity: saving ? 0.7 : 1 }}>
                {saving ? "Saving..." : "Save Tariff"}
              </button>
              <button
                type="button"
                onClick={() => {
                  // Cancel discards in-progress edits and restores the saved tariff immediately.
                  setDraft(form);
                  setEditing(false);
                  setMessage("");
                  setError("");
                }}
                style={smallAdminButtonStyle("secondary")}
              >
                Cancel
              </button>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// Keep each tariff group inside the same parent card, but give it its own quiet section styling.
function TariffSection({ title, subtitle, slabs, groupKey, onChange, editable }) {
  return (
    <div
      style={{
        border: `1px solid ${adminColors.border}`,
        borderRadius: "20px",
        padding: "20px",
        background: "#f8fafc",
        display: "grid",
        gap: "14px",
      }}
    >
      <div style={{ display: "grid", gap: "6px" }}>
        <div style={{ color: adminColors.text, fontSize: "22px", fontWeight: "800", lineHeight: 1.25 }}>{title}</div>
        <div style={{ color: adminColors.muted, lineHeight: 1.5 }}>{subtitle}</div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${adminColors.border}` }}>
              <TableHead>Slab</TableHead>
              <TableHead>Upper Limit</TableHead>
              <TableHead>Rate (Rs.)</TableHead>
              <TableHead>Fixed Charge (Rs.)</TableHead>
            </tr>
          </thead>
          <tbody>
            {slabs.map((slab, index) => (
              <tr key={`${groupKey}-${index}`} style={{ borderBottom: `1px solid ${adminColors.border}` }}>
                {editable ? (
                  <>
                    <TableCell>
                      <SlabBadge index={index} />
                    </TableCell>
                    <TableCell>
                      <input
                        style={adminInputStyle}
                        type="number"
                        min="0"
                        value={slab.upTo ?? ""}
                        placeholder="No limit"
                        onChange={(event) => onChange(groupKey, index, "upTo", event.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        style={adminInputStyle}
                        type="number"
                        min="0"
                        step="0.01"
                        value={slab.rate}
                        onChange={(event) => onChange(groupKey, index, "rate", event.target.value)}
                      />
                    </TableCell>
                    <TableCell>
                      <input
                        style={adminInputStyle}
                        type="number"
                        min="0"
                        step="0.01"
                        value={slab.fixedCharge}
                        onChange={(event) => onChange(groupKey, index, "fixedCharge", event.target.value)}
                      />
                    </TableCell>
                  </>
                ) : (
                  <>
                    <PlainTableCell>{`Slab ${index + 1}`}</PlainTableCell>
                    <PlainTableCell>{slab.upTo ?? "No limit"}</PlainTableCell>
                    <PlainTableCell>{formatAdminCurrency(slab.rate)}</PlainTableCell>
                    <PlainTableCell>{formatAdminCurrency(slab.fixedCharge)}</PlainTableCell>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SummaryTile({ label, value, tone }) {
  const palette = summaryToneMap[tone] || summaryToneMap.blue;

  return (
    <div
      style={{
        borderRadius: "18px",
        background: palette.background,
        border: `1px solid ${palette.border}`,
        padding: "18px",
        display: "grid",
        gap: "8px",
      }}
    >
      <div style={{ color: adminColors.muted, fontSize: "13px", fontWeight: "700" }}>{label}</div>
      <div style={{ color: adminColors.text, fontSize: "24px", fontWeight: "800" }}>{value}</div>
    </div>
  );
}

function Message({ tone, text }) {
  const palette =
    tone === "error"
      ? { background: "#fee2e2", color: adminColors.accent }
      : tone === "success"
        ? { background: "#e8f5ed", color: adminColors.green }
        : { background: "#eaf2ff", color: adminColors.blue };

  return (
    <div style={{ padding: "14px 16px", borderRadius: "16px", background: palette.background, color: palette.color, fontWeight: "600" }}>
      {text}
    </div>
  );
}

function TableHead({ children }) {
  return <th style={{ textAlign: "left", padding: "12px 14px", color: adminColors.muted, fontSize: "14px", fontWeight: "700", letterSpacing: "0.02em" }}>{children}</th>;
}

function TableCell({ children }) {
  return <td style={{ padding: "14px" }}>{children}</td>;
}

function PlainTableCell({ children }) {
  return <td style={{ padding: "16px 14px", color: adminColors.text, fontSize: "14px", fontWeight: "500", lineHeight: 1.45 }}>{children}</td>;
}

function SlabBadge({ index }) {
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        minWidth: "84px",
        padding: "8px 12px",
        borderRadius: "999px",
        background: adminColors.accentSoft,
        color: adminColors.accent,
        fontSize: "13px",
        fontWeight: "800",
      }}
    >
      {`Slab ${index + 1}`}
    </div>
  );
}

// Normalize empty upper limits back to null before sending the tariff payload to the backend.
function sanitizeSlabs(slabs) {
  return slabs.map((slab) => ({
    upTo: slab.upTo === "" ? null : slab.upTo,
    rate: Number(slab.rate),
    fixedCharge: Number(slab.fixedCharge),
  }));
}

// The page accepts either wrapped or raw tariff responses and reshapes them into one predictable format.
function normalizeTariff(value) {
  if (!value) return null;

  return {
    ...value,
    tariffLow: Array.isArray(value.tariffLow) ? value.tariffLow : [],
    tariffHigh: Array.isArray(value.tariffHigh) ? value.tariffHigh : [],
  };
}

const backLinkStyle = {
  display: "inline-flex",
  alignItems: "center",
  gap: "8px",
  color: adminColors.text,
  textDecoration: "none",
  fontWeight: "700",
  fontSize: "14px",
};

const summaryToneMap = {
  green: { background: adminColors.greenSoft, border: "rgba(21, 128, 61, 0.4)" },
  blue: { background: adminColors.blueSoft, border: "rgba(29, 78, 216, 0.38)" },
  amber: { background: adminColors.amberSoft, border: "rgba(180, 83, 9, 0.4)" },
};

function smallAdminButtonStyle(kind) {
  return {
    ...adminButtonStyle(kind),
    padding: "10px 16px",
    fontSize: "14px",
  };
}

export default AdminTariffPage;
