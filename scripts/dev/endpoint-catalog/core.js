const path = require('path')

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS', 'HEAD']

function normalizeSlashes(p) {
  return p.replace(/\\/g, '/')
}

function stripQueryAndHash(p) {
  const q = p.indexOf('?')
  const h = p.indexOf('#')
  let end = p.length
  if (q !== -1) end = Math.min(end, q)
  if (h !== -1) end = Math.min(end, h)
  return p.slice(0, end)
}

function routeFilePathToApiPath(repoRoot, routeFileAbsPath) {
  const rel = normalizeSlashes(path.relative(repoRoot, routeFileAbsPath))
  // app/api/foo/[id]/route.ts -> /api/foo/[id]
  const withoutPrefix = rel.replace(/^app\/api\//, '')
  const withoutSuffix = withoutPrefix.replace(/\/route\.(ts|js|tsx|jsx)$/, '')
  return `/api/${withoutSuffix}`
}

function extractRouteMethods(sourceText) {
  const methods = new Set()
  const re = /export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|OPTIONS|HEAD)\b/g
  let m
  while ((m = re.exec(sourceText))) {
    methods.add(String(m[1]).toUpperCase())
  }
  return Array.from(methods).sort()
}

function extractEndpointIntent(sourceText) {
  // Deterministic marker: // @endpoint-intent manual:webhook
  const re = /@endpoint-intent\s+([^\s]+)/
  const m = sourceText.match(re)
  return m ? String(m[1]).trim() : null
}

function guessAccessRoleFromApiPath(apiPath) {
  if (apiPath.startsWith('/api/admin/')) return 'admin'
  if (apiPath.startsWith('/api/clinician/')) return 'clinician'
  if (apiPath.startsWith('/api/patient/')) return 'patient'
  return 'unknown'
}

function routePatternToSegments(routePattern) {
  return stripQueryAndHash(routePattern)
    .replace(/^\//, '')
    .split('/')
    .filter(Boolean)
}

function callPathToSegments(callPath) {
  return stripQueryAndHash(callPath)
    .replace(/^\//, '')
    .split('/')
    .filter(Boolean)
}

function isCatchAll(seg) {
  return /^\[\.\.\.[^\]]+\]$/.test(seg)
}

function isOptionalCatchAll(seg) {
  return /^\[\[\.\.\.[^\]]+\]\]$/.test(seg)
}

function isDynamic(seg) {
  return /^\[[^\]]+\]$/.test(seg) && !isCatchAll(seg) && !isOptionalCatchAll(seg)
}

function matchApiPathToRoutePattern(callApiPath, routePattern) {
  const callSegs = callPathToSegments(callApiPath)
  const routeSegs = routePatternToSegments(routePattern)

  let i = 0
  let j = 0

  while (i < routeSegs.length && j < callSegs.length) {
    const r = routeSegs[i]
    const c = callSegs[j]

    if (isCatchAll(r)) {
      // Must consume at least one segment
      return j < callSegs.length
    }

    if (isOptionalCatchAll(r)) {
      // May consume zero or more
      return true
    }

    if (isDynamic(r)) {
      i += 1
      j += 1
      continue
    }

    if (r !== c) return false
    i += 1
    j += 1
  }

  // If we've matched all route segments, call must also be fully consumed
  if (i === routeSegs.length && j === callSegs.length) return true

  // Remaining route segments can be optional catch-all
  if (i === routeSegs.length - 1 && isOptionalCatchAll(routeSegs[i])) return true

  // Remaining route segment can be catch-all consuming remaining call segments (must be >=1)
  if (i === routeSegs.length - 1 && isCatchAll(routeSegs[i])) {
    return j < callSegs.length
  }

  return false
}

function extractApiCallsitesFromSource(sourceText) {
  // Heuristic, deterministic, line-oriented.
  // Finds string/template literals containing '/api/' and tries to classify by nearby call patterns.
  const results = []
  const lines = sourceText.split(/\r?\n/)

  const singleQuoteRe = /'(?:[^'\\]|\\.)*'/g
  const doubleQuoteRe = /"(?:[^"\\]|\\.)*"/g
  const templateRe = /`(?:[^`\\]|\\.)*`/g

  function extractLiteralBodies(line) {
    const out = []
    const pushMatches = (re, quote) => {
      let m
      while ((m = re.exec(line))) {
        const raw = m[0]
        const body = raw.slice(1, -1)
        out.push({ raw, body, quote, index: m.index })
      }
    }
    pushMatches(singleQuoteRe, "'")
    pushMatches(doubleQuoteRe, '"')
    pushMatches(templateRe, '`')
    out.sort((a, b) => a.index - b.index)
    return out
  }

  const classifyWindow = (text) => {
    const window = text.slice(Math.max(0, text.length - 300))
    if (/fetch\s*\(/.test(window)) return 'fetch'
    if (/\buseSWR\s*\(/.test(window)) return 'swr'
    if (/\baxios\s*\./.test(window) || /\baxios\s*\(/.test(window)) return 'axios'
    if (/new\s+URL\s*\(/.test(window) || /\bURL\s*\(/.test(window)) return 'url'
    if (/new\s+Request\s*\(/.test(window)) return 'request'
    return 'unknown'
  }

  const classifyAround = (lineIndex, idxInLine) => {
    const prev2 = lineIndex >= 2 ? lines[lineIndex - 2] : ''
    const prev1 = lineIndex >= 1 ? lines[lineIndex - 1] : ''
    const curPrefix = lines[lineIndex].slice(0, idxInLine)
    return classifyWindow(`${prev2}\n${prev1}\n${curPrefix}`)
  }

  function extractApiPathFromStringBody(body) {
    if (body.startsWith('/api/')) return stripQueryAndHash(body)

    // Accept full URLs where the pathname contains /api/
    if (/^https?:\/\//i.test(body)) {
      // Only treat localhost URLs as in-repo API calls; ignore external services.
      try {
        const u = new URL(body)
        const host = String(u.hostname || '').toLowerCase()
        if (host !== 'localhost' && host !== '127.0.0.1') return null
        if (u.pathname && u.pathname.startsWith('/api/')) return stripQueryAndHash(u.pathname)
      } catch {
        const idx = body.indexOf('/api/')
        if (idx !== -1) return stripQueryAndHash(body.slice(idx))
      }
    }

    return null
  }

  let inBlockComment = false
  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex]

    const trimmed = line.trim()
    if (inBlockComment) {
      if (trimmed.includes('*/')) inBlockComment = false
      continue
    }
    if (trimmed.startsWith('/*')) {
      if (!trimmed.includes('*/')) inBlockComment = true
      continue
    }
    if (trimmed.startsWith('//')) continue

    const literals = extractLiteralBodies(line)
    for (const lit of literals) {
      const apiPath = extractApiPathFromStringBody(lit.body)
      if (!apiPath) continue

      // Only treat as a callsite if it's in an API-usage context.
      const kind = classifyAround(lineIndex, lit.index)
      if (kind === 'unknown') continue

      const isTemplate = lit.quote === '`' && apiPath.includes('${')
      results.push({
        raw: lit.raw,
        apiPath,
        isTemplate,
        kind,
        line: lineIndex + 1,
      })
    }
  }

  // Deduplicate deterministically
  const key = (r) => `${r.line}|${r.apiPath}|${r.kind}`
  const seen = new Set()
  const uniq = []
  for (const r of results) {
    const k = key(r)
    if (seen.has(k)) continue
    seen.add(k)
    uniq.push(r)
  }

  return uniq
}

function isTemplateLikeApiPath(apiPath) {
  return apiPath.includes('${')
}

function templateToLooseMatchApiPath(apiPath) {
  // `/api/foo/${id}/bar` -> `/api/foo/__DYN__/bar` so segment splitting still works
  return apiPath.replace(/\$\{[^}]+\}/g, '__DYN__')
}

function matchCallsiteToAnyRoute(callsiteApiPath, routePatterns) {
  const candidate = isTemplateLikeApiPath(callsiteApiPath)
    ? templateToLooseMatchApiPath(callsiteApiPath)
    : callsiteApiPath

  for (const rp of routePatterns) {
    if (matchApiPathToRoutePattern(candidate, rp)) return rp
  }
  return null
}

function normalizeRepoRelative(p) {
  return normalizeSlashes(p).replace(/^\.\//, '')
}

module.exports = {
  HTTP_METHODS,
  stripQueryAndHash,
  routeFilePathToApiPath,
  extractRouteMethods,
  extractEndpointIntent,
  guessAccessRoleFromApiPath,
  matchApiPathToRoutePattern,
  extractApiCallsitesFromSource,
  matchCallsiteToAnyRoute,
  normalizeRepoRelative,
  templateToLooseMatchApiPath,
}
