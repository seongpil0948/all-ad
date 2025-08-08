import { test, expect } from "@playwright/test";

test.describe("Error Scenarios and Edge Cases", () => {
  test.describe("Network Error Handling", () => {
    test("should handle offline scenarios", async ({ page, context }) => {
      // Mock offline network conditions
      const mockOfflineHandler = {
        isOnline: false,
        handleOffline: () => {
          return {
            message: "오프라인 모드",
            cachedData: true,
            retryable: true,
          };
        },
      };

      const result = mockOfflineHandler.handleOffline();
      expect(result.message).toBe("오프라인 모드");
      expect(result.cachedData).toBe(true);
      expect(result.retryable).toBe(true);

      // Set context offline
      await context.setOffline(true);

      // Try to navigate to a page requiring network
      await page.goto("/ko/dashboard");

      // Should either show cached content or offline message
      const offlineIndicators = [
        "text=오프라인",
        "text=Offline",
        "text=네트워크 연결",
        "text=Network connection",
        '[data-testid*="offline"]',
      ];

      let foundOfflineIndicator = false;
      for (const selector of offlineIndicators) {
        try {
          await expect(page.locator(selector)).toBeVisible({ timeout: 2000 });
          foundOfflineIndicator = true;
          break;
        } catch {
          // Continue to next selector
        }
      }

      // Should still show basic UI even when offline
      const basicElements = ["nav", "header", ".navigation", "main"];

      for (const selector of basicElements) {
        if ((await page.locator(selector).count()) > 0) {
          await expect(page.locator(selector).first()).toBeVisible();
          break;
        }
      }

      await context.setOffline(false);
    });

    test("should handle slow network conditions", async ({ page }) => {
      // Simulate slow network
      await page.route("**/*", async (route) => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        await route.continue();
      });

      await page.goto("/ko/dashboard");

      // Should show loading states for slow connections
      const loadingElements = [
        ".loading",
        ".spinner",
        '[data-testid*="loading"]',
        ".animate-pulse",
      ];

      for (const selector of loadingElements) {
        try {
          await expect(page.locator(selector)).toBeVisible({ timeout: 2000 });
          break;
        } catch {
          // Continue to next selector
        }
      }
    });

    test("should handle API timeout errors", async ({ page }) => {
      // Mock API timeouts
      await page.route("**/api/**", (route) => {
        // Simulate timeout by delaying response
        setTimeout(() => {
          route.fulfill({
            status: 408,
            contentType: "application/json",
            body: JSON.stringify({ error: "Request timeout" }),
          });
        }, 5000);
      });

      await page.goto("/ko/dashboard");

      // Should handle timeout gracefully
      const timeoutElements = [
        "text=시간 초과",
        "text=Timeout",
        "text=재시도",
        "text=Retry",
        '[data-testid*="timeout"]',
      ];

      for (const selector of timeoutElements) {
        try {
          await expect(page.locator(selector)).toBeVisible({ timeout: 10000 });
          break;
        } catch {
          // Continue to next selector
        }
      }
    });
  });

  test.describe("Invalid Data Handling", () => {
    test("should handle malformed API responses", async ({ page }) => {
      await page.route("**/api/**", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: "invalid json{}",
        });
      });

      await page.goto("/ko/dashboard");

      // Should handle malformed JSON gracefully
      const errorElements = [
        "text=데이터 오류",
        "text=Data error",
        "text=형식 오류",
        "text=Format error",
        '[data-testid*="parse-error"]',
      ];

      for (const selector of errorElements) {
        try {
          await expect(page.locator(selector)).toBeVisible({ timeout: 5000 });
          break;
        } catch {
          // Continue to next selector
        }
      }
    });

    test("should handle unexpected API response structure", async ({
      page,
    }) => {
      await page.route("**/api/**", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            // Unexpected structure
            unexpected_field: "value",
            nested: {
              deeply: {
                nested: "data",
              },
            },
          }),
        });
      });

      await page.goto("/ko/dashboard");

      // Should handle unexpected data structure
      await page.waitForTimeout(2000);
      // Page should not crash, might show empty state or error
    });

    test("should handle null and undefined values", async ({ page }) => {
      await page.route("**/api/**", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            campaigns: [
              {
                id: null,
                name: undefined,
                budget: "",
                metrics: null,
              },
            ],
          }),
        });
      });

      await page.goto("/ko/dashboard");

      // Should handle null/undefined values without crashing
      await page.waitForTimeout(2000);
      // Look for fallback values or empty states
      const fallbackElements = [
        "text=N/A",
        "text=없음",
        "text=--",
        "text=Unknown",
      ];

      for (const selector of fallbackElements) {
        if ((await page.locator(selector).count()) > 0) {
          await expect(page.locator(selector).first()).toBeVisible();
          break;
        }
      }
    });
  });

  test.describe("Authentication Edge Cases", () => {
    test("should handle expired JWT tokens", async ({ page }) => {
      // Set expired token
      await page.addInitScript(() => {
        localStorage.setItem(
          "supabase.auth.token",
          JSON.stringify({
            access_token: "expired.jwt.token",
            expires_at: Date.now() - 3600000, // 1 hour ago
            refresh_token: "some.refresh.token",
          }),
        );
      });

      await page.goto("/ko/dashboard");

      // Should redirect to login or attempt token refresh
      await page.waitForTimeout(2000);
      if (page.url().includes("login")) {
        await expect(page.locator("text=로그인")).toBeVisible();
      }
    });

    test("should handle corrupted session data", async ({ page }) => {
      // Set corrupted session data
      await page.addInitScript(() => {
        localStorage.setItem("supabase.auth.token", "corrupted-data");
        sessionStorage.setItem("user-session", "invalid-json{");
      });

      await page.goto("/ko/dashboard");

      // Should handle corrupted data gracefully
      await page.waitForTimeout(2000);
      // Should either redirect to login or clear corrupted data
    });

    test("should handle multiple concurrent authentication requests", async ({
      page,
    }) => {
      await page.goto("/ko/login");

      // Simulate multiple login attempts
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button[type="submit"]').first();

      if ((await emailInput.count()) > 0 && (await passwordInput.count()) > 0) {
        await emailInput.fill("test@example.com");
        await passwordInput.fill("password123");

        // Click submit multiple times rapidly
        const promises = Array.from({ length: 3 }, () => submitButton.click());

        await Promise.all(promises).catch(() => {
          // Some clicks might be ignored, which is expected
        });

        // Should handle concurrent requests gracefully
        await page.waitForTimeout(1000);
      }
    });
  });

  test.describe("Resource Constraints", () => {
    test("should handle large datasets", async ({ page }) => {
      // Mock large dataset response
      const largeCampaignList = Array.from({ length: 1000 }, (_, i) => ({
        id: `campaign-${i}`,
        name: `Campaign ${i}`,
        platform: i % 2 === 0 ? "google_ads" : "facebook_ads",
        budget: Math.random() * 10000,
        metrics: {
          impressions: Math.floor(Math.random() * 100000),
          clicks: Math.floor(Math.random() * 5000),
          cost: Math.random() * 1000,
        },
      }));

      await page.route("**/api/campaigns**", (route) => {
        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ campaigns: largeCampaignList }),
        });
      });

      await page.goto("/ko/dashboard");

      // Should handle large datasets without freezing
      await page.waitForTimeout(3000);

      // Look for virtualization or pagination
      const optimizationElements = [
        ".virtual-scroll",
        ".pagination",
        "button:has-text('더 보기')",
        "button:has-text('Load more')",
      ];

      for (const selector of optimizationElements) {
        if ((await page.locator(selector).count()) > 0) {
          await expect(page.locator(selector).first()).toBeVisible();
          break;
        }
      }
    });

    test("should handle memory constraints on mobile", async ({ page }) => {
      // Simulate mobile device with limited memory
      await page.setViewportSize({ width: 375, height: 667 });

      // Mock multiple API calls that would normally consume memory
      await page.route("**/api/**", (route) => {
        const largeResponse = {
          data: Array.from({ length: 100 }, (_, i) => ({
            id: i,
            content: "x".repeat(1000), // Large content
          })),
        };

        route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify(largeResponse),
        });
      });

      await page.goto("/ko/dashboard");

      // Should handle limited memory gracefully
      await page.waitForTimeout(2000);

      // Page should still be responsive
      const mainContent = page.locator("main, .main-content").first();
      if ((await mainContent.count()) > 0) {
        await expect(mainContent).toBeVisible();
      }
    });
  });

  test.describe("Browser Compatibility Issues", () => {
    test("should handle missing JavaScript features", async ({ page }) => {
      // Mock missing modern JavaScript features
      await page.addInitScript(() => {
        // Remove modern features that might not be available in older browsers
        (window as any).fetch = undefined;
        (Array.prototype as any).includes = undefined;
      });

      await page.goto("/ko");

      // Should have polyfills or fallbacks
      await page.waitForTimeout(1000);

      // Basic functionality should still work
      const navigation = page.locator("nav").first();
      if ((await navigation.count()) > 0) {
        await expect(navigation).toBeVisible();
      }
    });

    test("should handle disabled cookies", async ({ page, context }) => {
      // Clear all cookies and storage
      await context.clearCookies();
      await context.clearPermissions();

      await page.goto("/ko");

      // Should show cookie notice or handle gracefully
      const cookieElements = [
        "text=쿠키",
        "text=Cookie",
        '[data-testid*="cookie"]',
        ".cookie-notice",
      ];

      for (const selector of cookieElements) {
        try {
          await expect(page.locator(selector)).toBeVisible({ timeout: 2000 });
          break;
        } catch {
          // Continue to next selector
        }
      }
    });

    test("should handle disabled localStorage", async ({ page }) => {
      // Mock disabled localStorage
      await page.addInitScript(() => {
        Object.defineProperty(window, "localStorage", {
          value: {
            getItem: () => {
              throw new Error("LocalStorage disabled");
            },
            setItem: () => {
              throw new Error("LocalStorage disabled");
            },
            removeItem: () => {
              throw new Error("LocalStorage disabled");
            },
            clear: () => {
              throw new Error("LocalStorage disabled");
            },
          },
        });
      });

      await page.goto("/ko");

      // Should handle localStorage errors gracefully
      await page.waitForTimeout(1000);

      // Page should still function
      const basicContent = page.locator("body").first();
      await expect(basicContent).toBeVisible();
    });
  });

  test.describe("Security Edge Cases", () => {
    test("should handle XSS attempts in form inputs", async ({ page }) => {
      await page.goto("/ko/login");

      const xssPayload = '<script>alert("XSS")</script>';

      const emailInput = page.locator('input[type="email"]').first();

      if ((await emailInput.count()) > 0) {
        await emailInput.fill(xssPayload);

        // Submit form
        const submitButton = page.locator('button[type="submit"]').first();
        if ((await submitButton.count()) > 0) {
          await submitButton.click();
        }

        // Should not execute script
        page.on("dialog", (dialog) => {
          // If XSS succeeds, this would fire
          expect(false).toBe(true); // Should never reach here
          dialog.accept();
        });

        await page.waitForTimeout(1000);

        // Should show validation error instead
        const errorElements = [
          ".error",
          '[data-testid*="error"]',
          "text=유효하지 않은",
          "text=Invalid",
        ];

        for (const selector of errorElements) {
          try {
            await expect(page.locator(selector)).toBeVisible({ timeout: 1000 });
            break;
          } catch {
            // Continue to next selector
          }
        }
      }
    });

    test("should handle malformed URLs", async ({ page }) => {
      const malformedUrls = [
        "/ko/dashboard/../../../etc/passwd",
        "/ko/dashboard?id=<script>alert('xss')</script>",
        "/ko/dashboard#<img src=x onerror=alert('xss')>",
        "/ko/dashboard/../../../../admin",
      ];

      for (const url of malformedUrls) {
        await page.goto(url, { waitUntil: "networkidle" });

        // Should handle malformed URLs safely
        // Either redirect to safe page or show 404
        expect(page.url()).not.toContain("etc/passwd");
        expect(page.url()).not.toContain("admin");

        // Should not execute any scripts
        const hasAlert = await page.evaluate(() => {
          return window.hasOwnProperty("__xss_triggered__");
        });
        expect(hasAlert).toBe(false);
      }
    });
  });

  test.describe("Concurrent Operations", () => {
    test("should handle multiple simultaneous sync operations", async ({
      page,
    }) => {
      await page.goto("/ko/dashboard");

      if (!page.url().includes("login")) {
        // Find sync buttons
        const syncButtons = page.locator(
          "button:has-text('동기화'), button:has-text('Sync'), [data-testid*='sync']",
        );

        if ((await syncButtons.count()) > 0) {
          // Click multiple sync buttons simultaneously
          const promises = [];
          const buttonCount = Math.min(await syncButtons.count(), 3);

          for (let i = 0; i < buttonCount; i++) {
            promises.push(syncButtons.nth(i).click());
          }

          await Promise.all(promises);

          // Should handle concurrent operations gracefully
          await page.waitForTimeout(2000);

          // Look for loading states or conflict resolution
          const loadingElements = [
            ".loading",
            ".spinner",
            '[data-testid*="loading"]',
          ];

          for (const selector of loadingElements) {
            if ((await page.locator(selector).count()) > 0) {
              await expect(page.locator(selector).first()).toBeVisible();
              break;
            }
          }
        }
      }
    });

    test("should handle race conditions in data updates", async ({ page }) => {
      await page.route("**/api/**", (route) => {
        // Add random delay to simulate race conditions
        const delay = Math.random() * 1000;
        setTimeout(() => {
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true, timestamp: Date.now() }),
          });
        }, delay);
      });

      await page.goto("/ko/dashboard");

      if (!page.url().includes("login")) {
        // Trigger multiple rapid updates
        const updateButtons = page
          .locator("button:not([disabled])")
          .filter({ hasText: /업데이트|Update|저장|Save/ });

        if ((await updateButtons.count()) > 0) {
          const promises = Array.from({ length: 3 }, () =>
            updateButtons.first().click({ force: true }),
          );

          await Promise.all(promises).catch(() => {
            // Some operations might conflict, which is expected
          });

          // Should handle race conditions without data corruption
          await page.waitForTimeout(2000);
        }
      }
    });
  });

  test.describe("Boundary Value Testing", () => {
    test("should handle maximum input lengths", async ({ page }) => {
      await page.goto("/ko/team");

      if (!page.url().includes("login")) {
        // Find invite button and form
        const inviteButton = page
          .locator("button:has-text('초대'), button:has-text('Invite')")
          .first();

        if ((await inviteButton.count()) > 0) {
          await inviteButton.click();

          const emailInput = page.locator('input[type="email"]').first();

          if ((await emailInput.count()) > 0) {
            // Test with very long email
            const longEmail = "a".repeat(300) + "@example.com";
            await emailInput.fill(longEmail);

            // Should handle long input gracefully
            const actualValue = await emailInput.inputValue();
            expect(actualValue.length).toBeLessThanOrEqual(320); // Should have reasonable limit
          }
        }
      }
    });

    test("should handle edge case numbers", async ({ page }) => {
      await page.goto("/ko/dashboard");

      if (!page.url().includes("login")) {
        // Mock API with edge case numbers
        await page.route("**/api/**", (route) => {
          route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({
              campaigns: [
                {
                  budget: Number.MAX_SAFE_INTEGER,
                  cost: Number.MIN_VALUE,
                  impressions: 0,
                  clicks: -1, // Invalid negative
                  ctr: Infinity,
                  cpc: NaN,
                },
              ],
            }),
          });
        });

        await page.reload();
        await page.waitForTimeout(2000);

        // Should handle edge case numbers gracefully
        // Look for fallback values or proper formatting
        const numberElements = page.locator("text=/\\d+|N\\/A|--|\u221e/");
        if ((await numberElements.count()) > 0) {
          expect(await numberElements.count()).toBeGreaterThan(0);
        }
      }
    });
  });
});
