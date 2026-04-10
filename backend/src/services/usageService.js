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

// Use logged appliance hours when available, and fall back to appliance defaults otherwise.
async function getMonthlyApplianceProfiles(householdId, month, year) {
  const monthlyUsage = await getMonthlyTotalUnits(householdId, month, year);
  const appliances = await Appliance.find({ householdId });

  if (appliances.length === 0) {
    return {
      householdId,
      month,
      year,
      totalUnits: monthlyUsage.totalUnits,
      totalEstimatedUsage: 0,
      allocationFactor: 0,
      profiles: [],
    };
  }

  const { startDate, endDate } = getMonthDateRange(month, year);
  const daysInMonth = new Date(year, month, 0).getDate();
  const logs = await ApplianceUsageLog.find({
    householdId,
    date: { $gte: startDate, $lte: endDate },
  });

  const loggedHoursByAppliance = new Map();

  logs.forEach((log) => {
    const key = log.applianceId.toString();
    loggedHoursByAppliance.set(key, (loggedHoursByAppliance.get(key) || 0) + Number(log.hoursUsed || 0));
  });

  const profiles = appliances.map((appliance) => {
    const applianceId = appliance._id.toString();
    const loggedHours = loggedHoursByAppliance.get(applianceId) || 0;
    const usedLoggedHours = loggedHoursByAppliance.has(applianceId);
    // Temporary rule until appliance usageMode is added:
    // if the user logs this appliance at least once in the month, treat it as manually tracked for that month.
    // Otherwise, fall back to the appliance's default daily hours.
    const hoursUsed = usedLoggedHours
      ? loggedHours
      : Number(appliance.defaultHoursPerDay || 0) * daysInMonth;
    // Convert stored appliance metadata into an estimated monthly kWh value.
    const estimatedUsage =
      (Number(appliance.wattage || 0) *
        Number(appliance.quantity || 1) *
        hoursUsed) /
      1000;

    return {
      appliance,
      hoursUsed: +hoursUsed.toFixed(2),
      estimatedUsage,
      source: usedLoggedHours ? "logged" : "default",
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
  const hasEstimatedData = monthlyProfiles.profiles.some((item) => item.source === "default");

  // Allocate the real household total across appliance profiles so the chart still sums back to monthly usage.
  const breakdown = monthlyProfiles.profiles.map((item) => ({
    applianceId: item.appliance._id,
    name: item.appliance.name,
    wattage: item.appliance.wattage,
    quantity: item.appliance.quantity,
    defaultHoursPerDay: item.appliance.defaultHoursPerDay,
    hoursUsed: item.hoursUsed,
    source: item.source,
    estimatedUsage: +item.estimatedUsage.toFixed(2),
    allocatedUsage: +(item.estimatedUsage * monthlyProfiles.allocationFactor).toFixed(2),
  }));

  const allocatedTotal = breakdown.reduce((sum, item) => sum + item.allocatedUsage, 0);
  const unallocatedUsage = +(monthlyProfiles.totalUnits - allocatedTotal).toFixed(2);

  // Keep any remainder explicit so the appliance chart does not imply every kWh was traced to a named appliance.
  if (unallocatedUsage > 0.01) {
    breakdown.push({
      applianceId: null,
      name: "Other",
      wattage: 0,
      quantity: 1,
      defaultHoursPerDay: 0,
      hoursUsed: 0,
      source: "other",
      estimatedUsage: 0,
      allocatedUsage: unallocatedUsage,
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
    unallocatedUsage: unallocatedUsage > 0 ? unallocatedUsage : 0,
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
  const hasEstimatedData = monthlyProfiles.profiles.some((item) => item.source === "default");

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

  // Room totals are derived from the appliance logs/defaults instead of being stored separately.
  const roomUsages = rooms.map((room) => {
    const roomAppliances = monthlyProfiles.profiles.filter(
      (item) => item.appliance.roomId && item.appliance.roomId.toString() === room._id.toString()
    );

    const estimatedUsage = roomAppliances.reduce((sum, item) => sum + item.estimatedUsage, 0);
    const hoursUsed = roomAppliances.reduce((sum, item) => sum + item.hoursUsed, 0);

    return {
      room,
      estimatedUsage,
      hoursUsed,
      applianceCount: roomAppliances.length,
    };
  });

  // Calculate total estimated usage
  const totalEstimatedUsage = roomUsages.reduce((sum, r) => sum + r.estimatedUsage, 0);

  // Allocate actual usage proportionally
  const allocationFactor = totalEstimatedUsage > 0 ? monthlyProfiles.totalUnits / totalEstimatedUsage : 0;

  const breakdown = roomUsages.map((r) => ({
    roomId: r.room._id,
    roomName: r.room.name,
    applianceCount: r.applianceCount,
    hoursUsed: +r.hoursUsed.toFixed(2),
    estimatedUsage: +r.estimatedUsage.toFixed(2),
    allocatedUsage: +(r.estimatedUsage * allocationFactor).toFixed(2),
  }));

  return {
    householdId,
    month,
    year,
    totalUnits: monthlyProfiles.totalUnits,
    totalEstimatedUsage: +totalEstimatedUsage.toFixed(2),
    allocationFactor: +allocationFactor.toFixed(4),
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
