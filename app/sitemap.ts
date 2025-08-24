import { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://sivera.app";

  // Base pages
  const staticPages = ["", "/demo", "/pricing", "/support", "/contact"];

  // Languages
  const languages = ["en", "ko", "zh"];

  // Generate URLs for each language
  const sitemapEntries: MetadataRoute.Sitemap = [];

  // Add root page
  sitemapEntries.push({
    url: baseUrl,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1,
    alternates: {
      languages: {
        en: `${baseUrl}/en`,
        ko: `${baseUrl}/ko`,
        zh: `${baseUrl}/zh`,
      },
    },
  });

  // Add static pages for each language
  languages.forEach((lang) => {
    staticPages.forEach((page) => {
      sitemapEntries.push({
        url: `${baseUrl}/${lang}${page}`,
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: page === "" ? 1 : 0.8,
        alternates: {
          languages: {
            en: `${baseUrl}/en${page}`,
            ko: `${baseUrl}/ko${page}`,
            zh: `${baseUrl}/zh${page}`,
          },
        },
      });
    });

    // Add authenticated pages (lower priority, monthly updates)
    const authenticatedPages = [
      "/dashboard",
      "/settings",
      "/profile",
      "/team",
      "/analytics",
      "/integrated",
    ];

    authenticatedPages.forEach((page) => {
      sitemapEntries.push({
        url: `${baseUrl}/${lang}${page}`,
        lastModified: new Date(),
        changeFrequency: "monthly",
        priority: 0.6,
        alternates: {
          languages: {
            en: `${baseUrl}/en${page}`,
            ko: `${baseUrl}/ko${page}`,
            zh: `${baseUrl}/zh${page}`,
          },
        },
      });
    });
  });

  return sitemapEntries;
}
