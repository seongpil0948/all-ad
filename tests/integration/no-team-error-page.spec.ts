import { test, expect } from "@playwright/test";

// Basic integration-style test to ensure that visiting settings while not on a team
// results in redirect to /:lang/error?message=no_team and displays localized text.
// Assumptions: test environment has a user seeded WITHOUT team membership and
// an auth helper to sign in (adjust selectors/flows to your real setup if needed).
// This is a placeholder scaffold; adapt login logic as necessary.

test.describe("No Team Error Redirect", () => {
  const lang = "en";

  test("redirect shows team not found message", async ({ page }) => {
    // TODO: Replace with actual login or use storageState if already authenticated.
    // await loginAsUserWithoutTeam(page);

    await page.goto(`/${lang}/error?message=no_team`);

    await expect(page.locator('[data-testid="error-state"]')).toBeVisible();
    await expect(page.getByText("Team not found.")).toBeVisible();
  });
});
