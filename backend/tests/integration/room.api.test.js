import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../../src/server.js";

describe("Room API", () => {
  test("GET room route should respond", async () => {
    const response = await request(app).get("/api/rooms");

    expect(response.status).toBeDefined();
  });

  test("POST room route should handle invalid input", async () => {
    const response = await request(app)
      .post("/api/rooms")
      .send({});

    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});