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
            value:
              "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://connect.facebook.net; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.google.com https://graph.facebook.com https://advertising-api.amazon.com https://ads-api.tiktok.com; frame-src 'self' https://accounts.google.com https://www.facebook.com;",
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
