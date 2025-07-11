# Sivera Playwright Tests

This directory contains end-to-end tests for the Sivera platform using Playwright.

## Test Structure

```
tests/
├── auth/                    # Authentication tests
│   ├── authenticated.spec.ts
│   ├── forgot-password.spec.ts
│   ├── login.spec.ts
│   └── signup.spec.ts
├── dashboard/              # Dashboard feature tests
│   └── dashboard.spec.ts
├── platform/               # Platform integration tests
│   └── platform-integration.spec.ts
├── team/                   # Team management tests
│   └── team-management.spec.ts
├── campaign/               # Campaign management tests
│   └── campaign-management.spec.ts
├── settings/               # Settings page tests
│   └── settings.spec.ts
├── analytics/              # Analytics feature tests
│   └── analytics.spec.ts
├── home/                   # Landing page tests
│   └── landing-page.spec.ts
├── poc/                    # Proof of concept tests
│   └── demo-todo-app.spec.ts
├── asset/                  # Test assets
│   └── storageState.json   # Authentication state
├── auth.setup.ts           # Authentication setup
├── config.ts              # Test configuration
├── tester.ts              # Custom test wrapper
└── README.md              # This file
```

## Setup

### 1. Environment Variables

Create a `.env.test` file in the project root with the following variables:

```env
# Test user credentials
TEST_USER_ID=your_test_email@example.com
TEST_USER_PASSWORD=your_test_password

# Copy these from .env.local
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DB_PW=your_db_password
NEXT_PUBLIC_SITE_URL=http://localhost:3000
SERVICE_VERSION=1.0.0
REDIS_URL=your_redis_url
RESEND_API_KEY=your_resend_api_key
```

### 2. Create Test User

Before running the tests, ensure you have a test user account created in Supabase with the credentials specified in `.env.test`.

### 3. Install Dependencies

```bash
pnpm install
```

## Running Tests

### Run all tests

```bash
pnpm exec playwright test
```

### Run tests with UI mode

```bash
pnpm exec playwright test --ui
```

### Run specific test file

```bash
pnpm exec playwright test tests/auth/login.spec.ts
```

### Run tests in specific browser

```bash
pnpm exec playwright test --project=chromium
```

### Debug tests

```bash
pnpm exec playwright test --debug
```

### Generate test code

```bash
pnpm exec playwright codegen
```

## Test Annotations

Our tests use a custom annotation system for categorization:

- `MAIN_CATEGORY`: Main feature area (e.g., "인증", "대시보드", "설정")
- `SUB_CATEGORY1`: Sub-feature (e.g., "로그인", "회원가입")
- `SUB_CATEGORY2`: Specific test scenario

Example:

```typescript
test.beforeEach(async ({ page, pushAnnotation }) => {
  pushAnnotation(AnnotationType.MAIN_CATEGORY, "인증");
  pushAnnotation(AnnotationType.SUB_CATEGORY1, "로그인");
});
```

## Test Reports

Test results are saved to:

- Excel reports: `test-records/` directory
- HTML reports: `playwright-report/` directory

## Best Practices

1. **Use data-testid attributes**: For reliable element selection
2. **Follow page object pattern**: For reusable page interactions
3. **Use annotations**: To categorize and organize tests
4. **Test in Korean**: UI elements are in Korean, so tests check for Korean text
5. **Clean up after tests**: Ensure tests don't leave data that affects other tests

## Troubleshooting

### Tests fail with authentication error

- Ensure TEST_USER_ID and TEST_USER_PASSWORD are set in `.env.test`
- Verify the test user exists in Supabase
- Check that the auth.setup.ts is running correctly

### Tests fail to find elements

- Check if the application is running on http://localhost:3000
- Verify data-testid attributes are present in the application
- Use Playwright Inspector to debug: `pnpm exec playwright test --debug`

### Port already in use

- The test configuration starts a dev server on port 3000
- Stop any running dev servers before running tests

## CI/CD Integration

For CI/CD pipelines, set the following environment variables:

- All variables from `.env.test`
- `CI=true` to run in headless mode
