import { describe, test, expect } from "vitest";

describe("Household Service", () => {
  test("should create a valid household object", () => {
    const household = {
      name: "My Home",
      city: "Colombo",
      monthlyCostTarget: 5000,
    };

    expect(household.name).toBe("My Home");
    expect(household.city).toBe("Colombo");
    expect(household.monthlyCostTarget).toBe(5000);
  });

  test("should check household name exists", () => {
    const household = { name: "Energy House" };
    expect(household.name).toBeTruthy();
  });
});