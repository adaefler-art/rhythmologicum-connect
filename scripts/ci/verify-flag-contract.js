const fs = require('fs')
const path = require('path')

const repoRoot = process.cwd()
const extensions = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs', '.cjs'])
const ignoreDirs = new Set([
  'node_modules',
  '.next',
  '.git',
  'dist',
  'build',
  'out',
  'coverage',
  'artifacts',
  'docs',
])

const flagInterpretations = new Map()
const clientNonPublicReads = []

function isFlagName(name) {
  return (
    name.startsWith('NEXT_PUBLIC_FEATURE_') ||
    name.startsWith('E73_') ||
    name.startsWith('DEV_') ||
    name.startsWith('PILOT_') ||
    name === 'USAGE_TELEMETRY_ENABLED' ||
    name.endsWith('_ENABLED')
  )
}

function addInterpretation(flag, interpretation, context) {
  if (!interpretation) return
  if (!flagInterpretations.has(flag)) {
    flagInterpretations.set(flag, new Map())
  }
  const set = flagInterpretations.get(flag)
  if (!set.has(interpretation)) {
    set.set(interpretation, [])
  }
  set.get(interpretation).push(context)
}

function getLineNumber(content, index) {
  return content.slice(0, index).split(/\r?\n/).length
}

function scanFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8')
  const relPath = path.relative(repoRoot, filePath).replace(/\\/g, '/')
  const head = content.split(/\r?\n/).slice(0, 10).join('\n')
  const isClient = /['\"]use client['\"]/i.test(head)

  const processEnvRegex = /process\.env\.([A-Z0-9_]+)/g
  const envRegex = /\benv\.([A-Z0-9_]+)/g

  const lines = content.split(/\r?\n/)

  lines.forEach((line, idx) => {
    const lineNumber = idx + 1

    for (const match of line.matchAll(processEnvRegex)) {
      const name = match[1]
      if (isClient && !name.startsWith('NEXT_PUBLIC_')) {
        clientNonPublicReads.push({
          file: relPath,
          line: lineNumber,
          envVar: name,
          snippet: line.trim().slice(0, 140),
        })
      }

      if (!isFlagName(name)) continue
      if (line.includes('flagEnabled(')) return

      let interpretation = null
      if (/===\s*['\"]1['\"]|!==\s*['\"]1['\"]/.test(line)) {
        interpretation = 'eq_1'
      } else if (/===\s*['\"]true['\"]|!==\s*['\"]true['\"]/.test(line)) {
        interpretation = 'eq_true'
      } else if (/Boolean\(|!!\s*process\.env\./.test(line)) {
        interpretation = 'truthy'
      }

      addInterpretation(name, interpretation, { file: relPath, line: lineNumber, snippet: line.trim() })
    }

    for (const match of line.matchAll(envRegex)) {
      const name = match[1]
      if (isClient && !name.startsWith('NEXT_PUBLIC_')) {
        clientNonPublicReads.push({
          file: relPath,
          line: lineNumber,
          envVar: name,
          snippet: line.trim().slice(0, 140),
        })
      }

      if (!isFlagName(name)) continue
      if (line.includes('flagEnabled(')) return

      let interpretation = null
      if (/===\s*['\"]1['\"]|!==\s*['\"]1['\"]/.test(line)) {
        interpretation = 'eq_1'
      } else if (/===\s*['\"]true['\"]|!==\s*['\"]true['\"]/.test(line)) {
        interpretation = 'eq_true'
      } else if (/Boolean\(|!!\s*env\./.test(line)) {
        interpretation = 'truthy'
      }

      addInterpretation(name, interpretation, { file: relPath, line: lineNumber, snippet: line.trim() })
    }
  })
}

function walk(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  for (const entry of entries) {
    if (entry.name.startsWith('.')) {
      if (entry.name !== '.github') {
        continue
      }
    }
    if (ignoreDirs.has(entry.name)) {
      continue
    }
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      walk(fullPath)
    } else if (extensions.has(path.extname(entry.name))) {
      scanFile(fullPath)
    }
  }
}

function reportAndExit() {
  const mixedInterpretations = []
  for (const [flag, interpretations] of flagInterpretations.entries()) {
    const kinds = Array.from(interpretations.keys())
    if (kinds.length > 1) {
      mixedInterpretations.push({ flag, kinds, occurrences: interpretations })
    }
  }

  let hasFailure = false

  if (mixedInterpretations.length > 0) {
    hasFailure = true
    console.error('❌ Mixed flag interpretations detected:')
    mixedInterpretations.forEach(({ flag, kinds, occurrences }) => {
      console.error(`- ${flag}: ${kinds.join(', ')}`)
      kinds.forEach((kind) => {
        const sample = occurrences.get(kind) || []
        sample.slice(0, 3).forEach((hit) => {
          console.error(`  - [${kind}] ${hit.file}:${hit.line} ${hit.snippet}`)
        })
      })
    })
  }

  if (clientNonPublicReads.length > 0) {
    hasFailure = true
    console.error('❌ Client files read non-public flags:')
    clientNonPublicReads.slice(0, 20).forEach((hit) => {
      console.error(`- ${hit.file}:${hit.line} ${hit.envVar} | ${hit.snippet}`)
    })
    if (clientNonPublicReads.length > 20) {
      console.error(`...and ${clientNonPublicReads.length - 20} more`)
    }
  }

  if (hasFailure) {
    process.exit(1)
  }

  console.log('✅ Flag contract verification passed.')
}

walk(repoRoot)
reportAndExit()
