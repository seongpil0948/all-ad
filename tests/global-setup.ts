import { chromium, FullConfig } from "@playwright/test";
import path from "path";
import fs from "fs";

async function globalSetup(config: FullConfig) {
  console.log("🔧 Global test setup started...");

  // Create necessary directories
  const dirs = ["test-results", "playwright-report", "coverage"];
  for (const dir of dirs) {
    const dirPath = path.join(process.cwd(), dir);
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`📁 Created directory: ${dir}`);
    }
  }

  // Clear previous test artifacts
  try {
    const testResultsPath = path.join(process.cwd(), "test-results");
    if (fs.existsSync(testResultsPath)) {
      fs.rmSync(testResultsPath, { recursive: true, force: true });
      fs.mkdirSync(testResultsPath, { recursive: true });
      console.log("🧹 Cleared previous test results");
    }
  } catch (error) {
    console.warn("⚠️ Could not clear test results:", error);
  }

  // Warm up browser for faster test execution
  if (!process.env.NO_SERVER) {
    try {
      console.log("🌡️ Warming up browser...");
      const browser = await chromium.launch({
        args: [
          "--no-sandbox",
          "--disable-dev-shm-usage",
          "--disable-web-security",
        ],
      });
      const context = await browser.newContext();
      const page = await context.newPage();

      // Quick health check if server is expected to be running
      const baseURL =
        config.projects[0]?.use?.baseURL || "http://localhost:3000";
      if (baseURL.startsWith("http")) {
        try {
          await page.goto(baseURL, {
            timeout: 5000,
            waitUntil: "domcontentloaded",
          });
          console.log("✅ Server health check passed");
        } catch (error) {
          console.warn(
            "⚠️ Server not ready, tests may need to wait:",
            error instanceof Error ? error.message : String(error),
          );
        }
      }

      await browser.close();
      console.log("🎭 Browser warmup completed");
    } catch (error) {
      console.warn(
        "⚠️ Browser warmup failed:",
        error instanceof Error ? error.message : String(error),
      );
    }
  }

  // Set environment variables for test stability
  process.env.NEXT_TELEMETRY_DISABLED = "1";
  process.env.CI = process.env.CI || "false";

  console.log("✅ Global test setup completed");
}

export default globalSetup;
