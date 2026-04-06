import express from "express";
import {
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
} from "../controllers/usageController.js";
import {
  createUsageRules,
  updateUsageRules,
  idParamRule,
  monthlyQueryRules,
  weatherImpactRules,
  applianceUsageLogCreateRules,
  applianceUsageLogUpdateRules,
  applianceUsageLogListRules,
  applianceUsageLogIdRule,
} from "../validators/usageValidation.js";
import { protect } from "../middlewares/auth.middleware.js";

const router = express.Router();

//create
router.post("/", protect, createUsageRules, createUsage);

//read
router.get("/", protect, getUsages);
router.get("/:id", protect, idParamRule, getUsageById);
// Household-scoped analytics power both the user dashboard and the admin inspection pages.
router.get("/households/:householdId/monthly-summary", protect, monthlyQueryRules, getMonthlySummary);
router.get("/households/:householdId/estimate", protect, monthlyQueryRules, estimateCost);
router.get("/households/:householdId/by-appliances", protect, monthlyQueryRules, getUsageByAppliancesController);
router.get("/households/:householdId/by-rooms", protect, monthlyQueryRules, getUsageByRoomsController);
router.get("/households/:householdId/weather-impact", protect, weatherImpactRules, getWeatherImpact);
router.post("/households/:householdId/appliance-hours", protect, applianceUsageLogCreateRules, createApplianceUsageLog);
router.get("/households/:householdId/appliance-hours", protect, applianceUsageLogListRules, getApplianceUsageLogs);
router.patch("/households/:householdId/appliance-hours/:logId", protect, applianceUsageLogUpdateRules, updateApplianceUsageLog);
router.delete("/households/:householdId/appliance-hours/:logId", protect, applianceUsageLogIdRule, deleteApplianceUsageLog);

//update
router.patch("/:id", protect, updateUsageRules, updateUsage);

//delete
router.delete("/:id", protect, idParamRule, deleteUsage);

export default router;
