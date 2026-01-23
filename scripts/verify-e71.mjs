#!/usr/bin/env node

/**
 * E71 Guardrail Verification
 *
 * - Enforces v2-only mobile patient surface
 * - Verifies canonical route presence
 * - Prevents legacy redirects in /patient/assess
 * - Ensures legacy route folders do not reappear
 * - Validates version identity app names for patient/studio
 */

import { readFileSync, readdirSync, statSync, existsSync } from 'fs'
import { dirname, join, relative } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = join(__dirname, '..')

const MOBILE_DIR = join(
  ROOT,
  'apps',
  'rhythm-patient-ui',
  'app',
  'patient',
  '(mobile)',
)

const LEGACY_DIRS = ['assessment', 'funnels', 'funnel', 'escalation', 'support']

const CANONICAL_FLOW = join(
  MOBILE_DIR,
  'assess',
  '[id]',
  'flow',
  'page.tsx',
)

const ASSESS_PAGE = join(MOBILE_DIR, 'assess', 'page.tsx')

const VERSION_TARGETS = [
  {
    app: 'rhythm-patient-ui',
    packageJson: join(ROOT, 'apps', 'rhythm-patient-ui', 'package.json'),
    versionJson: join(ROOT, 'apps', 'rhythm-patient-ui', 'public', 'version.json'),
  },
  {
    app: 'rhythm-studio-ui',
    packageJson: join(ROOT, 'apps', 'rhythm-studio-ui', 'package.json'),
    versionJson: join(ROOT, 'apps', 'rhythm-studio-ui', 'public', 'version.json'),
  },
]

const SHARED_UI_IMPORT_TARGETS = [
  join(ROOT, 'apps', 'rhythm-studio-ui'),
  join(ROOT, 'apps', 'rhythm-patient-ui'),
]

const MOBILE_EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.mjs', '.jsx'])
const CSS_EXPECTED_PATTERNS = [
  /w-\\\[280px\\\]/,
  /grid-cols-\\\[280px_minmax\\\(0\\,1fr\\\)\\\]/,
]
const CSS_SCAN_DIRS = [
  join(ROOT, '.next', 'static', 'css'),
  join(ROOT, '.next', 'static', 'chunks'),
  join(ROOT, 'apps', 'rhythm-studio-ui', '.next', 'static', 'css'),
  join(ROOT, 'apps', 'rhythm-studio-ui', '.next', 'static', 'chunks'),
  join(ROOT, 'apps', 'rhythm-patient-ui', '.next', 'static', 'css'),
  join(ROOT, 'apps', 'rhythm-patient-ui', '.next', 'static', 'chunks'),
]

const failures = []

function recordFailure(message) {
  failures.push(message)
}

function walkFiles(dir) {
  const entries = readdirSync(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkFiles(fullPath))
      continue
    }

    const ext = entry.name.slice(entry.name.lastIndexOf('.'))
    if (MOBILE_EXTENSIONS.has(ext)) {
      files.push(fullPath)
    }
  }

  return files
}

function walkCssFiles(dir) {
  if (!existsSync(dir)) {
    return []
  }

  const entries = readdirSync(dir, { withFileTypes: true })
  const files = []

  for (const entry of entries) {
    const fullPath = join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...walkCssFiles(fullPath))
      continue
    }

    if (entry.name.endsWith('.css')) {
      files.push(fullPath)
    }
  }

  return files
}

function checkSharedUiCssUtilities() {
  const cssFiles = CSS_SCAN_DIRS.flatMap((dir) => walkCssFiles(dir))

  if (cssFiles.length === 0) {
    recordFailure(
      `E71: No CSS files found in ${CSS_SCAN_DIRS.map((dir) => relative(ROOT, dir)).join(', ')}.`,
    )
    return
  }

  const missingPatterns = new Set(CSS_EXPECTED_PATTERNS)

  for (const file of cssFiles) {
    const content = readFileSync(file, 'utf8')
    for (const pattern of CSS_EXPECTED_PATTERNS) {
      if (missingPatterns.has(pattern) && pattern.test(content)) {
        missingPatterns.delete(pattern)
      }
    }

    if (missingPatterns.size === 0) {
      break
    }
  }

  if (missingPatterns.size > 0) {
    recordFailure(
      [
        'E71: Shared UI Tailwind utilities missing from built CSS.',
        `Searched: ${CSS_SCAN_DIRS.map((dir) => relative(ROOT, dir)).join(', ')}`,
        ...Array.from(missingPatterns).map((pattern) => `  - Missing ${pattern}`),
      ].join('\n'),
    )
  }
}

function checkMobileSurface() {
  if (!existsSync(MOBILE_DIR)) {
    recordFailure(`E71: Mobile route group missing at ${relative(ROOT, MOBILE_DIR)}`)
    return
  }

  const files = walkFiles(MOBILE_DIR)
  const mobileHeaderHits = []
  const legacyUiHits = []

  for (const file of files) {
    const rel = relative(ROOT, file)
    const content = readFileSync(file, 'utf8')
    const lines = content.split(/\r?\n/)

    lines.forEach((line, index) => {
      const lineNumber = index + 1

      if (line.includes('MobileHeader')) {
        mobileHeaderHits.push(`${rel}:${lineNumber} → ${line.trim()}`)
      }

      if (line.includes("'@/lib/ui'") || line.includes('"@/lib/ui"')) {
        if (!line.includes('@/lib/ui/mobile-v2')) {
          legacyUiHits.push(`${rel}:${lineNumber} → ${line.trim()}`)
        }
      }
    })
  }

  if (mobileHeaderHits.length > 0) {
    recordFailure(
      [
        'E71: MobileHeader usage found in mobile surface (v2-only policy).',
        ...mobileHeaderHits.map((hit) => `  - ${hit}`),
      ].join('\n'),
    )
  }

  if (legacyUiHits.length > 0) {
    recordFailure(
      [
        'E71: Legacy "@/lib/ui" import found in mobile surface (use "@/lib/ui/mobile-v2" only).',
        ...legacyUiHits.map((hit) => `  - ${hit}`),
      ].join('\n'),
    )
  }
}

function checkCanonicalRoute() {
  if (!existsSync(CANONICAL_FLOW)) {
    recordFailure(
      `E71: Missing canonical v2 flow route at ${relative(ROOT, CANONICAL_FLOW)}.`,
    )
  }
}

function checkAssessPage() {
  if (!existsSync(ASSESS_PAGE)) {
    recordFailure(`E71: Missing /patient/assess page at ${relative(ROOT, ASSESS_PAGE)}.`)
    return
  }

  const content = readFileSync(ASSESS_PAGE, 'utf8')
  if (content.includes('redirect(')) {
    recordFailure(
      `E71: /patient/assess must not be redirect-only. Found redirect() in ${relative(
        ROOT,
        ASSESS_PAGE,
      )}.`,
    )
  }
}

function checkLegacyDirs() {
  for (const dir of LEGACY_DIRS) {
    const target = join(MOBILE_DIR, dir)
    if (existsSync(target)) {
      recordFailure(
        `E71: Legacy folder "${dir}" must not exist under mobile surface: ${relative(
          ROOT,
          target,
        )}`,
      )
    }
  }
}

function loadJson(filePath) {
  try {
    return JSON.parse(readFileSync(filePath, 'utf8'))
  } catch {
    return null
  }
}

function checkVersionIdentity() {
  for (const target of VERSION_TARGETS) {
    const pkg = loadJson(target.packageJson)
    const prebuild = pkg?.scripts?.prebuild || ''

    if (!prebuild.includes(`--app ${target.app}`)) {
      recordFailure(
        `E71: ${target.app} prebuild must specify "--app ${target.app}" to avoid engine version drift.`,
      )
    }

    if (existsSync(target.versionJson)) {
      const versionData = loadJson(target.versionJson)
      if (versionData?.app === 'engine') {
        recordFailure(
          `E71: ${relative(
            ROOT,
            target.versionJson,
          )} reports app:"engine". Expected app:"${target.app}".`,
        )
      }
    }
  }
}

function checkSharedUiImports() {
  const violations = []

  for (const targetDir of SHARED_UI_IMPORT_TARGETS) {
    if (!existsSync(targetDir)) {
      continue
    }

    const files = walkFiles(targetDir)

    for (const file of files) {
      const rel = relative(ROOT, file)
      const content = readFileSync(file, 'utf8')
      const lines = content.split(/\r?\n/)

      lines.forEach((line, index) => {
        const lineNumber = index + 1
        if (line.includes('DesktopLayout') && (line.includes("'@/lib/ui'") || line.includes('"@/lib/ui"'))) {
          violations.push(`${rel}:${lineNumber} → ${line.trim()}`)
        }
      })
    }
  }

  if (violations.length > 0) {
    recordFailure(
      [
        'E71: DesktopLayout must be imported from @rhythm/ui in studio/patient apps.',
        ...violations.map((hit) => `  - ${hit}`),
      ].join('\n'),
    )
  }
}

function run() {
  checkMobileSurface()
  checkCanonicalRoute()
  checkAssessPage()
  checkLegacyDirs()
  checkVersionIdentity()
  checkSharedUiImports()
  checkSharedUiCssUtilities()

  if (failures.length > 0) {
    console.error('❌ E71 verification failed:\n')
    failures.forEach((failure) => {
      console.error(failure)
      console.error('')
    })
    process.exit(1)
  }

  console.log('✅ E71 verification passed.')
}

run()
