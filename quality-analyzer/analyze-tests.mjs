import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import ts from 'typescript';

const PROJECT_ROOT = path.resolve(import.meta.dirname, '..');
const TEST_DIRECTORY = path.join(PROJECT_ROOT, 'tests');
const REPORT_DIRECTORY = path.join(PROJECT_ROOT, 'quality-reports');
const SUPPORTED_ASSERTION_PREFIXES = [
  'toBe',
  'toHave',
  'toContain',
  'toMatch',
  'toThrow',
  'toPass',
  'toBeOK',
];

function lineAt(sourceFile, node) {
  return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile))
    .line + 1;
}

function isTestCall(node) {
  if (!ts.isCallExpression(node)) {
    return false;
  }

  const expression = node.expression;
  if (ts.isIdentifier(expression)) {
    return expression.text === 'test';
  }

  if (
    !ts.isPropertyAccessExpression(expression) ||
    !ts.isIdentifier(expression.expression) ||
    expression.expression.text !== 'test'
  ) {
    return false;
  }

  return ['only', 'skip', 'fixme', 'fail'].includes(expression.name.text);
}

function callbackOf(testCall) {
  return testCall.arguments.find(
    (argument) => ts.isArrowFunction(argument) || ts.isFunctionExpression(argument),
  );
}

function titleOf(testCall) {
  const title = testCall.arguments[0];
  if (ts.isStringLiteral(title) || ts.isNoSubstitutionTemplateLiteral(title)) {
    return title.text;
  }
  return undefined;
}

function isAssertionCall(node) {
  if (!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) {
    return false;
  }

  const assertionName = node.expression.name.text;
  if (!SUPPORTED_ASSERTION_PREFIXES.some((prefix) => assertionName.startsWith(prefix))) {
    return false;
  }

  const assertionTarget = node.expression.expression;
  return (
    ts.isCallExpression(assertionTarget) &&
    ts.isIdentifier(assertionTarget.expression) &&
    assertionTarget.expression.text === 'expect'
  );
}

function addFinding(findings, sourceFile, node, details) {
  findings.push({
    ...details,
    file: path.relative(PROJECT_ROOT, sourceFile.fileName).split(path.sep).join('/'),
    line: lineAt(sourceFile, node),
  });
}

function analyzeTest(testCall, sourceFile, findings) {
  const title = titleOf(testCall) ?? '(dynamic title)';
  const callback = callbackOf(testCall);
  if (!callback) {
    return;
  }

  let assertionCount = 0;
  const emptyBody =
    ts.isBlock(callback.body) && callback.body.statements.length === 0;

  function inspect(node) {
    if (isAssertionCall(node)) {
      assertionCount += 1;
    }

    if (
      ts.isCallExpression(node) &&
      ts.isPropertyAccessExpression(node.expression)
    ) {
      const methodName = node.expression.name.text;
      const receiverText = node.expression.expression.getText(sourceFile);

      if (
        methodName === 'waitForTimeout' ||
        (methodName === 'setTimeout' &&
          node.arguments.length > 1 &&
          ts.isNumericLiteral(node.arguments[1]))
      ) {
        addFinding(findings, sourceFile, node, {
          code: 'HARDCODED_WAIT',
          severity: 'MEDIUM',
          classification: 'verified',
          testTitle: title,
          message:
            'The test uses a fixed-duration wait instead of waiting for a condition.',
          recommendation:
            'Prefer a Playwright web-first assertion or wait for a specific event or state.',
        });
      }

      if (
        methodName === 'locator' &&
        node.arguments.length > 0 &&
        (ts.isStringLiteral(node.arguments[0]) ||
          ts.isNoSubstitutionTemplateLiteral(node.arguments[0]))
      ) {
        const selector = node.arguments[0].text;
        if (
          /(^\s*xpath=|^\s*\/\/|:nth-child|:nth-of-type|\[class(?:[*^$~|]?=))/i.test(
            selector,
          ) ||
          /^\.[A-Za-z_-]/.test(selector)
        ) {
          addFinding(findings, sourceFile, node, {
            code: 'FRAGILE_SELECTOR',
            severity: 'LOW',
            classification: 'heuristic',
            testTitle: title,
            message: `The selector "${selector}" may depend on DOM structure or styling classes.`,
            recommendation:
              'Prefer an accessible role/name or a stable application-owned test identifier.',
          });
        }
      }

      if (
        methodName === 'click' &&
        /(transferButton|sendPaymentButton|name:\s*['"](?:Transfer|Send Payment)['"])/i.test(
          receiverText,
        )
      ) {
        addFinding(findings, sourceFile, node, {
          code: 'POTENTIALLY_DESTRUCTIVE_ACTION',
          severity: 'HIGH',
          classification: 'heuristic',
          testTitle: title,
          message:
            'The test appears to submit a money transfer or bill payment.',
          recommendation:
            'Avoid submitting financial actions in routine UI tests; use a safe validation path or isolated test data.',
        });
      }
    }

    if (ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)) {
      const methodName = node.expression.name.text;
      const receiverText = node.expression.expression.getText(sourceFile);
      if (
        methodName === 'submit' &&
        /openAccountPage/i.test(receiverText)
      ) {
        addFinding(findings, sourceFile, node, {
          code: 'STATE_CHANGING_ACTION',
          severity: 'MEDIUM',
          classification: 'heuristic',
          testTitle: title,
          message:
            'The test appears to create an account and change shared demo state.',
          recommendation:
            'Keep state-changing demo actions intentional, avoid fixed generated values, and document their side effects.',
        });
      }
    }

    ts.forEachChild(node, inspect);
  }

  inspect(callback.body);

  if (emptyBody) {
    addFinding(findings, sourceFile, callback, {
      code: 'EMPTY_TEST',
      severity: 'HIGH',
      classification: 'verified',
      testTitle: title,
      message: 'The test callback has an empty body.',
      recommendation:
        'Add meaningful test actions and assertions, or remove the placeholder test.',
    });
  } else if (assertionCount === 0) {
    addFinding(findings, sourceFile, callback, {
      code: 'NO_MEANINGFUL_ASSERTION',
      severity: 'MEDIUM',
      classification: 'verified',
      testTitle: title,
      message: 'No supported Playwright expect assertion was found in the test body.',
      recommendation:
        'Assert an observable outcome with a Playwright web-first assertion.',
    });
  }

  if (
    title === '(dynamic title)' ||
    /^(?:test(?: case)?(?:\s+\d+)?|works?|example(?: test)?|should work|todo)$/i.test(
      title.trim(),
    )
  ) {
    addFinding(findings, sourceFile, testCall, {
      code: 'UNCLEAR_TEST_DESCRIPTION',
      severity: 'LOW',
      classification: 'heuristic',
      testTitle: title ?? '(dynamic title)',
      message: 'The test title is missing or too generic to explain its behavior.',
      recommendation:
        'Describe the user-visible behavior or expected outcome in the test title.',
    });
  }
}

export function analyzeSource(filePath, sourceText) {
  const sourceFile = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TS,
  );
  if (sourceFile.parseDiagnostics.length > 0) {
    const diagnostic = sourceFile.parseDiagnostics[0];
    const message = ts.flattenDiagnosticMessageText(
      diagnostic.messageText,
      '\n',
    );
    const line = diagnostic.start === undefined
      ? 1
      : sourceFile.getLineAndCharacterOfPosition(diagnostic.start).line + 1;
    throw new Error(`${filePath}:${line}: unable to parse TypeScript: ${message}`);
  }

  const findings = [];
  const tests = [];

  function visit(node) {
    if (isTestCall(node)) {
      const title = titleOf(node);
      tests.push({ title: title ?? '(dynamic title)' });
      analyzeTest(node, sourceFile, findings);
    }
    ts.forEachChild(node, visit);
  }
  visit(sourceFile);

  return { file: filePath, tests, findings };
}

function findTestFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      return findTestFiles(entryPath);
    }
    return entry.isFile() && entry.name.endsWith('.spec.ts') ? [entryPath] : [];
  });
}

export function markdownReport(report) {
  const lines = [
    '# Static Test Quality Analysis',
    '',
    `Generated: ${report.generatedAt}`,
    '',
    '> This is static source analysis, not genuine AI and not runtime verification. Findings are advisory; the analyzer exits non-zero only when analysis or report generation fails.',
    '',
    `- Test files analyzed: ${report.summary.filesAnalyzed}`,
    `- Test cases detected: ${report.summary.testsAnalyzed}`,
    `- Findings: ${report.summary.findings}`,
    `- Verified source-pattern findings: ${report.summary.verifiedFindings}`,
    `- Heuristic warnings: ${report.summary.heuristicWarnings}`,
    '',
  ];

  if (report.findings.length === 0) {
    lines.push('No findings were detected.', '');
    return lines.join('\n');
  }

  lines.push(
    '| Severity | Classification | Finding | Test | Location | Recommendation |',
    '|---|---|---|---|---|---|',
  );
  for (const finding of report.findings) {
    const escapeCell = (value) => String(value ?? '').replaceAll('|', '\\|');
    lines.push(
      `| ${finding.severity} | ${finding.classification} | ${escapeCell(finding.code)}: ${escapeCell(finding.message)} | ${escapeCell(finding.testTitle)} | ${finding.file}:${finding.line} | ${escapeCell(finding.recommendation)} |`,
    );
  }
  lines.push('');
  return lines.join('\n');
}

export function buildReport(results, generatedAt = new Date().toISOString()) {
  const findings = results.flatMap((result) => result.findings);
  const verifiedFindings = findings.filter(
    (finding) => finding.classification === 'verified',
  ).length;
  return {
    analyzer: 'AI Banking Quality Framework static test analyzer',
    analysisType: 'static-source-analysis-not-AI',
    generatedAt,
    summary: {
      filesAnalyzed: results.length,
      testsAnalyzed: results.reduce(
        (total, result) => total + result.tests.length,
        0,
      ),
      findings: findings.length,
      verifiedFindings,
      heuristicWarnings: findings.length - verifiedFindings,
    },
    findings,
  };
}

async function main() {
  const testFiles = findTestFiles(TEST_DIRECTORY);
  const results = testFiles.map((filePath) =>
    analyzeSource(
      filePath,
      fs.readFileSync(filePath, 'utf8'),
    ),
  );
  const report = buildReport(results);

  fs.mkdirSync(REPORT_DIRECTORY, { recursive: true });
  fs.writeFileSync(
    path.join(REPORT_DIRECTORY, 'test-quality.json'),
    `${JSON.stringify(report, null, 2)}\n`,
  );
  fs.writeFileSync(
    path.join(REPORT_DIRECTORY, 'test-quality.md'),
    markdownReport(report),
  );
  console.log(
    `Analyzed ${report.summary.testsAnalyzed} tests in ${report.summary.filesAnalyzed} files. ` +
      `${report.summary.findings} findings (${report.summary.verifiedFindings} verified source patterns, ` +
      `${report.summary.heuristicWarnings} heuristic warnings). Reports: quality-reports/test-quality.json and quality-reports/test-quality.md`,
  );
}

if (
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error) => {
    console.error('Test quality analysis failed:', error);
    process.exitCode = 1;
  });
}
