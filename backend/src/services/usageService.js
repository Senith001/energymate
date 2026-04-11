import Usage from "../models/usage.js";
import mongoose from "mongoose";
import { getTariff } from "./tarifService.js";
import Household from "../models/Household.js";
import Appliance from "../models/Appliance.js";
import Room from "../models/Room.js";
import ApplianceUsageLog from "../models/ApplianceUsageLog.js";

// Two tiers:
//   Tier A  – Consumption of 0–60 kWh per month
//   Tier B  – Consumption above 60 kWh per month
// Fixed charge is determined by the highest block reached.

/**
 * Calculate electricity cost using CEB domestic slab tariff + SSCL.
 * @param {number} totalUnits – kWh consumed in the billing period
 * @param {object} tariff – tariff document fetched from DB via getTariff()
 * @returns {{ totalUnits, energyCharge, fixedCharge, subTotal, sscl, totalCost, breakdown }}
 */
function calculateCost(totalUnits, tariff) {
  const slabs = totalUnits <= 60 ? tariff.tariffLow : tariff.tariffHigh;

  let remaining = totalUnits;
  let energyCharge = 0;
  let fixedCharge = 0;
  const breakdown = [];
  let prevLimit = 0;

  for (const slab of slabs) {
    if (remaining <= 0) break;

    const upTo      = slab.upTo === null ? Infinity : slab.upTo; // null from DB → Infinity
    const slabWidth = upTo === Infinity ? remaining : upTo - prevLimit;
    const unitsInSlab = Math.min(remaining, slabWidth);
    const cost = +(unitsInSlab * slab.rate).toFixed(2);

    breakdown.push({
      range: `${prevLimit + 1}–${prevLimit + unitsInSlab} kWh`,
      units: unitsInSlab,
      rate: slab.rate,
      cost,
    });

    energyCharge += cost;
    // Fixed charge = highest block reached
    if (slab.fixedCharge > fixedCharge) fixedCharge = slab.fixedCharge;

    remaining -= unitsInSlab;
    prevLimit = upTo === Infinity ? prevLimit + unitsInSlab : upTo;
  }

  const subTotal = +(energyCharge + fixedCharge).toFixed(2);
  const sscl = +(subTotal * tariff.ssclRate).toFixed(2); // from DB
  const totalCost = +(subTotal + sscl).toFixed(2);

  return {
    totalUnits,
    energyCharge: +energyCharge.toFixed(2),
    fixedCharge,
    subTotal,
    sscl,
    totalCost,
    breakdown,
  };
}

/**
 * Aggregate total units for a household in a given month/year.
 * @param {string} householdId
 * @param {number} month  1-12
 * @param {number} year
 * @returns {Promise<number>} totalUnits
 */
async function getMonthlyTotalUnits(householdId, month, year) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999); // last ms of month

  const result = await Usage.aggregate([
    {
      $match: {
        householdId: new mongoose.Types.ObjectId(householdId),
        date: { $gte: startDate, $lte: endDate },
      },
    },
    {
      $group: {
        _id: null,
        totalUnits: { $sum: "$unitsUsed" },
        entries: { $sum: 1 },
      },
    },
  ]);

  return result.length > 0 ? result[0] : { totalUnits: 0, entries: 0 };
}

function getMonthDateRange(month, year) {
  return {
    startDate: new Date(year, month - 1, 1),
    endDate: new Date(year, month, 0, 23, 59, 59, 999),
  };
}

// Normalize every date to the same YYYY-MM-DD key so daily usage entries and appliance logs can line up.
function toDateKey(date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString().slice(0, 10);
}

// Build the full list of days in the selected month when we need a default day-by-day estimate.
function getMonthDayKeys(month, year) {
  const daysInMonth = new Date(year, month, 0).getDate();
  return Array.from({ length: daysInMonth }, (_, index) =>
    new Date(year, month - 1, index + 1).toISOString().slice(0, 10)
  );
}

// Allocate appliance usage one day at a time so "Other" can represent the part of daily household usage
// that named appliances do not explain.
function allocateProfilesAcrossDays(profiles, actualUsageByDate, dayKeys) {
  const allocatedUsageByAppliance = new Map();
  let otherUsage = 0;
  const hasActualUsage = actualUsageByDate.size > 0;

  profiles.forEach((item) => {
    allocatedUsageByAppliance.set(item.appliance._id.toString(), 0);
  });

  dayKeys.forEach((dayKey) => {
    const dayTotal = profiles.reduce((sum, item) => sum + (item.dailyUsageByDate.get(dayKey) || 0), 0);

    if (!hasActualUsage) {
      profiles.forEach((item) => {
        const applianceId = item.appliance._id.toString();
        allocatedUsageByAppliance.set(
          applianceId,
          allocatedUsageByAppliance.get(applianceId) + (item.dailyUsageByDate.get(dayKey) || 0)
        );
      });
      return;
    }

    const actualUsage = actualUsageByDate.get(dayKey) || 0;
    const scale = dayTotal > 0 ? Math.min(actualUsage / dayTotal, 1) : 0;

    profiles.forEach((item) => {
      const applianceId = item.appliance._id.toString();
      const dayUsage = item.dailyUsageByDate.get(dayKey) || 0;
      allocatedUsageByAppliance.set(applianceId, allocatedUsageByAppliance.get(applianceId) + dayUsage * scale);
    });

    if (actualUsage > dayTotal) {
      otherUsage += actualUsage - dayTotal;
    }
  });

  return {
    allocatedUsageByAppliance,
    otherUsage: +otherUsage.toFixed(2),
  };
}

// Use logged appliance hours when available, and fall back to appliance defaults otherwise.
async function getMonthlyApplianceProfiles(householdId, month, year) {
  const [monthlyUsage, appliances] = await Promise.all([
    getMonthlyTotalUnits(householdId, month, year),
    Appliance.find({ householdId }),
  ]);

  if (appliances.length === 0) {
    return {
      householdId,
      month,
      year,
      totalUnits: monthlyUsage.totalUnits,
      totalEstimatedUsage: 0,
      allocationFactor: 0,
      actualUsageByDate: new Map(),
      dayKeys: [],
      profiles: [],
    };
  }

  const { startDate, endDate } = getMonthDateRange(month, year);
  const [usageEntries, logs] = await Promise.all([
    Usage.find({
      householdId,
      date: { $gte: startDate, $lte: endDate },
    }).select("date unitsUsed"),
    ApplianceUsageLog.find({
      householdId,
      date: { $gte: startDate, $lte: endDate },
    }),
  ]);

  const actualUsageByDate = new Map();
  usageEntries.forEach((entry) => {
    actualUsageByDate.set(toDateKey(entry.date), Number(entry.unitsUsed || 0));
  });

  // Keep appliance logs separated by both appliance and day because manual-mode appliances are tracked daily.
  const loggedHoursByApplianceAndDate = new Map();
  logs.forEach((log) => {
    const key = `${log.applianceId.toString()}:${toDateKey(log.date)}`;
    loggedHoursByApplianceAndDate.set(key, Number(log.hoursUsed || 0));
  });

  // If the household already has daily usage entries, only compare against those recorded days.
  // Otherwise, estimate across the whole month.
  const dayKeys = actualUsageByDate.size > 0 ? Array.from(actualUsageByDate.keys()).sort() : getMonthDayKeys(month, year);

  const profiles = appliances.map((appliance) => {
    const applianceId = appliance._id.toString();
    const usageMode = appliance.usageMode || "default";
    const dailyUsageByDate = new Map();
    let hoursUsed = 0;
    let estimatedUsage = 0;
    let usedLoggedHours = false;

    // Build the appliance estimate day by day so default-mode and manual-mode appliances follow the same shape.
    dayKeys.forEach((dayKey) => {
      const loggedHours = loggedHoursByApplianceAndDate.get(`${applianceId}:${dayKey}`) || 0;
      const dayHoursUsed = usageMode === "manual" ? loggedHours : Number(appliance.defaultHoursPerDay || 0);
      const dayUsage =
        (Number(appliance.wattage || 0) *
          Number(appliance.quantity || 1) *
          dayHoursUsed) /
        1000;

      if (usageMode === "manual" && loggedHours > 0) {
        usedLoggedHours = true;
      }

      dailyUsageByDate.set(dayKey, dayUsage);
      hoursUsed += dayHoursUsed;
      estimatedUsage += dayUsage;
    });

    return {
      appliance,
      hoursUsed: +hoursUsed.toFixed(2),
      estimatedUsage: +estimatedUsage.toFixed(2),
      dailyUsageByDate,
      source: usedLoggedHours ? "logged" : usageMode,
    };
  });

  const totalEstimatedUsage = profiles.reduce((sum, item) => sum + item.estimatedUsage, 0);
  const allocationFactor = totalEstimatedUsage > 0 ? monthlyUsage.totalUnits / totalEstimatedUsage : 0;

  return {
    householdId,
    month,
    year,
    totalUnits: monthlyUsage.totalUnits,
    totalEstimatedUsage: +totalEstimatedUsage.toFixed(2),
    allocationFactor: +allocationFactor.toFixed(4),
    actualUsageByDate,
    dayKeys,
    profiles,
  };
}

/**
 * Combined helper: get monthly summary with cost calculation.
 * Reduces duplication between getMonthlySummary and estimateCost endpoints.
 */
async function getMonthlyCostSummary(householdId, month, year) {
  const [summary, tariff] = await Promise.all([
    getMonthlyTotalUnits(householdId, month, year),
    getTariff(), // fetch live tariff from DB
  ]);
  const costInfo = calculateCost(summary.totalUnits, tariff); // pass tariff in
  return { ...summary, ...costInfo };
}

/**
 * Verify ownership of a household by userId.
 * @param {string} householdId
 * @param {string} userId
 * @returns {Promise<object|null>} Household document if found, else null
 */
export async function verifyHouseholdOwnership(householdId, userId) {
  return await Household.findOne({ _id: householdId, userId });
}

/**
 * Calculate usage by appliance for a household in a given month/year.
 * Allocates total units proportionally based on appliance wattage profiles.
 * @param {string} householdId
 * @param {number} month  1-12
 * @param {number} year
 * @returns {Promise<object>} breakdown with { householdId, month, year, totalUnits, breakdown[] }
 */
export async function getUsageByAppliances(householdId, month, year) {
  const monthlyProfiles = await getMonthlyApplianceProfiles(householdId, month, year);
  const hasEstimatedData = monthlyProfiles.profiles.some((item) => item.source !== "logged");
  // Show named appliances separately, then roll the unexplained daily remainder into "Other".
  const namedProfiles = monthlyProfiles.profiles.filter((item) => item.source === "logged" || item.source === "default");
  const { allocatedUsageByAppliance, otherUsage } = allocateProfilesAcrossDays(
    namedProfiles,
    monthlyProfiles.actualUsageByDate,
    monthlyProfiles.dayKeys
  );

  const breakdown = namedProfiles.map((item) => ({
    applianceId: item.appliance._id,
    name: item.appliance.name,
    wattage: item.appliance.wattage,
    quantity: item.appliance.quantity,
    defaultHoursPerDay: item.appliance.defaultHoursPerDay,
    hoursUsed: item.hoursUsed,
    source: item.source,
    estimatedUsage: item.estimatedUsage,
    allocatedUsage: +(allocatedUsageByAppliance.get(item.appliance._id.toString()) || 0).toFixed(2),
  }));

  if (otherUsage > 0.01) {
    breakdown.push({
      applianceId: null,
      name: "Other",
      wattage: 0,
      quantity: 1,
      defaultHoursPerDay: 0,
      hoursUsed: 0,
      source: "other",
      estimatedUsage: 0,
      allocatedUsage: otherUsage,
    });
  }

  return {
    householdId,
    month,
    year,
    totalUnits: monthlyProfiles.totalUnits,
    totalEstimatedUsage: monthlyProfiles.totalEstimatedUsage,
    allocationFactor: monthlyProfiles.allocationFactor,
    hasEstimatedData,
    isEstimatedOnly: monthlyProfiles.totalUnits === 0 && monthlyProfiles.totalEstimatedUsage > 0,
    unallocatedUsage: otherUsage > 0 ? otherUsage : 0,
    breakdown,
  };
}

/**
 * Calculate usage by room for a household in a given month/year.
 * Aggregates appliance usage by room and allocates proportionally.
 * @param {string} householdId
 * @param {number} month  1-12
 * @param {number} year
 * @returns {Promise<object>} breakdown with { householdId, month, year, totalUnits, breakdown[] }
 */
export async function getUsageByRooms(householdId, month, year) {
  const monthlyProfiles = await getMonthlyApplianceProfiles(householdId, month, year);
  const rooms = await Room.find({ householdId });
  const hasEstimatedData = monthlyProfiles.profiles.some((item) => item.source !== "logged");

  if (rooms.length === 0) {
    return {
      householdId,
      month,
      year,
      totalUnits: monthlyProfiles.totalUnits,
      totalEstimatedUsage: 0,
      allocationFactor: 0,
      hasEstimatedData,
      isEstimatedOnly: monthlyProfiles.totalUnits === 0 && monthlyProfiles.totalEstimatedUsage > 0,
      breakdown: [],
    };
  }

  const { allocatedUsageByAppliance } = allocateProfilesAcrossDays(
    monthlyProfiles.profiles,
    monthlyProfiles.actualUsageByDate,
    monthlyProfiles.dayKeys
  );

  // Room totals are built by grouping the already-calculated appliance allocations.
  const roomUsages = rooms.map((room) => {
    const roomAppliances = monthlyProfiles.profiles.filter(
      (item) => item.appliance.roomId && item.appliance.roomId.toString() === room._id.toString()
    );

    const estimatedUsage = roomAppliances.reduce((sum, item) => sum + item.estimatedUsage, 0);
    const hoursUsed = roomAppliances.reduce((sum, item) => sum + item.hoursUsed, 0);

    return {
      room,
      estimatedUsage,
      allocatedUsage: roomAppliances.reduce(
        (sum, item) => sum + (allocatedUsageByAppliance.get(item.appliance._id.toString()) || 0),
        0
      ),
      hoursUsed,
      applianceCount: roomAppliances.length,
    };
  });

  // Calculate total estimated usage
  const totalEstimatedUsage = roomUsages.reduce((sum, r) => sum + r.estimatedUsage, 0);

  const breakdown = roomUsages.map((r) => ({
    roomId: r.room._id,
    roomName: r.room.name,
    applianceCount: r.applianceCount,
    hoursUsed: +r.hoursUsed.toFixed(2),
    estimatedUsage: +r.estimatedUsage.toFixed(2),
    allocatedUsage: +r.allocatedUsage.toFixed(2),
  }));

  return {
    householdId,
    month,
    year,
    totalUnits: monthlyProfiles.totalUnits,
    totalEstimatedUsage: +totalEstimatedUsage.toFixed(2),
    allocationFactor: monthlyProfiles.allocationFactor,
    hasEstimatedData,
    isEstimatedOnly: monthlyProfiles.totalUnits === 0 && monthlyProfiles.totalEstimatedUsage > 0,
    breakdown,
  };
}

export {
  calculateCost,
  getMonthlyTotalUnits,
  getMonthlyCostSummary,
  getMonthlyApplianceProfiles,
};
