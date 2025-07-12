# OAuth Setup Guide - 사용자별 인증 정보 설정

## 개요

Sivera 플랫폼은 각 사용자(팀)가 자신의 광고 플랫폼 API 인증 정보를 직접 입력하여 관리하는 방식을 사용합니다. 이를 통해 보안성을 높이고 각 팀이 독립적으로 광고 계정을 관리할 수 있습니다.

## Google OAuth 설정

### 1. Google Cloud Console 설정

1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성 또는 기존 프로젝트 선택
3. APIs & Services > Library로 이동
4. "Google Ads API" 검색 후 활성화

### 2. OAuth 2.0 인증 정보 생성

1. APIs & Services > Credentials로 이동
2. "Create Credentials" > "OAuth client ID" 선택
3. Application type: "Web application" 선택
4. 다음 정보 입력:
   - Name: "Your Company - Sivera Integration"
   - Authorized JavaScript origins:
     - `http://localhost:3000` (개발용)
     - `https://your-sivera-instance.com` (프로덕션)
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/oauth/google/callback` (개발용)
     - `https://your-sivera-instance.com/api/auth/oauth/google/callback` (프로덕션)

### 3. Sivera 플랫폼에서 인증 정보 입력

1. Sivera 플랫폼의 "설정 > 플랫폼 연동" 페이지로 이동
2. Google Ads의 "연결하기" 버튼 클릭
3. 팝업창에서 다음 정보 입력:
   - Client ID: Google Cloud Console에서 생성한 OAuth 2.0 Client ID
   - Client Secret: Google Cloud Console에서 생성한 Client Secret
   - Developer Token: Google Ads API Center에서 발급받은 Developer Token

### 4. Google Ads Developer Token 획득

1. [Google Ads API Center](https://ads.google.com/aw/apicenter)에 접속
2. "API Access" 탭에서 Developer token 확인
3. Sivera 플랫폼의 인증 정보 입력 화면에서 Developer Token 필드에 입력

## 일반적인 문제 해결

### redirect_uri_mismatch 에러

이 에러는 OAuth 콜백 URL이 Google Console에 등록된 URL과 정확히 일치하지 않을 때 발생합니다.

**해결 방법:**

1. Google Cloud Console > Credentials에서 OAuth 2.0 Client ID 수정
2. Authorized redirect URIs에 정확한 URL 추가:
   - 개발: `http://localhost:3000/api/auth/oauth/google/callback`
   - 프로덕션: `https://your-domain.com/api/auth/oauth/google/callback`
3. 프로토콜(http/https), 도메인, 포트, 경로가 모두 정확히 일치해야 함

### 토큰 갱신 실패

Refresh token이 없거나 만료된 경우 발생합니다.

**해결 방법:**

1. OAuth URL 생성 시 `access_type=offline` 파라미터 확인
2. `prompt=consent` 파라미터로 강제 재동의 유도
3. 사용자가 플랫폼 연결을 다시 진행하도록 안내

## Meta (Facebook) OAuth 설정

1. [Facebook Developers](https://developers.facebook.com/)에서 앱 생성
2. Facebook Login 제품 추가
3. 유효한 OAuth 리디렉션 URI 설정
4. 필요한 권한 요청: `ads_management`, `ads_read`, `business_management`

## Kakao OAuth 설정

1. [Kakao Developers](https://developers.kakao.com/)에서 애플리케이션 생성
2. 카카오 로그인 활성화
3. Redirect URI 등록
4. 카카오 모먼트 API 사용 권한 신청

## Naver OAuth 설정

1. [Naver Developers](https://developers.naver.com/)에서 애플리케이션 등록
2. 네이버 로그인 API 사용 설정
3. 서비스 URL 및 Callback URL 등록
4. 네이버 검색광고 API 권한 신청
