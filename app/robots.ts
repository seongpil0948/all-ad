import { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sivera.app";

  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/en",
          "/ko",
          "/zh",
          "/demo",
          "/pricing",
          "/support",
          "/contact",
        ],
        disallow: [
          "/api/",
          "/auth/",
          "/dashboard/",
          "/settings/",
          "/profile/",
          "/team/",
          "/analytics/",
          "/integrated/",
          "/private/",
          "/*?*", // Disallow URLs with query parameters
        ],
      },
      {
        userAgent: "GPTBot",
        disallow: ["/"],
      },
      {
        userAgent: "ChatGPT-User",
        disallow: ["/"],
      },
      {
        userAgent: "CCBot",
        disallow: ["/"],
      },
      {
        userAgent: "anthropic-ai",
        disallow: ["/"],
      },
      {
        userAgent: "Claude-Web",
        disallow: ["/"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
