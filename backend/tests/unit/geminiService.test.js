import { describe, it, expect, vi, beforeEach } from "vitest";
import { 
  getEnergyTipsFromGemini, 
  getPredictionFromGemini 
} from "../../src/services/geminiService.js";

// Mock external services
vi.mock("../../src/services/tarifService.js", () => ({
  getTariff: vi.fn(() => Promise.resolve({
    tariffLow: [{ upTo: 60, rate: 10, fixedCharge: 50 }],
    ssclRate: 0.025
  }))
}));

vi.mock("../../src/services/usageService.js", () => ({
  calculateCost: vi.fn((units) => ({
    totalCost: units * 10 // Simplified mock math
  }))
}));

// Mock the Google Generative AI library
const mockGenerateContent = vi.fn();
vi.mock("@google/generative-ai", () => {
  return {
    GoogleGenerativeAI: vi.fn().mockImplementation(() => ({
      getGenerativeModel: vi.fn().mockReturnValue({
        generateContent: (...args) => mockGenerateContent(...args)
      })
    }))
  };
});

describe("Gemini Service Unit Tests", () => {
  
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  it("should generate energy tips and parse the JSON correctly", async () => {
    const mockTips = [
      { title: "Test Tip", problem: "Test Prob", recommendation: "Test Rec", implementation: ["s1"], expectedSavings: { unitsPerMonth: 5, costLKR: 50 }, priority: "High", category: "appliances", learnMore: "url" }
    ];
    
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify(mockTips)
      }
    });

    const sampleBills = [{ month: 1, year: 2026, totalUnits: 100 }];
    const sampleAppliances = [{ name: "AC", wattage: 1000, quantity: 1, defaultHoursPerDay: 5 }];

    const result = await getEnergyTipsFromGemini(sampleBills, sampleAppliances);
    
    expect(result).toHaveLength(1);
    expect(result[0].title).toBe("Test Tip");
    expect(mockGenerateContent).toHaveBeenCalled();
  });

  it("should handle 429 quota errors by retrying with exponential backoff", async () => {
    const mockSuccessTips = [
      { title: "Success After Retry", problem: "P", recommendation: "R", implementation: ["i"], expectedSavings: { unitsPerMonth: 5, costLKR: 50 }, priority: "High", category: "appliances", learnMore: "u" }
    ];

    // Fail first, succeed second
    mockGenerateContent
      .mockRejectedValueOnce(new Error("429 Too Many Requests"))
      .mockResolvedValueOnce({
        response: {
          text: () => JSON.stringify(mockSuccessTips)
        }
      });

    const sampleBills = [{ month: 1, year: 2026, totalUnits: 100 }];
    const promise = getEnergyTipsFromGemini(sampleBills, []);
    
    // Fast forward past the first wait (2000ms base in the code)
    await vi.runAllTimersAsync();
    
    const result = await promise;
    expect(result[0].title).toBe("Success After Retry");
    expect(mockGenerateContent).toHaveBeenCalledTimes(2);
  });

  it("should calculate costs for predicted consumption in LKR", async () => {
    // Generate a single month prediction
    const promptResponse = {
      predictionTable: [
        { year: 2026, month: 5, predictedConsumption: 100 }
      ],
      insights: [
        { title: "Insight 1", description: "Desc 1" },
        { title: "Insight 2", description: "Desc 2" }
      ],
      summary: "Short summary"
    };

    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => JSON.stringify(promptResponse)
      }
    });

    const sampleBills = [{ month: 1, year: 2026, totalUnits: 100 }];
    const result = await getPredictionFromGemini(sampleBills);

    expect(result.predictionTable).toHaveLength(12); // Padded to 12
    const mayEntry = result.predictionTable.find(p => p.month === 5 && p.year === 2026);
    expect(mayEntry).toBeDefined();
    expect(mayEntry.predictedConsumption).toBe(100);
    expect(mayEntry.predictedCostLKR).toBe(1000); // 100 units * 10 (from mock)
  });

});
