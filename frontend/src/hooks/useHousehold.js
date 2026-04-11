import { useState, useEffect, useCallback } from "react";
import api from "../services/api";

/**
 * Hook to get the currently active household.
 * Synchronizes with the team member's implementation which saves the ID to localStorage.
 */
export function useHousehold() {
  const [householdId, setHouseholdId] = useState(localStorage.getItem("selectedHouseholdId"));
  const [household, setHousehold] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchHouseholdDetails = useCallback(async (id) => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const { data } = await api.get(`/households/${id}`);
      setHousehold(data);
    } catch (err) {
      console.error("Failed to fetch household details:", err);
      setError("Active household details could not be loaded.");
    } finally {
      setLoading(false);
    }
  }, []);

  // Sync with localStorage on mount and when changes occur in other tabs/components
  useEffect(() => {
    const syncHousehold = () => {
      const id = localStorage.getItem("selectedHouseholdId") || localStorage.getItem("activeHouseholdId");
      if (id !== householdId) {
        setHouseholdId(id);
      }
    };

    // Initial sync
    syncHousehold();

    // Listen for storage events (works across tabs)
    window.addEventListener("storage", syncHousehold);
    
    // Polling as a fallback for same-tab changes if no global event emitter is present
    const interval = setInterval(syncHousehold, 1000);

    return () => {
      window.removeEventListener("storage", syncHousehold);
      clearInterval(interval);
    };
  }, [householdId]);

  // When ID changes, fetch full details
  useEffect(() => {
    if (householdId) {
      fetchHouseholdDetails(householdId);
    } else {
      setHousehold(null);
    }
  }, [householdId, fetchHouseholdDetails]);

  return { 
    householdId, 
    household, 
    loading, 
    error, 
    refetch: () => fetchHouseholdDetails(householdId) 
  };
}
