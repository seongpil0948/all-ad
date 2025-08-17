import { test, expect } from "@playwright/experimental-ct-react";
import { HeroButtons } from "@/components/home/HeroButtons";

test.describe("HeroButtons Component Tests @component", () => {
  test("should render both primary and secondary buttons", async ({
    mount,
  }) => {
    const component = await mount(
      <HeroButtons
        primaryButtonText="시작하기"
        secondaryButtonText="데모 보기"
      />,
    );

    await expect(component).toContainText("시작하기");
    await expect(component).toContainText("데모 보기");
  });

  test("should have proper button structure", async ({ mount }) => {
    const component = await mount(
      <HeroButtons
        primaryButtonText="Get Started"
        secondaryButtonText="View Demo"
      />,
    );

    const buttons = component.locator("button");
    await expect(buttons).toHaveCount(2);

    const primaryButton = buttons.first();
    const secondaryButton = buttons.last();

    await expect(primaryButton).toContainText("Get Started");
    await expect(secondaryButton).toContainText("View Demo");
  });

  test("should be clickable and interactive", async ({ mount }) => {
    const component = await mount(
      <HeroButtons
        primaryButtonText="Click Primary"
        secondaryButtonText="Click Secondary"
      />,
    );

    const buttons = component.locator("button");
    const primaryButton = buttons.first();
    const secondaryButton = buttons.last();

    await expect(primaryButton).toBeEnabled();
    await expect(secondaryButton).toBeEnabled();

    await primaryButton.click();
    await secondaryButton.click();
    // Should not throw errors
  });

  test("should be keyboard accessible", async ({ mount }) => {
    const component = await mount(
      <HeroButtons
        primaryButtonText="Primary"
        secondaryButtonText="Secondary"
      />,
    );

    const buttons = component.locator("button");
    const primaryButton = buttons.first();

    await primaryButton.focus();

    const isFocused = await primaryButton.evaluate(
      (el) => document.activeElement === el,
    );
    expect(isFocused).toBe(true);

    await primaryButton.press("Tab");
    const secondaryButton = buttons.last();
    const isSecondaryFocused = await secondaryButton.evaluate(
      (el) => document.activeElement === el,
    );
    expect(isSecondaryFocused).toBe(true);
  });

  test("should handle animation states", async ({ mount }) => {
    const component = await mount(
      <HeroButtons
        primaryButtonText="Animated"
        secondaryButtonText="Buttons"
      />,
    );

    const buttons = component.locator("button");
    const primaryButton = buttons.first();

    // Hover should not cause errors
    await primaryButton.hover();
    await expect(primaryButton).toBeVisible();

    // Click should trigger animation
    await primaryButton.click();
    await expect(primaryButton).toBeVisible();
  });

  test("should have proper HeroUI styling", async ({ mount }) => {
    const component = await mount(
      <HeroButtons
        primaryButtonText="Styled Primary"
        secondaryButtonText="Styled Secondary"
      />,
    );

    const buttons = component.locator("button");
    await expect(buttons.first()).toBeVisible();
    await expect(buttons.last()).toBeVisible();
  });

  test("should handle empty text props", async ({ mount }) => {
    const component = await mount(
      <HeroButtons primaryButtonText="" secondaryButtonText="" />,
    );

    const buttons = component.locator("button");
    await expect(buttons).toHaveCount(2);
    await expect(buttons.first()).toBeVisible();
    await expect(buttons.last()).toBeVisible();
  });
});
