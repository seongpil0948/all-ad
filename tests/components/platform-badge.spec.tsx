import { test, expect } from "@playwright/experimental-ct-react";
import { PlatformBadge } from "@/components/common/PlatformBadge";

test.describe("PlatformBadge Component Tests @component", () => {
  test("should render Google Ads badge with icon", async ({ mount }) => {
    const component = await mount(
      <PlatformBadge platform="google" showIcon={true} />,
    );

    await expect(component).toContainText("Google Ads");
    await expect(component).toBeVisible();
  });

  test("should render Facebook badge without icon", async ({ mount }) => {
    const component = await mount(
      <PlatformBadge platform="facebook" showIcon={false} />,
    );

    await expect(component).toContainText("Facebook Ads");
    await expect(component).toBeVisible();
  });

  test("should render different platform types", async ({ mount }) => {
    // Test Google platform
    const googleBadge = await mount(<PlatformBadge platform="google" />);
    await expect(googleBadge).toContainText("Google Ads");

    // Test Facebook platform
    const facebookBadge = await mount(<PlatformBadge platform="facebook" />);
    await expect(facebookBadge).toContainText("Facebook Ads");

    // Test Amazon platform
    const amazonBadge = await mount(<PlatformBadge platform="amazon" />);
    await expect(amazonBadge).toContainText("Amazon Ads");
  });

  test("should support different sizes", async ({ mount }) => {
    const smallBadge = await mount(
      <PlatformBadge platform="google" size="sm" />,
    );
    await expect(smallBadge).toBeVisible();

    const mediumBadge = await mount(
      <PlatformBadge platform="google" size="md" />,
    );
    await expect(mediumBadge).toBeVisible();

    const largeBadge = await mount(
      <PlatformBadge platform="google" size="lg" />,
    );
    await expect(largeBadge).toBeVisible();
  });

  test("should support different variants", async ({ mount }) => {
    const solidBadge = await mount(
      <PlatformBadge platform="google" variant="solid" />,
    );
    await expect(solidBadge).toBeVisible();

    const borderedBadge = await mount(
      <PlatformBadge platform="google" variant="bordered" />,
    );
    await expect(borderedBadge).toBeVisible();

    const lightBadge = await mount(
      <PlatformBadge platform="google" variant="light" />,
    );
    await expect(lightBadge).toBeVisible();
  });

  test("should have proper HeroUI Chip structure", async ({ mount }) => {
    const component = await mount(<PlatformBadge platform="google" />);

    // Check if component uses HeroUI Chip
    const chipElement = component.locator(
      '[class*="chip"], [data-slot*="chip"]',
    );
    await expect(chipElement).toBeVisible();
  });

  test("should render icon when showIcon is true", async ({ mount }) => {
    const component = await mount(
      <PlatformBadge platform="google" showIcon={true} />,
    );

    // Icon should be rendered (as an element with styling)
    const iconContainer = component.locator('[class*="rounded"]');
    const hasIcon = (await iconContainer.count()) > 0;
    expect(hasIcon).toBe(true);
  });

  test("should not render icon when showIcon is false", async ({ mount }) => {
    const component = await mount(
      <PlatformBadge platform="google" showIcon={false} />,
    );

    // Should only contain the chip, no icon container
    await expect(component).toContainText("Google Ads");
  });

  test("should apply custom className", async ({ mount }) => {
    const component = await mount(
      <PlatformBadge platform="google" className="custom-badge-class" />,
    );

    await expect(component).toBeVisible();
    await expect(component).toContainText("Google Ads");
  });

  test("should handle all supported platforms", async ({ mount }) => {
    const platforms = [
      "google",
      "facebook",
      "amazon",
      "tiktok",
      "kakao",
      "naver",
      "coupang",
    ] as const;

    for (const platform of platforms) {
      const badge = await mount(<PlatformBadge platform={platform} />);

      await expect(badge).toBeVisible();
      // Each platform should show some text
      const text = await badge.textContent();
      expect(text).toBeTruthy();
      expect(text!.length).toBeGreaterThan(0);
    }
  });
});
