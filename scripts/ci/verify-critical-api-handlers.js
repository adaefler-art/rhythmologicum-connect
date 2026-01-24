#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const REPO_ROOT = path.resolve(__dirname, '../..')
const EXCLUDE_DIRS = ['node_modules', '.next', 'build', 'out', 'dist', 'coverage', '.git']

const CRITICAL_ROUTES = {
  'rhythm-patient-ui': [
    '/api/auth/callback',
    '/api/auth/resolve-role',
    '/api/auth/signout',
    '/api/patient/onboarding-status',
    '/api/patient/dashboard',
    '/api/funnels/catalog',
    '/api/patient-measures/history',
    '/api/patient-measures/export',
    '/api/amy/triage',
    '/api/admin/navigation',
  ],
  'rhythm-studio-ui': [
    '/api/auth/callback',
    '/api/auth/resolve-role',
    '/api/auth/signout',
    '/api/admin/funnels',
    '/api/admin/funnels/[id]',
    '/api/admin/content-pages',
    '/api/admin/content-pages/[id]',
    '/api/admin/content-pages/[id]/sections',
    '/api/admin/content-pages/[id]/sections/[sectionId]',
    '/api/admin/funnel-versions/[id]',
    '/api/admin/funnel-versions/[id]/manifest',
    '/api/admin/funnel-steps/[id]',
    '/api/admin/funnel-step-questions/[id]',
    '/api/admin/design-tokens',
    '/api/admin/navigation',
    '/api/admin/navigation/[role]',
    '/api/admin/notification-templates',
    '/api/admin/notification-templates/[id]',
    '/api/admin/reassessment-rules',
    '/api/admin/reassessment-rules/[id]',
    '/api/admin/kpi-thresholds',
    '/api/admin/kpi-thresholds/[id]',
    '/api/admin/operational-settings-audit',
    '/api/admin/dev/endpoint-catalog',
    '/api/review/queue',
    '/api/review/[id]/details',
    '/api/review/[id]/decide',
    '/api/tasks',
    '/api/tasks/[id]',
    '/api/shipments',
    '/api/shipments/[id]',
    '/api/pre-screening-calls',
    '/api/support-cases',
    '/api/support-cases/[id]',
    '/api/support-cases/[id]/escalate',
    '/api/patient-profiles',
    '/api/processing/jobs/[jobId]/download',
  ],
}

const TEST_IMPORT_ALLOWLIST = []

function routeToFile(appName, route) {
  const normalized = route.replace(/^\/api\//, '')
  const basePath = path.join(REPO_ROOT, 'apps', appName, 'app', 'api', normalized)
  const tsPath = path.join(basePath, 'route.ts')
  const tsxPath = path.join(basePath, 'route.tsx')
  if (fs.existsSync(tsPath)) return tsPath
  if (fs.existsSync(tsxPath)) return tsxPath
  return null
}

function routeToExpectedPath(appName, route) {
  const normalized = route.replace(/^\/api\//, '')
  return path.join('apps', appName, 'app', 'api', normalized, 'route.ts')
}

function routeToRootApiPath(route) {
  const normalized = route.replace(/^\/api\//, '')
  const basePath = path.join(REPO_ROOT, 'app', 'api', normalized)
  const tsPath = path.join(basePath, 'route.ts')
  const tsxPath = path.join(basePath, 'route.tsx')
  if (fs.existsSync(tsPath)) return tsPath
  if (fs.existsSync(tsxPath)) return tsxPath
  return null
}

function routeToLegacyPath(route) {
  const normalized = route.replace(/^\/api\//, '')
  const basePath = path.join(REPO_ROOT, 'apps', 'rhythm-legacy', 'app', 'api', normalized)
  const tsPath = path.join(basePath, 'route.ts')
  const tsxPath = path.join(basePath, 'route.tsx')
  if (fs.existsSync(tsPath)) return tsPath
  if (fs.existsSync(tsxPath)) return tsxPath
  return null
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8')
  return JSON.parse(raw)
}

function shouldScan(filePath) {
  const parts = filePath.split(path.sep)
  if (parts.some((p) => EXCLUDE_DIRS.includes(p))) return false
  return filePath.endsWith('.ts') || filePath.endsWith('.tsx')
}

function listTestFiles(rootDir) {
  const results = []
  const entries = fs.readdirSync(rootDir, { withFileTypes: true })
  for (const entry of entries) {
    const fullPath = path.join(rootDir, entry.name)
    if (entry.isDirectory()) {
      if (EXCLUDE_DIRS.includes(entry.name)) continue
      results.push(...listTestFiles(fullPath))
    } else if (entry.isFile() && shouldScan(fullPath)) {
      if (
        fullPath.includes(`${path.sep}__tests__${path.sep}`) ||
        /\.(spec|test)\.(ts|tsx)$/.test(fullPath)
      ) {
        results.push(fullPath)
      }
    }
  }
  return results
}

function toRelative(filePath) {
  return path.relative(REPO_ROOT, filePath).split(path.sep).join('/')
}

function checkCriticalRoutes() {
  const missing = []
  const wrongTree = []
  const checked = []

  for (const [appName, routes] of Object.entries(CRITICAL_ROUTES)) {
    for (const route of routes) {
      const found = routeToFile(appName, route)
      const expected = routeToExpectedPath(appName, route)
      checked.push({ appName, route, expected, found })

      const rootMatch = routeToRootApiPath(route)
      if (rootMatch) {
        wrongTree.push({ appName, route, foundAt: toRelative(rootMatch) })
      }

      if (!found) {
        const legacyMatch = routeToLegacyPath(route)
        if (legacyMatch) {
          missing.push({ appName, route, hint: `Legacy exists at ${toRelative(legacyMatch)}` })
        } else {
          missing.push({ appName, route })
        }
      }
    }
  }

  return { missing, wrongTree, checked }
}

function checkVercelRoots() {
  const errors = []
  const patientConfigPath = path.join(REPO_ROOT, 'vercel.json')
  const studioConfigPath = path.join(REPO_ROOT, 'apps', 'rhythm-studio-ui', 'vercel.json')

  if (!fs.existsSync(patientConfigPath)) {
    errors.push('Expected patient vercel.json at repo root but file is missing.')
  } else {
    const patientConfig = readJson(patientConfigPath)
    const buildCommand = patientConfig.buildCommand || ''
    const outputDirectory = patientConfig.outputDirectory || ''
    if (!buildCommand.includes('build:patient')) {
      errors.push(
        `Expected patient buildCommand to include "build:patient" but found "${buildCommand}".`,
      )
    }
    if (!outputDirectory.includes('apps/rhythm-patient-ui/.next')) {
      errors.push(
        `Expected patient outputDirectory to be apps/rhythm-patient-ui/.next but found "${outputDirectory}".`,
      )
    }
  }

  if (!fs.existsSync(studioConfigPath)) {
    errors.push('Expected studio vercel.json at apps/rhythm-studio-ui/vercel.json but file is missing.')
  } else {
    const studioConfig = readJson(studioConfigPath)
    const buildCommand = studioConfig.buildCommand || ''
    const outputDirectory = studioConfig.outputDirectory || ''
    if (!buildCommand.includes('build:studio')) {
      errors.push(
        `Expected studio buildCommand to include "build:studio" but found "${buildCommand}".`,
      )
    }
    if (!outputDirectory.includes('rhythm-studio-ui/.next')) {
      errors.push(
        `Expected studio outputDirectory to be apps/rhythm-studio-ui/.next but found "${outputDirectory}".`,
      )
    }
  }

  return errors
}

function checkJestAlias() {
  const jestConfigPath = path.join(REPO_ROOT, 'jest.config.js')
  if (!fs.existsSync(jestConfigPath)) {
    return ['Expected jest.config.js at repo root but file is missing.']
  }

  const content = fs.readFileSync(jestConfigPath, 'utf-8')
  const aliasPattern = /\^@\/app\/api/
  const genericAliasPattern = /@\/app\/api/
  if (aliasPattern.test(content) || genericAliasPattern.test(content)) {
    return ['Jest alias for @/app/api is not allowed. Remove generic app/api mapping.']
  }
  return []
}

function checkTestImports() {
  const files = listTestFiles(REPO_ROOT)
  const violations = []
  const importPattern = /from\s+['"]([^'"]+)['"]/g
  const requirePattern = /require\(\s*['"]([^'"]+)['"]\s*\)/g
  const forbiddenPrefixes = [
    '@/app/api/',
    'app/api/',
    '../app/api/',
    '../../app/api/',
    '../../../app/api/',
    '../../../../app/api/',
  ]

  for (const file of files) {
    const relative = toRelative(file)
    if (TEST_IMPORT_ALLOWLIST.includes(relative)) continue
    const content = fs.readFileSync(file, 'utf-8')
    const matches = []
    let match
    while ((match = importPattern.exec(content))) {
      matches.push(match[1])
    }
    while ((match = requirePattern.exec(content))) {
      matches.push(match[1])
    }
    const forbidden = matches.filter((value) =>
      forbiddenPrefixes.some((prefix) => value.startsWith(prefix)),
    )
    if (forbidden.length > 0) {
      violations.push({ file: relative, imports: forbidden })
    }
  }

  return violations
}

function main() {
  const errors = []

  const { missing, wrongTree, checked } = checkCriticalRoutes()
  console.log('Checked critical API handler paths:')
  for (const entry of checked) {
    const status = entry.found ? 'OK' : 'MISSING'
    console.log(`- ${entry.appName} ${entry.route} -> ${entry.expected} [${status}]`)
  }

  if (wrongTree.length > 0) {
    errors.push('Critical handlers found in wrong tree (expected app-specific path).')
  }

  if (missing.length > 0) {
    errors.push('Critical API route handlers are missing.')
  }

  const vercelErrors = checkVercelRoots()
  if (vercelErrors.length > 0) {
    errors.push(...vercelErrors)
  }

  const jestErrors = checkJestAlias()
  if (jestErrors.length > 0) {
    errors.push(...jestErrors)
  }

  const importViolations = checkTestImports()

  if (errors.length === 0 && missing.length === 0 && wrongTree.length === 0 && importViolations.length === 0) {
    console.log('No forbidden test imports found.')
    console.log('✅ Guardrails passed: critical API handlers, Vercel roots, Jest alias, test imports.')
    process.exit(0)
  }

  console.error('❌ Guardrails failed:')
  for (const message of errors) {
    console.error(`- ${message}`)
  }

  if (wrongTree.length > 0) {
    console.error('Wrong-tree handler locations:')
    for (const entry of wrongTree) {
      console.error(`- ${entry.appName}: ${entry.route} found at ${entry.foundAt}`)
    }
  }

  if (missing.length > 0) {
    console.error('Missing handler files:')
    for (const entry of missing) {
      const hint = entry.hint ? ` (${entry.hint})` : ''
      console.error(`- ${entry.appName}: ${entry.route}${hint}`)
    }
  }

  if (importViolations.length > 0) {
    console.error('Forbidden test imports of app/api handlers:')
    for (const entry of importViolations) {
      console.error(`- ${entry.file}: ${entry.imports.join(', ')}`)
    }
  } else {
    console.log('No forbidden test imports found.')
  }

  process.exit(1)
}

main()
