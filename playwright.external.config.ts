import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright configuration for external tests that don't need a local server
 */
export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  reporter: [
    ["dot"],
    ["html", { open: process.env.CI ? "never" : "on-failure" }],
  ],

  use: {
    testIdAttribute: "data-test-id",
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /.*\.spec\.ts/,
    },
  ],
});
