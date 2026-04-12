import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    include: ["tests/**/*.test.js"],
    hookTimeout: 900000,
    testTimeout: 900000,
    fileParallelism: false,
  },
});
