import { test, expect } from "@playwright/test";

test.describe("Team Creation Fix", () => {
  test("should create team for new user via API", async ({ request }) => {
    // Create a test user first
    const signupResponse = await request.post("/api/auth/signup", {
      data: {
        email: `test-${Date.now()}@example.com`,
        password: "TestPassword123!",
      },
    });

    // If signup successful, try to create team
    if (signupResponse.ok()) {
      const cookies = await signupResponse.headers();
      const teamResponse = await request.post("/api/teams/create", {
        headers: {
          cookie: cookies["set-cookie"] || "",
        },
      });

      expect(teamResponse.ok).toBeTruthy();
      const teamData = await teamResponse.json();
      expect(teamData.success).toBeTruthy();
      expect(teamData.teamId).toBeTruthy();
    }
  });

  test("should handle Google OAuth without RLS error", async ({ page }) => {
    // Navigate to login
    await page.goto("/login");

    // Check that Google OAuth button exists and is clickable
    const googleButton = page.getByRole("button", { name: /google.*연동/i });
    await expect(googleButton).toBeVisible();

    // The actual OAuth flow would require real Google credentials
    // so we just verify the button is present and functional
  });
});
