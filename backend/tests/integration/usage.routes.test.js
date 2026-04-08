import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { clearTestDb, connectTestDb, disconnectTestDb, getTestDbUri } from "../setup/testDb.js";
import { createAuthHeader, createTestHousehold, createTestUser } from "../setup/testHelpers.js";
import { startTestServer, stopTestServer } from "../setup/testServer.js";

describe("usage routes", () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    // Boot the real backend against an isolated in-memory MongoDB instance.
    process.env.JWT_SECRET = "test-secret";
    await connectTestDb();
    const testServer = await startTestServer({
      mongoUri: getTestDbUri(),
      port: 5055,
    });
    server = testServer.child;
    baseUrl = testServer.baseUrl;
  }, 20000);

  afterEach(async () => {
    // Clear collections between tests so each route scenario starts from a known state.
    await clearTestDb();
  });

  afterAll(async () => {
    await stopTestServer(server);
    await disconnectTestDb();
  });

  it("returns the health check response", async () => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body).toEqual({ status: "✅ Server is running" });
  });

  it("returns validation errors for an invalid usage payload", async () => {
    // Invalid usage input should be blocked by validation before the controller creates a record.
    const user = await createTestUser();

    const response = await fetch(`${baseUrl}/api/usage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader(user._id),
      },
      body: JSON.stringify({
        householdId: new mongoose.Types.ObjectId().toString(),
        date: "2026-04-07",
        entryType: "manual",
        unitsUsed: -2,
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.message).toBe("Validation failed");
  });

  it("creates a valid manual usage entry for the user's household", async () => {
    // Successful flow: owned household + valid manual usage should create a record.
    const user = await createTestUser();
    const household = await createTestHousehold(user._id, {
      name: "Sanduni's Home",
    });

    const response = await fetch(`${baseUrl}/api/usage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader(user._id),
      },
      body: JSON.stringify({
        householdId: household._id.toString(),
        date: "2026-04-07",
        entryType: "manual",
        unitsUsed: 12,
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(201);
    expect(body.success).toBe(true);
    expect(body.message).toBe("Usage created");
    expect(body.data.unitsUsed).toBe(12);
    expect(body.data.entryType).toBe("manual");
  });

  it("deletes a usage entry that belongs to the signed-in user", async () => {
    // Create first, then verify the delete endpoint removes that same usage record.
    const user = await createTestUser();
    const household = await createTestHousehold(user._id);

    const createResponse = await fetch(`${baseUrl}/api/usage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader(user._id),
      },
      body: JSON.stringify({
        householdId: household._id.toString(),
        date: "2026-04-08",
        entryType: "manual",
        unitsUsed: 9,
      }),
    });
    const createdUsage = await createResponse.json();

    const deleteResponse = await fetch(
      `${baseUrl}/api/usage/${createdUsage.data._id}`,
      {
        method: "DELETE",
        headers: {
          Authorization: createAuthHeader(user._id),
        },
      }
    );
    const deletedUsage = await deleteResponse.json();

    expect(deleteResponse.status).toBe(200);
    expect(deletedUsage.success).toBe(true);
    expect(deletedUsage.message).toBe("Usage deleted");
    expect(deletedUsage.data._id).toBe(createdUsage.data._id);
  });

  it("returns usage history scoped to the signed-in user's selected household", async () => {
    // Listing usage with a household filter should only return entries for that owned household.
    const user = await createTestUser();
    const household = await createTestHousehold(user._id);

    await fetch(`${baseUrl}/api/usage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader(user._id),
      },
      body: JSON.stringify({
        householdId: household._id.toString(),
        date: "2026-04-09",
        entryType: "manual",
        unitsUsed: 7,
      }),
    });

    const listResponse = await fetch(
      `${baseUrl}/api/usage?householdId=${household._id.toString()}`,
      {
        headers: {
          Authorization: createAuthHeader(user._id),
        },
      }
    );
    const usageList = await listResponse.json();

    expect(listResponse.status).toBe(200);
    expect(usageList.success).toBe(true);
    expect(Array.isArray(usageList.data)).toBe(true);
    expect(usageList.data).toHaveLength(1);
    expect(usageList.data[0].householdId).toBe(household._id.toString());
    expect(usageList.data[0].unitsUsed).toBe(7);
  });

  it("updates a manual usage entry for the signed-in user", async () => {
    // Updating a manual entry should keep it manual while replacing the stored units value.
    const user = await createTestUser();
    const household = await createTestHousehold(user._id);

    const createResponse = await fetch(`${baseUrl}/api/usage`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: createAuthHeader(user._id),
      },
      body: JSON.stringify({
        householdId: household._id.toString(),
        date: "2026-04-10",
        entryType: "manual",
        unitsUsed: 11,
      }),
    });
    const createdUsage = await createResponse.json();

    const updateResponse = await fetch(
      `${baseUrl}/api/usage/${createdUsage.data._id}`,
      {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: createAuthHeader(user._id),
        },
        body: JSON.stringify({
          unitsUsed: 15,
        }),
      }
    );
    const updatedUsage = await updateResponse.json();

    expect(updateResponse.status).toBe(200);
    expect(updatedUsage.success).toBe(true);
    expect(updatedUsage.message).toBe("Usage updated");
    expect(updatedUsage.data.unitsUsed).toBe(15);
    expect(updatedUsage.data.entryType).toBe("manual");
  });
});
