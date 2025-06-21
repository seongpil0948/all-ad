# All-AD - 통합 광고 관리 플랫폼

All-AD는 여러 광고 플랫폼(Facebook, Google, Kakao, Naver, Coupang)을 하나의 대시보드에서 통합 관리할 수 있는 차세대 광고 관리 솔루션입니다.

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
# 의존성 설치
pnpm install

# 개발 서버 실행
pnpm dev

# 프로덕션 빌드
pnpm build

# 프로덕션 실행
pnpm start
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

프로젝트에 기여하고 싶으시다면 PR을 보내주세요!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 라이선스

MIT License - 자세한 내용은 [LICENSE](LICENSE) 파일을 참조하세요.

## 📞 문의

- Email: support@all-ad.com
- Website: https://all-ad.com
