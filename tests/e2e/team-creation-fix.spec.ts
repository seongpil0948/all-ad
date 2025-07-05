import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { gotoWithLang } from "../utils/navigation";

// Test utilities
const testEmail = `test${Date.now()}@gmail.com`;
const testPassword = "test123456";

// Supabase Admin Client for test verification
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

test.describe("User Registration and Team Creation", () => {
  test("should create team and team_members record on signup", async ({
    page,
  }) => {
    // 1. Navigate to signup page
    await gotoWithLang(page, "/login");

    // Switch to signup mode
    await page.getByText("회원가입").click();

    // 2. Fill in signup form
    await page.getByTestId("signup-input-email").fill(testEmail);
    await page.getByTestId("signup-input-password").fill(testPassword);

    // 3. Submit form
    await page.getByTestId("signup-submit").click();

    // 4. Wait for email confirmation message
    await expect(
      page.locator("text=이메일을 확인하여 계정을 인증해주세요"),
    ).toBeVisible();

    // 5. Use admin client to verify user creation and activate account
    const {
      data: { users },
    } = await supabaseAdmin.auth.admin.listUsers();
    const testUser = users.find((u) => u.email === testEmail);

    expect(testUser).toBeDefined();
    const userId = testUser!.id;

    // 6. Verify profile was created
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    expect(profile).toBeDefined();
    expect(profile.email).toBe(testEmail);

    // 7. Verify team was created
    const { data: team } = await supabaseAdmin
      .from("teams")
      .select("*")
      .eq("master_user_id", userId)
      .single();

    expect(team).toBeDefined();
    expect(team.master_user_id).toBe(userId);

    // 8. Verify team_members record was created
    const { data: teamMember } = await supabaseAdmin
      .from("team_members")
      .select("*")
      .eq("user_id", userId)
      .eq("team_id", team.id)
      .single();

    expect(teamMember).toBeDefined();
    expect(teamMember.role).toBe("master");
    expect(teamMember.user_id).toBe(userId);
    expect(teamMember.team_id).toBe(team.id);

    // Cleanup
    await supabaseAdmin.auth.admin.deleteUser(userId);
  });

  test("should not create duplicate team for existing master", async ({
    page,
  }) => {
    // Create a user with team first
    const {
      data: { user },
    } = await supabaseAdmin.auth.admin.createUser({
      email: `existing${Date.now()}@gmail.com`,
      password: "test123456",
      email_confirm: true,
    });

    const userId = user!.id;

    // Wait longer for all database triggers to complete
    await page.waitForTimeout(5000);

    // Get the existing team
    const { data: existingTeam } = await supabaseAdmin
      .from("teams")
      .select("*")
      .eq("master_user_id", userId)
      .single();

    expect(existingTeam).toBeDefined();
    const teamId = existingTeam.id;

    // Manually call create_team_for_user to simulate any edge case
    const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
      "create_team_for_user",
      { user_id: userId },
    );

    // Log RPC result for debugging
    console.log("RPC Result:", rpcResult, "RPC Error:", rpcError);

    // Should return existing team ID
    expect(rpcResult).toBe(teamId);

    // Verify still only one team exists
    const { data: teams } = await supabaseAdmin
      .from("teams")
      .select("*")
      .eq("master_user_id", userId);

    expect(teams?.length).toBe(1);

    // Verify team_members record exists
    const { data: teamMembers } = await supabaseAdmin
      .from("team_members")
      .select("*")
      .eq("user_id", userId)
      .eq("team_id", teamId);

    expect(teamMembers?.length).toBe(1);
    expect(teamMembers![0].role).toBe("master");

    // Cleanup
    await supabaseAdmin.auth.admin.deleteUser(userId);
  });
});

test.describe("Login Team Verification", () => {
  let testUserId: string;

  test.beforeAll(async () => {
    // Create test user
    const {
      data: { user },
    } = await supabaseAdmin.auth.admin.createUser({
      email: `login${Date.now()}@gmail.com`,
      password: "test123456",
      email_confirm: true,
    });

    testUserId = user!.id;

    // Wait longer for all triggers to complete
    await new Promise((resolve) => setTimeout(resolve, 5000));
  });

  test.afterAll(async () => {
    // Cleanup
    await supabaseAdmin.auth.admin.deleteUser(testUserId);
  });

  test("should ensure team exists on login", async ({ page }) => {
    // Get user details
    const { data: userData } =
      await supabaseAdmin.auth.admin.getUserById(testUserId);
    const userEmail = userData.user!.email!;

    // Navigate to login page
    await gotoWithLang(page, "/login");

    // Fill in login form
    await page.getByTestId("login-input-id").fill(userEmail);
    await page.getByTestId("login-input-pw").fill("test123456");

    // Submit form
    await page.getByTestId("login-submit").click();

    // Wait for redirect to dashboard (with language code)
    await page.waitForURL(/\/(en|ko)\/dashboard/);

    // Verify team exists
    const { data: team } = await supabaseAdmin
      .from("teams")
      .select("*")
      .eq("master_user_id", testUserId)
      .single();

    expect(team).toBeDefined();

    // Verify team_members record exists
    const { data: teamMember } = await supabaseAdmin
      .from("team_members")
      .select("*")
      .eq("user_id", testUserId)
      .eq("team_id", team.id)
      .single();

    expect(teamMember).toBeDefined();
    expect(teamMember.role).toBe("master");
  });
});
