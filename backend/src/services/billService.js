import Bill from "../models/bill.js";
import { calculateCost, getMonthlyTotalUnits } from "./usageService.js";
import { getTariff } from "./tarifService.js";

/**
 * Create a bill from user-entered data.
 * User provides EITHER totalUnits directly OR previousReading & currentReading.
 */
async function createUserBill({ householdId, month, year, totalUnits, previousReading, currentReading }) {
  const billFields = await buildBillFields({ month, year, totalUnits, previousReading, currentReading });

  const bill = await Bill.findOneAndUpdate(
    { householdId, month, year },
    {
      ...billFields,
      status: "unpaid", paidAt: null,
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return bill;
}

// Reuse the same tariff calculation whenever bill units, readings, or period changes.
async function buildBillFields({ month, year, totalUnits, previousReading, currentReading }) {
  // Calculate totalUnits from readings if not provided directly
  if (totalUnits === undefined || totalUnits === null) {
    if (previousReading === undefined || currentReading === undefined) {
      throw new Error("Provide either totalUnits or both previousReading and currentReading");
    }
    if (currentReading < previousReading) {
      throw new Error("currentReading must be greater than previousReading");
    }
    totalUnits = currentReading - previousReading;
  }

  const tariff = await getTariff();
  const { energyCharge, fixedCharge, subTotal, sscl, totalCost, breakdown } =
    calculateCost(totalUnits, tariff);

  const dueDate = new Date(year, month, 20);

  return {
    previousReading: previousReading ?? null,
    currentReading: currentReading ?? null,
    totalUnits,
    energyCharge,
    fixedCharge,
    subTotal,
    sscl,
    totalCost,
    breakdown,
    dueDate,
  };
}

/**
 * Generate a bill for a household for a given month/year.
 * Auto-generates from usage records in DB.
 * @param {string} householdId
 * @param {number} month 1-12
 * @param {number} year
 * @returns {Promise<Object>} saved Bill document
 */
async function generateBill(householdId, month, year, options = {}) {
  const { overwriteExisting = false } = options;
  // Aggregate total units from usage records + fetch live tariff from DB in parallel
  const [{ totalUnits }, tariff] = await Promise.all([
    getMonthlyTotalUnits(householdId, month, year),
    getTariff(),
  ]);

  // Calculate cost using tariff from DB
  const { energyCharge, fixedCharge, subTotal, sscl, totalCost, breakdown } = calculateCost(totalUnits, tariff);

  // Due date = 20th of the following month
  const dueDate = new Date(year, month, 20); // month is 0-indexed, so month (1-12) becomes next month
  const existingBill = await Bill.findOne({ householdId, month, year }).select("_id");
  const billFields = { totalUnits, energyCharge, fixedCharge, subTotal, sscl, totalCost, breakdown, dueDate, status: "unpaid", paidAt: null };

  if (existingBill && !overwriteExisting) {
    throw createDuplicateBillError(month, year);
  }

  if (existingBill) {
    return Bill.findOneAndUpdate(
      { householdId, month, year },
      // Regeneration replaces the current stored bill snapshot for the same billing period.
      billFields,
      { new: true, runValidators: true }
    );
  }

  return Bill.create({
    householdId,
    month,
    year,
    ...billFields,
  });
}

// Create the previous month's bill automatically once a new month starts, but only when usage exists and no bill was saved yet.
async function ensurePreviousMonthBill(householdId, referenceDate = new Date()) {
  const currentMonth = referenceDate.getMonth() + 1;
  const currentYear = referenceDate.getFullYear();
  const month = currentMonth === 1 ? 12 : currentMonth - 1;
  const year = currentMonth === 1 ? currentYear - 1 : currentYear;

  const existingBill = await Bill.findOne({ householdId, month, year }).select("_id");
  if (existingBill) {
    return existingBill;
  }

  const { totalUnits, entries } = await getMonthlyTotalUnits(householdId, month, year);
  if (!entries || totalUnits <= 0) {
    return null;
  }

  return generateBill(householdId, month, year);
}

/**
 * Compare current month bill with previous month for the same household.
 * @param {string} householdId
 * @param {number} month 1-12
 * @param {number} year
 * @returns {Promise<Object>} comparison data
 */
async function compareBills(householdId, month, year) {
  // Calculate previous month/year
  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;

  const [currentBill, previousBill] = await Promise.all([
    Bill.findOne({ householdId, month, year }),
    Bill.findOne({ householdId, month: prevMonth, year: prevYear }),
  ]);

  if (!currentBill) {
    return { message: "No bill found for the requested month" };
  }

  const comparison = {
    current: {
      month,
      year,
      totalUnits: currentBill.totalUnits,
      totalCost: currentBill.totalCost,
    },
    previous: previousBill
      ? {
          month: prevMonth,
          year: prevYear,
          totalUnits: previousBill.totalUnits,
          totalCost: previousBill.totalCost,
        }
      : null,
  };

  if (previousBill) {
    const unitsDiff = currentBill.totalUnits - previousBill.totalUnits;
    const costDiff = currentBill.totalCost - previousBill.totalCost;
    const unitsChangePercent =
      previousBill.totalUnits > 0
        ? +((unitsDiff / previousBill.totalUnits) * 100).toFixed(1)
        : null;
    const costChangePercent =
      previousBill.totalCost > 0
        ? +((costDiff / previousBill.totalCost) * 100).toFixed(1)
        : null;

    comparison.difference = {
      units: unitsDiff,
      cost: +costDiff.toFixed(2),
      unitsChangePercent,
      costChangePercent,
      trend: unitsDiff > 0 ? "increased" : unitsDiff < 0 ? "decreased" : "unchanged",
    };
  }

  return comparison;
}

export { createUserBill, generateBill, compareBills, buildBillFields, ensurePreviousMonthBill };
