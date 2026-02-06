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
const core = require('./dev/endpoint-catalog/core')

const endpointCatalogPath = join(repoRoot, 'docs', 'api', 'endpoint-catalog.json')
const unknownCallsitesPath = join(repoRoot, 'docs', 'api', 'UNKNOWN_CALLSITES.md')
const outputPath = join(repoRoot, 'docs', 'api', 'ENDPOINT_INVENTORY.md')

const toPosix = (value) => value.replace(/\\/g, '/')
const toRel = (value) => toPosix(relative(repoRoot, value))

const listFiles = (dir, pattern) => {
  const out = []
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name)
      if (entry.isDirectory()) {
        walk(full)
      } else if (pattern.test(full)) {
        out.push(full)
      }
    }
  }
  walk(dir)
  return out
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

const safeRead = (filePath) => {
  try {
    return readFileSync(filePath, 'utf8')
  } catch {
    return ''
  }
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

const docCandidates = [
  'docs/api/ENDPOINT_CATALOG.md',
  'docs/API_ROUTE_OWNERSHIP.md',
  'docs/anamnesis/API_V1.md',
  'docs/ACCOUNT_DELETION_RETENTION.md',
  'CLINICIAN-NAV-UPDATE.md',
  'docs/dev/VERIFY_ENDPOINTS.md',
]

const renderTable = (rows, headers) => {
  const lines = []
  lines.push(`| ${headers.join(' | ')} |`)
  lines.push(`| ${headers.map(() => '---').join(' | ')} |`)
  for (const row of rows) {
    lines.push(`| ${row.map((cell) => String(cell).replace(/\|/g, '\\|')).join(' | ')} |`)
  }
  return lines.join('\n')
}

const main = () => {
  const endpoints = loadEndpointCatalog()
  const endpointMap = buildEndpointMap(endpoints)

  const apiRows = endpoints.map((endpoint) => {
    const file = endpoint.file
    const sourcePath = join(repoRoot, endpoint.file)
    const source = safeRead(sourcePath)
    const methods = Array.isArray(endpoint.methods) && endpoint.methods.length
      ? endpoint.methods.join(', ')
      : 'UNKNOWN'

    return [
      methods,
      endpoint.path,
      endpoint.file,
      getAppRoot(sourcePath),
      methods,
      detectStatus(source),
    ]
  })

  const pagesApiRows = findPagesApiEndpoints().map((entry) => [
    entry.methodLabel,
    entry.path,
    entry.file,
    entry.appRoot,
    entry.handler,
    entry.status,
  ])

  const middlewareRows = findMiddlewareEntries().map((entry) => [
    entry.methodLabel,
    entry.path,
    entry.file,
    entry.appRoot,
    entry.handler,
    entry.status,
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
      const matchFile = matches.length ? matches.map((m) => m.file).join(', ') : '❌ NO MATCH IN REPO'

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

  for (const docPath of docCandidates) {
    const abs = join(repoRoot, docPath)
    if (!existsSync(abs)) continue

    const content = readFileSync(abs, 'utf8')
    const endpointsInDoc = extractDocEndpoints(content)
    const lastUpdated = getLastUpdated(docPath)
    const headingLine = content.split(/\r?\n/).find((line) => line.trim().startsWith('#')) || ''
    const purpose = headingLine.replace(/^#+\s*/, '') || 'Document'

    docRows.push([
      docPath,
      purpose,
      lastUpdated,
      endpointsInDoc.length ? endpointsInDoc.join(', ') : '—',
    ])

    for (const endpoint of endpointsInDoc) {
      if (!allEndpointPaths.has(endpoint)) {
        driftRows.push([docPath, endpoint, '❌ missing in repo'])
      }
    }
  }

  const content = [
    '# Endpoint Inventory (Repo Derived)',
    '',
    '## Authoritative API Endpoint List (Ist)',
    '',
    renderTable(
      [...apiRows, ...pagesApiRows, ...middlewareRows],
      ['METHOD', 'PUBLIC URL', 'FILE PATH', 'APP ROOT', 'HANDLER (GET/POST/…)', 'STATUS (exists / stub / redirect)'],
    ),
    '',
    '## UI → API Call Sites',
    '',
    renderTable(usedByRows, ['UI FILE', 'CALLED URL', 'EXPECTED METHOD', 'MATCHING API FILE (or NONE)']),
    '',
    '## Documentation / Endpoint Catalog Map',
    '',
    renderTable(docRows, ['DOC FILE', 'PURPOSE', 'LAST UPDATED', 'REFERENCES WHICH ENDPOINTS']),
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
