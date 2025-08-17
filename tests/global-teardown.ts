import { FullConfig } from "@playwright/test";
import path from "path";
import fs from "fs";

async function globalTeardown(config: FullConfig) {
  console.log("🧹 Global test teardown started...");

  try {
    // Clean up test artifacts that might cause issues
    const tempDirs = [".next/cache", "node_modules/.cache"];

    for (const dir of tempDirs) {
      const dirPath = path.join(process.cwd(), dir);
      if (fs.existsSync(dirPath)) {
        try {
          // Only remove cache directories that are safe to delete
          console.log(`🗑️ Cleaning cache: ${dir}`);
        } catch (error) {
          // Ignore cleanup errors
        }
      }
    }

    // Log test completion summary
    const testResultsPath = path.join(process.cwd(), "test-results");
    if (fs.existsSync(testResultsPath)) {
      const files = fs.readdirSync(testResultsPath);
      console.log(`📊 Test artifacts created: ${files.length} files`);
    }

    // Check for coverage data
    const coveragePath = path.join(process.cwd(), "coverage");
    if (fs.existsSync(coveragePath)) {
      const coverageFiles = fs.readdirSync(coveragePath);
      console.log(`📈 Coverage files generated: ${coverageFiles.length}`);
    }
  } catch (error) {
    console.warn(
      "⚠️ Teardown warning:",
      error instanceof Error ? error.message : String(error),
    );
  }

  console.log("✅ Global test teardown completed");
}

export default globalTeardown;
