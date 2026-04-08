import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

/**
 * Fetches the current user's household and returns its MongoDB _id.
 *
 * GET /api/households returns a plain JSON array directly:
 *   [ { _id: "...", userId: "...", name: "...", ... } ]
 *
 * No wrapper key — axios puts it straight in `response.data`.
 */
export function useHousehold() {
  const [householdId, setHouseholdId] = useState(null);
  const [household, setHousehold] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHousehold = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get("/households");

      // The controller does: res.json(households) — plain array
      // But handle all reasonable shapes defensively:
      let h = null;

      if (Array.isArray(data) && data.length > 0) {
        h = data[0];
      } else if (Array.isArray(data?.data) && data.data.length > 0) {
        h = data.data[0];
      } else if (data?._id) {
        // Single object
        h = data;
      }

      if (h?._id) {
        setHousehold(h);
        setHouseholdId(h._id);
      } else {
        setError("No household found. Please create a household first.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Could not load your household. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchHousehold();
  }, [fetchHousehold]);

  return { householdId, household, loading, error, refetch: fetchHousehold };
}
