// src/controllers/recommendationController.js
import mongoose from "mongoose";
import rf from "../utils/responseFormatter.js";

import Household from "../models/Household.js";
import Bill from "../models/bill.js";
import Appliance from "../models/Appliance.js";
import Recommendation from "../models/Recommendation.js";

import {
  getEnergyTipsFromGemini,
  getCostStrategiesFromGemini,
  getPredictionFromGemini,
} from "../services/geminiService.js";

import {
  cacheGet,
  cacheSet,
  checkCooldown,
  setCooldown,
  cacheInvalidate,
} from "../utils/aiCache.js";

/* ═══════════════════════════════════════════════════════╗
   HELPERS
╚══════════════════════════════════════════════════════ */
function getUserId(req) {
  return req.user?._id || req.user?.id || null;
}

export async function verifyHouseholdOwnership(householdId, userId) {
  if (!mongoose.Types.ObjectId.isValid(householdId)) return null;
  const household = await Household.findById(householdId).lean();
  if (!household) return null;
  const ownerId = household.userId?.toString();
  const requesterId = userId?.toString();
  if (!ownerId || !requesterId || ownerId !== requesterId) return null;
  return household;
}

async function buildAiInputs(householdId) {
  const [bills, appliances] = await Promise.all([
    Bill.find({ householdId })
      .sort({ year: 1, month: 1 })
      .select("month year totalUnits totalCost previousReading currentReading")
      .lean(),
    Appliance.find({ householdId })
      .select("name wattage quantity defaultHoursPerDay category efficiencyRating")
      .lean(),
  ]);

  const billHistory = bills.map((b) => ({
    month: b.month, year: b.year,
    totalUnits: b.totalUnits, totalCost: b.totalCost,
    previousReading: b.previousReading ?? null,
    currentReading: b.currentReading ?? null,
  }));

  const applianceUsage = appliances.map((a) => ({
    name: a?.name ?? "Unknown",
    category: a?.category ?? null,
    wattage: typeof a?.wattage === "number" ? a.wattage : null,
    quantity: typeof a?.quantity === "number" ? a.quantity : 1,
    usedHoursPerDay: typeof a?.defaultHoursPerDay === "number" ? a.defaultHoursPerDay : 0,
    efficiencyRating: a?.efficiencyRating ?? null,
  }));

  return { billHistory, applianceUsage };
}

function handleAiError(res, err, context = "AI request") {
  const msg = String(err?.message || "Unknown error");
  console.error(`❌ ${context}:`, msg);

  if (err?.is403Error || msg.includes("403") || msg.includes("denied") || msg.includes("Forbidden")) {
    return rf.error(res, "AI service access denied. Check your API key in .env.", 503, msg);
  }
  if (err?.isQuotaError || msg.includes("429") || msg.includes("quota") || msg.includes("Too Many")) {
    return rf.error(res, "AI quota exceeded. Please wait a moment and try again.", 429, msg);
  }
  if (msg.includes("No usage data") || msg.includes("We need at least") || msg.includes("Please add billing")) {
    return rf.error(res, msg, 400);
  }
  if (msg.includes("invalid") || msg.includes("valid tips") || msg.includes("valid strategy") || msg.includes("insights")) {
    return rf.error(res, msg, 502, msg);
  }
  return rf.error(res, `${context} failed. Please try again.`, 502, msg);
}

function setCacheHeaders(res, cacheHit, ageMs = 0) {
  res.setHeader("X-Cache", cacheHit ? "HIT" : "MISS");
  res.setHeader("X-Cache-Age", cacheHit ? Math.round(ageMs / 1000) : 0);
  res.setHeader("X-Cache-TTL", "21600");
}

/* ═══════════════════════════════════════════════════════╗
   ENERGY TIPS
╚══════════════════════════════════════════════════════ */
export async function generateEnergyTips(req, res) {
  try {
    const { householdId } = req.params;
    const userId = getUserId(req);
    if (!userId) return rf.error(res, "Unauthorized", 401);

    const household = await verifyHouseholdOwnership(householdId, userId);
    if (!household) return rf.error(res, "Household not found or access denied", 403);

    const cached = cacheGet(householdId, "tips");
    if (cached) {
      setCacheHeaders(res, true, cached.ageMs);
      return rf.success(res,
        { tips: cached.data, generatedAt: new Date(cached.generatedAt).toISOString(), fromCache: true },
        "Energy tips fetched from cache"
      );
    }

    const cooldownCheck = checkCooldown(householdId, "tips");
    if (cooldownCheck) {
      return rf.error(res, `Please wait ${Math.ceil(cooldownCheck.retryAfterMs / 1000)}s before generating new tips.`, 429);
    }

    const { billHistory, applianceUsage } = await buildAiInputs(householdId);
    if (!billHistory.length) {
      return rf.error(res, "No billing records found. Please add your electricity bills first.", 400);
    }

    setCooldown(householdId, "tips");
    const tips = await getEnergyTipsFromGemini(billHistory, applianceUsage);

    // ── Save ALL fields to DB ─────────────────────────────
    await Recommendation.create({
      householdId,
      type: "tips",
      tips: tips.map((t) => ({
        title: t.title || "",
        description: t.recommendation || t.description || "",
        problem: t.problem || "",
        priority: t.priority || "Medium",
        category: t.category || "general",
        learnMore: t.learnMore || "",
        implementation: Array.isArray(t.implementation) ? t.implementation : [],
        expectedSavings: {
          unitsPerMonth: t.expectedSavings?.unitsPerMonth ?? null,
          costLKR: t.expectedSavings?.costLKR ?? null,
        },
      })),
      generatedBy: userId,
    });

    cacheSet(householdId, "tips", tips);
    setCacheHeaders(res, false);
    return rf.success(res,
      { tips, generatedAt: new Date().toISOString(), fromCache: false },
      "Energy tips generated successfully"
    );
  } catch (err) {
    return handleAiError(res, err, "Energy tips");
  }
}

/* ═══════════════════════════════════════════════════════╗
   COST STRATEGIES
╚══════════════════════════════════════════════════════ */
export async function generateCostStrategies(req, res) {
  try {
    const { householdId } = req.params;
    const userId = getUserId(req);
    if (!userId) return rf.error(res, "Unauthorized", 401);

    const household = await verifyHouseholdOwnership(householdId, userId);
    if (!household) return rf.error(res, "Household not found or access denied", 403);

    const cached = cacheGet(householdId, "strategies");
    if (cached) {
      setCacheHeaders(res, true, cached.ageMs);
      return rf.success(res,
        { strategy: cached.data, generatedAt: new Date(cached.generatedAt).toISOString(), fromCache: true },
        "Cost strategy fetched from cache"
      );
    }

    const cooldownCheck = checkCooldown(householdId, "strategies");
    if (cooldownCheck) {
      return rf.error(res, `Please wait ${Math.ceil(cooldownCheck.retryAfterMs / 1000)}s before generating a new strategy.`, 429);
    }

    const { billHistory, applianceUsage } = await buildAiInputs(householdId);
    if (!billHistory.length) {
      return rf.error(res, "No billing records found. Please add your electricity bills first.", 400);
    }

    setCooldown(householdId, "strategies");
    const strategy = await getCostStrategiesFromGemini(billHistory, applianceUsage);

    // ── Save ALL fields to DB ─────────────────────────────
    await Recommendation.create({
      householdId,
      type: "strategy",
      strategies: [{
        title: strategy.title || "",
        summary: strategy.summary || "",
        details: Array.isArray(strategy.details) ? strategy.details : [],
        difficulty: strategy.difficulty || "Medium",
        priority: strategy.priority || "Medium",
        timeframe: strategy.timeframe || "",
        learnMore: strategy.learnMore || "",
        expectedSavings: {
          unitsPerMonth: strategy.expectedSavings?.unitsPerMonth ?? null,
          costLKR: strategy.expectedSavings?.costLKR ?? null,
        },
      }],
      generatedBy: userId,
    });

    cacheSet(householdId, "strategies", strategy);
    setCacheHeaders(res, false);
    return rf.success(res,
      { strategy, generatedAt: new Date().toISOString(), fromCache: false },
      "Cost strategy generated successfully"
    );
  } catch (err) {
    return handleAiError(res, err, "Cost strategy");
  }
}

/* ═══════════════════════════════════════════════════════╗
   PREDICTIONS
╚══════════════════════════════════════════════════════ */
export async function generatePredictions(req, res) {
  try {
    const { householdId } = req.params;
    const userId = getUserId(req);
    if (!userId) return rf.error(res, "Unauthorized", 401);

    const household = await verifyHouseholdOwnership(householdId, userId);
    if (!household) return rf.error(res, "Household not found or access denied", 403);

    const cached = cacheGet(householdId, "predictions");
    if (cached) {
      setCacheHeaders(res, true, cached.ageMs);
      return rf.success(res,
        { prediction: cached.data, generatedAt: new Date(cached.generatedAt).toISOString(), fromCache: true },
        "Predictions fetched from cache"
      );
    }

    const cooldownCheck = checkCooldown(householdId, "predictions");
    if (cooldownCheck) {
      return rf.error(res, `Please wait ${Math.ceil(cooldownCheck.retryAfterMs / 1000)}s before generating new predictions.`, 429);
    }

    const bills = await Bill.find({ householdId })
      .sort({ year: 1, month: 1 })
      .select("month year totalUnits totalCost")
      .lean();

    if (!bills.length) {
      return rf.error(res, "No billing records found. Please add your electricity bills first.", 400);
    }

    const billHistory = bills.map((b) => ({
      month: b.month, year: b.year,
      totalUnits: b.totalUnits, totalCost: b.totalCost,
    }));

    setCooldown(householdId, "predictions");
    const prediction = await getPredictionFromGemini(billHistory);

    // ── Save ALL fields to DB including predictedCostLKR ──
    await Recommendation.create({
      householdId,
      type: "prediction",
      predictionTable: prediction.predictionTable.map((p) => ({
        month: `${p.year}-${String(p.month).padStart(2, "0")}`,
        predictedConsumption: p.predictedConsumption,
        predictedCostLKR: p.predictedCostLKR ?? null,  // ← now saved!
      })),
      predictionInsights: prediction.insights || [],
      predictionSummary: prediction.summary || "",
      generatedBy: userId,
    });

    cacheSet(householdId, "predictions", prediction);
    setCacheHeaders(res, false);
    return rf.success(res,
      { prediction, generatedAt: new Date().toISOString(), fromCache: false },
      "Predictions generated successfully"
    );
  } catch (err) {
    return handleAiError(res, err, "Predictions");
  }
}

/* ═══════════════════════════════════════════════════════╗
   CLEAR CACHE
╚══════════════════════════════════════════════════════ */
export async function clearAiCache(req, res) {
  try {
    const { householdId } = req.params;
    const userId = getUserId(req);
    if (!userId) return rf.error(res, "Unauthorized", 401);

    const household = await verifyHouseholdOwnership(householdId, userId);
    if (!household) return rf.error(res, "Household not found or access denied", 403);

    cacheInvalidate(householdId, "tips");
    cacheInvalidate(householdId, "strategies");
    cacheInvalidate(householdId, "predictions");

    return rf.success(res, null, "AI cache cleared. Next request will regenerate fresh results.");
  } catch (err) {
    return rf.error(res, "Server error", 500, err.message);
  }
}

/* ═══════════════════════════════════════════════════════╗
   HISTORY
╚══════════════════════════════════════════════════════ */
export async function getHouseholdRecommendationHistory(req, res) {
  try {
    const { householdId } = req.params;
    const { type } = req.query;
    const userId = getUserId(req);
    if (!userId) return rf.error(res, "Unauthorized", 401);

    const household = await verifyHouseholdOwnership(householdId, userId);
    if (!household) return rf.error(res, "Household not found or access denied", 403);

    const query = { householdId };
    if (type) query.type = type;

    const history = await Recommendation.find(query)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return rf.success(res, history, "Recommendation history fetched");
  } catch (err) {
    return rf.error(res, "Server error", 500, err.message);
  }
}