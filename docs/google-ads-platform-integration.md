# Google Ads 플랫폼 통합 가이드

## 개요

All-AD는 Google Ads API를 통해 구글 광고 플랫폼과의 완전한 통합(integration)을 제공합니다. 이 문서는 Google Ads API의 주요 기능과 All-AD에서의 구현 방법을 설명합니다.

## 목차

- [플랫폼 통합 아키텍처](#플랫폼-통합-아키텍처)
- [Google Ads OAuth 통합](#google-ads-oauth-통합)
- [캠페인 데이터 동기화](#캠페인-데이터-동기화)
- [실시간 캠페인 제어](#실시간-캠페인-제어)
- [보고서 및 분석](#보고서-및-분석)
- [에러 처리](#에러-처리)

## 플랫폼 통합 아키텍처

### 1. 클라이언트 초기화

All-AD는 Google Ads API 클라이언트를 사용하여 플랫폼과 통신합니다:

```typescript
// services/google-ads/core/google-ads-oauth-client.ts
export class GoogleAdsOAuthClient {
  private client: GoogleAdsApi | null = null;

  private async initializeClient() {
    const config = await getOAuthConfig("google");

    this.client = new GoogleAdsApi({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      developer_token: config.developerToken,
    });
  }
}
```

### 2. 고객 인스턴스 생성

각 팀의 Google Ads 계정에 대한 고객 인스턴스를 생성합니다:

```typescript
private async getAuthenticatedCustomer(customerId?: string): Promise<Customer> {
  const token = await this.getValidToken();
  const targetCustomerId = customerId || this.credentials.customerId;

  this.customer = this.client.Customer({
    customer_id: targetCustomerId,
    refresh_token: token.refresh_token,
    login_customer_id: this.credentials.customerId, // MCC 계정용
  });

  return this.customer;
}
```

## Google Ads OAuth 통합

### 1. OAuth 플로우

All-AD는 간소화된 OAuth 플로우를 제공합니다:

```typescript
// app/api/auth/google-ads/route.ts
export async function GET() {
  const authUrl = oauthConfig.authUrl;
  const params = new URLSearchParams({
    client_id: oauthConfig.clientId,
    redirect_uri: oauthConfig.redirectUri,
    response_type: "code",
    scope: oauthConfig.scope.join(" "),
    access_type: "offline",
    prompt: "consent",
    state: stateId,
  });

  return NextResponse.redirect(`${authUrl}?${params}`);
}
```

### 2. 토큰 관리

자동 토큰 갱신 시스템:

```typescript
// 토큰 유효성 검사 및 갱신
private async getValidToken(): Promise<TokenData> {
  const { data: credential } = await supabase
    .from("platform_credentials")
    .select("access_token, refresh_token, expires_at")
    .eq("team_id", this.credentials.teamId)
    .eq("platform", "google")
    .single();

  // 토큰 만료 확인 (5분 버퍼)
  const now = Date.now();
  const expiryBuffer = 5 * 60 * 1000;

  if (tokenData.expiry_date - now < expiryBuffer) {
    const refreshedToken = await this.refreshAccessToken(tokenData.refresh_token);
    // 토큰 업데이트 저장
  }

  return tokenData;
}
```

### 3. 접근 가능한 고객 목록 조회

MCC(My Client Center) 계정의 경우 여러 고객 계정에 접근할 수 있습니다:

```typescript
async getAccessibleCustomers(): Promise<string[]> {
  const customer = await this.getAuthenticatedCustomer();

  const query = `
    SELECT
      customer_client.id,
      customer_client.descriptive_name,
      customer_client.manager
    FROM customer_client
    WHERE customer_client.level <= 1
  `;

  const results = await customer.query(query);
  return results.map(r => r.customer_client?.id);
}
```

## 캠페인 데이터 동기화

### 1. 캠페인 조회 (GAQL 사용)

Google Ads Query Language를 사용한 캠페인 데이터 조회:

```typescript
async getCampaigns(): Promise<CampaignData[]> {
  const query = `
    SELECT
      campaign.id,
      campaign.name,
      campaign.status,
      campaign.budget.amount_micros,
      metrics.impressions,
      metrics.clicks,
      metrics.cost_micros,
      metrics.conversions,
      metrics.average_cpm
    FROM campaign
    WHERE segments.date DURING LAST_30_DAYS
      AND campaign.status != 'REMOVED'
    ORDER BY metrics.impressions DESC
  `;

  const results = await this.client.query<GoogleAdsCampaignResult>(query);

  return results.map(result => this.transformCampaignData(result));
}
```

### 2. 세그먼트별 메트릭 조회

날짜별 광고 그룹 메트릭 조회:

```typescript
const adGroupMetrics = await customer.report({
  entity: "ad_group",
  metrics: [
    "metrics.cost_micros",
    "metrics.clicks",
    "metrics.impressions",
    "metrics.all_conversions",
  ],
  segments: ["segments.date"],
  from_date: "2025-01-01",
  to_date: "2025-02-01",
});
```

### 3. 스트림 기반 대용량 데이터 처리

키워드 데이터를 비동기 반복자로 처리:

```typescript
const stream = customer.reportStream({
  entity: "ad_group_criterion",
  attributes: ["ad_group_criterion.keyword.text", "ad_group_criterion.status"],
  constraints: {
    "ad_group_criterion.type": enums.CriterionType.KEYWORD,
  },
});

for await (const row of stream) {
  // 행별 처리
  await processKeyword(row);
}
```

## 실시간 캠페인 제어

### 1. 캠페인 상태 변경

```typescript
async toggleCampaignStatus(campaignId: string, enable: boolean): Promise<void> {
  const status = enable ? "ENABLED" : "PAUSED";
  const googleCampaignId = campaignId.replace("google_", "");

  const operations = [{
    entity: "campaign",
    operation: "update",
    resource: {
      resource_name: `customers/${customerId}/campaigns/${googleCampaignId}`,
      status: status,
    },
    update_mask: {
      paths: ["status"],
    },
  }];

  await this.client.mutate(operations);
}
```

### 2. 예산 업데이트

```typescript
async updateCampaignBudget(campaignId: string, budgetAmountMicros: number): Promise<void> {
  // 캠페인의 예산 ID 조회
  const query = `
    SELECT campaign.campaign_budget
    FROM campaign
    WHERE campaign.id = ${googleCampaignId}
  `;

  const [campaign] = await this.client.query(query);
  const budgetResourceName = campaign.campaign.campaign_budget;

  const operations = [{
    entity: "campaign_budget",
    operation: "update",
    resource: {
      resource_name: budgetResourceName,
      amount_micros: budgetAmountMicros,
    },
    update_mask: {
      paths: ["amount_micros"],
    },
  }];

  await this.client.mutate(operations);
}
```

### 3. 원자적 캠페인 및 예산 생성

여러 리소스를 트랜잭션으로 생성:

```typescript
const operations: MutateOperation[] = [
  {
    entity: "campaign_budget",
    operation: "create",
    resource: {
      resource_name: ResourceNames.campaignBudget(customerId, "-1"),
      name: "새 캠페인 예산",
      delivery_method: enums.BudgetDeliveryMethod.STANDARD,
      amount_micros: toMicros(500),
    },
  },
  {
    entity: "campaign",
    operation: "create",
    resource: {
      name: "새 검색 캠페인",
      advertising_channel_type: enums.AdvertisingChannelType.SEARCH,
      status: enums.CampaignStatus.PAUSED,
      campaign_budget: ResourceNames.campaignBudget(customerId, "-1"),
      network_settings: {
        target_google_search: true,
        target_search_network: true,
      },
    },
  },
];

const result = await customer.mutateResources(operations);
```

## 보고서 및 분석

### 1. 요약 행 포함 보고서

```typescript
const [summaryRow, ...campaigns] = await customer.report({
  entity: "campaign",
  metrics: ["metrics.clicks", "metrics.all_conversions"],
  search_settings: {
    return_summary_row: true,
  },
});

// summaryRow는 전체 메트릭의 합계를 포함
```

### 2. 전체 결과 수 조회

```typescript
const totalRows = await customer.reportCount({
  entity: "search_term_view",
  attributes: ["search_term_view.resource_name"],
  constraints: {
    "search_term_view.status": "ENABLED",
  },
});
```

### 3. 정렬된 결과 조회

```typescript
const response = await customer.report({
  entity: "campaign",
  attributes: ["campaign.id"],
  metrics: ["metrics.clicks"],
  segments: ["segments.date"],
  order: [
    { field: "metrics.clicks", sort_order: "DESC" },
    { field: "segments.date", sort_order: "ASC" },
    { field: "campaign.id" },
  ],
});
```

## 에러 처리

### 1. Google Ads 에러 타입

```typescript
import { errors } from "google-ads-api";

try {
  await customer.query(`SELECT campaign.bad_field FROM campaign`);
} catch (err) {
  if (err instanceof errors.GoogleAdsFailure) {
    const [firstError] = err.errors;

    if (
      firstError.error_code.query_error ===
      errors.QueryErrorEnum.QueryError.UNRECOGNIZED_FIELD
    ) {
      console.log(`잘못된 필드 사용: "${firstError.trigger}"`);
    }
  }
}
```

### 2. 일반적인 에러 처리

```typescript
// services/google-ads/google-ads-oauth-integration.service.ts
try {
  const campaigns = await this.integrationService.getCampaigns();
} catch (error) {
  if (error.message.includes("INVALID_CUSTOMER_ID")) {
    // 고객 ID 재설정 필요
    await this.refreshCustomerId();
  } else if (error.message.includes("UNAUTHENTICATED")) {
    // 토큰 갱신 필요
    await this.refreshAccessToken();
  }
  throw error;
}
```

## 플랫폼 통합 후크(Hooks)

### 1. 쿼리 후크

```typescript
const onQueryStart: OnQueryStart = async ({ cancel, editOptions }) => {
  // 개발 환경에서는 검증만 수행
  if (process.env.NODE_ENV === "development") {
    editOptions({ validate_only: true });
  }
};

const onQueryEnd: OnQueryEnd = async ({ response, resolve }) => {
  // 결과 캐싱
  await cacheResults(response);
  resolve(response);
};
```

### 2. 변형(Mutation) 후크

```typescript
const onMutationError: OnMutationError = async ({ error }) => {
  // 에러 로깅 및 알림
  log.error("Google Ads mutation failed", error);
  await notifyAdmin(error);
};
```

## 리소스 이름 헬퍼

Google Ads 리소스 이름 생성 유틸리티:

```typescript
import { ResourceNames } from "google-ads-api";

// 캠페인 리소스 이름
ResourceNames.campaign("1234567890", "3218318373");
// "customers/1234567890/campaigns/3218318373"

// 광고 그룹 리소스 이름
ResourceNames.adGroup("123", "456");
// "customers/123/adGroups/456"

// 지역 타겟팅 상수
ResourceNames.geoTargetConstant(1010543); // 암스테르담
// "geoTargetConstants/1010543"
```

## 플랫폼 서비스 구현

Sivera의 Google Ads 플랫폼 서비스 구현:

```typescript
// services/platforms/google-ads-oauth-platform.service.ts
export class GoogleAdsOAuthPlatformService implements PlatformService {
  platform: PlatformType = "google";

  async fetchCampaigns(): Promise<Campaign[]> {
    const campaigns = await this.integrationService.getCampaigns();

    return campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      platform: "google",
      status: campaign.status,
      budget: campaign.budget,
      metrics: {
        impressions: campaign.impressions,
        clicks: campaign.clicks,
        cost: campaign.cost,
        conversions: campaign.conversions,
      },
    }));
  }

  async updateCampaignStatus(
    campaignId: string,
    isActive: boolean,
  ): Promise<boolean> {
    await this.integrationService.toggleCampaignStatus(campaignId, isActive);
    return true;
  }
}
```

## 성능 최적화

### 1. 배치 처리

여러 캠페인을 한 번에 업데이트:

```typescript
const operations = campaigns.map((campaign) => ({
  entity: "campaign",
  operation: "update",
  resource: {
    resource_name: campaign.resource_name,
    status: "PAUSED",
  },
  update_mask: { paths: ["status"] },
}));

await customer.mutateResources(operations);
```

### 2. 스트림 처리

대용량 데이터는 스트림으로 처리:

```typescript
const stream = customer.reportStreamRaw(reportOptions);

stream.on("data", (chunk) => {
  // 10,000개씩 청크로 처리
  const parsedResults = parse({
    results: chunk.results,
    reportOptions,
  });
  processChunk(parsedResults);
});
```

## 보안 고려사항

1. **토큰 보안**: 모든 토큰은 암호화되어 저장
2. **API 키 관리**: 환경 변수로 관리
3. **권한 제한**: 필요한 최소 권한만 요청
4. **감사 로깅**: 모든 API 호출 기록

## 문제 해결

### 일반적인 문제

1. **INVALID_CUSTOMER_ID**: OAuth 콜백에서 고객 ID를 올바르게 가져오지 못함
   - 해결: OAuth 재연결 필요

2. **토큰 만료**: 자동 갱신 실패
   - 해결: 수동으로 재인증 필요

3. **권한 부족**: MCC 계정 권한 문제
   - 해결: Google Ads 계정에서 권한 확인

## 참고 자료

- [Google Ads API 공식 문서](https://developers.google.com/google-ads/api/docs)
- [GAQL 참조](https://developers.google.com/google-ads/api/docs/query/overview)
- [에러 코드 참조](https://developers.google.com/google-ads/api/reference/rpc/v20/GoogleAdsFailure)
