import { describe, expect, it, vi, beforeEach } from "vitest";

// Mock external dependencies so these tests stay focused on bill-service logic only.
vi.mock("../../src/services/usageService.js", () => ({
  calculateCost: vi.fn(),
  getMonthlyTotalUnits: vi.fn(),
}));

vi.mock("../../src/services/tarifService.js", () => ({
  getTariff: vi.fn(),
}));

vi.mock("../../src/models/bill.js", () => ({
  default: {
    findOne: vi.fn(),
  },
}));

import { buildBillFields, compareBills } from "../../src/services/billService.js";
import { calculateCost } from "../../src/services/usageService.js";
import { getTariff } from "../../src/services/tarifService.js";
import Bill from "../../src/models/bill.js";

describe("buildBillFields", () => {
  beforeEach(() => {
    // Reset mocked tariff/calculation state before each unit test.
    vi.clearAllMocks();
    getTariff.mockResolvedValue({ mockTariff: true });
    calculateCost.mockReturnValue({
      energyCharge: 100,
      fixedCharge: 50,
      subTotal: 150,
      sscl: 10,
      totalCost: 160,
      breakdown: [{ range: "1-30", units: 10, rate: 10, cost: 100 }],
    });
  });

  it("derives total units from meter readings", async () => {
    // When readings are provided, the service should derive units before delegating to the tariff calculator.
    const result = await buildBillFields({
      month: 3,
      year: 2026,
      previousReading: 120,
      currentReading: 150,
    });

    expect(result.totalUnits).toBe(30);
    expect(result.previousReading).toBe(120);
    expect(result.currentReading).toBe(150);
    expect(result.totalCost).toBe(160);
    expect(calculateCost).toHaveBeenCalledWith(30, { mockTariff: true });
  });

  it("throws when current reading is lower than previous reading", async () => {
    // Impossible meter progress should be rejected before any bill fields are returned.
    await expect(
      buildBillFields({
        month: 3,
        year: 2026,
        previousReading: 180,
        currentReading: 150,
      })
    ).rejects.toThrow("currentReading must be greater than previousReading");
  });

  it("calculates bill comparison percentages from the previous month", async () => {
    // Compare the current month against a mocked previous bill without touching MongoDB.
    Bill.findOne
      .mockResolvedValueOnce({
        totalUnits: 120,
        totalCost: 1668.19,
      })
      .mockResolvedValueOnce({
        totalUnits: 85,
        totalCost: 220.38,
      });

    const comparison = await compareBills("household-id", 3, 2026);

    expect(comparison.current.totalCost).toBe(1668.19);
    expect(comparison.previous.totalCost).toBe(220.38);
    expect(comparison.difference.cost).toBe(1447.81);
    expect(comparison.difference.costChangePercent).toBe(657);
    expect(comparison.difference.trend).toBe("increased");
  });

  it("returns a comparison message when the requested month has no bill", async () => {
    // The service should return a friendly message instead of crashing when the target month is missing.
    Bill.findOne
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        totalUnits: 85,
        totalCost: 220.38,
      });

    const comparison = await compareBills("household-id", 4, 2026);

    expect(comparison).toEqual({ message: "No bill found for the requested month" });
  });
});
