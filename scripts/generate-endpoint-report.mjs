#!/usr/bin/env node

import { execSync } from 'child_process'
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync } from 'fs'
import { dirname, join, relative } from 'path'
import { fileURLToPath } from 'url'
import { createRequire } from 'module'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const repoRoot = join(__dirname, '..')
const require = createRequire(import.meta.url)

const endpointCatalogPath = join(repoRoot, 'docs', 'api', 'endpoint-catalog.json')
const unknownCallsitesPath = join(repoRoot, 'docs', 'api', 'UNKNOWN_CALLSITES.md')
const orphanEndpointsPath = join(repoRoot, 'docs', 'api', 'ORPHAN_ENDPOINTS.md')
const unknownAccessPath = join(repoRoot, 'docs', 'api', 'UNKNOWN_ACCESS_ENDPOINTS.md')
const outputPath = join(repoRoot, 'docs', 'api', 'ENDPOINT_INVENTORY.md')

const toPosix = (value) => value.replace(/\\/g, '/')
const toRel = (value) => toPosix(relative(repoRoot, value))

const renderTable = (rows, headers) => {
  const lines = []
  lines.push(`| ${headers.join(' | ')} |`)
  lines.push(`| ${headers.map(() => '---').join(' | ')} |`)
  for (const row of rows) {
    lines.push(`| ${row.map((cell) => String(cell).replace(/\|/g, '\\|')).join(' | ')} |`)
  }
  return lines.join('\n')
}

const listFiles = (dir, pattern) => {
  const out = []
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name)
      if (entry.isDirectory()) {
        if (['.git', 'node_modules', '.next', 'dist', 'build', '.turbo', 'out', '.vercel'].includes(entry.name)) {
          continue
        }
        walk(full)
      } else if (pattern.test(full)) {
        out.push(full)
      }
    }
  }
  walk(dir)
  return out
}

const safeRead = (filePath) => {
  try {
    return readFileSync(filePath, 'utf8')
  } catch {
    return ''
  }
}

const getAppRoot = (filePath) => {
  const rel = toRel(filePath)
  if (rel.startsWith('apps/')) {
    return rel.split('/')[1]
  }
  if (rel.startsWith('legacy/code/')) {
    return 'legacy/code'
  }
  return 'repo-root'
}

const detectStatus = (source) => {
  if (source.includes('NextResponse.redirect')) return 'redirect'
  if (source.includes('status: 501') || source.toLowerCase().includes('not implemented')) {
    return 'stub'
  }
  return 'exists'
}

const loadEndpointCatalog = () => {
  if (!existsSync(endpointCatalogPath)) {
    throw new Error('docs/api/endpoint-catalog.json not found')
  }
  const raw = readFileSync(endpointCatalogPath, 'utf8')
  const parsed = JSON.parse(raw)
  return parsed.endpoints || []
}

const buildEndpointMap = (endpoints) => {
  const map = new Map()
  for (const endpoint of endpoints) {
    if (!map.has(endpoint.path)) {
      map.set(endpoint.path, [])
    }
    map.get(endpoint.path).push(endpoint)
  }
  return map
}

const findPagesApiEndpoints = () => {
  const appsDir = join(repoRoot, 'apps')
  if (!existsSync(appsDir)) return []
  const appRoots = readdirSync(appsDir)
    .map((name) => join(appsDir, name))
    .filter((dir) => statSync(dir).isDirectory())

  const endpoints = []

  for (const appRoot of appRoots) {
    const pagesApiDir = join(appRoot, 'pages', 'api')
    if (!existsSync(pagesApiDir)) continue

    const files = listFiles(pagesApiDir, /\.(ts|js|tsx|jsx)$/)
    for (const file of files) {
      const source = safeRead(file)
      const rel = toRel(file)
      const pathPart = rel.split('/pages/api/')[1].replace(/\.(ts|js|tsx|jsx)$/, '')
      const apiPath = `/api/${pathPart}`
      const methodRegex = /(req\.method\s*===\s*['"](GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)['"])|(case\s+['"](GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)['"])/g
      const methodSet = new Set()
      let match
      while ((match = methodRegex.exec(source))) {
        const method = match[2] || match[4]
        if (method) methodSet.add(method)
      }
      const methods = Array.from(methodSet)

      endpoints.push({
        methodLabel: methods.length ? methods.join(', ') : 'UNKNOWN',
        path: apiPath,
        file: rel,
        appRoot: getAppRoot(file),
        handler: methods.length ? methods.join(', ') : 'UNKNOWN',
        status: detectStatus(source),
      })
    }
  }

  return endpoints
}

const findMiddlewareEntries = () => {
  const middlewareFiles = listFiles(repoRoot, /middleware\.ts$/)
  const entries = []

  for (const file of middlewareFiles) {
    const rel = toRel(file)
    if (!rel.startsWith('apps/')) continue

    const source = safeRead(file)
    const matcherMatch = source.match(/matcher:\s*\[(.*?)\]/s)
    const matcherRaw = matcherMatch ? matcherMatch[1] : null
    const matcher = matcherRaw ? matcherRaw.replace(/['"\s]/g, '') : null

    entries.push({
      methodLabel: 'MIDDLEWARE',
      path: matcher || '/api/:path*',
      file: rel,
      appRoot: getAppRoot(file),
      handler: 'middleware',
      status: 'exists',
    })
  }

  return entries
}

const parseUnknownCallsites = () => {
  if (!existsSync(unknownCallsitesPath)) return []
  const lines = readFileSync(unknownCallsitesPath, 'utf8').split(/\r?\n/)
  const entries = []

  for (const line of lines) {
    const match = line.match(/^-\s+(\/api[^\s]+).*@\s+([^\s]+)(?:\s+raw='([^']+)')?/)
    if (!match) continue
    const url = match[1]
    const file = match[2].split('#')[0]
    entries.push({
      file,
      url,
      expectedMethod: 'UNKNOWN',
      match: '❌ NO MATCH IN REPO',
    })
  }

  return entries
}

const extractDocEndpoints = (content) => {
  const matches = content.match(/\/api\/[A-Za-z0-9_\-\[\]\/\.]+/g) || []
  return Array.from(new Set(matches))
}

const getLastUpdated = (filePath) => {
  try {
    const out = execSync(`git log -1 --format=%cs -- "${filePath}"`, { cwd: repoRoot })
    return out.toString('utf8').trim()
  } catch {
    return 'unknown'
  }
}

const loadWarnings = (filePath) => {
  if (!existsSync(filePath)) return []
  const lines = readFileSync(filePath, 'utf8').split(/\r?\n/)
  return lines.filter((line) => line.trim().startsWith('- ')).map((line) => line.replace(/^-\s*/, ''))
}

const main = () => {
  const endpoints = loadEndpointCatalog()
  const endpointMap = buildEndpointMap(endpoints)

  const apiRows = endpoints.map((endpoint) => {
    const sourcePath = join(repoRoot, endpoint.file)
    const source = safeRead(sourcePath)
    const methods = Array.isArray(endpoint.methods) && endpoint.methods.length
      ? endpoint.methods.join(', ')
      : 'UNKNOWN'
    const notes = endpoint.accessRole ? `accessRole=${endpoint.accessRole}` : 'accessRole=unknown'

    return [
      methods,
      endpoint.path,
      endpoint.file,
      getAppRoot(sourcePath),
      methods,
      notes,
    ]
  })

  const pagesApiRows = findPagesApiEndpoints().map((entry) => [
    entry.methodLabel,
    entry.path,
    entry.file,
    entry.appRoot,
    entry.handler,
    'pages/api',
  ])

  const middlewareRows = findMiddlewareEntries().map((entry) => [
    entry.methodLabel,
    entry.path,
    entry.file,
    entry.appRoot,
    entry.handler,
    'middleware',
  ])

  const usedByRows = []
  const seenCallsites = new Set()

  for (const endpoint of endpoints) {
    for (const usedBy of endpoint.usedBy || []) {
      const key = `${usedBy.file}:${usedBy.apiPath}`
      if (seenCallsites.has(key)) continue
      seenCallsites.add(key)

      const matches = endpointMap.get(usedBy.apiPath) || []
      const methodSet = new Set()
      for (const match of matches) {
        for (const method of match.methods || []) {
          methodSet.add(method)
        }
      }

      const expectedMethod = methodSet.size ? Array.from(methodSet).join(', ') : 'UNKNOWN'
      const matchFile = matches.length
        ? matches.map((m) => `${m.path} → ${m.file}`).join(', ')
        : '❌ NO MATCH IN REPO'

      usedByRows.push([
        usedBy.file,
        usedBy.apiPath,
        expectedMethod,
        matchFile,
      ])
    }
  }

  const unknownCallsites = parseUnknownCallsites()
  for (const entry of unknownCallsites) {
    usedByRows.push([entry.file, entry.url, entry.expectedMethod, entry.match])
  }

  const docRows = []
  const driftRows = []
  const allEndpointPaths = new Set(endpoints.map((endpoint) => endpoint.path))

  const docFiles = listFiles(repoRoot, /\.md$/)
  for (const abs of docFiles) {
    const rel = toRel(abs)
    if (rel.startsWith('node_modules/')) continue
    const content = safeRead(abs)
    if (!content.includes('/api/')) continue

    const endpointsInDoc = extractDocEndpoints(content)
    if (endpointsInDoc.length === 0) continue

    const lastUpdated = getLastUpdated(rel)
    const headingLine = content.split(/\r?\n/).find((line) => line.trim().startsWith('#')) || ''
    const purpose = headingLine.replace(/^#+\s*/, '') || 'Document'

    docRows.push([
      rel,
      purpose,
      lastUpdated,
      endpointsInDoc.join(', '),
    ])

    for (const endpoint of endpointsInDoc) {
      if (!allEndpointPaths.has(endpoint)) {
        driftRows.push([rel, endpoint, '❌ missing in repo'])
      }
    }
  }

  const warnings = {
    unknownCallsites: loadWarnings(unknownCallsitesPath),
    orphanEndpoints: loadWarnings(orphanEndpointsPath),
    unknownAccess: loadWarnings(unknownAccessPath),
  }

  const inputs = [
    '- scripts/dev/endpoint-catalog/generate.js',
    '- scripts/dev/endpoint-catalog/core.js',
    '- docs/api/endpoint-allowlist.json',
    '- scripts/ci/verify-endpoint-catalog.ps1',
    '- .github/workflows/api-wiring-gate.yml',
    '- .github/workflows/endpoint-catalog-autofix.yml',
    '- .github/workflows/pr-preflight-autofix.yml',
  ].join('\n')

  const content = [
    '# Endpoint Inventory (Repo Derived)',
    '',
    '## Generator Inputs',
    '',
    inputs,
    '',
    '## Authoritative Endpoint List (Ist)',
    '',
    renderTable(
      [...apiRows, ...pagesApiRows, ...middlewareRows],
      ['METHOD', 'URL', 'FILE PATH', 'APP ROOT', 'HANDLER (GET/POST/…)', 'NOTES (auth?)'],
    ),
    '',
    '## UI Call Sites → Endpoints',
    '',
    renderTable(usedByRows, ['UI FILE', 'CALLED URL', 'METHOD', 'MATCHING ENDPOINT (URL+file)']),
    '',
    '## Generator Warnings',
    '',
    '### Unknown callsites',
    warnings.unknownCallsites.length ? warnings.unknownCallsites.map((line) => `- ${line}`).join('\n') : '- (none)',
    '',
    '### Orphan endpoints',
    warnings.orphanEndpoints.length ? warnings.orphanEndpoints.map((line) => `- ${line}`).join('\n') : '- (none)',
    '',
    '### Unknown access-rules',
    warnings.unknownAccess.length ? warnings.unknownAccess.map((line) => `- ${line}`).join('\n') : '- (none)',
    '',
    '## Doc Map',
    '',
    renderTable(docRows, ['FILE', 'PURPOSE', 'LAST UPDATED', 'REFERENCED ENDPOINTS/URLS']),
    '',
    '## Doku-Drift (Doku ≠ Code)',
    '',
    driftRows.length
      ? renderTable(driftRows, ['DOC FILE', 'ENDPOINT', 'STATUS'])
      : '_No doc endpoints missing from repo._',
    '',
  ].join('\n')

  writeFileSync(outputPath, `${content}\n`, 'utf8')
  console.log(`Wrote ${toRel(outputPath)}`)
}

main()
