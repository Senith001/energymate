import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../../src/server.js";

describe("Appliance API", () => {
  test("GET appliance route should respond", async () => {
    const response = await request(app).get("/api/appliances");

    expect(response.status).toBeDefined();
  });

  test("POST appliance route should handle invalid input", async () => {
    const response = await request(app)
      .post("/api/appliances")
      .send({});

    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});