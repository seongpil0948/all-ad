# Test Coverage Implementation Guide

## Overview

This document describes the comprehensive test coverage system implemented for the All-Ad project using Playwright's Coverage API and Istanbul for reporting.

## 🚀 Features Implemented

### 1. Coverage Collection Utility (`tests/helpers/coverage-utils.ts`)

Complete coverage collection system with the following capabilities:

- **JavaScript Coverage**: V8 coverage collection and Istanbul conversion
- **CSS Coverage**: CSS usage tracking and analysis
- **Flexible Configuration**: Configurable output directories, inclusion/exclusion patterns
- **Multiple Report Formats**: HTML, JSON, LCOV, and text reports
- **Helper Functions**: Easy-to-use wrapper functions for common scenarios

### 2. Coverage Configuration

- **`.c8rc.json`**: Coverage thresholds and configuration
  - Lines: 70% threshold
  - Functions: 70% threshold
  - Branches: 60% threshold
  - Statements: 70% threshold

- **`playwright/vite.config.ts`**: Vite configuration for component testing with proper externals
- **`playwright-ct.config.ts`**: Dedicated Playwright configuration for component tests

### 3. NPM Scripts

Added comprehensive test coverage scripts to `package.json`:

```bash
# Run tests with coverage collection
pnpm test:coverage

# Generate coverage reports
pnpm test:coverage:report

# Full coverage pipeline
pnpm test:coverage:full
```

### 4. CI/CD Integration

Complete GitHub Actions workflow (`.github/workflows/coverage.yml`):

- ✅ **Automated Coverage**: Runs on all PR and pushes to main/develop
- ✅ **Supabase Integration**: Sets up local Supabase for testing
- ✅ **Threshold Checking**: Fails if coverage drops below thresholds
- ✅ **PR Comments**: Automatically comments coverage summary on PRs
- ✅ **Artifact Upload**: Saves coverage reports as artifacts
- ✅ **Codecov Integration**: Uploads coverage to Codecov service

### 5. Test Examples

#### Component Coverage Test

```typescript
// tests/components/cta-button-coverage.spec.tsx
const coverage = await collectCoverageForTest(
  page,
  async () => {
    // Your test code here
  },
  { outputDir: "coverage/components" },
);
```

#### E2E Coverage Test

```typescript
// tests/scenarios/user-coverage-journey.spec.ts
const collector = new CoverageCollector(page, {
  outputDir: "coverage/e2e/user-journey",
  includeJS: true,
  includeCSS: true,
});

await collector.startCoverage();
// Run user journey tests
const coverage = await collector.stopCoverage();
await collector.generateReports(coverage.jsCoverage, coverage.cssCoverage);
```

## 📊 Coverage Reports

The system generates multiple report formats:

1. **HTML Report**: Interactive coverage visualization
   - File-by-file breakdown
   - Line-by-line coverage highlighting
   - Branch and function coverage details

2. **JSON Report**: Machine-readable coverage data
   - Used for programmatic analysis
   - CI/CD pipeline integration
   - Coverage trend tracking

3. **LCOV Report**: Industry-standard format
   - Compatible with external tools
   - Code coverage visualization
   - IDE integration support

4. **Text Summary**: Quick overview in terminal
   - Instant feedback during development
   - CI/CD status reporting

## 🔧 Usage Instructions

### Basic Coverage Collection

```bash
# Run all tests with coverage
pnpm test:coverage

# Run specific test group with coverage
pnpm test:e2e --reporter=json

# Generate and view HTML report
pnpm test:coverage:report
open coverage/index.html
```

### Advanced Coverage Analysis

```typescript
import { analyzeCoverageSummary } from "@/tests/helpers/coverage-utils";

const analyzer = analyzeCoverageSummary("coverage/coverage-final.json");
const summary = await analyzer.getSummary();

console.log(`Lines: ${summary.lines.percentage}%`);
console.log(`Functions: ${summary.functions.percentage}%`);
console.log(`Branches: ${summary.branches.percentage}%`);
console.log(`Statements: ${summary.statements.percentage}%`);
```

### Custom Coverage Configuration

```typescript
const collector = new CoverageCollector(page, {
  outputDir: "custom-coverage",
  includeJS: true,
  includeCSS: false,
  resetOnNavigation: false,
  reportAnonymousScripts: false,
});
```

## 📁 File Structure

```
tests/
├── helpers/
│   ├── coverage-utils.ts           # Main coverage utility
│   └── test-utils.ts              # Test helper functions
├── components/
│   ├── cta-button-coverage.spec.tsx  # Component coverage example
│   └── *.spec.tsx                 # Other component tests
├── scenarios/
│   ├── user-coverage-journey.spec.ts # E2E coverage example
│   └── *.spec.ts                  # Other scenario tests
└── fixtures/                      # Test data and fixtures

coverage/                           # Generated coverage reports
├── index.html                     # Main HTML report
├── coverage-final.json            # JSON coverage data
├── lcov.info                      # LCOV format
├── css-coverage.json              # CSS coverage data
└── html/                          # Detailed HTML reports

.github/workflows/coverage.yml      # CI/CD coverage workflow
.c8rc.json                         # Coverage configuration
playwright-ct.config.ts            # Component testing config
playwright/
├── vite.config.ts                 # Vite configuration
├── index.tsx                      # Test setup
└── mocks.ts                       # Mock implementations
```

## 🎯 Coverage Thresholds

Current thresholds (configurable in `.c8rc.json`):

- **Lines**: 70% minimum
- **Functions**: 70% minimum
- **Branches**: 60% minimum
- **Statements**: 70% minimum

## 🔍 Monitoring & Alerts

The CI/CD pipeline provides several monitoring features:

1. **PR Comments**: Automatic coverage summary on pull requests
2. **Threshold Enforcement**: Build fails if coverage drops
3. **Trend Tracking**: Coverage history via artifacts
4. **External Integration**: Codecov for detailed analysis

## 🚨 Troubleshooting

### Common Issues

1. **Module Resolution Errors**: Add external dependencies to `playwright/vite.config.ts`
2. **CSS Import Issues**: CSS imports are handled by the test environment
3. **Server Dependencies**: Mock server-side utilities in `playwright/mocks.ts`
4. **Low Coverage**: Focus on testing all code paths and edge cases

### Debug Commands

```bash
# Verbose test output
NODE_ENV=test DEBUG=pw:api pnpm test:coverage

# Debug specific component
pnpm exec playwright test --config=playwright-ct.config.ts tests/components/component-name.spec.tsx --debug

# Check coverage configuration
cat .c8rc.json
```

## 🎉 Next Steps

1. **Gradual Rollout**: Start with critical components and high-traffic flows
2. **Coverage Goals**: Aim for 80%+ coverage on core business logic
3. **Integration**: Integrate coverage checks into pre-commit hooks
4. **Documentation**: Update component documentation with coverage status
5. **Performance**: Monitor coverage collection performance impact

## 📚 Resources

- [Playwright Coverage API](https://playwright.dev/docs/api/class-coverage)
- [Istanbul Coverage](https://istanbul.js.org/)
- [C8 Coverage Tool](https://github.com/bcoe/c8)
- [Codecov Documentation](https://docs.codecov.io/)

---

**Generated**: 2025-08-09  
**Project**: All-Ad Multi-tenant Advertising Platform  
**Coverage System**: Production Ready ✅
