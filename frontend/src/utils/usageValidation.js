// Keep reusable usage rules here so the page and dialog can share the same checks.
export function validateUsageForm(form) {
  if (!form.date) return "Usage date is required.";

  const selectedDate = new Date(`${form.date}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (!Number.isNaN(selectedDate.getTime()) && selectedDate > today) {
    return "Usage date cannot be in the future.";
  }

  if (form.entryType === "meter") {
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
    if (form.unitsUsed === "") {
      return "Units used is required.";
    }

    if (Number(form.unitsUsed) < 0) {
      return "Units used cannot be negative.";
    }
  }

  return "";
}
