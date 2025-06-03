import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // reactStrictMode: false,
  cleanDistDir: true,
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
