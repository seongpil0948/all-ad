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
  // Perform authentication steps. Replace these actions with your own.
  await page.goto("/login");
  await page.getByTestId("login-form").isVisible();
  await page.getByTestId("login-input-id").isVisible();
  await page.getByTestId("login-input-pw").isVisible();

  // Fill in the login credentials using data-test-id attributes
  await page.getByTestId("login-input-id").fill(testConfig.testUserId || "");
  await page.getByTestId("login-input-pw").fill(testConfig.testUserPw || "");
  await page.getByTestId("login-submit").click();

  await page.waitForURL("/dashboard");
  // Alternatively, you can wait until the page reaches a state where all cookies are set.
  await expect(page.getByText("로그아웃")).toBeVisible();

  // End of authentication steps.

  await page.context().storageState({ path: authFile });
});
