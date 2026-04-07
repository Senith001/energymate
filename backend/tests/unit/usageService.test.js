import { describe, expect, it } from "vitest";
import { calculateCost } from "../../src/services/usageService.js";

// Fixed tariff sample used to verify the pure slab-calculation logic in isolation.
const tariff = {
  tariffLow: [
    { upTo: 30, rate: 4.5, fixedCharge: 80 },
    { upTo: 60, rate: 8, fixedCharge: 210 },
  ],
  tariffHigh: [
    { upTo: 60, rate: 12.75, fixedCharge: 0 },
    { upTo: 90, rate: 18.5, fixedCharge: 400 },
    { upTo: 120, rate: 24, fixedCharge: 1000 },
    { upTo: 180, rate: 41, fixedCharge: 1500 },
    { upTo: null, rate: 61, fixedCharge: 2100 },
  ],
  ssclRate: 0.025,
};

describe("calculateCost", () => {
  it("calculates the low-tier tariff for usage within 30 units", () => {
    // A single low-tier slab should be enough when usage stays below 30 kWh.
    const result = calculateCost(20, tariff);

    expect(result.energyCharge).toBe(90);
    expect(result.fixedCharge).toBe(80);
    expect(result.subTotal).toBe(170);
    expect(result.sscl).toBe(4.25);
    expect(result.totalCost).toBe(174.25);
  });

  it("uses both low-tier slabs and the highest reached fixed charge up to 60 units", () => {
    // Crossing 30 kWh should move into the second low-tier slab and raise the fixed charge.
    const result = calculateCost(45, tariff);

    expect(result.energyCharge).toBe(255);
    expect(result.fixedCharge).toBe(210);
    expect(result.subTotal).toBe(465);
    expect(result.sscl).toBe(11.63);
    expect(result.totalCost).toBe(476.63);
    expect(result.breakdown).toHaveLength(2);
  });

  it("switches to the high-tier tariff when usage exceeds 60 units", () => {
    // Once usage crosses 60 kWh, the high-tier slab set should be used for the whole calculation.
    const result = calculateCost(85, tariff);

    expect(result.energyCharge).toBe(1227.5);
    expect(result.fixedCharge).toBe(400);
    expect(result.subTotal).toBe(1627.5);
    expect(result.sscl).toBe(40.69);
    expect(result.totalCost).toBe(1668.19);
  });

  it("uses the infinity slab for very high usage values", () => {
    // The last slab has no upper bound, so very large usage should continue there cleanly.
    const result = calculateCost(200, tariff);

    expect(result.fixedCharge).toBe(2100);
    expect(result.breakdown.at(-1).range).toBe("181–200 kWh");
    expect(result.breakdown.at(-1).units).toBe(20);
    expect(result.totalUnits).toBe(200);
  });
});
