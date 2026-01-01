#!/usr/bin/env node
/**
 * DB Access Pattern Verification Script
 * 
 * Verifies that all database access follows canonical patterns.
 * Runs as part of CI pipeline to enforce guardrails.
 * 
 * Exit codes:
 * - 0: All checks passed
 * - 1: Violations found
 * 
 * Usage: node scripts/db/verify-db-access.js
 *        node scripts/db/verify-db-access.js --files <file1> <file2> ...
 */

const fs = require('fs')
const path = require('path')

const REPO_ROOT = path.resolve(__dirname, '../..')
const EXCLUDE_DIRS = ['node_modules', '.next', 'build', 'out', '.git', 'dist']

// Files that are allowed to directly use createClient/createServerClient
const ALLOWED_DIRECT_USAGE = [
  'lib/db/supabase.public.ts',
  'lib/db/supabase.server.ts',
  'lib/db/supabase.admin.ts',
  'lib/audit/log.ts',
  'lib/utils/contentResolver.ts',
  'lib/funnels/loadFunnelVersion.ts', // Legacy, to be refactored
  'proxy.ts', // Middleware requires special cookie handling
  'app/api/auth/callback/route.ts', // Auth callback needs custom cookie manipulation
]

// Files that are allowed to import admin client
const ALLOWED_ADMIN_USAGE = [
  // API routes
  'app/api/admin/',
  'app/api/funnels/catalog/',
  'app/api/funnels/',  // Includes funnel-related routes like [slug]/content-pages
  'app/api/content-pages/',
  'app/api/amy/stress-report/',
  'app/api/patient-measures/',
  // Lib modules that need it
  'lib/audit/log.ts',
  'lib/utils/contentResolver.ts',
  'lib/funnels/loadFunnelVersion.ts', // Legacy, to be refactored
]

const violations = []

function parseArgs(argv) {
  const args = argv.slice(2)
  const filesIndex = args.indexOf('--files')
  if (filesIndex === -1) return { files: null }
  const files = args.slice(filesIndex + 1).filter(Boolean)
  return { files: files.length > 0 ? files : [] }
}

function shouldScanFile(filePath) {
  const parts = filePath.split(path.sep)
  if (parts.some(p => EXCLUDE_DIRS.includes(p))) {
    return false
  }
  const ext = path.extname(filePath)
  return ext === '.ts' || ext === '.tsx'
}

function scanDirectory(dir) {
  const files = []
  try {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (!EXCLUDE_DIRS.includes(entry.name)) {
          files.push(...scanDirectory(fullPath))
        }
      } else if (entry.isFile() && shouldScanFile(fullPath)) {
        files.push(fullPath)
      }
    }
  } catch (err) {
    console.error(`Error scanning ${dir}:`, err.message)
  }
  return files
}

function isAllowedFile(filePath, allowedList) {
  const relativePath = path.relative(REPO_ROOT, filePath).split(path.sep).join('/')
  return allowedList.some(allowed => {
    if (allowed.endsWith('/')) {
      return relativePath.startsWith(allowed)
    }
    return relativePath === allowed
  })
}

function checkFile(filePath) {
  const relativePath = path.relative(REPO_ROOT, filePath).split(path.sep).join('/')
  const content = fs.readFileSync(filePath, 'utf-8')
  const lines = content.split('\n')

  // Check for direct createClient usage
  if (
    (content.includes("from '@supabase/supabase-js'") ||
     content.includes('from "@supabase/supabase-js"')) &&
    content.match(/createClient\s*\(/)
  ) {
    if (!isAllowedFile(filePath, ALLOWED_DIRECT_USAGE)) {
      violations.push({
        file: relativePath,
        rule: 'DIRECT_CREATE_CLIENT',
        message: 'Direct createClient usage detected. Use canonical factories from @/lib/db/supabase.*',
      })
    }
  }

  // Check for direct createServerClient usage
  if (
    (content.includes("from '@supabase/ssr'") ||
     content.includes('from "@supabase/ssr"')) &&
    content.match(/createServerClient\s*\(/)
  ) {
    if (!isAllowedFile(filePath, ALLOWED_DIRECT_USAGE)) {
      violations.push({
        file: relativePath,
        rule: 'DIRECT_CREATE_SERVER_CLIENT',
        message: 'Direct createServerClient usage detected. Use createServerSupabaseClient from @/lib/db/supabase.server',
      })
    }
  }

  // Check for admin client usage in restricted locations
  if (
    content.includes("from '@/lib/db/supabase.admin'") ||
    content.includes('from "@/lib/db/supabase.admin"')
  ) {
    if (!isAllowedFile(filePath, ALLOWED_ADMIN_USAGE)) {
      violations.push({
        file: relativePath,
        rule: 'RESTRICTED_ADMIN_CLIENT',
        message: 'Admin client usage restricted to API routes and documented lib modules. Document justification.',
      })
    }
  }

  // Check for direct service role key access
  if (content.includes('SUPABASE_SERVICE_ROLE_KEY') || content.includes('SUPABASE_SERVICE_KEY')) {
    if (!isAllowedFile(filePath, [
      'lib/env.ts',
      'lib/db/supabase.admin.ts',
      'lib/audit/log.ts',
      'lib/utils/contentResolver.ts',
      'lib/funnels/loadFunnelVersion.ts',
      'app/api/admin/funnels/__tests__/route.test.ts',
      'lib/__tests__/env.test.ts',
    ])) {
      violations.push({
        file: relativePath,
        rule: 'DIRECT_SERVICE_KEY_ACCESS',
        message: 'Direct service role key access detected. Use createAdminSupabaseClient from @/lib/db/supabase.admin',
      })
    }
  }
}

function main() {
  console.log('🔍 Verifying DB access patterns...\n')

  const { files: providedFiles } = parseArgs(process.argv)

  const files =
    providedFiles === null
      ? scanDirectory(REPO_ROOT)
      : providedFiles
          .map((f) => path.resolve(REPO_ROOT, f))
          .filter((f) => fs.existsSync(f) && shouldScanFile(f))

  console.log(`Scanning ${files.length} files...\n`)

  for (const file of files) {
    checkFile(file)
  }

  if (violations.length === 0) {
    console.log('✅ All DB access pattern checks passed!')
    console.log('\nNo violations found. All database access follows canonical patterns.\n')
    process.exit(0)
  } else {
    console.log('❌ DB access pattern violations found:\n')
    
    const byRule = new Map()
    for (const violation of violations) {
      if (!byRule.has(violation.rule)) {
        byRule.set(violation.rule, [])
      }
      byRule.get(violation.rule).push(violation)
    }

    for (const [rule, viols] of byRule) {
      console.log(`\n${rule} (${viols.length} violations):`)
      for (const v of viols) {
        console.log(`  - ${v.file}`)
        console.log(`    ${v.message}`)
      }
    }

    console.log(`\n\nTotal violations: ${violations.length}`)
    console.log('\nPlease fix these violations before merging.')
    console.log('See docs/canon/DB_ACCESS_DECISION.md for guidance.\n')
    
    process.exit(1)
  }
}

main()
