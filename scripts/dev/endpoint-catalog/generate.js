#!/usr/bin/env node

/* eslint-disable no-console */

const fs = require('fs')
const fsp = require('fs/promises')
const path = require('path')

const {
  routeFilePathToApiPath,
  extractRouteMethods,
  extractEndpointIntent,
  guessAccessRoleFromApiPath,
  extractApiCallsitesFromSource,
  matchCallsiteToAnyRoute,
  normalizeRepoRelative,
} = require('./core')

function stableCompare(a, b) {
  const sa = String(a)
  const sb = String(b)
  if (sa === sb) return 0
  return sa < sb ? -1 : 1
}

function parseArgs(argv) {
  const args = {
    repoRoot: process.cwd(),
    outDir: path.join(process.cwd(), 'docs', 'dev'),
    allowlistPath: undefined,
    failOnUnknown: true,
    failOnOrphan: true,
  }

  let allowlistRequested = false
  let allowlistExplicitPath = null

  for (let i = 2; i < argv.length; i += 1) {
    const a = argv[i]
    if (a === '--repo-root') args.repoRoot = argv[++i]
    else if (a === '--out-dir') args.outDir = argv[++i]
    else if (a === '--allowlist') {
      allowlistRequested = true
      const next = argv[i + 1]
      if (next && !String(next).startsWith('-')) {
        allowlistExplicitPath = next
        i += 1
      }
    }
    else if (a === '--no-fail-unknown') args.failOnUnknown = false
    else if (a === '--no-fail-orphan') args.failOnOrphan = false
  }

  if (allowlistRequested) {
    args.allowlistPath = allowlistExplicitPath
      ? allowlistExplicitPath
      : path.join(args.outDir, 'endpoint-allowlist.json')
  }

  return args
}

async function listFilesRec(rootDir) {
  const out = []
  async function walk(dir) {
    const entries = await fsp.readdir(dir, { withFileTypes: true })
    for (const e of entries) {
      const full = path.join(dir, e.name)
      if (e.isDirectory()) {
        if (e.name === 'node_modules' || e.name === '.next' || e.name === '.git') continue
        await walk(full)
      } else {
        out.push(full)
      }
    }
  }
  await walk(rootDir)
  return out
}

async function findRouteFiles(appApiDir) {
  const files = await listFilesRec(appApiDir)
  return files
    .filter((f) => f.endsWith(`${path.sep}route.ts`))
    .sort(stableCompare)
}

async function readAllowlist(allowlistPath) {
  if (!allowlistPath) {
    return { allowedOrphans: new Set(), allowedIntents: new Set() }
  }

  try {
    const raw = await fsp.readFile(allowlistPath, 'utf8')
    const json = JSON.parse(raw)
    const allowedOrphans = Array.isArray(json.allowedOrphans) ? json.allowedOrphans : []
    const allowedIntents = Array.isArray(json.allowedIntents) ? json.allowedIntents : []
    return {
      allowedOrphans: new Set(allowedOrphans.map(String)),
      allowedIntents: new Set(allowedIntents.map(String)),
    }
  } catch (e) {
    if (e && e.code === 'ENOENT') {
      try {
        await fsp.mkdir(path.dirname(allowlistPath), { recursive: true })
        await fsp.writeFile(
          allowlistPath,
          `${JSON.stringify({ allowedOrphans: [], allowedIntents: [] }, null, 2)}\n`,
          'utf8',
        )
      } catch {
        // If we can't create it (permissions, etc), still treat as empty.
      }
      return { allowedOrphans: new Set(), allowedIntents: new Set() }
    }
    throw e
  }
}

function isAllowedOrphan(endpoint, allowlist) {
  if (allowlist.allowedOrphans.has(endpoint.path)) return true
  if (endpoint.intent && allowlist.allowedIntents.has(endpoint.intent)) return true
  if (endpoint.intent && endpoint.intent.startsWith('manual:')) return true
  return false
}

function mdEscape(s) {
  return String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

async function generateCatalog({ repoRoot, outDir, allowlistPath, failOnUnknown, failOnOrphan }) {
  const appApiDir = path.join(repoRoot, 'app', 'api')
  if (!fs.existsSync(appApiDir)) {
    throw new Error(`app/api not found at ${appApiDir}`)
  }

  const allowlist = await readAllowlist(allowlistPath)

  const routeFiles = await findRouteFiles(appApiDir)
  const endpoints = []

  for (const rf of routeFiles) {
    const source = await fsp.readFile(rf, 'utf8')
    const apiPath = routeFilePathToApiPath(repoRoot, rf)
    endpoints.push({
      path: apiPath,
      methods: extractRouteMethods(source),
      file: normalizeRepoRelative(path.relative(repoRoot, rf)),
      intent: extractEndpointIntent(source),
      accessRole: guessAccessRoleFromApiPath(apiPath),
      usedBy: [],
    })
  }

  const routePatterns = endpoints.map((e) => e.path).sort(stableCompare)

  // Scan callsites in app/** and lib/**
  const callsites = []
  const scanRoots = [path.join(repoRoot, 'app'), path.join(repoRoot, 'lib')]
  const allowedExt = new Set(['.ts', '.tsx', '.js', '.jsx', '.mts', '.cts'])

  for (const root of scanRoots) {
    if (!fs.existsSync(root)) continue
    const all = await listFilesRec(root)
    const files = all
      .filter((f) => allowedExt.has(path.extname(f)))
      .sort(stableCompare)

    for (const f of files) {
      const source = await fsp.readFile(f, 'utf8')
      const found = extractApiCallsitesFromSource(source)
      if (!found.length) continue

      for (const cs of found) {
        callsites.push({
          apiPath: cs.apiPath,
          isTemplate: cs.isTemplate,
          kind: cs.kind,
          file: normalizeRepoRelative(path.relative(repoRoot, f)),
          line: cs.line,
          raw: cs.raw,
        })
      }
    }
  }

  callsites.sort((a, b) => {
    const fa = `${a.file}:${a.line}`
    const fb = `${b.file}:${b.line}`
    if (fa !== fb) return stableCompare(fa, fb)
    return stableCompare(a.apiPath, b.apiPath)
  })

  const unknownCallsites = []
  const endpointByPath = new Map(endpoints.map((e) => [e.path, e]))

  for (const cs of callsites) {
    const matched = matchCallsiteToAnyRoute(cs.apiPath, routePatterns)
    if (!matched) {
      unknownCallsites.push(cs)
      continue
    }
    const ep = endpointByPath.get(matched)
    if (ep) {
      ep.usedBy.push({ file: cs.file, line: cs.line, apiPath: cs.apiPath, kind: cs.kind })
    }
  }

  for (const ep of endpoints) {
    ep.usedBy.sort((a, b) => {
      const fa = `${a.file}:${a.line}`
      const fb = `${b.file}:${b.line}`
      if (fa !== fb) return stableCompare(fa, fb)
      return stableCompare(a.apiPath, b.apiPath)
    })
  }

  const orphanEndpoints = endpoints.filter(
    (e) => e.usedBy.length === 0 && !isAllowedOrphan(e, allowlist),
  )

  const catalogJson = {
    version: 'v0.6',
    endpoints: endpoints
      .slice()
      .sort((a, b) => stableCompare(a.path, b.path))
      .map((e) => ({
        path: e.path,
        methods: e.methods,
        file: e.file,
        intent: e.intent,
        accessRole: e.accessRole,
        usedByCount: e.usedBy.length,
        usedBy: e.usedBy,
        isOrphan: e.usedBy.length === 0,
        isAllowedOrphan: e.usedBy.length === 0 ? isAllowedOrphan(e, allowlist) : false,
      })),
    unknownCallsites,
  }

  await fsp.mkdir(outDir, { recursive: true })

  const jsonPath = path.join(outDir, 'endpoint-catalog.json')
  await fsp.writeFile(jsonPath, `${JSON.stringify(catalogJson, null, 2)}\n`, 'utf8')

  // ENDPOINT_CATALOG.md
  const mdLines = []
  mdLines.push('# Endpoint Catalog')
  mdLines.push('')
  mdLines.push('Deterministic inventory of Next API routes and in-repo callsites.')
  mdLines.push('')
  mdLines.push('| Path | Methods | Access | Intent | Used by | Route file |')
  mdLines.push('| --- | --- | --- | --- | ---: | --- |')

  for (const e of catalogJson.endpoints) {
    const methods = e.methods.length ? e.methods.join(', ') : '(none)'
    const intent = e.intent ? e.intent : ''
    const used = String(e.usedByCount)
    mdLines.push(
      `| ${mdEscape(e.path)} | ${mdEscape(methods)} | ${mdEscape(e.accessRole)} | ${mdEscape(intent)} | ${used} | ${mdEscape(e.file)} |`,
    )
  }

  await fsp.writeFile(path.join(outDir, 'ENDPOINT_CATALOG.md'), `${mdLines.join('\n')}\n`, 'utf8')

  // ORPHAN_ENDPOINTS.md
  const orphanLines = []
  orphanLines.push('# Orphan Endpoints')
  orphanLines.push('')
  orphanLines.push('Endpoints with no in-repo callsite match (excluding allowlist/manual intents).')
  orphanLines.push('')

  if (!orphanEndpoints.length) {
    orphanLines.push('- (none)')
  } else {
    const sorted = orphanEndpoints.slice().sort((a, b) => stableCompare(a.path, b.path))
    for (const e of sorted) {
      const methods = e.methods.length ? e.methods.join(', ') : '(none)'
      orphanLines.push(`- ${e.path} [${methods}] (${e.file})${e.intent ? ` intent=${e.intent}` : ''}`)
    }
  }

  await fsp.writeFile(
    path.join(outDir, 'ORPHAN_ENDPOINTS.md'),
    `${orphanLines.join('\n')}\n`,
    'utf8',
  )

  // UNKNOWN_CALLSITES.md
  const unknownLines = []
  unknownLines.push('# Unknown API Callsites')
  unknownLines.push('')
  unknownLines.push('Calls referencing /api/* with no matching route.ts pattern.')
  unknownLines.push('')

  if (!unknownCallsites.length) {
    unknownLines.push('- (none)')
  } else {
    for (const cs of unknownCallsites) {
      unknownLines.push(
        `- ${cs.apiPath} (${cs.kind}) @ ${cs.file}#L${cs.line} raw=${mdEscape(cs.raw)}`,
      )
    }
  }

  await fsp.writeFile(
    path.join(outDir, 'UNKNOWN_CALLSITES.md'),
    `${unknownLines.join('\n')}\n`,
    'utf8',
  )

  const shouldFail =
    (failOnUnknown && unknownCallsites.length > 0) ||
    (failOnOrphan && orphanEndpoints.length > 0)

  return {
    jsonPath,
    orphanCount: orphanEndpoints.length,
    unknownCount: unknownCallsites.length,
    shouldFail,
  }
}

async function main() {
  const args = parseArgs(process.argv)
  const res = await generateCatalog(args)

  console.log(`Wrote: ${path.relative(args.repoRoot, path.join(args.outDir, 'ENDPOINT_CATALOG.md'))}`)
  console.log(`Wrote: ${path.relative(args.repoRoot, path.join(args.outDir, 'endpoint-catalog.json'))}`)
  console.log(`Wrote: ${path.relative(args.repoRoot, path.join(args.outDir, 'ORPHAN_ENDPOINTS.md'))}`)
  console.log(`Wrote: ${path.relative(args.repoRoot, path.join(args.outDir, 'UNKNOWN_CALLSITES.md'))}`)

  if (res.shouldFail) {
    console.error('❌ Endpoint wiring gate failed')
    console.error(`Unknown callsites: ${res.unknownCount}`)
    console.error(`Orphan endpoints: ${res.orphanCount}`)
    process.exit(2)
  }

  console.log('✅ Endpoint wiring gate passed')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
