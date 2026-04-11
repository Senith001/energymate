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
    month: b.month,
    year: b.year,
    totalUnits: b.totalUnits,
    totalCost: b.totalCost,
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

/** Shared error handler for AI endpoints. */
function handleAiError(res, err, context = "AI request") {
  const msg = String(err?.message || "Unknown error");
  console.error(`❌ ${context}:`, msg);

  if (err?.isQuotaError || msg.includes("429") || msg.includes("quota") || msg.includes("Too Many Requests")) {
    return rf.error(res, "Gemini API quota exceeded. Please wait a moment and try again.", 429, msg);
  }
  if (msg.includes("No usage data") || msg.includes("Not enough") || msg.includes("We need at least one month")) {
    return rf.error(res, msg, 400);
  }
  return rf.error(res, `${context} failed. Please try again.`, 502, msg);
}

/** Sets cache headers so the frontend knows if the response is fresh or cached. */
function setCacheHeaders(res, cacheHit, ageMs = 0) {
  res.setHeader("X-Cache", cacheHit ? "HIT" : "MISS");
  res.setHeader("X-Cache-Age", cacheHit ? Math.round(ageMs / 1000) : 0);
  res.setHeader("X-Cache-TTL", "21600"); // 6 hours
}

/* ═══════════════════════════════════════════════════════╗
   AI ENDPOINTS — with cache + cooldown
╚══════════════════════════════════════════════════════ */

// POST /api/recommendations/households/:householdId/ai/tips
export async function generateEnergyTips(req, res) {
  try {
    const { householdId } = req.params;
    const userId = getUserId(req);
    if (!userId) return rf.error(res, "Unauthorized", 401);

    const household = await verifyHouseholdOwnership(householdId, userId);
    if (!household) return rf.error(res, "Household not found or access denied", 403);

    // ── Serve from cache ─────────────────────────────────
    const cached = cacheGet(householdId, "tips");
    if (cached) {
      setCacheHeaders(res, true, cached.ageMs);
      return rf.success(res, {
        tips: cached.data,
        generatedAt: new Date(cached.generatedAt).toISOString(),
        fromCache: true,
      }, "Energy tips fetched from cache");
    }

    // ── Cooldown check ────────────────────────────────────
    const cooldownCheck = checkCooldown(householdId, "tips");
    if (cooldownCheck) {
      return rf.error(
        res,
        `Please wait ${Math.ceil(cooldownCheck.retryAfterMs / 1000)} seconds before generating new tips.`,
        429
      );
    }

    // ── Build inputs ──────────────────────────────────────
    const { billHistory, applianceUsage } = await buildAiInputs(householdId);
    if (!billHistory.length) {
      return rf.error(res, "No billing records found. Please add your electricity bills first.", 400);
    }

    // ── Call Gemini ───────────────────────────────────────
    setCooldown(householdId, "tips");
    const tips = await getEnergyTipsFromGemini(billHistory, applianceUsage);
    
    // Save to history
    await Recommendation.create({
      householdId,
      type: "tips",
      tips: tips.map(t => ({
        title: t.title,
        description: t.recommendation, // Map AI recommendation field to model description
        learnMore: t.learnMore
      })),
      generatedBy: userId
    });

    cacheSet(householdId, "tips", tips);

    const now = new Date().toISOString();
    setCacheHeaders(res, false);
    return rf.success(res, { tips, generatedAt: now, fromCache: false }, "Energy tips generated and saved to history");

  } catch (err) {
    return handleAiError(res, err, "Energy tips");
  }
}

// POST /api/recommendations/households/:householdId/ai/strategies
export async function generateCostStrategies(req, res) {
  try {
    const { householdId } = req.params;
    const userId = getUserId(req);
    if (!userId) return rf.error(res, "Unauthorized", 401);

    const household = await verifyHouseholdOwnership(householdId, userId);
    if (!household) return rf.error(res, "Household not found or access denied", 403);

    // ── Serve from cache ─────────────────────────────────
    const cached = cacheGet(householdId, "strategies");
    if (cached) {
      setCacheHeaders(res, true, cached.ageMs);
      return rf.success(res, {
        strategy: cached.data,
        generatedAt: new Date(cached.generatedAt).toISOString(),
        fromCache: true,
      }, "Cost strategy fetched from cache");
    }

    // ── Cooldown check ────────────────────────────────────
    const cooldownCheck = checkCooldown(householdId, "strategies");
    if (cooldownCheck) {
      return rf.error(
        res,
        `Please wait ${Math.ceil(cooldownCheck.retryAfterMs / 1000)} seconds before generating a new strategy.`,
        429
      );
    }

    // ── Build inputs ──────────────────────────────────────
    const { billHistory, applianceUsage } = await buildAiInputs(householdId);
    if (!billHistory.length) {
      return rf.error(res, "No billing records found. Please add your electricity bills first.", 400);
    }

    // ── Call Gemini ───────────────────────────────────────
    setCooldown(householdId, "strategies");
    const strategy = await getCostStrategiesFromGemini(billHistory, applianceUsage);
    
    // Save to history
    await Recommendation.create({
      householdId,
      type: "strategy",
      strategies: [{
        title: strategy.title,
        summary: strategy.summary,
        details: strategy.details,
        problem: strategy.problem || "High consumption",
        strategy: strategy.summary,
        controls: strategy.details
      }],
      generatedBy: userId
    });

    cacheSet(householdId, "strategies", strategy);

    const now = new Date().toISOString();
    setCacheHeaders(res, false);
    return rf.success(res, { strategy, generatedAt: now, fromCache: false }, "Cost strategy generated and saved to history");

  } catch (err) {
    return handleAiError(res, err, "Cost strategy");
  }
}

// POST /api/recommendations/households/:householdId/ai/predictions
export async function generatePredictions(req, res) {
  try {
    const { householdId } = req.params;
    const userId = getUserId(req);
    if (!userId) return rf.error(res, "Unauthorized", 401);

    const household = await verifyHouseholdOwnership(householdId, userId);
    if (!household) return rf.error(res, "Household not found or access denied", 403);

    // ── Serve from cache ─────────────────────────────────
    const cached = cacheGet(householdId, "predictions");
    if (cached) {
      setCacheHeaders(res, true, cached.ageMs);
      return rf.success(res, {
        prediction: cached.data,
        generatedAt: new Date(cached.generatedAt).toISOString(),
        fromCache: true,
      }, "Predictions fetched from cache");
    }

    // ── Cooldown check ────────────────────────────────────
    const cooldownCheck = checkCooldown(householdId, "predictions");
    if (cooldownCheck) {
      return rf.error(
        res,
        `Please wait ${Math.ceil(cooldownCheck.retryAfterMs / 1000)} seconds before generating new predictions.`,
        429
      );
    }

    // ── Build inputs ──────────────────────────────────────
    const bills = await Bill.find({ householdId })
      .sort({ year: 1, month: 1 })
      .select("month year totalUnits totalCost")
      .lean();

    if (!bills.length) {
      return rf.error(res, "No billing records found. Please add your electricity bills first.", 400);
    }

    const billHistory = bills.map((b) => ({
      month: b.month,
      year: b.year,
      totalUnits: b.totalUnits,
      totalCost: b.totalCost,
    }));

    // ── Call Gemini ───────────────────────────────────────
    setCooldown(householdId, "predictions");
    const prediction = await getPredictionFromGemini(billHistory);
    
    // Save to history
    await Recommendation.create({
      householdId,
      type: "prediction",
      predictionTable: prediction.predictionTable.map(p => ({
        month: `${p.year}-${String(p.month).padStart(2, "0")}`,
        predictedConsumption: p.predictedConsumption
      })),
      predictionInsights: prediction.insights,
      generatedBy: userId
    });

    cacheSet(householdId, "predictions", prediction);

    const now = new Date().toISOString();
    setCacheHeaders(res, false);
    return rf.success(res, { prediction, generatedAt: now, fromCache: false }, "Predictions generated and saved to history");

  } catch (err) {
    return handleAiError(res, err, "Predictions");
  }
}

// DELETE /api/recommendations/households/:householdId/ai/cache
// Allows force-refresh by clearing the cache for this household
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

    return rf.success(res, null, "AI cache cleared. Next request will regenerate from Gemini.");
  } catch (err) {
    return rf.error(res, "Server error", 500, err.message);
  }
}

// GET /api/recommendations/households/:householdId/history
export async function getHouseholdRecommendationHistory(req, res) {
  try {
    const { householdId } = req.params;
    const { type } = req.query; // tips, strategy, or prediction
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