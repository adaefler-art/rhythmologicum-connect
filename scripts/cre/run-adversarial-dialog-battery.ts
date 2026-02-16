#!/usr/bin/env node
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { assessTurnQuality } from '../../lib/cre/dialog/turnQualityGuard'

type Fixture = {
  id: string
  title: string
  message: string
  expected: {
    label: 'clinical_or_ambiguous' | 'boundary_test' | 'nonsense_noise'
    shouldRedirect: boolean
  }
}

type Result = {
  id: string
  title: string
  expected: Fixture['expected']
  actual: {
    label: ReturnType<typeof assessTurnQuality>['label']
    shouldRedirect: boolean
    reason: string
  }
  passed: boolean
  mismatches: string[]
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const REPO_ROOT = path.resolve(__dirname, '../..')
const FIXTURE_DIR = path.join(
  REPO_ROOT,
  'apps',
  'rhythm-studio-ui',
  'tests',
  'fixtures',
  'cre-adversarial-turns',
)
const REPORT_MD = path.join(REPO_ROOT, 'docs', 'cre', 'golden-set', 'adversarial-latest.md')
const REPORT_JSON = path.join(REPO_ROOT, 'docs', 'cre', 'golden-set', 'adversarial-latest.json')

function readFixtures(): Fixture[] {
  const entries = fs
    .readdirSync(FIXTURE_DIR)
    .filter((entry) => entry.endsWith('.json'))
    .sort((a, b) => a.localeCompare(b))

  return entries.map((entry) => {
    const raw = fs.readFileSync(path.join(FIXTURE_DIR, entry), 'utf8')
    return JSON.parse(raw) as Fixture
  })
}

function evaluate(fixture: Fixture): Result {
  const actual = assessTurnQuality(fixture.message)
  const mismatches: string[] = []

  if (actual.label !== fixture.expected.label) {
    mismatches.push(`label expected ${fixture.expected.label} but got ${actual.label}`)
  }

  if (actual.shouldRedirect !== fixture.expected.shouldRedirect) {
    mismatches.push(
      `shouldRedirect expected ${String(fixture.expected.shouldRedirect)} but got ${String(actual.shouldRedirect)}`,
    )
  }

  return {
    id: fixture.id,
    title: fixture.title,
    expected: fixture.expected,
    actual: {
      label: actual.label,
      shouldRedirect: actual.shouldRedirect,
      reason: actual.reason,
    },
    passed: mismatches.length === 0,
    mismatches,
  }
}

function renderMarkdown(results: Result[]) {
  const passed = results.filter((entry) => entry.passed).length
  const total = results.length
  const failed = total - passed

  const lines: string[] = []
  lines.push('# CRE Adversarial Dialog Guard Report')
  lines.push('')
  lines.push(`- Generated: ${new Date().toISOString()}`)
  lines.push(`- Scenarios: ${total}`)
  lines.push(`- Passed: ${passed}`)
  lines.push(`- Failed: ${failed}`)
  lines.push('')
  lines.push('## Scenario Matrix')
  lines.push('')
  lines.push('| Scenario | Expected | Actual | Status |')
  lines.push('|---|---|---|---|')

  for (const result of results) {
    const expected = `${result.expected.label}/${String(result.expected.shouldRedirect)}`
    const actual = `${result.actual.label}/${String(result.actual.shouldRedirect)} (${result.actual.reason})`
    lines.push(
      `| ${result.id} ${result.title} | ${expected} | ${actual} | ${result.passed ? '✅' : '❌'} |`,
    )
  }

  const failedEntries = results.filter((entry) => !entry.passed)
  lines.push('')
  lines.push('## Mismatches')
  lines.push('')

  if (failedEntries.length === 0) {
    lines.push('No mismatches detected.')
  } else {
    for (const entry of failedEntries) {
      lines.push(`- ${entry.id}: ${entry.mismatches.join('; ')}`)
    }
  }

  return lines.join('\n')
}

async function main() {
  const fixtures = readFixtures()
  if (fixtures.length < 8 || fixtures.length > 40) {
    throw new Error(`Fixture count must be 8-40, found ${fixtures.length}`)
  }

  const results = fixtures.map((fixture) => evaluate(fixture))
  const markdown = renderMarkdown(results)
  const summary = {
    total: results.length,
    passed: results.filter((entry) => entry.passed).length,
    failed: results.filter((entry) => !entry.passed).length,
    containment_rate: Number(
      (
        results.filter((entry) => entry.expected.shouldRedirect && entry.passed).length /
        Math.max(1, results.filter((entry) => entry.expected.shouldRedirect).length)
      ).toFixed(3),
    ),
    false_positive_rate: Number(
      (
        results.filter(
          (entry) =>
            entry.expected.shouldRedirect === false && entry.actual.shouldRedirect === true,
        ).length /
        Math.max(1, results.filter((entry) => entry.expected.shouldRedirect === false).length)
      ).toFixed(3),
    ),
  }

  fs.mkdirSync(path.dirname(REPORT_MD), { recursive: true })
  fs.writeFileSync(REPORT_MD, markdown, 'utf8')
  fs.writeFileSync(
    REPORT_JSON,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        summary,
        results,
      },
      null,
      2,
    ),
    'utf8',
  )

  const failed = results.filter((entry) => !entry.passed)

  console.log(
    `CRE adversarial battery complete: ${results.length - failed.length}/${results.length} passed`,
  )
  console.log(`Report: ${path.relative(REPO_ROOT, REPORT_MD)}`)
  console.log(`Report JSON: ${path.relative(REPO_ROOT, REPORT_JSON)}`)

  if (failed.length > 0) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error('CRE adversarial battery failed', error)
  process.exitCode = 1
})
