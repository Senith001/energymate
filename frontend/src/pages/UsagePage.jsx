import React, { useEffect, useMemo, useState } from "react";
import EnergyShell from "../components/energy/EnergyShell";
import MetricCard from "../components/energy/MetricCard";
import UsageBars from "../components/usage/UsageBars";
import BreakdownDonut from "../components/usage/BreakdownDonut";
import UsageDetailsDialog from "../components/usage/UsageDetailsDialog";
import ProgressBreakdown from "../components/usage/ProgressBreakdown";
import WeatherInsightCard from "../components/usage/WeatherInsightCard";
import UsageEntryDialog from "../components/usage/UsageEntryDialog";
import UsageTableCard from "../components/usage/UsageTableCard";
import { cardStyle, colors, formatCurrency, formatMonthYear } from "../components/energy/dashboardTheme";
import {
  createUsage,
  deleteUsage,
  getEstimatedCost,
  getMonthlySummary,
  getUsageByAppliances,
  getUsageById,
  getUsageByRooms,
  getUsages,
  getWeatherImpact,
  updateUsage,
} from "../utils/usageAPI";

function UsagePage() {
  // Keep the selected household id locally for usage-related API calls.
  const [householdId, setHouseholdId] = useState(localStorage.getItem("selectedHouseholdId") || localStorage.getItem("householdId") || "");
  const [usages, setUsages] = useState([]);
  const [summary, setSummary] = useState(null);
  const [costInfo, setCostInfo] = useState(null);
  const [applianceBreakdown, setApplianceBreakdown] = useState([]);
  const [roomBreakdown, setRoomBreakdown] = useState([]);
  const [weatherInfo, setWeatherInfo] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [editingUsage, setEditingUsage] = useState(null);
  const [selectedUsage, setSelectedUsage] = useState(null);
  const [busyUsageId, setBusyUsageId] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    loadUsagePage();
  }, []);

  useEffect(() => {
    if (householdId) {
      loadPeriodData(householdId, selectedPeriod.month, selectedPeriod.year);
    }
  }, [householdId, selectedPeriod.month, selectedPeriod.year]);

  async function loadUsagePage() {
    try {
      setLoading(true);
      setError("");

      const usagePayload = await getUsages();
      const usageRows = usagePayload.data || [];
      setUsages(usageRows);

      const resolvedHouseholdId =
        householdId ||
        localStorage.getItem("selectedHouseholdId") ||
        localStorage.getItem("householdId") ||
        usageRows[0]?.householdId ||
        "";
      setHouseholdId(resolvedHouseholdId);

      if (!resolvedHouseholdId) {
        setLoading(false);
        return;
      }

      if (usageRows.length) {
        const latestUsage = [...usageRows]
          .filter((row) => row.householdId === resolvedHouseholdId)
          .sort((a, b) => new Date(b.date) - new Date(a.date))[0];

        if (latestUsage) {
          const latestDate = new Date(latestUsage.date);
          setSelectedPeriod({ month: latestDate.getMonth() + 1, year: latestDate.getFullYear() });
          return;
        }
      }

      await loadPeriodData(resolvedHouseholdId, selectedPeriod.month, selectedPeriod.year);
    } catch (err) {
      setError(err.message || "Unable to load usage dashboard.");
      setLoading(false);
    }
  }

  async function loadPeriodData(activeHouseholdId, month, year) {
    try {
      setLoading(true);

      const [summaryPayload, costPayload, appliancesPayload, roomsPayload, usagePayload] = await Promise.all([
        getMonthlySummary(activeHouseholdId, month, year),
        getEstimatedCost(activeHouseholdId, month, year),
        getUsageByAppliances(activeHouseholdId, month, year),
        getUsageByRooms(activeHouseholdId, month, year),
        getUsages(activeHouseholdId),
      ]);

      setSummary(summaryPayload.data);
      setCostInfo(costPayload.data);
      setApplianceBreakdown(
        (appliancesPayload.data?.breakdown || []).map((item) => ({
          name: item.name,
          value: item.allocatedUsage || 0,
        }))
      );
      setRoomBreakdown(
        (roomsPayload.data?.breakdown || []).map((item) => ({
          roomName: item.roomName,
          value: item.allocatedUsage || 0,
        }))
      );
      setUsages(usagePayload.data || []);

      try {
        const weatherPayload = await getWeatherImpact(activeHouseholdId, month, year, "Colombo");
        setWeatherInfo(weatherPayload.data || null);
      } catch (weatherError) {
        setWeatherInfo(null);
      }

      setLoading(false);
    } catch (err) {
      setError(err.message || "Unable to load usage details.");
      setLoading(false);
    }
  }

  // Save either a new usage entry or an update to an existing entry.
  async function handleSaveUsage(form) {
    if (!householdId) return;

    try {
      setSaving(true);
      setError("");

      const payload = {
        householdId,
        date: form.date,
        entryType: form.entryType,
      };

      if (form.entryType === "meter") {
        payload.previousReading = Number(form.previousReading);
        payload.currentReading = Number(form.currentReading);
      } else {
        payload.unitsUsed = Number(form.unitsUsed);
      }

      const result = editingUsage?._id
        ? await updateUsage(editingUsage._id, payload)
        : await createUsage(payload);

      if (!result.success) {
        throw new Error(result.message || "Unable to save usage");
      }

      setDialogOpen(false);
      setEditingUsage(null);
      await loadPeriodData(householdId, selectedPeriod.month, selectedPeriod.year);
    } catch (err) {
      setError(err.message || "Unable to save usage entry.");
    } finally {
      setSaving(false);
    }
  }

  // Open the selected record in a read-only dialog.
  async function handleViewUsage(row) {
    try {
      setError("");
      const payload = await getUsageById(row._id);
      setSelectedUsage(payload.data || row);
      setDetailsOpen(true);
    } catch (err) {
      setError(err.message || "Unable to load usage entry.");
    }
  }

  // Open the selected record in the form dialog for editing.
  async function handleEditUsage(row) {
    try {
      setError("");
      const payload = await getUsageById(row._id);
      setEditingUsage(payload.data || row);
      setDialogOpen(true);
    } catch (err) {
      setError(err.message || "Unable to load usage entry.");
    }
  }

  // Delete one usage record after a simple confirmation.
  async function handleDeleteUsage(row) {
    const confirmed = window.confirm("Delete this usage entry?");
    if (!confirmed) return;

    try {
      setBusyUsageId(row._id);
      setError("");
      const payload = await deleteUsage(row._id);
      if (!payload.success) {
        throw new Error(payload.message || "Unable to delete usage");
      }
      await loadPeriodData(householdId, selectedPeriod.month, selectedPeriod.year);
    } catch (err) {
      setError(err.message || "Unable to delete usage entry.");
    } finally {
      setBusyUsageId("");
    }
  }

  const monthUsages = useMemo(() => {
    return usages
      .filter((item) => {
        const date = new Date(item.date);
        return date.getMonth() + 1 === selectedPeriod.month && date.getFullYear() === selectedPeriod.year;
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [selectedPeriod.month, selectedPeriod.year, usages]);

  const chartData = monthUsages.map((item) => ({
    label: new Date(item.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    units: Number(item.unitsUsed || 0),
  }));

  const applianceItems = useMemo(() => makePercentageItems(applianceBreakdown), [applianceBreakdown]);
  const roomItems = useMemo(() => makePercentageItems(roomBreakdown), [roomBreakdown]);

  const totalUnits = summary?.totalUnits || 0;
  const previousMonthUsage = usages
    .filter((item) => {
      const date = new Date(item.date);
      const previous = new Date(selectedPeriod.year, selectedPeriod.month - 2, 1);
      return date.getMonth() === previous.getMonth() && date.getFullYear() === previous.getFullYear();
    })
    .reduce((sum, item) => sum + Number(item.unitsUsed || 0), 0);
  const usageChange = previousMonthUsage > 0 ? ((totalUnits - previousMonthUsage) / previousMonthUsage) * 100 : 0;
  const dailyAverage = summary?.entries ? totalUnits / summary.entries : 0;
  const weather = weatherInfo?.weather || null;
  const weatherTip = weatherInfo?.insight || "Weather insight is unavailable right now.";

  return (
    <EnergyShell activeTab="usage">
      <PageNotice loading={loading} error={error} householdId={householdId} />

      <div style={responsiveGrid("260px", "18px")}>
        <MetricCard
          title="This Month"
          value={`${Number(totalUnits).toFixed(1)} kWh`}
          subtitle={formatMonthYear(selectedPeriod.month, selectedPeriod.year)}
          icon="zap"
          tone="green"
          trend={{ value: usageChange, label: "vs last month" }}
        />
        <MetricCard
          title="Estimated Cost"
          value={formatCurrency(costInfo?.totalCost)}
          subtitle={`${summary?.entries || 0} recorded entries`}
          icon="trend-up"
          tone="amber"
        />
        <MetricCard
          title="Daily Average"
          value={`${dailyAverage.toFixed(1)} kWh`}
          subtitle={`${summary?.entries || 0} days recorded`}
          icon="calendar"
          tone="blue"
        />
        <MetricCard
          title="Weather"
          value={weather?.temperature != null ? `${weather.temperature}°C` : "—"}
          subtitle={weather?.city || "Colombo"}
          icon="thermo"
          tone="red"
        />
      </div>

      <div style={{ ...responsiveGrid("320px", "26px"), marginTop: "26px" }}>
        <div style={{ gridColumn: "span 2" }}>
          <UsageBars title={`Daily Usage - ${formatMonthYear(selectedPeriod.month, selectedPeriod.year)}`} data={chartData} />
        </div>
        <WeatherInsightCard city={weather?.city || "Colombo"} weather={weather} tip={weatherTip} />
      </div>

      <div style={{ ...responsiveGrid("360px", "26px"), marginTop: "26px" }}>
        <BreakdownDonut title="Usage by Appliance" items={applianceItems} labelKey="name" />
        <ProgressBreakdown title="Usage by Room" items={roomItems} labelKey="roomName" />
      </div>

      <div style={{ marginTop: "26px" }}>
        <UsageTableCard
          rows={monthUsages}
          onAdd={() => {
            setEditingUsage(null);
            setDialogOpen(true);
          }}
          onView={handleViewUsage}
          onEdit={handleEditUsage}
          onDelete={handleDeleteUsage}
          busyId={busyUsageId}
        />
      </div>

      <UsageDetailsDialog
        open={detailsOpen}
        usage={selectedUsage}
        onClose={() => {
          setDetailsOpen(false);
          setSelectedUsage(null);
        }}
      />
      <UsageEntryDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingUsage(null);
        }}
        onSubmit={handleSaveUsage}
        submitting={saving}
        initialValues={editingUsage}
        title={editingUsage ? "Edit Usage Entry" : "Add Usage Entry"}
        submitLabel={editingUsage ? "Save Changes" : "Save Entry"}
      />
    </EnergyShell>
  );
}

function PageNotice({ loading, error, householdId }) {
  if (loading) {
    return <Banner text="Loading usage dashboard..." tone="info" />;
  }

  if (error) {
    return <Banner text={error} tone="error" />;
  }

  if (!householdId) {
    return <Banner text="No usage-linked household was found. Add a usage record after setting a household ID in storage." tone="info" />;
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
      <div style={{ color: colors.text, fontWeight: "700" }}>Usage Overview</div>
      <div style={{ color: colors.muted }}>Live usage overview</div>
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

function makePercentageItems(items) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return items.map((item) => ({
    ...item,
    percentage: total ? (item.value / total) * 100 : 0,
  }));
}

function responsiveGrid(minWidth, gap) {
  return {
    display: "grid",
    gridTemplateColumns: `repeat(auto-fit, minmax(${minWidth}, 1fr))`,
    gap,
  };
}

export default UsagePage;
