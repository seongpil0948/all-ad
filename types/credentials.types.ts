// Platform credentials types
import { PlatformType } from "./base.types";

// Unified credential values interface for forms
export interface CredentialValues {
  // Google OAuth
  clientId?: string;
  clientSecret?: string;
  developerToken?: string;
  loginCustomerId?: string;
  refreshToken?: string;
  // Facebook OAuth
  appId?: string;
  appSecret?: string;
  accessToken?: string;
  // Kakao OAuth
  restApiKey?: string;
  secretKey?: string;
  // Naver API
  customerId?: string;
  // Coupang API
  accessKey?: string;
  // OAuth fields (snake_case for compatibility)
  client_id?: string;
  client_secret?: string;
  refresh_token?: string;
  manual_token?: boolean;
  manual_refresh_token?: string;
  [key: string]: string | boolean | undefined;
}

// Base credential interface
export interface PlatformCredential {
  id: string;
  teamId: string;
  platform: PlatformType;
  credentials: CredentialValues;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastSyncAt?: string | null;
}

// Google Ads specific credentials
export interface GoogleAdsCredentials {
  clientId: string;
  clientSecret: string;
  refreshToken: string;
  developerToken: string;
  customerId: string;
  loginCustomerId?: string;
}

// Facebook/Meta specific credentials
export interface FacebookCredentials {
  accessToken: string;
  accountId: string;
  appId?: string;
  appSecret?: string;
  businessId?: string;
}

// Kakao specific credentials
export interface KakaoCredentials {
  accessToken: string;
  refreshToken: string;
  accountId: string;
  clientId: string;
  clientSecret: string;
}

// Naver specific credentials
export interface NaverCredentials {
  apiKey: string;
  apiSecret: string;
  customerId: string;
}

// Coupang specific credentials
export interface CoupangCredentials {
  accessKey: string;
  secretKey: string;
  vendorId: string;
}

// Credential save request
export interface CredentialSaveRequest {
  platform: PlatformType;
  credentials:
    | GoogleAdsCredentials
    | FacebookCredentials
    | KakaoCredentials
    | NaverCredentials
    | CoupangCredentials;
}

// Credential validation result
export interface CredentialValidationResult {
  isValid: boolean;
  message?: string;
  accountInfo?: {
    id: string;
    name: string;
    email?: string;
  };
}
