const API_BASE = "http://localhost:5001/api";

// Get token from localStorage (adjust as needed)
const getToken = () => localStorage.getItem("token");

// Create headers with auth token
const authHeaders = () => ({
  "Content-Type": "application/json",
  Authorization: `Bearer ${getToken()}`,
});

// Parse API responses consistently so frontend screens receive real errors on failed requests.
async function readJson(res) {
  const payload = await res.json();

  if (!res.ok) {
    throw new Error(payload.message || "Request failed.");
  }

  return payload;
}

// Create usage entry
export async function createUsage(data) {
  try {
    const res = await fetch(`${API_BASE}/usage`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return await readJson(res);
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
    return await readJson(res);
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
    return await readJson(res);
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
    return await readJson(res);
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
    return await readJson(res);
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
    return await readJson(res);
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
    return await readJson(res);
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
    return await readJson(res);
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
    return await readJson(res);
  } catch (err) {
    console.error("Error fetching usage by rooms:", err);
    throw err;
  }
}

// Get weather impact
export async function getWeatherImpact(householdId, month, year, location = {}) {
  try {
    // Keep the weather query flexible so the page can send either a city fallback or browser coordinates.
    const params = new URLSearchParams({
      month: String(month),
      year: String(year),
    });

    if (location.city) {
      params.set("city", location.city);
    }

    if (location.lat != null && location.lon != null) {
      params.set("lat", String(location.lat));
      params.set("lon", String(location.lon));
    }

    const res = await fetch(
      `${API_BASE}/usage/households/${householdId}/weather-impact?${params.toString()}`,
      {
        headers: authHeaders(),
      }
    );
    return await readJson(res);
  } catch (err) {
    console.error("Error fetching weather impact:", err);
    throw err;
  }
}

// Temporary household fetch kept here so usage can fall back to the saved household city.
export async function getHouseholdDetails(householdId) {
  try {
    const res = await fetch(`${API_BASE}/households/${householdId}`, {
      headers: authHeaders(),
    });
    return await readJson(res);
  } catch (err) {
    console.error("Error fetching household details:", err);
    throw err;
  }
}

// Read appliance definitions from the existing household module so usage can log daily hours without copying their pages.
export async function getHouseholdAppliances(householdId) {
  try {
    const res = await fetch(`${API_BASE}/households/${householdId}/appliances`, {
      headers: authHeaders(),
    });
    return await readJson(res);
  } catch (err) {
    console.error("Error fetching household appliances:", err);
    throw err;
  }
}

// Daily appliance-hour logs stay under usage so they can feed monthly analytics without changing appliance CRUD.
export async function createApplianceHoursLog(householdId, data) {
  try {
    const res = await fetch(`${API_BASE}/usage/households/${householdId}/appliance-hours`, {
      method: "POST",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return await readJson(res);
  } catch (err) {
    console.error("Error creating appliance usage log:", err);
    throw err;
  }
}

export async function getApplianceHoursLogs(householdId, month, year) {
  try {
    const params = new URLSearchParams();

    if (month != null && year != null) {
      params.set("month", String(month));
      params.set("year", String(year));
    }

    const suffix = params.toString() ? `?${params.toString()}` : "";
    const res = await fetch(`${API_BASE}/usage/households/${householdId}/appliance-hours${suffix}`, {
      headers: authHeaders(),
    });
    return await readJson(res);
  } catch (err) {
    console.error("Error fetching appliance usage logs:", err);
    throw err;
  }
}

// Keep edit/delete helpers next to create/list so the usage page can manage the full log flow from one dialog.
export async function updateApplianceHoursLog(householdId, logId, data) {
  try {
    const res = await fetch(`${API_BASE}/usage/households/${householdId}/appliance-hours/${logId}`, {
      method: "PATCH",
      headers: authHeaders(),
      body: JSON.stringify(data),
    });
    return await readJson(res);
  } catch (err) {
    console.error("Error updating appliance usage log:", err);
    throw err;
  }
}

export async function deleteApplianceHoursLog(householdId, logId) {
  try {
    const res = await fetch(`${API_BASE}/usage/households/${householdId}/appliance-hours/${logId}`, {
      method: "DELETE",
      headers: authHeaders(),
    });
    return await readJson(res);
  } catch (err) {
    console.error("Error deleting appliance usage log:", err);
    throw err;
  }
}
