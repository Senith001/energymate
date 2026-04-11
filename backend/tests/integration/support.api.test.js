import { describe, test, expect } from "vitest";
import request from "supertest";
import app from "../../src/server.js";

describe("Support API", () => {
  test("GET support route should respond", async () => {
    const response = await request(app).get("/api/support");

    expect(response.status).toBeDefined();
  });

  test("POST support route should handle invalid input", async () => {
    const response = await request(app)
      .post("/api/support")
      .send({});

    expect(response.status).toBeGreaterThanOrEqual(400);
  });
});