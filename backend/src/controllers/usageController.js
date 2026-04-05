import Usage from "../models/usage.js";
import Appliance from "../models/Appliance.js";
import ApplianceUsageLog from "../models/ApplianceUsageLog.js";
import { success, error } from "../utils/responseFormatter.js";
import Household from "../models/Household.js";
import { getMonthlyCostSummary, getUsageByAppliances, getUsageByRooms } from "../services/usageService.js";
import { getCurrentWeather, getCurrentWeatherByCoords } from "../services/openWeatherService.js";
import { verifyHouseholdOwnership } from "../services/usageService.js";

// CREATE/ADD USAGE
async function createUsage(req, res) {
  try {
    let { householdId, date, entryType, unitsUsed, previousReading, currentReading } = req.body;

    // Check user role and ownership
    if (req.user && req.user.role === "user") {
      const household = await verifyHouseholdOwnership(householdId, req.user._id);
      if (!household) return error(res, "Household not found or access denied", 403);
    }

    // Calculate unitsUsed if readings provided
    if (!unitsUsed && previousReading !== undefined && currentReading !== undefined) {
      unitsUsed = currentReading - previousReading;

      if (unitsUsed < 0) {
        return error(res, "currentReading must be greater than previousReading", 400);
      }
    }

    const usage = new Usage({
      householdId,
      date,
      entryType: entryType || "manual",
      unitsUsed,
      previousReading,
      currentReading,
    });

    const saved = await usage.save();
    return success(res, saved, "Usage created", 201);
  } catch (err) {
    if (err.code === 11000) {
      return error(res, "Duplicate usage entry for the given household and date", 409);
    }
    return error(res, "Server error", 500, err.message);
  }
}

// READ ALL
async function getUsages(req, res) {
  try {
    // Get all households owned by the user
    const userHouseholds = await Household.find({ userId: req.user._id }).select("_id");
    const householdIds = userHouseholds.map((h) => h._id);

    const filter = { householdId: { $in: householdIds } };
    // If specific householdId provided, verify ownership
    if (req.query.householdId) {
      if (!householdIds.some((id) => id.toString() === req.query.householdId)) {
        return error(res, "Household not found or access denied", 403);
      }
      filter.householdId = req.query.householdId;
    }

    const usages = await Usage.find(filter);

    return success(res, usages, "Usages fetched");
  } catch (err) {
    return error(res, "Server error", 500, err.message);
  }
}

// READ ONE
async function getUsageById(req, res) {
  try {
    const usage = await Usage.findById(req.params.id);
    if (!usage) return error(res, "Usage not found", 404);

    if (req.user && req.user.role === "user") {
      const household = await verifyHouseholdOwnership(usage.householdId, req.user._id);
      if (!household) return error(res, "Access denied", 403);
    }

    return success(res, usage, "Usage fetched");
  } catch (err) {
    return error(res, "Server error", 500, err.message);
  }
}

// UPDATE
async function updateUsage(req, res) {
  try {
    const existingUsage = await Usage.findById(req.params.id);
    if (!existingUsage) return error(res, "Usage not found", 404);

    if (req.user && req.user.role === "user") {
      const household = await verifyHouseholdOwnership(existingUsage.householdId, req.user._id);
      if (!household) return error(res, "Access denied", 403);
    }

    const { currentReading, previousReading, unitsUsed, date, entryType } = req.body;

    if (date !== undefined) {
      existingUsage.date = date;
    }

    if (entryType !== undefined) {
      existingUsage.entryType = entryType;
    }

    const activeEntryType = existingUsage.entryType;

    if (previousReading !== undefined) {
      existingUsage.previousReading = previousReading;
    }

    if (currentReading !== undefined) {
      existingUsage.currentReading = currentReading;
    }

    // Meter entries always derive units from the stored readings.
    if (
      activeEntryType === "meter" &&
      existingUsage.previousReading !== undefined &&
      existingUsage.previousReading !== null &&
      existingUsage.currentReading !== undefined &&
      existingUsage.currentReading !== null
    ) {
      const calculated = existingUsage.currentReading - existingUsage.previousReading;

      if (calculated < 0) {
        return error(res, "currentReading must be greater than previousReading", 400);
      }

      existingUsage.unitsUsed = calculated;
    } else if (unitsUsed !== undefined) {
      // Manual entries store units directly and do not keep meter readings.
      existingUsage.unitsUsed = unitsUsed;
      if (activeEntryType === "manual") {
        existingUsage.previousReading = null;
        existingUsage.currentReading = null;
      }
    }

    const updated = await existingUsage.save();
    return success(res, updated, "Usage updated");
  } catch (err) {
    if (err.code === 11000) {
      return error(res, "Duplicate usage entry for the given household and date", 409);
    }
    return error(res, "Server error", 500, err.message);
  }
}

// DELETE
async function deleteUsage(req, res) {
  try {
    const usage = await Usage.findById(req.params.id);
    if (!usage) return error(res, "Usage not found", 404);

    if (req.user && req.user.role === "user") {
      const household = await verifyHouseholdOwnership(usage.householdId, req.user._id);
      if (!household) return error(res, "Access denied", 403);
    }

    await Usage.findByIdAndDelete(req.params.id);
    return success(res, usage, "Usage deleted");
  } catch (err) {
    return error(res, "Server error", 500, err.message);
  }
}

// MONTHLY USAGE SUMMARY
async function getMonthlySummary(req, res) {
  try {
    const { householdId } = req.params;
    const { month: queryMonth, year: queryYear } = req.query;

    if (req.user && req.user.role === "user") {
      const household = await verifyHouseholdOwnership(householdId, req.user._id);
      if (!household) return error(res, "Household not found or access denied", 403);
    }

    const summary = await getMonthlyCostSummary(householdId, Number(queryMonth), Number(queryYear));
    return success(res, { householdId, month: Number(queryMonth), year: Number(queryYear), ...summary }, "Monthly summary fetched");
  } catch (err) {
    return error(res, "Server error", 500, err.message);
  }
}

// ESTIMATE COST
async function estimateCost(req, res) {
  try {
    const { householdId } = req.params;
    const { month: queryMonth, year: queryYear } = req.query;

    if (req.user && req.user.role === "user") {
      const household = await verifyHouseholdOwnership(householdId, req.user._id);
      if (!household) return error(res, "Household not found or access denied", 403);
    }

    const costInfo = await getMonthlyCostSummary(householdId, Number(queryMonth), Number(queryYear));
    return success(res, costInfo, "Cost estimated");
  } catch (err) {
    return error(res, "Server error", 500, err.message);
  }
}

// WEATHER IMPACT (third-party API integration)
async function getWeatherImpact(req, res) {
  try {
    const { householdId } = req.params;
    const { city, lat, lon } = req.query;

    if (req.user && req.user.role === "user") {
      const household = await verifyHouseholdOwnership(householdId, req.user._id);
      if (!household) return error(res, "Household not found or access denied", 403);
    }

    const weather =
      lat !== undefined && lon !== undefined
        ? await getCurrentWeatherByCoords(Number(lat), Number(lon))
        : await getCurrentWeather(city || "Colombo");

    let insight;
    if (weather.temperature > 30) {
      insight = "High temperatures detected. Expect increased electricity usage due to cooling appliances.";
    } else if (weather.temperature > 25) {
      insight = "Moderate temperatures. Electricity usage should be average.";
    } else {
      insight = "Cool temperatures. Lower electricity usage expected from cooling appliances.";
    }

    // Return only the weather details and the usage insight needed by the frontend card.
    return success(res, { weather, insight }, "Weather impact analysis");
  } catch (err) {
    if (err.response && err.response.status === 404) {
      return error(res, "City not found. Please provide a valid city name.", 400);
    }
    return error(res, "Server error", 500, err.message);
  }
}

// USAGE BY APPLIANCES
async function getUsageByAppliancesController(req, res) {
  try {
    const { householdId } = req.params;
    const { month: queryMonth, year: queryYear } = req.query;

    if (req.user && req.user.role === "user") {
      const household = await verifyHouseholdOwnership(householdId, req.user._id);
      if (!household) return error(res, "Household not found or access denied", 403);
    }

    const breakdown = await getUsageByAppliances(householdId, Number(queryMonth), Number(queryYear));
    return success(res, breakdown, "Usage by appliances fetched");
  } catch (err) {
    return error(res, "Server error", 500, err.message);
  }
}

// USAGE BY ROOMS
async function getUsageByRoomsController(req, res) {
  try {
    const { householdId } = req.params;
    const { month: queryMonth, year: queryYear } = req.query;

    if (req.user && req.user.role === "user") {
      const household = await verifyHouseholdOwnership(householdId, req.user._id);
      if (!household) return error(res, "Household not found or access denied", 403);
    }

    const breakdown = await getUsageByRooms(householdId, Number(queryMonth), Number(queryYear));
    return success(res, breakdown, "Usage by rooms fetched");
  } catch (err) {
    return error(res, "Server error", 500, err.message);
  }
}

// DAILY APPLIANCE HOURS
async function createApplianceUsageLog(req, res) {
  try {
    const { householdId } = req.params;
    const { applianceId, date, hoursUsed, source } = req.body;

    if (req.user && req.user.role === "user") {
      const household = await verifyHouseholdOwnership(householdId, req.user._id);
      if (!household) return error(res, "Household not found or access denied", 403);
    }

    const appliance = await Appliance.findOne({ _id: applianceId, householdId });
    if (!appliance) return error(res, "Appliance not found in this household", 404);

    const log = new ApplianceUsageLog({
      householdId,
      applianceId,
      date,
      hoursUsed,
      source: source || "manual",
    });

    const saved = await log.save();
    return success(res, saved, "Appliance usage log created", 201);
  } catch (err) {
    if (err.code === 11000) {
      return error(res, "A usage-hours entry already exists for this appliance and date", 409);
    }
    return error(res, "Server error", 500, err.message);
  }
}

async function getApplianceUsageLogs(req, res) {
  try {
    const { householdId } = req.params;
    const { month, year, applianceId } = req.query;

    if (req.user && req.user.role === "user") {
      const household = await verifyHouseholdOwnership(householdId, req.user._id);
      if (!household) return error(res, "Household not found or access denied", 403);
    }

    const filter = { householdId };

    if (applianceId) {
      filter.applianceId = applianceId;
    }

    if (month && year) {
      filter.date = {
        $gte: new Date(Number(year), Number(month) - 1, 1),
        $lte: new Date(Number(year), Number(month), 0, 23, 59, 59, 999),
      };
    }

    const logs = await ApplianceUsageLog.find(filter).sort({ date: -1, createdAt: -1 });
    return success(res, logs, "Appliance usage logs fetched");
  } catch (err) {
    return error(res, "Server error", 500, err.message);
  }
}

async function updateApplianceUsageLog(req, res) {
  try {
    const { householdId, logId } = req.params;
    const { date, hoursUsed, source } = req.body;

    if (req.user && req.user.role === "user") {
      const household = await verifyHouseholdOwnership(householdId, req.user._id);
      if (!household) return error(res, "Household not found or access denied", 403);
    }

    const log = await ApplianceUsageLog.findOne({ _id: logId, householdId });
    if (!log) return error(res, "Appliance usage log not found", 404);

    if (date !== undefined) log.date = date;
    if (hoursUsed !== undefined) log.hoursUsed = hoursUsed;
    if (source !== undefined) log.source = source;

    const updated = await log.save();
    return success(res, updated, "Appliance usage log updated");
  } catch (err) {
    if (err.code === 11000) {
      return error(res, "A usage-hours entry already exists for this appliance and date", 409);
    }
    return error(res, "Server error", 500, err.message);
  }
}

async function deleteApplianceUsageLog(req, res) {
  try {
    const { householdId, logId } = req.params;

    if (req.user && req.user.role === "user") {
      const household = await verifyHouseholdOwnership(householdId, req.user._id);
      if (!household) return error(res, "Household not found or access denied", 403);
    }

    const log = await ApplianceUsageLog.findOneAndDelete({ _id: logId, householdId });
    if (!log) return error(res, "Appliance usage log not found", 404);

    return success(res, log, "Appliance usage log deleted");
  } catch (err) {
    return error(res, "Server error", 500, err.message);
  }
}

export {
  createUsage,
  getUsages,
  getUsageById,
  updateUsage,
  deleteUsage,
  getMonthlySummary,
  estimateCost,
  getWeatherImpact,
  getUsageByAppliancesController,
  getUsageByRoomsController,
  createApplianceUsageLog,
  getApplianceUsageLogs,
  updateApplianceUsageLog,
  deleteApplianceUsageLog,
};
