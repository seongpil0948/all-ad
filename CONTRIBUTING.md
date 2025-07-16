# Contributing to All-AD

모든 기여를 환영합니다! 이 문서는 All-AD 프로젝트에 기여하는 방법을 설명합니다.

## 📋 목차

- [시작하기 전에](#시작하기-전에)
- [개발 환경 설정](#개발-환경-설정)
- [개발 워크플로우](#개발-워크플로우)
- [코딩 가이드라인](#코딩-가이드라인)
- [플랫폼 서비스 개발](#플랫폼-서비스-개발)
- [커밋 가이드라인](#커밋-가이드라인)
- [Pull Request 가이드라인](#pull-request-가이드라인)
- [문제 해결](#문제-해결)

## 🚀 시작하기 전에

### 필수 요구사항

- **Node.js** 18.0.0 이상
- **pnpm** 8.0.0 이상 (권장 패키지 매니저)
- **Git** 최신 버전
- **VS Code** (권장 에디터)

### 코드 컨벤션 확인

프로젝트는 다음 도구들로 코드 품질을 관리합니다:

- **ESLint**: 코드 스타일 및 품질 검사
- **Prettier**: 자동 코드 포매팅
- **TypeScript**: 타입 안전성
- **Husky + lint-staged**: Pre-commit hooks

## 🛠 개발 환경 설정

### 1. 저장소 포크 및 클론

```bash
# 1. GitHub에서 저장소를 포크합니다
# 2. 포크한 저장소를 로컬에 클론합니다
git clone https://github.com/YOUR_USERNAME/all-ad.git
cd all-ad

# 3. 원본 저장소를 upstream으로 추가합니다
git remote add upstream https://github.com/seongpil0948/all-ad.git
```

### 2. 의존성 설치

```bash
# 의존성 설치 (pre-commit hooks 자동 설정됨)
pnpm install
```

> 💡 **중요**: `pnpm install` 실행 시 Husky가 자동으로 설정되어 pre-commit hooks가 활성화됩니다.

### 3. 환경 변수 설정

```bash
# 환경 변수 파일 복사
cp .env.local.example .env.local

# .env.local 파일을 편집하여 필요한 환경 변수를 설정하세요
```

### 4. 개발 서버 실행

```bash
# 개발 서버 시작
pnpm dev
```

브라우저에서 `http://localhost:3000`을 열어 애플리케이션이 정상 작동하는지 확인하세요.

### 5. Git 설정

```bash
# 커밋 메시지 템플릿 설정
git config commit.template .gitmessage

# 사용자 정보 설정 (아직 설정하지 않은 경우)
git config user.name "Your Name"
git config user.email "your.email@example.com"
```

## 🔄 개발 워크플로우

### 1. 최신 코드 동기화

작업을 시작하기 전에 항상 최신 코드로 동기화하세요:

```bash
# upstream에서 최신 변경사항 가져오기
git fetch upstream

# main 브랜치로 체크아웃
git checkout main

# upstream의 main 브랜치와 동기화
git merge upstream/main

# 또는 rebase 사용
git rebase upstream/main

# 포크한 저장소에 푸시
git push origin main
```

### 2. 기능 브랜치 생성

```bash
# 기능 브랜치 생성 및 체크아웃
git checkout -b feature/your-feature-name

# 또는 버그 수정의 경우
git checkout -b fix/bug-description

# 또는 문서 수정의 경우
git checkout -b docs/documentation-update
```

**브랜치 명명 규칙:**

- `feature/` - 새로운 기능
- `fix/` - 버그 수정
- `docs/` - 문서 업데이트
- `refactor/` - 코드 리팩토링
- `test/` - 테스트 추가/수정
- `style/` - 스타일 관련 변경

### 3. 개발 진행

#### 코드 작성 시 확인사항

```bash
# 타입 체크
pnpm tsc

# 린팅 검사
pnpm lint

# 포매팅
pnpm format

# 테스트 실행
pnpm exec playwright install

pnpm test:fast
```

#### 실시간 개발 도구

```bash
# 개발 서버 (Hot reload 지원)
pnpm dev

# 타입 체크 watch 모드
pnpm tsc --watch
```

### 4. 커밋하기

#### Pre-commit Hooks 이해하기

프로젝트는 자동화된 pre-commit hooks를 사용합니다:

1. **Staged 파일 확인**: `git add`로 스테이징된 파일만 처리
2. **ESLint 실행**: JavaScript/TypeScript 파일의 코드 품질 검사 및 자동 수정
3. **Prettier 실행**: 모든 지원 파일 포매팅
4. **자동 재스테이징**: 수정된 파일은 자동으로 다시 스테이징됨
5. **커밋 메시지 검증**: Conventional Commits 형식 준수 확인

#### 커밋 과정

```bash
# 변경된 파일 스테이징
git add .

# 또는 특정 파일만
git add path/to/file.ts

# 커밋 (pre-commit hooks 자동 실행)
git commit -m "feat(auth): add OAuth integration"
```

#### 커밋 메시지 형식

```
type(scope): description

[optional body]

[optional footer]
```

**예시:**

```
feat(dashboard): add campaign performance charts

- Add ECharts integration for data visualization
- Implement responsive chart components
- Add support for multiple date ranges

Closes #123
```

**타입:**

- `feat`: 새로운 기능
- `fix`: 버그 수정
- `docs`: 문서 변경
- `style`: 코드 포매팅 (기능 변경 없음)
- `refactor`: 코드 리팩토링
- `perf`: 성능 개선
- `test`: 테스트 추가/수정
- `build`: 빌드 시스템 변경
- `ci`: CI 설정 변경
- `chore`: 기타 작업

**스코프 예시:**

- `auth`: 인증 관련
- `dashboard`: 대시보드 관련
- `api`: API 관련
- `platforms`: 플랫폼 서비스 관련 (2024.12 추가)
- `components`: 컴포넌트 관련
- `utils`: 유틸리티 관련

## 🔧 플랫폼 서비스 개발 (2024.12 업데이트)

### 새로운 플랫폼 추가하기

새로운 광고 플랫폼을 추가할 때는 다음 가이드라인을 따르세요:

#### 1. 플랫폼 서비스 생성

```typescript
// services/platforms/your-platform.service.ts
import { BasePlatformService } from "./base-platform.service";
import {
  PlatformCredentials,
  ConnectionTestResult,
  TokenRefreshResult,
} from "./platform-service.interface";

export class YourPlatformService extends BasePlatformService<YourApiClient> {
  platform: PlatformType = "your_platform";

  async testConnection(): Promise<ConnectionTestResult> {
    return this.executeWithErrorHandling(async () => {
      // 플랫폼 연결 테스트 로직
      const isConnected = await this.service!.testConnection();
      return {
        success: isConnected,
        accountInfo: { id: "account-id", name: "Account Name" },
      };
    }, "testConnection");
  }

  async refreshToken(): Promise<TokenRefreshResult> {
    // 토큰 갱신 로직 구현
  }

  async getAccountInfo(): Promise<AccountInfo> {
    // 계정 정보 조회 로직 구현
  }

  // 기타 필수 메서드들...
}
```

#### 2. 에러 처리 규칙

- 모든 플랫폼 작업은 `executeWithErrorHandling` 래퍼 사용
- 플랫폼별 에러는 `PlatformError` 계열 클래스 사용
- 재시도 가능한 에러와 불가능한 에러 구분

```typescript
// 좋은 예
async fetchCampaigns(): Promise<Campaign[]> {
  return this.executeWithErrorHandling(async () => {
    const campaigns = await this.service!.getCampaigns();
    return campaigns.map(this.transformCampaign);
  }, "fetchCampaigns");
}
```

#### 3. 팩토리 등록

```typescript
// services/platforms/platform-service-factory.ts
private initializeServices(): void {
  this.services.set("your_platform", () => new YourPlatformService());
}
```

#### 4. 타입 정의

```typescript
// types/supabase.types.ts에 플랫폼 타입 추가
export type PlatformType = "google" | "facebook" | "amazon" | "your_platform";
```

### 코드 품질 기준

1. **TypeScript 엄격 모드**: 모든 타입 명시
2. **에러 처리**: try-catch 대신 `executeWithErrorHandling` 사용
3. **로깅**: `console.log` 금지, `log` 유틸리티 사용
4. **테스트**: 새 플랫폼은 연결 테스트 필수

### 5. 푸시 및 Pull Request

#### 브랜치 푸시

```bash
# 브랜치를 원격 저장소에 푸시
git push origin feature/your-feature-name

# 첫 번째 푸시의 경우 upstream 설정
git push -u origin feature/your-feature-name
```

#### Pull Request 생성

1. **GitHub에서 PR 생성**
   - 포크한 저장소의 브랜치에서 원본 저장소의 `main` 브랜치로 PR 생성

2. **PR 제목 및 설명**

   ```
   feat(auth): Add OAuth integration

   ## 📝 변경사항
   - OAuth 2.0 인증 시스템 구현
   - Google, Facebook 로그인 지원
   - 사용자 세션 관리 개선

   ## 🧪 테스트
   - [ ] 단위 테스트 통과
   - [ ] E2E 테스트 통과
   - [ ] 수동 테스트 완료

   ## 📸 스크린샷
   (관련 스크린샷 첨부)

   ## 🔗 관련 이슈
   Closes #123
   ```

3. **PR 체크리스트**
   - [ ] 코드가 프로젝트의 코딩 표준을 따름
   - [ ] 모든 테스트가 통과함
   - [ ] 문서가 업데이트됨 (필요한 경우)
   - [ ] 브랜치가 최신 main과 동기화됨

## 📝 코딩 가이드라인

### TypeScript 규칙

```typescript
// ✅ 좋은 예
interface User {
  id: string;
  email: string;
  createdAt: Date;
}

const fetchUser = async (id: string): Promise<User | null> => {
  // 구현
};

// ❌ 나쁜 예
const fetchUser = async (id: any) => {
  // any 타입 사용 금지
};
```

### React 컴포넌트 규칙

```typescript
// ✅ 좋은 예 - 함수형 컴포넌트 사용
interface Props {
  title: string;
  onClose: () => void;
}

const Modal: React.FC<Props> = ({ title, onClose }) => {
  return (
    <div className="modal">
      <h2>{title}</h2>
      <button onClick={onClose}>Close</button>
    </div>
  );
};

// ❌ 나쁜 예 - 클래스 컴포넌트 사용 금지
class Modal extends React.Component {
  // 사용하지 않음
}
```

### 파일 구조 규칙

```
components/
├── common/           # 공통 컴포넌트
├── dashboard/        # 대시보드 관련
├── auth/            # 인증 관련
└── index.ts         # export 관리

hooks/
├── useAuth.ts       # 인증 관련 훅
├── useApi.ts        # API 관련 훅
└── index.ts

utils/
├── api.ts           # API 유틸리티
├── format.ts        # 포매팅 유틸리티
└── index.ts
```

## 🔍 Pull Request 가이드라인

### PR 크기

- **작은 PR 권장**: 한 번에 하나의 기능이나 수정사항만 포함
- **대용량 PR**: 500줄 이상인 경우 여러 개의 작은 PR로 분할 검토

### 리뷰 과정

1. **자동 검사**: CI/CD 파이프라인이 자동으로 테스트 실행
2. **코드 리뷰**: 팀원들의 리뷰 및 피드백
3. **수정**: 피드백에 따른 코드 수정
4. **승인**: 최소 1명 이상의 승인 필요
5. **병합**: 관리자가 main 브랜치에 병합

### 리뷰 체크리스트

**코드 품질:**

- [ ] 코드가 읽기 쉽고 이해하기 쉬움
- [ ] 적절한 변수명과 함수명 사용
- [ ] 주석이 필요한 복잡한 로직에 설명 추가
- [ ] 중복 코드 제거

**기능:**

- [ ] 요구사항을 정확히 구현
- [ ] 엣지 케이스 처리
- [ ] 에러 처리 적절히 구현

**테스트:**

- [ ] 새로운 기능에 대한 테스트 작성
- [ ] 기존 테스트가 여전히 통과
- [ ] 적절한 테스트 커버리지

**성능:**

- [ ] 불필요한 re-render 방지
- [ ] 메모리 누수 방지
- [ ] 적절한 로딩 상태 처리

## 🔧 문제 해결

### Pre-commit Hooks 문제

#### Hook이 실행되지 않는 경우

```bash
# 1. Husky 재설치
pnpm run prepare

# 2. 수동으로 git hook 설정 (Husky 9.x 이상에서 문제가 있는 경우)
echo '#!/bin/sh
cd "$(dirname "$0")/../.."
npx lint-staged' > .git/hooks/pre-commit

# 3. Hook 파일 권한 설정
chmod +x .git/hooks/pre-commit

# 4. Git hooks 확인
ls -la .git/hooks/pre-commit
```

#### Hook 작동 확인

```bash
# 테스트 파일 생성 (잘못된 포매팅)
echo "const test='hello';console.log(test)" > test.js

# 파일 스테이징
git add test.js

# 1. 잘못된 커밋 메시지로 테스트 (실패해야 함)
git commit -m "bad message"
# 결과: commitlint가 오류를 발견하여 커밋 거부

# 2. 올바른 커밋 메시지로 테스트 (성공해야 함)
git commit -m "feat(test): add test file"
# 결과: pre-commit hook이 코드를 수정하고 커밋 성공

# 정상 작동 시:
# ✔ ESLint가 코드를 검사하고 수정
# ✔ Prettier가 코드를 포매팅
# ✔ Commitlint가 커밋 메시지를 검증
# ✔ 모든 검사 통과 후 커밋 완료

# 테스트 후 정리
rm test.js
git reset HEAD~1 --soft
```

#### Lint/Format 오류

```bash
# ESLint 오류 수정
pnpm lint

# Prettier 포매팅
pnpm format

# 캐시 초기화
rm -rf .eslintcache
rm -rf .next
```

#### Pre-commit Hook 건너뛰기 (긴급상황만)

```bash
# 주의: 특별한 경우에만 사용
git commit --no-verify -m "urgent: critical hotfix"
```

### 일반적인 개발 문제

#### 의존성 문제

```bash
# node_modules 재설치
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

#### TypeScript 오류

```bash
# TypeScript 캐시 초기화
rm -rf .next
rm tsconfig.tsbuildinfo
pnpm tsc
```

#### 브랜치 동기화 문제

```bash
# 강제로 upstream과 동기화
git fetch upstream
git reset --hard upstream/main
git push origin main --force
```

### 도움 요청

문제가 해결되지 않는 경우:

1. **GitHub Issues**: 버그 리포트나 기능 제안
2. **Discussions**: 일반적인 질문이나 토론
3. **Discord/Slack**: 실시간 도움 (링크가 있는 경우)

## 🎉 기여해주셔서 감사합니다!

여러분의 기여가 All-AD를 더 나은 프로젝트로 만듭니다. 질문이나 제안사항이 있으시면 언제든지 이슈를 생성해 주세요.

---

**추가 자료:**

- [README.md](./README.md) - 프로젝트 개요
- [docs/](./docs/) - 상세 문서
- [GitHub Issues](https://github.com/seongpil0948/all-ad/issues) - 버그 리포트 및 기능 제안
