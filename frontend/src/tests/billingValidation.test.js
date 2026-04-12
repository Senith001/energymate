import { describe, expect, it } from "vitest";
import { validateBillForm } from "../utils/billingValidation.js";

describe("validateBillForm", () => {
  it("rejects invalid months", () => {
    // The billing form should stop invalid calendar months before submission.
    const message = validateBillForm({
      month: "13",
      year: "2026",
      mode: "units",
      totalUnits: "25",
    });

    expect(message).toBe("Month must be between 1 and 12.");
  });

  it("requires a paid date when marking a bill as paid", () => {
    // Marking a bill as paid should always include the date of payment.
    const message = validateBillForm(
      {
        month: "3",
        year: "2026",
        mode: "units",
        totalUnits: "25",
        status: "paid",
        paidAt: "",
      },
      { requirePaidDateConsistency: true }
    );

    expect(message).toBe("Paid bills need a paid date.");
  });

  it("accepts a valid readings-based bill", () => {
    // A complete readings-based bill should pass validation.
    const message = validateBillForm({
      month: "3",
      year: "2026",
      mode: "readings",
      previousReading: "120",
      currentReading: "150",
    });

    expect(message).toBe("");
  });

  it("requires total units in units mode when no calculation override is used", () => {
    // Units mode depends on a direct total-units value instead of meter readings.
    const message = validateBillForm({
      month: "3",
      year: "2026",
      mode: "units",
      totalUnits: "",
    });

    expect(message).toBe("Total units are required.");
  });

  it("rejects a paid date on unpaid bills during consistency checks", () => {
    // Keep bill status and paid date aligned so the UI cannot save conflicting payment state.
    const message = validateBillForm(
      {
        month: "3",
        year: "2026",
        mode: "units",
        totalUnits: "25",
        status: "unpaid",
        paidAt: "2026-04-01",
      },
      { requirePaidDateConsistency: true }
    );

    expect(message).toBe("Clear the paid date or mark the bill as paid.");
  });

  it("rejects future billing periods", () => {
    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const message = validateBillForm({
      month: String(nextMonth.getMonth() + 1),
      year: String(nextMonth.getFullYear()),
      mode: "units",
      totalUnits: "25",
    });

    expect(message).toBe("Billing period cannot be in the future.");
  });
});
