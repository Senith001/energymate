/**
 * aiCache.js — Simple in-memory TTL cache for AI responses.
 *
 * Keyed by `${householdId}:${endpoint}` (e.g. "abc123:tips").
 * Entries expire after TTL milliseconds.
 *
 * Also provides per-household cooldown checking to prevent
 * hammering the Gemini API within a short grace period.
 */

const DEFAULT_TTL_MS  = 6 * 60 * 60 * 1000;   // 6 hours
const COOLDOWN_MS     = 90 * 1000;              // 90 seconds between calls

const cache    = new Map(); // key → { data, generatedAt }
const cooldown = new Map(); // key → lastCalledAt timestamp

// ── Cache helpers ────────────────────────────────────────

export function cacheGet(householdId, endpoint, ttlMs = DEFAULT_TTL_MS) {
  const key   = `${householdId}:${endpoint}`;
  const entry = cache.get(key);
  if (!entry) return null;

  const ageMs = Date.now() - entry.generatedAt;
  if (ageMs > ttlMs) {
    cache.delete(key);
    return null;
  }

  return { data: entry.data, ageMs, generatedAt: entry.generatedAt };
}

export function cacheSet(householdId, endpoint, data) {
  const key = `${householdId}:${endpoint}`;
  cache.set(key, { data, generatedAt: Date.now() });
}

export function cacheInvalidate(householdId, endpoint) {
  cache.delete(`${householdId}:${endpoint}`);
}

// ── Cooldown helpers ─────────────────────────────────────

/**
 * Returns null if OK to proceed, or { retryAfterMs } if still in cooldown.
 */
export function checkCooldown(householdId, endpoint) {
  const key      = `${householdId}:${endpoint}`;
  const lastCall = cooldown.get(key);
  if (!lastCall) return null;

  const elapsed      = Date.now() - lastCall;
  const retryAfterMs = COOLDOWN_MS - elapsed;
  if (retryAfterMs > 0) return { retryAfterMs };

  return null;
}

export function setCooldown(householdId, endpoint) {
  cooldown.set(`${householdId}:${endpoint}`, Date.now());
}
