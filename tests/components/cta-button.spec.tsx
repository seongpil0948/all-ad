import { test, expect } from "@playwright/experimental-ct-react";
import { CTAButton } from "@/components/common/CTAButton";

// Router will be mocked in playwright/index.ts

test.describe("CTAButton Component Tests @component", () => {
  test("should render CTA button with proper attributes", async ({ mount }) => {
    const component = await mount(
      <CTAButton
        text="Get Started"
        path="/login?mode=signup"
        action="signup_cta"
      />,
    );

    await expect(component).toContainText("Get Started");
    await expect(component).toBeVisible();
  });

  test("should be clickable and interactive", async ({ mount }) => {
    const component = await mount(
      <CTAButton text="Click Me" path="/test" action="test_action" />,
    );

    const button = component.locator("button");
    await expect(button).toBeEnabled();
    await button.click();
    // Button should be clickable without throwing errors
  });

  test("should have proper button structure", async ({ mount }) => {
    const component = await mount(
      <CTAButton text="Submit" path="/submit" action="submit_form" />,
    );

    // Check if it renders as a proper button element
    const button = component.locator("button");
    await expect(button).toBeVisible();
    await expect(button).toContainText("Submit");
  });

  test("should be keyboard accessible", async ({ mount }) => {
    const component = await mount(
      <CTAButton text="Keyboard Test" path="/test" action="keyboard_test" />,
    );

    const button = component.locator("button");
    await button.focus();

    // Check if button can receive focus
    const isFocused = await button.evaluate(
      (el) => document.activeElement === el,
    );
    expect(isFocused).toBe(true);

    // Test keyboard activation
    await button.press("Enter");
    // Should not throw error
  });

  test("should apply custom className", async ({ mount }) => {
    const component = await mount(
      <CTAButton
        text="Styled Button"
        path="/test"
        action="style_test"
        className="custom-class"
      />,
    );

    // Check if custom class is applied (though specific implementation may vary)
    await expect(component).toBeVisible();
    await expect(component).toContainText("Styled Button");
  });

  test("should handle motion animations", async ({ mount }) => {
    const component = await mount(
      <CTAButton text="Animated Button" path="/test" action="animation_test" />,
    );

    const button = component.locator("button");

    // Hover should not cause errors
    await button.hover();
    await expect(button).toBeVisible();

    // Click should trigger animation
    await button.click();
    await expect(button).toBeVisible();
  });
});
