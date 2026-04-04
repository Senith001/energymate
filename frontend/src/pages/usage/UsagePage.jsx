import React, { useEffect, useMemo, useState } from "react";
import MetricCard from "../../components/energy/MetricCard";
import UsageBars from "../../components/usage/UsageBars";
import BreakdownDonut from "../../components/usage/BreakdownDonut";
import UsageDetailsDialog from "../../components/usage/UsageDetailsDialog";
import ProgressBreakdown from "../../components/usage/ProgressBreakdown";
import WeatherInsightCard from "../../components/usage/WeatherInsightCard";
import UsageEntryDialog from "../../components/usage/UsageEntryDialog";
import UsageTableCard from "../../components/usage/UsageTableCard";
import { cardStyle, colors, formatCurrency, formatMonthYear } from "../../components/energy/dashboardTheme";
import { validateUsageForm } from "../../utils/usageValidation";
import {
  createUsage,
  deleteUsage,
  getEstimatedCost,
  getHouseholdDetails,
  getMonthlySummary,
  getUsageByAppliances,
  getUsageById,
  getUsageByRooms,
  getUsages,
  getWeatherImpact,
  updateUsage,
} from "../../utils/usageAPI";

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
  const [dialogError, setDialogError] = useState("");
  const [tableMonthFilter, setTableMonthFilter] = useState("all");
  const [tableYearFilter, setTableYearFilter] = useState("all");
  const [weatherLocationMode, setWeatherLocationMode] = useState(localStorage.getItem("weatherLocationMode") || "browser");
  const [customWeatherCity, setCustomWeatherCity] = useState(localStorage.getItem("customWeatherCity") || "");

  useEffect(() => {
    loadUsagePage();
  }, []);

  useEffect(() => {
    if (householdId) {
      loadPeriodData(householdId, selectedPeriod.month, selectedPeriod.year);
    }
  }, [householdId, selectedPeriod.month, selectedPeriod.year, weatherLocationMode]);

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

      await loadPeriodData(resolvedHouseholdId, selectedPeriod.month, selectedPeriod.year);
    } catch (err) {
      setError(err.message || "Unable to load usage dashboard.");
      setLoading(false);
    }
  }

  async function loadPeriodData(activeHouseholdId, month, year) {
    try {
      setLoading(true);

      // Load the main dashboard slices together so the page updates as one period snapshot.
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
        const weatherLocation = await resolveWeatherLocation(activeHouseholdId);
        const weatherPayload = await getWeatherImpact(activeHouseholdId, month, year, weatherLocation);
        // Keep only the weather fields used by this page.
        setWeatherInfo({
          weather: weatherPayload.data?.weather || null,
          insight: weatherPayload.data?.insight || "Weather insight is unavailable right now.",
        });
      } catch (weatherError) {
        setWeatherInfo(null);
      }

      setLoading(false);
    } catch (err) {
      setError(err.message || "Unable to load usage details.");
      setLoading(false);
    }
  }

  // Try browser location first and fall back to the household city stored in the database.
  async function resolveWeatherLocation(activeHouseholdId) {
    if (weatherLocationMode === "custom" && customWeatherCity.trim()) {
      return { city: customWeatherCity.trim() };
    }

    if (weatherLocationMode === "browser") {
      const browserLocation = await getBrowserCoordinates();
      if (browserLocation) {
        return browserLocation;
      }
    }

    try {
      const household = await getHouseholdDetails(activeHouseholdId);

      if (household?.name) {
        localStorage.setItem("selectedHouseholdName", household.name);
        localStorage.setItem("householdName", household.name);
      }

      if (household?.city) {
        return { city: household.city };
      }
    } catch (householdError) {
      // Keep the final fallback simple if the household lookup is not available yet.
    }

    return { city: "Colombo" };
  }

  // Save the selected weather location mode for later visits.
  function handleWeatherLocationModeChange(mode) {
    setWeatherLocationMode(mode);
    localStorage.setItem("weatherLocationMode", mode);
  }

  // Apply the custom city and refresh the weather card immediately.
  async function handleApplyCustomCity() {
    const nextCity = customWeatherCity.trim();
    if (!nextCity) return;

    localStorage.setItem("customWeatherCity", nextCity);
    setWeatherLocationMode("custom");
    localStorage.setItem("weatherLocationMode", "custom");

    if (householdId) {
      await loadPeriodData(householdId, selectedPeriod.month, selectedPeriod.year);
    }
  }

  // Save either a new usage entry or an update to an existing entry.
  async function handleSaveUsage(form) {
    if (!householdId) {
      setDialogError("A household must be selected before saving usage.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setDialogError("");

      const payload = {
        householdId,
        date: form.date,
        entryType: form.entryType,
      };

      const validationError = validateUsageForm(form);
      if (validationError) {
        throw new Error(validationError);
      }

      if (form.entryType === "meter") {
        const previousReading = Number(form.previousReading);
        const currentReading = Number(form.currentReading);

        payload.previousReading = previousReading;
        payload.currentReading = currentReading;
      } else {
        const unitsUsed = Number(form.unitsUsed);
        payload.unitsUsed = unitsUsed;
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
      setDialogError(err.message || "Unable to save usage entry.");
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
      setDialogError("");
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

  const chartData = useMemo(() => {
    // Show a rolling 7-day view so the chart feels more current than a full month snapshot.
    const latestUsageDate = usages.length ? new Date(Math.max(...usages.map((item) => new Date(item.date).getTime()))) : new Date();
    const normalizedEndDate = new Date(latestUsageDate.getFullYear(), latestUsageDate.getMonth(), latestUsageDate.getDate());
    const dailyUnits = new Map();

    usages.forEach((item) => {
      const date = new Date(item.date);
      const key = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().slice(0, 10);
      dailyUnits.set(key, (dailyUnits.get(key) || 0) + Number(item.unitsUsed || 0));
    });

    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(normalizedEndDate);
      date.setDate(normalizedEndDate.getDate() - (6 - index));
      const key = date.toISOString().slice(0, 10);

      return {
        label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        units: dailyUnits.get(key) || 0,
      };
    });
  }, [usages]);

  // Keep the records table broader than the summary cards so users can review older entries without changing the dashboard period.
  const tableRows = useMemo(() => {
    const sortedRows = [...usages].sort((a, b) => new Date(b.date) - new Date(a.date));
    return sortedRows.filter((item) => {
      const date = new Date(item.date);
      const monthMatches = tableMonthFilter === "all" || date.getMonth() + 1 === Number(tableMonthFilter);
      const yearMatches = tableYearFilter === "all" || date.getFullYear() === Number(tableYearFilter);
      return monthMatches && yearMatches;
    });
  }, [tableMonthFilter, tableYearFilter, usages]);

  const applianceItems = useMemo(() => makePercentageItems(applianceBreakdown), [applianceBreakdown]);
  const roomItems = useMemo(() => makePercentageItems(roomBreakdown), [roomBreakdown]);
  const availableYears = useMemo(() => {
    const years = new Set(usages.map((item) => new Date(item.date).getFullYear()));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [usages]);
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
  // Prefer a saved household label so the header never falls back to the raw object id.
  const householdLabel = localStorage.getItem("selectedHouseholdName") || localStorage.getItem("householdName") || "Household";
  const degreeSymbol = String.fromCharCode(176);

  return (
    <div style={{ minHeight: "100%", background: colors.background, padding: "10px" }}>
      <PageNotice loading={loading} error={error} householdId={householdId} />

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
          <div style={{ color: colors.text, fontSize: "20px", fontWeight: "800", marginBottom: "6px" }}>{householdLabel}</div>
          <div style={{ color: colors.muted }}>Track recent usage, costs, and weather impact in one place.</div>
        </div>
        {/* Keep a quick action at the top so users can add usage entries without scrolling. */}
        <button
          type="button"
          onClick={() => {
            setEditingUsage(null);
            setDialogError("");
            setDialogOpen(true);
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
          + Add Entry
        </button>
      </div>

      {/* Use a slightly smaller minimum card width so all four summary cards fit in one row on common desktop widths. */}
      <div style={responsiveGrid("220px", "18px")}>
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
          value={weather?.temperature != null ? `${weather.temperature}${degreeSymbol}C` : "-"}
          subtitle={weather?.city || "Colombo"}
          icon="thermo"
          tone="red"
        />
      </div>

      <div
        style={{
          // This row uses a fixed two-panel layout because the wide chart and narrow weather card overlap in auto-fit grids.
          display: "flex",
          gap: "26px",
          flexWrap: "wrap",
          alignItems: "stretch",
          marginTop: "26px",
        }}
      >
        <div style={{ flex: "2 1 680px", minWidth: "320px", display: "flex" }}>
          <UsageBars title="Daily Usage - Last 7 Days" data={chartData} />
        </div>
        <div style={{ flex: "1 1 320px", minWidth: "320px", display: "flex" }}>
          <WeatherInsightCard
            city={weather?.city || "Colombo"}
            weather={weather}
            tip={weatherTip}
            locationMode={weatherLocationMode}
            customCity={customWeatherCity}
            onLocationModeChange={handleWeatherLocationModeChange}
            onCustomCityChange={(value) => {
              setCustomWeatherCity(value);
              localStorage.setItem("customWeatherCity", value);
            }}
            onApplyCustomCity={handleApplyCustomCity}
          />
        </div>
      </div>

      <div style={{ ...responsiveGrid("360px", "26px"), marginTop: "26px" }}>
        <BreakdownDonut title="Usage by Appliance" items={applianceItems} labelKey="name" />
        <ProgressBreakdown title="Usage by Room" items={roomItems} labelKey="roomName" />
      </div>

      <div style={{ marginTop: "26px" }}>
        <UsageTableCard
          rows={tableRows}
          onAdd={() => {
            setEditingUsage(null);
            setDialogError("");
            setDialogOpen(true);
          }}
          onView={handleViewUsage}
          onEdit={handleEditUsage}
          onDelete={handleDeleteUsage}
          busyId={busyUsageId}
          monthFilter={tableMonthFilter}
          yearFilter={tableYearFilter}
          onMonthFilterChange={setTableMonthFilter}
          onYearFilterChange={setTableYearFilter}
          monthOptions={TABLE_MONTH_FILTERS}
          yearOptions={TABLE_YEAR_FILTERS(availableYears)}
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
          setDialogError("");
        }}
        onSubmit={handleSaveUsage}
        submitting={saving}
        submitError={dialogError}
        initialValues={editingUsage}
        title={editingUsage ? "Edit Usage Entry" : "Add Usage Entry"}
        submitLabel={editingUsage ? "Save Changes" : "Save Entry"}
      />
    </div>
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

  return null;
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

const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const TABLE_MONTH_FILTERS = [
  { value: "all", label: "None (Show All)" },
  ...MONTH_OPTIONS.map((month) => ({ value: String(month.value), label: month.label })),
];

const TABLE_YEAR_FILTERS = (years) => [
  { value: "all", label: "All Years" },
  ...years.map((year) => ({ value: String(year), label: String(year) })),
];

const selectStyle = {
  minWidth: "150px",
  padding: "10px 12px",
  borderRadius: "12px",
  border: "1px solid #d7dee7",
  background: "#ffffff",
  color: colors.text,
  fontSize: "14px",
  outline: "none",
};

export default UsagePage;

function getBrowserCoordinates() {
  if (typeof window === "undefined" || !navigator.geolocation) {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      () => resolve(null),
      {
        enableHighAccuracy: true,
        timeout: 8000,
        maximumAge: 300000,
      }
    );
  });
}
