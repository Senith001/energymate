import React, { useEffect, useState } from "react";
import EnergyShell from "../components/energy/EnergyShell";
import MetricCard from "../components/energy/MetricCard";
import BillDetailsDialog from "../components/billing/BillDetailsDialog";
import BillingTableCard from "../components/billing/BillingTableCard";
import BillDialog from "../components/billing/BillDialog";
import { cardStyle, colors, formatCurrency, formatMonthYear, getStatusTone } from "../components/energy/dashboardTheme";
import { createBill, generateBill, getBillById, getBillComparison, getBills, regenerateBill, updateBill } from "../utils/billingAPI";
import { getUsages } from "../utils/usageAPI";

function BillingPage() {
  // Keep the selected household id locally for billing-related API calls.
  const [householdId, setHouseholdId] = useState(localStorage.getItem("selectedHouseholdId") || localStorage.getItem("householdId") || "");
  const [bills, setBills] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [busyBillId, setBusyBillId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadBillingPage();
  }, []);

  useEffect(() => {
    if (householdId) {
      loadComparison(householdId, selectedPeriod.month, selectedPeriod.year);
    }
  }, [householdId, selectedPeriod.month, selectedPeriod.year]);

  async function loadBillingPage() {
    try {
      setLoading(true);
      setError("");

      let resolvedHouseholdId = householdId;
      if (!resolvedHouseholdId) {
        const usagePayload = await getUsages();
        resolvedHouseholdId =
          usagePayload.data?.[0]?.householdId ||
          "";
        setHouseholdId(resolvedHouseholdId);
      }

      if (!resolvedHouseholdId) {
        setLoading(false);
        return;
      }

      const billsPayload = await getBills(resolvedHouseholdId);
      const billRows = billsPayload.data || [];
      setBills(billRows);

      if (billRows.length) {
        setSelectedPeriod({ month: billRows[0].month, year: billRows[0].year });
      } else {
        setLoading(false);
      }
    } catch (err) {
      setError(err.message || "Unable to load billing dashboard.");
      setLoading(false);
    }
  }

  async function loadComparison(activeHouseholdId, month, year) {
    try {
      setLoading(true);
      const [billsPayload, comparisonPayload] = await Promise.all([getBills(activeHouseholdId), getBillComparison(activeHouseholdId, month, year)]);
      setBills(billsPayload.data || []);
      setComparison(comparisonPayload.data || null);
      setLoading(false);
    } catch (err) {
      setError(err.message || "Unable to load billing comparison.");
      setLoading(false);
    }
  }

  async function handleCreateBill(form) {
    if (!householdId) return;

    try {
      setSubmitting(true);
      setError("");

      const payload = {
        householdId,
        month: Number(form.month),
        year: Number(form.year),
      };

      if (form.mode === "readings") {
        payload.previousReading = Number(form.previousReading);
        payload.currentReading = Number(form.currentReading);
      } else {
        payload.totalUnits = Number(form.totalUnits);
      }

      await createBill(payload);
      setDialogOpen(false);
      setSelectedPeriod({ month: payload.month, year: payload.year });
      await loadComparison(householdId, payload.month, payload.year);
    } catch (err) {
      setError(err.message || "Unable to create bill.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGenerateBill() {
    if (!householdId) return;

    try {
      setGenerating(true);
      setError("");
      await generateBill(householdId, selectedPeriod.month, selectedPeriod.year);
      await loadComparison(householdId, selectedPeriod.month, selectedPeriod.year);
    } catch (err) {
      setError(err.message || "Unable to generate bill.");
    } finally {
      setGenerating(false);
    }
  }

  // Load one bill into the details dialog so the user can review and update its status.
  async function handleViewBill(row) {
    try {
      setError("");
      const payload = await getBillById(row._id);
      setSelectedBill(payload.data || row);
      setDetailsOpen(true);
    } catch (err) {
      setError(err.message || "Unable to load bill details.");
    }
  }

  // Save non-admin bill updates such as marking a bill as paid.
  async function handleSaveBillDetails(form) {
    if (!selectedBill?._id) return;

    try {
      setSubmitting(true);
      setError("");
      const payload = {
        status: form.status,
      };

      if (form.paidAt) {
        payload.paidAt = form.paidAt;
      }

      await updateBill(selectedBill._id, payload);
      setDetailsOpen(false);
      await loadComparison(householdId, selectedPeriod.month, selectedPeriod.year);
    } catch (err) {
      setError(err.message || "Unable to update bill.");
    } finally {
      setSubmitting(false);
    }
  }

  // Recalculate an existing bill from the latest usage data.
  async function handleRegenerateExistingBill(row) {
    try {
      setBusyBillId(row._id);
      setError("");
      await regenerateBill(row._id);
      await loadComparison(householdId, selectedPeriod.month, selectedPeriod.year);
    } catch (err) {
      setError(err.message || "Unable to regenerate bill.");
    } finally {
      setBusyBillId("");
    }
  }

  const latestBill = bills[0] || null;
  const paidBills = bills.filter((bill) => bill.status === "paid");
  const totalPaid = paidBills.reduce((sum, bill) => sum + Number(bill.totalCost || 0), 0);
  const openBills = bills.filter((bill) => getStatusTone(bill.status, bill.dueDate).label !== "paid");
  const overdueBills = bills.filter((bill) => getStatusTone(bill.status, bill.dueDate).label === "overdue");
  const costDifference = comparison?.difference?.cost || 0;
  const percentageChange = comparison?.difference?.costChangePercent ?? 0;
  const activeBreakdown = latestBill?.breakdown || [];

  return (
    <EnergyShell activeTab="billing">
      <PageNotice loading={loading} error={error} householdId={householdId} period={selectedPeriod} />

      <div style={responsiveGrid("260px", "18px")}>
        <MetricCard
          title="Current Bill"
          value={formatCurrency(latestBill?.totalCost)}
          subtitle={latestBill ? `${Number(latestBill.totalUnits || 0).toFixed(1)} kWh` : "No bill available"}
          icon="bill"
          tone="amber"
        />
        <MetricCard
          title="Month-over-Month"
          value={`${Math.abs(Number(percentageChange || 0)).toFixed(1)}%`}
          subtitle={`${costDifference >= 0 ? "+" : "-"}${formatCurrency(Math.abs(costDifference))}`}
          icon="trend-up"
          tone={costDifference >= 0 ? "red" : "green"}
          trend={{
            value: Number(percentageChange || 0),
            label: comparison?.previous ? `vs ${formatMonthYear(comparison.previous.month, comparison.previous.year)}` : "No previous bill",
          }}
        />
        <MetricCard
          title="Total Paid"
          value={formatCurrency(totalPaid)}
          subtitle={`${paidBills.length} paid bill${paidBills.length === 1 ? "" : "s"}`}
          icon="calendar"
          tone="green"
        />
        <MetricCard
          title="Open Bills"
          value={`${openBills.length}`}
          subtitle={overdueBills.length ? `${overdueBills.length} overdue` : "All caught up"}
          icon="thermo"
          tone={overdueBills.length ? "red" : "blue"}
        />
      </div>

      <div style={{ ...responsiveGrid("360px", "26px"), marginTop: "26px" }}>
        <ComparisonCard comparison={comparison} />
        <TariffBreakdownCard breakdown={activeBreakdown} total={latestBill?.totalCost} />
      </div>

      <div style={{ marginTop: "26px" }}>
        <BillingTableCard
          rows={bills}
          onCreate={() => setDialogOpen(true)}
          onGenerate={handleGenerateBill}
          generating={generating}
          onView={handleViewBill}
          onRegenerate={handleRegenerateExistingBill}
          busyId={busyBillId}
        />
      </div>

      <BillDialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        onSubmit={handleCreateBill}
        submitting={submitting}
        month={selectedPeriod.month}
        year={selectedPeriod.year}
      />
      <BillDetailsDialog
        open={detailsOpen}
        bill={selectedBill}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedBill(null);
        }}
        onSubmit={handleSaveBillDetails}
        submitting={submitting}
      />
    </EnergyShell>
  );
}

function ComparisonCard({ comparison }) {
  const current = comparison?.current || null;
  const previous = comparison?.previous || null;
  const difference = comparison?.difference || null;
  const isIncrease = Number(difference?.cost || 0) >= 0;

  return (
    <div style={{ ...cardStyle, padding: "24px" }}>
      <h3 style={{ margin: "0 0 22px 0", fontSize: "18px", color: colors.text }}>Month Comparison</h3>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
        <SummaryTile label={previous ? formatMonthYear(previous.month, previous.year) : "Previous"} units={previous?.totalUnits} cost={previous?.totalCost} />
        <SummaryTile label={current ? formatMonthYear(current.month, current.year) : "Current"} units={current?.totalUnits} cost={current?.totalCost} />
      </div>

      <div
        style={{
          marginTop: "18px",
          borderRadius: "16px",
          padding: "14px 16px",
          background: isIncrease ? colors.redSoft : colors.greenSoft,
          color: isIncrease ? colors.red : colors.green,
          fontWeight: "700",
          lineHeight: 1.5,
        }}
      >
        {difference
          ? `${Math.abs(Number(difference.costChangePercent || 0)).toFixed(1)}% ${isIncrease ? "increase" : "decrease"} (${difference.cost >= 0 ? "+" : "-"}${formatCurrency(Math.abs(difference.cost))} · ${difference.units >= 0 ? "+" : "-"}${Math.abs(difference.units).toFixed(1)} kWh)`
          : "Comparison will appear once at least one bill exists for the previous month."}
      </div>
    </div>
  );
}

function SummaryTile({ label, units, cost }) {
  return (
    <div style={{ background: "#f4f7fa", borderRadius: "18px", padding: "18px", textAlign: "center" }}>
      <div style={{ color: colors.muted, marginBottom: "8px" }}>{label}</div>
      <div style={{ color: colors.text, fontSize: "24px", fontWeight: "800" }}>
        {units != null ? Number(units).toFixed(1) : "—"} <span style={{ fontSize: "14px", fontWeight: "500", color: colors.muted }}>kWh</span>
      </div>
      <div style={{ marginTop: "8px", fontWeight: "700", color: colors.text }}>{cost != null ? formatCurrency(cost) : "—"}</div>
    </div>
  );
}

function TariffBreakdownCard({ breakdown, total }) {
  return (
    <div style={{ ...cardStyle, padding: "24px" }}>
      <h3 style={{ margin: "0 0 22px 0", fontSize: "18px", color: colors.text }}>Tariff Breakdown</h3>
      <div style={{ display: "grid", gap: "12px" }}>
        {breakdown.length ? (
          breakdown.map((item, index) => (
            <div
              key={`${item.range}-${index}`}
              style={{
                background: "#f4f7fa",
                borderRadius: "16px",
                padding: "14px 16px",
                display: "flex",
                justifyContent: "space-between",
                gap: "12px",
                alignItems: "center",
              }}
            >
              <div>
                <div style={{ fontWeight: "700", color: colors.text }}>{item.range}</div>
                <div style={{ color: colors.muted, fontSize: "14px" }}>
                  {Number(item.units || 0).toFixed(1)} units × Rs. {Number(item.rate || 0).toFixed(2)}
                </div>
              </div>
              <div style={{ fontWeight: "800", color: colors.text }}>{formatCurrency(item.cost)}</div>
            </div>
          ))
        ) : (
          <div style={{ color: colors.muted }}>Tariff details will appear after a bill is created.</div>
        )}

        <div
          style={{
            background: colors.greenSoft,
            color: colors.green,
            borderRadius: "16px",
            padding: "14px 16px",
            display: "flex",
            justifyContent: "space-between",
            gap: "12px",
            alignItems: "center",
            fontWeight: "800",
          }}
        >
          <span>Total</span>
          <span>{formatCurrency(total)}</span>
        </div>
      </div>
    </div>
  );
}

function PageNotice({ loading, error, householdId, period }) {
  if (loading) {
    return <Banner text="Loading billing dashboard..." tone="info" />;
  }

  if (error) {
    return <Banner text={error} tone="error" />;
  }

  if (!householdId) {
    return <Banner text="No household ID was found from usage data or local storage. Billing needs an existing household context." tone="info" />;
  }

  return (
    <div
      style={{
        ...cardStyle,
        padding: "16px 20px",
        marginBottom: "22px",
        display: "flex",
        justifyContent: "space-between",
        gap: "14px",
        flexWrap: "wrap",
      }}
    >
      <div style={{ color: colors.text, fontWeight: "700" }}>Billing Overview</div>
      <div style={{ color: colors.muted }}>Billing overview for {formatMonthYear(period.month, period.year)}</div>
    </div>
  );
}

function Banner({ text, tone }) {
  const palette = tone === "error" ? { background: colors.redSoft, color: colors.red } : { background: colors.blueSoft, color: colors.blue };
  return (
    <div style={{ ...cardStyle, background: palette.background, color: palette.color, padding: "16px 20px", marginBottom: "22px" }}>
      {text}
    </div>
  );
}

function responsiveGrid(minWidth, gap) {
  return {
    display: "grid",
    gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))`,
    gap,
  };
}

export default BillingPage;
