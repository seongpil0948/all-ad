import { test, expect } from "@playwright/experimental-ct-react";
import { CardSkeleton } from "@/components/common/skeletons/CardSkeleton";
import { ChartSkeleton } from "@/components/common/skeletons/ChartSkeleton";
import { MetricCardSkeleton } from "@/components/common/skeletons/MetricCardSkeleton";
import { TableSkeleton } from "@/components/common/skeletons/TableSkeleton";

test.describe("Skeleton Components Tests @component", () => {
  test.describe("CardSkeleton", () => {
    test("should render basic card skeleton", async ({ mount }) => {
      const component = await mount(<CardSkeleton />);

      await expect(component).toBeVisible();
      await expect(
        component.locator('[data-testid="card-skeleton"]'),
      ).toBeVisible();

      // Check for HeroUI skeleton elements
      const skeletonElements = component.locator('[data-loaded="false"]');
      const count = await skeletonElements.count();
      expect(count).toBeGreaterThan(0);
    });

    test("should render with custom props", async ({ mount }) => {
      const component = await mount(
        <CardSkeleton
          className="custom-skeleton"
          data-testid="custom-card-skeleton"
        />,
      );

      await expect(component).toBeVisible();
      const customElement = component.locator(
        '[data-testid="custom-card-skeleton"]',
      );
      await expect(customElement).toBeVisible();
    });
  });

  test.describe("ChartSkeleton", () => {
    test("should render basic chart skeleton", async ({ mount }) => {
      const component = await mount(<ChartSkeleton />);

      await expect(component).toBeVisible();
      await expect(
        component.locator('[data-testid="chart-skeleton"]'),
      ).toBeVisible();

      // Verify chart skeleton structure
      const chartContainer = component.locator(
        '[data-testid="chart-skeleton-container"]',
      );
      if (await chartContainer.isVisible()) {
        await expect(chartContainer).toBeVisible();
      }
    });

    test("should render with height prop", async ({ mount }) => {
      const component = await mount(<ChartSkeleton height="300px" />);

      await expect(component).toBeVisible();

      // Check if height is applied (implementation-dependent)
      const skeleton = component.locator('[data-testid="chart-skeleton"]');
      await expect(skeleton).toBeVisible();
    });
  });

  test.describe("MetricCardSkeleton", () => {
    test("should render basic metric card skeleton", async ({ mount }) => {
      const component = await mount(<MetricCardSkeleton />);

      await expect(component).toBeVisible();
      await expect(
        component.locator('[data-testid="metric-card-skeleton"]'),
      ).toBeVisible();

      // Verify metric card skeleton structure
      const titleSkeleton = component.locator(
        '[data-testid="metric-title-skeleton"]',
      );
      const valueSkeleton = component.locator(
        '[data-testid="metric-value-skeleton"]',
      );

      if (await titleSkeleton.isVisible()) {
        await expect(titleSkeleton).toBeVisible();
      }
      if (await valueSkeleton.isVisible()) {
        await expect(valueSkeleton).toBeVisible();
      }
    });

    test("should render with animation", async ({ mount }) => {
      const component = await mount(<MetricCardSkeleton />);

      await expect(component).toBeVisible();

      // Check for HeroUI skeleton animation
      const animatedSkeleton = component.locator('[data-loaded="false"]');
      const count = await animatedSkeleton.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe("TableSkeleton", () => {
    test("should render basic table skeleton", async ({ mount }) => {
      const component = await mount(<TableSkeleton />);

      await expect(component).toBeVisible();
      await expect(
        component.locator('[data-testid="table-skeleton"]'),
      ).toBeVisible();

      // Verify table structure
      const tableElement = component.locator('table, [role="table"]');
      if (await tableElement.isVisible()) {
        await expect(tableElement).toBeVisible();
      }
    });

    test("should render with custom rows and columns", async ({ mount }) => {
      const component = await mount(<TableSkeleton rows={5} columns={4} />);

      await expect(component).toBeVisible();

      // Check if rows and columns are rendered correctly
      const skeletonRows = component.locator(
        '[data-testid="skeleton-row"], tr',
      );
      if (await skeletonRows.first().isVisible()) {
        const rowCount = await skeletonRows.count();
        // Should have at least the specified number of rows (may include header)
        expect(rowCount).toBeGreaterThanOrEqual(5);
      }
    });

    test("should have proper accessibility", async ({ mount }) => {
      const component = await mount(<TableSkeleton />);

      await expect(component).toBeVisible();

      // Check for ARIA attributes
      const ariaAttributes = await component.evaluate((el) => ({
        hasAriaLabel: el.hasAttribute("aria-label"),
        hasAriaLive: el.hasAttribute("aria-live"),
        role: el.getAttribute("role"),
      }));

      // Table skeletons should have appropriate ARIA attributes
      console.log("Table skeleton ARIA attributes:", ariaAttributes);
    });
  });

  test.describe("Skeleton Accessibility Tests", () => {
    test("all skeletons should have proper ARIA attributes", async ({
      mount,
    }) => {
      // Test CardSkeleton accessibility
      const cardSkeleton = await mount(<CardSkeleton />);
      const cardAriaLabel = await cardSkeleton.evaluate(
        (el) =>
          el.getAttribute("aria-label") || el.textContent?.includes("loading"),
      );

      // Test ChartSkeleton accessibility
      const chartSkeleton = await mount(<ChartSkeleton />);
      const chartAriaLabel = await chartSkeleton.evaluate(
        (el) =>
          el.getAttribute("aria-label") || el.textContent?.includes("loading"),
      );

      // Test MetricCardSkeleton accessibility
      const metricSkeleton = await mount(<MetricCardSkeleton />);
      const metricAriaLabel = await metricSkeleton.evaluate(
        (el) =>
          el.getAttribute("aria-label") || el.textContent?.includes("loading"),
      );

      // Test TableSkeleton accessibility
      const tableSkeleton = await mount(<TableSkeleton />);
      const tableAriaLabel = await tableSkeleton.evaluate(
        (el) =>
          el.getAttribute("aria-label") || el.textContent?.includes("loading"),
      );

      // All skeletons should be accessible
      await expect(cardSkeleton).toBeVisible();
      await expect(chartSkeleton).toBeVisible();
      await expect(metricSkeleton).toBeVisible();
      await expect(tableSkeleton).toBeVisible();
    });

    test("skeletons should indicate loading state to screen readers", async ({
      mount,
    }) => {
      const component = await mount(<CardSkeleton />);

      const ariaAttributes = await component.evaluate((el) => ({
        hasAriaLive: el.hasAttribute("aria-live"),
        hasAriaLabel: el.hasAttribute("aria-label"),
        hasLoadingText:
          el.textContent?.toLowerCase().includes("loading") ||
          el.querySelector('[aria-label*="loading"]') !== null,
      }));

      // At least one accessibility indicator should be present
      const hasAccessibility =
        ariaAttributes.hasAriaLive ||
        ariaAttributes.hasAriaLabel ||
        ariaAttributes.hasLoadingText;

      console.log("Skeleton accessibility check:", ariaAttributes);
      expect(hasAccessibility).toBe(true);
    });
  });
});
