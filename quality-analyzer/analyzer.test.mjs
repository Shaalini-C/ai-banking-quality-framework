import assert from 'node:assert/strict';
import test from 'node:test';
import {
  analyzeSource,
  buildReport,
  markdownReport,
} from './analyze-tests.mjs';

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
  const findingsByCode = new Map(
    result.findings.map((finding) => [finding.code, finding]),
  );

  assert.ok(findingsByCode.has('HARDCODED_WAIT'));
  assert.equal(findingsByCode.get('HARDCODED_WAIT').classification, 'verified');
  assert.ok(findingsByCode.has('FRAGILE_SELECTOR'));
  assert.equal(
    findingsByCode.get('FRAGILE_SELECTOR').classification,
    'heuristic',
  );
  assert.ok(findingsByCode.has('POTENTIALLY_DESTRUCTIVE_ACTION'));
  assert.ok(findingsByCode.has('NO_MEANINGFUL_ASSERTION'));
  assert.ok(findingsByCode.has('UNCLEAR_TEST_DESCRIPTION'));
  assert.ok(result.findings.every((finding) => finding.line > 0));
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
});

test('rejects malformed TypeScript as an analyzer execution error', () => {
  assert.throws(
    () => analyzeSource('tests/broken.spec.ts', `test('unfinished', () => {`),
    /unable to parse TypeScript/,
  );
});
