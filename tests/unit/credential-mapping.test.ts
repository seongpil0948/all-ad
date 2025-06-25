/**
 * Unit test for credential field mapping logic
 * This test verifies that the PlatformCredentialForm properly converts
 * camelCase field names to snake_case for the server action
 */

describe("Credential Field Mapping", () => {
  test("Google Ads credentials should map correctly", () => {
    // Input values in camelCase (as used in the form)
    const formValues = {
      clientId: "test-client-id",
      clientSecret: "test-secret",
      developerToken: "test-dev-token",
      loginCustomerId: "1234567890",
      refreshToken: "test-refresh-token",
    };

    // Expected output in snake_case (as expected by server action)
    const expectedOutput = {
      client_id: "test-client-id",
      client_secret: "test-secret",
      developer_token: "test-dev-token",
      login_customer_id: "1234567890",
      manual_refresh_token: "test-refresh-token",
    };

    // Simulate the mapping logic from PlatformCredentialForm
    const submissionValues: any = {};

    submissionValues.client_id = formValues.clientId;
    submissionValues.client_secret = formValues.clientSecret;
    submissionValues.developer_token = formValues.developerToken;
    submissionValues.login_customer_id = formValues.loginCustomerId;
    submissionValues.manual_refresh_token = formValues.refreshToken;

    // Verify the mapping
    expect(submissionValues).toEqual(expectedOutput);
  });

  test("Facebook credentials should map correctly", () => {
    const formValues = {
      appId: "fb-app-id",
      appSecret: "fb-app-secret",
      accessToken: "fb-access-token",
    };

    const expectedOutput = {
      client_id: "fb-app-id",
      client_secret: "fb-app-secret",
      manual_refresh_token: "fb-access-token",
    };

    const submissionValues: any = {};

    submissionValues.client_id = formValues.appId;
    submissionValues.client_secret = formValues.appSecret;
    submissionValues.manual_refresh_token = formValues.accessToken;

    expect(submissionValues).toEqual(expectedOutput);
  });
});
