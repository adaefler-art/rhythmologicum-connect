#!/usr/bin/env node
/**
 * E76.9: Endpoint Wiring Verification Script
 * 
 * Verifies R-E76.9-001: API endpoints have literal callsites
 * 
 * Strategy A — Vertical Slice Requirements:
 * - Endpoint changes require at least one literal callsite in same PR
 * - If feature not live: gate callsite behind feature flag (but keep literal string)
 * - External-only endpoints: allowlist entry with justification
 * 
 * Usage: node scripts/ci/verify-endpoint-wiring.mjs
 * Exit codes:
 *   0 - All guardrails satisfied
 *   1 - Violations found
 *   2 - Script error
 */

import { readFileSync, existsSync, readdirSync, statSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const REPO_ROOT = join(__dirname, '..', '..')

// Rule definition for E76.9-001
const RULE_E76_9_001 = {
  id: 'R-E76.9-001',
  description: 'API endpoints must have literal callsites or be allowlisted',
  errorCode: 'ORPHAN_ENDPOINT',
}

const violations = []

function reportViolation(errorCode, details) {
  violations.push({
    ruleId: RULE_E76_9_001.id,
    errorCode,
    details,
    message: `[${errorCode}] violates ${RULE_E76_9_001.id}: ${details}`,
  })
}

/**
 * Find all API route files in apps
 */
function findAPIRoutes(baseDir) {
  const routes = []
  
  function traverse(dir, basePath = '') {
    try {
      const entries = readdirSync(dir)
      
      for (const entry of entries) {
        const fullPath = join(dir, entry)
        const stat = statSync(fullPath)
        
        if (stat.isDirectory()) {
          traverse(fullPath, basePath + '/' + entry)
        } else if (entry === 'route.ts' || entry === 'route.tsx') {
          // Extract API path from directory structure
          // Example: apps/rhythm-studio-ui/app/api/mcp/route.ts -> /api/mcp
          const apiPath = basePath.replace(/^\/app/, '')
          if (apiPath.startsWith('/api/')) {
            routes.push(apiPath)
          }
        }
      }
    } catch (error) {
      // Directory might not exist, skip
    }
  }
  
  traverse(join(baseDir, 'app'))
  return routes
}

/**
 * Find all literal callsites for API paths
 */
function findLiteralCallsites(baseDir) {
  const callsites = new Set()
  
  // Regex to find fetch('/api/...') or fetch("/api/...")
  const fetchRegex = /['"]\/api\/[^'"]+['"]/g
  
  function traverse(dir) {
    try {
      const entries = readdirSync(dir)
      
      for (const entry of entries) {
        const fullPath = join(dir, entry)
        
        // Skip node_modules, .next, dist, etc.
        if (entry === 'node_modules' || entry === '.next' || entry === 'dist' || entry === '.git') {
          continue
        }
        
        const stat = statSync(fullPath)
        
        if (stat.isDirectory()) {
          traverse(fullPath)
        } else if (entry.endsWith('.ts') || entry.endsWith('.tsx') || entry.endsWith('.js') || entry.endsWith('.jsx')) {
          try {
            const content = readFileSync(fullPath, 'utf8')
            const matches = content.match(fetchRegex)
            
            if (matches) {
              matches.forEach(match => {
                // Remove quotes
                const path = match.replace(/['"]/g, '')
                callsites.add(path)
              })
            }
          } catch (error) {
            // Skip files that can't be read
          }
        }
      }
    } catch (error) {
      // Directory might not exist, skip
    }
  }
  
  traverse(baseDir)
  return callsites
}

/**
 * Load endpoint allowlist
 */
function loadAllowlist() {
  const allowlistPath = join(REPO_ROOT, 'docs', 'api', 'endpoint-allowlist.json')
  
  if (!existsSync(allowlistPath)) {
    console.warn('⚠️  Allowlist not found:', allowlistPath)
    return { allowedOrphans: [] }
  }
  
  try {
    const content = readFileSync(allowlistPath, 'utf8')
    const allowlist = JSON.parse(content)
    return allowlist
  } catch (error) {
    console.warn('⚠️  Failed to parse allowlist:', error.message)
    return { allowedOrphans: [] }
  }
}

/**
 * Main verification logic
 */
function main() {
  console.log('E76.9 Endpoint Wiring Verification (R-E76.9-001)\n')
  
  // Find all apps
  const appsDir = join(REPO_ROOT, 'apps')
  const apps = ['rhythm-studio-ui', 'rhythm-patient-ui', 'rhythm-engine']
  
  // Collect all API routes
  let allRoutes = []
  for (const app of apps) {
    const appDir = join(appsDir, app)
    if (existsSync(appDir)) {
      const routes = findAPIRoutes(appDir)
      console.log(`Found ${routes.length} API routes in ${app}`)
      allRoutes = allRoutes.concat(routes)
    }
  }
  
  console.log(`\nTotal API routes found: ${allRoutes.length}`)
  
  // Find all literal callsites
  console.log('\nSearching for literal callsites...')
  let allCallsites = new Set()
  
  for (const app of apps) {
    const appDir = join(appsDir, app)
    if (existsSync(appDir)) {
      const callsites = findLiteralCallsites(appDir)
      console.log(`Found ${callsites.size} literal callsites in ${app}`)
      callsites.forEach(site => allCallsites.add(site))
    }
  }
  
  // Also search in legacy and lib directories
  const otherDirs = [
    join(REPO_ROOT, 'legacy'),
    join(REPO_ROOT, 'lib'),
  ]
  
  for (const dir of otherDirs) {
    if (existsSync(dir)) {
      const callsites = findLiteralCallsites(dir)
      if (callsites.size > 0) {
        console.log(`Found ${callsites.size} literal callsites in ${dir}`)
        callsites.forEach(site => allCallsites.add(site))
      }
    }
  }
  
  console.log(`\nTotal literal callsites found: ${allCallsites.size}`)
  
  // Load allowlist
  const allowlist = loadAllowlist()
  const allowedOrphans = new Set(allowlist.allowedOrphans || [])
  console.log(`\nAllowlisted orphan endpoints: ${allowedOrphans.size}`)
  
  // Check each route
  console.log('\nVerifying endpoints...')
  
  for (const route of allRoutes) {
    const hasCallsite = allCallsites.has(route)
    const isAllowlisted = allowedOrphans.has(route)
    
    if (!hasCallsite && !isAllowlisted) {
      reportViolation('ORPHAN_ENDPOINT', `${route} has no literal callsite and is not allowlisted`)
    }
  }
  
  // Report results
  if (violations.length === 0) {
    console.log('\n✅ All R-E76.9-001 guardrails satisfied')
    console.log(`\nVerified ${allRoutes.length} endpoints:`)
    console.log(`  - ${allCallsites.size} have literal callsites`)
    console.log(`  - ${allowedOrphans.size} are allowlisted`)
    console.log('\n  ✓ R-E76.9-001: API endpoints have literal callsites or are allowlisted')
    process.exit(0)
  } else {
    console.log('\n❌ R-E76.9-001 guardrails violations found:\n')
    violations.forEach((v) => {
      console.log(v.message)
    })
    console.log(`\n${violations.length} orphan endpoint(s) found`)
    console.log('\nTo fix:')
    console.log('1. Add a literal callsite: fetch(\'/api/your-route\')')
    console.log('2. OR add to allowlist: docs/api/endpoint-allowlist.json')
    console.log('3. If gated by feature flag, callsite must still have literal string')
    process.exit(1)
  }
}

main()
