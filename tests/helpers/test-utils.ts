import { Page } from "@playwright/test";
import { test } from "../tester";

/**
 * Common test utilities for Sivera tests
 */

export interface TestUser {
  email: string;
  password: string;
  name?: string;
}

/**
 * Navigate to a page and wait for it to be fully loaded
 */
export async function navigateTo(page: Page, path: string) {
  await page.goto(path);
  await page.waitForLoadState("networkidle");
}

/**
 * Login helper function
 */
export async function login(page: Page, email: string, password: string) {
  await navigateTo(page, "/login");
  await page.fill('[data-testid="email-input"]', email);
  await page.fill('[data-testid="password-input"]', password);
  await page.click('[data-testid="login-button"]');
  await page.waitForURL(/\/dashboard/);
}

/**
 * Logout helper function
 */
export async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL(/\/login/);
}

/**
 * Wait for API response
 */
export async function waitForAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  action: () => Promise<void>,
) {
  const responsePromise = page.waitForResponse(
    (response) =>
      (typeof urlPattern === "string"
        ? response.url().includes(urlPattern)
        : urlPattern.test(response.url())) && response.status() === 200,
  );
  await action();
  return await responsePromise;
}

/**
 * Fill form field with retry logic
 */
export async function fillFormField(
  page: Page,
  selector: string,
  value: string,
  options?: { delay?: number; retry?: number },
) {
  const { delay = 50, retry = 3 } = options || {};
  let attempts = 0;

  while (attempts < retry) {
    try {
      await page.fill(selector, value, { timeout: 5000 });
      // Verify the value was set correctly
      const actualValue = await page.inputValue(selector);
      if (actualValue === value) {
        return;
      }
    } catch (error) {
      attempts++;
      if (attempts >= retry) {
        throw error;
      }
      await page.waitForTimeout(delay * attempts);
    }
  }
}

/**
 * Fill form helper function
 */
export async function fillForm(
  page: Page,
  formData: Record<string, string>,
  options?: { delay?: number },
) {
  const { delay = 100 } = options || {};

  for (const [selector, value] of Object.entries(formData)) {
    await fillFormField(page, selector, value);
    if (delay > 0) {
      await page.waitForTimeout(delay);
    }
  }
}

/**
 * Check if element is visible with retry
 */
export async function isElementVisible(
  page: Page,
  selector: string,
  timeout = 5000,
): Promise<boolean> {
  try {
    await page.waitForSelector(selector, { state: "visible", timeout });
    return true;
  } catch {
    return false;
  }
}

/**
 * Take a screenshot with annotation
 */
export async function takeScreenshot(
  page: Page,
  name: string,
  options?: { fullPage?: boolean },
) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  await page.screenshot({
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: options?.fullPage ?? false,
  });
}

/**
 * Mock API response
 */
export async function mockAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  responseData: any,
  status = 200,
) {
  await page.route(urlPattern, async (route) => {
    await route.fulfill({
      status,
      contentType: "application/json",
      body: JSON.stringify(responseData),
    });
  });
}

/**
 * Wait for loading to complete
 */
export async function waitForLoading(page: Page) {
  // Wait for any loading spinners to disappear
  const loadingSelectors = [
    '[data-testid="loading-spinner"]',
    '[data-testid="page-loader"]',
    ".loading",
    ".spinner",
  ];

  for (const selector of loadingSelectors) {
    try {
      await page.waitForSelector(selector, {
        state: "hidden",
        timeout: 1000,
      });
    } catch {
      // Ignore if selector doesn't exist
    }
  }
}

/**
 * Select platform in multi-platform selector
 */
export async function selectPlatform(
  page: Page,
  platform:
    | "Google Ads"
    | "Facebook Ads"
    | "Naver Ads"
    | "Kakao Ads"
    | "Coupang Ads",
) {
  await page.click('[data-testid="platform-selector"]');
  await page.click(`[data-platform="${platform}"]`);
}

/**
 * Format currency for Korean Won
 */
export function formatKRW(amount: number): string {
  return new Intl.NumberFormat("ko-KR", {
    style: "currency",
    currency: "KRW",
    minimumFractionDigits: 0,
  }).format(amount);
}

/**
 * Parse Korean date format
 */
export function parseKoreanDate(dateStr: string): Date {
  // Handle formats like "2024년 1월 1일" or "2024-01-01"
  const yearMonthDayPattern = /(\d{4})년?\s*(\d{1,2})월?\s*(\d{1,2})일?/;
  const match = dateStr.match(yearMonthDayPattern);

  if (match) {
    const [, year, month, day] = match;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }

  // Fallback to standard date parsing
  return new Date(dateStr);
}

/**
 * Get random test data
 */
export function getRandomTestData() {
  const timestamp = Date.now();
  return {
    email: `test+${timestamp}@example.com`,
    campaignName: `테스트 캠페인 ${timestamp}`,
    teamName: `테스트 팀 ${timestamp}`,
    timestamp,
  };
}
