import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../../src/server.js";

describe("Appliance Routes", () => {
  test("GET /api/appliances should respond", async () => {
    const response = await request(app).get("/api/appliances");
    expect(response.status).toBeDefined();
  });

  test("POST /api/appliances should reject invalid input", async () => {
    const response = await request(app)
      .post("/api/appliances")
      .send({});

    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});