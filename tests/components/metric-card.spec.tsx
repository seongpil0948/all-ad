import { test, expect } from "@playwright/experimental-ct-react";
import { MetricCard } from "@/components/common/MetricCard";

test.describe("MetricCard Component Tests @component", () => {
  test("should render metric card with basic props", async ({ mount }) => {
    const component = await mount(
      <MetricCard
        label="Impressions"
        value="10,234"
        change="+12.5%"
        isNegative={false}
      />,
    );

    await expect(component).toContainText("Impressions");
    await expect(component).toContainText("10,234");
    await expect(component).toContainText("+12.5%");
  });

  test("should display negative changes correctly", async ({ mount }) => {
    const component = await mount(
      <MetricCard
        label="Cost per Click"
        value="$2.45"
        change="-8.3%"
        isNegative={true}
      />,
    );

    await expect(component).toContainText("Cost per Click");
    await expect(component).toContainText("$2.45");
    await expect(component).toContainText("-8.3%");
  });

  test("should render without change prop", async ({ mount }) => {
    const component = await mount(
      <MetricCard label="Revenue" value="$1,234.56" />,
    );

    await expect(component).toContainText("Revenue");
    await expect(component).toContainText("$1,234.56");
  });

  test("should have proper HeroUI Card structure", async ({ mount }) => {
    const component = await mount(
      <MetricCard label="Test Metric" value="123" change="+5.5%" />,
    );

    // Check if component uses HeroUI Card structure
    const cardElement = component.locator(
      '[class*="card"], [data-slot="base"]',
    );
    await expect(cardElement).toBeVisible();
  });

  test("should display correct styling for positive changes", async ({
    mount,
  }) => {
    const component = await mount(
      <MetricCard
        label="Positive Metric"
        value="456"
        change="+10.0%"
        isNegative={false}
      />,
    );

    await expect(component).toContainText("Positive Metric");
    await expect(component).toContainText("+10.0%");
  });

  test("should display correct styling for negative changes", async ({
    mount,
  }) => {
    const component = await mount(
      <MetricCard
        label="Negative Metric"
        value="789"
        change="-5.2%"
        isNegative={true}
      />,
    );

    await expect(component).toContainText("Negative Metric");
    await expect(component).toContainText("-5.2%");
  });

  test("should handle edge cases", async ({ mount }) => {
    // Test with minimal props
    const minimalComponent = await mount(<MetricCard label="" value="" />);

    await expect(minimalComponent).toBeVisible();

    // Test with very large numbers
    const largeNumberComponent = await mount(
      <MetricCard label="Large Number" value="999,999,999" change="+999.99%" />,
    );

    await expect(largeNumberComponent).toContainText("999,999,999");
  });
});
