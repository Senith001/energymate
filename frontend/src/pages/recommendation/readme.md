# EnergyMate — Recommendation Module

## Overview

The **Recommendation Module** is a core feature of the EnergyMate web application. It helps users understand their electricity usage, receive personalized advice, and make data-driven decisions to reduce energy costs.

The module consists of two main layers:

1. **Admin-managed manual templates** — expert-written recommendations categorised and curated by administrators
2. **Gemini AI engine** — an automated, data-driven layer that generates personalised insights by analysing each household's real usage data

---

## Architecture

```
frontend/src/pages/recommendation/
├── AdminTemplates.jsx        ← Admin CRUD: create / edit / toggle templates
├── UserRecommendations.jsx   ← User dashboard: browse & apply templates
├── EnergyTips.jsx            ← AI: personalised energy-saving tips
├── CostStrategies.jsx        ← AI: bill reduction strategies
└── Predictions.jsx           ← AI: 12-month usage forecast

frontend/src/hooks/
├── useHousehold.js           ← Fetches the user's household _id
└── useAiGenerate.js          ← Shared AI state: loading, cooldown, cache, timestamp

backend/src/
├── services/geminiService.js           ← Gemini API integration (JSON mode)
├── controllers/recommendationController.js  ← REST handlers + cache + cooldowns
├── routes/recommendationRoutes.js      ← Express routes
├── models/RecommendationTemplate.js    ← Admin template schema
├── models/RecommendationStatus.js      ← Per-household applied/dismissed status
└── utils/aiCache.js                    ← In-memory 6-hour TTL cache
```

---

## API Endpoints

### AI (Gemini)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/recommendations/households/:householdId/ai/energy-tips` | Generate personalised energy-saving tips |
| `POST` | `/api/recommendations/households/:householdId/ai/cost-strategies` | Generate cost reduction strategy |
| `POST` | `/api/recommendations/households/:householdId/ai/predictions` | Generate 12-month usage forecast |
| `DELETE` | `/api/recommendations/households/:householdId/ai/cache` | Invalidate cached AI responses |

### Admin Templates (admin role required)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/recommendations/admin/templates` | List all templates (filterable) |
| `POST` | `/api/recommendations/admin/templates` | Create a new template |
| `GET` | `/api/recommendations/admin/templates/:id` | Get template by ID |
| `PUT` | `/api/recommendations/admin/templates/:id` | Update template |
| `DELETE` | `/api/recommendations/admin/templates/:id` | Delete template |

### User Templates

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/recommendations/households/:householdId/templates` | List visible templates with applied status |
| `PATCH` | `/api/recommendations/households/:householdId/templates/:templateId/status` | Mark as `applied` / `dismissed` / `active` |

All endpoints require a valid **JWT Bearer token**.

---

## Gemini AI Engine

### How It Works

```
User clicks "Generate"
       │
       ▼
Check server-side TTL cache (6 hours)
       │  HIT → return instantly (X-Cache: HIT)
       │  MISS ↓
Check per-household cooldown (90 seconds)
       │  TOO SOON → return 429 with retryAfter
       │  OK ↓
Fetch bills + appliances from MongoDB
       │
       ▼
Build enriched household summary
  (trend, avg 3-month / 6-month units, appliance list)
       │
       ▼
Call Gemini (responseMimeType: "application/json")
  with explicit JSON schema in prompt
       │
       ▼
Validate + normalise JSON response
       │
       ▼
Cache result → Return to client
```

### Model Config

| Setting | Value |
|---------|-------|
| Model | `gemini-2.5-flash` (configurable via `GEMINI_MODEL` env var) |
| Output mode | `responseMimeType: "application/json"` |
| Retry strategy | 3 attempts with exponential back-off (500ms → 1s → 2s) |
| Max tokens | 1400 (tips) / 800 (strategies) / 1000 (predictions) |

---

## Feature: Energy Tips (`EnergyTips.jsx`)

Gemini analyses the household's billing history (trend, monthly averages) and appliance usage to produce **5 personalised energy-saving tips**.

**Each tip contains:**
- `title` — short descriptive name
- `problem` — what electricity issue this addresses
- `recommendation` — clear user action
- `implementation` — step-by-step instructions (array)
- `expectedSavings.unitsPerMonth` — estimated kWh saved per month
- `expectedSavings.costLKR` — estimated LKR saved per month
- `priority` — `High` / `Medium` / `Low`
- `category` — `lighting` / `appliances` / `cooling` / `cooking` / `general`
- `learnMore` — external reference URL

**UI features:**
- Problem box (red) + Recommendation box (green)
- Numbered implementation steps
- Priority badge with colour coding
- kWh and LKR savings badges
- 90-second cooldown timer on the generate button
- "Last generated X minutes ago" timestamp
- "⚡ Cached" badge when served from cache

---

## Feature: Cost Strategies (`CostStrategies.jsx`)

Gemini produces a **single detailed cost-reduction strategy** tailored to the household's spending patterns.

**The strategy contains:**
- `title` — strategy name
- `summary` — explanation paragraph
- `details` — array of 3–4 actionable steps
- `expectedSavings.unitsPerMonth` — kWh saved
- `expectedSavings.costLKR` — LKR saved
- `timeframe` — e.g. "1–2 months"
- `difficulty` — `Easy` / `Medium` / `Hard`

**UI features:**
- Summary box (indigo), numbered action steps
- Difficulty + timeframe badge
- "Quick Wins" sidebar with the top 3 steps
- Cooldown timer + timestamp + cache badge

---

## Feature: Usage Predictions (`Predictions.jsx`)

Gemini analyses the last 12 months of billing history and forecasts **the next 12 months of electricity consumption**.

**Response shape:**
```json
{
  "predictionTable": [
    { "year": 2025, "month": 5, "predictedConsumption": 142 },
    ...
  ],
  "insights": [
    { "title": "Usage Trend", "description": "..." },
    { "title": "Peak Month",  "description": "..." },
    { "title": "Best Month",  "description": "..." },
    { "title": "Action",      "description": "..." }
  ],
  "summary": "12-month forecast summary..."
}
```

**Safety:**  
All `predictedConsumption` values are server-side clamped to `[avg × 0.4, avg × 1.8]` to prevent unrealistic outliers.

**UI features:**
- Prediction table with month names (`Jan 2026`) and trend arrows
- Mini bar chart for visual trend
- Quick stats: average / peak / lowest month
- AI Insights panel (4 data-driven cards)
- Cooldown + timestamp + cache badge

---

## Feature: Manual Templates (`UserRecommendations.jsx` + `AdminTemplates.jsx`)

### Admin
- Create / edit / delete recommendation templates
- Categories: `lighting` / `appliances` / `cooling` / `cooking` / `general`
- Priority: `low` / `medium` / `high`
- Toggle visibility (`isActive`) without deleting

### User
- Browse all active templates with filtering by category and priority
- Mark recommendations as **Applied** ✅ or **Dismissed** ✗
- Status is persisted per household in `RecommendationStatus` collection
- Applied count shown as progress indicator

---

## Production Features

| Feature | Implementation |
|---------|---------------|
| **Response caching** | 6-hour in-memory TTL cache keyed by `householdId:endpoint` |
| **Rate limiting** | 90-second per-household cooldown per AI endpoint |
| **Cache headers** | `X-Cache: HIT\|MISS`, `X-Cache-Age`, `X-Cache-TTL` |
| **Force refresh** | `DELETE /ai/cache` clears all three cached responses |
| **Error handling** | Quota errors → 429, validation errors → 400, Gemini failures → 502 |
| **Retry logic** | 3 attempts with exponential back-off |
| **JSON mode** | `responseMimeType: "application/json"` guarantees parseable output |
| **Input validation** | Server-side JSON schema validation before returning to client |
| **Ownership check** | All household endpoints verify JWT matches household.userId |

---

## Environment Variables

```env
# Backend .env
GEMINI_API_KEY=your_google_gemini_api_key
GEMINI_MODEL=gemini-2.5-flash       # optional, defaults to gemini-2.5-flash
JWT_SECRET=your_jwt_secret
MONGODB_URI=your_mongodb_connection_string
```

---

## Data Models

### RecommendationTemplate
```js
{
  title:       String (required),
  description: String (required),
  category:    "lighting" | "appliances" | "cooling" | "cooking" | "general",
  priority:    "low" | "medium" | "high",
  tags:        [String],
  learnMoreUrl: String,
  isActive:    Boolean,
  timestamps:  true
}
```

### RecommendationStatus
```js
{
  householdId: ObjectId → Household,
  templateId:  ObjectId → RecommendationTemplate,
  status:      "active" | "applied" | "dismissed",
  unique index: (householdId, templateId)
}
```
