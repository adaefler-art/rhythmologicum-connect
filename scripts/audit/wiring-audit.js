#!/usr/bin/env node

/**
 * V061-I05: Evidence-locked Wiring Audit
 * Scans codebase to map UI → API → DB connections
 * Generates machine-readable JSON + human-readable markdown
 */

const fs = require('fs')
const path = require('path')
const { execSync } = require('child_process')

const ROOT = path.join(__dirname, '../..')
const AUDIT_DIR = path.join(ROOT, '.audit/v061')
const EVIDENCE_DIR = path.join(AUDIT_DIR, 'evidence')

// Ensure directories exist
if (!fs.existsSync(AUDIT_DIR)) {
  fs.mkdirSync(AUDIT_DIR, { recursive: true })
}
if (!fs.existsSync(EVIDENCE_DIR)) {
  fs.mkdirSync(EVIDENCE_DIR, { recursive: true })
}

/**
 * Execute shell command and return output
 */
function exec(cmd, silent = false) {
  try {
    return execSync(cmd, { cwd: ROOT, encoding: 'utf-8', stdio: silent ? 'pipe' : 'inherit' })
  } catch (error) {
    if (!silent) console.error(`Command failed: ${cmd}`)
    return ''
  }
}

/**
 * Find all files matching pattern
 */
function findFiles(pattern, dirs = ['app', 'apps/rhythm-studio-ui', 'apps/rhythm-patient-ui']) {
  const files = []
  dirs.forEach((dir) => {
    const dirPath = path.join(ROOT, dir)
    if (!fs.existsSync(dirPath)) return

    const result = exec(`find ${dir} -name "${pattern}" -type f 2>/dev/null`, true)
    if (result) {
      files.push(...result.trim().split('\n').filter(Boolean))
    }
  })
  return files
}

/**
 * Extract API endpoints from route files
 */
function extractAPIEndpoint(filePath) {
  // Convert file path to API endpoint
  // e.g., app/api/funnels/[slug]/route.ts -> /api/funnels/[slug]
  const parts = filePath.split('/')
  const apiIndex = parts.indexOf('api')
  if (apiIndex === -1) return null

  const endpointParts = parts.slice(apiIndex)
  endpointParts.pop() // Remove route.ts

  return '/' + endpointParts.join('/')
}

/**
 * Extract page route from page file path
 */
function extractPageRoute(filePath) {
  // Convert file path to page route
  // e.g., app/patient/dashboard/page.tsx -> /patient/dashboard
  const parts = filePath.split('/')
  
  // Find the app directory index
  let appIndex = parts.indexOf('app')
  if (appIndex === -1) return null

  const routeParts = parts.slice(appIndex + 1)
  routeParts.pop() // Remove page.tsx

  if (routeParts.length === 0) return '/'
  return '/' + routeParts.join('/')
}

/**
 * Search for API calls in a file
 */
function findAPICallsInFile(filePath) {
  const content = fs.readFileSync(path.join(ROOT, filePath), 'utf-8')
  const apiCalls = new Set()

  // Pattern 1: fetch('/api/...')
  const fetchPattern = /fetch\s*\(\s*[`'"]([^`'"]+)[`'"]/g
  let match
  while ((match = fetchPattern.exec(content)) !== null) {
    if (match[1].startsWith('/api/') || match[1].startsWith('api/')) {
      apiCalls.add(match[1].replace(/^api\//, '/api/'))
    }
  }

  // Pattern 2: url = '/api/...'
  const urlPattern = /['"`]\/api\/[^'"`]+['"`]/g
  while ((match = urlPattern.exec(content)) !== null) {
    const url = match[0].replace(/['"`]/g, '')
    apiCalls.add(url)
  }

  // Pattern 3: Template literals with /api/
  const templatePattern = /`[^`]*\/api\/[^`]*`/g
  while ((match = templatePattern.exec(content)) !== null) {
    // Extract the static part before any ${
    const url = match[0].replace(/`/g, '').split('$')[0]
    if (url.startsWith('/api/')) {
      apiCalls.add(url)
    }
  }

  return Array.from(apiCalls)
}

/**
 * Check if API route accesses database
 */
function checkDatabaseAccess(filePath) {
  const content = fs.readFileSync(path.join(ROOT, filePath), 'utf-8')
  
  const dbPatterns = [
    /from\s+['"]@?\/lib\/db\/supabase\./,
    /from\s+['"]@?\/lib\/supabaseServer/,
    /from\s+['"]@?\/lib\/supabaseClient/,
    /createServerClient/,
    /createClient/,
    /\.from\s*\(\s*['"]/,
    /supabase\.from/,
  ]

  const dbAccess = {
    hasAccess: false,
    tables: new Set(),
    clientType: null,
  }

  for (const pattern of dbPatterns) {
    if (pattern.test(content)) {
      dbAccess.hasAccess = true
      break
    }
  }

  // Detect client type
  if (content.includes('supabase.server')) {
    dbAccess.clientType = 'server'
  } else if (content.includes('supabase.admin')) {
    dbAccess.clientType = 'admin'
  } else if (content.includes('supabase.public')) {
    dbAccess.clientType = 'public'
  }

  // Extract table names
  const tablePattern = /\.from\s*\(\s*['"]([^'"]+)['"]\s*\)/g
  let match
  while ((match = tablePattern.exec(content)) !== null) {
    dbAccess.tables.add(match[1])
  }

  dbAccess.tables = Array.from(dbAccess.tables)
  return dbAccess
}

/**
 * Main audit execution
 */
async function runAudit() {
  console.log('🔍 Starting V061-I05 Wiring Audit...\n')

  // Step 1: Collect all pages
  console.log('📄 Collecting UI pages...')
  const pageFiles = findFiles('page.tsx')
  const pages = pageFiles.map((file) => ({
    path: file,
    route: extractPageRoute(file),
    app: file.startsWith('apps/rhythm-studio-ui')
      ? 'studio-ui'
      : file.startsWith('apps/rhythm-patient-ui')
        ? 'patient-ui'
        : 'main',
  }))
  console.log(`   Found ${pages.length} pages\n`)

  // Step 2: Collect all API routes
  console.log('🔌 Collecting API routes...')
  const routeFiles = findFiles('route.ts')
  const apiRoutes = routeFiles.map((file) => ({
    path: file,
    endpoint: extractAPIEndpoint(file),
    app: file.startsWith('apps/rhythm-studio-ui')
      ? 'studio-ui'
      : file.startsWith('apps/rhythm-patient-ui')
        ? 'patient-ui'
        : 'main',
  }))
  console.log(`   Found ${apiRoutes.length} API routes\n`)

  // Step 3: Map UI → API calls
  console.log('🔗 Mapping UI → API connections...')
  const uiToAPI = []
  for (const page of pages) {
    const apiCalls = findAPICallsInFile(page.path)
    if (apiCalls.length > 0) {
      uiToAPI.push({
        page: page.path,
        pageRoute: page.route,
        apiCalls,
      })
    }
  }
  console.log(`   Found ${uiToAPI.length} pages with API calls\n`)

  // Step 4: Map API → DB access
  console.log('💾 Mapping API → Database connections...')
  const apiToDB = []
  for (const route of apiRoutes) {
    const dbAccess = checkDatabaseAccess(route.path)
    if (dbAccess.hasAccess) {
      apiToDB.push({
        apiPath: route.path,
        endpoint: route.endpoint,
        ...dbAccess,
      })
    }
  }
  console.log(`   Found ${apiToDB.length} API routes with DB access\n`)

  // Step 5: Identify orphans
  console.log('🔍 Identifying orphans...')
  
  // Orphaned APIs: API routes not called by any UI page
  const calledAPIs = new Set()
  uiToAPI.forEach((mapping) => {
    mapping.apiCalls.forEach((call) => {
      // Normalize the call (remove query params, extract base path)
      const basePath = call.split('?')[0].split('#')[0]
      calledAPIs.add(basePath)
    })
  })

  const orphanedAPIs = apiRoutes.filter((route) => {
    // Check if this API endpoint is called
    const endpoint = route.endpoint
    if (!endpoint) return false
    
    // Check exact match or dynamic route match
    for (const called of calledAPIs) {
      if (called === endpoint) return false
      // Handle dynamic routes [param]
      const endpointPattern = endpoint.replace(/\[([^\]]+)\]/g, '[^/]+')
      const regex = new RegExp(`^${endpointPattern}$`)
      if (regex.test(called)) return false
    }
    
    return true
  })

  // Orphaned Pages: Pages with no API calls
  const pagesWithoutAPI = pages.filter((page) => {
    return !uiToAPI.some((mapping) => mapping.page === page.path)
  })

  console.log(`   Found ${orphanedAPIs.length} orphaned API routes`)
  console.log(`   Found ${pagesWithoutAPI.length} pages without API calls\n`)

  // Step 6: Generate JSON report
  console.log('📝 Generating JSON report...')
  const jsonReport = {
    metadata: {
      generatedAt: new Date().toISOString(),
      version: 'v0.6.1',
      issueId: 'V061-I05',
    },
    summary: {
      totalPages: pages.length,
      totalAPIRoutes: apiRoutes.length,
      pagesWithAPICalls: uiToAPI.length,
      apiRoutesWithDBAccess: apiToDB.length,
      orphanedAPIs: orphanedAPIs.length,
      pagesWithoutAPICalls: pagesWithoutAPI.length,
    },
    pages,
    apiRoutes,
    mappings: {
      uiToAPI,
      apiToDB,
    },
    orphans: {
      apis: orphanedAPIs,
      pages: pagesWithoutAPI,
    },
  }

  const jsonPath = path.join(AUDIT_DIR, 'wiring-audit.json')
  fs.writeFileSync(jsonPath, JSON.stringify(jsonReport, null, 2))
  console.log(`   ✅ Saved to ${jsonPath}\n`)

  return jsonReport
}

// Execute audit
runAudit()
  .then(() => {
    console.log('✅ Audit complete!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Audit failed:', error)
    process.exit(1)
  })
