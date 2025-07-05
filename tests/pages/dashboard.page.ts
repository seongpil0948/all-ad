import { Page, Locator } from "@playwright/test";
import { gotoWithLang } from "../utils/navigation";

export class DashboardPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly totalSpendCard: Locator;
  readonly totalClicksCard: Locator;
  readonly totalImpressionsCard: Locator;
  readonly avgCPCCard: Locator;
  readonly dateRangePicker: Locator;
  readonly platformTabs: Locator;
  readonly campaignTable: Locator;
  readonly refreshButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByRole("heading", { name: "대시보드" });
    this.totalSpendCard = page.locator('[data-metric="총 지출"]');
    this.totalClicksCard = page.locator('[data-metric="총 클릭"]');
    this.totalImpressionsCard = page.locator('[data-metric="총 노출"]');
    this.avgCPCCard = page.locator('[data-metric="평균 CPC"]');
    this.dateRangePicker = page.locator('[data-testid="date-range-picker"]');
    this.platformTabs = page.locator('[role="tablist"]');
    this.campaignTable = page.locator('[data-testid="campaign-table"]');
    this.refreshButton = page.locator('[data-testid="refresh-button"]');
  }

  async goto() {
    await gotoWithLang(this.page, "dashboard");
    await this.page.waitForLoadState("networkidle");
  }

  async selectDateRange(
    range: "today" | "yesterday" | "last7days" | "last30days",
  ) {
    await this.dateRangePicker.click();
    const rangeMap = {
      today: "오늘",
      yesterday: "어제",
      last7days: "최근 7일",
      last30days: "최근 30일",
    };
    await this.page.getByRole("option", { name: rangeMap[range] }).click();
  }

  async selectPlatform(platform: string) {
    await this.page.getByRole("tab", { name: platform }).click();
  }

  async getMetricValue(metric: "spend" | "clicks" | "impressions" | "cpc") {
    const metricMap = {
      spend: this.totalSpendCard,
      clicks: this.totalClicksCard,
      impressions: this.totalImpressionsCard,
      cpc: this.avgCPCCard,
    };
    const card = metricMap[metric];
    const valueElement = card.locator('[data-testid="metric-value"]');
    return await valueElement.textContent();
  }

  async getCampaignCount() {
    const rows = this.campaignTable.locator('[data-testid="campaign-row"]');
    return await rows.count();
  }

  async refreshData() {
    await this.refreshButton.click();
    await this.page.waitForLoadState("networkidle");
  }

  async waitForDataLoad() {
    // Wait for loading indicators to disappear
    await this.page.waitForSelector('[data-testid="loading-spinner"]', {
      state: "hidden",
      timeout: 10000,
    });
  }
}
