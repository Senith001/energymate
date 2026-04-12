import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../../src/server.js";

describe("Support Routes", () => {
  test("GET /api/support should respond", async () => {
    const response = await request(app).get("/api/support");
    expect(response.status).toBeDefined();
  });

  test("POST /api/support should reject invalid input", async () => {
    const response = await request(app)
      .post("/api/support")
      .send({});

    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});