import { test, expect } from "@playwright/experimental-ct-react";
import { Footer } from "@/components/layouts/footer";

test.describe("Footer Component Tests @component", () => {
  test("should render basic footer structure", async ({ mount }) => {
    const component = await mount(<Footer />);

    await expect(component).toBeVisible();
    await expect(component.locator('[data-testid="footer"]')).toBeVisible();

    // Check footer role and ARIA
    const footerAttributes = await component.evaluate((el) => ({
      role: el.getAttribute("role"),
      ariaLabel: el.getAttribute("aria-label"),
    }));

    expect(footerAttributes.role).toBe("contentinfo");
    expect(footerAttributes.ariaLabel).toBe("Site footer");
  });

  test("should render company information section", async ({ mount }) => {
    const component = await mount(<Footer />);

    await expect(component).toBeVisible();

    const companyInfo = component.locator(
      '[data-testid="footer-company-info"]',
    );
    await expect(companyInfo).toBeVisible();

    // Check contact links
    await expect(
      component.locator('[data-testid="footer-email-link"]'),
    ).toBeVisible();
    await expect(
      component.locator('[data-testid="footer-phone-link"]'),
    ).toBeVisible();
  });

  test("should render all footer link sections", async ({ mount }) => {
    const component = await mount(<Footer />);

    await expect(component).toBeVisible();

    // Check main footer sections
    const sections = ["product", "resources", "company", "legal"];
    for (const section of sections) {
      await expect(
        component.locator(`[data-testid="footer-section-${section}"]`),
      ).toBeVisible();
    }
  });

  test("should render newsletter subscription form", async ({ mount }) => {
    const component = await mount(<Footer />);

    await expect(component).toBeVisible();

    const newsletter = component.locator('[data-testid="footer-newsletter"]');
    await expect(newsletter).toBeVisible();

    const form = component.locator('[data-testid="newsletter-form"]');
    await expect(form).toBeVisible();

    const emailInput = component.locator(
      '[data-testid="newsletter-email-input"]',
    );
    await expect(emailInput).toBeVisible();

    const subscribeButton = component.locator(
      '[data-testid="newsletter-subscribe-button"]',
    );
    await expect(subscribeButton).toBeVisible();
  });

  test("should handle newsletter form interaction", async ({ mount }) => {
    const component = await mount(<Footer />);

    await expect(component).toBeVisible();

    const emailInput = component.locator(
      '[data-testid="newsletter-email-input"]',
    );
    const subscribeButton = component.locator(
      '[data-testid="newsletter-subscribe-button"]',
    );

    // Test email input
    await emailInput.fill("test@example.com");
    await expect(emailInput).toHaveValue("test@example.com");

    // Test form submission (button click)
    await subscribeButton.click();
  });

  test("should render social media links", async ({ mount }) => {
    const component = await mount(<Footer />);

    await expect(component).toBeVisible();

    const socialPlatforms = ["facebook", "twitter", "linkedin", "instagram"];
    for (const platform of socialPlatforms) {
      const socialLink = component.locator(
        `[data-testid="footer-social-${platform}"]`,
      );
      await expect(socialLink).toBeVisible();
    }
  });

  test("should have proper accessibility for social links", async ({
    mount,
  }) => {
    const component = await mount(<Footer />);

    await expect(component).toBeVisible();

    const socialSection = component.locator(
      '[aria-label="Social media links"]',
    );
    await expect(socialSection).toBeVisible();

    const socialButtons = component.locator('[data-testid^="footer-social-"]');
    const count = await socialButtons.count();

    for (let i = 0; i < count; i++) {
      const button = socialButtons.nth(i);
      const ariaLabel = await button.getAttribute("aria-label");
      expect(ariaLabel).toContain("Follow us on");
    }
  });

  test("should render contact information with proper accessibility", async ({
    mount,
  }) => {
    const component = await mount(<Footer />);

    await expect(component).toBeVisible();

    const contactSection = component.locator(
      '[aria-label="Contact information"]',
    );
    await expect(contactSection).toBeVisible();

    // Check email link accessibility
    const emailLink = component.locator('[data-testid="footer-email-link"]');
    const emailAriaLabel = await emailLink.getAttribute("aria-label");
    expect(emailAriaLabel).toContain("Email us at");

    // Check phone link accessibility
    const phoneLink = component.locator('[data-testid="footer-phone-link"]');
    const phoneAriaLabel = await phoneLink.getAttribute("aria-label");
    expect(phoneAriaLabel).toContain("Call us at");
  });

  test("should render footer links with proper structure", async ({
    mount,
  }) => {
    const component = await mount(<Footer />);

    await expect(component).toBeVisible();

    // Check that all link sections have proper list structure
    const linkSections = component.locator('[data-testid^="footer-section-"]');
    const sectionCount = await linkSections.count();

    for (let i = 0; i < sectionCount; i++) {
      const section = linkSections.nth(i);
      const list = section.locator('[role="list"]');
      await expect(list).toBeVisible();

      const listItems = section.locator('[role="listitem"]');
      const itemCount = await listItems.count();
      expect(itemCount).toBeGreaterThan(0);
    }
  });

  test("should have proper form validation", async ({ mount }) => {
    const component = await mount(<Footer />);

    await expect(component).toBeVisible();

    const emailInput = component.locator(
      '[data-testid="newsletter-email-input"]',
    );

    // Check input attributes
    const inputAttributes = await emailInput.evaluate((input) => ({
      type: input.getAttribute("type"),
      required: input.hasAttribute("required"),
      ariaLabel: input.getAttribute("aria-label"),
    }));

    expect(inputAttributes.type).toBe("email");
    expect(inputAttributes.required).toBe(true);
    expect(inputAttributes.ariaLabel).toBe("Email address for newsletter");
  });

  test("should be keyboard accessible", async ({ mount }) => {
    const component = await mount(<Footer />);

    await expect(component).toBeVisible();

    // Test tab navigation through key elements
    const emailInput = component.locator(
      '[data-testid="newsletter-email-input"]',
    );
    const subscribeButton = component.locator(
      '[data-testid="newsletter-subscribe-button"]',
    );

    // Focus email input
    await emailInput.focus();
    let isFocused = await emailInput.evaluate(
      (el) => document.activeElement === el,
    );
    expect(isFocused).toBe(true);

    // Tab to subscribe button
    await emailInput.press("Tab");
    isFocused = await subscribeButton.evaluate(
      (el) => document.activeElement === el,
    );
    expect(isFocused).toBe(true);

    // Test Enter key on button
    await subscribeButton.press("Enter");
  });

  test("should display current year in copyright", async ({ mount }) => {
    const component = await mount(<Footer />);

    await expect(component).toBeVisible();

    const currentYear = new Date().getFullYear().toString();
    await expect(component).toContainText(currentYear);
  });

  test("should render responsive layout elements", async ({ mount }) => {
    const component = await mount(<Footer />);

    await expect(component).toBeVisible();

    // Check for responsive grid classes
    const mainGrid = component.locator(".grid");
    await expect(mainGrid).toBeVisible();

    // Check newsletter responsive layout
    const newsletterSection = component.locator(
      '[data-testid="footer-newsletter"]',
    );
    const hasResponsiveClasses = await newsletterSection.evaluate((el) => {
      const classes = el.className;
      return classes.includes("flex-col") || classes.includes("md:flex-row");
    });

    expect(hasResponsiveClasses).toBe(true);
  });

  test("should handle link interactions", async ({ mount }) => {
    const component = await mount(<Footer />);

    await expect(component).toBeVisible();

    // Test various footer links
    const productLink = component
      .locator('[data-testid^="footer-link-"]')
      .first();
    if (await productLink.isVisible()) {
      await productLink.hover();

      // Check if link has href attribute
      const href = await productLink.getAttribute("href");
      expect(href).toBeTruthy();
    }
  });

  test("should have semantic HTML structure", async ({ mount }) => {
    const component = await mount(<Footer />);

    await expect(component).toBeVisible();

    // Check for proper heading hierarchy
    const headings = component.locator("h3, h4, h5, h6");
    const headingCount = await headings.count();
    expect(headingCount).toBeGreaterThan(0);

    // Check for address element
    const address = component.locator("address");
    if (await address.isVisible()) {
      await expect(address).toBeVisible();
    }
  });
});
