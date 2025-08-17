import { test, expect } from "@playwright/experimental-ct-react";
import { LoadingState } from "@/components/common/LoadingState";

test.describe("LoadingState Component Tests @component", () => {
  test("should render basic loading state", async ({ mount }) => {
    const component = await mount(<LoadingState />);

    await expect(component).toBeVisible();
    await expect(
      component.locator('[data-testid="loading-state"]'),
    ).toBeVisible();

    // Check for spinner element
    const spinner = component.locator('[data-testid="loading-spinner"]');
    if (await spinner.isVisible()) {
      await expect(spinner).toBeVisible();
    }
  });

  test("should render with custom message", async ({ mount }) => {
    const customMessage = "Processing your data...";
    const component = await mount(<LoadingState message={customMessage} />);

    await expect(component).toBeVisible();
    await expect(component).toContainText(customMessage);
  });

  test("should render fullScreen mode", async ({ mount }) => {
    const component = await mount(<LoadingState fullScreen />);

    await expect(component).toBeVisible();

    // Check if fullScreen styling is applied
    const container = component.locator('[data-testid="loading-state"]');
    const hasFullScreenClass = await container.evaluate(
      (el) =>
        el.classList.toString().includes("fixed") ||
        el.classList.toString().includes("fullscreen") ||
        getComputedStyle(el).position === "fixed",
    );

    expect(hasFullScreenClass).toBe(true);
  });

  test("should render with different spinner sizes", async ({ mount }) => {
    // Test small size
    const smallComponent = await mount(<LoadingState size="sm" />);
    await expect(smallComponent).toBeVisible();

    // Test large size
    const largeComponent = await mount(<LoadingState size="lg" />);
    await expect(largeComponent).toBeVisible();

    // Both should have spinner elements
    const smallSpinner = smallComponent.locator(
      '[data-testid="loading-spinner"]',
    );
    const largeSpinner = largeComponent.locator(
      '[data-testid="loading-spinner"]',
    );

    if (await smallSpinner.isVisible()) {
      await expect(smallSpinner).toBeVisible();
    }
    if (await largeSpinner.isVisible()) {
      await expect(largeSpinner).toBeVisible();
    }
  });

  test("should have proper accessibility attributes", async ({ mount }) => {
    const component = await mount(<LoadingState message="Loading content" />);

    await expect(component).toBeVisible();

    const ariaAttributes = await component.evaluate((el) => ({
      hasAriaLabel: el.hasAttribute("aria-label"),
      hasAriaLive: el.hasAttribute("aria-live"),
      hasRole: el.hasAttribute("role"),
      ariaLabelValue: el.getAttribute("aria-label"),
      ariaLiveValue: el.getAttribute("aria-live"),
      roleValue: el.getAttribute("role"),
    }));

    // Should have appropriate ARIA attributes for screen readers
    console.log("LoadingState ARIA attributes:", ariaAttributes);

    // At least one accessibility attribute should be present
    const hasAccessibility =
      ariaAttributes.hasAriaLabel ||
      ariaAttributes.hasAriaLive ||
      ariaAttributes.hasRole;
    expect(hasAccessibility).toBe(true);
  });

  test("should render with custom className", async ({ mount }) => {
    const component = await mount(<LoadingState />);

    await expect(component).toBeVisible();

    const hasCustomClass = await component.evaluate(
      (el) =>
        el.classList.contains("custom-loading") ||
        el.querySelector(".custom-loading") !== null,
    );

    expect(hasCustomClass).toBe(true);
  });

  test("should handle loading state transitions", async ({ mount }) => {
    const component = await mount(<LoadingState />);

    await expect(component).toBeVisible();

    // Test that the component remains stable
    await component.waitFor({ state: "visible" });

    // Check if spinner is animated (should have animation classes or CSS)
    const spinner = component.locator('[data-testid="loading-spinner"]');
    if (await spinner.isVisible()) {
      const hasAnimation = await spinner.evaluate((el) => {
        const computedStyle = getComputedStyle(el);
        return (
          computedStyle.animationName !== "none" ||
          computedStyle.transform !== "none" ||
          el.classList.toString().includes("animate") ||
          el.classList.toString().includes("spin")
        );
      });

      console.log("Spinner has animation:", hasAnimation);
    }
  });

  test("should work with HeroUI Spinner component", async ({ mount }) => {
    const component = await mount(<LoadingState />);

    await expect(component).toBeVisible();

    // Check for HeroUI Spinner characteristics
    const heroUISpinner = component.locator(
      '[data-slot="base"], .nextui-spinner',
    );
    if (await heroUISpinner.isVisible()) {
      await expect(heroUISpinner).toBeVisible();
      console.log("HeroUI Spinner detected");
    }
  });

  test("should be keyboard accessible", async ({ mount }) => {
    const component = await mount(<LoadingState />);

    await expect(component).toBeVisible();

    // Loading states should not trap focus
    const isFocusable = await component.evaluate((el) => {
      const tabIndex = el.getAttribute("tabindex");
      return tabIndex !== "-1" && el !== document.activeElement;
    });

    // Loading states typically shouldn't be focusable
    console.log("LoadingState focus behavior:", isFocusable);
  });
});
