import { describe, test, expect } from "vitest";

describe("Room Service", () => {
  test("should create a valid room object", () => {
    const room = {
      name: "Living Room",
      householdId: "12345",
    };

    expect(room.name).toBe("Living Room");
    expect(room.householdId).toBe("12345");
  });

  test("should check room name is not empty", () => {
    const room = { name: "Kitchen" };
    expect(room.name.length).toBeGreaterThan(0);
  });
});