const API_BASE = "http://localhost:5000/api";

const getToken = () => localStorage.getItem("token");

async function requestJson(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${getToken()}`,
      ...(options.headers || {}),
    },
    ...options,
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload.message || "Request failed");
  }

  return payload;
}

export async function getBills(householdId) {
  return requestJson(`/bills/households/${householdId}`);
}

// Get one bill record by id.
export async function getBillById(id) {
  return requestJson(`/bills/${id}`);
}

export async function getBillComparison(householdId, month, year) {
  return requestJson(`/bills/households/${householdId}/compare?month=${month}&year=${year}`);
}

export async function createBill(data) {
  return requestJson("/bills", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function generateBill(householdId, month, year) {
  return requestJson(`/bills/households/${householdId}/generate?month=${month}&year=${year}`, {
    method: "POST",
  });
}

// Update a bill status such as marking it paid.
export async function updateBill(id, data) {
  return requestJson(`/bills/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

// Recalculate one existing bill from the latest usage data.
export async function regenerateBill(id) {
  return requestJson(`/bills/${id}/regenerate`, {
    method: "PUT",
  });
}
