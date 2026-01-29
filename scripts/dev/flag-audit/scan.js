const fs = require('fs')
const path = require('path')
const { execFileSync } = require('child_process')

const repoRoot = process.cwd()
const outJsonPath = path.join(repoRoot, 'artifacts', 'flag-audit', 'flag-reads.json')
const outMdPath = path.join(repoRoot, 'docs', 'ops', 'FEATURE_FLAG_CONTRACT.md')
const outPlanPath = path.join(repoRoot, 'docs', 'ops', 'FLAG_FIX_PLAN.md')

const rgArgsBase = ['-n', '--no-heading', '--hidden', '--glob', '!**/node_modules/**', '--glob', '!**/.next/**']

const patterns = [
  { name: 'processEnv', pattern: 'process\\.env\\.[A-Z0-9_]+' },
  { name: 'envDot', pattern: '\\benv\\.[A-Z0-9_]+' },
  { name: 'getEnv', pattern: 'get(Patient|Studio|Engine)?Env\\(' },
  { name: 'flagNames', pattern: '(NEXT_PUBLIC_FEATURE_|E73_|DEV_|PILOT_|_ENABLED)' },
]

function runRg(pattern) {
  try {
    return execFileSync('rg', [...rgArgsBase, pattern, '.'], { encoding: 'utf8' })
  } catch (err) {
    if (err && err.status === 1) {
      return ''
    }
    throw err
  }
}

function parseRgOutput(output) {
  if (!output.trim()) return []
  const lines = output.split(/\r?\n/).filter(Boolean)
  return lines.map((line) => {
    const first = line.indexOf(':')
    const second = line.indexOf(':', first + 1)
    const file = line.slice(0, first)
    const lineNum = Number(line.slice(first + 1, second))
    const snippet = line.slice(second + 1).trim()
    return { file, line: lineNum, snippet }
  })
}

function readFileCached(file, cache) {
  if (!cache.has(file)) {
    const abs = path.join(repoRoot, file)
    const content = fs.readFileSync(abs, 'utf8')
    cache.set(file, content)
  }
  return cache.get(file)
}

function appScope(file) {
  if (file.startsWith('apps/rhythm-patient-ui/')) return 'patient'
  if (file.startsWith('apps/rhythm-studio-ui/')) return 'studio'
  if (file.startsWith('apps/rhythm-legacy/')) return 'legacy'
  if (file.startsWith('apps/rhythm-engine/')) return 'engine'
  if (file.startsWith('lib/') || file.startsWith('packages/')) return 'shared'
  if (file.startsWith('scripts/') || file.startsWith('docs/')) return 'shared'
  return 'unknown'
}

function runtimeScope(file, content) {
  if (file.includes('/app/api/')) return 'server'
  const firstLines = content.split(/\r?\n/).slice(0, 10).join('\n')
  if (/['\"]use client['\"]/i.test(firstLines)) return 'client'
  if (file.startsWith('lib/') || file.startsWith('packages/')) return 'shared'
  return 'unknown'
}

function accessType(snippet) {
  if (snippet.includes('process.env.')) return 'process.env'
  if (/\benv\.[A-Z0-9_]+/.test(snippet)) return 'env'
  if (/get(Patient|Studio|Engine)?Env\(/.test(snippet)) return 'getXEnv'
  return 'unknown'
}

function extractEnvVar(snippet) {
  const processMatch = snippet.match(/process\.env\.([A-Z0-9_]+)/)
  if (processMatch) return processMatch[1]

  const envMatch = snippet.match(/\benv\.([A-Z0-9_]+)/)
  if (envMatch) return envMatch[1]

  const flagMatch = snippet.match(/(NEXT_PUBLIC_FEATURE_[A-Z0-9_]+|E73_[A-Z0-9_]+|DEV_[A-Z0-9_]+|PILOT_[A-Z0-9_]+|USAGE_TELEMETRY_ENABLED|[A-Z0-9_]+_ENABLED)/)
  if (flagMatch) return flagMatch[1]

  return 'ENV_OBJECT'
}

function interpretation(snippet) {
  if (/flagEnabled\(/.test(snippet)) return 'helper:flagEnabled'
  if (/isFeatureEnabled\(/.test(snippet)) return 'helper:isFeatureEnabled'
  if (/flagEnabled\(/.test(snippet)) return 'helper:flagEnabled'
  if (/===\s*['\"]1['\"]/.test(snippet)) return 'eq_1'
  if (/===\s*['\"]true['\"]/i.test(snippet)) return 'eq_true'
  if (/Boolean\(|!!/.test(snippet)) return 'truthy'
  return 'unknown'
}

function isDevTestPath(file) {
  return file.includes('/__tests__/') || /\.test\./.test(file) || file.includes('/test/') || file.includes('/scripts/')
}

function extractFeatureFlagDescriptions() {
  const filePath = path.join(repoRoot, 'lib', 'featureFlags.ts')
  if (!fs.existsSync(filePath)) return new Map()
  const content = fs.readFileSync(filePath, 'utf8')
  const lines = content.split(/\r?\n/)
  const map = new Map()
  for (const line of lines) {
    const match = line.match(/-\s+(NEXT_PUBLIC_[A-Z0-9_]+|E73_[A-Z0-9_]+|DEV_[A-Z0-9_]+|PILOT_[A-Z0-9_]+|USAGE_TELEMETRY_ENABLED)\s*:\s*(.+)/)
    if (match) {
      map.set(match[1], match[2].trim())
    }
  }
  return map
}

function extractEnvFlagsFromEnvTs() {
  const filePath = path.join(repoRoot, 'lib', 'env.ts')
  if (!fs.existsSync(filePath)) return []
  const content = fs.readFileSync(filePath, 'utf8')
  const matches = content.match(/(NEXT_PUBLIC_[A-Z0-9_]+|E73_[A-Z0-9_]+|DEV_[A-Z0-9_]+|PILOT_[A-Z0-9_]+|USAGE_TELEMETRY_ENABLED)/g) || []
  return Array.from(new Set(matches))
}

function extractRequiredEnvVars(schemaName) {
  const filePath = path.join(repoRoot, 'lib', 'env.ts')
  const content = fs.readFileSync(filePath, 'utf8')
  const regex = new RegExp(`const ${schemaName} = [^=]*?\\(([^]*?)\\)\\n`, 'm')
  const match = content.match(regex)
  if (!match) return []
  const block = match[1]
  const vars = block.match(/[A-Z0-9_]+/g) || []
  return Array.from(new Set(vars.filter((v) => v === v.toUpperCase() && v.includes('_'))))
}

function buildReads() {
  const fileCache = new Map()
  const rawOutputs = patterns.map((p) => ({ name: p.name, output: runRg(p.pattern) }))
  const outputs = rawOutputs.flatMap((p) => parseRgOutput(p.output))

  const reads = outputs.map((hit) => {
    const content = readFileCached(hit.file, fileCache)
    const envVar = extractEnvVar(hit.snippet)
    return {
      envVar,
      file: hit.file,
      line: hit.line,
      app: appScope(hit.file),
      runtime: runtimeScope(hit.file, content),
      access: accessType(hit.snippet),
      interpretation: interpretation(hit.snippet),
      snippet: hit.snippet.slice(0, 120),
    }
  })

  return { reads, rawOutputs }
}

function buildContract(reads) {
  const descMap = extractFeatureFlagDescriptions()
  const flagsFromEnvTs = extractEnvFlagsFromEnvTs()
  const flagsFromReads = Array.from(
    new Set(reads.map((r) => r.envVar).filter((v) => v && v !== 'ENV_OBJECT'))
  )
  const flags = Array.from(new Set([...flagsFromEnvTs, ...flagsFromReads])).sort()

  const byFlag = new Map()
  for (const flag of flags) {
    const entries = reads.filter((r) => r.envVar === flag)
    const scopes = Array.from(new Set(entries.map((e) => e.app))).sort()
    const runtimes = Array.from(new Set(entries.map((e) => e.runtime))).sort()
    const interpretations = Array.from(new Set(entries.map((e) => e.interpretation))).sort()
    const onlyDevTests = entries.length > 0 && entries.every((e) => isDevTestPath(e.file))
    const clientReadsServerOnly = entries.some((e) => e.runtime === 'client') && !flag.startsWith('NEXT_PUBLIC_')
    const multipleInterp = interpretations.length > 1

    let risk = 'LOW'
    if (multipleInterp || clientReadsServerOnly) {
      risk = 'HIGH'
    } else if (flag.startsWith('NEXT_PUBLIC_') && runtimes.includes('server') && !runtimes.includes('client')) {
      risk = 'HIGH'
    } else if (onlyDevTests) {
      risk = 'MED'
    }

    byFlag.set(flag, {
      description: descMap.get(flag) || '',
      scopes,
      runtimes,
      interpretations,
      risk,
      onlyDevTests,
    })
  }

  const inconsistencies = {
    multipleInterpretations: flags.filter((flag) => {
      const info = byFlag.get(flag)
      return info && info.interpretations.length > 1
    }),
    clientReadsNonPublic: flags.filter((flag) => {
      const info = byFlag.get(flag)
      return info && info.runtimes.includes('client') && !flag.startsWith('NEXT_PUBLIC_')
    }),
    devOnlyFlags: flags.filter((flag) => {
      const info = byFlag.get(flag)
      return info && info.onlyDevTests
    }),
    enabledTruthy: flags.filter((flag) => {
      if (!flag.endsWith('_ENABLED')) return false
      const info = byFlag.get(flag)
      return info && info.interpretations.includes('truthy')
    }),
  }

  return { flags, byFlag, inconsistencies }
}

function buildChecklist(reads) {
  const patientRequired = extractRequiredEnvVars('patientEnvSchema')
  const studioRequired = extractRequiredEnvVars('studioEnvSchema')
  const engineRequired = extractRequiredEnvVars('engineEnvSchema')

  const flagsByApp = (app) => {
    const entries = reads.filter((r) => r.app === app && r.envVar !== 'ENV_OBJECT')
    const nonTest = entries.filter((e) => !isDevTestPath(e.file))
    return Array.from(new Set(nonTest.map((e) => e.envVar))).sort()
  }

  return {
    patient: {
      required: patientRequired,
      flags: flagsByApp('patient'),
    },
    studio: {
      required: studioRequired,
      flags: flagsByApp('studio'),
    },
    legacy: {
      required: [],
      flags: flagsByApp('legacy'),
    },
    engine: {
      required: Array.from(new Set([...engineRequired, 'SUPABASE_SERVICE_ROLE_KEY'])),
      flags: flagsByApp('engine'),
    },
  }
}

function renderMarkdown(contract, checklist) {
  const lines = []
  lines.push('# Feature Flag Contract Matrix')
  lines.push('')
  lines.push('Generated by scripts/dev/flag-audit/scan.js')
  lines.push('')
  lines.push('## Single Source of Truth')
  lines.push('')
  lines.push('| Flag | Description | Scope | Runtime | Interpretation | Risk |')
  lines.push('| --- | --- | --- | --- | --- | --- |')
  for (const flag of contract.flags) {
    const info = contract.byFlag.get(flag)
    const scope = info ? info.scopes.join(', ') || 'unknown' : 'unknown'
    const runtime = info ? info.runtimes.join(', ') || 'unknown' : 'unknown'
    const interp = info ? info.interpretations.join(', ') || 'unknown' : 'unknown'
    const desc = info ? info.description : ''
    const risk = info ? info.risk : 'LOW'
    lines.push(`| ${flag} | ${desc} | ${scope} | ${runtime} | ${interp} | ${risk} |`)
  }

  lines.push('')
  lines.push('## Inconsistencies')
  lines.push('')
  lines.push(`- Flags with >1 interpretation: ${contract.inconsistencies.multipleInterpretations.join(', ') || 'none'}`)
  lines.push(`- Flags read in client code but not NEXT_PUBLIC_*: ${contract.inconsistencies.clientReadsNonPublic.join(', ') || 'none'}`)
  lines.push(`- Flags only referenced in dev/tests: ${contract.inconsistencies.devOnlyFlags.join(', ') || 'none'}`)
  lines.push(`- Flags ending in _ENABLED but used as truthy: ${contract.inconsistencies.enabledTruthy.join(', ') || 'none'}`)

  lines.push('')
  lines.push('## Recommended Standard')
  lines.push('')
  lines.push('- Helper: flagEnabled(value) accepts: \'1\', \'true\', \'yes\', \'on\'')
  lines.push('- Deployment value: \'1\'')
  lines.push('- Prefer helper usage over direct comparisons')

  lines.push('')
  lines.push('## Deployment Checklist')
  lines.push('')
  for (const [app, data] of Object.entries(checklist)) {
    lines.push(`### ${app}`)
    lines.push('')
    lines.push(`- Required env: ${data.required.length ? data.required.join(', ') : 'none specified'}`)
    if (app === 'engine') {
      lines.push('- Note: SUPABASE_SERVICE_ROLE_KEY required in prod server runtime')
    }
    lines.push(`- Feature flags expected: ${data.flags.length ? data.flags.join(', ') : 'none detected'}`)
    lines.push('')
  }

  return lines.join('\n')
}

function renderFixPlan(contract) {
  const hasIssues =
    contract.inconsistencies.multipleInterpretations.length ||
    contract.inconsistencies.clientReadsNonPublic.length ||
    contract.inconsistencies.devOnlyFlags.length ||
    contract.inconsistencies.enabledTruthy.length

  if (!hasIssues) {
    return null
  }

  const lines = []
  lines.push('# Feature Flag Fix Plan')
  lines.push('')
  lines.push('## Findings')
  lines.push('')
  lines.push(`- Multiple interpretations: ${contract.inconsistencies.multipleInterpretations.join(', ') || 'none'}`)
  lines.push(`- Client reads of non-public flags: ${contract.inconsistencies.clientReadsNonPublic.join(', ') || 'none'}`)
  lines.push(`- Dev/test-only flags: ${contract.inconsistencies.devOnlyFlags.join(', ') || 'none'}`)
  lines.push(`- _ENABLED truthy usage: ${contract.inconsistencies.enabledTruthy.join(', ') || 'none'}`)

  lines.push('')
  lines.push('## Actions')
  lines.push('')
  lines.push('- Change all flag checks to use a shared helper (flagEnabled).')
  lines.push('- Update env documentation to specify canonical values and scope.')
  lines.push('- Add CI check to fail on mixed interpretations or client reads of non-public flags.')

  return lines.join('\n')
}

function main() {
  const { reads, rawOutputs } = buildReads()

  const outJsonDir = path.dirname(outJsonPath)
  const outMdDir = path.dirname(outMdPath)
  fs.mkdirSync(outJsonDir, { recursive: true })
  fs.mkdirSync(outMdDir, { recursive: true })

  fs.writeFileSync(outJsonPath, JSON.stringify(reads, null, 2))

  for (const raw of rawOutputs) {
    const rawPath = path.join(path.dirname(outJsonPath), `rg-${raw.name}.txt`)
    fs.writeFileSync(rawPath, raw.output)
  }

  const contract = buildContract(reads)
  const checklist = buildChecklist(reads)
  fs.writeFileSync(outMdPath, renderMarkdown(contract, checklist))

  const plan = renderFixPlan(contract)
  if (plan) {
    fs.writeFileSync(outPlanPath, plan)
  }
}

main()
