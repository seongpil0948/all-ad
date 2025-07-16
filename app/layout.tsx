import "@/styles/globals.css";
import { Metadata, Viewport } from "next";
import clsx from "clsx";

import { Providers } from "./providers";

import { siteConfig } from "@/config/site";
import { fontMono, nanumMyeongjo, notoSerifKr } from "@/config/fonts";

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "광고 관리",
    "디지털 마케팅",
    "구글 애즈",
    "페이스북 광고",
    "네이버 광고",
    "카카오 광고",
    "쿠팡 광고",
    "통합 광고 플랫폼",
    "advertising platform",
    "digital marketing",
    "google ads",
    "facebook ads",
    "naver ads",
    "kakao ads",
    "coupang ads",
  ],
  authors: [{ name: "A.ll + Ad Team" }],
  creator: "A.ll + Ad",
  publisher: "A.ll + Ad",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://alladvertising.com",
  ),
  alternates: {
    canonical: "/",
    languages: {
      "en-US": "/en",
      "ko-KR": "/ko",
      "zh-CN": "/zh",
    },
  },
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: "/",
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: siteConfig.name,
    description: siteConfig.description,
    images: ["/og-image.png"],
    creator: "@alladvertising",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "white" },
    { media: "(prefers-color-scheme: dark)", color: "black" },
  ],
};

export async function generateStaticParams() {
  return [{ lang: "en" }, { lang: "ko" }, { lang: "zh" }];
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html suppressHydrationWarning lang="en">
      <head />
      <body
        className={clsx(
          "min-h-screen text-foreground bg-background font-sans antialiased",
          fontMono.variable,
          notoSerifKr.variable,
          nanumMyeongjo.variable,
        )}
      >
        <Providers themeProps={{ attribute: "class", defaultTheme: "dark" }}>
          {children}
        </Providers>
      </body>
    </html>
  );
}
