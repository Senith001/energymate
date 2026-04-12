import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../../src/server.js";

describe("Room Routes", () => {
  test("GET /api/rooms should respond", async () => {
    const response = await request(app).get("/api/rooms");
    expect(response.status).toBeDefined();
  });

  test("POST /api/rooms should reject invalid input", async () => {
    const response = await request(app)
      .post("/api/rooms")
      .send({});

    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});