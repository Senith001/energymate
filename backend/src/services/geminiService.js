// src/services/geminiService.js
import "dotenv/config";
import { GoogleGenerativeAI } from "@google/generative-ai";

/* ═══════════════════════════════════════════════════════╗
   CONFIG
╚══════════════════════════════════════════════════════ */
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) throw new Error("GEMINI_API_KEY is not set in environment");

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";
const genAI = new GoogleGenerativeAI(apiKey);

/* ═══════════════════════════════════════════════════════╗
   CORE: low-level generate call
╚══════════════════════════════════════════════════════ */

function getModel() {
  return genAI.getGenerativeModel({ model: MODEL }, { apiVersion: "v1beta" });
}

function extractText(result) {
  try {
    const t = result?.response?.text?.();
    if (t?.trim()) return t.trim();
  } catch (_) { }
  const parts = result?.response?.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p?.text || "").join("").trim();
}

function stripFences(text) {
  return (text || "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
}

/** Exponential back-off — waits before a retry. */
function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/**
 * Attempts to recover a partial JSON array when Gemini truncates mid-string.
 * Scans for complete objects `{ ... }` and returns what it can parse.
 */
function partialJsonRecovery(raw) {
  try {
    return JSON.parse(raw);
  } catch (_) { }

  const objects = [];
  let depth = 0,
    inStr = false,
    escape = false,
    start = -1;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (escape) {
      escape = false;
      continue;
    }
    if (ch === "\\" && inStr) {
      escape = true;
      continue;
    }
    if (ch === '"') {
      inStr = !inStr;
      continue;
    }
    if (inStr) continue;
    if (ch === "{") {
      if (depth === 0) start = i;
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        try {
          const obj = JSON.parse(raw.slice(start, i + 1));
          objects.push(obj);
        } catch (_) { }
        start = -1;
      }
    }
  }
  return objects.length > 0 ? objects : null;
}

async function generateJSON(
  prompt,
  { maxOutputTokens = 2500, temperature = 0.3, retries = 3 } = {}
) {
  const model = getModel();
  let lastErr;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          responseMimeType: "application/json",
          maxOutputTokens,
          temperature: attempt === retries ? 0 : temperature,
        },
      });

      const raw = stripFences(extractText(result));
      console.log(`✅ Gemini JSON (attempt ${attempt}):\n`, raw.slice(0, 300));

      if (!raw) throw new Error("Gemini returned empty response");

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (parseErr) {
        parsed = partialJsonRecovery(raw);
        if (!parsed) throw parseErr;
        console.warn(
          `⚠️  Gemini attempt ${attempt}: partial recovery extracted ${Array.isArray(parsed) ? parsed.length : 1
          } item(s)`
        );
      }

      return parsed;
    } catch (err) {
      lastErr = err;
      const msg = String(err?.message || "");
      console.warn(`⚠️  Gemini attempt ${attempt} failed:`, msg.slice(0, 120));

      if (
        msg.includes("429") ||
        msg.includes("quota") ||
        msg.includes("Too Many Requests")
      ) {
        throw Object.assign(err, { isQuotaError: true });
      }

      if (attempt < retries) await wait(500 * 2 ** (attempt - 1));
    }
  }

  throw lastErr || new Error("Gemini AI request failed after all retries");
}

/* ═══════════════════════════════════════════════════════╗
   DATA HELPERS
╚══════════════════════════════════════════════════════ */
function buildSummary(billHistory = [], applianceUsage = []) {
  const sorted = [...billHistory].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  const last = sorted[sorted.length - 1] || null;
  const last3 = sorted.slice(-3);
  const last6 = sorted.slice(-6);

  const avg = (arr, key) =>
    arr.length > 0
      ? Math.round(
        arr.reduce((s, b) => s + (Number(b[key]) || 0), 0) / arr.length
      )
      : 0;

  let trend = "stable";
  if (last3.length >= 2) {
    const first = Number(last3[0]?.totalUnits || 0);
    const lstVal = Number(last3[last3.length - 1]?.totalUnits || 0);
    if (lstVal > first * 1.05) trend = "upward";
    else if (lstVal < first * 0.95) trend = "downward";
  }

  return {
    monthsOfHistory: sorted.length,
    trend,
    lastMonth: last
      ? {
        period: `${last.year}-${String(last.month).padStart(2, "0")}`,
        units: last.totalUnits,
        costLKR: last.totalCost,
      }
      : null,
    avgLast3Months: {
      units: avg(last3, "totalUnits"),
      costLKR: avg(last3, "totalCost"),
    },
    avgLast6Months: {
      units: avg(last6, "totalUnits"),
      costLKR: avg(last6, "totalCost"),
    },
    appliances: (applianceUsage || []).slice(0, 8).map((a) => ({
      name: a?.name ?? "Unknown",
      wattage: a?.wattage ?? null,
      quantity: a?.quantity ?? 1,
      hoursPerDay: a?.usedHoursPerDay ?? a?.defaultHoursPerDay ?? 0,
    })),
  };
}

/* ═══════════════════════════════════════════════════════╗
   VALIDATORS
╚══════════════════════════════════════════════════════ */
function validateTip(t) {
  return (
    t &&
    typeof t.title === "string" &&
    typeof t.recommendation === "string" &&
    ["High", "Medium", "Low"].includes(t.priority)
  );
}

// FIX: strengthened — also checks that details array exists and is non-empty
function validateStrategy(s) {
  return (
    s &&
    typeof s.title === "string" &&
    s.title.length > 0 &&
    typeof s.summary === "string" &&
    s.summary.length > 0 &&
    Array.isArray(s.details) &&
    s.details.length > 0
  );
}

function validatePrediction(p) {
  return (
    p &&
    typeof p.year === "number" &&
    typeof p.month === "number" &&
    typeof p.predictedConsumption === "number"
  );
}

/* ═══════════════════════════════════════════════════════╗
   ENERGY TIPS
╚══════════════════════════════════════════════════════ */
export async function getEnergyTipsFromGemini(billHistory, applianceUsage) {
  if (!Array.isArray(billHistory)) billHistory = [];
  if (!Array.isArray(applianceUsage)) applianceUsage = [];

  const validBills = billHistory.filter((b) => b.totalUnits > 0);

  if (validBills.length === 0 && applianceUsage.length === 0) {
    throw new Error(
      "No usage data available. Please add billing records with actual usage (> 0 units) or appliances first."
    );
  }

  const summary = buildSummary(validBills, applianceUsage);

  const prompt = `
You are an energy-saving advisor for Sri Lanka (LKR currency).
Return ONLY a JSON array of exactly 5 objects. No extra text.

Each object:
{
  "title": "<50 chars>",
  "problem": "<80 chars>",
  "recommendation": "<120 chars>",
  "implementation": ["step1 <60 chars>", "step2 <60 chars>", "step3 <60 chars>"],
  "expectedSavings": { "unitsPerMonth": <int>, "costLKR": <int> },
  "priority": "High"|"Medium"|"Low",
  "category": "lighting"|"appliances"|"cooling"|"cooking"|"general",
  "learnMore": "https://www.ceb.lk/energy-saving-tips/en"
}

Rules: 5 distinct tips, realistic savings, short field values (see char limits), no text outside the array.

Data: ${JSON.stringify(summary)}
`.trim();

  const result = await generateJSON(prompt, {
    maxOutputTokens: 2500,
    temperature: 0.3,
  });

  const tips = Array.isArray(result)
    ? result
    : Array.isArray(result?.tips)
      ? result.tips
      : [];

  const valid = tips.filter(validateTip).slice(0, 5);
  if (valid.length === 0) {
    throw new Error("Gemini returned no valid energy tips. Please try again.");
  }

  return valid;
}

/* ═══════════════════════════════════════════════════════╗
   COST STRATEGIES
╚══════════════════════════════════════════════════════ */
export async function getCostStrategiesFromGemini(billHistory, applianceUsage) {
  if (!Array.isArray(billHistory)) billHistory = [];
  if (!Array.isArray(applianceUsage)) applianceUsage = [];

  const validBills = billHistory.filter((b) => b.totalUnits > 0);

  if (validBills.length === 0 && applianceUsage.length === 0) {
    throw new Error(
      "No usage data available. Please add billing records with actual usage (> 0 units) or appliances first."
    );
  }

  const summary = buildSummary(validBills, applianceUsage);

  const prompt = `
You are an energy cost advisor for Sri Lanka (LKR).
Return ONLY a single JSON object. No extra text. Keep ALL string values very short.

{
  "title": "<40 chars",
  "summary": "<100 chars>",
  "details": ["<50 chars>", "<50 chars>", "<50 chars>"],
  "expectedSavings": { "unitsPerMonth": <int>, "costLKR": <int> },
  "timeframe": "<15 chars>",
  "difficulty": "Easy"|"Medium"|"Hard",
  "priority": "High"|"Medium"|"Low",
  "learnMore": "https://www.ceb.lk/energy-saving-tips/en"
}

Data: ${JSON.stringify(summary)}
`.trim();

  const result = await generateJSON(prompt, {
    maxOutputTokens: 2500,  // was 1200 — too low, causes truncation every time
    temperature: 0.3,
  });

  // FIX: unwrap array if Gemini accidentally wraps the object
  let parsedObject = Array.isArray(result) && result.length > 0
    ? result[0]
    : result;

  // FIX: validate the top-level object directly first, then check nested wrappers
  // Previously it only checked nested keys and always fell through to null
  const strategy = validateStrategy(parsedObject)
    ? parsedObject
    : validateStrategy(parsedObject?.strategy)
      ? parsedObject.strategy
      : validateStrategy(parsedObject?.costStrategy)
        ? parsedObject.costStrategy
        : null;

  if (!strategy) {
    console.error("❌ Invalid strategy object from Gemini:", JSON.stringify(parsedObject, null, 2));
    throw new Error("Gemini returned an invalid cost strategy. Please try again.");
  }

  return strategy;
}

/* ═══════════════════════════════════════════════════════╗
   PREDICTIONS
╚══════════════════════════════════════════════════════ */
export async function getPredictionFromGemini(billHistory) {
  if (!Array.isArray(billHistory)) billHistory = [];

  const validBills = billHistory.filter((b) => b.totalUnits > 0);

  if (validBills.length === 0) {
    throw new Error(
      "We need at least one month of actual electricity usage (> 0 units) to generate a realistic prediction."
    );
  }

  const sorted = [...validBills].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year;
    return a.month - b.month;
  });

  const recent = sorted.slice(-12);
  const last = recent[recent.length - 1] || {};
  const baseYear = Number(last?.year) || new Date().getFullYear();
  const baseMonth = Number(last?.month) || new Date().getMonth() + 1;
  const baseline = Number(last?.totalUnits ?? last?.consumption ?? 100);

  const last3 = recent
    .slice(-3)
    .map((b) => Number(b?.totalUnits ?? b?.consumption ?? 0))
    .filter((n) => Number.isFinite(n) && n > 0);
  const avg3 = last3.length
    ? Math.round(last3.reduce((a, b) => a + b, 0) / last3.length)
    : baseline;

  const minOk = Math.max(20, Math.round(avg3 * 0.4));
  const maxOk = Math.round(avg3 * 1.8);

  const nextMonths = [];
  for (let i = 1; i <= 12; i++) {
    let mm = baseMonth + i;
    let yy = baseYear;
    while (mm > 12) {
      mm -= 12;
      yy += 1;
    }
    nextMonths.push(`${yy}-${String(mm).padStart(2, "0")}`);
  }

  const prompt = `
You are an energy usage forecasting model.
Return ONLY a JSON object. No extra text.

{
  "predictionTable": [
    {"year":<int>,"month":<int>,"predictedConsumption":<int>}
    ... exactly 12 entries
  ],
  "insights": [
    {"title":"<40 chars>","description":"<120 chars>"}
    ... exactly 4 entries
  ],
  "summary": "<150 chars>"
}

Rules:
- Exactly 12 prediction rows for months: ${nextMonths.join(", ")}.
- predictedConsumption between ${minOk} and ${maxOk}.
- Keep all string values SHORT (see char limits above).

Bill history: ${JSON.stringify(
    recent.map((b) => ({
      p: `${b.year}-${String(b.month).padStart(2, "0")}`,
      u: b.totalUnits,
    }))
  )}
`.trim();

  const result = await generateJSON(prompt, {
    maxOutputTokens: 1800,
    temperature: 0.2,
  });

  let predictionTable = Array.isArray(result?.predictionTable)
    ? result.predictionTable
    : [];
  predictionTable = predictionTable
    .filter(validatePrediction)
    .map((p) => ({
      year: Number(p.year),
      month: Number(p.month),
      predictedConsumption: Math.min(
        maxOk,
        Math.max(minOk, Math.round(p.predictedConsumption))
      ),
    }))
    .slice(0, 12);

  const valueMap = new Map(
    predictionTable.map((p) => [
      `${p.year}-${String(p.month).padStart(2, "0")}`,
      p.predictedConsumption,
    ])
  );

  const finalTable = nextMonths.map((label) => {
    const [yy, mm] = label.split("-").map(Number);
    const v = valueMap.get(label);
    return { year: yy, month: mm, predictedConsumption: v ?? avg3 };
  });

  const insights = Array.isArray(result?.insights)
    ? result.insights
      .filter((i) => i?.title && i?.description)
      .slice(0, 4)
    : [];

  if (insights.length < 2) {
    throw new Error("Gemini failed to generate enough insights for the prediction.");
  }

  return {
    predictionTable: finalTable,
    insights,
    summary: result?.summary || "12-month energy usage forecast."
  };
}


/* ═══════════════════════════════════════════════════════╗
   CHATBOT
╚══════════════════════════════════════════════════════ */
export async function getChatbotResponse(query, userData) {
  const prompt = `
You are a helpful energy advisor for EnergyMate, a Sri Lankan electricity management app.
Answer the user's question concisely using the data provided.

Return ONLY a valid JSON object:
{ "answer": "your answer here (max 120 words)" }

User data: ${JSON.stringify(userData || {})}
Question: ${String(query || "")}
`.trim();

  const result = await generateJSON(prompt, {
    maxOutputTokens: 200,
    temperature: 0.4,
  });
  return (typeof result?.answer === "string" ? result.answer : String(result)).trim();
}