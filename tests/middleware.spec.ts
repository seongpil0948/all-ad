import { test, expect } from "@playwright/test";

test.describe("Middleware locale redirect", () => {
  test("should not redirect TikTok verification file", async ({ request }) => {
    // Test direct access to TikTok verification file
    const response = await request.get(
      "/tiktokxKh43FklFiy7MN5WO9E4pHQpWToYcToq.txt",
    );

    // Should not redirect and should get the file or 404 (if file doesn't exist yet)
    expect(response.status()).toBeLessThanOrEqual(404);
    expect(response.url()).not.toContain("/en/");
    expect(response.url()).not.toContain("/ko/");
    expect(response.url()).not.toContain("/zh/");
    expect(response.url()).toContain(
      "/tiktokxKh43FklFiy7MN5WO9E4pHQpWToYcToq.txt",
    );
  });

  test("should not redirect Next.js metadata files", async ({ request }) => {
    const metadataFiles = [
      "/robots.txt",
      "/sitemap.xml",
      "/manifest.json",
      "/favicon.ico",
      "/icon",
      "/apple-icon",
      "/opengraph-image",
      "/twitter-image",
    ];

    for (const file of metadataFiles) {
      const response = await request.get(file);
      expect(response.url()).not.toMatch(/\/(en|ko|zh)\//);
    }
  });

  test("should not redirect files with excluded extensions", async ({
    request,
  }) => {
    const testFiles = ["/image.png", "/photo.jpg", "/logo.svg"];

    for (const file of testFiles) {
      const response = await request.get(file);
      expect(response.url()).not.toMatch(/\/(en|ko|zh)\//);
    }
  });

  test("should not redirect paths with verification patterns", async ({
    request,
  }) => {
    const testPaths = [
      "/tiktok-business-verification.html",
      "/facebook-domain-verification-12345.html",
      "/google-site-verification-abc123.html",
    ];

    for (const path of testPaths) {
      const response = await request.get(path);
      expect(response.url()).not.toMatch(/\/(en|ko|zh)\//);
    }
  });

  test("should redirect normal pages to locale", async ({ page }) => {
    // Test that normal pages still get locale redirect
    const response = await page.goto("/about", {
      waitUntil: "domcontentloaded",
    });

    // Should redirect to a locale version
    expect(page.url()).toMatch(/\/(en|ko|zh)\/about/);
  });

  test("should not redirect pages that already have locale", async ({
    page,
  }) => {
    // Test that pages with locale don't get double redirected
    await page.goto("/en/about", { waitUntil: "domcontentloaded" });

    // Should stay on the same URL
    expect(page.url()).toContain("/en/about");
  });

  test("should not redirect API routes", async ({ request }) => {
    // Test that API routes are not redirected
    const response = await request.get("/api/health");

    // Should not have locale in URL
    expect(response.url()).toContain("/api/health");
    expect(response.url()).not.toMatch(/\/(en|ko|zh)\/api/);
  });
});
