import api from "./api";

// ─── Admin Template Endpoints ───────────────────────────────────────────────

export const getAdminTemplates = () =>
  api.get("/recommendations/admin/templates");

export const createAdminTemplate = (data) =>
  api.post("/recommendations/admin/templates", data);

export const updateAdminTemplate = (id, data) =>
  api.put(`/recommendations/admin/templates/${id}`, data);

export const deleteAdminTemplate = (id) =>
  api.delete(`/recommendations/admin/templates/${id}`);

// ─── User Recommendation Endpoints ──────────────────────────────────────────

export const getHouseholdRecommendations = (householdId) =>
  api.get(`/recommendations/households/${householdId}/templates`);

// ─── AI / Gemini Endpoints ──────────────────────────────────────────────────

export const generateEnergyTips = (householdId) =>
  api.post(`/recommendations/households/${householdId}/ai/energy-tips`);

export const generateCostStrategies = (householdId) =>
  api.post(`/recommendations/households/${householdId}/ai/cost-strategies`);

export const generatePredictions = (householdId) =>
  api.post(`/recommendations/households/${householdId}/ai/predictions`);
