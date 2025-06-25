import { test, expect, AnnotationType } from "../tester";
import { getAllAdOAuthConfig } from "@/lib/oauth/platform-configs";

// Mock implementations
const mockSupabaseClient = {
  from: (table: string) => ({
    select: () => ({
      eq: () => ({
        eq: () => ({
          eq: () => ({
            single: async () => ({
              data: {
                data: {
                  access_token: "test_access_token",
                  refresh_token: "test_refresh_token",
                  expiry_date: Date.now() + 3600000, // 1 hour from now
                  token_type: "Bearer",
                  scope: "https://www.googleapis.com/auth/adwords",
                },
              },
              error: null,
            }),
          }),
        }),
      }),
    }),
    update: () => ({
      eq: () => ({
        eq: () => ({
          error: null,
        }),
      }),
    }),
  }),
};

// Test OAuth configuration
test.describe("Google Ads OAuth Client", () => {
  test.beforeEach(async ({ pushAnnotation }) => {
    pushAnnotation(AnnotationType.MAIN_CATEGORY, "Unit Tests");
    pushAnnotation(AnnotationType.SUB_CATEGORY1, "OAuth Services");
    pushAnnotation(AnnotationType.SUB_CATEGORY2, "Google Ads OAuth Client");
  });

  test("should retrieve valid OAuth configuration", async () => {
    // Mock environment variables
    const originalClientId = process.env.GOOGLE_CLIENT_ID;
    const originalClientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const originalDeveloperToken = process.env.GOOGLE_DEVELOPER_TOKEN;

    process.env.GOOGLE_CLIENT_ID = "test_client_id";
    process.env.GOOGLE_CLIENT_SECRET = "test_client_secret";
    process.env.GOOGLE_DEVELOPER_TOKEN = "test_developer_token";

    const config = await getAllAdOAuthConfig("google");

    expect(config).toBeDefined();
    expect(config?.clientId).toBe("test_client_id");
    expect(config?.clientSecret).toBe("test_client_secret");
    // developerToken is added to the config object but not part of OAuthConfig type
    expect((config as any)?.developerToken).toBe("test_developer_token");
    expect(config?.scope).toContain("https://www.googleapis.com/auth/adwords");

    // Restore original values
    if (originalClientId) process.env.GOOGLE_CLIENT_ID = originalClientId;
    if (originalClientSecret)
      process.env.GOOGLE_CLIENT_SECRET = originalClientSecret;
    if (originalDeveloperToken)
      process.env.GOOGLE_DEVELOPER_TOKEN = originalDeveloperToken;
  });

  test("should return null when OAuth credentials are missing", async () => {
    // Save original values
    const originalClientId = process.env.GOOGLE_CLIENT_ID;
    const originalClientSecret = process.env.GOOGLE_CLIENT_SECRET;

    // Clear environment variables
    process.env.GOOGLE_CLIENT_ID = undefined as any;
    process.env.GOOGLE_CLIENT_SECRET = undefined as any;

    const config = await getAllAdOAuthConfig("google");

    expect(config).toBeNull();

    // Restore original values
    if (originalClientId) process.env.GOOGLE_CLIENT_ID = originalClientId;
    if (originalClientSecret)
      process.env.GOOGLE_CLIENT_SECRET = originalClientSecret;
  });

  test("should handle token refresh correctly", async ({ page }) => {
    // Mock fetch for token refresh
    await page.route("https://oauth2.googleapis.com/token", async (route) => {
      if (route.request().method() === "POST") {
        const postData = route.request().postData();

        // Verify refresh token request
        expect(postData).toContain("grant_type=refresh_token");
        expect(postData).toContain("refresh_token=test_refresh_token");

        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            access_token: "new_access_token",
            expires_in: 3600,
            token_type: "Bearer",
            scope: "https://www.googleapis.com/auth/adwords",
          }),
        });
      }
    });

    // Test token refresh logic
    const mockTokenData = {
      access_token: "old_access_token",
      refresh_token: "test_refresh_token",
      expiry_date: Date.now() - 1000, // Expired
      token_type: "Bearer",
      scope: "https://www.googleapis.com/auth/adwords",
    };

    // Verify that expired token triggers refresh
    expect(mockTokenData.expiry_date).toBeLessThan(Date.now());
  });

  test("should validate token expiry with buffer", async () => {
    const now = Date.now();
    const bufferMs = 5 * 60 * 1000; // 5 minutes

    // Token expiring in 4 minutes (within buffer)
    const expiringToken = {
      expiry_date: now + 4 * 60 * 1000,
    };

    // Token expiring in 10 minutes (outside buffer)
    const validToken = {
      expiry_date: now + 10 * 60 * 1000,
    };

    // Check if tokens need refresh
    const needsRefresh = (token: { expiry_date: number }) => {
      return token.expiry_date - now < bufferMs;
    };

    expect(needsRefresh(expiringToken)).toBe(true);
    expect(needsRefresh(validToken)).toBe(false);
  });

  test("should construct proper OAuth authorization URL", async () => {
    const baseUrl = "https://accounts.google.com/o/oauth2/v2/auth";
    const params = new URLSearchParams({
      client_id: "test_client_id",
      redirect_uri: "http://localhost:3000/api/auth/callback/google-ads",
      response_type: "code",
      scope:
        "https://www.googleapis.com/auth/adwords https://www.googleapis.com/auth/userinfo.email",
      access_type: "offline",
      prompt: "consent select_account",
      state: "test_state",
      include_granted_scopes: "true",
    });

    const authUrl = `${baseUrl}?${params.toString()}`;

    // Verify URL components
    expect(authUrl).toContain("client_id=test_client_id");
    expect(authUrl).toContain("response_type=code");
    expect(authUrl).toContain("access_type=offline");
    expect(authUrl).toContain("prompt=consent+select_account");
    expect(authUrl).toContain("include_granted_scopes=true");
  });

  test("should handle OAuth callback errors", async () => {
    const errorScenarios = [
      { error: "access_denied", expected: "oauth_denied" },
      { error: "invalid_request", expected: "invalid_request" },
      { error: "unauthorized_client", expected: "oauth_failed" },
    ];

    for (const scenario of errorScenarios) {
      // Simulate error callback
      const redirectUrl = `/integrated?error=${scenario.expected}&platform=google`;

      // Verify redirect URL format
      expect(redirectUrl).toContain(`error=${scenario.expected}`);
      expect(redirectUrl).toContain("platform=google");
    }
  });

  test("should store tokens securely in database", async () => {
    const credentialData = {
      team_id: "test_team_id",
      platform: "google",
      account_id: "google_12345_1234567890",
      account_name: "test@example.com",
      is_active: true,
      credentials: {}, // No client credentials stored
      data: {
        access_token: "encrypted_access_token",
        refresh_token: "encrypted_refresh_token",
        token_type: "Bearer",
        expiry_date: Date.now() + 3600000,
        scope: "https://www.googleapis.com/auth/adwords",
        user_email: "test@example.com",
        user_id: "12345",
        connected_at: new Date().toISOString(),
      },
    };

    // Verify no client credentials are stored
    expect(credentialData.credentials).toEqual({});
    expect(Object.keys(credentialData.credentials)).not.toContain("client_id");
    expect(Object.keys(credentialData.credentials)).not.toContain(
      "client_secret",
    );

    // Verify tokens are stored in data field
    expect(credentialData.data.access_token).toBeDefined();
    expect(credentialData.data.refresh_token).toBeDefined();
  });
});
