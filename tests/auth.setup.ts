import { test as setup, expect } from "@playwright/test";
import path from "path";
import fs from "fs";
import testConfig from "./config";

const authFile = path.join(testConfig.statePath);

// Create auth file if it doesn't exist
if (!fs.existsSync(path.dirname(authFile))) {
  fs.mkdirSync(path.dirname(authFile), { recursive: true });
}
if (!fs.existsSync(authFile)) {
  fs.writeFileSync(authFile, "{}");
}

setup("authenticate", async ({ page }) => {
  console.log("Setting up test authentication...");

  // Skip setup if NO_SERVER is set
  if (process.env.NO_SERVER) {
    console.log("Skipping auth setup - NO_SERVER mode");
    // Create empty auth file
    await page.context().storageState({ path: authFile });
    return;
  }

  try {
    // Navigate to login page with shorter timeout
    await page.goto("/login", { timeout: 10000 });

    // Check if we need to create a test user or just save empty state
    const needsAuth = process.env.TEST_EMAIL && process.env.TEST_PASSWORD;

    if (needsAuth) {
      // Fill in login form with test credentials
      await page.fill('input[name="email"]', process.env.TEST_EMAIL!);
      await page.fill('input[name="password"]', process.env.TEST_PASSWORD!);

      // Submit form
      await page.click('button[type="submit"]');

      // Wait for successful login
      await page.waitForURL("/dashboard", { timeout: 10000 });
    }

    // Save storage state
    await page.context().storageState({ path: authFile });
    console.log("Test authentication setup completed");
  } catch (error) {
    console.log("Auth setup failed, saving empty state:", error);
    // Save empty storage state on failure
    await page.context().storageState({ path: authFile });
  }
});
