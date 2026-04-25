// src/services/geminiService.js
// ─── Powered by Groq API (Free, Fast, No credit card needed) ───
// Drop-in replacement — all existing imports/exports unchanged.

import "dotenv/config";
import Groq from "groq-sdk";
import { getTariff } from "./tarifService.js";
import { calculateCost } from "./usageService.js";

/* ═══════════════════════════════════════════════════════╗
   CONFIG
╚══════════════════════════════════════════════════════ */
const apiKey = process.env.GROQ_API_KEY;
if (!apiKey) throw new Error("GROQ_API_KEY is not set in environment");

// Free Groq models — llama-3.3-70b is best for JSON tasks
const MODEL = process.env.GROQ_MODEL || "llama-3.3-70b-versatile";
const client = new Groq({ apiKey });

/* ═══════════════════════════════════════════════════════╗
   CORE
╚══════════════════════════════════════════════════════ */
function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function stripFences(text) {
  return (text || "")
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .replace(/^`+|`+$/g, "")
    .trim();
}

function partialJsonRecovery(raw) {
  try { return JSON.parse(raw); } catch (_) { }

  const arrMatch = raw.match(/\[[\s\S]*\]/);
  if (arrMatch) { try { return JSON.parse(arrMatch[0]); } catch (_) { } }

  const objMatch = raw.match(/\{[\s\S]*\}/);
  if (objMatch) { try { return JSON.parse(objMatch[0]); } catch (_) { } }

  const objects = [];
  let depth = 0, inStr = false, escape = false, start = -1;
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i];
    if (escape) { escape = false; continue; }
    if (ch === "\\" && inStr) { escape = true; continue; }
    if (ch === '"') { inStr = !inStr; continue; }
    if (inStr) continue;
    if (ch === "{") { if (depth === 0) start = i; depth++; }
    else if (ch === "}") {
      depth--;
      if (depth === 0 && start !== -1) {
        try { objects.push(JSON.parse(raw.slice(start, i + 1))); } catch (_) { }
        start = -1;
      }
    }
  }
  return objects.length > 0 ? objects : null;
}

async function generateJSON(prompt, { maxTokens = 3000, temperature = 0.3, retries = 3 } = {}) {
  let lastErr;

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const completion = await client.chat.completions.create({
        model: MODEL,
        max_tokens: maxTokens,
        temperature: attempt === retries ? 0 : temperature,
        response_format: { type: "json_object" }, // Groq native JSON mode
        messages: [
          {
            role: "system",
            content:
              "You are a precise JSON generator for an energy management app in Sri Lanka. " +
              "Return ONLY valid JSON — no markdown, no explanation, no extra text. " +
              "Your response must be directly parseable by JSON.parse().",
          },
          { role: "user", content: prompt },
        ],
      });

      const raw = stripFences(completion.choices?.[0]?.message?.content?.trim() || "");
      console.log(`✅ Groq JSON (attempt ${attempt}):\n`, raw.slice(0, 400));

      if (!raw) throw new Error("Groq returned empty response");

      let parsed;
      try {
        parsed = JSON.parse(raw);
      } catch (parseErr) {
        parsed = partialJsonRecovery(raw);
        if (!parsed) {
          console.error("Unparseable response:\n", raw.slice(0, 600));
          throw parseErr;
        }
        console.warn(`⚠️  Partial recovery: ${Array.isArray(parsed) ? parsed.length : 1} item(s)`);
      }

      return parsed;
    } catch (err) {
      lastErr = err;
      const msg = String(err?.message || "");
      const status = err?.status || err?.statusCode || 0;
      console.warn(`⚠️  Groq attempt ${attempt} failed:`, msg.slice(0, 200));

      // 401 — bad API key
      if (status === 401 || msg.includes("401") || msg.includes("invalid_api_key")) {
        throw Object.assign(
          new Error("Groq API key invalid. Check GROQ_API_KEY in .env. Get a free key at https://console.groq.com"),
          { isAuthError: true }
        );
      }

      // 429 — rate limit
      if (status === 429 || msg.includes("429") || msg.includes("rate_limit") || msg.includes("Too Many")) {
        if (attempt === retries) throw Object.assign(err, { isQuotaError: true });
        const delay = 5000 * 2 ** (attempt - 1);
        console.log(`⏳ Rate limited. Waiting ${delay / 1000}s...`);
        await wait(delay);
        continue;
      }

      // 503 — model overloaded
      if (status === 503 || msg.includes("overloaded") || msg.includes("unavailable")) {
        if (attempt === retries) throw err;
        await wait(3000 * attempt);
        continue;
      }

      if (attempt < retries) await wait(800 * 2 ** (attempt - 1));
    }
  }

  throw lastErr || new Error("Groq AI request failed after all retries");
}

/* ═══════════════════════════════════════════════════════╗
   DATA HELPERS
╚══════════════════════════════════════════════════════ */
function buildSummary(billHistory = [], applianceUsage = []) {
  const sorted = [...billHistory].sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  );

  const last = sorted[sorted.length - 1] || null;
  const last3 = sorted.slice(-3);
  const last6 = sorted.slice(-6);

  const avg = (arr, key) =>
    arr.length > 0
      ? Math.round(arr.reduce((s, b) => s + (Number(b[key]) || 0), 0) / arr.length)
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
    avgLast3Months: { units: avg(last3, "totalUnits"), costLKR: avg(last3, "totalCost") },
    avgLast6Months: { units: avg(last6, "totalUnits"), costLKR: avg(last6, "totalCost") },
    allMonths: sorted.map((b) => ({
      period: `${b.year}-${String(b.month).padStart(2, "0")}`,
      units: b.totalUnits,
      costLKR: b.totalCost,
    })),
    appliances: (applianceUsage || []).slice(0, 10).map((a) => ({
      name: a?.name ?? "Unknown",
      category: a?.category ?? null,
      wattage: a?.wattage ?? null,
      quantity: a?.quantity ?? 1,
      hoursPerDay: a?.usedHoursPerDay ?? a?.defaultHoursPerDay ?? 0,
      efficiencyRating: a?.efficiencyRating ?? null,
    })),
  };
}

/* ═══════════════════════════════════════════════════════╗
   VALIDATORS
╚══════════════════════════════════════════════════════ */
function validateTip(t) {
  return (
    t &&
    typeof t.title === "string" && t.title.length > 0 &&
    typeof t.recommendation === "string" && t.recommendation.length > 0 &&
    ["High", "Medium", "Low"].includes(t.priority)
  );
}

function validateStrategy(s) {
  return (
    s &&
    typeof s.title === "string" && s.title.length > 0 &&
    typeof s.summary === "string" && s.summary.length > 0 &&
    Array.isArray(s.details) && s.details.length > 0
  );
}

function validatePrediction(p) {
  return (
    p &&
    typeof p.year === "number" &&
    typeof p.month === "number" &&
    typeof p.predictedConsumption === "number" &&
    p.predictedConsumption > 0
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
  const hasAppliances = summary.appliances.length > 0;

  const prompt = `You are an expert energy-saving advisor for Sri Lanka (LKR currency, Ceylon Electricity Board).

Household energy data:
${JSON.stringify(summary, null, 2)}

${hasAppliances
      ? `These SPECIFIC appliances are in this home: ${JSON.stringify(summary.appliances)}.
Every single tip MUST reference one of these exact appliances by name. Do NOT give generic tips.`
      : "No appliance data. Give actionable general energy-saving tips for Sri Lankan households."
    }

Return a JSON object with a "tips" array containing exactly 5 tip objects:
{
  "tips": [
    {
      "title": "action-oriented title under 55 chars",
      "problem": "specific waste issue under 90 chars",
      "recommendation": "specific action to take under 130 chars",
      "implementation": ["step 1 under 65 chars", "step 2 under 65 chars", "step 3 under 65 chars"],
      "expectedSavings": { "unitsPerMonth": 15, "costLKR": 450 },
      "priority": "High",
      "category": "appliances",
      "learnMore": "https://www.ceb.lk/energy-saving-tips/en"
    }
  ]
}

Rules:
- Exactly 5 unique tips sorted by priority: High first, then Medium, then Low
- expectedSavings must be realistic based on the billing data averages provided
- priority must be exactly: High, Medium, or Low
- category must be exactly: lighting, appliances, cooling, cooking, or general`;

  const result = await generateJSON(prompt, { maxTokens: 4000, temperature: 0.4 });

  // Groq JSON mode returns object — unwrap tips array
  const tips = Array.isArray(result) ? result
    : Array.isArray(result?.tips) ? result.tips
      : [];

  const valid = tips.filter(validateTip).slice(0, 5);

  if (valid.length === 0) throw new Error("AI returned no valid energy tips. Please try again.");
  if (valid.length < 3) throw new Error(`AI only returned ${valid.length} valid tip(s). Please try again.`);

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

  const prompt = `You are a senior energy cost reduction advisor for Sri Lanka (LKR, Ceylon Electricity Board).

Household data:
${JSON.stringify(summary, null, 2)}

${summary.appliances.length > 0
      ? `Target these specific appliances: ${JSON.stringify(summary.appliances)}. Do NOT give generic advice.`
      : "No appliance data. Give a general but highly actionable cost reduction strategy."
    }

Return a JSON object with this exact structure:
{
  "strategy": {
    "title": "action-oriented title under 45 chars",
    "summary": "core strategy in one sentence under 110 chars",
    "details": [
      "action step 1 under 55 chars",
      "action step 2 under 55 chars",
      "action step 3 under 55 chars",
      "action step 4 under 55 chars"
    ],
    "expectedSavings": { "unitsPerMonth": 20, "costLKR": 600 },
    "timeframe": "2-4 weeks",
    "difficulty": "Medium",
    "priority": "High",
    "learnMore": "https://www.ceb.lk/energy-saving-tips/en"
  }
}

Rules:
- details must have exactly 4 concrete action steps
- expectedSavings must be realistic based on billing averages
- difficulty: exactly Easy, Medium, or Hard
- priority: exactly High, Medium, or Low`;

  const result = await generateJSON(prompt, { maxTokens: 1500, temperature: 0.3 });

  // Unwrap nested strategy key if present
  const parsedObject = result?.strategy || (Array.isArray(result) ? result[0] : result);

  const strategy =
    validateStrategy(parsedObject) ? parsedObject :
      validateStrategy(parsedObject?.strategy) ? parsedObject.strategy :
        validateStrategy(parsedObject?.costStrategy) ? parsedObject.costStrategy :
          null;

  if (!strategy) {
    console.error("❌ Invalid strategy:", JSON.stringify(result, null, 2));
    throw new Error("AI returned an invalid cost strategy. Please try again.");
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

  const sorted = [...validBills].sort((a, b) =>
    a.year !== b.year ? a.year - b.year : a.month - b.month
  );

  const recent = sorted.slice(-12);
  const last = recent[recent.length - 1] || {};
  const baseYear = Number(last?.year) || new Date().getFullYear();
  const baseMonth = Number(last?.month) || new Date().getMonth() + 1;

  const last3 = recent.slice(-3)
    .map((b) => Number(b?.totalUnits ?? 0))
    .filter((n) => Number.isFinite(n) && n > 0);

  const avg3 = last3.length
    ? Math.round(last3.reduce((a, b) => a + b, 0) / last3.length)
    : Number(last?.totalUnits ?? 100);

  const minOk = Math.max(20, Math.round(avg3 * 0.35));
  const maxOk = Math.round(avg3 * 2.0);

  const nextMonths = [];
  for (let i = 1; i <= 12; i++) {
    let mm = baseMonth + i;
    let yy = baseYear;
    while (mm > 12) { mm -= 12; yy += 1; }
    nextMonths.push(`${yy}-${String(mm).padStart(2, "0")}`);
  }

  const historyForPrompt = recent.map((b) => ({
    period: `${b.year}-${String(b.month).padStart(2, "0")}`,
    units: b.totalUnits,
    costLKR: b.totalCost ?? null,
  }));

  const prompt = `You are a professional energy usage forecasting model for Sri Lanka.

Historical electricity consumption:
${JSON.stringify(historyForPrompt, null, 2)}

Generate a 12-month forecast for these months in order: ${nextMonths.join(", ")}
Each predicted value must be between ${minOk} and ${maxOk} kWh.

Return a JSON object:
{
  "predictionTable": [
    { "year": 2025, "month": 5, "predictedConsumption": 180 },
    { "year": 2025, "month": 6, "predictedConsumption": 165 }
  ],
  "insights": [
    { "title": "title under 45 chars", "description": "description under 130 chars" },
    { "title": "title under 45 chars", "description": "description under 130 chars" },
    { "title": "title under 45 chars", "description": "description under 130 chars" },
    { "title": "title under 45 chars", "description": "description under 130 chars" }
  ],
  "summary": "overall forecast narrative under 160 chars"
}

Rules:
- predictionTable must have EXACTLY 12 rows for the months listed, in order
- predictedConsumption must be between ${minOk} and ${maxOk} for every row
- Apply Sri Lankan seasonal patterns: higher usage March-May (hot season, more fans/AC)
- insights must have EXACTLY 4 entries, data-driven and specific to this household's data`;

  const result = await generateJSON(prompt, { maxTokens: 2500, temperature: 0.2 });

  let predictionTable = Array.isArray(result?.predictionTable) ? result.predictionTable : [];
  predictionTable = predictionTable
    .filter(validatePrediction)
    .map((p) => ({
      year: Number(p.year),
      month: Number(p.month),
      predictedConsumption: Math.min(maxOk, Math.max(minOk, Math.round(p.predictedConsumption))),
    }))
    .slice(0, 12);

  const valueMap = new Map(
    predictionTable.map((p) => [
      `${p.year}-${String(p.month).padStart(2, "0")}`,
      p.predictedConsumption,
    ])
  );

  const tariff = await getTariff();
  const finalTable = nextMonths.map((label) => {
    const [yy, mm] = label.split("-").map(Number);
    const v = valueMap.get(label) ?? avg3;
    const costInfo = calculateCost(v, tariff);
    return { year: yy, month: mm, predictedConsumption: v, predictedCostLKR: costInfo.totalCost };
  });

  const insights = Array.isArray(result?.insights)
    ? result.insights.filter((i) => i?.title && i?.description).slice(0, 4)
    : [];

  if (insights.length < 2) {
    throw new Error("AI did not return enough prediction insights. Please try again.");
  }

  return {
    predictionTable: finalTable,
    insights,
    summary: result?.summary || "12-month energy usage forecast based on your billing history.",
  };
}

/* ═══════════════════════════════════════════════════════╗
   CHATBOT
╚══════════════════════════════════════════════════════ */
export async function getChatbotResponse(query, userData) {
  const prompt = `You are a helpful energy advisor for EnergyMate, a Sri Lankan electricity management app.
Answer the user's question concisely using the data provided.
Return a JSON object: { "answer": "your answer here under 150 words" }

User data: ${JSON.stringify(userData || {})}
Question: ${String(query || "")}`;

  const result = await generateJSON(prompt, { maxTokens: 350, temperature: 0.4 });
  return (typeof result?.answer === "string" ? result.answer : String(result)).trim();
}