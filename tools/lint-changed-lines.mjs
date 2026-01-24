import fs from 'node:fs'
import { execFileSync } from 'node:child_process'
import path from 'node:path'

function sh(cmd, args, options = {}) {
  return execFileSync(cmd, args, { encoding: 'utf8', ...options }).trim()
}

function normalizeRuleId(value) {
  if (typeof value !== 'string') return ''
  return value.trim().normalize('NFKC').replace(/[\u200B-\u200D\uFEFF]/g, '')
}

const IGNORED_RULE_IDS = new Set([normalizeRuleId('@typescript-eslint/no-explicit-any')])

const baseRef = process.env.LINT_BASE_REF || 'origin/main'

let baseSha = process.env.BASE_SHA
let headSha = process.env.HEAD_SHA

try {
  if (!headSha) headSha = sh('git', ['rev-parse', 'HEAD'])
  if (!baseSha) baseSha = sh('git', ['merge-base', headSha, baseRef])
} catch (error) {
  console.error('Failed to resolve BASE_SHA/HEAD_SHA. Ensure git is available and base ref exists.')
  console.error(String(error))
  process.exit(2)
}

function getChangedFiles() {
  const raw = sh('git', ['diff', '--name-only', baseSha, headSha, '--', '*.ts', '*.tsx'])
  return raw
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .filter((file) => !file.includes(`${path.sep}.next${path.sep}`) && !file.includes('/.next/'))
    .filter((file) => fs.existsSync(file))
}

const changedFiles = getChangedFiles()

if (changedFiles.length === 0) {
  console.log('No TS/TSX changes detected. Skipping changed-lines lint.')
  process.exit(0)
}

console.log(`Linting ${changedFiles.length} changed files (report only):`) 
for (const file of changedFiles) console.log(`- ${file}`)

const artifactsDir = path.join(process.cwd(), '.lint-artifacts')
fs.mkdirSync(artifactsDir, { recursive: true })
const eslintReportPath = path.join(artifactsDir, 'eslint-report.json')
const changedRangesPath = path.join(artifactsDir, 'changed_line_ranges.json')

// Run eslint in JSON mode, but never fail this step directly.
try {
  const eslintEntrypoint = path.join(process.cwd(), 'node_modules', 'eslint', 'bin', 'eslint.js')
  execFileSync(
    process.execPath,
    [eslintEntrypoint, '-f', 'json', '-o', eslintReportPath, ...changedFiles],
    { stdio: 'inherit' },
  )
} catch (error) {
  console.error('ESLint invocation failed (continuing to post-process if report exists).')
  console.error(String(error))
  // eslint exits non-zero when it finds errors; we post-process the report.
}

if (!fs.existsSync(eslintReportPath) || fs.statSync(eslintReportPath).size === 0) {
  console.error('eslint-report.json missing or empty; failing to avoid silent bypass')
  process.exit(1)
}

// Build a { file: [{start,end}] } map of the changed line ranges in the HEAD version.
const rangeMap = {}
const hunkRe = /@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/g

for (const file of changedFiles) {
  const diff = sh('git', ['diff', '-U0', baseSha, headSha, '--', file])
  const ranges = []
  let match
  while ((match = hunkRe.exec(diff)) !== null) {
    const start = Number(match[1])
    const count = match[2] === undefined ? 1 : Number(match[2])
    if (!Number.isFinite(start) || !Number.isFinite(count)) continue
    if (count <= 0) continue
    ranges.push({ start, end: start + count - 1 })
  }
  rangeMap[file] = ranges
}

fs.writeFileSync(changedRangesPath, JSON.stringify(rangeMap, null, 2) + '\n')

const ranges = rangeMap
const report = JSON.parse(fs.readFileSync(eslintReportPath, 'utf8'))

function inRanges(file, line) {
  const list = ranges[file] || []
  for (const r of list) {
    if (line >= r.start && line <= r.end) return true
  }
  return false
}

const relevantErrors = []
let ignoredErrors = 0

for (const fileReport of report) {
  const filePath = fileReport.filePath
  const cwd = process.cwd().replace(/\\/g, '/') + '/'
  const rel = filePath.replace(/\\/g, '/').startsWith(cwd)
    ? filePath.replace(/\\/g, '/').slice(cwd.length)
    : filePath

  const key = ranges[rel] ? rel : filePath

  for (const msg of fileReport.messages || []) {
    if (msg.severity !== 2) continue
    const ruleId = normalizeRuleId(msg.ruleId)
    if (ruleId && IGNORED_RULE_IDS.has(ruleId)) {
      ignoredErrors++
      continue
    }

    const line = msg.line || 0
    if (line <= 0) {
      relevantErrors.push({ file: rel, line: msg.line, ruleId, message: msg.message })
      continue
    }

    if (inRanges(key, line)) {
      relevantErrors.push({ file: rel, line, ruleId, message: msg.message })
    } else {
      ignoredErrors++
    }
  }
}

if (relevantErrors.length > 0) {
  console.error(`\n❌ ESLint errors on changed lines: ${relevantErrors.length}`)
  for (const e of relevantErrors.slice(0, 50)) {
    const rule = e.ruleId ? ` (${e.ruleId})` : ''
    console.error(`- ${e.file}:${e.line}${rule} ${e.message}`)
  }
  if (relevantErrors.length > 50) {
    console.error(`...and ${relevantErrors.length - 50} more`)
  }
  process.exit(1)
}

console.log(
  `\n✅ No ESLint errors on changed lines. Ignored ${ignoredErrors} pre-existing errors outside changed ranges.`,
)
process.exit(0)
