import { test, expect } from "@playwright/experimental-ct-react";
import { AnimatedMetricCard } from "@/components/common/AnimatedMetricCard";

test.describe("AnimatedMetricCard Component Tests @component", () => {
  test("should render basic animated metric card", async ({ mount }) => {
    const component = await mount(
      <AnimatedMetricCard label="Total Revenue" value={1234567} />,
    );

    await expect(component).toBeVisible();
    await expect(
      component.locator('[data-testid="animated-metric-card"]'),
    ).toBeVisible();
    await expect(component).toContainText("Total Revenue");
  });

  test("should render with string value", async ({ mount }) => {
    const component = await mount(
      <AnimatedMetricCard
        label="Status"
        value="Active"
        animateNumber={false}
      />,
    );

    await expect(component).toBeVisible();
    await expect(component).toContainText("Status");
    await expect(component).toContainText("Active");
  });

  test("should render with prefix and suffix", async ({ mount }) => {
    const component = await mount(
      <AnimatedMetricCard
        label="Revenue"
        value={1000}
        prefix="$"
        suffix=" USD"
      />,
    );

    await expect(component).toBeVisible();
    await expect(component).toContainText("Revenue");
    await expect(component).toContainText("$");
    await expect(component).toContainText("USD");
  });

  test("should render with positive change indicator", async ({ mount }) => {
    const component = await mount(
      <AnimatedMetricCard
        label="Sales Growth"
        value={15.5}
        change="+12.3%"
        isNegative={false}
      />,
    );

    await expect(component).toBeVisible();
    await expect(component).toContainText("Sales Growth");
    await expect(component).toContainText("+12.3%");
    await expect(component).toContainText("▲"); // Up arrow

    const changeElement = component.locator(
      '[data-testid="metric-change-sales-growth"]',
    );
    await expect(changeElement).toBeVisible();
  });

  test("should render with negative change indicator", async ({ mount }) => {
    const component = await mount(
      <AnimatedMetricCard
        label="Error Rate"
        value={2.1}
        change="-0.5%"
        isNegative={true}
      />,
    );

    await expect(component).toBeVisible();
    await expect(component).toContainText("Error Rate");
    await expect(component).toContainText("-0.5%");
    await expect(component).toContainText("▼"); // Down arrow

    const changeElement = component.locator(
      '[data-testid="metric-change-error-rate"]',
    );
    await expect(changeElement).toBeVisible();
  });

  test("should render with icon", async ({ mount }) => {
    const icon = <span data-testid="custom-icon">💰</span>;
    const component = await mount(
      <AnimatedMetricCard label="Total Earnings" value={5000} icon={icon} />,
    );

    await expect(component).toBeVisible();
    await expect(component).toContainText("Total Earnings");
    await expect(
      component.locator('[data-testid="custom-icon"]'),
    ).toBeVisible();
  });

  test("should have proper accessibility attributes", async ({ mount }) => {
    const component = await mount(
      <AnimatedMetricCard
        label="Conversion Rate"
        value={3.45}
        change="+0.2%"
        suffix="%"
      />,
    );

    await expect(component).toBeVisible();

    // Check Card accessibility
    const card = component.locator('[role="region"]');
    await expect(card).toBeVisible();

    const cardAriaLabelledBy = await card.getAttribute("aria-labelledby");
    expect(cardAriaLabelledBy).toBe("metric-conversion-rate");

    // Check value accessibility
    const valueElement = component.locator(
      '[data-testid="metric-value-conversion-rate"]',
    );
    const valueAriaLabel = await valueElement.getAttribute("aria-label");
    expect(valueAriaLabel).toContain("Conversion Rate value:");
  });

  test("should have proper change accessibility", async ({ mount }) => {
    const component = await mount(
      <AnimatedMetricCard
        label="User Growth"
        value={1200}
        change="+150"
        isNegative={false}
      />,
    );

    await expect(component).toBeVisible();

    const changeElement = component.locator(
      '[data-testid="metric-change-user-growth"]',
    );
    const changeAriaLabel = await changeElement.getAttribute("aria-label");
    expect(changeAriaLabel).toContain("Change: +150 increase");
  });

  test("should render with different shadow and radius props", async ({
    mount,
  }) => {
    // Test different shadow values
    const shadowComponent = await mount(
      <AnimatedMetricCard label="Shadow Test" value={100} shadow="lg" />,
    );
    await expect(shadowComponent).toBeVisible();

    // Test different radius values
    const radiusComponent = await mount(
      <AnimatedMetricCard label="Radius Test" value={200} radius="lg" />,
    );
    await expect(radiusComponent).toBeVisible();
  });

  test("should handle animation properties", async ({ mount }) => {
    const component = await mount(
      <AnimatedMetricCard
        label="Animated Number"
        value={1000}
        animateNumber={true}
      />,
    );

    await expect(component).toBeVisible();

    // Wait for initial render
    await component.waitFor({ state: "visible" });

    // Check if motion elements are rendered
    const motionElements = component.locator(
      '[data-testid="animated-metric-card"]',
    );
    await expect(motionElements).toBeVisible();
  });

  test("should disable number animation when specified", async ({ mount }) => {
    const component = await mount(
      <AnimatedMetricCard
        label="Static Number"
        value={500}
        animateNumber={false}
      />,
    );

    await expect(component).toBeVisible();
    await expect(component).toContainText("Static Number");
    await expect(component).toContainText("500");
  });

  test("should handle hover interactions", async ({ mount }) => {
    const component = await mount(
      <AnimatedMetricCard label="Hover Test" value={750} />,
    );

    await expect(component).toBeVisible();

    // Test hover behavior
    await component.hover();

    // Component should remain visible and functional after hover
    await expect(component).toBeVisible();
    await expect(component).toContainText("Hover Test");
  });

  test("should format numbers properly", async ({ mount }) => {
    const largeNumber = 1234567;
    const component = await mount(
      <AnimatedMetricCard label="Large Number" value={largeNumber} />,
    );

    await expect(component).toBeVisible();

    // Check if number is present (may be formatted)
    const hasNumber = await component.evaluate(
      (el) =>
        el.textContent?.includes("1,234,567") ||
        el.textContent?.includes("1234567"),
    );

    expect(hasNumber).toBe(true);
  });

  test("should handle icon accessibility", async ({ mount }) => {
    const icon = <span>📊</span>;
    const component = await mount(
      <AnimatedMetricCard label="Chart Data" value={999} icon={icon} />,
    );

    await expect(component).toBeVisible();

    // Check icon container has proper accessibility
    const iconContainer = component.locator('[role="presentation"]');
    if (await iconContainer.isVisible()) {
      const ariaHidden = await iconContainer.getAttribute("aria-hidden");
      expect(ariaHidden).toBe("true");
    }
  });

  test("should render multiple cards without conflicts", async ({ mount }) => {
    // Test rendering multiple cards to ensure no ID conflicts
    const component = await mount(
      <div>
        <AnimatedMetricCard label="Card One" value={100} />
        <AnimatedMetricCard label="Card Two" value={200} />
        <AnimatedMetricCard label="Card Three" value={300} />
      </div>,
    );

    await expect(component).toBeVisible();

    // All cards should be visible with unique identifiers
    await expect(component).toContainText("Card One");
    await expect(component).toContainText("Card Two");
    await expect(component).toContainText("Card Three");

    // Check for unique value elements
    await expect(
      component.locator('[data-testid="metric-value-card-one"]'),
    ).toBeVisible();
    await expect(
      component.locator('[data-testid="metric-value-card-two"]'),
    ).toBeVisible();
    await expect(
      component.locator('[data-testid="metric-value-card-three"]'),
    ).toBeVisible();
  });

  test("should handle edge cases", async ({ mount }) => {
    // Test with zero value
    const zeroComponent = await mount(
      <AnimatedMetricCard label="Zero Value" value={0} />,
    );
    await expect(zeroComponent).toBeVisible();
    await expect(zeroComponent).toContainText("0");

    // Test with very large number
    const largeComponent = await mount(
      <AnimatedMetricCard label="Large Value" value={999999999} />,
    );
    await expect(largeComponent).toBeVisible();
  });

  test("should maintain semantic structure", async ({ mount }) => {
    const component = await mount(
      <AnimatedMetricCard label="Semantic Test" value={888} change="+5%" />,
    );

    await expect(component).toBeVisible();

    // Check for proper heading structure via ID
    const heading = component.locator("#metric-semantic-test");
    await expect(heading).toBeVisible();

    // Verify the label is associated with the metric
    const metricValue = component.locator(
      '[aria-labelledby="metric-semantic-test"]',
    );
    await expect(metricValue).toBeVisible();
  });

  test("should handle framer-motion integration", async ({ mount }) => {
    const component = await mount(
      <AnimatedMetricCard label="Animation Test" value={444} />,
    );

    await expect(component).toBeVisible();

    // Verify the component renders properly with motion elements
    const animatedContainer = component.locator(
      '[data-testid="animated-metric-card"]',
    );
    await expect(animatedContainer).toBeVisible();

    // Check that component doesn't crash with animations
    await component.waitFor({ state: "visible", timeout: 3000 });
  });
});
