import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../../src/server.js";

describe("Household API", () => {
  test("GET /api/households should respond", async () => {
    const response = await request(app).get("/api/households");

    expect(response.status).toBeDefined();
  });

  test("POST /api/households should handle invalid input", async () => {
    const response = await request(app)
      .post("/api/households")
      .send({});

    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});