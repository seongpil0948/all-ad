import os from "os";

import { defineConfig } from "@playwright/test";

import baseConfig from "./playwright.config";

/**
 * Fast test configuration for quick local testing
 */
export default defineConfig({
  ...baseConfig,

  // Override for faster execution
  retries: 0,
  workers: Math.max(1, os.cpus().length - 1),
  fullyParallel: true,

  // Disable reports for speed
  reporter: [["list"]],

  // Skip webserver if already running
  webServer: undefined,

  use: {
    ...baseConfig.use,
    // Disable all visual debugging for speed
    video: "off",
    screenshot: "off",
    trace: "off",

    // Reduce timeouts for faster failures
    navigationTimeout: 15 * 1000,
    actionTimeout: 10 * 1000,
  },

  // Only test with chromium for speed
  projects: [
    {
      name: "fast",
      use: {
        ...baseConfig.projects?.find((p) => p.name === "chromium")?.use,
        // Headless for speed
        headless: true,
      },
      testMatch: /.*\.spec\.ts/,
    },
  ],
});
