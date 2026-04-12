import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../../src/server.js";

describe("Feedback Routes", () => {
  test("GET /api/feedback should respond", async () => {
    const response = await request(app).get("/api/feedback");
    expect(response.status).toBeDefined();
  });

  test("POST /api/feedback should reject invalid input", async () => {
    const response = await request(app)
      .post("/api/feedback")
      .send({});

    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});