import { test, expect } from "@playwright/experimental-ct-react";
import { SkipLink } from "@/components/common/SkipLink";

test.describe("SkipLink Component @component", () => {
  test("renders and is focusable", async ({ mount }) => {
    const component = await mount(<SkipLink />);

    const link = component.locator('[data-testid="skip-to-content"]');
    await expect(link).toBeVisible();

    // Move focus to the link and ensure it’s focusable
    await link.focus();
    const isFocused = await link.evaluate(
      (el) => document.activeElement === el,
    );
    expect(isFocused).toBe(true);

    // Verify href points to main content anchor
    await expect(link).toHaveAttribute("href", "#main-content");
  });
});
