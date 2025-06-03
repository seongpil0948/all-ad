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

      // Service
      SERVICE_VERSION?: string;

      // Vercel
      VERCEL?: string;
      VERCEL_ENV?: "production" | "preview" | "development";
      VERCEL_URL?: string;
      VERCEL_REGION?: string;
    }
  }
}

export {};
