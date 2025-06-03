// Platform credentials types
import { PlatformType } from "./base.types";

// Base credential interface
export interface PlatformCredential {
  id: string;
  teamId: string;
  platform: PlatformType;
  credentials: Record<string, any>;
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
