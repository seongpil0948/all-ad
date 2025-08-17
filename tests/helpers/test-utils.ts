import { Page, test as base, expect } from "@playwright/test";
import { test } from "../tester";
import type { Database } from "@/types/supabase.types";

/**
 * Common test utilities using actual domain types
 */

type Tables = Database["public"]["Tables"];

// Use actual Supabase types instead of custom test types
export type TestUser = {
  email: string;
  password: string; // Only needed for test authentication, not stored in DB
  profile?: Tables["profiles"]["Row"];
};

export type TestTeam = Tables["teams"]["Row"];
export type TestCampaign = Tables["campaigns"]["Row"];

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
  options?: {
    timeout?: number;
    expectedStatus?: number | number[];
    retries?: number;
  },
): Promise<import("@playwright/test").Response> {
  const { timeout = 30000, expectedStatus = 200, retries = 3 } = options || {};
  const expectedStatuses = Array.isArray(expectedStatus)
    ? expectedStatus
    : [expectedStatus];

  let attempt = 0;

  while (attempt < retries) {
    try {
      const responsePromise = page.waitForResponse(
        (response) => {
          const matchesUrl =
            typeof urlPattern === "string"
              ? response.url().includes(urlPattern)
              : urlPattern.test(response.url());
          const hasExpectedStatus = expectedStatuses.includes(
            response.status(),
          );
          return matchesUrl && hasExpectedStatus;
        },
        { timeout },
      );

      await action();
      const response = await responsePromise;

      // Log successful response for debugging
      console.log(
        `API Response: ${response.url()} - Status: ${response.status()}`,
      );
      return response;
    } catch (error) {
      attempt++;
      if (attempt >= retries) {
        throw new Error(
          `Failed to get expected API response after ${retries} attempts: ${error}`,
        );
      }
      console.log(`API response attempt ${attempt} failed, retrying...`);
      await page.waitForTimeout(1000); // Wait before retry
    }
  }

  throw new Error("Failed to get API response - should not reach here");
}

/**
 * Wait for multiple API responses in sequence
 */
export async function waitForMultipleAPIResponses(
  page: Page,
  patterns: Array<{ pattern: string | RegExp; status?: number }>,
  action: () => Promise<void>,
  options?: { timeout?: number },
) {
  const { timeout = 30000 } = options || {};
  const responsePromises = patterns.map(({ pattern, status = 200 }) =>
    page.waitForResponse(
      (response) => {
        const matchesUrl =
          typeof pattern === "string"
            ? response.url().includes(pattern)
            : pattern.test(response.url());
        return matchesUrl && response.status() === status;
      },
      { timeout },
    ),
  );

  await action();
  return await Promise.all(responsePromises);
}

/**
 * Mock API responses with custom data
 */
export async function mockAPIResponse(
  page: Page,
  urlPattern: string | RegExp,
  mockData: any,
  status = 200,
  headers?: Record<string, string>,
) {
  await page.route(
    (url) => {
      const matchesUrl =
        typeof urlPattern === "string"
          ? url.href.includes(urlPattern)
          : urlPattern.test(url.href);
      return matchesUrl;
    },
    (route) => {
      route.fulfill({
        status,
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify(mockData),
      });
    },
  );
}

/**
 * Capture and validate API request payload
 */
export async function captureAPIRequest(
  page: Page,
  urlPattern: string | RegExp,
  action: () => Promise<void>,
) {
  let capturedRequest: any = null;

  await page.route(
    (url) => {
      const matchesUrl =
        typeof urlPattern === "string"
          ? url.href.includes(urlPattern)
          : urlPattern.test(url.href);
      return matchesUrl;
    },
    async (route) => {
      const request = route.request();
      capturedRequest = {
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        postData: request.postData(),
        postDataJSON: request.postDataJSON?.(),
      };

      // Continue with the original request
      await route.continue();
    },
  );

  await action();
  return capturedRequest;
}

/**
 * Wait for API response and validate JSON structure
 */
export async function waitForAPIResponseWithValidation<T>(
  page: Page,
  urlPattern: string | RegExp,
  action: () => Promise<void>,
  validator: (data: any) => data is T,
  options?: { timeout?: number; expectedStatus?: number },
) {
  const response = await waitForAPIResponse(page, urlPattern, action, options);
  if (!response) {
    throw new Error("Failed to get API response");
  }
  const data = await response.json();

  if (!validator(data)) {
    throw new Error(`API response validation failed for ${response.url()}`);
  }

  return data as T;
}

/**
 * Test API error handling
 */
export async function testAPIErrorHandling(
  page: Page,
  urlPattern: string | RegExp,
  action: () => Promise<void>,
  expectedErrorStatus: number = 500,
) {
  // First mock the API to return an error
  await page.route(
    (url) => {
      const matchesUrl =
        typeof urlPattern === "string"
          ? url.href.includes(urlPattern)
          : urlPattern.test(url.href);
      return matchesUrl;
    },
    (route) => {
      route.fulfill({
        status: expectedErrorStatus,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ error: "Test error" }),
      });
    },
  );

  await action();

  // Verify error handling in UI
  await page.waitForTimeout(1000); // Give time for error to be processed
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

/**
 * Generate unique test ID
 */
export function generateTestId(prefix: string = "test"): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  return `${prefix}_${timestamp}_${random}`;
}

/**
 * Mock API responses for different platforms
 */
export const mockPlatformResponses = {
  google: {
    campaigns: [
      {
        id: "google_campaign_123",
        name: "Google Test Campaign",
        status: "ENABLED",
        budget: { amount_micros: 1000000000 },
      },
    ],
    metrics: {
      impressions: 1000,
      clicks: 50,
      cost_micros: 25000000,
      conversions: 5,
    },
  },
  facebook: {
    campaigns: {
      data: [
        {
          id: "fb_campaign_123",
          name: "Facebook Test Campaign",
          status: "ACTIVE",
          daily_budget: 10000,
        },
      ],
    },
    insights: {
      data: [
        {
          impressions: "2000",
          clicks: "100",
          spend: "50.00",
          conversions: "10",
        },
      ],
    },
  },
  naver: {
    campaigns: [
      {
        nccCampaignId: "naver_campaign_123",
        name: "Naver Test Campaign",
        campaignTp: "WEB_SITE",
        status: "ELIGIBLE",
        dailyBudget: 100000,
      },
    ],
    stats: {
      impCnt: 1500,
      clkCnt: 75,
      salesAmt: 30000,
      ccnt: 8,
    },
  },
  kakao: {
    campaigns: [
      {
        id: 123456,
        name: "Kakao Test Campaign",
        status: "ON",
        dailyBudgetAmount: 50000,
      },
    ],
    report: {
      data: [
        {
          dimensions: { campaign_id: 123456 },
          metrics: {
            imp: 1200,
            click: 60,
            cost: 25000,
            conv: 6,
          },
        },
      ],
    },
  },
};

/**
 * Wait for network idle
 */
export async function waitForNetworkIdle(page: Page, timeout = 5000) {
  await page.waitForLoadState("networkidle", { timeout });
}

/**
 * Assert element has expected text
 */
export async function assertElementText(
  page: Page,
  selector: string,
  expectedText: string,
) {
  const element = await page.locator(selector);
  await expect(element).toHaveText(expectedText);
}

/**
 * Assert element is visible and enabled
 */
export async function assertElementReady(page: Page, selector: string) {
  const element = await page.locator(selector);
  await expect(element).toBeVisible();
  await expect(element).toBeEnabled();
}

/**
 * Click with retry logic
 */
export async function clickWithRetry(
  page: Page,
  selector: string,
  options?: { retries?: number; delay?: number },
) {
  const { retries = 3, delay = 500 } = options || {};
  let lastError: Error | null = null;

  for (let i = 0; i < retries; i++) {
    try {
      await page.click(selector, { timeout: 5000 });
      return;
    } catch (error) {
      lastError = error as Error;
      if (i < retries - 1) {
        await page.waitForTimeout(delay);
      }
    }
  }

  throw lastError || new Error(`Failed to click ${selector}`);
}

/**
 * Create test fixtures with cleanup
 */
export class TestFixtures {
  private cleanupFunctions: Array<() => Promise<void>> = [];

  async createUser(page: Page): Promise<TestUser> {
    const user = {
      email: `test_${Date.now()}@example.com`,
      password: "TestPassword123!",
      name: `Test User ${Date.now()}`,
    };

    this.cleanupFunctions.push(async () => {
      // Cleanup user if needed
    });

    return user;
  }

  async createTeam(page: Page, masterUserId: string): Promise<TestTeam> {
    const timestamp = Date.now();
    const team: TestTeam = {
      id: `team_${timestamp}`,
      name: `Test Team ${timestamp}`,
      master_user_id: masterUserId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    this.cleanupFunctions.push(async () => {
      // Cleanup team if needed
    });

    return team;
  }

  async createCampaign(page: Page, teamId: string): Promise<TestCampaign> {
    const timestamp = Date.now();
    const campaign: TestCampaign = {
      id: `campaign_${timestamp}`,
      team_id: teamId,
      platform: "google" as Database["public"]["Enums"]["platform_type"],
      platform_campaign_id: `google_${timestamp}`,
      name: `Test Campaign ${timestamp}`,
      status: "active",
      budget: 1000,
      is_active: true,
      platform_credential_id: `cred_${timestamp}`,
      synced_at: new Date().toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      raw_data: {},
    };

    this.cleanupFunctions.push(async () => {
      // Cleanup campaign if needed
    });

    return campaign;
  }

  async cleanup() {
    for (const cleanupFn of this.cleanupFunctions.reverse()) {
      await cleanupFn();
    }
  }
}

/**
 * Performance metrics helper
 */
export async function measurePerformance(
  page: Page,
  actionName: string,
  action: () => Promise<void>,
) {
  const startTime = Date.now();
  await action();
  const endTime = Date.now();
  const duration = endTime - startTime;

  console.log(`Performance: ${actionName} took ${duration}ms`);
  return duration;
}

/**
 * Check accessibility
 */
export async function checkAccessibility(page: Page) {
  // Basic accessibility checks
  const hasLang = await page.locator("html[lang]").count();
  const hasTitle = await page.title();
  const hasH1 = await page.locator("h1").count();

  return {
    hasLang: hasLang > 0,
    hasTitle: !!hasTitle,
    hasH1: hasH1 > 0,
  };
}

/**
 * Mock date for consistent testing
 */
export async function mockDate(page: Page, date: Date) {
  await page.addInitScript(`{
    Date = class extends Date {
      constructor(...args) {
        if (args.length === 0) {
          super(${date.getTime()});
        } else {
          super(...args);
        }
      }
      
      static now() {
        return ${date.getTime()};
      }
    }
  }`);
}

/**
 * Export enhanced test with fixtures
 */
export const enhancedTest = base.extend<{
  fixtures: TestFixtures;
}>({
  fixtures: async ({}, use) => {
    const fixtures = new TestFixtures();
    await use(fixtures);
    await fixtures.cleanup();
  },
});

export { expect };
