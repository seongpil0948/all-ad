// OAuth 관련 타입 정의

export interface OAuthConfig {
  clientId: string;
  clientSecret: string;
  redirectUri: string;
  authorizationUrl: string;
  tokenUrl: string;
  scope: string[];
  state?: string;
  codeChallenge?: string;
  codeChallengeMethod?: "S256" | "plain";
}

export interface TokenData {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
  scope?: string;
  refresh_token_expires_in?: number;
}
