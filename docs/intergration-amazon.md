# Amazon Advertising API v3 상세 기술 가이드

Amazon Advertising API v3는 프로그래매틱 광고 관리의 진화된 형태로, 현재 단계적 마이그레이션이 진행 중입니다. Sponsored Products는 2023년 3월부터 v3로 완전히 전환되었으며, Sponsored Brands와 Display는 대부분의 작업에서 v2를 유지하고 있습니다.

## 1. Amazon Advertising API v3 개요 및 광고 유형별 상세 설명

### 1.1 Sponsored Products (v3 완전 지원)

**주요 특징 및 기능:**

- 검색 결과 및 제품 상세 페이지에 나타나는 키워드 타겟팅 광고
- 세 가지 타겟팅 유형: 키워드, 제품, 자동 타겟팅
- 배치 승수를 포함한 동적 입찰 전략
- v3에서 향상된 성과 측정 지표

**타겟팅 옵션:**

- **키워드 타겟팅**: 정확, 구문, 광범위 일치 유형
- **제품 타겟팅**: ASIN 기반 타겟팅, 카테고리 타겟팅
- **자동 타겟팅**: Amazon 알고리즘 기반 타겟팅

**TypeScript 구현 예제:**

```typescript
import {
  AmazonAds,
  SponsoredProductsClient,
} from "@whitebox-co/amazon-ads-api";

// 캠페인 생성
const campaignData = {
  name: "SP Campaign - Holiday 2024",
  campaignType: "sponsoredProducts",
  targetingType: "manual",
  state: "enabled",
  dailyBudget: 100.0,
  startDate: "20241201",
  bidding: {
    strategy: "legacyForSales",
    adjustments: [
      {
        predicate: "placementTop",
        percentage: 50,
      },
    ],
  },
};

const campaign = await sponsoredProductsClient.createCampaigns([campaignData]);
```

### 1.2 Sponsored Brands (v2 위주, 제한적 v3)

**주요 특징:**

- 검색 결과 상단 배너 광고
- 커스텀 크리에이티브(헤드라인, 로고, 비디오)
- 브랜드 스토어 통합
- 제품 컬렉션 및 비디오 광고 형식

**크리에이티브 요구사항:**

- **헤드라인**: 최대 50자 (일본 35자)
- **브랜드 로고**: Store 자산 라이브러리에서 제공
- **비디오 자산**: 비디오 광고 형식 지원
- **ASIN 컬렉션**: 제품 컬렉션 광고용 3개 이상 ASIN

**TypeScript 구현 예제:**

```typescript
const sbCampaignData = {
  name: "SB Campaign - Brand Awareness",
  budget: 200.0,
  budgetType: "daily",
  startDate: "20241201",
  adFormat: "productCollection",
  brandEntityId: "ENTITY123456789",
  creative: {
    brandName: "YourBrand",
    brandLogoAssetID: "ASSET123456",
    headline: "Premium Quality Products",
    asins: ["B08N5WRWNW", "B081G9YQ73", "B008ATNJNS"],
  },
};
```

### 1.3 Sponsored Display (v2 위주)

**주요 특징:**

- Amazon 및 서드파티 사이트/앱의 디스플레이 광고
- 자동 크리에이티브 최적화
- 크로스 디바이스 리타겟팅
- 오디언스 기반 타겟팅

**오디언스 타겟팅 옵션:**

- **제품 타겟팅**: 조회/구매한 제품과 유사한 제품
- **관심사 타겟팅**: 카테고리 및 라이프스타일 기반
- **리마케팅**: 이전 방문자/구매자
- **유사 오디언스**: 기존 고객과 유사한 잠재고객

### 1.4 Amazon DSP (Demand Side Platform)

**프로그래매틱 기능:**

- 실시간 입찰(RTB) 기능
- 고급 오디언스 세그멘테이션
- 크로스미디어 캠페인 관리
- 프리미엄 인벤토리 액세스

**고급 타겟팅:**

- **1st Party 데이터**: Amazon의 쇼핑 및 브라우징 신호
- **컨텍스츄얼 타겟팅**: 제품 및 카테고리 기반
- **지리적 타겟팅**: 정밀한 위치 기반 타겟팅
- **디바이스 타겟팅**: 크로스 디바이스 전략 구현

## 2. 인증 방식 상세

### 2.1 OAuth 2.0 Authorization Code Grant 플로우

**초기 설정:**

1. Amazon Developer Console에서 애플리케이션 등록
2. Client ID와 Client Secret으로 보안 프로필 생성
3. 애플리케이션의 리다이렉트 URI 구성
4. Amazon에서 API 액세스 승인 요청

**TypeScript 구현:**

```typescript
import axios from "axios";
import crypto from "crypto";

class AmazonAdsOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;
  private baseUrl: string;

  constructor(
    clientId: string,
    clientSecret: string,
    redirectUri: string,
    region = "NA",
  ) {
    this.clientId = clientId;
    this.clientSecret = clientSecret;
    this.redirectUri = redirectUri;
    this.baseUrl = this.getBaseUrl(region);
  }

  generateAuthUrl(scopes: string[]): { url: string; state: string } {
    const state = crypto.randomBytes(32).toString("hex");
    const params = new URLSearchParams({
      client_id: this.clientId,
      scope: scopes.join(" "),
      response_type: "code",
      redirect_uri: this.redirectUri,
      state,
    });

    return {
      url: `https://www.amazon.com/ap/oa?${params.toString()}`,
      state,
    };
  }

  async exchangeCodeForTokens(code: string): Promise<OAuthTokens> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/auth/o2/token`,
        new URLSearchParams({
          grant_type: "authorization_code",
          code,
          redirect_uri: this.redirectUri,
          client_id: this.clientId,
          client_secret: this.clientSecret,
        }),
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        },
      );

      const tokens = response.data;
      tokens.expires_at = Date.now() + tokens.expires_in * 1000;
      return tokens;
    } catch (error) {
      throw new Error(`Token exchange failed: ${error.message}`);
    }
  }

  async refreshTokens(refreshToken: string): Promise<OAuthTokens> {
    // 리프레시 토큰 구현
  }
}
```

**토큰 관리:**

- Access Token: 1시간 유효 (3600초)
- Refresh Token: 무기한 유효 (취소되지 않는 한)
- 토큰 자동 갱신 메커니즘 구현 필수

### 2.2 API Credentials 직접 입력 방식

**서버-투-서버 시나리오용 Client Credentials 플로우:**

```typescript
const tokenRequest = {
  grant_type: "client_credentials",
  client_id: clientId,
  client_secret: clientSecret,
  scope: "advertising::campaign_management",
};
```

**보안 고려사항:**

- 환경 변수 사용
- AWS Secrets Manager 통합
- 정기적인 자격 증명 로테이션

### 2.3 인증 방식 비교

| 측면                | OAuth 2.0                  | Client Credentials       |
| ------------------- | -------------------------- | ------------------------ |
| **복잡도**          | 높음                       | 낮음                     |
| **사용자 상호작용** | 필요                       | 불필요                   |
| **멀티테넌트**      | 지원                       | 미지원                   |
| **보안**            | 더 안전                    | 관리 필요                |
| **적합한 경우**     | SaaS 플랫폼, 에이전시 도구 | 내부 도구, 자동화 시스템 |

## 3. 주요 API 엔드포인트와 기능별 코드 예제

### 3.1 캠페인 관리 CRUD Operations

```typescript
class AmazonCampaignManager {
  private client: AmazonAdvertisingApiClient;

  // 캠페인 생성
  async createCampaign(campaignData: Campaign): Promise<CampaignResponse> {
    return await this.client.makeRequest(
      "POST",
      "/v3/sp/campaigns",
      campaignData,
    );
  }

  // 캠페인 조회
  async getCampaigns(filters?: CampaignFilter): Promise<Campaign[]> {
    const query = filters ? `?${new URLSearchParams(filters).toString()}` : "";
    return await this.client.makeRequest("GET", `/v3/sp/campaigns${query}`);
  }

  // 캠페인 수정
  async updateCampaign(
    campaignId: string,
    updates: Partial<Campaign>,
  ): Promise<Campaign> {
    return await this.client.makeRequest(
      "PUT",
      `/v3/sp/campaigns/${campaignId}`,
      updates,
    );
  }

  // 캠페인 삭제 (아카이브)
  async archiveCampaign(campaignId: string): Promise<void> {
    return await this.client.makeRequest(
      "DELETE",
      `/v3/sp/campaigns/${campaignId}`,
    );
  }
}
```

### 3.2 키워드 및 타겟팅 관리

```typescript
// 키워드 타겟팅
const keywordData = {
  adGroupId: adGroup.adGroupId,
  keywordText: "wireless headphones",
  matchType: "broad",
  bid: 2.0,
  state: "enabled",
};

const keywords = await sponsoredProductsClient.createKeywords([keywordData]);

// 제품 타겟팅
const productTargetData = {
  adGroupId: adGroup.adGroupId,
  expression: [
    {
      type: "asinCategorySameAs",
      value: "B08N5WRWNW",
    },
  ],
  bid: 1.25,
  state: "enabled",
};

const productTargets = await sponsoredProductsClient.createProductTargets([
  productTargetData,
]);
```

### 3.3 입찰 전략 설정

```typescript
interface DynamicBiddingStrategy {
  strategy: "legacyForSales" | "autoForSales" | "rule";
  adjustments?: Array<{
    predicate: "placementTop" | "placementProductPage";
    percentage: number; // -99 to 900
  }>;
}

const biddingStrategy: DynamicBiddingStrategy = {
  strategy: "autoForSales",
  adjustments: [
    { predicate: "placementTop", percentage: 50 },
    { predicate: "placementProductPage", percentage: 25 },
  ],
};
```

## 4. 보고서 API 상세

### 4.1 비동기 보고서 처리 패턴

```typescript
class AmazonReportManager {
  async generateReport(request: ReportRequest): Promise<any[]> {
    // 1. 보고서 요청 생성
    const { reportId } = await this.createReport(request);

    // 2. 상태 폴링
    const status = await this.pollReportStatus(reportId);

    // 3. 보고서 다운로드 및 파싱
    if (status.status === "SUCCESS" && status.location) {
      return await this.downloadAndParseReport(status.location);
    }

    throw new Error("Report generation failed");
  }

  private async pollReportStatus(
    reportId: string,
    maxAttempts = 60,
  ): Promise<ReportStatus> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const status = await this.checkReportStatus(reportId);

      if (status.status === "SUCCESS" || status.status === "FAILURE") {
        return status;
      }

      // 지수 백오프
      const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }

    throw new Error("Report polling timeout");
  }

  private async downloadAndParseReport(url: string): Promise<any[]> {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Amazon-Advertising-API-ClientId": this.clientId,
      },
    });

    // GZIP 압축 해제 및 JSON 파싱
    const buffer = await response.arrayBuffer();
    const decompressed = await this.decompressGzip(buffer);
    return JSON.parse(decompressed);
  }
}
```

### 4.2 보고서 타입 및 메트릭

```typescript
interface CampaignPerformanceReport {
  campaignId: number;
  campaignName: string;
  date: string;
  impressions: number;
  clicks: number;
  cost: number;
  purchases1d: number;
  purchases7d: number;
  purchases14d: number;
  purchases30d: number;
  sales7d: number;
  sales14d: number;
  acos7d: number;
  roas7d: number;
  clickThroughRate: number;
}
```

## 5. 개발 환경 설정

### 5.1 Amazon Advertising Console 계정 생성

**단계별 가이드:**

1. Amazon Advertising Console 접속
2. 비즈니스 엔티티 요구사항 충족 확인
3. API 액세스 신청서 작성
4. 사용 사례 상세 설명 제출
5. 승인 대기 (2-7 영업일)

### 5.2 샌드박스/테스트 환경

**테스트 환경 특징:**

- 실제 광고 노출 없음
- 캠페인 비용 청구 없음
- 기본 기능 테스트용
- 속도 제한: 초당 5개 요청, 버스트 15개

**테스트 계정 설정:**

```typescript
// 테스트 프로필 등록
const testProfile = await client.registerProfile({
  countryCode: "US",
  currencyCode: "USD",
  timezone: "America/Los_Angeles",
});
```

## 6. 실제 구현 시 고려사항

### 6.1 Rate Limiting 처리

```typescript
class RateLimitHandler {
  private static readonly MAX_RETRIES = 5;
  private static readonly BASE_DELAY = 1000;

  static async handleRequest<T>(
    requestFn: () => Promise<T>,
    attempt = 0,
  ): Promise<T> {
    try {
      return await requestFn();
    } catch (error: any) {
      if (error.statusCode === 429 && attempt < this.MAX_RETRIES) {
        const retryAfter = error.headers?.["retry-after"];
        const delay = retryAfter
          ? parseInt(retryAfter) * 1000
          : this.BASE_DELAY * Math.pow(2, attempt);

        console.log(`Rate limited. Retrying after ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));

        return this.handleRequest(requestFn, attempt + 1);
      }
      throw error;
    }
  }
}
```

### 6.2 에러 핸들링 베스트 프랙티스

```typescript
enum AmazonAdsErrorCode {
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  UNPROCESSABLE_ENTITY = 422,
  TOO_MANY_REQUESTS = 429,
  INTERNAL_SERVER_ERROR = 500,
}

class AmazonAdsApiError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    public details: string,
    public requestId: string,
  ) {
    super(`${code}: ${details}`);
    this.name = "AmazonAdsApiError";
  }
}
```

### 6.3 대량 데이터 처리 전략

```typescript
// 배치 처리 구현
const batchApiCalls = async <T>(
  requests: Array<() => Promise<T>>,
  concurrency = 5,
): Promise<PromiseSettledResult<T>[]> => {
  const results: PromiseSettledResult<T>[] = [];

  for (let i = 0; i < requests.length; i += concurrency) {
    const batch = requests.slice(i, i + concurrency);
    const batchResults = await Promise.allSettled(
      batch.map((request) => request()),
    );
    results.push(...batchResults);
  }

  return results;
};
```

## 7. Next.js 15 App Router와 통합

### 7.1 Server Components에서 API 호출

```typescript
// app/ads/amazon/campaigns/page.tsx
import { getAmazonCampaigns } from '@/lib/ads/amazon';

export default async function AmazonCampaignsPage() {
  const campaigns = await getAmazonCampaigns();

  return (
    <div>
      <h1>Amazon 광고 캠페인</h1>
      <CampaignsList campaigns={campaigns} />
    </div>
  );
}
```

### 7.2 Server Actions 활용

```typescript
// app/ads/amazon/actions.ts
"use server";

import { revalidateTag } from "next/cache";

export async function updateCampaignBudget(campaignId: string, budget: number) {
  const client = createAmazonAdsClient();

  await client.updateCampaign(campaignId, {
    budget: {
      budget,
      budgetType: "daily",
    },
  });

  revalidateTag("amazon-campaigns");
}
```

### 7.3 통합 데이터 캐싱 전략

```typescript
// lib/ads/cache.ts
import { unstable_cache } from "next/cache";

export const getCampaigns = unstable_cache(
  async (platform: "amazon" | "google" | "meta") => {
    const client = createAdClient(platform);
    return await client.getCampaigns();
  },
  ["campaigns"],
  {
    tags: ["campaigns", platform],
    revalidate: 300, // 5분
  },
);
```

### 7.4 올애드 플랫폼 통합 패턴

```typescript
// 통합 인터페이스
interface AdPlatformClient {
  getCampaigns(): Promise<Campaign[]>;
  createCampaign(data: CampaignData): Promise<Campaign>;
  updateCampaign(id: string, data: Partial<CampaignData>): Promise<Campaign>;
  deleteCampaign(id: string): Promise<void>;
  getReport(type: ReportType, params: ReportParams): Promise<Report>;
}

// Amazon 구현
class AmazonAdsClient implements AdPlatformClient {
  async getCampaigns(): Promise<Campaign[]> {
    const amazonCampaigns = await this.api.getCampaigns();
    return amazonCampaigns.map(this.normalizeCampaign);
  }

  private normalizeCampaign(amazonCampaign: AmazonCampaign): Campaign {
    return {
      id: amazonCampaign.campaignId.toString(),
      name: amazonCampaign.name,
      status: this.normalizeStatus(amazonCampaign.state),
      budget: {
        daily: amazonCampaign.budget?.budget,
        currency: "USD",
      },
      platform: "amazon",
      metrics: this.normalizeMetrics(amazonCampaign.metrics),
    };
  }
}

// 팩토리 패턴
export const createAdClient = (platform: AdPlatform): AdPlatformClient => {
  switch (platform) {
    case "amazon":
      return new AmazonAdsClient();
    case "google":
      return new GoogleAdsClient();
    case "meta":
      return new MetaAdsClient();
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
};
```
