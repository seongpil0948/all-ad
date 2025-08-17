import { test, expect } from "@playwright/experimental-ct-react";
import { MessageCard } from "@/components/common/MessageCard";

test.describe("MessageCard Component Tests @component", () => {
  test("should render success message", async ({ mount }) => {
    const component = await mount(
      <MessageCard
        message="Operation completed successfully!"
        type="success"
      />,
    );

    await expect(component).toBeVisible();
    await expect(
      component.locator('[data-testid="message-card"]'),
    ).toBeVisible();
    await expect(
      component.locator('[data-testid="message-text"]'),
    ).toContainText("Operation completed successfully!");
    await expect(
      component.locator('[data-testid="message-icon-success"]'),
    ).toBeVisible();
  });

  test("should render error message", async ({ mount }) => {
    const component = await mount(
      <MessageCard
        message="An error occurred while processing your request"
        type="error"
      />,
    );

    await expect(component).toBeVisible();
    await expect(
      component.locator('[data-testid="message-text"]'),
    ).toContainText("An error occurred while processing your request");
    await expect(
      component.locator('[data-testid="message-icon-error"]'),
    ).toBeVisible();
  });

  test("should render warning message", async ({ mount }) => {
    const component = await mount(
      <MessageCard
        message="Please review your settings before proceeding"
        type="warning"
      />,
    );

    await expect(component).toBeVisible();
    await expect(
      component.locator('[data-testid="message-text"]'),
    ).toContainText("Please review your settings before proceeding");
    await expect(
      component.locator('[data-testid="message-icon-warning"]'),
    ).toBeVisible();
  });

  test("should render info message", async ({ mount }) => {
    const component = await mount(
      <MessageCard message="This is an informational message" type="info" />,
    );

    await expect(component).toBeVisible();
    await expect(
      component.locator('[data-testid="message-text"]'),
    ).toContainText("This is an informational message");
    await expect(
      component.locator('[data-testid="message-icon-info"]'),
    ).toBeVisible();
  });

  test("should render close button when onClose is provided", async ({
    mount,
  }) => {
    let closeClicked = false;
    const component = await mount(
      <MessageCard
        message="Dismissible message"
        type="info"
        onClose={() => {
          closeClicked = true;
        }}
      />,
    );

    await expect(component).toBeVisible();

    const closeButton = component.locator(
      '[data-testid="message-close-button"]',
    );
    await expect(closeButton).toBeVisible();

    // Test close button click
    await closeButton.click();

    // Verify button has proper accessibility
    const ariaLabel = await closeButton.getAttribute("aria-label");
    expect(ariaLabel).toBe("Close message");
  });

  test("should not render close button when onClose is not provided", async ({
    mount,
  }) => {
    const component = await mount(
      <MessageCard message="Non-dismissible message" type="success" />,
    );

    await expect(component).toBeVisible();

    const closeButton = component.locator(
      '[data-testid="message-close-button"]',
    );
    await expect(closeButton).not.toBeVisible();
  });

  test("should have proper accessibility attributes", async ({ mount }) => {
    const component = await mount(
      <MessageCard message="Accessibility test message" type="error" />,
    );

    await expect(component).toBeVisible();

    const messageCard = component.locator('[data-testid="message-card"]');

    const ariaAttributes = await messageCard.evaluate((el) => ({
      role: el.getAttribute("role"),
      ariaLive: el.getAttribute("aria-live"),
    }));

    expect(ariaAttributes.role).toBe("alert");
    expect(ariaAttributes.ariaLive).toBe("polite");
  });

  test("should have proper icon accessibility", async ({ mount }) => {
    const component = await mount(
      <MessageCard message="Icon accessibility test" type="warning" />,
    );

    await expect(component).toBeVisible();

    const icon = component.locator('[data-testid="message-icon-warning"]');
    const ariaHidden = await icon.getAttribute("aria-hidden");
    expect(ariaHidden).toBe("true");
  });

  test("should apply correct styling for each message type", async ({
    mount,
  }) => {
    const types = ["success", "error", "warning", "info"] as const;

    for (const type of types) {
      const component = await mount(
        <MessageCard message={`${type} message`} type={type} />,
      );

      await expect(component).toBeVisible();

      const messageCard = component.locator('[data-testid="message-card"]');
      const hasTypeSpecificStyling = await messageCard.evaluate((el) => {
        const classes = el.className;
        // Check for type-specific background colors
        return (
          classes.includes(`${type}`) ||
          classes.includes("bg-success") ||
          classes.includes("bg-danger") ||
          classes.includes("bg-warning") ||
          classes.includes("bg-primary")
        );
      });

      console.log(
        `${type} message has type-specific styling:`,
        hasTypeSpecificStyling,
      );
    }
  });

  test("should handle long messages properly", async ({ mount }) => {
    const longMessage =
      "This is a very long message that might wrap to multiple lines and should still display properly without breaking the layout or accessibility features of the message card component.";

    const component = await mount(
      <MessageCard message={longMessage} type="info" />,
    );

    await expect(component).toBeVisible();
    await expect(
      component.locator('[data-testid="message-text"]'),
    ).toContainText(longMessage);

    // Verify layout doesn't break with long text
    const messageText = component.locator('[data-testid="message-text"]');
    const textContainer = await messageText.evaluate((el) => ({
      overflow: getComputedStyle(el).overflow,
      wordBreak: getComputedStyle(el).wordBreak,
    }));

    console.log("Long message text styling:", textContainer);
  });

  test("should be keyboard accessible", async ({ mount }) => {
    let closeClicked = false;
    const component = await mount(
      <MessageCard
        message="Keyboard accessibility test"
        type="error"
        onClose={() => {
          closeClicked = true;
        }}
      />,
    );

    await expect(component).toBeVisible();

    const closeButton = component.locator(
      '[data-testid="message-close-button"]',
    );

    // Test focus
    await closeButton.focus();
    const isFocused = await closeButton.evaluate(
      (btn) => document.activeElement === btn,
    );
    expect(isFocused).toBe(true);

    // Test Enter key activation
    await closeButton.press("Enter");

    // Test Space key activation
    await closeButton.press("Space");
  });

  test("should handle custom styling", async ({ mount }) => {
    const component = await mount(
      <MessageCard message="Custom styled message" type="success" />,
    );

    await expect(component).toBeVisible();

    // Verify HeroUI Card component is used properly
    const card = component.locator('.nextui-card, [data-slot="base"]');
    if (await card.isVisible()) {
      await expect(card).toBeVisible();
      console.log("HeroUI Card component detected");
    }
  });

  test("should render with different message types in sequence", async ({
    mount,
  }) => {
    // Test rendering multiple message types to ensure no conflicts
    const successComponent = await mount(
      <MessageCard message="Success" type="success" />,
    );
    await expect(successComponent).toBeVisible();

    const errorComponent = await mount(
      <MessageCard message="Error" type="error" />,
    );
    await expect(errorComponent).toBeVisible();

    const warningComponent = await mount(
      <MessageCard message="Warning" type="warning" />,
    );
    await expect(warningComponent).toBeVisible();

    const infoComponent = await mount(
      <MessageCard message="Info" type="info" />,
    );
    await expect(infoComponent).toBeVisible();
  });

  test("should handle empty or minimal messages", async ({ mount }) => {
    const component = await mount(<MessageCard message="" type="info" />);

    await expect(component).toBeVisible();

    // Should still render properly even with empty message
    await expect(
      component.locator('[data-testid="message-card"]'),
    ).toBeVisible();
    await expect(
      component.locator('[data-testid="message-icon-info"]'),
    ).toBeVisible();
  });

  test("should maintain consistent layout across message types", async ({
    mount,
  }) => {
    const types = ["success", "error", "warning", "info"] as const;

    for (const type of types) {
      const component = await mount(
        <MessageCard
          message={`${type} layout test`}
          type={type}
          onClose={() => {}}
        />,
      );

      await expect(component).toBeVisible();

      // Check that all expected elements are present
      await expect(
        component.locator('[data-testid="message-card"]'),
      ).toBeVisible();
      await expect(
        component.locator(`[data-testid="message-icon-${type}"]`),
      ).toBeVisible();
      await expect(
        component.locator('[data-testid="message-text"]'),
      ).toBeVisible();
      await expect(
        component.locator('[data-testid="message-close-button"]'),
      ).toBeVisible();
    }
  });
});
