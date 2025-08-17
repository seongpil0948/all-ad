import { defineConfig } from "@playwright/experimental-ct-react";

export default defineConfig({
  testDir: "./tests/components",
  snapshotDir: "./test-results",
  // Keep things fast and deterministic for CT
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["blob"], ["list"]] : [["list"]],
  use: {
    testIdAttribute: "data-testid",
    ctPort: 3100,
    // Default viewport is fine; component mounts manage their own size
  },
});
