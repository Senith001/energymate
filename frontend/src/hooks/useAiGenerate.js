/**
 * useAiGenerate — production-ready hook for AI generation pages.
 *
 * Handles:
 * - API call + loading state
 * - Server 429 cooldown (parses retry-after from message)
 * - Client-side countdown timer (90s)
 * - generatedAt timestamp
 * - fromCache flag (shows "⚡ Instant from cache")
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useToast } from "../context/ToastContext";

const COOLDOWN_SECS = 90;

export function useAiGenerate(apiFn) {
  const toast = useToast();

  const [data,        setData]        = useState(null);
  const [loading,     setLoading]     = useState(false);
  const [error,       setError]       = useState(null);
  const [generated,   setGenerated]   = useState(false);
  const [generatedAt, setGeneratedAt] = useState(null);   // ISO string
  const [fromCache,   setFromCache]   = useState(false);
  const [cooldown,    setCooldown]    = useState(0);       // seconds remaining

  const timerRef = useRef(null);

  // ── Countdown ticker ────────────────────────────────────
  const startCooldown = useCallback((secs) => {
    setCooldown(secs);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  useEffect(() => () => clearInterval(timerRef.current), []);

  // ── Generate ─────────────────────────────────────────────
  const generate = useCallback(async (...args) => {
    if (loading || cooldown > 0) return;

    setLoading(true);
    setError(null);

    try {
      const { data: responseData } = await apiFn(...args);

      // Backend wraps in { success, data: { ... } }
      // Pull the payload out of whatever key exists
      const payload = responseData?.data || responseData;
      const ts      = responseData?.data?.generatedAt || responseData?.generatedAt;
      const cached  = responseData?.data?.fromCache   || responseData?.fromCache || false;

      setData(payload);
      setGenerated(true);
      setGeneratedAt(ts || new Date().toISOString());
      setFromCache(cached);

      if (cached) {
        toast.info("⚡ Loaded from cache — still fresh!");
      } else {
        startCooldown(COOLDOWN_SECS);
      }

      return payload;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Request failed.";
      setError(msg);

      // If server returned 429 (cooldown), parse remaining seconds
      if (err.response?.status === 429) {
        const match = msg.match(/(\d+)\s*seconds/);
        const secs  = match ? parseInt(match[1]) : COOLDOWN_SECS;
        startCooldown(secs);
        toast.error(`⏳ ${msg}`);
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  }, [apiFn, loading, cooldown, startCooldown, toast]);

  return {
    data,
    loading,
    error,
    generated,
    generatedAt,
    fromCache,
    cooldown,        // seconds remaining (0 = ready)
    generate,
    setData,
    setError,
  };
}
