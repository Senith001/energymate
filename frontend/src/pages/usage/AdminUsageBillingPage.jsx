import React from "react";
import { Link } from "react-router-dom";
import { FiActivity, FiCreditCard, FiSliders } from "react-icons/fi";
import { adminCardStyle, adminColors } from "../../components/energy/adminTheme";

function AdminUsageBillingPage() {
  return (
    <div className="grid gap-6 rounded-[28px] border border-slate-200/80 bg-slate-100/70 p-4">
      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Admin Workspace</p>
        <h1 style={{ margin: 0, color: adminColors.text, fontSize: "32px", fontWeight: "700", lineHeight: 1.2 }}>Usage and Billing</h1>
        <p style={{ margin: 0, color: adminColors.muted }}>
          Manage household usage monitoring, billing oversight, and tariff settings from one admin workspace.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px" }}>
        {/* These cards work as a single module landing page instead of exposing several admin tabs at once. */}
        <AdminNavCard
          icon={FiActivity}
          title="Usage Monitoring"
          description="Review household usage summaries, recent entries, and appliance or room breakdowns."
          path="/admin/usage-billing/usage"
          accent={adminColors.amber}
          soft={adminColors.amberSoft}
        />
        <AdminNavCard
          icon={FiCreditCard}
          title="Billing Oversight"
          description="Inspect bill history, totals, paid status, and monthly bill changes for any household."
          path="/admin/usage-billing/billing"
          accent={adminColors.green}
          soft={adminColors.greenSoft}
        />
        <AdminNavCard
          icon={FiSliders}
          title="Tariff Settings"
          description="View and edit the current domestic tariff slabs used for estimates and bill generation."
          path="/admin/usage-billing/tariffs"
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
      className="card grid gap-4 border border-slate-200/80 bg-white px-6 py-6"
      style={{
        ...adminCardStyle,
      }}
    >
      <div className="grid gap-2.5">
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: "42px",
            height: "42px",
            borderRadius: "14px",
            background: "#e8f7ef",
            color: "#10a36c",
            fontWeight: "800",
          }}
        >
          <Icon size={20} />
        </div>
        <h3 style={{ margin: 0, color: "#10a36c", fontWeight: "700", fontSize: "20px" }}>{title}</h3>
        <p style={{ margin: 0, color: adminColors.muted, lineHeight: 1.6 }}>{description}</p>
      </div>

      <div>
        <Link
          to={path}
          // Keep the CTA button-like so the landing page feels like a workspace chooser.
          className="inline-flex items-center justify-center rounded-2xl bg-[#10a36c] px-[14px] py-2 text-sm font-bold text-white no-underline shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#0d8b5c] hover:shadow-md focus:outline-none focus:ring-2 focus:ring-[#10a36c] focus:ring-offset-2"
          style={{
            borderRadius: "14px",
          }}
        >
          Open
        </Link>
      </div>
    </div>
  );
}

export default AdminUsageBillingPage;
