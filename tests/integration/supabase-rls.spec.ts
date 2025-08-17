import { test, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import crypto from "crypto";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "http://127.0.0.1:54321";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

test.describe("Supabase RLS Policies", () => {
  // Generate unique IDs for this test suite to avoid conflicts
  const USER_1_ID = crypto.randomUUID();
  const USER_2_ID = crypto.randomUUID();
  const USER_3_ID = crypto.randomUUID();

  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

  test.beforeAll(async () => {
    // Create test users with unique IDs
    await adminSupabase.auth.admin.createUser({
      id: USER_1_ID,
      email: `rls_test_user1_${USER_1_ID}@test.com`,
      password: "password123",
      email_confirm: true,
    });

    await adminSupabase.auth.admin.createUser({
      id: USER_2_ID,
      email: `rls_test_user2_${USER_2_ID}@test.com`,
      password: "password123",
      email_confirm: true,
    });

    await adminSupabase.auth.admin.createUser({
      id: USER_3_ID,
      email: `rls_test_user3_${USER_3_ID}@test.com`,
      password: "password123",
      email_confirm: true,
    });

    // Wait for triggers to complete
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  test.afterAll(async () => {
    // Cleanup test data
    await adminSupabase.auth.admin.deleteUser(USER_1_ID);
    await adminSupabase.auth.admin.deleteUser(USER_2_ID);
    await adminSupabase.auth.admin.deleteUser(USER_3_ID);
  });

  test("should automatically create profile and team for new user", async () => {
    // Sign in as User 1
    await supabase.auth.signInWithPassword({
      email: `rls_test_user1_${USER_1_ID}@test.com`,
      password: "password123",
    });

    // Check profile exists
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", USER_1_ID)
      .single();

    expect(profile).toBeTruthy();
    expect(profile?.email).toBe(`rls_test_user1_${USER_1_ID}@test.com`);

    // Check team exists
    const { data: teams } = await supabase.from("teams").select("*");

    expect(teams).toHaveLength(1);
    expect(teams?.[0].created_by).toBe(USER_1_ID);

    // Check team membership
    const { data: membership } = await supabase
      .from("team_members")
      .select("*")
      .eq("user_id", USER_1_ID)
      .single();

    expect(membership).toBeTruthy();
    expect(membership?.role).toBe("master");
  });

  test("should enforce profile RLS - users can only see their own profile", async () => {
    // Sign in as User 1
    await supabase.auth.signInWithPassword({
      email: `rls_test_user1_${USER_1_ID}@test.com`,
      password: "password123",
    });

    // User 1 should only see their own profile
    const { data: profiles } = await supabase.from("profiles").select("*");

    expect(profiles).toHaveLength(1);
    expect(profiles?.[0].id).toBe(USER_1_ID);

    // Sign in as User 2
    await supabase.auth.signInWithPassword({
      email: `rls_test_user2_${USER_2_ID}@test.com`,
      password: "password123",
    });

    // User 2 should only see their own profile
    const { data: profiles2 } = await supabase.from("profiles").select("*");

    expect(profiles2).toHaveLength(1);
    expect(profiles2?.[0].id).toBe(USER_2_ID);
  });

  test("should enforce team RLS - users can only see teams they belong to", async () => {
    // Sign in as User 1
    await supabase.auth.signInWithPassword({
      email: `rls_test_user1_${USER_1_ID}@test.com`,
      password: "password123",
    });

    const { data: user1Teams } = await supabase.from("teams").select("*");

    expect(user1Teams).toHaveLength(1);

    // Sign in as User 2
    await supabase.auth.signInWithPassword({
      email: `rls_test_user2_${USER_2_ID}@test.com`,
      password: "password123",
    });

    const { data: user2Teams } = await supabase.from("teams").select("*");

    expect(user2Teams).toHaveLength(1);

    // Teams should be different
    expect(user1Teams?.[0].id).not.toBe(user2Teams?.[0].id);
  });

  test("should enforce platform credentials RLS", async () => {
    // Sign in as User 1
    await supabase.auth.signInWithPassword({
      email: `rls_test_user1_${USER_1_ID}@test.com`,
      password: "password123",
    });

    // Get User 1's team
    const { data: teams } = await supabase.from("teams").select("*").single();

    // Add platform credentials
    const { data: credential, error } = await supabase
      .from("platform_credentials")
      .insert({
        team_id: teams?.id,
        platform: "google_ads",
        account_id: `test-${USER_1_ID}`,
        account_name: "Test Google Ads Account",
        access_token: "test-token",
        created_by: USER_1_ID,
      })
      .select()
      .single();

    expect(error).toBeNull();
    expect(credential).toBeTruthy();

    // Sign in as User 2
    await supabase.auth.signInWithPassword({
      email: `rls_test_user2_${USER_2_ID}@test.com`,
      password: "password123",
    });

    // User 2 should not see User 1's credentials
    const { data: otherCredentials } = await supabase
      .from("platform_credentials")
      .select("*")
      .eq("account_id", `test-${USER_1_ID}`);

    expect(otherCredentials).toHaveLength(0);
  });

  test("should allow masters to manage team members", async () => {
    // Sign in as User 1 (master)
    await supabase.auth.signInWithPassword({
      email: `rls_test_user1_${USER_1_ID}@test.com`,
      password: "password123",
    });

    // Get User 1's team
    const { data: team } = await supabase.from("teams").select("*").single();

    // Add User 3 as a team member
    const { error } = await supabase.from("team_members").insert({
      team_id: team?.id,
      user_id: USER_3_ID,
      role: "viewer",
    });

    expect(error).toBeNull();

    // Sign in as User 3
    await supabase.auth.signInWithPassword({
      email: `rls_test_user3_${USER_3_ID}@test.com`,
      password: "password123",
    });

    // User 3 should now see 2 teams (their own + User 1's team)
    const { data: user3Teams } = await supabase.from("teams").select("*");

    expect(user3Teams).toHaveLength(2);
  });

  test("should prevent viewers from modifying data", async () => {
    // Sign in as User 1 (master)
    await supabase.auth.signInWithPassword({
      email: `rls_test_user1_${USER_1_ID}@test.com`,
      password: "password123",
    });

    // Get User 1's team
    const { data: team } = await supabase.from("teams").select("*").single();

    // Create a campaign
    const { data: campaign } = await supabase
      .from("campaigns")
      .insert({
        team_id: team?.id,
        platform: "google_ads",
        platform_campaign_id: `campaign-${USER_1_ID}`,
        credential_id: crypto.randomUUID(),
        name: "Test Campaign",
        status: "active",
      })
      .select()
      .single();

    expect(campaign).toBeTruthy();

    // Sign in as User 3 (viewer)
    await supabase.auth.signInWithPassword({
      email: `rls_test_user3_${USER_3_ID}@test.com`,
      password: "password123",
    });

    // User 3 should be able to see the campaign
    const { data: viewedCampaign } = await supabase
      .from("campaigns")
      .select("*")
      .eq("platform_campaign_id", `campaign-${USER_1_ID}`)
      .single();

    expect(viewedCampaign).toBeTruthy();

    // But User 3 should not be able to update it
    const { error: updateError } = await supabase
      .from("campaigns")
      .update({ name: "Hacked Campaign" })
      .eq("platform_campaign_id", `campaign-${USER_1_ID}`);

    expect(updateError).toBeTruthy();
  });
});
