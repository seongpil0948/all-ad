import { test, expect } from "@playwright/test";
import { CoverageCollector } from "@/tests/helpers/coverage-utils";

test.describe("Comprehensive Application Coverage", () => {
  test("complete application coverage test @coverage", async ({ page }) => {
    const collector = new CoverageCollector(page, {
      outputDir: "coverage/comprehensive",
      includeJS: true,
      includeCSS: true,
      resetOnNavigation: false,
    });

    await collector.startCoverage();

    try {
      console.log("🚀 Starting comprehensive coverage collection...");

      // 1. Home page coverage
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Test homepage components
      const heroSection = page.locator('main, [data-testid="hero-section"]');
      if (await heroSection.isVisible()) {
        await heroSection.scrollIntoViewIfNeeded();
      }

      // Test CTA buttons (but handle if missing)
      const ctaButtons = page
        .locator('button, [role="button"]')
        .filter({ hasText: /시작|시도|무료|체험/i });
      const ctaCount = await ctaButtons.count();
      console.log(`Found ${ctaCount} CTA-like buttons`);

      for (let i = 0; i < Math.min(ctaCount, 3); i++) {
        const button = ctaButtons.nth(i);
        if (await button.isVisible()) {
          await button.hover();
        }
      }

      // 2. Navigation coverage - use more specific selectors
      const mainNavbar = page.locator('[data-testid="main-navbar"]').first();
      if (await mainNavbar.isVisible()) {
        await mainNavbar.scrollIntoViewIfNeeded();

        // Test theme switcher (handle multiple instances)
        const themeSwitch = page
          .locator('[data-testid="theme-switch"]')
          .first();
        if (await themeSwitch.isVisible()) {
          try {
            await themeSwitch.click({ timeout: 3000 });
            await page.waitForTimeout(300);
            await themeSwitch.click({ timeout: 3000 });
          } catch (error) {
            console.log("Theme switch interaction failed:", error);
          }
        }

        // Test language switcher
        const langSwitch = page
          .locator('[data-testid="language-switcher"]')
          .first();
        if (await langSwitch.isVisible()) {
          try {
            await langSwitch.hover({ timeout: 2000 });
          } catch (error) {
            console.log("Language switch hover failed:", error);
          }
        }
      }

      // 3. Footer coverage
      const footer = page.locator('footer, [data-testid="footer"]');
      if (await footer.isVisible()) {
        await footer.scrollIntoViewIfNeeded();

        const footerLinks = footer.locator("a").first();
        if (await footerLinks.isVisible()) {
          await footerLinks.hover();
        }
      }

      // 4. Test different routes for component coverage
      const routes = ["/ko/intro", "/ko/faq"];
      for (const route of routes) {
        try {
          await page.goto(route);
          await page.waitForLoadState("networkidle");

          // Scroll to interact with components
          await page.evaluate(() =>
            window.scrollTo(0, document.body.scrollHeight / 2),
          );
          await page.waitForTimeout(1000);
        } catch (error) {
          console.log(`Route ${route} not accessible:`, error);
        }
      }

      // 5. Test interactive elements
      await page.goto("/");

      // Test any visible buttons
      const buttons = page.locator("button");
      const buttonCount = await buttons.count();
      console.log(`Found ${buttonCount} buttons total`);

      for (let i = 0; i < Math.min(buttonCount, 5); i++) {
        const button = buttons.nth(i);
        if (await button.isVisible()) {
          await button.hover();
        }
      }

      console.log("✅ Coverage collection completed successfully");
    } catch (error) {
      console.error("❌ Error during coverage collection:", error);
    } finally {
      console.log("📊 Generating coverage reports...");
      const coverage = await collector.stopCoverage();
      await collector.generateReports(
        coverage.jsCoverage,
        coverage.cssCoverage,
      );

      console.log(`📈 Coverage Summary:`);
      console.log(`- JavaScript files: ${coverage.jsCoverage.length}`);
      console.log(`- CSS files: ${coverage.cssCoverage.length}`);

      // Verify coverage was collected
      expect(coverage.jsCoverage.length).toBeGreaterThan(50);
      console.log(
        `✅ Coverage collection successful: ${coverage.jsCoverage.length} JS files covered`,
      );
    }
  });

  test("component interaction coverage test", async ({ page }) => {
    const collector = new CoverageCollector(page, {
      outputDir: "coverage/components-interaction",
    });

    await collector.startCoverage();

    try {
      await page.goto("/");
      await page.waitForLoadState("networkidle");

      // Test component interactions with safer selectors
      const interactiveComponents = [
        { selector: 'button:not([data-testid="theme-switch"])', limit: 2 },
        { selector: 'a[href]:not([aria-hidden="true"])', limit: 2 },
        { selector: '[data-testid="cta-button"]', limit: 1 },
        { selector: '[data-testid="language-switcher"]', limit: 1 },
      ];

      for (const { selector, limit } of interactiveComponents) {
        try {
          const elements = page.locator(selector);
          const count = await elements.count();

          if (count > 0) {
            console.log(`Testing ${count} elements with selector: ${selector}`);

            // Test limited number of elements of each type
            for (let i = 0; i < Math.min(count, limit); i++) {
              const element = elements.nth(i);
              if (await element.isVisible()) {
                try {
                  await element.hover({ timeout: 2000 });
                  await page.waitForTimeout(100);
                } catch (hoverError) {
                  console.log(
                    `Hover failed for ${selector}[${i}]:`,
                    hoverError,
                  );
                }
              }
            }
          }
        } catch (selectorError) {
          console.log(`Selector failed: ${selector}`, selectorError);
        }
      }
    } finally {
      const coverage = await collector.stopCoverage();
      await collector.generateReports(
        coverage.jsCoverage,
        coverage.cssCoverage,
      );

      expect(coverage.jsCoverage.length).toBeGreaterThan(10);
    }
  });
});
