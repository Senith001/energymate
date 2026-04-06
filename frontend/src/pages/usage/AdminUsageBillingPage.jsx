import React from "react";
import { Link } from "react-router-dom";
import { FiActivity, FiCreditCard, FiSliders } from "react-icons/fi";
import { adminCardStyle, adminColors } from "../../components/energy/adminTheme";

function AdminUsageBillingPage() {
  return (
    <div style={{ display: "grid", gap: "24px" }}>
      <div style={{ display: "grid", gap: "8px" }}>
        <h1 style={{ margin: 0, color: adminColors.text }}>Usage and Billing</h1>
        <p style={{ margin: 0, color: adminColors.muted }}>
          Manage household usage monitoring, billing oversight, and tariff settings from one admin workspace.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
        {/* These cards work as a single module landing page instead of exposing several admin tabs at once. */}
        <AdminNavCard
          icon={FiActivity}
          title="Usage Monitoring"
          description="Review household usage summaries, recent entries, and appliance or room breakdowns."
          path="/admin/usage"
          accent={adminColors.amber}
          soft={adminColors.amberSoft}
        />
        <AdminNavCard
          icon={FiCreditCard}
          title="Billing Oversight"
          description="Inspect bill history, totals, paid status, and monthly bill changes for any household."
          path="/admin/billing"
          accent={adminColors.green}
          soft={adminColors.greenSoft}
        />
        <AdminNavCard
          icon={FiSliders}
          title="Tariff Settings"
          description="View and edit the current domestic tariff slabs used for estimates and bill generation."
          path="/admin/tariffs"
          accent={adminColors.blue}
          soft={adminColors.blueSoft}
        />
      </div>
    </div>
  );
}

// Keep the landing page lightweight and action-focused so admins can jump straight into the detailed pages.
function AdminNavCard({ icon: Icon, title, description, path, accent, soft }) {
  return (
    <div
      style={{
        ...adminCardStyle,
        padding: "24px",
        display: "grid",
        gap: "16px",
        background: soft,
      }}
    >
      <div style={{ display: "grid", gap: "10px" }}>
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "42px",
            height: "42px",
            borderRadius: "14px",
            background: "#ffffff",
            color: accent,
            fontWeight: "800",
          }}
        >
          <Icon size={20} />
        </div>
        <h3 style={{ margin: 0, color: adminColors.text }}>{title}</h3>
        <p style={{ margin: 0, color: adminColors.muted, lineHeight: 1.6 }}>{description}</p>
      </div>

      <div>
        <Link
          to={path}
          // Keep the CTA button-like so the landing page feels like a workspace chooser.
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "10px 16px",
            borderRadius: "14px",
            background: "#ffffff",
            color: accent,
            textDecoration: "none",
            fontWeight: "700",
            border: `1px solid ${accent}`,
          }}
        >
          Open
        </Link>
      </div>
    </div>
  );
}

export default AdminUsageBillingPage;
