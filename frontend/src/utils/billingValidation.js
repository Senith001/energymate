// Keep billing rules in one place so create and update flows stay consistent.
export function validateBillForm(form, { requirePaidDateConsistency = false } = {}) {
  const monthValue = Number(form.month);
  const yearValue = Number(form.year);
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();

  if (!Number.isInteger(monthValue) || monthValue < 1 || monthValue > 12) {
    return "Month must be between 1 and 12.";
  }

  if (!Number.isInteger(yearValue) || yearValue < 2000 || yearValue > 2100) {
    return "Year must be between 2000 and 2100.";
  }

  if (yearValue > currentYear || (yearValue === currentYear && monthValue > currentMonth)) {
    return "Billing period cannot be in the future.";
  }

  if (form.mode === "readings") {
    if (form.previousReading === "" || form.currentReading === "") {
      return "Both meter readings are required.";
    }

    const previousReading = Number(form.previousReading);
    const currentReading = Number(form.currentReading);

    if (previousReading < 0 || currentReading < 0) {
      return "Meter readings cannot be negative.";
    }

    if (currentReading < previousReading) {
      return "Current reading cannot be lower than the previous reading.";
    }
  } else {
    const requiresTotalUnits = form.totalUnits === "";

    if (requiresTotalUnits && !requirePaidDateConsistency) {
      return "Total units are required.";
    }

    if (form.totalUnits !== "" && Number(form.totalUnits) < 0) {
      return "Total units cannot be negative.";
    }
  }

  if (requirePaidDateConsistency) {
    if (form.status === "paid" && !form.paidAt) {
      return "Paid bills need a paid date.";
    }

    if (form.status === "unpaid" && form.paidAt) {
      return "Clear the paid date or mark the bill as paid.";
    }
  }

  return "";
}
