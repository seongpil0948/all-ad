import { defineConfig, devices } from "@playwright/test";

const PORT = process.env.PORT || 3000;
const baseURL = process.env.BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./tests",
  outputDir: "./test-results",

  // Sharding and parallel execution settings
  fullyParallel: true, // Enable for better sharding distribution
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 3 : 1, // Always retry once for flaky tests
  workers: process.env.CI ? "50%" : 1, // Use half CPU cores in CI, single worker locally

  // More conservative timeouts
  timeout: process.env.NO_SERVER ? 10 * 1000 : 60 * 1000,
  expect: {
    timeout: process.env.NO_SERVER ? 5 * 1000 : 15 * 1000,
  },

  // Global test setup for better isolation
  globalSetup: require.resolve("./tests/global-setup.ts"),
  globalTeardown: require.resolve("./tests/global-teardown.ts"),

  reporter: process.env.CI
    ? [
        ["blob"], // Use blob reporter for sharding in CI
        ["json", { outputFile: "test-results.json" }],
        ["junit", { outputFile: "test-results/junit.xml" }],
      ]
    : [
        ["list"],
        ["html", { outputFolder: "playwright-report", open: "never" }],
        ["json", { outputFile: "test-results.json" }],
      ],

  // Server configuration with better error handling
  webServer: process.env.NO_SERVER
    ? undefined
    : {
        command: "pnpm run dev",
        url: baseURL,
        timeout: 180 * 1000, // Increased timeout for slower starts
        reuseExistingServer: !process.env.CI,
        stdout: "pipe",
        stderr: "pipe",
        env: {
          NODE_ENV: "test",
          NEXT_TELEMETRY_DISABLED: "1",
        },
      },

  use: {
    testIdAttribute: "data-testid", // Fixed testid attribute
    baseURL,
    locale: "ko-KR",
    timezoneId: "Asia/Seoul",
    // Increased timeouts for stability
    navigationTimeout: 45 * 1000,
    actionTimeout: 20 * 1000,
    // Minimal media capture for performance
    video: "retain-on-failure",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    // Better browser stability
    launchOptions: {
      args: [
        "--no-sandbox",
        "--disable-dev-shm-usage",
        "--disable-web-security",
        "--disable-extensions",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
      ],
    },
  },

  projects: [
    // Stable unit tests - highest priority
    {
      name: "unit-tests",
      testMatch: [
        "**/unit/**/*.spec.ts",
        "**/hooks/**/*.spec.ts",
        "**/stores/**/*.spec.ts",
        "**/utils/**/*.spec.ts",
        "**/services/**/*.spec.ts",
      ],
      use: {
        headless: true,
        viewport: null,
        // Fastest execution for unit tests
        actionTimeout: 5 * 1000,
        navigationTimeout: 10 * 1000,
      },
    },

    // Component tests with improved stability
    {
      name: "component-tests",
      testMatch: ["**/components/**/*.spec.tsx"],
      use: {
        ...devices["Desktop Chrome"],
        headless: true,
        // Component-specific settings
        actionTimeout: 10 * 1000,
        navigationTimeout: 15 * 1000,
      },
    },

    // Integration tests with conservative settings
    {
      name: "integration-tests",
      testMatch: ["**/integration/**/*.spec.ts"],
      use: {
        ...devices["Desktop Chrome"],
        headless: true,
        actionTimeout: 20 * 1000,
        navigationTimeout: 30 * 1000,
      },
    },

    // API tests (no browser needed)
    {
      name: "api-tests",
      testMatch: ["**/api/**/*.spec.ts"],
      use: {
        headless: true,
        viewport: null,
        // API-specific timeouts
        actionTimeout: 15 * 1000,
        navigationTimeout: 20 * 1000,
      },
    },

    // Smoke tests for quick validation
    {
      name: "smoke-tests",
      testMatch: ["**/*.spec.ts"],
      grep: /@smoke/,
      use: {
        headless: true,
        actionTimeout: 10 * 1000,
        navigationTimeout: 15 * 1000,
      },
    },

    // E2E tests with maximum stability settings
    {
      name: "e2e-tests",
      testMatch: ["**/scenarios/**/*.spec.ts", "**/auth/**/*.spec.ts"],
      use: {
        ...devices["Desktop Chrome"],
        headless: process.env.CI === "true",
        // Maximum timeouts for complex flows
        actionTimeout: 30 * 1000,
        navigationTimeout: 60 * 1000,
        // Extra stability for E2E
        launchOptions: {
          args: [
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--disable-web-security",
            "--disable-extensions",
            "--disable-background-timer-throttling",
            "--disable-backgrounding-occluded-windows",
            "--disable-renderer-backgrounding",
            "--disable-ipc-flooding-protection",
          ],
          slowMo: process.env.CI ? 0 : 100, // Slow down for local debugging
        },
      },
    },

    // Basic browser tests (fallback)
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      testMatch: /.*\.spec\.ts$/,
      testIgnore: [
        "**/unit/**",
        "**/components/**",
        "**/integration/**",
        "**/api/**",
        "**/scenarios/**",
        "**/auth/**",
        "**/*.setup.ts",
      ],
    },
  ],
});
