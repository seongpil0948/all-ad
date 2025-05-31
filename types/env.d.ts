declare global {
  namespace NodeJS {
    interface ProcessEnv {
      // Next.js
      NODE_ENV: "development" | "production" | "test";
      NEXT_PUBLIC_SITE_URL: string;

      // Supabase
      NEXT_PUBLIC_SUPABASE_URL: string;
      NEXT_PUBLIC_SUPABASE_ANON_KEY: string;
      SUPABASE_SERVICE_ROLE_KEY: string;

      // OpenTelemetry
      OTEL_EXPORTER_OTLP_ENDPOINT?: string;
      OTEL_API_KEY?: string;
      NEXT_OTEL_VERBOSE?: "1" | "0";

      // Logging
      LOG_ENDPOINT?: string;
      LOG_LEVEL?: "trace" | "debug" | "info" | "warn" | "error";

      // Service
      SERVICE_VERSION?: string;

      // Ad Platforms
      GOOGLE_ADS_API_KEY?: string;
      GOOGLE_ADS_CUSTOMER_ID?: string;
      FACEBOOK_ADS_ACCESS_TOKEN?: string;
      FACEBOOK_ADS_ACCOUNT_ID?: string;

      // Vercel
      VERCEL?: string;
      VERCEL_ENV?: "production" | "preview" | "development";
      VERCEL_URL?: string;
      VERCEL_REGION?: string;
    }
  }
}

export {};
