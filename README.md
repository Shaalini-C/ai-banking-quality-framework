# AI Banking Quality Framework

A small, maintainable Playwright Test and TypeScript portfolio project for exercising the public ParaBank demo. It combines browser UI tests with a local static test-quality analyzer. The analyzer is a deterministic source-code tool; despite the project name, it does not use an AI model or external AI service.

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
└── tsconfig.json
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

- Empty test bodies and tests without a recognized Playwright `expect` assertion
- Fixed waits such as `page.waitForTimeout(...)`
- Potentially fragile XPath, structural, or CSS-class selectors
- Potentially destructive transfer and payment submissions
- Open-account submission that changes demo state
- Generic or missing test descriptions

Findings labelled **verified** are deterministic source patterns (for example, a literal `waitForTimeout` call or an empty callback), not proof of runtime impact. Findings labelled **heuristic** are potential risks inferred from names or selector forms and can be false positives or miss cases. The analyzer is static source analysis, not genuine AI, a security scanner, a substitute for review, or a runtime test. Quality findings are advisory and do not make the command fail; file, parse, or report-generation errors return a non-zero exit code. Run `npm run quality:test` for analyzer unit tests.

Generated analyzer reports are ignored by Git but are uploaded by CI as workflow artifacts.

## Playwright reports and diagnostics

Playwright writes an HTML report to `playwright-report/`. On test failures it retains screenshots, traces, and videos under `test-results/`; successful tests do not retain those failure diagnostics. These generated directories are ignored by Git.

## CI/CD

The GitHub Actions workflow runs on pushes and pull requests targeting `main` or `master`, the branches already listed in the project's workflow scaffold. It uses Node.js 20 and `npm ci`, installs the configured Playwright browsers and Linux dependencies, runs type checking, analyzer tests, analysis, and the full browser test suite, then uploads analyzer reports and Playwright reports/diagnostics even if an earlier step fails.

The workflow has read-only repository-content permissions and does not use secrets, paid services, or privileged shell commands. The current workspace is not a Git repository, so its actual remote or primary branch could not be independently verified here. Confirm or adjust the workflow's branch filters when connecting this project to its remote repository. No remote workflow run has been performed or claimed.

## Roadmap

- Add further ParaBank flows after inspecting their live behavior and side effects.
- Improve test isolation for externally shared demo state.
- Expand analyzer checks only when they can be explained and tested with low false-positive risk.
- Review CI browser coverage and artifact retention as the suite grows.

AI-powered quality analysis, reporting beyond Playwright's built-in HTML report, real banking integrations, and GitHub publishing are not implemented.
