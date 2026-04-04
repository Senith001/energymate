import React, { useEffect, useMemo, useState } from "react";
import MetricCard from "../../components/energy/MetricCard";
import BillDetailsDialog from "../../components/billing/BillDetailsDialog";
import BillUpdateDialog from "../../components/billing/BillUpdateDialog";
import BillingTableCard from "../../components/billing/BillingTableCard";
import BillDialog from "../../components/billing/BillDialog";
import { cardStyle, colors, formatCurrency, formatMonthYear, getStatusTone } from "../../components/energy/dashboardTheme";
import { useAuth } from "../../context/AuthContext";
import { validateBillForm } from "../../utils/billingValidation";
import { createBill, generateBill, getBillById, getBillComparison, getBills, regenerateBill, updateBill } from "../../utils/billingAPI";
import { getUsages } from "../../utils/usageAPI";

function BillingPage() {
  const { user } = useAuth();
  // Keep the selected household id locally for billing-related API calls.
  const [householdId, setHouseholdId] = useState(localStorage.getItem("selectedHouseholdId") || localStorage.getItem("householdId") || "");
  const [bills, setBills] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [busyBillId, setBusyBillId] = useState("");
  const [error, setError] = useState("");
  const [createDialogError, setCreateDialogError] = useState("");
  const [updateDialogError, setUpdateDialogError] = useState("");
  const [tableMonthFilter, setTableMonthFilter] = useState("all");
  const [tableYearFilter, setTableYearFilter] = useState("all");

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
        // Billing still borrows the existing usage context until household selection is wired in centrally.
        const usagePayload = await getUsages();
        resolvedHouseholdId = usagePayload.data?.[0]?.householdId || "";
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
      // Refresh the history list and comparison card together so they stay in sync for the selected bill period.
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
    if (!householdId) {
      setCreateDialogError("A household must be selected before creating a bill.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setCreateDialogError("");

      const payload = {
        householdId,
        month: Number(form.month),
        year: Number(form.year),
      };

      const validationError = validateBillForm(form);
      if (validationError) {
        throw new Error(validationError);
      }

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
      setCreateDialogError(err.message || "Unable to create bill.");
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

  // Load one bill into the read-only details dialog.
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

  // Load one bill into the update dialog so editing stays separate from viewing.
  async function handleOpenUpdateBill(row) {
    try {
      setError("");
      setUpdateDialogError("");
      const payload = await getBillById(row._id);
      setSelectedBill(payload.data || row);
      setUpdateOpen(true);
    } catch (err) {
      setError(err.message || "Unable to load bill for update.");
    }
  }

  // Save bill updates using the editable fields supported by the bill controller.
  async function handleUpdateBill(form) {
    if (!selectedBill?._id) return;

    try {
      setSubmitting(true);
      setError("");
      setUpdateDialogError("");
      const payload = {
        month: Number(form.month),
        year: Number(form.year),
        status: form.status,
      };

      const validationError = validateBillForm(form, { requirePaidDateConsistency: true });
      if (validationError) {
        throw new Error(validationError);
      }

      if (form.mode === "readings") {
        payload.previousReading = Number(form.previousReading);
        payload.currentReading = Number(form.currentReading);
      } else if (form.totalUnits !== "") {
        payload.totalUnits = Number(form.totalUnits);
      }

      if (form.paidAt) {
        payload.paidAt = form.paidAt;
      } else if (form.status === "unpaid") {
        payload.paidAt = null;
      }

      await updateBill(selectedBill._id, payload);
      setUpdateOpen(false);
      setSelectedBill(null);
      await loadComparison(householdId, selectedPeriod.month, selectedPeriod.year);
    } catch (err) {
      setUpdateDialogError(err.message || "Unable to update bill.");
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
  const tableRows = useMemo(() => {
    const sortedRows = [...bills].sort((a, b) => {
      const aDate = new Date(a.year, a.month - 1, 1);
      const bDate = new Date(b.year, b.month - 1, 1);
      return bDate - aDate;
    });

    // Keep the history table independent from the summary cards so users can browse older billing periods without changing the dashboard period.
    return sortedRows.filter((bill) => {
      const monthMatches = tableMonthFilter === "all" || bill.month === Number(tableMonthFilter);
      const yearMatches = tableYearFilter === "all" || bill.year === Number(tableYearFilter);
      return monthMatches && yearMatches;
    });
  }, [bills, tableMonthFilter, tableYearFilter]);
  const paidBills = bills.filter((bill) => bill.status === "paid");
  const totalPaid = paidBills.reduce((sum, bill) => sum + Number(bill.totalCost || 0), 0);
  const openBills = bills.filter((bill) => getStatusTone(bill.status, bill.dueDate).label !== "paid");
  const overdueBills = bills.filter((bill) => getStatusTone(bill.status, bill.dueDate).label === "overdue");
  const costDifference = comparison?.difference?.cost || 0;
  const percentageChange = comparison?.difference?.costChangePercent ?? 0;
  const activeBreakdown = latestBill?.breakdown || [];
  const availableYears = useMemo(() => {
    const years = new Set(bills.map((bill) => bill.year));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [bills]);
  // Use an existing stored household name when available so we do not expose the raw object id in the UI.
  const householdName =
    localStorage.getItem("selectedHouseholdName") ||
    localStorage.getItem("householdName") ||
    (user?.name ? `${user.name}'s Household` : "Household");

  return (
    <div style={{ minHeight: "100%", background: colors.background, padding: "10px" }}>
      <PageNotice loading={loading} error={error} householdId={householdId} period={selectedPeriod} billsCount={bills.length} />

      {/* Use a slightly smaller minimum card width so all four summary cards fit in one row on common desktop widths. */}
      <div style={responsiveGrid("220px", "18px")}>
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
          rows={tableRows}
          onCreate={() => {
            setCreateDialogError("");
            setDialogOpen(true);
          }}
          onGenerate={handleGenerateBill}
          generating={generating}
          onView={handleViewBill}
          onUpdate={handleOpenUpdateBill}
          onRegenerate={handleRegenerateExistingBill}
          busyId={busyBillId}
          monthFilter={tableMonthFilter}
          yearFilter={tableYearFilter}
          onMonthFilterChange={setTableMonthFilter}
          onYearFilterChange={setTableYearFilter}
          monthOptions={TABLE_MONTH_FILTERS}
          yearOptions={TABLE_YEAR_FILTERS(availableYears)}
        />
      </div>

      <BillDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setCreateDialogError("");
        }}
        onSubmit={handleCreateBill}
        submitting={submitting}
        submitError={createDialogError}
        month={selectedPeriod.month}
        year={selectedPeriod.year}
      />
      <BillDetailsDialog
        open={detailsOpen}
        bill={selectedBill}
        householdName={householdName}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedBill(null);
        }}
      />
      <BillUpdateDialog
        open={updateOpen}
        bill={selectedBill}
        onClose={() => {
          setUpdateOpen(false);
          setSelectedBill(null);
          setUpdateDialogError("");
        }}
        onSubmit={handleUpdateBill}
        submitting={submitting}
        submitError={updateDialogError}
      />
    </div>
  );
}

function ComparisonCard({ comparison }) {
  const current = comparison?.current || null;
  const previous = comparison?.previous || null;
  const difference = comparison?.difference || null;
  // Treat missing difference data as an increase-neutral state so the empty message keeps a stable style.
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
        {units != null ? Number(units).toFixed(1) : "-"} <span style={{ fontSize: "14px", fontWeight: "500", color: colors.muted }}>kWh</span>
      </div>
      <div style={{ marginTop: "8px", fontWeight: "700", color: colors.text }}>{cost != null ? formatCurrency(cost) : "-"}</div>
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

function PageNotice({ loading, error, householdId, period, billsCount }) {
  if (loading) {
    return <Banner text="Loading billing dashboard..." tone="info" />;
  }

  if (error) {
    return <Banner text={error} tone="error" />;
  }

  if (!householdId) {
    return <Banner text="No household ID was found from usage data or local storage. Billing needs an existing household context." tone="info" />;
  }

  if (!billsCount) {
    return <Banner text="No bills have been created for this household yet. Create or generate a bill to see billing insights." tone="info" />;
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

const TABLE_MONTH_FILTERS = [
  { value: "all", label: "None (Show All)" },
  { value: "1", label: "January" },
  { value: "2", label: "February" },
  { value: "3", label: "March" },
  { value: "4", label: "April" },
  { value: "5", label: "May" },
  { value: "6", label: "June" },
  { value: "7", label: "July" },
  { value: "8", label: "August" },
  { value: "9", label: "September" },
  { value: "10", label: "October" },
  { value: "11", label: "November" },
  { value: "12", label: "December" },
];

const TABLE_YEAR_FILTERS = (years) => [
  { value: "all", label: "All Years" },
  ...years.map((year) => ({ value: String(year), label: String(year) })),
];

export default BillingPage;
