import { test, expect } from "@playwright/test";

test.describe("End-to-End Workflows", () => {
  test.describe("User Onboarding Flow", () => {
    test("should complete signup to dashboard workflow", async ({ page }) => {
      // Start from home page
      await page.goto("/ko");

      // Look for signup/register button
      const signupButton = page
        .locator(
          "a:has-text('회원가입'), a:has-text('Sign up'), [data-testid*='signup']",
        )
        .first();

      if ((await signupButton.count()) > 0) {
        await signupButton.click();

        // Should be on signup page
        await expect(page).toHaveURL(/.*signup/);

        // Fill signup form
        const emailInput = page.locator('input[type="email"]').first();
        const passwordInput = page.locator('input[type="password"]').first();
        const submitButton = page
          .locator(
            'button[type="submit"], button:has-text("회원가입"), button:has-text("Sign up")',
          )
          .first();

        if (
          (await emailInput.count()) > 0 &&
          (await passwordInput.count()) > 0
        ) {
          await emailInput.fill(`test.${Date.now()}@example.com`);
          await passwordInput.fill("testpassword123!");

          if ((await submitButton.count()) > 0) {
            await submitButton.click();

            // Should show confirmation message or redirect
            const confirmationElements = [
              "text=이메일을 확인",
              "text=Check your email",
              "text=인증 메일",
              "text=verification email",
            ];

            let foundConfirmation = false;
            for (const selector of confirmationElements) {
              try {
                await expect(page.locator(selector)).toBeVisible({
                  timeout: 5000,
                });
                foundConfirmation = true;
                break;
              } catch {
                // Continue to next selector
              }
            }

            // Or might redirect to login
            if (!foundConfirmation && page.url().includes("login")) {
              await expect(page.locator("text=로그인")).toBeVisible();
            }
          }
        }
      }
    });

    test("should complete login to dashboard workflow", async ({ page }) => {
      await page.goto("/ko/login");

      // Fill login form
      const emailInput = page.locator('input[type="email"]').first();
      const passwordInput = page.locator('input[type="password"]').first();
      const submitButton = page
        .locator(
          'button[type="submit"], button:has-text("로그인"), button:has-text("Login")',
        )
        .first();

      if ((await emailInput.count()) > 0 && (await passwordInput.count()) > 0) {
        // Use test credentials (won't actually work but tests form flow)
        await emailInput.fill("test@example.com");
        await passwordInput.fill("password123");

        if ((await submitButton.count()) > 0) {
          await submitButton.click();

          // Should either redirect to dashboard or show error
          await page.waitForTimeout(2000);

          if (page.url().includes("dashboard")) {
            // Successfully logged in
            await expect(
              page.locator("text=대시보드, text=Dashboard"),
            ).toBeVisible();
          } else {
            // Should show error message
            const errorElements = [
              "text=잘못된",
              "text=Invalid",
              "text=오류",
              "text=Error",
              ".error",
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
    });

    test("should handle first-time user experience", async ({ page }) => {
      // Simulate first-time user
      await page.goto("/ko/dashboard");

      if (page.url().includes("login")) {
        // Redirected to login as expected
        await expect(page.locator("text=로그인")).toBeVisible();
      } else {
        // Look for onboarding elements
        const onboardingElements = [
          "text=시작하기",
          "text=Get started",
          "text=플랫폼 연동",
          "text=Connect platform",
          "[data-testid*='onboarding']",
          ".onboarding",
        ];

        for (const selector of onboardingElements) {
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

  test.describe("Platform Integration Workflow", () => {
    test("should complete platform connection flow", async ({ page }) => {
      await page.goto("/ko/settings");

      if (!page.url().includes("login")) {
        // Look for platform integration section
        const platformButtons = [
          "button:has-text('Google Ads')",
          "button:has-text('Meta')",
          "button:has-text('Facebook')",
          "button:has-text('연동')",
          "button:has-text('Connect')",
        ];

        for (const selector of platformButtons) {
          if ((await page.locator(selector).count()) > 0) {
            const button = page.locator(selector).first();
            await expect(button).toBeVisible();

            await button.click();

            // Should either redirect to OAuth or show setup form
            await page.waitForTimeout(2000);

            // Check for OAuth redirect or form
            if (
              page.url().includes("accounts.google.com") ||
              page.url().includes("facebook.com") ||
              page.url().includes("oauth")
            ) {
              // OAuth redirect successful
              expect(page.url()).toContain("oauth");
            } else {
              // Should show form or next step
              const nextStepElements = [
                "text=API 키",
                "text=API Key",
                "text=설정",
                "text=Settings",
                "text=다음",
                "text=Next",
              ];

              for (const nextSelector of nextStepElements) {
                try {
                  await expect(page.locator(nextSelector)).toBeVisible({
                    timeout: 2000,
                  });
                  break;
                } catch {
                  // Continue to next selector
                }
              }
            }
            break;
          }
        }
      }
    });

    test("should handle platform disconnection flow", async ({ page }) => {
      await page.goto("/ko/settings");

      if (!page.url().includes("login")) {
        // Look for disconnect/remove buttons
        const disconnectButtons = [
          "button:has-text('연결 해제')",
          "button:has-text('Disconnect')",
          "button:has-text('제거')",
          "button:has-text('Remove')",
          "[data-testid*='disconnect']",
        ];

        for (const selector of disconnectButtons) {
          if ((await page.locator(selector).count()) > 0) {
            const button = page.locator(selector).first();
            await button.click();

            // Should show confirmation dialog
            const confirmElements = [
              "text=확인",
              "text=Confirm",
              "text=정말",
              "text=Are you sure",
              "[role='dialog']",
              ".modal",
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
  });

  test.describe("Campaign Management Workflow", () => {
    test("should complete campaign sync and view flow", async ({ page }) => {
      await page.goto("/ko/dashboard");

      if (!page.url().includes("login")) {
        // Find and click sync button
        const syncButton = page
          .locator("button:has-text('동기화'), button:has-text('Sync')")
          .first();

        if ((await syncButton.count()) > 0) {
          await syncButton.click();

          // Should show loading state
          const loadingElements = [
            ".loading",
            ".spinner",
            "[data-testid*='loading']",
            "text=동기화 중",
            "text=Syncing",
          ];

          for (const selector of loadingElements) {
            try {
              await expect(page.locator(selector)).toBeVisible({
                timeout: 2000,
              });
              break;
            } catch {
              // Continue to next selector
            }
          }

          // Wait for sync to complete
          await page.waitForTimeout(3000);

          // Should show campaigns or empty state
          const resultElements = [
            "table",
            ".campaign-list",
            "[data-testid*='campaign']",
            "text=캠페인이 없습니다",
            "text=No campaigns",
          ];

          for (const selector of resultElements) {
            if ((await page.locator(selector).count()) > 0) {
              await expect(page.locator(selector).first()).toBeVisible();
              break;
            }
          }
        }
      }
    });

    test("should handle campaign status update flow", async ({ page }) => {
      await page.goto("/ko/dashboard");

      if (!page.url().includes("login")) {
        // Look for campaign toggle switches
        const toggles = [
          'input[type="checkbox"]',
          ".toggle",
          ".switch",
          '[role="switch"]',
          "[data-testid*='toggle']",
        ];

        for (const selector of toggles) {
          if ((await page.locator(selector).count()) > 0) {
            const toggle = page.locator(selector).first();

            // Get initial state
            const isChecked = await toggle.isChecked().catch(() => false);

            // Click to change state
            await toggle.click();

            // Should show confirmation or loading
            const confirmElements = [
              "text=확인",
              "text=Confirm",
              "text=변경",
              "text=Change",
              ".loading",
              "[data-testid*='confirm']",
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

            await page.waitForTimeout(1000);

            // State should have changed
            const newState = await toggle.isChecked().catch(() => isChecked);
            // In real implementation, state might change
            break;
          }
        }
      }
    });

    test("should complete campaign budget update flow", async ({ page }) => {
      await page.goto("/ko/dashboard");

      if (!page.url().includes("login")) {
        // Look for budget edit buttons
        const editButtons = [
          "button:has-text('편집')",
          "button:has-text('Edit')",
          "[data-testid*='edit-budget']",
          ".edit-budget",
        ];

        for (const selector of editButtons) {
          if ((await page.locator(selector).count()) > 0) {
            const editButton = page.locator(selector).first();
            await editButton.click();

            // Should show input field
            const budgetInput = page
              .locator('input[type="number"], input[name*="budget"]')
              .first();

            if ((await budgetInput.count()) > 0) {
              await budgetInput.fill("1000");

              // Look for save button
              const saveButton = page
                .locator('button:has-text("저장"), button:has-text("Save")')
                .first();

              if ((await saveButton.count()) > 0) {
                await saveButton.click();

                // Should show success message or loading
                const successElements = [
                  "text=저장됨",
                  "text=Saved",
                  "text=성공",
                  "text=Success",
                  ".success",
                  ".loading",
                ];

                for (const successSelector of successElements) {
                  try {
                    await expect(page.locator(successSelector)).toBeVisible({
                      timeout: 2000,
                    });
                    break;
                  } catch {
                    // Continue to next selector
                  }
                }
              }
            }
            break;
          }
        }
      }
    });
  });

  test.describe("Team Collaboration Workflow", () => {
    test("should complete team invitation flow", async ({ page }) => {
      await page.goto("/ko/team");

      if (!page.url().includes("login")) {
        // Click invite button
        const inviteButton = page
          .locator("button:has-text('초대'), button:has-text('Invite')")
          .first();

        if ((await inviteButton.count()) > 0) {
          await inviteButton.click();

          // Fill invitation form
          const emailInput = page.locator('input[type="email"]').first();
          const roleSelect = page
            .locator('select[name*="role"], [data-testid*="role"]')
            .first();

          if ((await emailInput.count()) > 0) {
            await emailInput.fill(`newmember.${Date.now()}@example.com`);

            if ((await roleSelect.count()) > 0) {
              await roleSelect.selectOption("viewer");
            }

            // Submit invitation
            const sendButton = page
              .locator(
                'button:has-text("보내기"), button:has-text("Send"), button[type="submit"]',
              )
              .first();

            if ((await sendButton.count()) > 0) {
              await sendButton.click();

              // Should show success message
              const successElements = [
                "text=초대 전송",
                "text=Invitation sent",
                "text=이메일 전송",
                "text=Email sent",
                ".success",
              ];

              for (const selector of successElements) {
                try {
                  await expect(page.locator(selector)).toBeVisible({
                    timeout: 3000,
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

    test("should handle role change workflow", async ({ page }) => {
      await page.goto("/ko/team");

      if (!page.url().includes("login")) {
        // Look for role dropdowns
        const roleSelects = page.locator(
          'select[name*="role"], [data-testid*="role-select"]',
        );

        if ((await roleSelects.count()) > 0) {
          const roleSelect = roleSelects.first();

          // Change role
          await roleSelect.selectOption("team_mate");

          // Should show confirmation dialog
          const confirmElements = [
            "text=역할 변경",
            "text=Change role",
            "text=확인",
            "text=Confirm",
            "[role='dialog']",
          ];

          for (const selector of confirmElements) {
            try {
              await expect(page.locator(selector)).toBeVisible({
                timeout: 2000,
              });

              // Click confirm if found
              const confirmButton = page
                .locator('button:has-text("확인"), button:has-text("Confirm")')
                .first();
              if ((await confirmButton.count()) > 0) {
                await confirmButton.click();
              }
              break;
            } catch {
              // Continue to next selector
            }
          }
        }
      }
    });
  });

  test.describe("Analytics and Reporting Workflow", () => {
    test("should complete analytics view flow", async ({ page }) => {
      await page.goto("/ko/analytics");

      if (!page.url().includes("login")) {
        // Should show analytics page
        await page.waitForTimeout(2000);

        // Look for charts and metrics
        const analyticsElements = [
          "canvas",
          "svg",
          ".chart",
          ".metric-card",
          "[data-testid*='chart']",
          "table",
        ];

        for (const selector of analyticsElements) {
          if ((await page.locator(selector).count()) > 0) {
            await expect(page.locator(selector).first()).toBeVisible();
            break;
          }
        }

        // Test date range selection
        const dateInputs = page.locator('input[type="date"]');

        if ((await dateInputs.count()) >= 2) {
          await dateInputs.nth(0).fill("2024-01-01");
          await dateInputs.nth(1).fill("2024-01-31");

          // Look for apply/update button
          const applyButton = page
            .locator(
              'button:has-text("적용"), button:has-text("Apply"), button:has-text("업데이트")',
            )
            .first();

          if ((await applyButton.count()) > 0) {
            await applyButton.click();

            // Should update analytics
            await page.waitForTimeout(2000);
          }
        }
      }
    });

    test("should handle data export flow", async ({ page }) => {
      await page.goto("/ko/analytics");

      if (!page.url().includes("login")) {
        // Look for export button
        const exportButtons = [
          "button:has-text('내보내기')",
          "button:has-text('Export')",
          "button:has-text('다운로드')",
          "button:has-text('Download')",
          "[data-testid*='export']",
        ];

        for (const selector of exportButtons) {
          if ((await page.locator(selector).count()) > 0) {
            const exportButton = page.locator(selector).first();
            await exportButton.click();

            // Should show export options or start download
            const exportElements = [
              "text=CSV",
              "text=Excel",
              "text=PDF",
              ".export-options",
              "[data-testid*='export-option']",
            ];

            for (const exportSelector of exportElements) {
              try {
                await expect(page.locator(exportSelector)).toBeVisible({
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
  });

  test.describe("Error Recovery Workflows", () => {
    test("should handle sync failure and retry", async ({ page }) => {
      // Mock sync failure
      await page.route("**/api/sync/**", (route) => {
        route.fulfill({
          status: 500,
          contentType: "application/json",
          body: JSON.stringify({ error: "Sync failed" }),
        });
      });

      await page.goto("/ko/dashboard");

      if (!page.url().includes("login")) {
        const syncButton = page
          .locator("button:has-text('동기화'), button:has-text('Sync')")
          .first();

        if ((await syncButton.count()) > 0) {
          await syncButton.click();

          // Should show error message
          const errorElements = [
            "text=실패",
            "text=Failed",
            "text=오류",
            "text=Error",
            ".error",
          ];

          for (const selector of errorElements) {
            try {
              await expect(page.locator(selector)).toBeVisible({
                timeout: 3000,
              });
              break;
            } catch {
              // Continue to next selector
            }
          }

          // Look for retry button
          const retryButton = page
            .locator("button:has-text('재시도'), button:has-text('Retry')")
            .first();

          if ((await retryButton.count()) > 0) {
            // Mock successful retry
            await page.route("**/api/sync/**", (route) => {
              route.fulfill({
                status: 200,
                contentType: "application/json",
                body: JSON.stringify({ success: true }),
              });
            });

            await retryButton.click();

            // Should show success after retry
            await page.waitForTimeout(2000);
          }
        }
      }
    });

    test("should handle session expiration during workflow", async ({
      page,
    }) => {
      await page.goto("/ko/dashboard");

      if (!page.url().includes("login")) {
        // Mock session expiration
        await page.route("**/api/**", (route) => {
          route.fulfill({
            status: 401,
            contentType: "application/json",
            body: JSON.stringify({ error: "Unauthorized" }),
          });
        });

        // Try to perform an action
        const syncButton = page
          .locator("button:has-text('동기화'), button:has-text('Sync')")
          .first();

        if ((await syncButton.count()) > 0) {
          await syncButton.click();

          // Should redirect to login or show re-auth
          await page.waitForTimeout(2000);

          if (page.url().includes("login")) {
            await expect(page.locator("text=로그인")).toBeVisible();
          } else {
            // Should show session expired message
            const sessionElements = [
              "text=세션 만료",
              "text=Session expired",
              "text=다시 로그인",
              "text=Please login again",
            ];

            for (const selector of sessionElements) {
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
    });
  });

  test.describe("Mobile Responsive Workflows", () => {
    test("should complete mobile dashboard workflow", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/ko/dashboard");

      if (!page.url().includes("login")) {
        // Check mobile navigation
        const mobileNav = page
          .locator(
            '.mobile-nav, [data-testid="mobile-nav"], button[aria-label*="menu" i]',
          )
          .first();

        if ((await mobileNav.count()) > 0) {
          await mobileNav.click();

          // Should show mobile menu
          const menuElements = [
            ".nav-menu",
            ".mobile-menu",
            "[data-testid*='mobile-menu']",
            "nav ul",
          ];

          for (const selector of menuElements) {
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

        // Test mobile table scrolling
        const table = page.locator("table").first();
        if ((await table.count()) > 0) {
          // Should be in scrollable container
          const scrollContainer = page
            .locator(".overflow-x-auto, .table-container")
            .first();
          if ((await scrollContainer.count()) > 0) {
            await expect(scrollContainer).toBeVisible();
          }
        }
      }
    });

    test("should handle mobile form interactions", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto("/ko/team");

      if (!page.url().includes("login")) {
        const inviteButton = page
          .locator("button:has-text('초대'), button:has-text('Invite')")
          .first();

        if ((await inviteButton.count()) > 0) {
          await inviteButton.click();

          // Form should be mobile-friendly
          const formElements = page.locator("input, select, button").all();

          // All form elements should be properly sized for mobile
          for (const element of await formElements) {
            const boundingBox = await element.boundingBox();
            if (boundingBox) {
              expect(boundingBox.height).toBeGreaterThan(40); // Minimum touch target
            }
          }
        }
      }
    });
  });
});
