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
import { getHouseholdDetails, getUsages } from "../../utils/usageAPI";

function BillingPage() {
  const { user } = useAuth();
  // Keep the selected household id locally for billing-related API calls.
  const [householdId, setHouseholdId] = useState(localStorage.getItem("selectedHouseholdId") || localStorage.getItem("householdId") || "");
  const [bills, setBills] = useState([]);
  const [comparison, setComparison] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [updateOpen, setUpdateOpen] = useState(false);
  const [selectedBill, setSelectedBill] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [busyBillId, setBusyBillId] = useState("");
  const [payingBillId, setPayingBillId] = useState("");
  const [error, setError] = useState("");
  const [createDialogError, setCreateDialogError] = useState("");
  const [updateDialogError, setUpdateDialogError] = useState("");
  const [tableMonthFilter, setTableMonthFilter] = useState("all");
  const [tableYearFilter, setTableYearFilter] = useState("all");
  const [householdName, setHouseholdName] = useState(
    localStorage.getItem("selectedHouseholdName") ||
      localStorage.getItem("householdName") ||
      (user?.name ? `${user.name}'s Household` : "Household")
  );

  useEffect(() => {
    loadBillingPage();
  }, []);

  useEffect(() => {
    if (householdId) {
      loadComparison(householdId, selectedPeriod.month, selectedPeriod.year);
    }
  }, [householdId, selectedPeriod.month, selectedPeriod.year]);

  // Resolve the active household, fetch its bill history, and seed the visible billing period.
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

      await loadHouseholdName(resolvedHouseholdId);

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

  // Borrow the temporary household lookup from usage until the shared household API is exposed centrally.
  async function loadHouseholdName(activeHouseholdId) {
    try {
      const householdPayload = await getHouseholdDetails(activeHouseholdId);
      const resolvedName =
        householdPayload?.data?.name ||
        householdPayload?.name ||
        localStorage.getItem("selectedHouseholdName") ||
        localStorage.getItem("householdName") ||
        (user?.name ? `${user.name}'s Household` : "Household");

      setHouseholdName(resolvedName);
      localStorage.setItem("selectedHouseholdName", resolvedName);
      localStorage.setItem("householdName", resolvedName);
    } catch (householdError) {
      setHouseholdName((current) => current || (user?.name ? `${user.name}'s Household` : "Household"));
    }
  }

  // Reload both the history list and comparison summary for one billing period snapshot.
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

  // Create one manual bill from entered units or meter readings.
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

  // Save a bill after the calculator preview step, using either manual data or current usage entries.
  async function handleSaveCalculatedBill(form) {
    if (!householdId) {
      setCreateDialogError("A household must be selected before calculating a bill.");
      return;
    }

    try {
      setSubmitting(true);
      setError("");
      setCreateDialogError("");

      const month = Number(form.month);
      const year = Number(form.year);

      if (form.source === "usage") {
        await generateBill(householdId, month, year);
      } else {
        const payload = {
          householdId,
          month,
          year,
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
      }

      setCalculatorOpen(false);
      setSelectedPeriod({ month, year });
      await loadComparison(householdId, month, year);
    } catch (err) {
      setCreateDialogError(err.message || "Unable to save bill.");
      setError(err.message || "Unable to save bill.");
    } finally {
      setSubmitting(false);
    }
  }

  // Generate the selected period's bill directly from saved usage entries.
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
      if (getStatusTone(row.status, row.dueDate).label === "paid") {
        setError("Paid bills cannot be edited.");
        return;
      }

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
      };

      const validationError = validateBillForm(form);
      if (validationError) {
        throw new Error(validationError);
      }

      if (form.mode === "readings") {
        payload.previousReading = Number(form.previousReading);
        payload.currentReading = Number(form.currentReading);
      } else if (form.totalUnits !== "") {
        payload.totalUnits = Number(form.totalUnits);
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
      if (getStatusTone(row.status, row.dueDate).label === "paid") {
        setError("Paid bills cannot be regenerated.");
        return;
      }

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

  // Payment state is handled separately from bill edits so paid bills stay locked afterward.
  async function handleMarkBillPaid(row) {
    try {
      setPayingBillId(row._id);
      setError("");
      await updateBill(row._id, {
        status: "paid",
        paidAt: new Date().toISOString(),
      });
      await loadComparison(householdId, selectedPeriod.month, selectedPeriod.year);
    } catch (err) {
      setError(err.message || "Unable to mark bill as paid.");
    } finally {
      setPayingBillId("");
    }
  }

  // Reopen a paid bill when the payment state needs to be corrected.
  async function handleMarkBillUnpaid(row) {
    try {
      setPayingBillId(row._id);
      setError("");
      await updateBill(row._id, {
        status: "unpaid",
        paidAt: null,
      });
      await loadComparison(householdId, selectedPeriod.month, selectedPeriod.year);
    } catch (err) {
      setError(err.message || "Unable to mark bill as unpaid.");
    } finally {
      setPayingBillId("");
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
  return (
    <div style={{ minHeight: "100%", background: colors.background, padding: "10px" }}>
      <div style={{ marginBottom: "18px" }}>
        <h1 style={{ margin: 0, fontSize: "30px", color: colors.text }}>Billing and Cost Analysis</h1>
      </div>
      <PageNotice loading={loading} error={error} householdId={householdId} period={selectedPeriod} billsCount={bills.length} />

      {householdId ? (
        <div
          style={{
            ...cardStyle,
            padding: "18px 22px",
            marginBottom: "18px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
          }}
        >
          <div>
            <div style={{ color: colors.text, fontSize: "20px", fontWeight: "800", marginBottom: "6px" }}>{householdName}</div>
            <div style={{ color: colors.muted }}>Track recent bills, charges, and monthly cost changes in one place.</div>
          </div>
          <button
            type="button"
            onClick={() => {
              setCreateDialogError("");
              setCalculatorOpen(true);
            }}
            style={{
              border: "none",
              background: colors.green,
              color: "#ffffff",
              padding: "12px 18px",
              borderRadius: "14px",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              cursor: "pointer",
              fontWeight: "700",
            }}
          >
            + Calculate Bill
          </button>
        </div>
      ) : null}

      {/* Use a slightly smaller minimum card width so all four summary cards fit in one row on common desktop widths. */}
      <div style={responsiveGrid("220px", "18px")}>
        <MetricCard
          title={`Current Bill${latestBill ? ` - ${formatMonthYear(latestBill.month, latestBill.year)}` : ""}`}
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
          onMarkPaid={handleMarkBillPaid}
          onMarkUnpaid={handleMarkBillUnpaid}
          onRegenerate={handleRegenerateExistingBill}
          busyId={busyBillId}
          payingId={payingBillId}
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
      <BillDialog
        open={calculatorOpen}
        onClose={() => {
          setCalculatorOpen(false);
          setCreateDialogError("");
        }}
        onSubmit={handleSaveCalculatedBill}
        submitting={submitting}
        submitError={createDialogError}
        month={selectedPeriod.month}
        year={selectedPeriod.year}
        householdId={householdId}
        calculatorMode
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

// Show current vs previous month changes without requiring a separate comparison page.
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
          ? `${Math.abs(Number(difference.costChangePercent || 0)).toFixed(1)}% ${isIncrease ? "increase" : "decrease"} (${difference.cost >= 0 ? "+" : "-"}${formatCurrency(Math.abs(difference.cost))} | ${difference.units >= 0 ? "+" : "-"}${Math.abs(difference.units).toFixed(1)} kWh)`
          : "Comparison will appear once at least one bill exists for the previous month."}
      </div>
    </div>
  );
}

// Reusable compact tile for the comparison card.
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

// Show the tariff slabs that make up the latest visible bill.
function TariffBreakdownCard({ breakdown, total }) {
  return (
    <div style={{ ...cardStyle, padding: "24px" }}>
      <h3 style={{ margin: "0 0 22px 0", fontSize: "18px", color: colors.text }}>Energy Charge Breakdown</h3>
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
                  {Number(item.units || 0).toFixed(1)} units x Rs. {Number(item.rate || 0).toFixed(2)}
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
            background: colors.blueSoft,
            color: colors.blue,
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

// Keep page-level empty and loading states separate from the billing header card.
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

  return null;
}

// Shared banner for loading, info, and error notices on the billing page.
function Banner({ text, tone }) {
  const palette = tone === "error" ? { background: colors.redSoft, color: colors.red } : { background: colors.blueSoft, color: colors.blue };
  return (
    <div style={{ ...cardStyle, background: palette.background, color: palette.color, padding: "16px 20px", marginBottom: "22px" }}>
      {text}
    </div>
  );
}

// Reuse the same responsive card grid sizing across the billing dashboard.
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

