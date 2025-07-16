import os from "os";

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
  workers: process.env.CI ? 2 : Math.min(4, os.cpus().length),
  /* Global timeout for each test */
  timeout: 30 * 1000, // 30 seconds
  /* Global timeout for expect() */
  expect: {
    timeout: 10 * 1000, // 10 seconds
  },
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI
    ? [["github"], ["json", { outputFile: "test-results.json" }]]
    : [["list"], ["html", { open: "never" }]],
  webServer: {
    command: "pnpm run dev",
    url: baseURL,
    timeout: 120 * 1000, // 2 minutes for server startup
    reuseExistingServer: true, // Always reuse existing server
    stdout: "ignore",
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
    actionTimeout: 15 * 1000, // 15 seconds

    // Improve performance
    video: "off",
    screenshot: "only-on-failure",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: process.env.CI ? "on-first-retry" : "off",

    // Browser launch options for better performance
    launchOptions: {
      args: ["--disable-dev-shm-usage", "--no-sandbox"],
    },
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
