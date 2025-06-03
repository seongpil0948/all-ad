// Environment variables type definitions

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Next.js
      NODE_ENV: "development" | "production" | "test";

      // App
      NEXT_PUBLIC_APP_URL: string;

      // Supabase
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      SUPABASE_SERVICE_ROLE_KEY: string;

      // Google Ads
      GOOGLE_ADS_CLIENT_ID: string;
      GOOGLE_ADS_CLIENT_SECRET: string;
      GOOGLE_ADS_DEVELOPER_TOKEN: string;

      // Meta Ads
      META_APP_ID: string;
      META_APP_SECRET: string;

      // Coupang Ads
      COUPANG_ADS_API_URL?: string;

      // Logging
      LOG_LEVEL?: "debug" | "info" | "warn" | "error";

      REDIS_URL?: string;
      RESEND_API_KEY?: string;
    }
  }
}

export {};
