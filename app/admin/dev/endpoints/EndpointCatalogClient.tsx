'use client'

import { useMemo, useState } from 'react'

type EndpointRow = {
  path: string
  methods: string[]
  file: string
  intent: string | null
  accessRole: string
  usedByCount: number
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

export default function EndpointCatalogClient({ catalog }: { catalog: EndpointCatalog }) {
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [methodFilter, setMethodFilter] = useState<string>('all')
  const [showUnused, setShowUnused] = useState<boolean>(false)
  const [showManual, setShowManual] = useState<boolean>(false)
  const [query, setQuery] = useState<string>('')

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
        if (q) {
          const hay = `${e.path} ${e.file} ${e.intent ?? ''}`.toLowerCase()
          if (!hay.includes(q)) return false
        }
        return true
      })
      .slice()
      .sort((a, b) => a.path.localeCompare(b.path))
  }, [catalog.endpoints, roleFilter, methodFilter, showUnused, showManual, query])

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
              <th className="text-left px-3 py-2">Path</th>
              <th className="text-left px-3 py-2">Methods</th>
              <th className="text-left px-3 py-2">Access</th>
              <th className="text-left px-3 py-2">Intent</th>
              <th className="text-right px-3 py-2">Used</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((e) => (
              <tr key={e.path} className="border-t border-slate-100">
                <td className="px-3 py-2 font-mono text-xs text-slate-800">{e.path}</td>
                <td className="px-3 py-2 text-slate-700">{e.methods.join(', ') || '—'}</td>
                <td className="px-3 py-2 text-slate-700">{e.accessRole}</td>
                <td className="px-3 py-2 text-slate-700">
                  {e.intent ? e.intent : e.isAllowedOrphan ? 'allowlisted' : '—'}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-slate-700">
                  {e.usedByCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-slate-500">
        Note: “Unused” is based on in-repo string/template callsite scanning (app/** and lib/**).
      </p>
    </div>
  )
}
