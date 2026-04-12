import { describe, it, expect } from "vitest";
import Recommendation from "../../src/models/Recommendation.js";
import mongoose from "mongoose";

describe("Recommendation Model Unit Tests", () => {
  
  it("should validate a valid AI prediction with new LKR fields", () => {
    const rec = new Recommendation({
      householdId: new mongoose.Types.ObjectId(),
      type: "prediction",
      predictionTable: [
        {
          year: 2026,
          month: "May",
          currentConsumption: 120,
          predictedConsumption: 135,
          predictedCostLKR: 5800.50
        }
      ],
      predictionInsights: [
        { title: "Summer Peak", description: "Usage expected to rise due to heat." }
      ]
    });

    const error = rec.validateSync();
    expect(error).toBeUndefined();
    expect(rec.predictionTable[0].year).toBe(2026);
    expect(rec.predictionTable[0].predictedCostLKR).toBe(5800.50);
  });

  it("should fail if required fields are missing", () => {
    const rec = new Recommendation({});
    const error = rec.validateSync();

    expect(error).toBeDefined();
    expect(error.errors.householdId).toBeDefined();
    expect(error.errors.type).toBeDefined();
  });

  it("should validate a valid energy tip recommendation", () => {
    const rec = new Recommendation({
      householdId: new mongoose.Types.ObjectId(),
      type: "tips",
      tips: [
        {
          title: "Switch to LED",
          description: "LED bulbs save 80% energy.",
          learnMore: "https://ceb.lk"
        }
      ]
    });

    const error = rec.validateSync();
    expect(error).toBeUndefined();
    expect(rec.tips).toHaveLength(1);
    expect(rec.tips[0].title).toBe("Switch to LED");
  });

  it("should fail validation if type is invalid", () => {
    const rec = new Recommendation({
      householdId: new mongoose.Types.ObjectId(),
      type: "invalid_type"
    });

    const error = rec.validateSync();
    expect(error).toBeDefined();
    expect(error.errors.type).toBeDefined();
  });

});
