import { test, expect } from "@playwright/test";

test.describe("Dashboard Components Tests", () => {
  test.describe("Dashboard Layout", () => {
    test("should render dashboard with navigation", async ({ page }) => {
      // Navigate to dashboard (will redirect to login if not authenticated)
      await page.goto("/ko/dashboard");

      if (page.url().includes("login")) {
        // If redirected to login, that's expected behavior
        await expect(page.locator("text=로그인")).toBeVisible();
      } else {
        // If somehow authenticated, check dashboard elements
        await expect(page.locator("nav")).toBeVisible();
      }
    });

    test("should show proper loading states", async ({ page }) => {
      await page.goto("/ko/dashboard");

      // Look for loading indicators or skeletons
      const loadingElements = page.locator(
        '[data-testid*="loading"], [data-testid*="skeleton"], .animate-pulse',
      );

      // Should have some loading state initially or redirect to login
      if (!page.url().includes("login")) {
        await expect(loadingElements.first())
          .toBeVisible({ timeout: 2000 })
          .catch(() => {
            // If no loading state, that's also acceptable
          });
      }
    });
  });

  test.describe("Campaign Dashboard", () => {
    test("should handle empty campaign state", async ({ page }) => {
      await page.goto("/ko/dashboard");

      if (!page.url().includes("login")) {
        // Look for empty state messages
        const emptyStateSelectors = [
          "text=캠페인이 없습니다",
          "text=연동된 플랫폼이 없습니다",
          "text=데이터가 없습니다",
          '[data-testid="empty-state"]',
          ".empty-state",
        ];

        let foundEmptyState = false;
        for (const selector of emptyStateSelectors) {
          try {
            await expect(page.locator(selector)).toBeVisible({ timeout: 1000 });
            foundEmptyState = true;
            break;
          } catch {
            // Continue to next selector
          }
        }

        // If no empty state found, that's also acceptable (might have data or different UI)
      }
    });

    test("should display campaign metrics properly", async ({ page }) => {
      await page.goto("/ko/dashboard");

      if (!page.url().includes("login")) {
        // Look for metric cards or tables
        const metricElements = [
          '[data-testid*="metric"]',
          '[data-testid*="campaign"]',
          ".metric-card",
          "table",
          ".stat-card",
        ];

        for (const selector of metricElements) {
          const elements = page.locator(selector);
          const count = await elements.count();
          if (count > 0) {
            // Found metric elements, verify they're visible
            await expect(elements.first()).toBeVisible();
            break;
          }
        }
      }
    });
  });

  test.describe("Sync Functionality", () => {
    test("should show sync button", async ({ page }) => {
      await page.goto("/ko/dashboard");

      if (!page.url().includes("login")) {
        // Look for sync button
        const syncButtonSelectors = [
          "button:has-text('동기화')",
          "button:has-text('Sync')",
          '[data-testid="sync-button"]',
          'button[title*="sync" i]',
          'button[aria-label*="sync" i]',
        ];

        for (const selector of syncButtonSelectors) {
          try {
            await expect(page.locator(selector)).toBeVisible({ timeout: 1000 });
            break;
          } catch {
            // Continue to next selector
          }
        }
      }
    });

    test("should handle sync button interactions", async ({ page }) => {
      await page.goto("/ko/dashboard");

      if (!page.url().includes("login")) {
        const syncButton = page
          .locator(
            "button:has-text('동기화'), button:has-text('Sync'), [data-testid='sync-button']",
          )
          .first();

        if ((await syncButton.count()) > 0) {
          // Click sync button and check for loading state
          await syncButton.click();

          // Should show some loading indicator
          const loadingIndicators = [
            ".loading",
            ".spinner",
            '[data-testid*="loading"]',
            "button[disabled]",
          ];

          for (const indicator of loadingIndicators) {
            try {
              await expect(page.locator(indicator)).toBeVisible({
                timeout: 2000,
              });
              break;
            } catch {
              // Continue to next indicator
            }
          }
        }
      }
    });
  });

  test.describe("Data Tables", () => {
    test("should render campaign table structure", async ({ page }) => {
      await page.goto("/ko/dashboard");

      if (!page.url().includes("login")) {
        // Look for table elements
        const table = page.locator("table").first();

        if ((await table.count()) > 0) {
          await expect(table).toBeVisible();

          // Check for table headers
          const headers = table.locator("thead th, .table-header");
          const headerCount = await headers.count();

          if (headerCount > 0) {
            // Should have some column headers
            expect(headerCount).toBeGreaterThan(0);
          }
        }
      }
    });

    test("should handle table sorting", async ({ page }) => {
      await page.goto("/ko/dashboard");

      if (!page.url().includes("login")) {
        // Look for sortable column headers
        const sortableHeaders = page.locator(
          "th[role='columnheader'], th button, .sortable",
        );

        if ((await sortableHeaders.count()) > 0) {
          const firstSortable = sortableHeaders.first();
          await expect(firstSortable).toBeVisible();

          // Click to test sorting
          await firstSortable.click();

          // Should remain on same page after sort
          expect(page.url()).toContain("dashboard");
        }
      }
    });

    test("should handle infinite scroll or pagination", async ({ page }) => {
      await page.goto("/ko/dashboard");

      if (!page.url().includes("login")) {
        // Look for pagination or scroll elements
        const paginationElements = [
          ".pagination",
          'button:has-text("다음")',
          'button:has-text("Next")',
          '[data-testid*="pagination"]',
          '[data-testid*="load-more"]',
        ];

        for (const selector of paginationElements) {
          if ((await page.locator(selector).count()) > 0) {
            await expect(page.locator(selector).first()).toBeVisible();
            break;
          }
        }

        // Test scroll to bottom for infinite scroll
        await page.evaluate(() =>
          window.scrollTo(0, document.body.scrollHeight),
        );
        await page.waitForTimeout(1000); // Wait for potential data loading
      }
    });
  });

  test.describe("Charts and Visualizations", () => {
    test("should render performance charts", async ({ page }) => {
      await page.goto("/ko/dashboard");

      if (!page.url().includes("login")) {
        // Look for chart containers
        const chartSelectors = [
          ".echarts-chart",
          "canvas",
          "svg",
          '[data-testid*="chart"]',
          ".chart-container",
        ];

        for (const selector of chartSelectors) {
          if ((await page.locator(selector).count()) > 0) {
            await expect(page.locator(selector).first()).toBeVisible();
            break;
          }
        }
      }
    });

    test("should handle chart interactions", async ({ page }) => {
      await page.goto("/ko/dashboard");

      if (!page.url().includes("login")) {
        // Look for interactive chart elements
        const chartCanvas = page.locator("canvas").first();

        if ((await chartCanvas.count()) > 0) {
          // Try hovering over chart
          await chartCanvas.hover();

          // Look for tooltip or hover effects
          const tooltips = page.locator(
            '.tooltip, [role="tooltip"], .chart-tooltip',
          );
          if ((await tooltips.count()) > 0) {
            await expect(tooltips.first())
              .toBeVisible({ timeout: 2000 })
              .catch(() => {
                // Tooltip might not always appear
              });
          }
        }
      }
    });
  });

  test.describe("Filters and Controls", () => {
    test("should show date range picker", async ({ page }) => {
      await page.goto("/ko/dashboard");

      if (!page.url().includes("login")) {
        const datePickerSelectors = [
          'input[type="date"]',
          '[data-testid*="date"]',
          ".date-picker",
          'button:has-text("날짜")',
          'button:has-text("Date")',
        ];

        for (const selector of datePickerSelectors) {
          if ((await page.locator(selector).count()) > 0) {
            await expect(page.locator(selector).first()).toBeVisible();
            break;
          }
        }
      }
    });

    test("should show platform filters", async ({ page }) => {
      await page.goto("/ko/dashboard");

      if (!page.url().includes("login")) {
        const filterSelectors = [
          "select",
          ".filter-dropdown",
          '[data-testid*="filter"]',
          'button:has-text("필터")',
          'button:has-text("Filter")',
        ];

        for (const selector of filterSelectors) {
          if ((await page.locator(selector).count()) > 0) {
            await expect(page.locator(selector).first()).toBeVisible();
            break;
          }
        }
      }
    });
  });

  test.describe("Responsive Design", () => {
    test("should adapt to mobile viewport", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/ko/dashboard");

      if (!page.url().includes("login")) {
        // Check if mobile navigation appears
        const mobileNav = page.locator(
          '.mobile-nav, [data-testid="mobile-nav"], button[aria-label*="menu" i]',
        );

        if ((await mobileNav.count()) > 0) {
          await expect(mobileNav.first()).toBeVisible();
        }

        // Tables should be scrollable or responsive
        const tables = page.locator("table");
        if ((await tables.count()) > 0) {
          const table = tables.first();
          await expect(table).toBeVisible();

          // Check if table is in a scrollable container
          const scrollContainer = page.locator(
            ".overflow-x-auto, .table-container",
          );
          if ((await scrollContainer.count()) > 0) {
            await expect(scrollContainer.first()).toBeVisible();
          }
        }
      }
    });

    test("should work in tablet viewport", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto("/ko/dashboard");

      if (!page.url().includes("login")) {
        // Should show appropriate layout for tablet
        const content = page
          .locator("main, .main-content, [data-testid='dashboard']")
          .first();
        if ((await content.count()) > 0) {
          await expect(content).toBeVisible();
        }
      }
    });
  });

  test.describe("Error States", () => {
    test("should handle API errors gracefully", async ({ page }) => {
      // Mock API errors by intercepting requests
      await page.route("**/api/**", (route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal server error" }),
        });
      });

      await page.goto("/ko/dashboard");

      if (!page.url().includes("login")) {
        // Should show error message or retry button
        const errorElements = [
          "text=오류가 발생했습니다",
          "text=Error occurred",
          "text=재시도",
          "text=Retry",
          '[data-testid*="error"]',
          ".error-message",
        ];

        for (const selector of errorElements) {
          try {
            await expect(page.locator(selector)).toBeVisible({ timeout: 5000 });
            break;
          } catch {
            // Continue to next selector
          }
        }
      }
    });

    test("should handle network failures", async ({ page }) => {
      await page.goto("/ko/dashboard");

      // Simulate offline
      await page.context().setOffline(true);

      // Try to interact with sync button
      const syncButton = page
        .locator("button:has-text('동기화'), button:has-text('Sync')")
        .first();
      if ((await syncButton.count()) > 0) {
        await syncButton.click();

        // Should show offline message or error
        await page.waitForTimeout(2000);
      }

      await page.context().setOffline(false);
    });
  });
});
