// Platform service related types

export interface AccountInfo {
  platform: string;
  account_id: string;
  account_name: string;
  currency?: string;
  timezone?: string;
  status?: string;
  raw_data?: unknown;
}

export interface ConnectionTestResult {
  success: boolean;
  platform: string;
  message: string;
  accountInfo?: {
    id: string;
    name: string;
    currency?: string;
    timezone?: string;
  };
  error?: string;
}

export interface TokenRefreshResult {
  success: boolean;
  platform: string;
  access_token: string;
  refresh_token?: string;
  expires_at?: string;
  raw_response?: unknown;
  error?: string;
}
