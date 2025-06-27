틱톡 광고 API 연동 가이드를 한글로 번역해서 제공하겠습니다.# TikTok Ads API 연동: 종합 구현 가이드

## 1. OAuth 2.0 인증 방법

TikTok Ads API는 안전한 인증을 위해 **OAuth 2.0 인증 코드 플로우**를 사용합니다. 이 과정은 사용자로부터 인증 코드를 받은 후 액세스 토큰으로 교환하는 방식입니다.

### 인증 플로우

**1단계: 사용자를 인증 URL로 리다이렉트**

```
https://www.tiktok.com/v2/auth/authorize/
  ?client_key={APP_ID}
  &scope=ads.management,reporting
  &response_type=code
  &redirect_uri={YOUR_REDIRECT_URI}
  &state={CSRF_TOKEN}
```

**2단계: 인증 코드를 액세스 토큰으로 교환**

```bash
curl -X POST 'https://business-api.tiktok.com/open_api/v1.3/oauth2/access_token/' \
  -H 'Content-Type: application/x-www-form-urlencoded' \
  -d 'app_id={APP_ID}' \
  -d 'secret={APP_SECRET}' \
  -d 'auth_code={AUTHORIZATION_CODE}' \
  -d 'grant_type=authorization_code'
```

### 토큰 관리

- **액세스 토큰**은 24시간(86400초) 유효
- **리프레시 토큰**은 365일 유효
- 액세스 토큰이 만료되면 갱신 불가 - 재인증 필요
- 요청 시 토큰 포함: `Authorization: Bearer {access_token}`

### JavaScript 구현

```javascript
// 토큰 갱신 예제
const refreshAccessToken = async (refreshToken) => {
  const response = await fetch("https://open.tiktokapis.com/v2/oauth/token/", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_key: CLIENT_KEY,
      client_secret: CLIENT_SECRET,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }),
  });
  return response.json();
};
```

## 2. 계정 구조 비교

### 개별 광고주 계정

- 단일 `advertiser_id`로 **단일 계정 접근**
- 하나의 광고 계정에 **제한된 범위**
- 캠페인과 예산에 대한 **직접 제어**
- **적합한 대상**: 자체 광고를 관리하는 소규모 비즈니스

### 대행사/파트너 계정

- Business Center를 통한 **다중 계정 관리**
- 다른 `advertiser_id` 값을 사용하여 **계정 간 전환**
- **세 가지 권한 수준**:
  - **Admin**: 청구 포함 전체 액세스
  - **Operator**: 청구 제외 캠페인 관리
  - **Analyst**: 보고 전용 읽기 권한

### Business Center 장점

- 최대 4,000명의 팀 구성원 **중앙 관리**
- 계정 간 **자산 공유** (픽셀, 오디언스, 카탈로그)
- 다른 Business Center와의 **파트너 협업**
- 모든 관리 계정에 대한 **통합 보고**

### 계정 전환 구현

```javascript
// 동일한 토큰으로 광고주 계정 간 전환
const getCampaigns = async (advertiserId, accessToken) => {
  const response = await fetch(
    `https://business-api.tiktok.com/open_api/v1.3/campaign/get/?advertiser_id=${advertiserId}`,
    {
      headers: { "Access-Token": accessToken },
    },
  );
  return response.json();
};
```

## 3. 캠페인 관리 API 엔드포인트

### 캠페인 생성

**엔드포인트**: `POST /open_api/v1.3/campaign/create/`

```javascript
const createCampaign = async (accessToken, advertiserId) => {
  const campaignData = {
    advertiser_id: advertiserId,
    campaign_name: "여름 세일 2025",
    objective_type: "CONVERSIONS",
    budget: 500.0,
    budget_mode: "BUDGET_MODE_DAY",
    operation_status: "ENABLE",
  };

  const response = await fetch(
    "https://business-api.tiktok.com/open_api/v1.3/campaign/create/",
    {
      method: "POST",
      headers: {
        "Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(campaignData),
    },
  );
  return response.json();
};
```

### 캠페인 업데이트

**엔드포인트**: `POST /open_api/v1.3/campaign/update/`

```javascript
const updateCampaignStatus = async (
  accessToken,
  advertiserId,
  campaignId,
  status,
) => {
  const updateData = {
    advertiser_id: advertiserId,
    campaign_ids: [campaignId],
    operation_status: status, // "ENABLE" 또는 "DISABLE"
  };

  const response = await fetch(
    "https://business-api.tiktok.com/open_api/v1.3/campaign/update/status/",
    {
      method: "POST",
      headers: {
        "Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updateData),
    },
  );
  return response.json();
};
```

### 캠페인 조회

**엔드포인트**: `GET /open_api/v1.3/campaign/get/`

```javascript
const getCampaignDetails = async (accessToken, advertiserId) => {
  const params = new URLSearchParams({
    advertiser_id: advertiserId,
    page: 1,
    page_size: 100,
    fields: JSON.stringify([
      "campaign_id",
      "campaign_name",
      "status",
      "budget",
    ]),
  });

  const response = await fetch(
    `https://business-api.tiktok.com/open_api/v1.3/campaign/get/?${params}`,
    {
      headers: { "Access-Token": accessToken },
    },
  );
  return response.json();
};
```

## 4. 성과 데이터 조회 API

### 동기식 보고 (실시간)

**엔드포인트**: `GET /open_api/v1.3/report/integrated/get/`

```javascript
const getPerformanceData = async (accessToken, advertiserId) => {
  const params = {
    advertiser_id: advertiserId,
    report_type: "BASIC",
    data_level: "AUCTION_CAMPAIGN",
    dimensions: ["campaign_id", "stat_time_day"],
    metrics: ["spend", "impressions", "clicks", "ctr", "cpc", "conversions"],
    start_date: "2025-01-01",
    end_date: "2025-01-31",
    page_size: 1000,
  };

  const response = await fetch(
    "https://business-api.tiktok.com/open_api/v1.3/report/integrated/get/?" +
      new URLSearchParams(params),
    {
      headers: { "Access-Token": accessToken },
    },
  );
  return response.json();
};
```

### 비동기식 보고 (대용량 데이터셋)

```javascript
// 1단계: 보고서 작업 생성
const createReportTask = async (accessToken, advertiserId) => {
  const taskData = {
    advertiser_id: advertiserId,
    report_type: "BASIC",
    data_level: "AUCTION_AD",
    dimensions: ["ad_id", "stat_time_hour"],
    metrics: ["all"], // 모든 사용 가능한 지표 요청
    start_date: "2025-01-01",
    end_date: "2025-01-31",
  };

  const response = await fetch(
    "https://business-api.tiktok.com/open_api/v1.3/report/task/create/",
    {
      method: "POST",
      headers: {
        "Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskData),
    },
  );
  return response.json();
};

// 2단계: 작업 상태 확인 및 결과 조회
const checkReportTask = async (accessToken, advertiserId, taskId) => {
  const response = await fetch(
    `https://business-api.tiktok.com/open_api/v1.3/report/task/check/?advertiser_id=${advertiserId}&task_id=${taskId}`,
    {
      headers: { "Access-Token": accessToken },
    },
  );
  return response.json();
};
```

### 사용 가능한 지표

- **핵심 지표**: `spend`, `impressions`, `clicks`, `ctr`, `cpc`, `cpm`
- **전환 지표**: `conversion`, `conversion_rate`, `cost_per_conversion`
- **비디오 지표**: `video_watched_2s`, `video_watched_6s`, `engaged_view`
- **고급 지표**: `sales_lead`, `total_sales_lead_value`, `skan_sales_lead`

## 5. 예산 관리 API

### 캠페인 예산 설정

```javascript
const setCampaignBudget = async (accessToken, advertiserId, campaignId) => {
  const budgetData = {
    advertiser_id: advertiserId,
    campaign_id: campaignId,
    budget: 1000.0, // 광고주 통화 단위
    budget_mode: "BUDGET_MODE_DAY", // 또는 "BUDGET_MODE_TOTAL"
  };

  const response = await fetch(
    "https://business-api.tiktok.com/open_api/v1.3/campaign/update/",
    {
      method: "POST",
      headers: {
        "Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(budgetData),
    },
  );
  return response.json();
};
```

### 광고 그룹 예산 관리

```javascript
const setAdGroupBudget = async (accessToken, advertiserId, adgroupId) => {
  const budgetData = {
    advertiser_id: advertiserId,
    adgroup_id: adgroupId,
    budget: 250.0,
    budget_mode: "BUDGET_MODE_DAY",
    bid_type: "BID_TYPE_CUSTOM",
    bid: 0.5, // 최적화 목표당 비용
    deep_bid_type: "DEEP_BID_TYPE_oCPM",
  };

  const response = await fetch(
    "https://business-api.tiktok.com/open_api/v1.3/adgroup/update/",
    {
      method: "POST",
      headers: {
        "Access-Token": accessToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(budgetData),
    },
  );
  return response.json();
};
```

### 예산 규칙 및 제한사항

- **최소 일일 예산**: 국가 및 목표에 따라 다름
- **예산 변경**: 일일 특정 비율 증가/감소로 제한
- **통화 처리**: 광고주 계정 통화 자동 사용
- **페이싱 옵션**: 표준 또는 가속 전달

## 6. API 속도 제한 및 모범 사례

### 속도 제한 사양

- **일반 엔드포인트**: 분당 600개 요청
- **보고 API**: 1분 슬라이딩 윈도우로 계산
- **맞춤 오디언스 업데이트**: 일일 24회 작업
- **파일 업로드**: 최대 250MB 파일 크기

### 속도 제한 처리

```javascript
const makeRequestWithRetry = async (url, options, maxRetries = 5) => {
  let retries = 0;
  let backoffMs = 1000;

  while (retries < maxRetries) {
    try {
      const response = await fetch(url, options);

      if (response.status === 429) {
        // 속도 제한 초과
        await new Promise((resolve) => setTimeout(resolve, backoffMs));
        backoffMs *= 2; // 지수 백오프
        retries++;
        continue;
      }

      return response;
    } catch (error) {
      if (retries === maxRetries - 1) throw error;
      retries++;
    }
  }
};
```

### 효율성을 위한 모범 사례

1. 가능한 경우 **배치 작업** 사용
2. **최대 page_size**(1000) 사용으로 요청 최소화
3. 대량 작업을 위한 **요청 큐 구현**
4. 타이밍 최적화를 위한 **사용 패턴 모니터링**
5. 대용량 데이터셋에는 **비동기 보고** 사용

## 7. 개발자 계정 생성 프로세스

### 단계별 설정

1. **TikTok Developers 등록**
   - https://developers.tiktok.com 방문
   - OTP 코드로 이메일 인증
   - 이용약관 동의

2. **Business API 액세스 생성**
   - https://business-api.tiktok.com 에서도 등록
   - 비즈니스 검증 완료
   - 승인 대기 (2-7일)

3. **애플리케이션 생성**

   ```
   필수 정보:
   - 앱 이름 및 설명
   - 앱 아이콘/로고
   - 카테고리 선택
   - 서비스 약관 URL
   - 개인정보 보호정책 URL
   - OAuth용 리다이렉트 URI
   ```

4. **권한 구성**
   - 필요한 범위 선택
   - 도메인 검증 설정
   - 웹훅 엔드포인트 구성

## 8. 필수 권한 및 범위

### Marketing API 범위

- **`ads.management`**: 캠페인 생성 및 관리
- **`ads.operation`**: 캠페인 상태 업데이트
- **`reporting`**: 성과 데이터 액세스
- **`audience.management`**: 맞춤 오디언스 관리
- **`creative.management`**: 크리에이티브 업로드 및 관리

### 구현 예제

```javascript
// 인증 시 여러 범위 요청
const authorizeUrl = `https://www.tiktok.com/v2/auth/authorize/?
  client_key=${APP_ID}&
  scope=ads.management,reporting,audience.management&
  response_type=code&
  redirect_uri=${REDIRECT_URI}`;
```

## 9. 웹훅 지원 및 제한사항

### 현재 웹훅 상태

**중요**: TikTok 웹훅은 **사용자 대면 이벤트로 제한**되며 다음과 같은 광고 이벤트를 **지원하지 않습니다**:

- ❌ 캠페인 상태 변경
- ❌ 예산 알림
- ❌ 성과 임계값
- ❌ 광고 승인 알림

### 사용 가능한 웹훅 (비광고)

```javascript
// 웹훅 페이로드 구조
{
  "client_key": "your_app_client_key",
  "event": "authorization.removed",
  "create_time": 1615338610,
  "user_openid": "user_identifier",
  "content": "{\"additional_data\":\"json_string\"}"
}
```

### 대체 모니터링 솔루션

```javascript
// 캠페인 모니터링을 위한 폴링 전략
const monitorCampaignStatus = async (
  accessToken,
  advertiserId,
  campaignIds,
) => {
  const checkInterval = 300000; // 5분

  setInterval(async () => {
    const campaigns = await getCampaigns(accessToken, advertiserId);

    campaigns.data.list.forEach((campaign) => {
      if (campaignIds.includes(campaign.campaign_id)) {
        // 상태 변경 확인
        // 필요 시 커스텀 알림 전송
      }
    });
  }, checkInterval);
};
```

## 10. JavaScript/Node.js SDK 가용성

### 공식 SDK 설치

```bash
npm install tiktok-business-api-sdk-official
```

### 기본 SDK 사용법

```javascript
import * as TikTokSDK from "tiktok-business-api-sdk-official";

// API 클라이언트 초기화
const api = new TikTokSDK.TikTokApi("YOUR_ACCESS_TOKEN");

// 캠페인 작업
const campaignApi = new TikTokSDK.TikTokCampaign(api);

// SDK로 캠페인 생성
const createCampaignSDK = async () => {
  const campaign = await campaignApi.createCampaign({
    advertiser_id: "YOUR_ADVERTISER_ID",
    campaign_name: "SDK 캠페인 2025",
    objective_type: "CONVERSIONS",
    budget: 500.0,
    budget_mode: "BUDGET_MODE_DAY",
  });

  return campaign.data;
};

// SDK로 성과 데이터 조회
const getReportSDK = async () => {
  const reportApi = new TikTokSDK.TikTokReport(api);

  const report = await reportApi.getBasicSyncReport({
    advertiser_id: "YOUR_ADVERTISER_ID",
    data_level: "AUCTION_CAMPAIGN",
    dimensions: ["campaign_id", "stat_time_day"],
    metrics: ["spend", "impressions", "clicks", "ctr"],
    start_date: "2025-01-01",
    end_date: "2025-01-31",
  });

  return report.data;
};
```

### TypeScript 지원

```typescript
import * as TikTokSDK from "tiktok-business-api-sdk-official";

interface CampaignConfig {
  advertiserId: string;
  campaignName: string;
  budget: number;
  objectiveType: string;
}

class TikTokAdsManager {
  private api: TikTokSDK.TikTokApi;
  private campaignApi: TikTokSDK.TikTokCampaign;

  constructor(accessToken: string) {
    this.api = new TikTokSDK.TikTokApi(accessToken);
    this.campaignApi = new TikTokSDK.TikTokCampaign(this.api);
  }

  async createCampaign(config: CampaignConfig): Promise<string> {
    const result = await this.campaignApi.createCampaign({
      advertiser_id: config.advertiserId,
      campaign_name: config.campaignName,
      objective_type: config.objectiveType,
      budget: config.budget,
      budget_mode: "BUDGET_MODE_TOTAL",
    });

    return result.data.campaign_id;
  }
}
```

## 실용적인 구현 팁

### 오류 처리 패턴

```javascript
class TikTokAPIError extends Error {
  constructor(code, message, requestId) {
    super(message);
    this.code = code;
    this.requestId = requestId;
  }
}

const apiRequest = async (url, options) => {
  try {
    const response = await fetch(url, options);
    const data = await response.json();

    if (data.code !== 0) {
      throw new TikTokAPIError(data.code, data.message, data.request_id);
    }

    return data;
  } catch (error) {
    console.error(`API 오류 [${error.code}]: ${error.message}`);
    throw error;
  }
};
```

### 완전한 통합 예제

```javascript
// 전체 캠페인 생성 및 모니터링 플로우
const runCampaign = async () => {
  const accessToken = await getAccessToken();
  const advertiserId = "YOUR_ADVERTISER_ID";

  // 1. 캠페인 생성
  const campaign = await createCampaign(accessToken, advertiserId);
  const campaignId = campaign.data.campaign_id;

  // 2. 광고 그룹 생성
  const adGroup = await createAdGroup(accessToken, advertiserId, campaignId);

  // 3. 크리에이티브 업로드
  const creative = await uploadCreative(accessToken, advertiserId);

  // 4. 광고 생성
  const ad = await createAd(accessToken, advertiserId, adGroup.id, creative.id);

  // 5. 성과 모니터링
  const performanceData = await getPerformanceData(accessToken, advertiserId);

  return { campaign, adGroup, ad, performanceData };
};
```

이 종합 가이드는 TikTok Ads API와의 통합을 위한 기초를 제공하며, 인증, 캠페인 관리, 성과 추적 및 실용적인 구현 패턴을 다룹니다. API는 프로그래매틱 광고 관리를 위한 강력한 기능을 제공하지만, 광고 이벤트에 대한 웹훅 지원은 여전히 제한적이어서 폴링 기반 솔루션이 필요합니다.
