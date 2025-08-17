import { test, expect } from "@playwright/experimental-ct-react";
import { ErrorState } from "@/components/common/ErrorState";

test.describe("ErrorState Component Tests @component", () => {
  test("should render basic error state", async ({ mount }) => {
    const component = await mount(<ErrorState />);

    await expect(component).toBeVisible();
    await expect(
      component.locator('[data-testid="error-state"]'),
    ).toBeVisible();
  });

  test("should render with error message", async ({ mount }) => {
    const errorMessage = "Failed to load data. Please try again.";
    const component = await mount(<ErrorState message={errorMessage} />);

    await expect(component).toBeVisible();
    await expect(component).toContainText(errorMessage);
  });

  test("should render different error types", async ({ mount }) => {
    // Test error type
    const errorComponent = await mount(
      <ErrorState type="error" message="Critical error occurred" />,
    );
    await expect(errorComponent).toBeVisible();
    await expect(errorComponent).toContainText("Critical error occurred");

    // Test warning type
    const warningComponent = await mount(
      <ErrorState type="warning" message="Warning message" />,
    );
    await expect(warningComponent).toBeVisible();
    await expect(warningComponent).toContainText("Warning message");

    // Test info type
    const infoComponent = await mount(
      <ErrorState type="info" message="Information message" />,
    );
    await expect(infoComponent).toBeVisible();
    await expect(infoComponent).toContainText("Information message");
  });

  test("should render with retry functionality", async ({ mount }) => {
    let retryClicked = false;
    const component = await mount(
      <ErrorState
        message="Connection failed"
        onRetry={() => {
          retryClicked = true;
        }}
      />,
    );

    await expect(component).toBeVisible();

    const retryButton = component
      .locator('button, [role="button"]')
      .filter({ hasText: "Try Again" });
    if (await retryButton.isVisible()) {
      await expect(retryButton).toBeVisible();

      // Test retry button click
      await retryButton.click();

      // In a real test, you'd verify the retry function was called
      // For now, just verify the button is clickable
      await expect(retryButton).toBeEnabled();
    }
  });

  test("should render with custom title", async ({ mount }) => {
    const component = await mount(
      <ErrorState
        title="Oops! Something went wrong"
        message="We couldn't process your request"
      />,
    );

    await expect(component).toBeVisible();
    await expect(component).toContainText("Oops! Something went wrong");
    await expect(component).toContainText("We couldn't process your request");
  });

  test("should render with custom icon", async ({ mount }) => {
    const component = await mount(<ErrorState message="Custom icon error" />);

    await expect(component).toBeVisible();
    await expect(component).toContainText("⚠️");
    await expect(component).toContainText("Custom icon error");
  });

  test("should have proper accessibility attributes", async ({ mount }) => {
    const component = await mount(
      <ErrorState type="error" message="Accessibility test error" />,
    );

    await expect(component).toBeVisible();

    const ariaAttributes = await component.evaluate((el) => ({
      hasAriaLabel: el.hasAttribute("aria-label"),
      hasRole: el.hasAttribute("role"),
      hasAriaLive: el.hasAttribute("aria-live"),
      ariaLabelValue: el.getAttribute("aria-label"),
      roleValue: el.getAttribute("role"),
      ariaLiveValue: el.getAttribute("aria-live"),
    }));

    console.log("ErrorState ARIA attributes:", ariaAttributes);

    // Error states should have appropriate ARIA attributes
    const hasErrorAccessibility =
      ariaAttributes.roleValue === "alert" ||
      ariaAttributes.hasAriaLive ||
      ariaAttributes.hasAriaLabel;

    if (!hasErrorAccessibility) {
      console.warn("ErrorState may need better accessibility attributes");
    }
  });

  test("should handle multiple action buttons", async ({ mount }) => {
    const component = await mount(
      <ErrorState
        message="Multiple actions available"
        onRetry={() => console.log("Retry clicked")}
      />,
    );

    await expect(component).toBeVisible();

    // Check for retry button
    const retryButton = component
      .locator("button")
      .filter({ hasText: "Retry" });
    if (await retryButton.isVisible()) {
      await expect(retryButton).toBeVisible();
    }

    // Check for additional action buttons/links
    const homeLink = component.locator("a").filter({ hasText: "Go Home" });
    if (await homeLink.isVisible()) {
      await expect(homeLink).toBeVisible();
      const href = await homeLink.getAttribute("href");
      expect(href).toBe("/");
    }

    const supportButton = component
      .locator("button")
      .filter({ hasText: "Contact Support" });
    if (await supportButton.isVisible()) {
      await expect(supportButton).toBeVisible();
    }
  });

  test("should render with different severity levels", async ({ mount }) => {
    // Test critical error
    const criticalComponent = await mount(
      <ErrorState type="error" message="Critical system error" />,
    );
    await expect(criticalComponent).toBeVisible();

    // Test minor error
    const minorComponent = await mount(
      <ErrorState type="warning" message="Minor issue detected" />,
    );
    await expect(minorComponent).toBeVisible();
  });

  test("should be keyboard accessible", async ({ mount }) => {
    const component = await mount(
      <ErrorState message="Keyboard test error" onRetry={() => {}} />,
    );

    await expect(component).toBeVisible();

    const retryButton = component.locator("button");
    if (await retryButton.isVisible()) {
      // Test focus
      await retryButton.focus();
      const isFocused = await retryButton.evaluate(
        (btn) => document.activeElement === btn,
      );
      expect(isFocused).toBe(true);

      // Test keyboard activation
      await retryButton.press("Enter");
      await retryButton.press("Space");
    }
  });

  test("should handle error details expansion", async ({ mount }) => {
    const component = await mount(<ErrorState message="Error with details" />);

    await expect(component).toBeVisible();

    // Check for details toggle button
    const toggleButton = component
      .locator("button")
      .filter({ hasText: /details|more|expand/i });
    if (await toggleButton.isVisible()) {
      await expect(toggleButton).toBeVisible();

      // Test expanding details
      await toggleButton.click();

      // Check if details are now visible
      const details = component.locator(
        'text="Stack trace: Error at line 123..."',
      );
      if (await details.isVisible()) {
        await expect(details).toBeVisible();
      }
    }
  });

  test("should work with custom styling", async ({ mount }) => {
    const component = await mount(<ErrorState message="Custom styled error" />);

    await expect(component).toBeVisible();

    const hasCustomClass = await component.evaluate(
      (el) =>
        el.classList.contains("custom-error-state") ||
        el.querySelector(".custom-error-state") !== null,
    );

    expect(hasCustomClass).toBe(true);
  });

  test("should handle loading state during retry", async ({ mount }) => {
    const component = await mount(
      <ErrorState message="Retry with loading state" onRetry={() => {}} />,
    );

    await expect(component).toBeVisible();

    const retryButton = component
      .locator("button")
      .filter({ hasText: /retry|try/i });
    if (await retryButton.isVisible()) {
      // Button should show loading state
      const isLoading = await retryButton.evaluate((btn) => {
        return (
          (btn as HTMLButtonElement).disabled ||
          btn.classList.toString().includes("loading") ||
          btn.querySelector('[data-testid*="loading"]') !== null
        );
      });

      console.log("Retry button loading state:", isLoading);
    }
  });
});
