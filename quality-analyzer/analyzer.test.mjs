import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import {
  analyzeSource,
  buildReport,
  markdownReport,
} from './analyze-tests.mjs';

const riskyFixture = readFileSync(
  new URL('./fixtures/risky-tests.ts', import.meta.url),
  'utf8',
);
const saferFixture = readFileSync(
  new URL('./fixtures/safer-tests.ts', import.meta.url),
  'utf8',
);
const riskyAnalysis = analyzeSource(
  'quality-analyzer/fixtures/risky-tests.ts',
  riskyFixture,
);
const saferAnalysis = analyzeSource(
  'quality-analyzer/fixtures/safer-tests.ts',
  saferFixture,
);

const demonstratedRules = [
  {
    code: 'HARDCODED_WAIT',
    title: 'test',
    severity: 'MEDIUM',
    classification: 'verified',
    line: 4,
    documentation: 'https://playwright.dev/docs/writing-tests',
  },
  {
    code: 'FRAGILE_SELECTOR',
    title: 'test',
    severity: 'LOW',
    classification: 'heuristic',
    line: 5,
    documentation: 'https://playwright.dev/docs/locators',
  },
  {
    code: 'POTENTIALLY_DESTRUCTIVE_ACTION',
    title: 'submits a payment',
    severity: 'HIGH',
    classification: 'heuristic',
    line: 11,
    documentation: 'https://playwright.dev/docs/best-practices',
  },
  {
    code: 'STATE_CHANGING_ACTION',
    title: 'opens a new account',
    severity: 'MEDIUM',
    classification: 'heuristic',
    line: 20,
    documentation: 'https://playwright.dev/docs/best-practices',
  },
  {
    code: 'NO_MEANINGFUL_ASSERTION',
    title: 'navigates without checking the result',
    severity: 'MEDIUM',
    classification: 'verified',
    line: 24,
    documentation: 'https://playwright.dev/docs/test-assertions',
  },
  {
    code: 'EMPTY_TEST',
    title: 'empty placeholder',
    severity: 'HIGH',
    classification: 'verified',
    line: 28,
    documentation: 'https://playwright.dev/docs/writing-tests',
  },
  {
    code: 'UNCLEAR_TEST_DESCRIPTION',
    title: 'test',
    severity: 'LOW',
    classification: 'heuristic',
    line: 3,
    documentation: 'https://playwright.dev/docs/writing-tests',
  },
];

test('risky fixture parses exactly the expected demonstration tests', () => {
  const expectedTitles = [
    'test',
    'submits a payment',
    'opens a new account',
    'navigates without checking the result',
    'empty placeholder',
  ];

  assert.equal(riskyAnalysis.tests.length, expectedTitles.length);
  assert.deepEqual(
    riskyAnalysis.tests.map(({ title }) => title),
    expectedTitles,
  );
});

for (const rule of demonstratedRules) {
  test(`demonstrates ${rule.code} with an isolated risky example`, () => {
    const matches = riskyAnalysis.findings.filter(
      (candidate) =>
        candidate.code === rule.code && candidate.testTitle === rule.title,
    );

    assert.equal(
      matches.length,
      1,
      `Expected exactly one ${rule.code} for "${rule.title}"`,
    );
    const [finding] = matches;
    assert.equal(finding.ruleId, rule.code);
    assert.equal(finding.severity, rule.severity);
    assert.equal(finding.classification, rule.classification);
    assert.ok(finding.file.endsWith('quality-analyzer/fixtures/risky-tests.ts'));
    assert.equal(finding.line, rule.line);
    assert.match(finding.recommendation, /\S/);
    assert.equal(finding.documentation, rule.documentation);
  });
}

test('safer examples avoid all currently supported finding patterns', () => {
  const expectedTitles = [
    'waits for the overview heading without a fixed delay',
    'uses a role-based locator for the visible control',
    'checks the payment form without submitting a payment',
    'checks account opening without creating a demo account',
    'asserts the overview after navigation',
    'describes the expected overview behavior',
  ];

  assert.equal(saferAnalysis.tests.length, expectedTitles.length);
  assert.deepEqual(
    saferAnalysis.tests.map(({ title }) => title),
    expectedTitles,
  );
  assert.deepEqual(saferAnalysis.findings, []);
});

test('reports exact source line after a comment', () => {
  const source = `test('selector after a comment', async ({ page }) => {
  // This comment must not affect the source location.
  await page.locator('.legacy-button').click();
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
});`;
  const result = analyzeSource('tests/comment-location.spec.ts', source);
  const finding = result.findings.find(
    ({ code }) => code === 'FRAGILE_SELECTOR',
  );

  assert.ok(finding);
  assert.equal(finding.line, 3);
});

test('reports exact source line for a finding inside a nested expression', () => {
  const source = `test('nested wait', async ({ page }) => {
  await Promise.resolve(
    page.waitForTimeout(25),
  );
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
});`;
  const result = analyzeSource('tests/nested-location.spec.ts', source);
  const finding = result.findings.find(
    ({ code }) => code === 'HARDCODED_WAIT',
  );

  assert.ok(finding);
  assert.equal(finding.line, 3);
});

test('retains both same-rule findings and their exact source lines', () => {
  const source = `test('two fragile selectors', async ({ page }) => {
  await page.locator('.first-button').click();
  await page.locator('.second-button').click();
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
});`;
  const result = analyzeSource('tests/repeated-location.spec.ts', source);
  const findings = result.findings.filter(
    ({ code }) => code === 'FRAGILE_SELECTOR',
  );

  assert.equal(findings.length, 2);
  assert.deepEqual(
    findings.map(({ line }) => line),
    [2, 3],
  );
});

test('recognizes a meaningful Playwright assertion without findings', () => {
  const result = analyzeSource(
    'tests/example.spec.ts',
    `import { expect, test } from '@playwright/test';
test.beforeEach(async ({ page }) => {
  await page.goto('/');
});
test('shows the account heading', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Accounts' })).toBeVisible();
});`,
  );

  assert.equal(result.tests.length, 1);
  assert.deepEqual(result.findings, []);
});

test('reports fixed waits, fragile selectors, risky actions, and generic titles', () => {
  const result = analyzeSource(
    'tests/example.spec.ts',
    `test('test', async ({ page }) => {
  await page.waitForTimeout(50);
  await page.locator('.legacy-button').click();
  await page.getByRole('button', { name: 'Send Payment' }).click();
});`,
  );
  for (const code of [
    'HARDCODED_WAIT',
    'FRAGILE_SELECTOR',
    'POTENTIALLY_DESTRUCTIVE_ACTION',
    'NO_MEANINGFUL_ASSERTION',
    'UNCLEAR_TEST_DESCRIPTION',
  ]) {
    assert.ok(result.findings.some((finding) => finding.code === code), code);
  }
});

test('reports empty tests and distinguishes analyzer findings in reports', () => {
  const result = analyzeSource(
    'tests/empty.spec.ts',
    `test('empty placeholder', async () => {});`,
  );
  const report = buildReport([result], '2026-10-10T00:00:00.000Z');
  const markdown = markdownReport(report);

  assert.ok(result.findings.some((finding) => finding.code === 'EMPTY_TEST'));
  assert.equal(report.summary.testsAnalyzed, 1);
  assert.equal(report.analysisType, 'static-source-analysis-not-AI');
  assert.match(markdown, /Static Test Quality Analysis/);
  assert.match(markdown, /heuristic warnings/i);
  assert.match(markdown, /static source analysis, not genuine AI/i);
  assert.match(markdown, /\| Rule \|/);
  assert.match(markdown, /\[Playwright docs\]/);
  assert.equal(report.findings[0].ruleId, 'EMPTY_TEST');
  assert.match(
    report.findings[0].documentation,
    /^https:\/\/playwright\.dev\/docs\//,
  );
});

test('rejects malformed TypeScript as an analyzer execution error', () => {
  assert.throws(
    () => analyzeSource('tests/broken.spec.ts', `test('unfinished', () => {`),
    /unable to parse TypeScript/,
  );
});
