import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { clearTestDb, connectTestDb, disconnectTestDb, getTestDbUri } from "../setup/testDb.js";
import { createAuthHeader, createTestHousehold, createTestUser } from "../setup/testHelpers.js";
import { startTestServer, stopTestServer } from "../setup/testServer.js";
import Bill from "../../src/models/bill.js";
import Recommendation from "../../src/models/Recommendation.js";

// Mock the AI service to keep integration tests deterministic and free
vi.mock("../../src/services/geminiService.js", () => ({
  getEnergyTipsFromGemini: vi.fn(async () => [
    { title: "Test Tip", recommendation: "Test Content", learnMore: "http://test" }
  ]),
  getPredictionFromGemini: vi.fn(async () => ({
    predictionTable: [{ year: 2026, month: 5, predictedConsumption: 120, predictedCostLKR: 5000 }],
    insights: [{ title: "Insight", description: "Desc" }],
    summary: "Summary"
  })),
  getCostStrategiesFromGemini: vi.fn(async () => ({
    title: "Test Strategy",
    summary: "Strategy Summary",
    details: ["Step 1"]
  }))
}));

describe("recommendation routes integration", () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    await connectTestDb();
    const testServer = await startTestServer({
      mongoUri: getTestDbUri(),
      port: 5058,
    });
    server = testServer.child;
    baseUrl = testServer.baseUrl;
  }, 120000);

  afterEach(async () => {
    await clearTestDb();
    vi.clearAllMocks();
  });

  afterAll(async () => {
    await stopTestServer(server);
    await disconnectTestDb();
  });

  it("should generate energy tips and save them to history", async () => {
    const user = await createTestUser();
    const household = await createTestHousehold(user._id);
    const authHeader = createAuthHeader(user._id);

    // AI requires at least one bill
    await Bill.create({
      householdId: household._id,
      month: 1,
      year: 2026,
      totalUnits: 100,
      totalCost: 2000
    });

    const response = await fetch(`${baseUrl}/api/recommendations/households/${household._id}/ai/energy-tips`, {
      method: "POST",
      headers: { Authorization: authHeader }
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.success).toBe(true);
    expect(body.data.tips).toBeDefined();

    // Verify it was saved to DB
    const savedRec = await Recommendation.findOne({ householdId: household._id, type: "tips" });
    expect(savedRec).not.toBeNull();
    expect(savedRec.tips[0].title).toBe("Test Tip");
  });

  it("should generate predictions with new LKR fields and save them", async () => {
      const user = await createTestUser();
      const household = await createTestHousehold(user._id);
      const authHeader = createAuthHeader(user._id);
  
      await Bill.create({
        householdId: household._id,
        month: 1,
        year: 2026,
        totalUnits: 100,
        totalCost: 2000
      });
  
      const response = await fetch(`${baseUrl}/api/recommendations/households/${household._id}/ai/predictions`, {
        method: "POST",
        headers: { Authorization: authHeader }
      });
      const body = await response.json();
  
      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
  
      // Verify db persistence
      const savedRec = await Recommendation.findOne({ householdId: household._id, type: "prediction" });
      expect(savedRec).not.toBeNull();
      // Year was added in model today
      expect(savedRec.predictionTable[0].predictedConsumption).toBe(120);
    });

  it("should return history for a household", async () => {
    const user = await createTestUser();
    const household = await createTestHousehold(user._id);
    const authHeader = createAuthHeader(user._id);

    await Recommendation.create({
      householdId: household._id,
      type: "tips",
      tips: [{ title: "Old Tip", description: "Content" }],
      generatedBy: user._id
    });

    const response = await fetch(`${baseUrl}/api/recommendations/households/${household._id}/history`, {
      headers: { Authorization: authHeader }
    });
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].tips[0].title).toBe("Old Tip");
  });
});
