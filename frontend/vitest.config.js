import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    globals: true,
    include: ["src/tests/**/*.test.js"],
    setupFiles: ["./src/tests/setup.js"]
  },
});