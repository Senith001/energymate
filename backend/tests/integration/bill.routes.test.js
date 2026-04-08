import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import Tariff from "../../src/models/tarif.js";
import { clearTestDb, connectTestDb, disconnectTestDb, getTestDbUri } from "../setup/testDb.js";
import { createAuthHeader, createTestHousehold, createTestUser } from "../setup/testHelpers.js";
import { startTestServer, stopTestServer } from "../setup/testServer.js";

describe("bill routes", () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    // Run the real backend on a dedicated test port so bill endpoints are exercised end-to-end.
    process.env.JWT_SECRET = "test-secret";
    await connectTestDb();
    const testServer = await startTestServer({
      mongoUri: getTestDbUri(),
      port: 5056,
    });
    server = testServer.child;
    baseUrl = testServer.baseUrl;
  }, 120000);

  afterEach(async () => {
    // Reset the test database after each case to avoid cross-test bill/tariff leakage.
    await clearTestDb();
  });

  afterAll(async () => {
    await stopTestServer(server);
    await disconnectTestDb();
  });

  it("rejects bill creation without an auth token", async () => {
    // Protected billing endpoints should reject requests that do not include a valid Bearer token.
    const response = await fetch(`${baseUrl}/api/bills`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        householdId: new mongoose.Types.ObjectId().toString(),
        month: 3,
        year: 2026,
        totalUnits: 40,
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(401);
    expect(body.message).toBe("Not authorized");
  });

  it("returns validation errors for an invalid bill payload", async () => {
    // Invalid bill input should fail validation before any bill is created.
    const user = await createTestUser();

    const response = await fetch(`${baseUrl}/api/bills`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader(user._id),
      },
      body: JSON.stringify({
        householdId: new mongoose.Types.ObjectId().toString(),
        month: 13,
        year: 2026,
        totalUnits: -5,
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined();
  });

  it("creates a valid bill and returns it in household bill history", async () => {
    // This covers both creation and the follow-up history read for the same household.
    const user = await createTestUser();
    const household = await createTestHousehold(user._id);

    const createResponse = await fetch(`${baseUrl}/api/bills`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader(user._id),
      },
      body: JSON.stringify({
        householdId: household._id.toString(),
        month: 3,
        year: 2026,
        totalUnits: 45,
      }),
    });
    const createdBill = await createResponse.json();

    expect(createResponse.status).toBe(201);
    expect(createdBill.success).toBe(true);
    expect(createdBill.message).toBe("Bill created");
    expect(createdBill.data.totalUnits).toBe(45);

    const listResponse = await fetch(
      `${baseUrl}/api/bills/households/${household._id.toString()}`,
      {
        headers: {
          Authorization: createAuthHeader(user._id),
        },
      }
    );
    const billList = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(billList.success).toBe(true);
    expect(Array.isArray(billList.data)).toBe(true);
    expect(billList.data).toHaveLength(1);
    expect(billList.data[0].month).toBe(3);
    expect(billList.data[0].year).toBe(2026);
  });

  it("compares the selected bill against the previous month", async () => {
    // Seed two months, then verify the comparison endpoint returns both current and previous values.
    const user = await createTestUser();
    const household = await createTestHousehold(user._id);
    const authHeader = createAuthHeader(user._id);

    const febResponse = await fetch(`${baseUrl}/api/bills`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        householdId: household._id.toString(),
        month: 2,
        year: 2026,
        totalUnits: 20,
      }),
    });
    const febBill = await febResponse.json();

    const marResponse = await fetch(`${baseUrl}/api/bills`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        householdId: household._id.toString(),
        month: 3,
        year: 2026,
        totalUnits: 45,
      }),
    });
    const marBill = await marResponse.json();

    const compareResponse = await fetch(
      `${baseUrl}/api/bills/households/${household._id.toString()}/compare?month=3&year=2026`,
      {
        headers: {
          Authorization: authHeader,
        },
      }
    );
    const comparison = await compareResponse.json();

    expect(febResponse.status).toBe(201);
    expect(marResponse.status).toBe(201);
    expect(compareResponse.status).toBe(200);
    expect(comparison.success).toBe(true);
    expect(comparison.data.current.month).toBe(3);
    expect(comparison.data.previous.month).toBe(2);
    expect(comparison.data.current.totalCost).toBe(marBill.data.totalCost);
    expect(comparison.data.previous.totalCost).toBe(febBill.data.totalCost);
    expect(comparison.data.difference.costChangePercent).not.toBeNull();
  });

  it("uses the tariff stored in the database when creating a bill", async () => {
    // Integration proof that bill creation reads tariff values from MongoDB, not only hardcoded test data.
    const user = await createTestUser();
    const household = await createTestHousehold(user._id);

    await Tariff.create({
      name: "domestic",
      tariffLow: [
        { upTo: 30, rate: 10, fixedCharge: 50 },
        { upTo: 60, rate: 20, fixedCharge: 100 },
      ],
      tariffHigh: [
        { upTo: 60, rate: 30, fixedCharge: 0 },
        { upTo: 90, rate: 40, fixedCharge: 150 },
        { upTo: 120, rate: 50, fixedCharge: 250 },
        { upTo: 180, rate: 60, fixedCharge: 350 },
        { upTo: null, rate: 70, fixedCharge: 450 },
      ],
      ssclRate: 0.1,
    });

    const response = await fetch(`${baseUrl}/api/bills`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader(user._id),
      },
      body: JSON.stringify({
        householdId: household._id.toString(),
        month: 4,
        year: 2026,
        totalUnits: 20,
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.data.energyCharge).toBe(200);
    expect(body.data.fixedCharge).toBe(50);
    expect(body.data.subTotal).toBe(250);
    expect(body.data.sscl).toBe(25);
    expect(body.data.totalCost).toBe(275);
  });

  it("regenerates a bill after usage changes for the same billing period", async () => {
    // Regeneration should recalculate the existing bill from the latest saved usage entries.
    const user = await createTestUser();
    const household = await createTestHousehold(user._id);
    const authHeader = createAuthHeader(user._id);

    await fetch(`${baseUrl}/api/usage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        householdId: household._id.toString(),
        date: "2026-04-11",
        entryType: "manual",
        unitsUsed: 10,
      }),
    });

    const generateResponse = await fetch(
      `${baseUrl}/api/bills/households/${household._id.toString()}/generate?month=4&year=2026`,
      {
        method: "POST",
        headers: {
          Authorization: authHeader,
        },
      }
    );
    const generatedBill = await generateResponse.json();

    await fetch(`${baseUrl}/api/usage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: authHeader,
      },
      body: JSON.stringify({
        householdId: household._id.toString(),
        date: "2026-04-12",
        entryType: "manual",
        unitsUsed: 15,
      }),
    });

    const regenerateResponse = await fetch(
      `${baseUrl}/api/bills/${generatedBill.data._id}/regenerate`,
      {
        method: "PUT",
        headers: {
          Authorization: authHeader,
        },
      }
    );
    const regeneratedBill = await regenerateResponse.json();

    expect(generateResponse.status).toBe(201);
    expect(regenerateResponse.status).toBe(200);
    expect(regeneratedBill.success).toBe(true);
    expect(regeneratedBill.message).toBe("Bill regenerated");
    expect(regeneratedBill.data.totalUnits).toBe(25);
    expect(regeneratedBill.data.totalCost).toBeGreaterThan(generatedBill.data.totalCost);
  });
});
