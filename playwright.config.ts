import { defineConfig, devices } from "@playwright/test";

import config from "./tests/config";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

// Use process.env.PORT by default and fallback to port 3001
const PORT = process.env.PORT || 3000;

// Set webServer.url and use.baseURL with the location of the WebServer respecting the correct set port
const baseURL = process.env.BASE_URL || `http://localhost:${PORT}`;

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: 8,
  /* Global timeout for each test */
  timeout: 10 * 1000, // 10 seconds
  /* Global timeout for expect() */
  expect: {
    timeout: 5 * 1000, // 5 seconds
  },
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ["line", { outputFile: "test-line.txt" }],
    ["json", { outputFile: "test-json.json" }],
    // ["list"],
    // ["html", { open: process.env.CI ? "never" : "on-failure" }], // 자동으로 리포트 서버를 열지 않음
    // [
    //   "playwright-excel-reporter",
    //   {
    //     excelInputPath: "tests/asset/unit-test-case.xlsx",
    //     excelStartRow: 0,
    //     caseSheetName: "블라인드",
    //     excelOutputDir: "test-results",
    //   } as Partial<IExcelConfig>,
    // ],
  ],
  webServer: {
    command: "pnpm run dev",
    url: baseURL,
    timeout: 60 * 1000, // 1 minute for server startup
    reuseExistingServer: !process.env.CI,
    stdout: "pipe",
    stderr: "pipe",
  },

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  // globalSetup: require.resolve('./tests/global-setup'),
  use: {
    testIdAttribute: "data-test-id",
    // Base URL to use in actions like `await page.goto('/')`.
    baseURL,
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    storageState: config.statePath,
    // Add navigation timeout
    navigationTimeout: 30 * 1000, // 30 seconds
    // Add action timeout
    actionTimeout: 20 * 1000, // 20 seconds

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",
  },

  /* Configure projects for major browsers */
  projects: [
    { name: "setup", testMatch: /.*\.setup\.ts/ },
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"], storageState: config.statePath },
      testMatch: /.*\.spec\.ts/,
      dependencies: ["setup"],
    },

    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    // },

    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    // },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],
});
