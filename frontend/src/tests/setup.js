import "@testing-library/jest-dom";
import { vi } from "vitest";

// Hide React Router warnings
const originalWarn = console.warn;
const originalError = console.error;

console.warn = (...args) => {
  const msg = args.join(" ");
  if (
    msg.includes("React Router Future Flag Warning") ||
    msg.includes("Relative route resolution")
  ) {
    return;
  }
  originalWarn(...args);
};

// Hide axios 401 logs / API fetch errors during tests
console.error = (...args) => {
  const msg = args.join(" ");
  if (
    msg.includes("AxiosError") ||
    msg.includes("Failed to fetch") ||
    msg.includes("401")
  ) {
    return;
  }
  originalError(...args);
};