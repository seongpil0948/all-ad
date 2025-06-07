/**
 * Meta (Facebook) OAuth helper functions
 */

export interface MetaOAuthParams {
  appId: string;
  redirectUri: string;
  scope: string[];
  state?: string;
}

/**
 * Generate Meta OAuth authorization URL
 */
export function generateMetaAuthUrl(params: MetaOAuthParams): string {
  const baseUrl = "https://www.facebook.com/v23.0/dialog/oauth";

  const queryParams = new URLSearchParams({
    client_id: params.appId,
    redirect_uri: params.redirectUri,
    response_type: "code",
    scope: params.scope.join(","),
    state: params.state || Date.now().toString(),
  });

  return `${baseUrl}?${queryParams.toString()}`;
}

/**
 * Get redirect URI based on environment
 */
export function getMetaRedirectUri(isLab: boolean = false): string {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:3000");

  return isLab
    ? `${baseUrl}/api/auth/callback/meta-ads-lab`
    : `${baseUrl}/api/auth/callback/meta-ads`;
}

/**
 * Default Meta OAuth scopes
 */
export const META_DEFAULT_SCOPES = [
  "ads_management",
  "ads_read",
  "business_management",
  "pages_read_engagement",
];

/**
 * Validate if the current domain matches Facebook app settings
 */
export function validateDomain(
  currentUrl: string,
  allowedDomains: string[],
): boolean {
  try {
    const url = new URL(currentUrl);
    const hostname = url.hostname;

    return allowedDomains.some((domain) => {
      // Handle wildcard subdomains
      if (domain.startsWith("*.")) {
        const baseDomain = domain.slice(2);

        return hostname.endsWith(baseDomain);
      }

      return hostname === domain || hostname === `www.${domain}`;
    });
  } catch {
    return false;
  }
}
