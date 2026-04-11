import React, { useEffect, useMemo, useState } from "react";
import MetricCard from "../../components/energy/MetricCard";
import UsageBars from "../../components/usage/UsageBars";
import BreakdownDonut from "../../components/usage/BreakdownDonut";
import ApplianceHoursDialog from "../../components/usage/ApplianceHoursDialog";
import UsageDetailsDialog from "../../components/usage/UsageDetailsDialog";
import ProgressBreakdown from "../../components/usage/ProgressBreakdown";
import WeatherInsightCard from "../../components/usage/WeatherInsightCard";
import UsageEntryDialog from "../../components/usage/UsageEntryDialog";
import UsageTableCard from "../../components/usage/UsageTableCard";
import { cardStyle, colors, formatCurrency, formatMonthYear } from "../../components/energy/dashboardTheme";
import { validateUsageForm } from "../../utils/usageValidation";
import {
  createUsage,
  createApplianceHoursLog,
  deleteApplianceHoursLog,
  deleteUsage,
  getApplianceHoursLogs,
  getHouseholdAppliances,
  getHouseholds,
  getEstimatedCost,
  getHouseholdDetails,
  getMonthlySummary,
  getUsageByAppliances,
  getUsageById,
  getUsageByRooms,
  getUsages,
  getWeatherImpact,
  updateApplianceHoursLog,
  updateUsage,
} from "../../utils/usageAPI";

function UsagePage() {
  // Keep the selected household id locally for usage-related API calls.
  const [householdId, setHouseholdId] = useState(localStorage.getItem("selectedHouseholdId") || localStorage.getItem("householdId") || "");
  const [householdOptions, setHouseholdOptions] = useState([]);
  const [pendingHouseholdId, setPendingHouseholdId] = useState("");
  const [usages, setUsages] = useState([]);

  // Summary cards use this monthly snapshot from the backend.
  const [summary, setSummary] = useState(null);

  // Estimated cost is loaded separately so the cost card stays independent from raw usage totals.
  const [costInfo, setCostInfo] = useState(null);

  // These two arrays feed the appliance and room breakdown cards.
  const [applianceBreakdown, setApplianceBreakdown] = useState([]);
  const [roomBreakdown, setRoomBreakdown] = useState([]);

  // Weather data and the generated insight power the weather impact card.
  const [weatherInfo, setWeatherInfo] = useState(null);

  // Default the dashboard to the current month and year when the page first opens.
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
  const [tableDayFilter, setTableDayFilter] = useState("all");
  const [tableMonthFilter, setTableMonthFilter] = useState("all");
  const [tableYearFilter, setTableYearFilter] = useState("all");
  const [applianceHoursOpen, setApplianceHoursOpen] = useState(false);
  const [applianceOptions, setApplianceOptions] = useState([]);
  const [applianceLogs, setApplianceLogs] = useState([]);
  const [applianceHoursSaving, setApplianceHoursSaving] = useState(false);
  const [applianceHoursError, setApplianceHoursError] = useState("");
  const [editingApplianceLog, setEditingApplianceLog] = useState(null);
  const [weatherLocationMode, setWeatherLocationMode] = useState(localStorage.getItem("weatherLocationMode") || "household");
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

      let resolvedHouseholdId =
        householdId ||
        localStorage.getItem("selectedHouseholdId") ||
        localStorage.getItem("householdId") ||
        "";

      if (!resolvedHouseholdId) {
        const householdsPayload = await getHouseholds();
        const households = Array.isArray(householdsPayload) ? householdsPayload : householdsPayload.data || [];

        if (households.length === 1) {
          resolvedHouseholdId = households[0]._id;
          saveHouseholdSelection(households[0]);
          setHouseholdOptions([]);
          setPendingHouseholdId("");
        } else if (households.length > 1) {
          setHouseholdOptions(households);
          setPendingHouseholdId("");
          setLoading(false);
          return;
        }
      }

      setHouseholdId(resolvedHouseholdId);
      setHouseholdOptions([]);
      setPendingHouseholdId("");

      if (resolvedHouseholdId) {
        localStorage.setItem("selectedHouseholdId", resolvedHouseholdId);
        localStorage.setItem("householdId", resolvedHouseholdId);
      }

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

  function saveHouseholdSelection(household) {
    if (!household?._id) return;

    localStorage.setItem("selectedHouseholdId", household._id);
    localStorage.setItem("householdId", household._id);

    if (household.name) {
      localStorage.setItem("selectedHouseholdName", household.name);
      localStorage.setItem("householdName", household.name);
    }
  }

  function handleSelectHousehold() {
    const selectedHousehold = householdOptions.find((item) => item._id === pendingHouseholdId);
    if (!selectedHousehold) return;

    saveHouseholdSelection(selectedHousehold);
    setHouseholdId(selectedHousehold._id);
    setHouseholdOptions([]);
    setPendingHouseholdId("");
  }

  async function loadPeriodData(activeHouseholdId, month, year) {
    try {
      setLoading(true);

      // Load the main usage dashboard data in parallel so all cards refresh together for the selected month.
      const [summaryPayload, costPayload, appliancesPayload, roomsPayload, usagePayload] = await Promise.all([
        getMonthlySummary(activeHouseholdId, month, year),
        getEstimatedCost(activeHouseholdId, month, year),
        getUsageByAppliances(activeHouseholdId, month, year),
        getUsageByRooms(activeHouseholdId, month, year),
        getUsages(activeHouseholdId),
      ]);

      // Save the monthly summary used by the "This Month" and daily-average cards.
      setSummary(summaryPayload.data);
      // Save the bill-style estimate shown in the estimated cost card.
      setCostInfo(costPayload.data);
      // Convert backend appliance data into the simple shape expected by the chart component.
      setApplianceBreakdown(
        (appliancesPayload.data?.breakdown || []).map((item) => ({
          name: item.name,
          value: item.allocatedUsage || 0,
          source: item.source,
        }))
      );
      // Convert backend room data into the shape expected by the progress breakdown component.
      setRoomBreakdown(
        (roomsPayload.data?.breakdown || []).map((item) => ({
          roomName: item.roomName,
          value: item.allocatedUsage || 0,
        }))
      );
      // Keep the full usage history for the table and the 7-day chart.
      setUsages(usagePayload.data || []);
      await loadApplianceHoursData(activeHouseholdId, month, year);

      try {
        const weatherLocation = await resolveWeatherLocation(activeHouseholdId);
        const weatherPayload = await getWeatherImpact(activeHouseholdId, month, year, weatherLocation.request);
        // Keep only the weather fields used by this page.
        setWeatherInfo({
          weather: weatherPayload.data?.weather || null,
          insight: weatherPayload.data?.insight || "Weather insight is unavailable right now.",
          sourceLabel: weatherLocation.sourceLabel,
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

  // Load appliance definitions and the saved hour logs together for the selected period.
  async function loadApplianceHoursData(activeHouseholdId, month, year) {
    try {
      const [appliancesPayload, logsPayload] = await Promise.all([
        getHouseholdAppliances(activeHouseholdId),
        getApplianceHoursLogs(activeHouseholdId, month, year),
      ]);

      // The household appliance endpoint returns a plain array, while usage-owned endpoints use the success/data wrapper.
      setApplianceOptions(Array.isArray(appliancesPayload) ? appliancesPayload : appliancesPayload.data || []);
      setApplianceLogs(logsPayload.data || []);
    } catch (hoursError) {
      setApplianceOptions([]);
      setApplianceLogs([]);
    }
  }

  // Prefer the household city because the insight is about household energy use, not the viewer's current location.
  async function resolveWeatherLocation(activeHouseholdId) {
    try {
      const household = await getHouseholdDetails(activeHouseholdId);

      if (household?.name) {
        localStorage.setItem("selectedHouseholdName", household.name);
        localStorage.setItem("householdName", household.name);
      }

      if (household?.city && weatherLocationMode === "household") {
        return { request: { city: household.city }, sourceLabel: "Household City" };
      }
    } catch (householdError) {
      // Keep the final fallback simple if the household lookup is not available yet.
    }

    if (weatherLocationMode === "browser") {
      const browserLocation = await getBrowserCoordinates();
      if (browserLocation) {
        return { request: browserLocation, sourceLabel: "Current Location" };
      }
    }

    if (weatherLocationMode === "custom" && customWeatherCity.trim()) {
      return { request: { city: customWeatherCity.trim() }, sourceLabel: "Custom City" };
    }

    try {
      const household = await getHouseholdDetails(activeHouseholdId);
      if (household?.city) {
        return { request: { city: household.city }, sourceLabel: "Household City" };
      }
    } catch (householdError) {
      // Ignore and fall through to the static fallback city.
    }

    return { request: { city: "Colombo" }, sourceLabel: "Fallback City" };
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

  async function handleSaveApplianceHours(form) {
    if (!householdId) {
      setApplianceHoursError("A household must be selected before logging appliance hours.");
      return;
    }

    if (!form.applianceId) {
      setApplianceHoursError("Select an appliance before saving.");
      return;
    }

    if (!form.date) {
      setApplianceHoursError("Pick the date for this usage log.");
      return;
    }

    const parsedHours = Number(form.hoursUsed);
    if (Number.isNaN(parsedHours) || parsedHours < 0 || parsedHours > 24) {
      setApplianceHoursError("Hours used must be between 0 and 24.");
      return;
    }

    try {
      setApplianceHoursSaving(true);
      setApplianceHoursError("");

      // Reuse the same dialog for create and edit so users can correct logged hours without leaving the usage page.
      const payload = {
        applianceId: form.applianceId,
        date: form.date,
        hoursUsed: parsedHours,
        source: "manual",
      };

      if (editingApplianceLog?._id) {
        await updateApplianceHoursLog(householdId, editingApplianceLog._id, payload);
      } else {
        await createApplianceHoursLog(householdId, payload);
      }

      await loadPeriodData(householdId, selectedPeriod.month, selectedPeriod.year);
      setApplianceHoursOpen(false);
      setEditingApplianceLog(null);
    } catch (err) {
      setApplianceHoursError(err.message || "Unable to save appliance hours.");
    } finally {
      setApplianceHoursSaving(false);
    }
  }

  function handleEditApplianceLog(log) {
    setApplianceHoursError("");
    setEditingApplianceLog(log);
  }

  // Delete logged hours directly from the usage page because they affect the appliance and room breakdowns immediately.
  async function handleDeleteApplianceLog(log) {
    const confirmed = window.confirm("Delete this appliance hours entry?");
    if (!confirmed) return;

    try {
      setApplianceHoursSaving(true);
      setApplianceHoursError("");
      await deleteApplianceHoursLog(householdId, log._id);
      await loadPeriodData(householdId, selectedPeriod.month, selectedPeriod.year);

      if (editingApplianceLog?._id === log._id) {
        setEditingApplianceLog(null);
      }
    } catch (err) {
      setApplianceHoursError(err.message || "Unable to delete appliance hours.");
    } finally {
      setApplianceHoursSaving(false);
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
    // Keep the chart anchored to today so the last 7 days always reflect the current calendar window.
    const today = new Date();
    const normalizedEndDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
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
      // Add an optional day filter because monthly usage logs can be dense enough to need one-day lookup.
      const dayMatches = tableDayFilter === "all" || date.getDate() === Number(tableDayFilter);
      const monthMatches = tableMonthFilter === "all" || date.getMonth() + 1 === Number(tableMonthFilter);
      const yearMatches = tableYearFilter === "all" || date.getFullYear() === Number(tableYearFilter);
      return dayMatches && monthMatches && yearMatches;
    });
  }, [tableDayFilter, tableMonthFilter, tableYearFilter, usages]);

  const applianceItems = useMemo(() => makePercentageItems(applianceBreakdown), [applianceBreakdown]);
  const roomItems = useMemo(() => makePercentageItems(roomBreakdown), [roomBreakdown]);
  const availableYears = useMemo(() => {
    const years = new Set(usages.map((item) => new Date(item.date).getFullYear()));
    years.add(new Date().getFullYear());
    return Array.from(years).sort((a, b) => b - a);
  }, [usages]);
  // The top "This Month" card reads its main value from the monthly summary response.
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
  const weatherSourceLabel = weatherInfo?.sourceLabel || "Household City";
  // Prefer a saved household label so the header never falls back to the raw object id.
  const householdLabel = localStorage.getItem("selectedHouseholdName") || localStorage.getItem("householdName") || "Household";
  const degreeSymbol = String.fromCharCode(176);

  return (
    <div style={{ background: colors.background, padding: "10px" }}>
      <div
        style={{
          marginBottom: "18px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "12px",
          flexWrap: "wrap",
        }}
      >
        <h1 style={{ margin: 0, fontSize: "32px", fontWeight: "700", lineHeight: 1.2, color: colors.text }}>Usage Tracking</h1>
        {householdOptions.length > 1 ? (
          <HouseholdSelectorInline
            households={householdOptions}
            pendingHouseholdId={pendingHouseholdId}
            onChange={setPendingHouseholdId}
            onConfirm={handleSelectHousehold}
          />
        ) : null}
      </div>
      <PageNotice loading={loading} error={error} householdId={householdId} showSelector={householdOptions.length > 1} />

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
          tone="red"
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
          tone="amber"
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
            sourceLabel={weatherSourceLabel}
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
        <BreakdownDonut
          title={`Usage by Appliance - ${formatMonthYear(selectedPeriod.month, selectedPeriod.year)}`}
          items={applianceItems}
          labelKey="name"
          actionLabel="Log Hours"
          onAction={() => {
            setApplianceHoursError("");
            setEditingApplianceLog(null);
            setApplianceHoursOpen(true);
          }}
        />
        <ProgressBreakdown
          title={`Usage by Room - ${formatMonthYear(selectedPeriod.month, selectedPeriod.year)}`}
          items={roomItems}
          labelKey="roomName"
        />
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
          dayFilter={tableDayFilter}
          monthFilter={tableMonthFilter}
          yearFilter={tableYearFilter}
          onDayFilterChange={setTableDayFilter}
          onMonthFilterChange={setTableMonthFilter}
          onYearFilterChange={setTableYearFilter}
          dayOptions={TABLE_DAY_FILTERS}
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
      <ApplianceHoursDialog
        open={applianceHoursOpen}
        appliances={applianceOptions}
        logs={applianceLogs}
        selectedPeriod={{ label: formatMonthYear(selectedPeriod.month, selectedPeriod.year) }}
        saving={applianceHoursSaving}
        submitError={applianceHoursError}
        editingLogId={editingApplianceLog?._id || ""}
        initialLog={editingApplianceLog}
        onClose={() => {
          setApplianceHoursOpen(false);
          setApplianceHoursError("");
          setEditingApplianceLog(null);
        }}
        onSubmit={handleSaveApplianceHours}
        onEdit={handleEditApplianceLog}
        onDelete={handleDeleteApplianceLog}
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

// Keep page-level empty, loading, and error states separate from the main dashboard layout.
function PageNotice({ loading, error, householdId, showSelector }) {
  if (loading) {
    return <Banner text="Loading usage dashboard..." tone="info" />;
  }

  if (error) {
    return <Banner text={error} tone="error" />;
  }

  if (showSelector) {
    return null;
  }

  if (!householdId) {
    return <Banner text="No usage-linked household was found. Add a usage record after setting a household ID in storage." tone="info" />;
  }

  return null;
}

// Reuse one lightweight notice style for loading, empty, and error states.
function Banner({ text, tone }) {
  const palette = tone === "error" ? { background: colors.redSoft, color: colors.red } : { background: colors.blueSoft, color: colors.blue };
  return (
    <div style={{ ...cardStyle, background: palette.background, color: palette.color, padding: "16px 20px", marginBottom: "22px" }}>
      {text}
    </div>
  );
}

function HouseholdSelectorInline({ households, pendingHouseholdId, onChange, onConfirm }) {
  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
      <select value={pendingHouseholdId} onChange={(event) => onChange(event.target.value)} style={selectStyle}>
        <option value="">Choose household</option>
        {households.map((household) => (
          <option key={household._id} value={household._id}>
            {household.name || "Household"}
          </option>
        ))}
      </select>
      <button
        type="button"
        onClick={onConfirm}
        disabled={!pendingHouseholdId}
        style={{
          border: "none",
          background: pendingHouseholdId ? colors.green : "#b6c3d1",
          color: "#ffffff",
          padding: "10px 16px",
          borderRadius: "12px",
          cursor: pendingHouseholdId ? "pointer" : "not-allowed",
          fontWeight: "700",
        }}
      >
        Continue
      </button>
    </div>
  );
}

// Add percentages once so both appliance and room breakdown cards can stay presentation-focused.
function makePercentageItems(items) {
  const total = items.reduce((sum, item) => sum + item.value, 0);
  return items.map((item) => ({
    ...item,
    percentage: total ? (item.value / total) * 100 : 0,
  }));
}

// Reuse the same responsive grid pattern across cards without repeating inline layout objects.
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
  { value: "all", label: "All Months" },
  ...MONTH_OPTIONS.map((month) => ({ value: String(month.value), label: month.label })),
];

const TABLE_DAY_FILTERS = [{ value: "all", label: "All Dates" }].concat(
  Array.from({ length: 31 }, (_, index) => ({
    value: String(index + 1),
    label: String(index + 1),
  }))
);

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

// Wrap the browser geolocation API so the weather card can fall back cleanly when permission is denied.
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