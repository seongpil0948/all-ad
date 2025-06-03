// Client-side OAuth utilities
export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  scope: string[];
  authorizationUrl: string;
  tokenUrl: string;
}

export class OAuthClient {
  private config: OAuthConfig;
  private platform: string;

  constructor(platform: string, config: OAuthConfig) {
    this.platform = platform;
    this.config = config;
  }

  // Generate OAuth authorization URL
  getAuthorizationUrl(state: string): string {
    const params = new URLSearchParams({
      client_id: this.config.clientId,
      redirect_uri: this.config.redirectUri,
      response_type: "code",
      scope: this.config.scope.join(" "),
      state,
      access_type: "offline",
      prompt: "consent",
    });

    return `${this.config.authorizationUrl}?${params}`;
  }
}
