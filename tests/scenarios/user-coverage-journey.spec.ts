import { test, expect } from "@playwright/test";
import { CoverageCollector } from "@/tests/helpers/coverage-utils";

test.describe("User Journey with Coverage Collection", () => {
  test("complete user journey with comprehensive coverage @coverage", async ({
    page,
  }) => {
    const collector = new CoverageCollector(page, {
      outputDir: "coverage/e2e/user-journey",
      includeJS: true,
      includeCSS: true,
      resetOnNavigation: false, // Keep coverage across navigation
    });

    // Start coverage collection
    await collector.startCoverage();

    try {
      console.log("🚀 Starting comprehensive user journey with coverage...");

      // 1. Landing page coverage
      await page.goto("/");
      await expect(page).toHaveTitle(/All-Ad/);

      // Test landing page components
      const heroSection = page.locator('[data-testid="hero-section"]');
      if (await heroSection.isVisible()) {
        await heroSection.scrollIntoViewIfNeeded();
      }

      // Test CTA buttons
      const ctaButtons = page.locator('[data-testid="cta-button"]');
      const ctaCount = await ctaButtons.count();
      console.log(`Found ${ctaCount} CTA buttons`);

      for (let i = 0; i < Math.min(ctaCount, 3); i++) {
        const button = ctaButtons.nth(i);
        if (await button.isVisible()) {
          await button.hover();
          await button.focus();
        }
      }

      // 2. Navigation coverage
      const navbar = page.locator('[data-testid="navbar"]');
      if (await navbar.isVisible()) {
        await navbar.hover();

        // Test theme switcher
        const themeSwitch = page.locator('[data-testid="theme-switch"]');
        if (await themeSwitch.isVisible()) {
          await themeSwitch.click();
          await page.waitForTimeout(500);
          await themeSwitch.click(); // Switch back
        }

        // Test language switcher
        const langSwitch = page.locator('[data-testid="language-switcher"]');
        if (await langSwitch.isVisible()) {
          await langSwitch.hover();
        }
      }

      // 3. Authentication coverage
      console.log("📝 Testing authentication flows...");

      // Try login page
      try {
        await page.goto("/ko/auth/login");

        const loginForm = page.locator("form");
        if (await loginForm.isVisible()) {
          const emailInput = page.locator('input[type="email"]');
          const passwordInput = page.locator('input[type="password"]');

          if (
            (await emailInput.isVisible()) &&
            (await passwordInput.isVisible())
          ) {
            await emailInput.fill("test@example.com");
            await passwordInput.fill("testpassword");

            // Test form validation without actually submitting
            await emailInput.clear();
            await emailInput.blur();

            // Reset form
            await emailInput.fill("test@example.com");
          }
        }
      } catch (error) {
        console.log("Login page not accessible or doesn't exist");
      }

      // 4. Component interaction coverage
      console.log("🔧 Testing component interactions...");

      await page.goto("/");

      // Test footer components
      const footer = page.locator('[data-testid="footer"]');
      if (await footer.isVisible()) {
        await footer.scrollIntoViewIfNeeded();

        const footerLinks = footer.locator("a");
        const footerLinkCount = await footerLinks.count();

        for (let i = 0; i < Math.min(footerLinkCount, 5); i++) {
          const link = footerLinks.nth(i);
          if (await link.isVisible()) {
            await link.hover();
          }
        }
      }

      // 5. Error handling coverage
      console.log("⚠️ Testing error scenarios...");

      try {
        await page.goto("/non-existent-page", { waitUntil: "networkidle" });

        // Check if error page components are loaded
        const errorState = page.locator('[data-testid="error-state"]');
        if (await errorState.isVisible()) {
          await errorState.hover();
        }
      } catch (error) {
        console.log("Expected error for non-existent page");
      }

      // 6. Performance and loading states
      console.log("⏱️ Testing loading states...");

      await page.goto("/");

      // Test loading states
      const loadingStates = page.locator('[data-testid="loading-state"]');
      const loadingCount = await loadingStates.count();

      for (let i = 0; i < loadingCount; i++) {
        const loading = loadingStates.nth(i);
        if (await loading.isVisible()) {
          await loading.hover();
        }
      }

      console.log("✅ User journey completed successfully");
    } catch (error) {
      console.error("❌ Error during user journey:", error);
      throw error;
    } finally {
      // Stop coverage collection and generate reports
      console.log("📊 Generating coverage reports...");
      const coverage = await collector.stopCoverage();
      await collector.generateReports(
        coverage.jsCoverage,
        coverage.cssCoverage,
      );

      // Log coverage summary
      console.log(`📈 Coverage Collection Summary:`);
      console.log(`- JavaScript files covered: ${coverage.jsCoverage.length}`);
      console.log(`- CSS files covered: ${coverage.cssCoverage.length}`);
      console.log(
        `- Total coverage files: ${coverage.jsCoverage.length + coverage.cssCoverage.length}`,
      );

      // Verify meaningful coverage was collected
      expect(coverage.jsCoverage.length).toBeGreaterThan(0);

      // Check if main application files are covered
      const appFiles = coverage.jsCoverage.filter(
        (entry) =>
          entry.url.includes("/app/") ||
          entry.url.includes("/components/") ||
          entry.url.includes("/lib/"),
      );

      console.log(`📁 Application files covered: ${appFiles.length}`);
      expect(appFiles.length).toBeGreaterThan(0);
    }
  });

  test("component-focused coverage test", async ({ page }) => {
    const collector = new CoverageCollector(page, {
      outputDir: "coverage/components/focused",
    });

    await collector.startCoverage();

    try {
      await page.goto("/");

      // Focus on specific component coverage
      const components = [
        '[data-testid="navbar"]',
        '[data-testid="hero-section"]',
        '[data-testid="cta-button"]',
        '[data-testid="footer"]',
        '[data-testid="theme-switch"]',
      ];

      for (const selector of components) {
        const element = page.locator(selector);
        if (await element.isVisible()) {
          console.log(`Testing component: ${selector}`);

          await element.scrollIntoViewIfNeeded();
          await element.hover();

          if (selector.includes("button") || selector.includes("switch")) {
            try {
              await element.click();
              await page.waitForTimeout(200);
            } catch (error) {
              console.log(`Click not applicable for ${selector}`);
            }
          }
        }
      }
    } finally {
      const coverage = await collector.stopCoverage();
      await collector.generateReports(
        coverage.jsCoverage,
        coverage.cssCoverage,
      );

      expect(coverage.jsCoverage.length).toBeGreaterThan(0);
    }
  });
});
