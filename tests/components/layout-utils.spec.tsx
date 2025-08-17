import { test, expect } from "@playwright/experimental-ct-react";
import React from "react";
import { Container } from "@/components/layouts/Container";
import { AutoGrid } from "@/components/common/AutoGrid";

test.describe("Layout utilities @component", () => {
  test("Container applies padding and default max width", async ({ mount }) => {
    const component = await mount(
      <Container data-testid="container">
        <div>content</div>
      </Container>,
    );

    const el = component.locator('[data-testid="container"]');
    const className = await el.getAttribute("class");
    expect(className).toContain("px-4");
    expect(className).toContain("sm:px-6");
    expect(className).toContain("lg:px-8");
    expect(className).toContain("max-w-7xl");
  });

  test("Container respects max prop", async ({ mount }) => {
    const component = await mount(
      <Container data-testid="container" max="4xl">
        <div>content</div>
      </Container>,
    );
    const className = await component
      .locator('[data-testid="container"]')
      .getAttribute("class");
    expect(className).toContain("max-w-4xl");
  });

  test("AutoGrid sets minmax and grid role", async ({ mount }) => {
    const items = new Array(5).fill(0).map((_, i) => (
      <div key={i} data-testid={`item-${i}`}>
        item {i}
      </div>
    ));

    const component = await mount(
      <AutoGrid data-testid="autogrid" minItemWidth={260}>
        {items}
      </AutoGrid>,
    );

    const el = component.locator('[data-testid="autogrid"]');
    await expect(el).toHaveAttribute("role", "grid");
    const style = await el.evaluate((n) => (n as HTMLElement).style.cssText);
    expect(style).toContain("minmax(260px, 1fr)");
  });
});
