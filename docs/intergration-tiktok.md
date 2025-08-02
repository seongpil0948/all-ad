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

Login Kit for Web
This guide details how to enable authentication from your web app to TikTok. After successfully completing authentication with TikTok, developers can obtain an access_token for the TikTok user.

Prerequisites
Register your app
Register your app following these steps. Then obtain a client key and secret from the developer portal on https://developers.tiktok.com under Manage apps.

Configure redirect URI
Redirect URI is required for web apps. After the user completes authorization with Login Kit on the web, they will be redirected to a URI provided by you. This redirect URI must be registered in the Login Kit product configuration for your app.

The following are restrictions for registering redirect URIs.

A maximum of 10 URIs is supported.
The length of each URI must be less than 512 characters.
URIs must be absolute and begin with https. For example:
Correct: https://dev.example.com/auth/callback/
Incorrect: dev.example.com/auth/callback/
URIs must be static. Parameters will be denied. For example:
Correct: https://dev.example.com/auth/callback/
Incorrect: https://dev.example.com/auth/callback/?id=1
URIs cannot include a fragment, or hash character (#):
Correct: https://dev.example.com/auth/callback/
Incorrect: https://dev.example.com/auth/callback/#100
Integration Guide
Implement the front-end code
Get started by connecting your front-end login button to the server endpoint. The following is an example in HTML:

<a href='{SERVER_ENDPOINT_OAUTH}'>Continue with TikTok</a>
Implement the server code to handle authorization grant flow
The server code must be responsible for the following:

Ensuring that the client secret and refresh token are stored securely.
Ensuring that the security for each user is protected by preventing request forgery attacks.
Handling the refresh flow before access token expiry.
Managing the access token request flow for each user.
Redirect request to TikTok's authorization server
Create an anti-forgery state token
You must prevent request forgery attacks to protect the security of your users. The first step before making the redirect request to TikTok's authorization server is to create a unique session token to maintain the state between the request and callback.

You will later match this unique session token with the authentication response to verify that the user is making the request and not a malicious attacker.

One of the simple approaches to a state token is a randomly generated alphanumeric string constructed using a random-number generator. For example:

let array = new Uint8Array(30);
const csrfState = window.crypto.getRandomValues(array);
Initial redirect to TikTok's authorization page
To make the initial redirect request to TikTok's authorization server, the following query parameters below must be added to the Authorization Page URL using the application/x-www-form-urlencoded format.

For example, you can use an online URL encoder to encode parameters. Select UTF-8 as the destination character set.

Parameter

Type

Description

client_key

String

The unique identification key provisioned to the partner.

scope

String

A comma (,) separated string of authorization scope(s). These scope(s) are assigned to your application on the TikTok for Developers website. They handle what content your application can and cannot access. If a scope is toggleable, the user can deny access to one scope while granting access to others.

redirect_uri

String

The redirect URI that you requested for your application. It must match one of the redirect URIs you registered for the app.

state

String

The state is used to maintain the state of your request and callback. This value will be included when redirecting the user back to the client. Check if the state returned in the callback matches what you sent earlier to prevent cross-site request forgery.

The state can also include customized parameters that you want TikTok service to return.

response_type

String

This value should always be set to code.

disable_auto_auth

int

Controls whether the authorization page is automatically presented to users. When set to 0, skips the authorization page for valid sessions. When set to 1, always displays the authorization page.

Redirect your users to the authorization page URL and supply the necessary query parameters. Note that the page can only be accessed through HTTPS.

Type

Description

URL

https://www.tiktok.com/v2/auth/authorize/

Query parameters

client_key=<client_key>&response_type=code&scope=<scope>&redirect_uri=<redirect_uri>&state=<state>

Note: If you are an existing client and use https://www.tiktok.com/auth/authorize/ as the authorization page URL, please register a redirect URI for your app and migrate to the new URL mentioned above.

The following is an example using Node, Express, and JavaScript:

const express = require('express');
const app = express();
const fetch = require('node-fetch');
const cookieParser = require('cookie-parser');
const cors = require('cors');

app.use(cookieParser());
app.use(cors());
app.listen(process.env.PORT || 5000).

const CLIENT_KEY = 'your_client_key' // this value can be found in app's developer portal

app.get('/oauth', (req, res) => {
const csrfState = Math.random().toString(36).substring(2);
res.cookie('csrfState', csrfState, { maxAge: 60000 });

    let url = 'https://www.tiktok.com/v2/auth/authorize/';

    // the following params need to be in `application/x-www-form-urlencoded` format.
    url += '?client_key={CLIENT_KEY}';
    url += '&scope=user.info.basic';
    url += '&response_type=code';
    url += '&redirect_uri={SERVER_ENDPOINT_REDIRECT}';
    url += '&state=' + csrfState;

    res.redirect(url);

})
TikTok prompts a users to log in or sign up
The authorization page takes the user to the TikTok website if the user is not logged in. They are then prompted to log in or sign up for TikTok.

TikTok prompts a user for consent
After logging in or signing up, an authorization page asks the user for consent to allow your application to access your requested permissions.

Manage authorization response
If the user authorizes access, they will be redirected to redirect_uri with the following query parameters appended using application/x-www-form-urlencoded format:

Parameter

Type

Description

code

String

Authorization code that is used in getting an access token.

scopes

String

A comma-separated (,) string of authorization scope(s), which the user has granted.

state

String

A unique, non-guessable string when making the initial authorization request. This value allows you to prevent CSRF attacks by confirming that the value coming from the response matches the one you sent.

error

String

If this field is set, it means that the current user is not eligible for using third-party login or authorization. The partner is responsible for handling the error gracefully.

error_description

String

If this field is set, it will be a human-readable description about the error.

Manage access token
Using the code appended to your redirect_uri, you can obtain access_token for the user, which completes the flow for logging in with TikTok.

See Manage User Access Tokens for related endpoints.

Scopes Overview
Scopes represent end user granted permissions to access specific data resources or perform specific actions. Every TikTok for Developer API requires a scope to be accessed, and sensitive fields are protected by additional scopes. For example, the scope user.info.basic allows access to APIs and data related to the basic user of a TikTok user.

Managing scopes
Scopes are available on your app page. The scope user.info.basic will be added by default for all apps with Login Kit. Developers can also request additional scopes and manage existing scopes on their app page after logging in.

To add scopes to your app, do the following:

Navigate to the section titled Scopes to view your scopes.
Click the Add Scopes button, then add your desired scopes.
To remove a scope, click the minus button next to it.

Note: Remember that applying and being approved for a scope alone does not give you access to a user's data. Each user must also authorize your app for access to specific scopes.

User authorization
After you are approved for certain scopes on TikTok for Developers, users will be asked to authorize and confirm your access. This is explained further in the tutorials for Login Kit on iOS, Android, Desktop, and Web. Users can grant or deny the requested scopes or any subset of them, and revoke the authorization at any time on their TikTok apps.

After a user grants the requested scopes, a code will be sent to your registered callback URL. You can obtain an access_token and start invoking TikTok for Developers APIs to get that user's information or perform actions on the user's behalf.

See how to manage user access tokens for access_token related endpoints.

Scopes Reference
You can find the list of available scopes and their explanation on the scopes reference page.

copes Reference
Topic

Scope

Definition

User Display

Target APIs

Music Certification

artist.certification.read

Read user's basic artist certification information like status, matched song names, artist id.

Read your basic artist certification information like status, matched song names, artist id.

artist.certification.update

Update user's artist certification information

Update your artist certification information

Local Service

local.product.manage

Create and manage the product listing.

Create and manage the product listing.

local.shop.manage

Create and manage the local shops.

Create and manage the local shops.

local.voucher.manage

Validate and redeem the voucher.

Validate and redeem the voucher.

Portability

portability.activity.ongoing

Make ongoing requests for activity data on the user's behalf

Export copies of your activity data

portability.activity.single

Make a single request for activity data on the user's behalf

Export a copy of your activity data

portability.all.ongoing

Make ongoing requests for all available data on the user's behalf

Export copies of your full user data archive

portability.all.single

Make a single request for all available data on the user's behalf

Export a copy of your full user data archive

portability.directmessages.ongoing

Make ongoing requests for direct message data on the user's behalf

Export copies of your direct message data

portability.directmessages.single

Make a single request for direct message data on the user's behalf

Export a copy of your direct message data

portability.postsandprofile.ongoing

Make ongoing requests for posts and profile data on the user's behalf

Export copies of your posts and profile data

portability.postsandprofile.single

Make a single request for posts and profile data on the user's behalf

Export a copy of your posts and profile data

research_adlib

research.adlib.basic

Access to public commercial data for research purposes

Access to public commercial data for research purposes

research

research.data.basic

Access to TikTok public data for research purposes

Access to TikTok public data for research purposes

Research API

research.data.u18eu

Allow access to data from European users under 18, and all other public data, for research purposes

Allow access to data from European users under 18, and all other public data, for research purposes

user

user.info.basic

Read a user's profile info (open id, avatar, display name ...)

Read your profile info (avatar, display name)

User Info
user.info.profile

Read access to profile_web_link, profile_deep_link, bio_description, is_verified.

Read your additional profile information, such as bio description, profile link, and account verification status

User Info
user.info.stats

Read access to a user's statistical data, such as likes count, follower count, following count, and video count

Read your profile engagement statistics, such as like count, follower count, following count, and video count

User Info
video

video.list

Read a user's public videos on TikTok

Read your public videos on TikTok

List Videos
Query Videos
video.publish

Directly post content to a user's TikTok profile.

Post content to TikTok.

Direct Post
Get Post Status
video.upload

Share content to creator's account as a draft to further edit and post in TikTok.

Share content as a draft to your TikTok account.

Get Post Status
Upload
Share Video API

Query Ads
Use POST /v2/research/adlib/ad/query to query ads.

HTTP URL

https://open.tiktokapis.com/v2/research/adlib/ad/query/

HTTP Method

POST

Scopes

research.adlib.basic

Request
Headers
Key

Type

Description

Example

Required

Authorization

string

The token that bears the authorization of the TikTok user, which is obtained through /v2/oauth/token/.

Bearer clt.example12345Example12345Example

true

Content-Type

string

The original media type of the resource.

application/json

true

Query parameters
Key

Type

Description

Example

Required

fields

string

The requested fields:

ad.id
ad.first_shown_date
ad.last_shown_date
ad.status
ad.status_statement
ad.videos
ad.image_urls
ad.reach
advertiser.business_id
advertiser.business_name
advertiser.paid_for_by
ad.id, ad.first_shown_date, ad.last_shown_date

true

Body
Key

Type

Description

Example

Required

filters

RequestFilters

The filters that will be applied to the query.

See the "Request example" section below

true

search_term

string

The terms to search for in the query. The limit of the string is 50 characters or less.

If you provide "search_term", the "advertiser_business_ids" filter will be ignored

mobile games

false

search_type

string

The search type (which is case insensitive):

"exact_phrase": Returns results that contain an exact match for the search term. The default search type.
"fuzzy_phrase": Returns results that contain any or all of the words in the search term in any order.
fuzzy_phrase

false

max_count

i64

The maximum number of results returned at once. The default value is 10 and the maximum value is 50.

20

false

search_id

string

A search_id is a unique identifier assigned to a cached search result. This identifier enables the resumption of a prior search and retrieval of additional results based on the same search criteria.

If you want to start a new search with an updatedsearch_term or filters value in the request, remove the search_id to avoid getting unexpected results.

20230501124205358FF99E4D6D1294A2A7

false

Data structures
RequestFilters
Key

Type

Description

Example

Required

ad_published_date_range

DateRange

The date range during which the ads were published.

The "min" value should represent a date after October 1, 2022.

{

"min": 20230102,

"max": 20230109

}

true

country_code

string

The country where the ads were targeted. The default value is ALL.

Supported Countries

FR

false

advertiser_business_ids

list<i64>

The advertiser's business ID of the ads.

If you provide "search_term", this filter will be ignored.

[294854736284058, 495736284058473]

false

unique_users_seen_size_range

SizeRange

The range of the number of users who've seen the content of this ad.

{

"min": "10K",

"max": "20K"

}

false

DateRange
Key

Type

Description

Example

Required

min

string

The first date of the range and this needs to be after October 1, 2022.

20230102

true

max

string

The last date of the range.

20230109

true

SizeRange
Key

Type

Description

Example

Required

min

string

The minimum size in thousands (K), millions (M), or billions (B).

The number before "K", "M", and "B" must be an integer less than 1000.

Valid: 0K, 120K, 2M, 1B

Invalid: 2000K, 1.1M, 1B2M

false

max

string

The maximum size in thousands (K), millions (M), or billions (B)

The number before "K", "M", and "B" must be an integer less than 1000.

The value must be greater than 0.

Valid: 120K, 2M, 1B

Invalid: 0K, 2000K, 1.1M, 1B2M

false

Request example
curl -L -X POST 'https://open.tiktokapis.com/v2/research/adlib/ad/query/?fields=ad.id,ad.first_shown_date,ad.last_shown_date' \
-H 'Authorization: Bearer clt.example12345Example12345Example' \
-H 'Content-Type: application/json' \
--data-raw '{
"filters":{
"advertiser_business_ids": [3847236290405, 319282903829],
"ad_published_date_range": {
"min": "20210102",
"max": "20210109"
},
"country_code": "FR",
"unique_users_seen_size_range": {
"min": "10K",
"max": "1M"
},
},
"search_term": "mobile games"
}'
Response
Key

Type

Example

data

QueryAdData

See the response example below.

error

ErrorStructV2

See the response example below.

Response example
{
"data": {
"ads": [
{
"ad": {
"first_shown_date": 20210101,
"id": 1923845247192304,
"image_urls": [
"https://asdfcdn.com/17392712.jpeg?x-expires=1679169600\u0026x-signature=asdf"
],
"last_shown_date": 20210101,
"status": "active",
"videos": [
{"url": "https://asdfcdn.com/..../127364jmdfjsa93d8cn30dm2di/?mime_type=video_mp4"},
{"url": "https://asdfcdn.com/..../1kmeidhfb38u21nd82hsk389fd/?mime_type=video_mp4"}
],
"reach": {
"unique_user_seen": "11K"
}
},
"advertiser": {
"buisness_id": 3847236290405,
"business_name": "Awe Food Co.",
"paid_by": "Awe Co."
}
}
],
"has_more": "true",
"search_id": "2837438294054038"
},
"error": {
"code": "ok",
"http_status_code": 200,
"log_id": "202304280326050102231031430C7E754E",
"message": ""
}
}
Data structures
QueryAdData
Key

Type

Description

Example

ads

list<AdDto>

The list of ads that match all the criteria.

has_more

bool

The flag that indicates if there are more items to be returned.

true

search_id

string

A unique identifier assigned to a cached search result. This identifier enables the resumption of a prior search and retrieval of additional results based on the same search criteria.

2837438294054038

AdDto
Key

Type

Description

Example

ad

Ad

The metadata of this ad.

advertiser

Advertiser

The metadata of the advertiser.

Ad
Key

Type

Description

Example

id

i64

The ad ID.

1923845247192304

first_shown_date

string

The first day when this ad was shown.

20210101

last_shown_date

string

The last day when this ad was shown.

20210101

status

string

The audit status of this ad: active or inactive.

active

videos

list<AdVideo>

The list of videos.

image_urls

list<string>

The image URL list of this ad.

[

"https://asdfcdn.com/17392712.jpeg?x-expires=1679169600\u0026x-signature=asdf"

]

reach

Reach

The number of users who have seen this ad.

{

"unique_users_seen": "11K"

}

AdVideo
Key

Type

Description

Example

url

string

The video url of this ad

https://asdfcdn.com/..../127364jmdfjsa93d8cn30dm2di/?mime_type=video_mp4

Reach
Key

Type

Description

Example

unique_users_seen

string

The number of users who have seen this ad.

"11K"

Advertiser
Key

Type

Description

Example

business_id

i64

The advertiser's business ID.

1755645247067185

business_name

string

The advertiser's business name.

Awe Food Co.

paid_by

string

The advertiser's funding source.

Awe Co.

ErrorStructV2
Key

Type

Description

Example

code

string

The error category in string.

ok

message

string

The detailed error description.

log_id

string

The unique ID associated with every request for debugging purporse.

202207280326050102231031430C7E754E

http_status_code

i32

The http status code.

200

Getting Started
This guide will show you how to use the Commercial Content API. Learn how to use the Commercial Content API to query ad data and fetch public advertiser data in the following use case example.

View your client registration
Once your application is approved, a research client will be generated for your project. You can view your approved research projects here. Select a project from the list to see the research client details.

The provided Client key and Client secret are required to connect to the Commercial Content API endpoints. The client key and secret are hidden by default but can be displayed by clicking the Display button (eye icon).

Note: The client secret is a credential used to authenticate your connection to TikTok's APIs. Do not share this with anyone!

Obtain a client access token
Once you have obtained the client key and secret for your project, generate a client access token. Add this access token in the authorization header of the http requests to connect to the Commercial Content API endpoints.

Query TikTok public content data
The cURL command below shows an example of how you can query the TikTok ads created in Italy between January 2, 2021 to January 9, 2021 with the keyword "coffee".

curl -X POST 'https://open.tiktokapis.com/v2/research/adlib/ad/query/?fields=ad,ad_group' \
 -H 'authorization: bearer clt.example12345Example12345Example' \
 -d '{
"filters": {
"ad_published_date_range": {
"min": "20221001",
"max": "20230510"
},
"country": "IT"
},
"search_term": "coffee",
"max_count": 20
}'
Pagination
If the total number of ads that match the search criteria is larger than the maximum number of ads that can be returned in a single request, the response data will be returned with different requests.

Field

Type

Description

Example

Required?

max_count

number

The maximum count of TikTok videos in the response. The default value is 10 and the maximum value is 50.

12

FALSE

search_id

string

The ID of a previous search to provide sequential calls for paging.

"eyJsYXN0X3NvcnQiOls3NDA3OCwiMzUwNDIwOTgzOD"

FALSE

First page
When you send the first request, you do not need to set the search_id in the request body. In the http response, has_more and search_id are returned, which are used in the subsequent requests.

Try out this request:

curl -X POST 'https://open.tiktokapis.com/v2/research/adlib/ad/query/?fields=ad,ad_group' \
 -H 'authorization: bearer clt.example12345Example12345Example' \
 -d '{
"filters": {
"ad_published_date_range": {
"min": "20221001",
"max": "20230510"
},
"country": "IT"
},
"search_term": "coffee",
"max_count": 20
}'
The following example data is returned from the response.

{
"data": {
"has_more": true,
"search_id": "eyJsYXN0X3NvcnQiOls3NDA3OCwiMzUwNDIwOTgzOD",
"ads": [
...
]
},
"error": {
...
}
}
Next page
With the cURL command below, you can get the next page of query results.

curl -X POST 'https://open.tiktokapis.com/v2/research/adlib/ad/query/?fields=ad,ad_group' \
 -H 'authorization: bearer clt.example12345Example12345Example' \
 -d '{
"filters": {
"ad_published_date_range": {
"min": "20221001",
"max": "20230510"
},
"country": "IT"
},
"search_term": "coffee",
"max_count": 20,
"search_id": "eyJsYXN0X3NvcnQiOls3NDA3OCwiMzUwNDIwOTgzOD"
}'
The following example data is returned from the response.

{
"data": {
"has_more": true,
"search_id": "eyJsYXN0X3NvcnQiOlsyNTQxMTkwLCIzNDk1NzA4NjI",
"ads": [
...
]
},
"error": {
...
}
}
