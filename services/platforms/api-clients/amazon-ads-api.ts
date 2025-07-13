import axios, { AxiosInstance, AxiosRequestConfig } from "axios";

import log from "@/utils/logger";

export interface AmazonAdsCredentials {
  access_token: string;
  refresh_token: string;
  profile_id: string;
  profile_type: string;
  country_code: string;
  currency_code: string;
  timezone: string;
  marketplace_id: string;
  account_info: {
    marketplaceStringId: string;
    sellerStringId: string;
    type: string;
    name: string;
    validPaymentMethod: boolean;
  };
}

export interface AmazonCampaign {
  campaignId: number;
  name: string;
  campaignType: "sponsoredProducts" | "sponsoredBrands" | "sponsoredDisplay";
  targetingType: "manual" | "auto";
  state: "enabled" | "paused" | "archived";
  dailyBudget?: number;
  budget?: {
    budget: number;
    budgetType: "daily" | "lifetime";
  };
  startDate: string;
  endDate?: string;
  premiumBidAdjustment?: boolean;
  bidding?: {
    strategy: string;
    adjustments?: Array<{
      predicate: string;
      percentage: number;
    }>;
  };
  servingStatus?: string;
  creationDate?: string;
  lastUpdatedDate?: string;
}

export interface AmazonKeyword {
  keywordId?: number;
  adGroupId: number;
  campaignId?: number;
  keywordText: string;
  matchType: "exact" | "phrase" | "broad";
  state: "enabled" | "paused" | "archived";
  bid: number;
  servingStatus?: string;
}

export interface AmazonProductTarget {
  targetId?: number;
  adGroupId: number;
  campaignId?: number;
  expression: Array<{
    type: string;
    value: string;
  }>;
  expressionType: "auto" | "manual";
  state: "enabled" | "paused" | "archived";
  bid: number;
  servingStatus?: string;
}

export interface AmazonReport {
  reportId: string;
  status: "IN_PROGRESS" | "SUCCESS" | "FAILURE";
  statusDetails?: string;
  location?: string;
  fileSize?: number;
  requestTime: string;
  startTime?: string;
  endTime?: string;
}

export interface AmazonReportRequest extends Record<string, unknown> {
  reportDate?: string;
  campaignType: "sponsoredProducts" | "sponsoredBrands" | "sponsoredDisplay";
  segment?: "query" | "placement";
  metrics: string[];
  filters?: Array<{
    field: string;
    values: string[];
  }>;
  timeUnit?: "DAILY" | "WEEKLY" | "MONTHLY";
  format?: "JSON" | "GZIP_JSON";
}

export interface RateLimitConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

export interface AmazonApiError {
  response?: {
    status: number;
    headers: Record<string, string>;
    data?: Record<string, unknown>;
  };
  config?: {
    url?: string;
    method?: string;
  };
  message: string;
}

export interface AmazonReportData {
  [key: string]: string | number | null | undefined;
}

export interface AmazonApiFilters extends Record<string, string> {
  [key: string]: string;
}

export interface AmazonProfileData {
  profileId: string | number;
  accountInfo: {
    id: string;
    type: string;
    name: string;
    validPaymentMethod: boolean;
  };
  countryCode: string;
  currencyCode: string;
  timezone: string;
  marketplaceStringId: string;
}

export class AmazonAdsApiClient {
  private client: AxiosInstance;
  private credentials: AmazonAdsCredentials;
  private rateLimitConfig: RateLimitConfig = {
    maxRetries: 5,
    baseDelay: 1000,
    maxDelay: 30000,
  };

  constructor(credentials: AmazonAdsCredentials, region = "NA") {
    this.credentials = credentials;

    const baseURL = this.getBaseUrl(region);

    this.client = axios.create({
      baseURL,
      headers: {
        Authorization: `Bearer ${credentials.access_token}`,
        "Amazon-Advertising-API-ClientId": process.env.AMAZON_CLIENT_ID!,
        "Amazon-Advertising-API-Scope": credentials.profile_id,
        "Content-Type": "application/json",
      },
      timeout: 30000,
    });

    this.setupInterceptors();
  }

  private getBaseUrl(region: string): string {
    const baseUrls = {
      NA: "https://advertising-api.amazon.com",
      EU: "https://advertising-api-eu.amazon.com",
      FE: "https://advertising-api-fe.amazon.com",
    };

    return baseUrls[region as keyof typeof baseUrls] || baseUrls.NA;
  }

  private setupInterceptors(): void {
    // 요청 인터셉터
    this.client.interceptors.request.use(
      (config) => {
        log.info("Amazon Ads API request", {
          method: config.method,
          url: config.url,
          profileId: this.credentials.profile_id,
        });

        return config;
      },
      (error) => {
        log.error("Amazon Ads API request error", { error });

        return Promise.reject(error);
      },
    );

    // 응답 인터셉터
    this.client.interceptors.response.use(
      (response) => {
        log.info("Amazon Ads API response", {
          status: response.status,
          url: response.config.url,
        });

        return response;
      },
      async (error) => {
        log.error("Amazon Ads API response error", {
          status: error.response?.status,
          url: error.config?.url,
          error: error.response?.data || error.message,
        });

        // 401 에러 시 토큰 갱신 시도
        if (error.response?.status === 401) {
          log.warn("Amazon Ads API token expired, attempting refresh");
          // 토큰 갱신 로직은 상위 서비스에서 처리
        }

        return Promise.reject(error);
      },
    );
  }

  // Rate Limiting 처리가 포함된 요청 메서드
  private async makeRequest<T>(
    method: string,
    endpoint: string,
    data?: Record<string, unknown> | Record<string, unknown>[] | string,
    config?: AxiosRequestConfig,
  ): Promise<T> {
    let attempt = 0;

    while (attempt <= this.rateLimitConfig.maxRetries) {
      try {
        const response = await this.client.request({
          method,
          url: endpoint,
          data,
          ...config,
        });

        return response.data;
      } catch (error: unknown) {
        const apiError = error as AmazonApiError;

        if (
          apiError.response?.status === 429 &&
          attempt < this.rateLimitConfig.maxRetries
        ) {
          // Rate limit 에러 시 재시도
          const retryAfter = apiError.response.headers["retry-after"];
          const delay = retryAfter
            ? parseInt(retryAfter) * 1000
            : Math.min(
                this.rateLimitConfig.baseDelay * Math.pow(2, attempt),
                this.rateLimitConfig.maxDelay,
              );

          log.warn(
            `Amazon Ads API rate limited. Retrying after ${delay}ms...`,
            {
              attempt: attempt + 1,
              maxRetries: this.rateLimitConfig.maxRetries,
            },
          );

          await new Promise((resolve) => setTimeout(resolve, delay));
          attempt++;
          continue;
        }
        throw error;
      }
    }

    throw new Error("Max retries exceeded for Amazon Ads API request");
  }

  // 캠페인 관리
  async getCampaigns(filters?: AmazonApiFilters): Promise<AmazonCampaign[]> {
    const queryParams = filters
      ? `?${new URLSearchParams(filters).toString()}`
      : "";

    return this.makeRequest("GET", `/v3/sp/campaigns${queryParams}`);
  }

  async createCampaign(
    campaignData: Partial<AmazonCampaign>,
  ): Promise<AmazonCampaign> {
    const response = await this.makeRequest<AmazonCampaign[]>(
      "POST",
      "/v3/sp/campaigns",
      [campaignData],
    );

    return response[0];
  }

  async updateCampaign(
    campaignId: string,
    updates: Partial<AmazonCampaign>,
  ): Promise<AmazonCampaign> {
    const response = await this.makeRequest<AmazonCampaign[]>(
      "PUT",
      `/v3/sp/campaigns`,
      [{ campaignId: parseInt(campaignId), ...updates }],
    );

    return response[0];
  }

  async archiveCampaign(campaignId: string): Promise<void> {
    await this.makeRequest("DELETE", `/v3/sp/campaigns/${campaignId}`);
  }

  // 키워드 관리
  async getKeywords(filters?: AmazonApiFilters): Promise<AmazonKeyword[]> {
    const queryParams = filters
      ? `?${new URLSearchParams(filters).toString()}`
      : "";

    return this.makeRequest("GET", `/v3/sp/keywords${queryParams}`);
  }

  async createKeywords(
    keywords: Partial<AmazonKeyword>[],
  ): Promise<AmazonKeyword[]> {
    return this.makeRequest("POST", "/v3/sp/keywords", keywords);
  }

  async updateKeywords(
    keywords: Partial<AmazonKeyword>[],
  ): Promise<AmazonKeyword[]> {
    return this.makeRequest("PUT", "/v3/sp/keywords", keywords);
  }

  // 제품 타겟팅 관리
  async getProductTargets(
    filters?: AmazonApiFilters,
  ): Promise<AmazonProductTarget[]> {
    const queryParams = filters
      ? `?${new URLSearchParams(filters).toString()}`
      : "";

    return this.makeRequest("GET", `/v3/sp/targets${queryParams}`);
  }

  async createProductTargets(
    targets: Partial<AmazonProductTarget>[],
  ): Promise<AmazonProductTarget[]> {
    return this.makeRequest("POST", "/v3/sp/targets", targets);
  }

  async updateProductTargets(
    targets: Partial<AmazonProductTarget>[],
  ): Promise<AmazonProductTarget[]> {
    return this.makeRequest("PUT", "/v3/sp/targets", targets);
  }

  // 보고서 관리
  async createReport(
    request: AmazonReportRequest,
  ): Promise<{ reportId: string }> {
    return this.makeRequest("POST", "/v3/reports", request);
  }

  async getReportStatus(reportId: string): Promise<AmazonReport> {
    return this.makeRequest("GET", `/v3/reports/${reportId}`);
  }

  async downloadReport(reportUrl: string): Promise<AmazonReportData[]> {
    try {
      const response = await axios.get(reportUrl, {
        headers: {
          Authorization: `Bearer ${this.credentials.access_token}`,
          "Amazon-Advertising-API-ClientId": process.env.AMAZON_CLIENT_ID!,
        },
        responseType: "arraybuffer",
      });

      // GZIP 압축 해제 (필요한 경우)
      let data = response.data;

      if (response.headers["content-encoding"] === "gzip") {
        const zlib = await import("zlib");

        data = zlib.gunzipSync(Buffer.from(data));
      }

      return JSON.parse(data.toString());
    } catch (error) {
      log.error("Failed to download Amazon report", { error, reportUrl });
      throw error;
    }
  }

  // 보고서 생성 및 폴링
  async generateReport(
    request: AmazonReportRequest,
    maxAttempts = 60,
  ): Promise<AmazonReportData[]> {
    // 1. 보고서 요청 생성
    const { reportId } = await this.createReport(request);

    // 2. 상태 폴링
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.getReportStatus(reportId);

      if (status.status === "SUCCESS" && status.location) {
        return await this.downloadReport(status.location);
      }

      if (status.status === "FAILURE") {
        throw new Error(`Report generation failed: ${status.statusDetails}`);
      }

      // 지수 백오프로 대기
      const delay = Math.min(1000 * Math.pow(1.5, attempt), 30000);

      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    throw new Error("Report generation timeout");
  }

  // 프로필 정보 조회
  async getProfiles(): Promise<AmazonProfileData[]> {
    return this.makeRequest("GET", "/v2/profiles");
  }

  // 토큰 갱신
  async refreshToken(refreshToken: string): Promise<{
    access_token: string;
    refresh_token: string;
    expires_in: number;
  }> {
    try {
      const response = await axios.post(
        "https://api.amazon.com/auth/o2/token",
        new URLSearchParams({
          grant_type: "refresh_token",
          refresh_token: refreshToken,
          client_id: process.env.AMAZON_CLIENT_ID!,
          client_secret: process.env.AMAZON_CLIENT_SECRET!,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      return response.data;
    } catch (error: unknown) {
      const apiError = error as AmazonApiError;

      log.error("Amazon token refresh failed", {
        error: apiError.response?.data || apiError.message,
      });
      throw new Error("Failed to refresh Amazon token");
    }
  }

  // 액세스 토큰 업데이트
  updateAccessToken(newAccessToken: string): void {
    this.credentials.access_token = newAccessToken;
    this.client.defaults.headers["Authorization"] = `Bearer ${newAccessToken}`;
  }
}
