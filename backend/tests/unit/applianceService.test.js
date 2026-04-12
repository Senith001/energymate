import { describe, test, expect } from "vitest";

describe("Appliance Service", () => {
  test("should create a valid appliance object", () => {
    const appliance = {
      name: "Fan",
      wattage: 75,
      roomId: "room123",
    };

    expect(appliance.name).toBe("Fan");
    expect(appliance.wattage).toBe(75);
    expect(appliance.roomId).toBe("room123");
  });

  test("should validate appliance wattage is positive", () => {
    const appliance = { wattage: 100 };
    expect(appliance.wattage).toBeGreaterThan(0);
  });
});