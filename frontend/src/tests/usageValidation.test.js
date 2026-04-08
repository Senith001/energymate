import { describe, expect, it } from "vitest";
import { validateUsageForm } from "../utils/usageValidation.js";

describe("validateUsageForm", () => {
  it("requires both readings for meter entries", () => {
    // Meter mode depends on both readings, so the form should reject empty reading fields.
    const message = validateUsageForm({
      date: "2026-04-07",
      entryType: "meter",
      previousReading: "",
      currentReading: "",
    });

    expect(message).toBe("Both meter readings are required.");
  });

  it("rejects negative manual usage values", () => {
    // Manual usage entries should not allow negative kWh values.
    const message = validateUsageForm({
      date: "2026-04-07",
      entryType: "manual",
      unitsUsed: "-5",
    });

    expect(message).toBe("Units used cannot be negative.");
  });

  it("accepts a valid manual usage entry", () => {
    // A normal manual usage submission should pass validation cleanly.
    const message = validateUsageForm({
      date: "2026-04-07",
      entryType: "manual",
      unitsUsed: "12",
    });

    expect(message).toBe("");
  });

  it("rejects meter readings when the current value is lower than the previous value", () => {
    // Meter readings must move forward, not backward.
    const message = validateUsageForm({
      date: "2026-04-07",
      entryType: "meter",
      previousReading: "200",
      currentReading: "180",
    });

    expect(message).toBe("Current reading cannot be lower than the previous reading.");
  });

  it("requires a usage date before allowing submission", () => {
    // The form should block saving if the user has not chosen the usage date yet.
    const message = validateUsageForm({
      date: "",
      entryType: "manual",
      unitsUsed: "8",
    });

    expect(message).toBe("Usage date is required.");
  });
});
