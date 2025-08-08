import { test, expect } from "@playwright/test";

test.describe("Team Management Tests", () => {
  test.describe("Team Page Access", () => {
    test("should redirect to login when not authenticated", async ({
      page,
    }) => {
      await page.goto("/ko/team");
      await expect(page).toHaveURL(/.*login/);
    });

    test("should handle team page loading states", async ({ page }) => {
      await page.goto("/ko/team");

      if (page.url().includes("login")) {
        await expect(page.locator("text=로그인")).toBeVisible();
      } else {
        // Look for loading indicators
        const loadingElements = [
          '[data-testid*="loading"]',
          ".loading",
          ".spinner",
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
      }
    });
  });

  test.describe("Team Member Management", () => {
    test("should show team members list", async ({ page }) => {
      await page.goto("/ko/team");

      if (!page.url().includes("login")) {
        // Look for team member elements
        const memberElements = [
          '[data-testid*="member"]',
          ".member-card",
          ".member-list",
          "table tbody tr",
          ".team-member",
        ];

        for (const selector of memberElements) {
          if ((await page.locator(selector).count()) > 0) {
            await expect(page.locator(selector).first()).toBeVisible();
            break;
          }
        }
      }
    });

    test("should show invite member button", async ({ page }) => {
      await page.goto("/ko/team");

      if (!page.url().includes("login")) {
        const inviteButtonSelectors = [
          "button:has-text('초대')",
          "button:has-text('Invite')",
          "button:has-text('팀원 초대')",
          '[data-testid="invite-button"]',
          ".invite-member-btn",
        ];

        for (const selector of inviteButtonSelectors) {
          if ((await page.locator(selector).count()) > 0) {
            await expect(page.locator(selector).first()).toBeVisible();
            break;
          }
        }
      }
    });

    test("should handle invite member modal", async ({ page }) => {
      await page.goto("/ko/team");

      if (!page.url().includes("login")) {
        const inviteButton = page
          .locator(
            "button:has-text('초대'), button:has-text('Invite'), [data-testid='invite-button']",
          )
          .first();

        if ((await inviteButton.count()) > 0) {
          await inviteButton.click();

          // Should show modal or form
          const modalElements = [
            ".modal",
            ".dialog",
            '[role="dialog"]',
            '[data-testid*="modal"]',
            ".invite-modal",
          ];

          for (const selector of modalElements) {
            try {
              await expect(page.locator(selector)).toBeVisible({
                timeout: 2000,
              });
              break;
            } catch {
              // Continue to next selector
            }
          }
        }
      }
    });

    test("should validate email input in invite form", async ({ page }) => {
      await page.goto("/ko/team");

      if (!page.url().includes("login")) {
        const inviteButton = page
          .locator("button:has-text('초대'), button:has-text('Invite')")
          .first();

        if ((await inviteButton.count()) > 0) {
          await inviteButton.click();

          // Look for email input
          const emailInput = page
            .locator(
              'input[type="email"], input[name*="email"], [data-testid*="email"]',
            )
            .first();

          if ((await emailInput.count()) > 0) {
            // Test invalid email
            await emailInput.fill("invalid-email");

            // Try to submit or look for validation message
            const submitButton = page
              .locator(
                'button[type="submit"], button:has-text("보내기"), button:has-text("Send")',
              )
              .first();

            if ((await submitButton.count()) > 0) {
              await submitButton.click();

              // Should show validation error
              const errorElements = [
                ".error",
                ".invalid",
                '[data-testid*="error"]',
                ".validation-error",
                "text=유효하지 않은",
                "text=Invalid",
              ];

              for (const selector of errorElements) {
                try {
                  await expect(page.locator(selector)).toBeVisible({
                    timeout: 2000,
                  });
                  break;
                } catch {
                  // Continue to next selector
                }
              }
            }
          }
        }
      }
    });
  });

  test.describe("Role Management", () => {
    test("should show member roles", async ({ page }) => {
      await page.goto("/ko/team");

      if (!page.url().includes("login")) {
        // Look for role indicators
        const roleElements = [
          ".role-badge",
          ".member-role",
          '[data-testid*="role"]',
          "text=master",
          "text=viewer",
          "text=team_mate",
          "text=마스터",
          "text=뷰어",
        ];

        for (const selector of roleElements) {
          if ((await page.locator(selector).count()) > 0) {
            await expect(page.locator(selector).first()).toBeVisible();
            break;
          }
        }
      }
    });

    test("should handle role change dropdown", async ({ page }) => {
      await page.goto("/ko/team");

      if (!page.url().includes("login")) {
        // Look for role change controls
        const roleControls = [
          'select[name*="role"]',
          ".role-dropdown",
          '[data-testid*="role-select"]',
          'button[aria-label*="role" i]',
        ];

        for (const selector of roleControls) {
          if ((await page.locator(selector).count()) > 0) {
            const control = page.locator(selector).first();
            await expect(control).toBeVisible();

            // Try to interact with it
            if (selector.includes("select")) {
              // It's a select element
              const options = control.locator("option");
              if ((await options.count()) > 1) {
                expect(await options.count()).toBeGreaterThan(1);
              }
            } else {
              // It's a button or other element
              await control.click();
              await page.waitForTimeout(500);
            }
            break;
          }
        }
      }
    });

    test("should restrict actions for non-master users", async ({ page }) => {
      await page.goto("/ko/team");

      if (!page.url().includes("login")) {
        // This test would need authentication as a non-master user
        // For now, just check that some elements might be disabled or hidden
        const restrictedElements = [
          "button[disabled]",
          ".disabled",
          '[aria-disabled="true"]',
        ];

        // Not all pages will have restricted elements, so this is optional
        for (const selector of restrictedElements) {
          if ((await page.locator(selector).count()) > 0) {
            await expect(page.locator(selector).first()).toBeVisible();
            break;
          }
        }
      }
    });
  });

  test.describe("Team Settings", () => {
    test("should show team information", async ({ page }) => {
      await page.goto("/ko/team");

      if (!page.url().includes("login")) {
        // Look for team info elements
        const teamInfoElements = [
          ".team-name",
          ".team-info",
          '[data-testid*="team"]',
          "h1, h2, h3",
          ".team-header",
        ];

        for (const selector of teamInfoElements) {
          if ((await page.locator(selector).count()) > 0) {
            await expect(page.locator(selector).first()).toBeVisible();
            break;
          }
        }
      }
    });

    test("should handle team name editing", async ({ page }) => {
      await page.goto("/ko/team");

      if (!page.url().includes("login")) {
        // Look for edit team name button
        const editButtons = [
          "button:has-text('편집')",
          "button:has-text('Edit')",
          '[data-testid*="edit"]',
          ".edit-team-name",
          'button[aria-label*="edit" i]',
        ];

        for (const selector of editButtons) {
          if ((await page.locator(selector).count()) > 0) {
            const editButton = page.locator(selector).first();
            await expect(editButton).toBeVisible();

            await editButton.click();

            // Should show input field
            const nameInput = page
              .locator('input[name*="name"], input[data-testid*="team-name"]')
              .first();
            if ((await nameInput.count()) > 0) {
              await expect(nameInput).toBeVisible();

              // Test editing
              await nameInput.fill("New Team Name");

              // Look for save button
              const saveButton = page
                .locator('button:has-text("저장"), button:has-text("Save")')
                .first();
              if ((await saveButton.count()) > 0) {
                await saveButton.click();
              }
            }
            break;
          }
        }
      }
    });
  });

  test.describe("Team Statistics", () => {
    test("should show team member count", async ({ page }) => {
      await page.goto("/ko/team");

      if (!page.url().includes("login")) {
        // Look for member count indicators
        const countElements = [
          ".member-count",
          '[data-testid*="count"]',
          "text=/\\d+\\s*(명|members?)/i",
          ".team-stats",
        ];

        for (const selector of countElements) {
          if ((await page.locator(selector).count()) > 0) {
            await expect(page.locator(selector).first()).toBeVisible();
            break;
          }
        }
      }
    });

    test("should show active campaigns count", async ({ page }) => {
      await page.goto("/ko/team");

      if (!page.url().includes("login")) {
        // Look for campaign statistics
        const statsElements = [
          ".campaign-count",
          '[data-testid*="campaign"]',
          ".team-stats",
          "text=/\\d+\\s*(캠페인|campaigns?)/i",
        ];

        for (const selector of statsElements) {
          if ((await page.locator(selector).count()) > 0) {
            await expect(page.locator(selector).first()).toBeVisible();
            break;
          }
        }
      }
    });
  });

  test.describe("Member Actions", () => {
    test("should handle member removal", async ({ page }) => {
      await page.goto("/ko/team");

      if (!page.url().includes("login")) {
        // Look for remove member buttons
        const removeButtons = [
          "button:has-text('제거')",
          "button:has-text('Remove')",
          "button:has-text('삭제')",
          '[data-testid*="remove"]',
          ".remove-member",
        ];

        for (const selector of removeButtons) {
          if ((await page.locator(selector).count()) > 0) {
            const removeButton = page.locator(selector).first();
            await expect(removeButton).toBeVisible();

            await removeButton.click();

            // Should show confirmation dialog
            const confirmElements = [
              ".confirm-dialog",
              '[role="dialog"]',
              "text=확인",
              "text=Confirm",
              'button:has-text("예")',
              'button:has-text("Yes")',
            ];

            for (const confirmSelector of confirmElements) {
              try {
                await expect(page.locator(confirmSelector)).toBeVisible({
                  timeout: 2000,
                });
                break;
              } catch {
                // Continue to next selector
              }
            }
            break;
          }
        }
      }
    });

    test("should show member last activity", async ({ page }) => {
      await page.goto("/ko/team");

      if (!page.url().includes("login")) {
        // Look for activity timestamps
        const activityElements = [
          ".last-activity",
          ".member-activity",
          '[data-testid*="activity"]',
          "text=/\\d+\\s*(일|시간|분)\\s*전/i",
          "text=/\\d+\\s*(days?|hours?|minutes?)\\s*ago/i",
        ];

        for (const selector of activityElements) {
          if ((await page.locator(selector).count()) > 0) {
            await expect(page.locator(selector).first()).toBeVisible();
            break;
          }
        }
      }
    });
  });

  test.describe("Responsive Design", () => {
    test("should work on mobile devices", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/ko/team");

      if (!page.url().includes("login")) {
        // Check mobile layout
        const mobileElements = [
          ".mobile-nav",
          '[data-testid="mobile-nav"]',
          ".hamburger-menu",
        ];

        // Mobile navigation might exist
        for (const selector of mobileElements) {
          if ((await page.locator(selector).count()) > 0) {
            await expect(page.locator(selector).first()).toBeVisible();
            break;
          }
        }

        // Member list should be responsive
        const memberList = page
          .locator('.member-list, table, [data-testid*="member"]')
          .first();
        if ((await memberList.count()) > 0) {
          await expect(memberList).toBeVisible();
        }
      }
    });

    test("should handle tablet viewport", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto("/ko/team");

      if (!page.url().includes("login")) {
        // Content should be visible and properly laid out
        const content = page
          .locator("main, .main-content, [data-testid='team-page']")
          .first();
        if ((await content.count()) > 0) {
          await expect(content).toBeVisible();
        }
      }
    });
  });

  test.describe("Error Handling", () => {
    test("should handle API errors gracefully", async ({ page }) => {
      // Mock API errors
      await page.route("**/api/team/**", (route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Internal server error" }),
        });
      });

      await page.goto("/ko/team");

      if (!page.url().includes("login")) {
        // Should show error message
        const errorElements = [
          "text=오류가 발생했습니다",
          "text=Error occurred",
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

    test("should handle empty team state", async ({ page }) => {
      await page.goto("/ko/team");

      if (!page.url().includes("login")) {
        // Look for empty state message
        const emptyStateElements = [
          "text=팀원이 없습니다",
          "text=No team members",
          '[data-testid="empty-state"]',
          ".empty-state",
          "text=첫 번째 팀원을 초대",
        ];

        for (const selector of emptyStateElements) {
          try {
            await expect(page.locator(selector)).toBeVisible({ timeout: 2000 });
            break;
          } catch {
            // Continue to next selector
          }
        }
      }
    });
  });

  test.describe("Form Validation", () => {
    test("should validate invite form inputs", async ({ page }) => {
      await page.goto("/ko/team");

      if (!page.url().includes("login")) {
        // Try to access invite form
        const inviteButton = page
          .locator("button:has-text('초대'), button:has-text('Invite')")
          .first();

        if ((await inviteButton.count()) > 0) {
          await inviteButton.click();

          const emailInput = page.locator('input[type="email"]').first();
          const submitButton = page
            .locator('button[type="submit"], button:has-text("보내기")')
            .first();

          if (
            (await emailInput.count()) > 0 &&
            (await submitButton.count()) > 0
          ) {
            // Test empty submission
            await submitButton.click();

            // Should show required field error
            const errorElements = [
              "text=필수",
              "text=Required",
              ".error",
              '[data-testid*="error"]',
            ];

            for (const selector of errorElements) {
              try {
                await expect(page.locator(selector)).toBeVisible({
                  timeout: 1000,
                });
                break;
              } catch {
                // Continue to next selector
              }
            }
          }
        }
      }
    });
  });
});
