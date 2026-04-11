import express from "express";
import { protect, authorize } from "../middlewares/auth.middleware.js";

import {
  generateEnergyTips,
  generateCostStrategies,
  generatePredictions,
  clearAiCache,
  getHouseholdRecommendationHistory
} from "../controllers/recommendationController.js";

const router = express.Router();

// ================= AI (Gemini) =================
router.post("/households/:householdId/ai/energy-tips",     protect, generateEnergyTips);
router.post("/households/:householdId/ai/cost-strategies",  protect, generateCostStrategies);
router.post("/households/:householdId/ai/predictions",      protect, generatePredictions);
router.delete("/households/:householdId/ai/cache",          protect, clearAiCache);

// History
router.get("/households/:householdId/history", protect, getHouseholdRecommendationHistory);

export default router;