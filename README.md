# AI Banking Quality Framework

[![Playwright Tests](https://github.com/Shaalini-C/ai-banking-quality-framework/actions/workflows/playwright.yml/badge.svg)](https://github.com/Shaalini-C/ai-banking-quality-framework/actions/workflows/playwright.yml)

A small, maintainable Playwright Test and TypeScript portfolio project for exercising the public ParaBank demo. It combines browser UI tests with a local static test-quality analyzer. The analyzer is a deterministic source-code tool; despite the project name, it does not use an AI model or external AI service.

## Project Highlights

- Playwright + TypeScript UI automation across Chromium, Firefox, and WebKit.
- Page Objects encapsulate verified locators and reusable actions.
- A deterministic static analyzer reports test-quality patterns and heuristic warnings.
- GitHub Actions runs type checking, analyzer checks, and browser tests on pushes and pull requests.

## Scope and observed application limitations

- The tests cover the ParaBank login form, account overview, opening an account, and the visible Transfer Funds, Bill Pay, and Find Transactions forms.
- During previous live inspection, arbitrary non-empty login input reached the Accounts Overview. That observed demo behavior is used only as navigation setup in some tests. It does **not** establish valid credentials, expected authentication behavior, or secure authentication.
- An invalid transaction ID search returned an application HTTP 500 during inspection. The current Find Transactions test checks visible filters and an available account, but deliberately does not submit a search.
- Transfer Funds and Bill Pay tests do not submit transactions.
- The Open New Account test submits the form and creates a demo account. Running the full suite can therefore add accounts to ParaBank's shared demo data (once per browser project, and potentially more after retries). The generated account number is dynamic and is not asserted as a fixed value.
- ParaBank is an external demo service. Its availability, behavior, account data, and test results may change independently of this repository.

## Architecture

Tests use Playwright Test's built-in fixtures and web-first assertions. Page objects encapsulate stable, inspected locators and reusable user actions; assertions remain in the test specs.

```text
.
├── .github/
│   └── workflows/
│       └── playwright.yml
├── pages/
│   ├── AccountOverviewPage.ts
│   ├── BillPayPage.ts
│   ├── FindTransactionsPage.ts
│   ├── LoginPage.ts
│   ├── OpenAccountPage.ts
│   └── TransferFundsPage.ts
├── quality-analyzer/
│   ├── analyze-tests.mjs
│   └── analyzer.test.mjs
├── tests/
│   ├── account-overview.spec.ts
│   ├── bill-pay.spec.ts
│   ├── example.spec.ts
│   ├── find-transactions.spec.ts
│   ├── login.spec.ts
│   ├── open-account.spec.ts
│   ├── parabank-smoke.spec.ts
│   └── transfer-funds.spec.ts
├── package.json
├── package-lock.json
├── playwright.config.ts
├── tsconfig.json
└── .gitignore
```

## Technologies

- Playwright Test for browser automation and reporting
- TypeScript for tests, page objects, and type checking
- Node.js built-in test runner for analyzer unit tests
- TypeScript compiler API for parsing TypeScript test source in the analyzer
- GitHub Actions for CI

No dependencies beyond those already in the project are required for the analyzer or CI workflow.

## Prerequisites and setup

- Node.js 20 or newer (Playwright 1.64 requires Node.js 20 or newer)
- npm

Install dependencies and the Playwright browser binaries:

```sh
npm ci
npx playwright install
```

On a new Linux machine, install required operating-system browser packages with:

```sh
npx playwright install --with-deps
```

## Commands

```sh
npm run typecheck
npm test
npm run test:headed
npx playwright test tests/login.spec.ts
npm run test:report
npm run quality:test
npm run quality:analyze
```

`npm run test:report` opens the HTML report from a preceding Playwright run. The browser projects are Chromium, Firefox, and WebKit.

## Static test-quality analyzer

Run `npm run quality:analyze` to inspect `tests/**/*.spec.ts`. It writes:

- `quality-reports/test-quality.json`
- `quality-reports/test-quality.md`

The report includes the detected test count and findings with severity, classification, file, line, test title, and a suggested action. The analyzer checks for:

- **HIGH, verified — `EMPTY_TEST`:** an empty block-bodied test callback.
- **MEDIUM, verified — `NO_MEANINGFUL_ASSERTION`:** no recognized direct Playwright `expect(...).to...` matcher in the test body. This is not a judgment that a present assertion is strong.
- **MEDIUM, verified — `HARDCODED_WAIT`:** a `waitForTimeout(...)` call or a member `setTimeout(...)` call with a numeric second argument.
- **LOW, heuristic — `FRAGILE_SELECTOR`:** literal `locator(...)` selectors matching the analyzer's XPath, structural, or CSS-class patterns.
- **HIGH, heuristic — `POTENTIALLY_DESTRUCTIVE_ACTION`:** a `.click()` receiver whose source text matches the current transfer/payment button naming patterns.
- **MEDIUM, heuristic — `STATE_CHANGING_ACTION`:** a `.submit()` receiver whose source text includes `openAccountPage`.
- **LOW, heuristic — `UNCLEAR_TEST_DESCRIPTION`:** a missing/dynamic title or a title matching a short list of generic phrases.

The isolated examples in `quality-analyzer/fixtures/` show risky source patterns beside safer alternatives; `npm run quality:test` analyzes them as regression cases. They are not Playwright specs and do not interact with ParaBank. Findings include a rule ID, severity, source location, recommendation, and a relevant Playwright documentation link. Financial-action and state-change findings link to general isolation/best-practice guidance; Playwright does not provide documentation specific to these analyzer heuristics.

Findings labelled **verified** mean the analyzer deterministically matched a source pattern, not that runtime impact was proven. Findings labelled **heuristic** are potential risks inferred from names or selector forms and can be false positives or miss cases. For example, the analyzer does not generally detect shared mutable state, broad selectors, or weak assertions, and financial-action matching depends on source naming. The analyzer is static source analysis, not genuine AI, a security scanner, a substitute for review, or a runtime test. Quality findings are advisory and do not make the command fail; file, parse, or report-generation errors return a non-zero exit code.

Generated analyzer reports are ignored by Git but are uploaded by CI as workflow artifacts.

## Playwright reports and diagnostics

Playwright writes an HTML report to `playwright-report/`. On test failures it retains screenshots, traces, and videos under `test-results/`; successful tests do not retain those failure diagnostics. These generated directories are ignored by Git.

## CI/CD

The GitHub Actions workflow runs on pushes and pull requests targeting `main` or `master`, the branches already listed in the project's workflow scaffold. It uses Node.js 20 and `npm ci`, installs the configured Playwright browsers and Linux dependencies, runs type checking, analyzer tests, analysis, and the full browser test suite, then uploads analyzer reports and Playwright reports/diagnostics even if an earlier step fails.

The workflow has read-only repository-content permissions and does not use secrets, paid services, or privileged shell commands. The project has been pushed to [the GitHub repository](https://github.com/Shaalini-C/ai-banking-quality-framework); its Actions page showed a green status when last checked. The badge above links to the workflow page. The branch filters are defined in `.github/workflows/playwright.yml`; no particular run ID or individual job result is asserted here.

## Roadmap

- Add further ParaBank flows after inspecting their live behavior and side effects.
- Improve test isolation for externally shared demo state.
- Expand analyzer checks only when they can be explained and tested with low false-positive risk.
- Review CI browser coverage and artifact retention as the suite grows.

AI-powered quality analysis, reporting beyond Playwright's built-in HTML report, and real banking integrations are not implemented.
