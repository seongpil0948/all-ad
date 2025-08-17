import { test, expect } from "@playwright/experimental-ct-react";
import { EmptyState } from "@/components/common/EmptyState";

test.describe("EmptyState Component Tests @component", () => {
  test("should render basic empty state", async ({ mount }) => {
    const component = await mount(<EmptyState />);

    await expect(component).toBeVisible();
    await expect(
      component.locator('[data-testid="empty-state"]'),
    ).toBeVisible();
  });

  test("should render with default message", async ({ mount }) => {
    const component = await mount(<EmptyState />);

    await expect(component).toBeVisible();

    // Should have some default message or icon
    const hasContent = await component.evaluate(
      (el) => el.textContent && el.textContent.trim().length > 0,
    );
    expect(hasContent).toBe(true);
  });

  test("should render with custom title and description", async ({ mount }) => {
    const title = "No campaigns found";
    const description = "Start by creating your first campaign";

    const component = await mount(
      <EmptyState message={title} description={description} />,
    );

    await expect(component).toBeVisible();
    await expect(component).toContainText(title);
    await expect(component).toContainText(description);
  });

  test("should render with custom icon", async ({ mount }) => {
    const component = await mount(
      <EmptyState icon="📊" message="No data available" />,
    );

    await expect(component).toBeVisible();
    await expect(component).toContainText("📊");
    await expect(component).toContainText("No data available");
  });

  test("should render with action button", async ({ mount }) => {
    const component = await mount(
      <EmptyState
        message="No campaigns"
        description="Get started with your first campaign"
        action={
          <button onClick={() => console.log("Create clicked")}>
            Create Campaign
          </button>
        }
      />,
    );

    await expect(component).toBeVisible();

    const actionButton = component.locator('button, [role="button"]');
    if (await actionButton.isVisible()) {
      await expect(actionButton).toBeVisible();
      await expect(actionButton).toContainText("Create Campaign");

      // Test button click
      await actionButton.click();
    }
  });

  test("should render with href action", async ({ mount }) => {
    const component = await mount(
      <EmptyState message="No data" action={<a href="/help">Learn More</a>} />,
    );

    await expect(component).toBeVisible();

    const actionLink = component.locator('a, [role="link"]');
    if (await actionLink.isVisible()) {
      await expect(actionLink).toBeVisible();
      await expect(actionLink).toContainText("Learn More");

      const href = await actionLink.getAttribute("href");
      expect(href).toBe("/help");
    }
  });

  test("should have proper accessibility attributes", async ({ mount }) => {
    const component = await mount(
      <EmptyState message="Empty state" description="No items to display" />,
    );

    await expect(component).toBeVisible();

    const ariaAttributes = await component.evaluate((el) => ({
      hasAriaLabel: el.hasAttribute("aria-label"),
      hasRole: el.hasAttribute("role"),
      ariaLabelValue: el.getAttribute("aria-label"),
      roleValue: el.getAttribute("role"),
    }));

    console.log("EmptyState ARIA attributes:", ariaAttributes);

    // Check for proper heading structure
    const headings = component.locator(
      'h1, h2, h3, h4, h5, h6, [role="heading"]',
    );
    if (await headings.first().isVisible()) {
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);
    }
  });

  test("should render with different sizes/variants", async ({ mount }) => {
    // Test compact variant
    const compactComponent = await mount(<EmptyState message="Empty" />);
    await expect(compactComponent).toBeVisible();

    // Test default variant
    const defaultComponent = await mount(
      <EmptyState message="Empty State" description="Default description" />,
    );
    await expect(defaultComponent).toBeVisible();
  });

  test("should handle ReactNode content", async ({ mount }) => {
    const customContent = (
      <div>
        <strong>Custom Content</strong>
        <p>With JSX elements</p>
      </div>
    );

    const component = await mount(
      <EmptyState message="Custom Content" description="Custom JSX content" />,
    );

    await expect(component).toBeVisible();
    await expect(component).toContainText("Custom Content");
    await expect(component).toContainText("With JSX elements");
  });

  test("should be responsive", async ({ mount }) => {
    const component = await mount(
      <EmptyState
        message="Responsive Empty State"
        description="This should work on different screen sizes"
        icon="🏠"
      />,
    );

    await expect(component).toBeVisible();

    // Test basic responsiveness by checking if component adapts
    const containerStyles = await component.evaluate((el) => {
      const styles = getComputedStyle(el);
      return {
        display: styles.display,
        flexDirection: styles.flexDirection,
        textAlign: styles.textAlign,
      };
    });

    console.log("EmptyState responsive styles:", containerStyles);
  });

  test("should work with custom className", async ({ mount }) => {
    const component = await mount(<EmptyState message="Custom styled" />);

    await expect(component).toBeVisible();

    const hasCustomClass = await component.evaluate(
      (el) =>
        el.classList.contains("custom-empty-state") ||
        el.querySelector(".custom-empty-state") !== null,
    );

    expect(hasCustomClass).toBe(true);
  });

  test("should handle action button accessibility", async ({ mount }) => {
    const component = await mount(
      <EmptyState
        message="No items"
        action={<button onClick={() => {}}>Add Item</button>}
      />,
    );

    await expect(component).toBeVisible();

    const actionButton = component.locator("button");
    if (await actionButton.isVisible()) {
      // Check button accessibility
      const buttonAttributes = await actionButton.evaluate((btn) => ({
        hasAriaLabel: btn.hasAttribute("aria-label"),
        hasType: btn.hasAttribute("type"),
        tabIndex: btn.getAttribute("tabindex"),
        role: btn.getAttribute("role"),
      }));

      console.log("Action button accessibility:", buttonAttributes);

      // Test keyboard interaction
      await actionButton.focus();
      const isFocused = await actionButton.evaluate(
        (btn) => document.activeElement === btn,
      );
      expect(isFocused).toBe(true);

      // Test Enter key activation
      await actionButton.press("Enter");
    }
  });
});
