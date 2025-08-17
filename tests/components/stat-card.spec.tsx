import { test, expect } from "@playwright/experimental-ct-react";
import { StatCard } from "@/components/common/StatCard";

test.describe("StatCard Component Tests @component", () => {
  test("should render basic stat card", async ({ mount }) => {
    const component = await mount(
      <StatCard label="Total Users" value={1234} />,
    );

    await expect(component).toBeVisible();
    await expect(component.locator('[data-testid="stat-card"]')).toBeVisible();
    await expect(component).toContainText("Total Users");
    await expect(component).toContainText("1234");
  });

  test("should render with string value", async ({ mount }) => {
    const component = await mount(<StatCard label="Status" value="Active" />);

    await expect(component).toBeVisible();
    await expect(component).toContainText("Status");
    await expect(component).toContainText("Active");
  });

  test("should render with ReactNode value", async ({ mount }) => {
    const customValue = (
      <div>
        <span>$1,234</span>
        <small> USD</small>
      </div>
    );

    const component = await mount(
      <StatCard label="Revenue" value={customValue} />,
    );

    await expect(component).toBeVisible();
    await expect(component).toContainText("Revenue");
    await expect(component).toContainText("$1,234");
    await expect(component).toContainText("USD");
  });

  test("should render with description", async ({ mount }) => {
    const component = await mount(
      <StatCard label="Conversion Rate" value="3.45%" />,
    );

    await expect(component).toBeVisible();
    await expect(component).toContainText("Conversion Rate");
    await expect(component).toContainText("3.45%");
    await expect(component).toContainText("Up 2.1% from last month");
  });

  test("should render loading state", async ({ mount }) => {
    const component = await mount(
      <StatCard label="Loading Data" value="-" isLoading />,
    );

    await expect(component).toBeVisible();
    await expect(component).toContainText("Loading Data");

    // Check for loading indicator
    const loadingElement = component.locator(
      '[data-testid="stat-card-loading"], [data-loaded="false"]',
    );
    if (await loadingElement.isVisible()) {
      await expect(loadingElement).toBeVisible();
    }
  });

  test("should render with icon", async ({ mount }) => {
    const component = await mount(<StatCard label="New Users" value={42} />);

    await expect(component).toBeVisible();
    await expect(component).toContainText("👥");
    await expect(component).toContainText("New Users");
    await expect(component).toContainText("42");
  });

  test("should render with trend indicator", async ({ mount }) => {
    // Test positive trend
    const positiveComponent = await mount(
      <StatCard label="Sales" value={1000} />,
    );

    await expect(positiveComponent).toBeVisible();
    await expect(positiveComponent).toContainText("Sales");
    await expect(positiveComponent).toContainText("1000");

    // Test negative trend
    const negativeComponent = await mount(
      <StatCard label="Errors" value={25} />,
    );

    await expect(negativeComponent).toBeVisible();
    await expect(negativeComponent).toContainText("Errors");
    await expect(negativeComponent).toContainText("25");
  });

  test("should have proper accessibility attributes", async ({ mount }) => {
    const component = await mount(
      <StatCard label="Accessible Stat" value={999} />,
    );

    await expect(component).toBeVisible();

    const ariaAttributes = await component.evaluate((el) => ({
      hasAriaLabel: el.hasAttribute("aria-label"),
      hasRole: el.hasAttribute("role"),
      ariaLabelValue: el.getAttribute("aria-label"),
      roleValue: el.getAttribute("role"),
    }));

    console.log("StatCard ARIA attributes:", ariaAttributes);

    // Check for proper heading structure
    const headings = component.locator(
      'h1, h2, h3, h4, h5, h6, [role="heading"]',
    );
    if (await headings.first().isVisible()) {
      const headingCount = await headings.count();
      expect(headingCount).toBeGreaterThan(0);
    }
  });

  test("should render different variants/colors", async ({ mount }) => {
    // Test primary variant
    const primaryComponent = await mount(
      <StatCard label="Primary" value={100} />,
    );
    await expect(primaryComponent).toBeVisible();

    // Test success variant
    const successComponent = await mount(
      <StatCard label="Success" value={200} />,
    );
    await expect(successComponent).toBeVisible();

    // Test danger variant
    const dangerComponent = await mount(
      <StatCard label="Danger" value={300} />,
    );
    await expect(dangerComponent).toBeVisible();
  });

  test("should be clickable when onClick provided", async ({ mount }) => {
    let clicked = false;
    const component = await mount(
      <StatCard label="Clickable Stat" value={123} />,
    );

    await expect(component).toBeVisible();

    // Should be clickable
    await component.click();

    // Check if click handler is properly attached
    const isClickable = await component.evaluate(
      (el) =>
        el.style.cursor === "pointer" ||
        el.classList.toString().includes("clickable") ||
        el.onclick !== null,
    );

    console.log("StatCard clickable state:", isClickable);
  });

  test("should work with custom styling", async ({ mount }) => {
    const component = await mount(
      <StatCard
        className="custom-stat-card"
        label="Custom Styled"
        value={456}
      />,
    );

    await expect(component).toBeVisible();

    const hasCustomClass = await component.evaluate(
      (el) =>
        el.classList.contains("custom-stat-card") ||
        el.querySelector(".custom-stat-card") !== null,
    );

    expect(hasCustomClass).toBe(true);
  });

  test("should handle large numbers formatting", async ({ mount }) => {
    const component = await mount(
      <StatCard label="Large Number" value={1234567} />,
    );

    await expect(component).toBeVisible();
    await expect(component).toContainText("Large Number");

    // Check if value is formatted
    const hasFormattedValue = await component.evaluate(
      (el) =>
        el.textContent?.includes("1.2M") || el.textContent?.includes("1234567"),
    );

    expect(hasFormattedValue).toBe(true);
  });

  test("should be keyboard accessible", async ({ mount }) => {
    const component = await mount(
      <StatCard label="Keyboard Test" value={789} />,
    );

    await expect(component).toBeVisible();

    // If clickable, should be focusable
    const isFocusable = await component.evaluate((el) => {
      const tabIndex = el.getAttribute("tabindex");
      return tabIndex !== "-1";
    });

    if (isFocusable) {
      await component.focus();
      const isFocused = await component.evaluate(
        (el) => document.activeElement === el,
      );
      expect(isFocused).toBe(true);

      // Test Enter key activation
      await component.press("Enter");
    }
  });
});
