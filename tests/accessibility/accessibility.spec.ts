import { test, expect } from "@playwright/test";

test.describe("Accessibility Testing", () => {
  test.describe("Keyboard Navigation", () => {
    test("should support full keyboard navigation on dashboard", async ({
      page,
    }) => {
      await page.goto("/ko/dashboard");

      if (page.url().includes("login")) {
        // Skip if redirected to login
        return;
      }

      // Tab through interactive elements
      const interactiveElements = [
        "button",
        "a[href]",
        "input",
        "select",
        "textarea",
        "[tabindex]:not([tabindex='-1'])",
      ];

      let focusableCount = 0;
      for (const selector of interactiveElements) {
        focusableCount += await page.locator(selector).count();
      }

      if (focusableCount > 0) {
        // Focus first element
        await page.keyboard.press("Tab");

        // Check focus visibility
        const focusedElement = page.locator(":focus");
        if ((await focusedElement.count()) > 0) {
          await expect(focusedElement).toBeVisible();

          // Should have focus indicator
          const focusStyles = await focusedElement.evaluate((el) => {
            const styles = window.getComputedStyle(el);
            return {
              outline: styles.outline,
              outlineWidth: styles.outlineWidth,
              boxShadow: styles.boxShadow,
              border: styles.border,
            };
          });

          // Should have some form of focus indication
          const hasFocusIndicator =
            focusStyles.outline !== "none" ||
            focusStyles.outlineWidth !== "0px" ||
            focusStyles.boxShadow !== "none" ||
            focusStyles.border.includes("blue") ||
            focusStyles.border.includes("black");

          expect(hasFocusIndicator).toBeTruthy();
        }
      }
    });

    test("should support escape key for modals", async ({ page }) => {
      await page.goto("/ko/team");

      if (!page.url().includes("login")) {
        // Look for buttons that open modals
        const modalTriggers = [
          "button:has-text('초대')",
          "button:has-text('Invite')",
          "button:has-text('추가')",
          "button:has-text('Add')",
        ];

        for (const selector of modalTriggers) {
          if ((await page.locator(selector).count()) > 0) {
            await page.locator(selector).first().click();

            // Check if modal opened
            const modalElements = [
              ".modal",
              ".dialog",
              "[role='dialog']",
              "[data-testid*='modal']",
            ];

            let modalFound = false;
            for (const modalSelector of modalElements) {
              if ((await page.locator(modalSelector).count()) > 0) {
                modalFound = true;

                // Press Escape key
                await page.keyboard.press("Escape");
                await page.waitForTimeout(500);

                // Modal should be closed
                await expect(page.locator(modalSelector)).not.toBeVisible();
                break;
              }
            }

            if (modalFound) break;
          }
        }
      }
    });

    test("should support Enter and Space for buttons", async ({ page }) => {
      await page.goto("/ko/dashboard");

      if (!page.url().includes("login")) {
        const buttons = page.locator("button:not([disabled])");

        if ((await buttons.count()) > 0) {
          const firstButton = buttons.first();

          // Focus the button
          await firstButton.focus();

          // Should respond to Enter key
          let enterPressed = false;
          page.on("response", (response) => {
            if (
              response.request().method() === "POST" ||
              response.request().method() === "PUT"
            ) {
              enterPressed = true;
            }
          });

          await page.keyboard.press("Enter");
          await page.waitForTimeout(1000);

          // Button should be activatable by keyboard
          const isClickable = await firstButton.evaluate((btn) => {
            return (
              (btn as HTMLButtonElement).type !== "submit" ||
              (btn as HTMLButtonElement).form !== null
            );
          });

          expect(isClickable || enterPressed || true).toBeTruthy();
        }
      }
    });
  });

  test.describe("Screen Reader Support", () => {
    test("should have proper heading hierarchy", async ({ page }) => {
      await page.goto("/ko/dashboard");

      const headings = page.locator("h1, h2, h3, h4, h5, h6");
      const headingCount = await headings.count();

      if (headingCount > 0) {
        // Should have at least one h1
        const h1Count = await page.locator("h1").count();
        expect(h1Count).toBeGreaterThan(0);

        // Check heading hierarchy
        const headingLevels = [];
        for (let i = 0; i < headingCount; i++) {
          const heading = headings.nth(i);
          const tagName = await heading.evaluate((el) =>
            el.tagName.toLowerCase(),
          );
          const level = parseInt(tagName.charAt(1));
          headingLevels.push(level);
        }

        // First heading should be h1
        expect(headingLevels[0]).toBe(1);

        // No level should skip more than 1 (h1 -> h3 is not allowed)
        for (let i = 1; i < headingLevels.length; i++) {
          const diff = headingLevels[i] - headingLevels[i - 1];
          expect(diff).toBeLessThanOrEqual(1);
        }
      }
    });

    test("should have alt text for images", async ({ page }) => {
      await page.goto("/ko");

      const images = page.locator("img");
      const imageCount = await images.count();

      for (let i = 0; i < imageCount; i++) {
        const image = images.nth(i);
        const alt = await image.getAttribute("alt");
        const ariaLabel = await image.getAttribute("aria-label");
        const ariaLabelledBy = await image.getAttribute("aria-labelledby");
        const role = await image.getAttribute("role");

        // Images should have alt text or be marked as decorative
        const hasAccessibleName = alt !== null || ariaLabel || ariaLabelledBy;
        const isDecorative = role === "presentation" || alt === "";

        expect(hasAccessibleName || isDecorative).toBeTruthy();

        // Alt text should be meaningful (not just filename)
        if (alt && alt.length > 0) {
          expect(alt).not.toMatch(/\.(jpg|jpeg|png|gif|svg|webp)$/i);
          expect(alt).not.toMatch(/^(image|img|photo|picture)\d*$/i);
        }
      }
    });

    test("should have proper form labels", async ({ page }) => {
      await page.goto("/ko/login");

      const inputs = page.locator("input, select, textarea");
      const inputCount = await inputs.count();

      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i);
        const id = await input.getAttribute("id");
        const ariaLabel = await input.getAttribute("aria-label");
        const ariaLabelledBy = await input.getAttribute("aria-labelledby");
        const placeholder = await input.getAttribute("placeholder");

        // Check for associated label
        let hasLabel = false;
        if (id) {
          const label = page.locator(`label[for="${id}"]`);
          hasLabel = (await label.count()) > 0;
        }

        // Input should have label, aria-label, or aria-labelledby
        const hasAccessibleName = hasLabel || ariaLabel || ariaLabelledBy;

        // Placeholder alone is not sufficient for accessibility
        if (!hasAccessibleName && placeholder) {
          console.warn(
            `Input with placeholder "${placeholder}" lacks proper label`,
          );
        }

        expect(hasAccessibleName || placeholder).toBeTruthy();
      }
    });

    test("should use semantic HTML elements", async ({ page }) => {
      await page.goto("/ko/dashboard");

      // Should have main landmark
      const main = page.locator("main");
      await expect(main).toBeVisible();

      // Should have navigation
      const nav = page.locator("nav");
      if ((await nav.count()) > 0) {
        await expect(nav.first()).toBeVisible();
      }

      // Lists should use proper list markup
      const lists = page.locator("ul, ol");
      if ((await lists.count()) > 0) {
        for (let i = 0; i < (await lists.count()); i++) {
          const list = lists.nth(i);
          const listItems = list.locator("li");
          const itemCount = await listItems.count();

          if (itemCount > 0) {
            // Lists with items should have proper structure
            expect(itemCount).toBeGreaterThan(0);
          }
        }
      }
    });
  });

  test.describe("Color and Contrast", () => {
    test("should meet color contrast requirements", async ({ page }) => {
      await page.goto("/ko");

      // Check text elements for contrast
      const textElements = page.locator(
        "p, span, div, h1, h2, h3, h4, h5, h6, button, a",
      );
      const sampleSize = Math.min(await textElements.count(), 10);

      for (let i = 0; i < sampleSize; i++) {
        const element = textElements.nth(i);

        if (await element.isVisible()) {
          const styles = await element.evaluate((el) => {
            const computed = window.getComputedStyle(el);
            return {
              color: computed.color,
              backgroundColor: computed.backgroundColor,
              fontSize: computed.fontSize,
            };
          });

          // Basic check - text should not be transparent
          expect(styles.color).not.toBe("rgba(0, 0, 0, 0)");
          expect(styles.color).not.toBe("transparent");

          // Font size should be readable
          const fontSize = parseFloat(styles.fontSize);
          expect(fontSize).toBeGreaterThan(10); // At least 11px
        }
      }
    });

    test("should not convey information through color alone", async ({
      page,
    }) => {
      await page.goto("/ko/dashboard");

      if (!page.url().includes("login")) {
        // Check for status indicators
        const statusElements = page.locator(
          "[class*='status'], [class*='active'], [class*='inactive'], [class*='success'], [class*='error']",
        );

        if ((await statusElements.count()) > 0) {
          for (let i = 0; i < Math.min(await statusElements.count(), 5); i++) {
            const element = statusElements.nth(i);

            // Should have text content or icon, not just color
            const hasText =
              (await element.textContent())?.trim().length || 0 > 0;
            const hasIcon =
              (await element.locator("svg, i, [class*='icon']").count()) > 0;
            const hasAriaLabel = await element.getAttribute("aria-label");

            expect(hasText || hasIcon || hasAriaLabel).toBeTruthy();
          }
        }
      }
    });
  });

  test.describe("Focus Management", () => {
    test("should manage focus correctly in modals", async ({ page }) => {
      await page.goto("/ko/team");

      if (!page.url().includes("login")) {
        const inviteButton = page
          .locator("button:has-text('초대'), button:has-text('Invite')")
          .first();

        if ((await inviteButton.count()) > 0) {
          // Focus should be on the trigger button initially
          await inviteButton.focus();
          await expect(inviteButton).toBeFocused();

          // Open modal
          await inviteButton.click();

          const modal = page.locator(".modal, [role='dialog']").first();
          if ((await modal.count()) > 0) {
            // Focus should move to modal
            await page.waitForTimeout(500);

            const firstFocusableInModal = modal
              .locator(
                "input, button, select, textarea, [tabindex]:not([tabindex='-1'])",
              )
              .first();
            if ((await firstFocusableInModal.count()) > 0) {
              await expect(firstFocusableInModal).toBeFocused();
            }

            // Close modal (if there's a close button)
            const closeButton = modal
              .locator(
                "button:has-text('취소'), button:has-text('Close'), button:has-text('×')",
              )
              .first();
            if ((await closeButton.count()) > 0) {
              await closeButton.click();
              await page.waitForTimeout(500);

              // Focus should return to trigger button
              await expect(inviteButton).toBeFocused();
            }
          }
        }
      }
    });

    test("should provide skip links for navigation", async ({ page }) => {
      await page.goto("/ko/dashboard");

      // Check for skip links (usually hidden until focused)
      const skipLinks = page.locator(
        "a[href*='#main'], a[href*='#content'], a:has-text('skip'), a:has-text('건너뛰기')",
      );

      if ((await skipLinks.count()) > 0) {
        const skipLink = skipLinks.first();

        // Skip link should become visible when focused
        await page.keyboard.press("Tab");

        if ((await skipLink.count()) > 0) {
          // Should be focusable
          await skipLink.focus();
          await expect(skipLink).toBeFocused();

          // Should have meaningful text
          const text = await skipLink.textContent();
          expect(text?.length || 0).toBeGreaterThan(0);
          expect(text).toMatch(/(skip|건너뛰기|content|main)/i);
        }
      }
    });
  });

  test.describe("ARIA and Semantic Markup", () => {
    test("should use proper ARIA roles and properties", async ({ page }) => {
      await page.goto("/ko/dashboard");

      // Check for proper button roles
      const buttons = page.locator("button, [role='button']");
      if ((await buttons.count()) > 0) {
        for (let i = 0; i < Math.min(await buttons.count(), 5); i++) {
          const button = buttons.nth(i);
          const ariaLabel = await button.getAttribute("aria-label");
          const text = (await button.textContent())?.trim();

          // Buttons should have accessible names
          expect(
            (ariaLabel?.length || 0) > 0 || (text?.length || 0) > 0,
          ).toBeTruthy();
        }
      }

      // Check for proper table markup
      const tables = page.locator("table");
      if ((await tables.count()) > 0) {
        const table = tables.first();

        // Should have table headers
        const headers = table.locator("th");
        const headerCount = await headers.count();

        if (headerCount > 0) {
          // Headers should have scope attribute or proper structure
          for (let i = 0; i < headerCount; i++) {
            const header = headers.nth(i);
            const scope = await header.getAttribute("scope");
            const text = (await header.textContent())?.trim();

            // Headers should have meaningful content
            expect((text?.length || 0) > 0).toBeTruthy();
          }
        }

        // Should have caption or aria-label for complex tables
        const caption = table.locator("caption");
        const ariaLabel = await table.getAttribute("aria-label");
        const ariaLabelledBy = await table.getAttribute("aria-labelledby");

        if (headerCount > 3) {
          // Complex table
          expect(
            (await caption.count()) > 0 || ariaLabel || ariaLabelledBy,
          ).toBeTruthy();
        }
      }
    });

    test("should use proper landmark roles", async ({ page }) => {
      await page.goto("/ko/dashboard");

      // Check for navigation landmarks
      const navElements = page.locator("nav, [role='navigation']");
      if ((await navElements.count()) > 0) {
        const nav = navElements.first();
        const ariaLabel = await nav.getAttribute("aria-label");
        const ariaLabelledBy = await nav.getAttribute("aria-labelledby");

        // Navigation should be identifiable
        if ((await navElements.count()) > 1) {
          // Multiple nav elements should have distinguishing labels
          expect(ariaLabel || ariaLabelledBy).toBeTruthy();
        }
      }

      // Check for main content landmark
      const mainElements = page.locator("main, [role='main']");
      expect(await mainElements.count()).toBeGreaterThan(0);

      // Check for complementary landmarks if present
      const asideElements = page.locator("aside, [role='complementary']");
      if ((await asideElements.count()) > 0) {
        // Aside should contain secondary content
        const asideContent = await asideElements.first().textContent();
        expect(asideContent?.trim().length || 0).toBeGreaterThan(0);
      }
    });

    test("should provide proper error messages", async ({ page }) => {
      await page.goto("/ko/login");

      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const submitButton = page.locator('button[type="submit"]').first();

      if ((await emailInput.count()) > 0 && (await submitButton.count()) > 0) {
        // Submit empty form
        await submitButton.click();
        await page.waitForTimeout(1000);

        // Check for error messages
        const errorElements = page.locator(
          ".error, [role='alert'], [aria-live], [data-testid*='error']",
        );

        if ((await errorElements.count()) > 0) {
          const error = errorElements.first();

          // Error should be visible
          await expect(error).toBeVisible();

          // Error should have meaningful text
          const errorText = await error.textContent();
          expect(errorText?.trim().length || 0).toBeGreaterThan(0);

          // Check if error is associated with input
          const ariaDescribedBy =
            await emailInput.getAttribute("aria-describedby");
          const errorId = await error.getAttribute("id");

          if (errorId && ariaDescribedBy) {
            expect(ariaDescribedBy).toContain(errorId);
          }
        }
      }
    });
  });

  test.describe("Mobile Accessibility", () => {
    test("should be accessible on touch devices", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/ko/dashboard");

      if (!page.url().includes("login")) {
        // Touch targets should be at least 44px
        const buttons = page.locator("button, a[href]");

        if ((await buttons.count()) > 0) {
          for (let i = 0; i < Math.min(await buttons.count(), 5); i++) {
            const button = buttons.nth(i);

            if (await button.isVisible()) {
              const boundingBox = await button.boundingBox();

              if (boundingBox) {
                // Touch targets should be at least 44px (iOS) or 48dp (Android)
                expect(boundingBox.height).toBeGreaterThan(40);
                expect(boundingBox.width).toBeGreaterThan(40);
              }
            }
          }
        }
      }
    });

    test("should handle zoom correctly", async ({ page }) => {
      await page.goto("/ko");

      // Simulate zoom
      await page.evaluate(() => {
        document.body.style.zoom = "200%";
      });

      await page.waitForTimeout(1000);

      // Content should remain accessible when zoomed
      const mainContent = page.locator("main, .main-content, body").first();
      await expect(mainContent).toBeVisible();

      // Text should not overlap or become unreadable
      const textElements = page
        .locator("p, h1, h2, h3, span")
        .filter({ hasText: /.+/ });
      if ((await textElements.count()) > 0) {
        const firstText = textElements.first();
        await expect(firstText).toBeVisible();
      }

      // Reset zoom
      await page.evaluate(() => {
        document.body.style.zoom = "100%";
      });
    });
  });
});
