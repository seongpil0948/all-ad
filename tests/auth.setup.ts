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
  // Simple setup without authentication for now
  console.log("Setting up test authentication...");

  // Create a basic storage state
  await page.context().storageState({ path: authFile });

  console.log("Test authentication setup completed");
});
