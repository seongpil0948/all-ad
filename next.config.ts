import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // reactStrictMode: false,
  cleanDistDir: true,

  // Suppress Supabase realtime-js critical dependency warnings
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.ignoreWarnings = [
        {
          module: /@supabase\/realtime-js/,
          message:
            /Critical dependency: the request of a dependency is an expression/,
        },
      ];
    }

    return config;
  },

  // Security headers
  async headers() {
    // 로컬 개발환경 여부 확인
    const isLocal =
      process.env.NODE_ENV === "development" ||
      process.env.NEXT_PUBLIC_SUPABASE_URL?.includes("127.0.0.1");

    // 환경별 connect-src 설정
    const connectSrc = isLocal
      ? "'self' http://127.0.0.1:54321 http://localhost:54321 https://*.supabase.co wss://*.supabase.co https://api.google.com https://graph.facebook.com https://advertising-api.amazon.com https://ads-api.tiktok.com"
      : "'self' https://*.supabase.co wss://*.supabase.co https://api.google.com https://graph.facebook.com https://advertising-api.amazon.com https://ads-api.tiktok.com";

    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            key: "Content-Security-Policy",
            value: `default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src ${connectSrc}; frame-src 'self' https://accounts.google.com https://www.facebook.com;`,
          },
        ],
      },
    ];
  },

  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/bo/:path*',
  //       destination: `${process.env.NEXT_PUBLIC_PROXY_BASE_URL}/bo/:path*`,
  //     },
  //     {
  //       source: '/maildata/:path*',
  //       destination: 'http://1bearworld.co.kr/maildata/:path*',
  //     },
  //   ];
  // },
  // eslint: {
  //   ignoreDuringBuilds: true,
  // },
  // typescript: {
  //   ignoreBuildErrors: true,
  // },
};

export default nextConfig;
