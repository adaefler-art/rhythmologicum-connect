'use client'

import React, { useMemo, useState } from 'react'
import { ChevronDown, ChevronRight } from 'lucide-react'

type UsedByEntry = {
  file: string
  line: number
  apiPath: string
  kind: string
}

type EndpointRow = {
  path: string
  methods: string[]
  file: string
  intent: string | null
  accessRole: string
  usedByCount: number
  usedBy: UsedByEntry[]
  isOrphan: boolean
  isAllowedOrphan: boolean
}

type EndpointCatalog = {
  version: string
  endpoints: EndpointRow[]
}

function uniq<T>(items: T[]) {
  return Array.from(new Set(items))
}

function getRoleBadgeClass(role: string): string {
  const roleColors: Record<string, string> = {
    unknown: 'bg-yellow-100 text-yellow-800',
    admin: 'bg-purple-100 text-purple-800',
    clinician: 'bg-blue-100 text-blue-800',
    patient: 'bg-green-100 text-green-800',
  }
  return roleColors[role] || 'bg-slate-100 text-slate-800'
}

export default function EndpointCatalogClient({ catalog }: { catalog: EndpointCatalog }) {
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [showUnused, setShowUnused] = useState<boolean>(false)
  const [showManual, setShowManual] = useState<boolean>(false)
  const [showOrphan, setShowOrphan] = useState<boolean>(false)
  const [showUnknown, setShowUnknown] = useState<boolean>(false)
  const [query, setQuery] = useState<string>('')
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set())

  const roles = useMemo(() => {
    return ['all', ...uniq(catalog.endpoints.map((e) => e.accessRole)).sort()]
  }, [catalog.endpoints])

  const methods = useMemo(() => {
    const all = catalog.endpoints.flatMap((e) => e.methods)
    return ['all', ...uniq(all).sort()]
  }, [catalog.endpoints])

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase()

    return catalog.endpoints
      .filter((e) => {
        if (roleFilter !== 'all' && e.accessRole !== roleFilter) return false
        if (methodFilter !== 'all' && !e.methods.includes(methodFilter)) return false
        if (showUnused && e.usedByCount > 0) return false
        if (showManual && !(e.intent && e.intent.startsWith('manual:'))) return false
        if (showOrphan && !e.isOrphan) return false
        if (showUnknown && e.accessRole !== 'unknown') return false
        if (q) {
          const hay = `${e.path} ${e.file} ${e.intent ?? ''}`.toLowerCase()
          if (!hay.includes(q)) return false
        }
        return true
      })
      .slice()
      .sort((a, b) => a.path.localeCompare(b.path))
  }, [catalog.endpoints, roleFilter, methodFilter, showUnused, showManual, showOrphan, showUnknown, query])

  const toggleRow = (path: string) => {
    setExpandedRows((prev) => {
      const next = new Set(prev)
      if (next.has(path)) {
        next.delete(path)
      } else {
        next.add(path)
      }
      return next
    })
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Endpoint Catalog</h1>
        <p className="text-sm text-slate-600">Version: {catalog.version}</p>
      </div>

      <div className="flex flex-wrap gap-3 items-end">
        <label className="text-sm">
          <span className="block text-slate-600">Access</span>
          <select
            className="border border-slate-300 rounded px-2 py-1"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm">
          <span className="block text-slate-600">Method</span>
          <select
            className="border border-slate-300 rounded px-2 py-1"
            value={methodFilter}
            onChange={(e) => setMethodFilter(e.target.value)}
          >
            {methods.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </label>

        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={showUnused}
            onChange={(e) => setShowUnused(e.target.checked)}
          />
          <span className="text-slate-700">Unused only</span>
        </label>

        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={showManual}
            onChange={(e) => setShowManual(e.target.checked)}
          />
          <span className="text-slate-700">Manual only</span>
        </label>

        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={showOrphan}
            onChange={(e) => setShowOrphan(e.target.checked)}
          />
          <span className="text-slate-700">Orphan only</span>
        </label>

        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={showUnknown}
            onChange={(e) => setShowUnknown(e.target.checked)}
          />
          <span className="text-slate-700">Unknown only</span>
        </label>

        <label className="text-sm">
          <span className="block text-slate-600">Search</span>
          <input
            className="border border-slate-300 rounded px-2 py-1"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="/api/..."
          />
        </label>
      </div>

      <div className="text-sm text-slate-600">Showing {rows.length} endpoints</div>

      <div className="overflow-x-auto border border-slate-200 rounded">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-slate-700">
            <tr>
              <th className="text-left px-3 py-2 w-8"></th>
              <th className="text-left px-3 py-2">Path</th>
              <th className="text-left px-3 py-2">Methods</th>
              <th className="text-left px-3 py-2">Access</th>
              <th className="text-left px-3 py-2">Intent</th>
              <th className="text-right px-3 py-2">Used</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => {
              const isExpanded = expandedRows.has(e.path)
              const hasUsedBy = e.usedBy && e.usedBy.length > 0
              const roleBadgeClass = getRoleBadgeClass(e.accessRole)

              return (
                <React.Fragment key={e.path}>
                  <tr className="border-t border-slate-100 hover:bg-slate-50">
                    <td className="px-3 py-2">
                      {hasUsedBy && (
                        <button
                          onClick={() => toggleRow(e.path)}
                          className="text-slate-500 hover:text-slate-700 transition-colors"
                          aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        >
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </td>
                    <td className="px-3 py-2 font-mono text-xs text-slate-800">{e.path}</td>
                    <td className="px-3 py-2 text-slate-700">{e.methods.join(', ') || '—'}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${roleBadgeClass}`}
                      >
                        {e.accessRole}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-slate-700">
                      {e.intent ? e.intent : e.isAllowedOrphan ? 'allowlisted' : '—'}
                      {e.isOrphan && !e.isAllowedOrphan && (
                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                          orphan
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                      {e.usedByCount}
                    </td>
                  </tr>
                  {isExpanded && hasUsedBy && (
                    <tr className="border-t border-slate-100 bg-slate-50">
                      <td colSpan={6} className="px-3 py-3">
                        <div className="ml-8">
                          <div className="text-xs font-semibold text-slate-700 mb-2">
                            Used By ({e.usedBy.length}):
                          </div>
                          <div className="space-y-1">
                            {e.usedBy.map((usage) => (
                              <div
                                key={`${usage.file}:${usage.line}:${usage.apiPath}`}
                                className="flex items-start gap-2 text-xs text-slate-600 bg-white rounded px-2 py-1.5 border border-slate-200"
                              >
                                <span className="font-mono text-blue-700">{usage.file}</span>
                                <span className="text-slate-400">:</span>
                                <span className="text-slate-500">L{usage.line}</span>
                                <span className="text-slate-400">•</span>
                                <span className="font-mono text-slate-600">{usage.apiPath}</span>
                                <span className="text-slate-400">•</span>
                                <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-700">
                                  {usage.kind}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              )
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        Note: “Unused” is based on in-repo string/template callsite scanning (app/** and lib/**).
      </p>
    </div>
  )
}
