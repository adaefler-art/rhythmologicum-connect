#!/usr/bin/env node
const fs = require('fs')
const path = require('path')

const REPO_ROOT = path.resolve(__dirname, '../..')

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

function routeToFile(appName, route) {
  const normalized = route.replace(/^\/api\//, '')
  const basePath = path.join(REPO_ROOT, 'apps', appName, 'app', 'api', normalized)
  const tsPath = path.join(basePath, 'route.ts')
  const tsxPath = path.join(basePath, 'route.tsx')
  if (fs.existsSync(tsPath)) return tsPath
  if (fs.existsSync(tsxPath)) return tsxPath
  return null
}

function main() {
  const missing = []

  for (const [appName, routes] of Object.entries(CRITICAL_ROUTES)) {
    for (const route of routes) {
      const file = routeToFile(appName, route)
      if (!file) {
        missing.push({ appName, route })
      }
    }
  }

  if (missing.length === 0) {
    console.log('✅ Critical API route handlers found for patient/studio apps.')
    process.exit(0)
  }

  console.error('❌ Missing critical API route handlers:')
  for (const entry of missing) {
    console.error(`- ${entry.appName}: ${entry.route}`)
  }
  process.exit(1)
}

main()
