import { test, expect } from "@playwright/test";

test.describe("Intro Page", () => {
  test("should be accessible without authentication", async ({ page }) => {
    // Navigate to intro page
    await page.goto("/intro");

    // Should not redirect to login
    await expect(page).toHaveURL("/intro");

    // Should contain the main title
    await expect(page.locator("h1")).toContainText("올애드");

    // Should have CTA buttons
    await expect(
      page.getByRole("link", { name: "무료로 시작하기" }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "데모 체험하기" }),
    ).toBeVisible();
  });

  test("should navigate to login when clicking start button", async ({
    page,
  }) => {
    await page.goto("/intro");

    // Click the start button
    await page.getByRole("link", { name: "무료로 시작하기" }).click();

    // Should navigate to login page
    await expect(page).toHaveURL("/login");
  });

  test("should navigate to demo when clicking demo button", async ({
    page,
  }) => {
    await page.goto("/intro");

    // Click the demo button
    await page.getByRole("link", { name: "데모 체험하기" }).click();

    // Should navigate to demo page
    await expect(page).toHaveURL("/demo");
  });
});
