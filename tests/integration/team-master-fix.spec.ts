import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";

test.describe("Team Master Fix", () => {
  let supabase: ReturnType<typeof createClient>;

  test.beforeAll(() => {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    supabase = createClient(supabaseUrl, supabaseKey);
  });

  test("Master users should be able to access integrated page", async ({
    page,
  }) => {
    // Create a test user
    const testEmail = `test-master-${Date.now()}@example.com`;
    const testPassword = "Test123456!";

    // Sign up user
    const { data: authData, error: authError } =
      await supabase.auth.admin.createUser({
        email: testEmail,
        password: testPassword,
        email_confirm: true,
      });

    expect(authError).toBeNull();
    expect(authData.user).toBeDefined();

    // Verify user has a team as master
    const { data: team } = await supabase
      .from("teams")
      .select("*")
      .eq("master_user_id", authData.user!.id)
      .single();

    expect(team).toBeDefined();
    expect(team?.master_user_id).toBe(authData.user!.id);

    // Login as the user
    await page.goto("/login");
    await page.fill('input[name="email"]', testEmail);
    await page.fill('input[name="password"]', testPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect to integrated page
    await page.waitForURL(/\/integrated/);

    // Should not see "No team found" error
    await expect(page.locator("text=No team found")).not.toBeVisible();

    // Should see the integrated dashboard
    await expect(
      page.locator("h1").filter({ hasText: "통합 대시보드" }),
    ).toBeVisible();

    // Cleanup
    await supabase.auth.admin.deleteUser(authData.user!.id);
  });

  test("Team members should also be able to access integrated page", async ({
    page,
  }) => {
    // Create master user
    const masterEmail = `test-master-${Date.now()}@example.com`;
    const masterPassword = "Test123456!";

    const { data: masterAuth } = await supabase.auth.admin.createUser({
      email: masterEmail,
      password: masterPassword,
      email_confirm: true,
    });

    // Create team member
    const memberEmail = `test-member-${Date.now()}@example.com`;
    const memberPassword = "Test123456!";

    const { data: memberAuth } = await supabase.auth.admin.createUser({
      email: memberEmail,
      password: memberPassword,
      email_confirm: true,
    });

    // Get the master's team
    const { data: team } = await supabase
      .from("teams")
      .select("*")
      .eq("master_user_id", masterAuth.user!.id)
      .single();

    // Add member to team
    await supabase.from("team_members").insert({
      team_id: team!.id,
      user_id: memberAuth.user!.id,
      role: "team_mate",
      invited_by: masterAuth.user!.id,
    });

    // Login as team member
    await page.goto("/login");
    await page.fill('input[name="email"]', memberEmail);
    await page.fill('input[name="password"]', memberPassword);
    await page.click('button[type="submit"]');

    // Wait for redirect to integrated page
    await page.waitForURL(/\/integrated/);

    // Should not see "No team found" error
    await expect(page.locator("text=No team found")).not.toBeVisible();

    // Should see the integrated dashboard
    await expect(
      page.locator("h1").filter({ hasText: "통합 대시보드" }),
    ).toBeVisible();

    // Cleanup
    await supabase.auth.admin.deleteUser(masterAuth.user!.id);
    await supabase.auth.admin.deleteUser(memberAuth.user!.id);
  });
});
