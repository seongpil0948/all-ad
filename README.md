# All-AD - 통합 광고 관리 플랫폼

All-AD는 여러 광고 플랫폼(Facebook, Google, Kakao, Naver, Coupang)을 하나의 대시보드에서 통합 관리할 수 있는 차세대 광고 관리 솔루션입니다.

## 📋 목차

- [주요 기능](#-주요-기능)
- [기술 스택](#-기술-스택)
- [프로젝트 구조](#-프로젝트-구조)
- [시작하기](#-시작하기)
- [사용 방법](#-사용-방법)
- [보안](#-보안)
- [기여하기](#-기여하기)
- [문제 해결](#-문제-해결)
- [라이선스](#-라이선스)
- [문의](#-문의)

## 🚀 주요 기능

### 1. 멀티 플랫폼 통합 관리

- **Facebook Ads**: 페이스북/인스타그램 광고 캠페인 관리
- **Google Ads**: 구글 검색/디스플레이 광고 관리
- **Kakao Moment**: 카카오 모먼트 광고 관리
- **Naver Search AD**: 네이버 검색광고 관리
- **Coupang Ads**: 쿠팡 광고 관리

### 2. 인증 및 팀 관리

- **이메일 기반 로그인**: 안전한 이메일 인증 시스템
- **팀 협업**: 마스터/에디터/뷰어 권한 관리
- **멀티 팀 지원**: 여러 팀 동시 관리 가능

### 3. 캠페인 관리

- **통합 대시보드**: 모든 플랫폼의 캠페인을 한 눈에
- **예산 관리**: 캠페인별 예산 실시간 조정
- **상태 관리**: 캠페인 활성화/비활성화 제어
- **원클릭 동기화**: 모든 플랫폼 데이터 한번에 동기화

### 4. 분석 및 리포팅

- **실시간 통계**: 캠페인 성과 실시간 모니터링
- **통합 메트릭**: 플랫폼별 지표 통합 분석
- **시계열 데이터**: 일별 성과 추이 분석

## 🛠 기술 스택

- **Frontend**: Next.js 15 (App Router), Hero UI, Zustand
- **Backend**: Supabase (PostgreSQL), Server Actions
- **Charts**: Apache ECharts
- **Deployment**: Vercel
- **Monitoring**: OpenTelemetry

## 📁 프로젝트 구조

```
all-ad/
├── app/                      # Next.js App Router
│   ├── (auth)/              # 인증 관련 라우트
│   ├── (private)/           # 로그인 필수 라우트
│   │   ├── dashboard/       # 메인 대시보드
│   │   ├── integrated/      # 통합 관리 페이지
│   │   ├── team/           # 팀 관리
│   │   └── settings/       # 설정
│   └── api/                # API 라우트
│       ├── campaigns/      # 캠페인 관리 API
│       └── sync/          # 플랫폼 동기화 API
├── components/             # 재사용 컴포넌트
│   ├── dashboard/         # 대시보드 컴포넌트
│   ├── platform/          # 플랫폼 관련 컴포넌트
│   └── team/             # 팀 관리 컴포넌트
├── services/             # 비즈니스 로직
│   └── platforms/        # 플랫폼별 서비스
├── stores/               # Zustand 상태 관리
└── types/               # TypeScript 타입 정의
```

## 🚦 시작하기

### 필수 요구사항

- Node.js 18.0.0 이상
- pnpm 8.0.0 이상 (권장)
- Git

### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 환경 변수를 설정하세요:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# 플랫폼별 API 키 (선택사항)
GOOGLE_ADS_CLIENT_ID=your_google_client_id
GOOGLE_ADS_CLIENT_SECRET=your_google_client_secret
FACEBOOK_APP_ID=your_facebook_app_id
FACEBOOK_APP_SECRET=your_facebook_app_secret
# ... 기타 플랫폼 키
```

### 설치 및 실행

```bash
# 저장소 클론
git clone <repository-url>
cd all-ad

# 의존성 설치 (Pre-commit hooks 자동 설정됨)
pnpm install

# 개발 서버 실행
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 실행
pnpm start
```

### 개발 환경 설정

프로젝트는 다음과 같은 개발 도구들이 설정되어 있습니다:

#### Pre-commit Hooks

- **Husky**: Git hooks 관리
- **Lint-staged**: 커밋 전 staged 파일에 대해서만 린팅/포매팅 실행
- **ESLint**: 코드 품질 검사 및 자동 수정
- **Prettier**: 코드 포매팅

커밋 시 자동으로 다음 작업이 수행됩니다:

- JavaScript/TypeScript 파일: ESLint 검사 및 수정, Prettier 포매팅
- JSON/Markdown/CSS 파일: Prettier 포매팅

#### 개발 명령어

```bash
# 타입 체크
pnpm tsc

# 전체 프로젝트 린팅
pnpm lint

# 전체 프로젝트 포매팅
pnpm format

# 단위 테스트
pnpm test:unit

# E2E 테스트
pnpm test:e2e
```

### 테스트 실행

```bash
# 테스트용 환경 변수 설정
cp .env.test.example .env.test
# .env.test 파일을 열어 TEST_USER_ID와 TEST_USER_PASSWORD 설정

# Playwright 테스트 실행
pnpm exec playwright test

# UI 모드로 테스트 실행
pnpm exec playwright test --ui

# 특정 테스트 파일만 실행
pnpm exec playwright test tests/auth/login.spec.ts
```

### 데이터베이스 마이그레이션

```bash
# Supabase CLI로 마이그레이션 실행
supabase db push
```

## 📱 사용 방법

### 1. 회원가입/로그인

- 이메일로 회원가입
- 첫 가입 시 자동으로 마스터 권한 부여
- 팀 자동 생성

### 2. 플랫폼 연동

- 설정 > 플랫폼 연동에서 각 플랫폼의 API 키 입력
- 플랫폼별 인증 정보 안전하게 암호화 저장

### 3. 캠페인 관리

- 동기화 버튼 클릭으로 모든 캠페인 데이터 가져오기
- 캠페인별 예산 수정 및 상태 변경
- 실시간 성과 모니터링

### 4. 팀 협업

- 팀원 초대 (이메일)
- 권한 설정 (뷰어/에디터)
- 팀별 데이터 격리

## 🔒 보안

- Row Level Security (RLS)로 데이터 보호
- 팀별 데이터 격리
- API 키 암호화 저장
- 권한 기반 접근 제어

## 🤝 기여하기

프로젝트에 기여하고 싶으시다면 [CONTRIBUTING.md](./CONTRIBUTING.md)를 참고해주세요.

**빠른 가이드:**

1. **저장소 포크 및 클론**

   ```bash
   git clone https://github.com/YOUR_USERNAME/all-ad.git
   cd all-ad
   pnpm install
   ```

2. **기능 브랜치 생성**

   ```bash
   git checkout -b feature/amazing-feature
   ```

3. **개발 및 커밋**

   ```bash
   # 자동으로 ESLint + Prettier 적용됨 (pre-commit hook)
   git add .
   git commit -m "feat(scope): description"
   ```

4. **푸시 및 PR 생성**
   ```bash
   git push origin feature/amazing-feature
   ```

자세한 개발 워크플로우, 코딩 가이드라인, 문제 해결 방법은 **[CONTRIBUTING.md](./CONTRIBUTING.md)**에서 확인하세요.

## 🔧 문제 해결

### 자주 발생하는 문제들

#### 1. Pre-commit Hook 오류

```bash
# Hook이 설치되지 않은 경우
pnpm run prepare

# Hook 파일 권한 문제
chmod +x .husky/pre-commit

# 수동으로 pre-commit 체크 실행
pnpm run pre-commit
```

#### 2. ESLint 오류

```bash
# ESLint 캐시 초기화
rm -rf .eslintcache

# 전체 프로젝트 재린팅
pnpm lint
```

#### 3. TypeScript 오류

```bash
# TypeScript 캐시 초기화
rm -rf .next
rm tsconfig.tsbuildinfo

# 타입 체크
pnpm tsc
```

#### 4. 의존성 문제

```bash
# node_modules 재설치
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

## 📝 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 문의

- Email: support@all-ad.com
- Website: https://all-ad.com
