import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT || 3000;
const baseURL = process.env.BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : 2,

  timeout: process.env.NO_SERVER ? 5 * 1000 : 30 * 1000,
  expect: {
    timeout: process.env.NO_SERVER ? 2 * 1000 : 10 * 1000,
  },

  reporter: [["list"], ["json", { outputFile: "test-results.json" }]],

  // Only start server when explicitly needed
  webServer: process.env.NO_SERVER
    ? undefined
    : {
        command: "pnpm run dev",
        url: baseURL,
        timeout: 120 * 1000,
        reuseExistingServer: !process.env.CI,
      },

  use: {
    testIdAttribute: "data-test-id",
    baseURL,
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    navigationTimeout: 30 * 1000,
    actionTimeout: 15 * 1000,
    video: "off",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },

  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /.*\.spec\.ts$/,
      testIgnore: ["**/unit/**", "**/*.setup.ts"],
    },

    {
      name: "unit-tests",
      testMatch: ["**/unit/**/*.spec.ts"],
      use: {
        headless: true,
      },
    },

    {
      name: "integration-tests",
      testMatch: ["**/integration/**/*.spec.ts"],
      use: {
        headless: true,
      },
    },
  ],
});
