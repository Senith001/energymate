import { describe, test, expect } from "vitest";

describe("Feedback Service", () => {
  test("should create a valid feedback object", () => {
    const feedback = {
      message: "Great system",
      rating: 5,
      userId: "user123",
    };

    expect(feedback.message).toBe("Great system");
    expect(feedback.rating).toBe(5);
    expect(feedback.userId).toBe("user123");
  });

  test("should validate feedback rating range", () => {
    const feedback = { rating: 4 };
    expect(feedback.rating).toBeGreaterThanOrEqual(1);
    expect(feedback.rating).toBeLessThanOrEqual(5);
  });
});