// 광고 메트릭스 데이터 통합 서비스
import {
  GoogleAdsMetrics,
  MetaAdsMetrics,
  TikTokAdsMetrics,
  AmazonAdsMetrics,
  MultiPlatformMetrics,
  AggregatedMetrics,
  MetricsData,
  AdPlatform,
  DateRange,
  DashboardFilters,
  PlatformMetrics,
} from "@/types/ads-metrics.types";
import log from "@/utils/logger";
import {
  GoogleAdsTestCredentials,
  fetchCampaignMetrics,
  fetchCampaigns,
} from "@/services/platforms/api-clients/google-ads-api";
import { MetaAdsTestCredentials } from "@/services/platforms/api-clients/meta-ads-api";

export type TikTokAdsTestCredentials = Record<string, unknown>;

export type AmazonAdsTestCredentials = Record<string, unknown>;

interface PlatformCredentials {
  google_ads?: GoogleAdsTestCredentials;
  meta_ads?: MetaAdsTestCredentials;
  tiktok_ads?: TikTokAdsTestCredentials;
  amazon_ads?: AmazonAdsTestCredentials;
}

export class AdsMetricsService {
  private credentials: PlatformCredentials;
  private cache: Map<
    string,
    { data: unknown; timestamp: number; ttl: number }
  > = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5분

  constructor(credentials: PlatformCredentials) {
    this.credentials = credentials;
  }

  // 캐시 관리
  private getCacheKey(
    platform: AdPlatform,
    accountId: string,
    filters: DashboardFilters,
  ): string {
    return `${platform}_${accountId}_${JSON.stringify(filters)}`;
  }

  private getFromCache<T>(key: string): T | null {
    const cached = this.cache.get(key);

    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data as T;
    }
    this.cache.delete(key);

    return null;
  }

  private setCache(
    key: string,
    data: unknown,
    ttl: number = this.CACHE_TTL,
  ): void {
    this.cache.set(key, { data, timestamp: Date.now(), ttl });
  }

  // 날짜 범위 처리
  private getDateRange(
    dateRange: DateRange,
    customRange?: { startDate: string; endDate: string },
  ): string {
    if (dateRange === "CUSTOM" && customRange) {
      return `${customRange.startDate} AND ${customRange.endDate}`;
    }

    return dateRange;
  }

  // Google Ads 메트릭스 가져오기
  async getGoogleAdsMetrics(
    accountId: string,
    campaignId?: string,
    filters?: DashboardFilters,
  ): Promise<GoogleAdsMetrics[]> {
    if (!this.credentials.google_ads) {
      throw new Error("Google Ads 자격증명이 설정되지 않았습니다.");
    }

    const cacheKey = this.getCacheKey(
      "google_ads",
      accountId,
      filters || ({} as DashboardFilters),
    );
    const cached = this.getFromCache<GoogleAdsMetrics[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      const dateRange = this.getDateRange(
        filters?.dateRange || "LAST_30_DAYS",
        filters?.customDateRange,
      );

      if (campaignId) {
        // 특정 캠페인 메트릭스
        const response = await fetchCampaignMetrics(
          this.credentials.google_ads,
          accountId,
          campaignId,
          dateRange as "LAST_7_DAYS" | "LAST_30_DAYS" | "LAST_90_DAYS",
        );

        if (response.success && response.metrics) {
          const metrics: GoogleAdsMetrics[] = response.metrics.map(
            (metric) => ({
              impressions: parseInt(metric.impressions),
              clicks: parseInt(metric.clicks),
              cost: parseInt(metric.costMicros) / 1000000, // 마이크로 단위를 원화로 변환
              conversions: parseFloat(metric.conversions),
              ctr: parseFloat(metric.ctr),
              cpc: parseFloat(metric.averageCpc),
              cpm:
                parseInt(metric.costMicros) /
                1000000 /
                (parseInt(metric.impressions) / 1000),
              conversionRate:
                parseFloat(metric.conversions) / parseInt(metric.clicks),
              costPerConversion:
                parseFloat(metric.conversions) > 0
                  ? parseInt(metric.costMicros) /
                    1000000 /
                    parseFloat(metric.conversions)
                  : 0,
              roas:
                parseFloat(metric.conversions) > 0
                  ? (parseFloat(metric.conversions) * 50000) /
                    (parseInt(metric.costMicros) / 1000000)
                  : 0, // 임시 계산
              date: metric.date,

              // Google Ads 전용 메트릭스
              allConversions: parseFloat(metric.conversions),
              allConversionsValue: parseFloat(metric.conversions) * 50000, // 임시 값
              averageCpc: parseFloat(metric.averageCpc),
              averageCpm:
                parseInt(metric.costMicros) /
                1000000 /
                (parseInt(metric.impressions) / 1000),
              averageCpv: 0, // 비디오 광고가 아니면 0
              averageOrderValue: 50000, // 임시 값
              qualityScore: 7, // 임시 값
              historicalQualityScore: 7, // 임시 값
              searchImpressionShare: 0.65, // 임시 값
              searchRankLostImpressionShare: 0.15, // 임시 값
              searchBudgetLostImpressionShare: 0.1, // 임시 값
              topImpressionPercentage: 0.45, // 임시 값
              absoluteTopImpressionPercentage: 0.25, // 임시 값
              interactions: parseInt(metric.clicks),
              interactionRate: parseFloat(metric.ctr),
              engagements: parseInt(metric.clicks),
              engagementRate: parseFloat(metric.ctr),
              viewThroughConversions: 0, // 임시 값
              crossDeviceConversions: 0, // 임시 값
              newCustomerLifetimeValue: 0, // 임시 값

              // 추가 메트릭스들은 실제 데이터가 있을 때 구현
              customMetrics: {
                platform: "google_ads",
                accountId,
                campaignId,
              },
            }),
          );

          this.setCache(cacheKey, metrics);

          return metrics;
        }
      } else {
        // 전체 캠페인 메트릭스
        const campaignsResponse = await fetchCampaigns(
          this.credentials.google_ads,
          accountId,
        );

        if (campaignsResponse.success && campaignsResponse.campaigns) {
          const allMetrics: GoogleAdsMetrics[] = [];

          for (const campaign of campaignsResponse.campaigns) {
            const metric: GoogleAdsMetrics = {
              impressions: parseInt(campaign.impressions || "0"),
              clicks: parseInt(campaign.clicks || "0"),
              cost: parseInt(campaign.costMicros || "0") / 1000000,
              conversions: parseFloat(campaign.conversions || "0"),
              ctr: parseFloat(campaign.ctr || "0"),
              cpc: parseFloat(campaign.averageCpc || "0"),
              cpm:
                parseInt(campaign.costMicros || "0") > 0
                  ? parseInt(campaign.costMicros || "0") /
                    1000000 /
                    (parseInt(campaign.impressions || "0") / 1000)
                  : 0,
              conversionRate:
                parseInt(campaign.clicks || "0") > 0
                  ? parseFloat(campaign.conversions || "0") /
                    parseInt(campaign.clicks || "0")
                  : 0,
              costPerConversion:
                parseFloat(campaign.conversions || "0") > 0
                  ? parseInt(campaign.costMicros || "0") /
                    1000000 /
                    parseFloat(campaign.conversions || "0")
                  : 0,
              roas:
                parseFloat(campaign.conversions || "0") > 0
                  ? (parseFloat(campaign.conversions || "0") * 50000) /
                    (parseInt(campaign.costMicros || "0") / 1000000)
                  : 0,
              date: new Date().toISOString().split("T")[0],

              // Google Ads 전용 메트릭스
              allConversions: parseFloat(campaign.conversions || "0"),
              allConversionsValue:
                parseFloat(campaign.conversions || "0") * 50000,
              averageCpc: parseFloat(campaign.averageCpc || "0"),
              averageCpm:
                parseInt(campaign.costMicros || "0") > 0
                  ? parseInt(campaign.costMicros || "0") /
                    1000000 /
                    (parseInt(campaign.impressions || "0") / 1000)
                  : 0,
              averageCpv: 0,
              averageOrderValue: 50000,
              qualityScore: 7,
              historicalQualityScore: 7,
              searchImpressionShare: 0.65,
              searchRankLostImpressionShare: 0.15,
              searchBudgetLostImpressionShare: 0.1,
              topImpressionPercentage: 0.45,
              absoluteTopImpressionPercentage: 0.25,
              interactions: parseInt(campaign.clicks || "0"),
              interactionRate: parseFloat(campaign.ctr || "0"),
              engagements: parseInt(campaign.clicks || "0"),
              engagementRate: parseFloat(campaign.ctr || "0"),
              viewThroughConversions: 0,
              crossDeviceConversions: 0,
              newCustomerLifetimeValue: 0,

              campaignName: campaign.name,
              campaignType: "SEARCH",
              campaignStatus: campaign.status,

              customMetrics: {
                platform: "google_ads",
                accountId,
                campaignId: campaign.id,
                campaignName: campaign.name,
              },
            };

            allMetrics.push(metric);
          }

          this.setCache(cacheKey, allMetrics);

          return allMetrics;
        }
      }

      return [];
    } catch (error) {
      log.error("Google Ads 메트릭스 가져오기 실패:", error);
      throw error;
    }
  }

  // Meta Ads 메트릭스 가져오기
  async getMetaAdsMetrics(
    accountId: string,
    campaignId?: string,
    filters?: DashboardFilters,
  ): Promise<MetaAdsMetrics[]> {
    if (!this.credentials.meta_ads) {
      throw new Error("Meta Ads 자격증명이 설정되지 않았습니다.");
    }

    const cacheKey = this.getCacheKey(
      "meta_ads",
      accountId,
      filters || ({} as DashboardFilters),
    );
    const cached = this.getFromCache<MetaAdsMetrics[]>(cacheKey);

    if (cached) {
      return cached;
    }

    try {
      // 실제 Meta Ads API를 사용하여 메트릭스 가져오기
      const { fetchMetaCampaignMetrics } = await import(
        "@/services/platforms/api-clients/meta-ads-api"
      );

      const dateRange = this.getDateRange(
        filters?.dateRange || "LAST_30_DAYS",
        filters?.customDateRange,
      );

      const metricsResponse = await fetchMetaCampaignMetrics(
        this.credentials.meta_ads,
        accountId,
        campaignId,
        this.convertDateRangeForMeta(dateRange),
      );

      if (metricsResponse.success && metricsResponse.insights) {
        const metrics: MetaAdsMetrics[] = metricsResponse.insights.map(
          (insight) => {
            const impressions = parseInt(insight.impressions || "0");
            const clicks = parseInt(insight.clicks || "0");
            const spend = parseFloat(insight.spend || "0");
            const reach = parseInt(insight.reach || "0");
            const frequency = parseFloat(insight.frequency || "0");

            // Extract conversions from actions
            const conversions = this.extractMetaConversions(insight.actions);

            return {
              impressions,
              clicks,
              cost: spend,
              conversions,
              ctr: parseFloat(insight.ctr || "0") / 100, // Meta returns percentage
              cpc: parseFloat(insight.cpc || "0"),
              cpm: parseFloat(insight.cpm || "0"),
              conversionRate: clicks > 0 ? conversions / clicks : 0,
              costPerConversion: conversions > 0 ? spend / conversions : 0,
              roas: conversions > 0 ? (conversions * 50000) / spend : 0, // 임시 계산
              date:
                insight.date_start || new Date().toISOString().split("T")[0],

              // Meta Ads 전용 메트릭스
              reach,
              frequency,
              socialSpend: spend, // For now, treat all spend as social
              websiteClicks: this.extractActionValue(
                insight.actions,
                "link_click",
              ),
              linkClicks: this.extractActionValue(
                insight.actions,
                "link_click",
              ),
              postEngagement: this.extractActionValue(
                insight.actions,
                "post_engagement",
              ),
              pageEngagement: this.extractActionValue(
                insight.actions,
                "page_engagement",
              ),
              postShares: this.extractActionValue(insight.actions, "post"),
              postReactions: this.extractActionValue(
                insight.actions,
                "post_reaction",
              ),
              postComments: this.extractActionValue(insight.actions, "comment"),
              videoPlays: this.extractActionValue(
                insight.actions,
                "video_play",
              ),
              videoP25Watched: this.extractActionValue(
                insight.actions,
                "video_p25_watched_actions",
              ),
              videoP50Watched: this.extractActionValue(
                insight.actions,
                "video_p50_watched_actions",
              ),
              videoP75Watched: this.extractActionValue(
                insight.actions,
                "video_p75_watched_actions",
              ),
              videoP100Watched: this.extractActionValue(
                insight.actions,
                "video_p100_watched_actions",
              ),
              leadGeneration: this.extractActionValue(insight.actions, "lead"),
              messaging: this.extractActionValue(
                insight.actions,
                "onsite_conversion.messaging_conversation_started_7d",
              ),
              appInstalls: this.extractActionValue(
                insight.actions,
                "mobile_app_install",
              ),
              mobileAppPurchases: this.extractActionValue(
                insight.actions,
                "mobile_app_purchase",
              ),

              customMetrics: {
                platform: "meta_ads",
                accountId,
                campaignId: insight.campaign_id || campaignId || "unknown",
                campaignName: insight.campaign_name || "Unknown Campaign",
              },
            };
          },
        );

        this.setCache(cacheKey, metrics);

        return metrics;
      }

      return [];
    } catch (error) {
      log.error("Meta Ads 메트릭스 가져오기 실패:", error);

      // Fallback to mock data if API fails
      return this.getMetaAdsMockMetrics(accountId, campaignId);
    }
  }

  // Meta Ads 날짜 범위 변환
  private convertDateRangeForMeta(dateRange: string): string {
    switch (dateRange) {
      case "LAST_7_DAYS":
        return "last_7d";
      case "LAST_14_DAYS":
        return "last_14d";
      case "LAST_30_DAYS":
        return "last_30d";
      case "LAST_90_DAYS":
        return "last_90d";
      case "TODAY":
        return "today";
      case "YESTERDAY":
        return "yesterday";
      default:
        return "last_30d";
    }
  }

  // Meta Ads actions에서 conversions 추출
  private extractMetaConversions(
    actions?: Array<{ action_type: string; value: string }>,
  ): number {
    if (!actions) return 0;

    const conversionActionTypes = [
      "purchase",
      "lead",
      "complete_registration",
      "add_to_cart",
      "initiate_checkout",
      "onsite_conversion.purchase",
      "offsite_conversion.fb_pixel_purchase",
    ];

    return actions
      .filter((action) => conversionActionTypes.includes(action.action_type))
      .reduce((total, action) => total + parseInt(action.value || "0"), 0);
  }

  // Meta Ads actions에서 특정 액션 값 추출
  private extractActionValue(
    actions: Array<{ action_type: string; value: string }> | undefined,
    actionType: string,
  ): number {
    if (!actions) return 0;

    const action = actions.find((a) => a.action_type === actionType);

    return action ? parseInt(action.value || "0") : 0;
  }

  // Meta Ads 임시 데이터 (API 실패 시 fallback)
  private getMetaAdsMockMetrics(
    accountId: string,
    campaignId?: string,
  ): MetaAdsMetrics[] {
    return [
      {
        impressions: Math.floor(Math.random() * 100000) + 10000,
        clicks: Math.floor(Math.random() * 5000) + 500,
        cost: Math.floor(Math.random() * 500000) + 50000,
        conversions: Math.floor(Math.random() * 200) + 20,
        ctr: Math.random() * 0.05 + 0.01,
        cpc: Math.random() * 2000 + 500,
        cpm: Math.random() * 10000 + 2000,
        conversionRate: Math.random() * 0.1 + 0.01,
        costPerConversion: Math.random() * 25000 + 5000,
        roas: Math.random() * 4 + 1,
        date: new Date().toISOString().split("T")[0],

        reach: Math.floor(Math.random() * 80000) + 8000,
        frequency: Math.random() * 3 + 1,
        socialSpend: Math.floor(Math.random() * 100000) + 10000,
        websiteClicks: Math.floor(Math.random() * 3000) + 300,
        linkClicks: Math.floor(Math.random() * 4000) + 400,
        postEngagement: Math.floor(Math.random() * 1000) + 100,
        pageEngagement: Math.floor(Math.random() * 1500) + 150,
        postShares: Math.floor(Math.random() * 200) + 20,
        postReactions: Math.floor(Math.random() * 800) + 80,
        postComments: Math.floor(Math.random() * 300) + 30,
        videoPlays: Math.floor(Math.random() * 5000) + 500,
        videoP25Watched: Math.floor(Math.random() * 4000) + 400,
        videoP50Watched: Math.floor(Math.random() * 3000) + 300,
        videoP75Watched: Math.floor(Math.random() * 2000) + 200,
        videoP100Watched: Math.floor(Math.random() * 1000) + 100,
        leadGeneration: Math.floor(Math.random() * 100) + 10,
        messaging: Math.floor(Math.random() * 150) + 15,
        appInstalls: Math.floor(Math.random() * 50) + 5,
        mobileAppPurchases: Math.floor(Math.random() * 30) + 3,

        customMetrics: {
          platform: "meta_ads",
          accountId,
          campaignId: campaignId || "mock_campaign",
          campaignName: "Mock Campaign (API 연결 실패)",
        },
      },
    ];
  }

  // TikTok Ads 메트릭스 가져오기 (임시 구현)
  async getTikTokAdsMetrics(
    accountId: string,
    campaignId?: string,
  ): Promise<TikTokAdsMetrics[]> {
    // TikTok Ads API 구현 시 실제 데이터 가져오기
    const metrics: TikTokAdsMetrics[] = [
      {
        impressions: Math.floor(Math.random() * 150000) + 15000,
        clicks: Math.floor(Math.random() * 7500) + 750,
        cost: Math.floor(Math.random() * 300000) + 30000,
        conversions: Math.floor(Math.random() * 150) + 15,
        ctr: Math.random() * 0.08 + 0.02,
        cpc: Math.random() * 1500 + 300,
        cpm: Math.random() * 8000 + 1500,
        conversionRate: Math.random() * 0.08 + 0.02,
        costPerConversion: Math.random() * 20000 + 3000,
        roas: Math.random() * 3.5 + 1.5,
        date: new Date().toISOString().split("T")[0],

        // TikTok Ads 전용 메트릭스
        videoViews: Math.floor(Math.random() * 100000) + 10000,
        videoViewsP25: Math.floor(Math.random() * 80000) + 8000,
        videoViewsP50: Math.floor(Math.random() * 60000) + 6000,
        videoViewsP75: Math.floor(Math.random() * 40000) + 4000,
        videoViewsP100: Math.floor(Math.random() * 20000) + 2000,
        profileVisits: Math.floor(Math.random() * 500) + 50,
        follows: Math.floor(Math.random() * 200) + 20,
        likes: Math.floor(Math.random() * 2000) + 200,
        comments: Math.floor(Math.random() * 500) + 50,
        shares: Math.floor(Math.random() * 300) + 30,
        appInstalls: Math.floor(Math.random() * 100) + 10,
        appEvents: Math.floor(Math.random() * 200) + 20,

        customMetrics: {
          platform: "tiktok_ads",
          accountId,
          campaignId: campaignId || "default",
        },
      },
    ];

    return metrics;
  }

  // Amazon Ads 메트릭스 가져오기 (임시 구현)
  async getAmazonAdsMetrics(
    accountId: string,
    campaignId?: string,
  ): Promise<AmazonAdsMetrics[]> {
    // Amazon Ads API 구현 시 실제 데이터 가져오기
    const metrics: AmazonAdsMetrics[] = [
      {
        impressions: Math.floor(Math.random() * 80000) + 8000,
        clicks: Math.floor(Math.random() * 4000) + 400,
        cost: Math.floor(Math.random() * 400000) + 40000,
        conversions: Math.floor(Math.random() * 300) + 30,
        ctr: Math.random() * 0.06 + 0.015,
        cpc: Math.random() * 3000 + 800,
        cpm: Math.random() * 15000 + 3000,
        conversionRate: Math.random() * 0.12 + 0.03,
        costPerConversion: Math.random() * 15000 + 2000,
        roas: Math.random() * 5 + 2,
        date: new Date().toISOString().split("T")[0],

        // Amazon Ads 전용 메트릭스
        attributedSales: Math.floor(Math.random() * 2000000) + 200000,
        attributedUnitsOrdered: Math.floor(Math.random() * 500) + 50,
        attributedConversions: Math.floor(Math.random() * 300) + 30,
        acos: Math.random() * 0.3 + 0.1,
        dpv: Math.floor(Math.random() * 10000) + 1000,

        customMetrics: {
          platform: "amazon_ads",
          accountId,
          campaignId: campaignId || "default",
        },
      },
    ];

    return metrics;
  }

  // 플랫폼별 메트릭스 집계
  async getAggregatedMetrics(
    platform: AdPlatform,
    accountId: string,
    filters?: DashboardFilters,
  ): Promise<AggregatedMetrics> {
    let metrics: PlatformMetrics[] = [];

    switch (platform) {
      case "google_ads":
        metrics = await this.getGoogleAdsMetrics(accountId, undefined, filters);
        break;
      case "meta_ads":
        metrics = await this.getMetaAdsMetrics(accountId, undefined, filters);
        break;
      case "tiktok_ads":
        metrics = await this.getTikTokAdsMetrics(accountId, undefined);
        break;
      case "amazon_ads":
        metrics = await this.getAmazonAdsMetrics(accountId, undefined);
        break;
      default:
        throw new Error(`지원하지 않는 플랫폼: ${platform}`);
    }

    // 메트릭스 집계
    const totalImpressions = metrics.reduce((sum, m) => sum + m.impressions, 0);
    const totalClicks = metrics.reduce((sum, m) => sum + m.clicks, 0);
    const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
    const totalConversions = metrics.reduce((sum, m) => sum + m.conversions, 0);

    const averageCtr =
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.ctr, 0) / metrics.length
        : 0;
    const averageCpc =
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.cpc, 0) / metrics.length
        : 0;
    const averageCpm =
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.cpm, 0) / metrics.length
        : 0;
    const averageConversionRate =
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.conversionRate, 0) / metrics.length
        : 0;
    const averageCostPerConversion =
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.costPerConversion, 0) /
          metrics.length
        : 0;
    const averageRoas =
      metrics.length > 0
        ? metrics.reduce((sum, m) => sum + m.roas, 0) / metrics.length
        : 0;

    const dataPoints: MetricsData[] = metrics.map((metric) => ({
      platform,
      accountId,
      accountName: `Account ${accountId}`,
      campaignId: String(metric.customMetrics?.campaignId || "unknown"),
      campaignName: String(
        metric.customMetrics?.campaignName || "Unknown Campaign",
      ),
      dateRange: filters?.dateRange || "LAST_30_DAYS",
      metrics: metric,
      lastUpdated: new Date().toISOString(),
      currency: "KRW",
      timezone: "Asia/Seoul",
    }));

    return {
      platform,
      totalImpressions,
      totalClicks,
      totalCost,
      totalConversions,
      averageCtr,
      averageCpc,
      averageCpm,
      averageConversionRate,
      averageCostPerConversion,
      averageRoas,
      dataPoints,
      dateRange: filters?.dateRange || "LAST_30_DAYS",
      customDateRange: filters?.customDateRange,
      lastUpdated: new Date().toISOString(),
    };
  }

  // 다중 플랫폼 메트릭스 가져오기
  async getMultiPlatformMetrics(
    platformAccounts: Array<{ platform: AdPlatform; accountId: string }>,
    filters?: DashboardFilters,
  ): Promise<MultiPlatformMetrics> {
    const platformBreakdown: AggregatedMetrics[] = [];

    for (const { platform, accountId } of platformAccounts) {
      try {
        const aggregated = await this.getAggregatedMetrics(
          platform,
          accountId,
          filters,
        );

        platformBreakdown.push(aggregated);
      } catch (error) {
        log.error(`${platform} 메트릭스 가져오기 실패:`, error);
        // 실패한 플랫폼은 건너뛰고 계속 진행
      }
    }

    // 전체 집계
    const totalImpressions = platformBreakdown.reduce(
      (sum, p) => sum + p.totalImpressions,
      0,
    );
    const totalClicks = platformBreakdown.reduce(
      (sum, p) => sum + p.totalClicks,
      0,
    );
    const totalCost = platformBreakdown.reduce(
      (sum, p) => sum + p.totalCost,
      0,
    );
    const totalConversions = platformBreakdown.reduce(
      (sum, p) => sum + p.totalConversions,
      0,
    );

    const overallCtr =
      totalImpressions > 0 ? totalClicks / totalImpressions : 0;
    const overallCpc = totalClicks > 0 ? totalCost / totalClicks : 0;
    const overallCpm =
      totalImpressions > 0 ? (totalCost / totalImpressions) * 1000 : 0;
    const overallConversionRate =
      totalClicks > 0 ? totalConversions / totalClicks : 0;
    const overallCostPerConversion =
      totalConversions > 0 ? totalCost / totalConversions : 0;
    const overallRoas =
      totalCost > 0 ? (totalConversions * 50000) / totalCost : 0; // 임시 계산

    return {
      platforms: platformAccounts.map((pa) => pa.platform),
      totalImpressions,
      totalClicks,
      totalCost,
      totalConversions,
      overallCtr,
      overallCpc,
      overallCpm,
      overallConversionRate,
      overallCostPerConversion,
      overallRoas,
      platformBreakdown,
      dateRange: filters?.dateRange || "LAST_30_DAYS",
      customDateRange: filters?.customDateRange,
      lastUpdated: new Date().toISOString(),
    };
  }

  // 캐시 초기화
  clearCache(): void {
    this.cache.clear();
  }

  // 캐시 통계
  getCacheStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
