import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { clearTestDb, connectTestDb, disconnectTestDb, getTestDbUri } from "../setup/testDb.js";
import { startTestServer, stopTestServer } from "../setup/testServer.js";
import User from "../../src/models/User.js";

describe("user authentication routes", () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    process.env.JWT_SECRET = "test-secret";
    await connectTestDb();
    const testServer = await startTestServer({
      mongoUri: getTestDbUri(),
      port: 5057, 
    });
    server = testServer.child;
    baseUrl = testServer.baseUrl;
  }, 20000);

  afterEach(async () => {
    await clearTestDb();
  });

  afterAll(async () => {
    await stopTestServer(server);
    await disconnectTestDb();
  });

  // --- THE ACTUAL TESTS ---

  it("returns validation errors for an invalid registration payload", async () => {
    const response = await fetch(`${baseUrl}/api/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@test.com", 
        // Missing name, password, phone intentionally
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(400);
    expect(body.errors).toBeDefined(); // Express-validator attaches an "errors" array
  });

  it("creates a new user and returns a 201 status with OTP confirmation", async () => {
    const response = await fetch(`${baseUrl}/api/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "Senith Sandeepa",
        email: "senith@example.com",
        password: "Secure@Password123", 
        phone: "0771234567"
      }),
    });
    const body = await response.json();

    // Check the HTTP response
    expect(response.status).toBe(201);
    expect(body.message).toMatch(/OTP sent/i);
    expect(body.userId).toBeDefined();

    // Check that it was actually saved in the database
    const userInDb = await User.findOne({ email: "senith@example.com" });
    expect(userInDb).not.toBeNull();
    expect(userInDb.name).toBe("Senith Sandeepa");
    expect(userInDb.role).toBe("user");
    expect(userInDb.isVerified).toBe(false); 
  });

  it("rejects registration if the email is already verified in the system", async () => {
    // First, manually create a verified user in the database
    await User.create({
      name: "Existing User",
      email: "existing@example.com",
      password: "Hashed@Password123",
      phone: "0719876543",
      role: "user",
      isVerified: true 
    });

    // Attempt to register again with the same email
    const response = await fetch(`${baseUrl}/api/users/register`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: "New Name",
        email: "existing@example.com",
        password: "New@Password123",
        phone: "0771112222"
      }),
    });
    const body = await response.json();

    expect(response.status).toBe(409);
    expect(body.message).toBe("Email already registered");
  });

});