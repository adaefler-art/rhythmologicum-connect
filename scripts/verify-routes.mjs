#!/usr/bin/env node

/**
 * Build Route Verification Script
 * 
 * Verifies that critical API routes exist in the Next.js build output.
 * This helps catch build issues before deployment to production.
 * 
 * Usage:
 *   node scripts/verify-routes.mjs
 * 
 * Exit codes:
 *   0 - All critical routes found
 *   1 - One or more critical routes missing
 */

import { existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Define critical routes that must exist in the build
const CRITICAL_ROUTES = [
  {
    path: '.next/server/app/api/content/resolve/route.js',
    name: 'GET /api/content/resolve',
    description: 'Content resolver API for fetching content pages by funnel/category',
  },
  {
    path: '.next/server/app/api/funnels/[slug]/content-pages/route.js',
    name: 'GET /api/funnels/[slug]/content-pages',
    description: 'Funnel content pages listing API',
  },
  {
    path: '.next/server/app/api/funnels/[slug]/assessments/route.js',
    name: 'POST /api/funnels/[slug]/assessments',
    description: 'Assessment creation API for funnel runtime',
  },
  {
    path: '.next/server/app/api/assessment-answers/save/route.js',
    name: 'POST /api/assessment-answers/save',
    description: 'Assessment answers saving API',
  },
  {
    path: 'public/version.json',
    name: 'version.json',
    description: 'Deployment version information',
  },
]

function verifyRoutes() {
  const projectRoot = join(__dirname, '..')
  const results = []
  let allFound = true

  console.log('🔍 Verifying critical API routes in build output...\n')

  for (const route of CRITICAL_ROUTES) {
    const fullPath = join(projectRoot, route.path)
    const exists = existsSync(fullPath)

    results.push({
      ...route,
      exists,
      fullPath,
    })

    if (!exists) {
      allFound = false
    }
  }

  // Print results
  console.log('Results:')
  console.log('═══════════════════════════════════════════════════════════════\n')

  for (const result of results) {
    const icon = result.exists ? '✅' : '❌'
    const status = result.exists ? 'FOUND' : 'MISSING'

    console.log(`${icon} ${status}: ${result.name}`)
    console.log(`   ${result.description}`)

    if (!result.exists) {
      console.log(`   Expected: ${result.path}`)
    }

    console.log('')
  }

  // Summary
  const foundCount = results.filter((r) => r.exists).length
  const totalCount = results.length

  console.log('═══════════════════════════════════════════════════════════════')
  console.log(`\n📊 Summary: ${foundCount}/${totalCount} critical routes verified\n`)

  if (allFound) {
    console.log('✅ All critical routes verified successfully!')
    console.log('   The build output includes all expected API routes.')
    return 0
  } else {
    console.error('❌ Build verification failed!')
    console.error('   One or more critical routes are missing from the build.')
    console.error('\n💡 Troubleshooting:')
    console.error('   1. Ensure all route files exist in the source code')
    console.error('   2. Check for TypeScript compilation errors')
    console.error('   3. Verify Next.js build completed successfully')
    console.error('   4. Run: npm run build')
    return 1
  }
}

// Run verification
const exitCode = verifyRoutes()
process.exit(exitCode)
