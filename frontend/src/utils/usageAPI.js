const API_BASE = "http://localhost:5000/api";

// Get token from localStorage (adjust as needed)
const getToken = () => localStorage.getItem("token");

// Create headers with auth token
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// Create usage entry
export async function createUsage(data) {
  try {
    const res = await fetch(`${API_BASE}/usage`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err) {
    console.error("Error creating usage:", err);
    throw err;
  }
}

// Get a single usage record by id.
export async function getUsageById(id) {
  try {
    const res = await fetch(`${API_BASE}/usage/${id}`, {
      headers: authHeaders(),
    });
    return await res.json();
  } catch (err) {
    console.error("Error fetching usage by id:", err);
    throw err;
  }
}

// Get all usages (with optional household filter)
export async function getUsages(householdId = null) {
  try {
    const url = householdId
      ? `${API_BASE}/usage?householdId=${householdId}`
      : `${API_BASE}/usage`;
    const res = await fetch(url, {
      headers: authHeaders(),
    });
    return await res.json();
  } catch (err) {
    console.error("Error fetching usages:", err);
    throw err;
  }
}

// Update an existing usage entry.
export async function updateUsage(id, data) {
  try {
    const res = await fetch(`${API_BASE}/usage/${id}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (err) {
    console.error("Error updating usage:", err);
    throw err;
  }
}

// Delete an existing usage entry.
export async function deleteUsage(id) {
  try {
    const res = await fetch(`${API_BASE}/usage/${id}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return await res.json();
  } catch (err) {
    console.error("Error deleting usage:", err);
    throw err;
  }
}

// Get monthly summary
export async function getMonthlySummary(householdId, month, year) {
  try {
    const res = await fetch(
      `${API_BASE}/usage/households/${householdId}/monthly-summary?month=${month}&year=${year}`,
      {
        headers: authHeaders(),
      }
    );
    return await res.json();
  } catch (err) {
    console.error("Error fetching monthly summary:", err);
    throw err;
  }
}

// Get estimated cost
export async function getEstimatedCost(householdId, month, year) {
  try {
    const res = await fetch(
      `${API_BASE}/usage/households/${householdId}/estimate?month=${month}&year=${year}`,
      {
        headers: authHeaders(),
      }
    );
    return await res.json();
  } catch (err) {
    console.error("Error fetching estimated cost:", err);
    throw err;
  }
}

// Get usage by appliances
export async function getUsageByAppliances(householdId, month, year) {
  try {
    const res = await fetch(
      `${API_BASE}/usage/households/${householdId}/by-appliances?month=${month}&year=${year}`,
      {
        headers: authHeaders(),
      }
    );
    return await res.json();
  } catch (err) {
    console.error("Error fetching usage by appliances:", err);
    throw err;
  }
}

// Get usage by rooms
export async function getUsageByRooms(householdId, month, year) {
  try {
    const res = await fetch(
      `${API_BASE}/usage/households/${householdId}/by-rooms?month=${month}&year=${year}`,
      {
        headers: authHeaders(),
      }
    );
    return await res.json();
  } catch (err) {
    console.error("Error fetching usage by rooms:", err);
    throw err;
  }
}

// Get weather impact
export async function getWeatherImpact(householdId, month, year, city) {
  try {
    const res = await fetch(
      `${API_BASE}/usage/households/${householdId}/weather-impact?month=${month}&year=${year}&city=${city}`,
      {
        headers: authHeaders(),
      }
    );
    return await res.json();
  } catch (err) {
    console.error("Error fetching weather impact:", err);
    throw err;
  }
}
