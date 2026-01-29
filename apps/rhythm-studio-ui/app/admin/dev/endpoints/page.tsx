import { redirect } from 'next/navigation'
import { env } from '@/lib/env'
import { flagEnabled } from '@/lib/env/flags'
import { getCurrentUser, getUserRole } from '@/lib/db/supabase.server'
import EndpointCatalogClient from './EndpointCatalogClient'
import fs from 'fs/promises'
import path from 'path'

export const dynamic = 'force-dynamic'

type EndpointCatalog = {
  version: string
  endpoints: Array<{
    path: string
    methods: string[]
    file: string
    intent: string | null
    accessRole: string
    usedByCount: number
    usedBy: Array<{
      file: string
      apiPath: string
      kind: string
      line?: number
    }>
    isOrphan: boolean
    isAllowedOrphan: boolean
  }>
}

type VersionInfo = {
  app?: string
  version?: string
  commitSha?: string
  commitHashShort?: string
  generatedAt?: string
  baseUrl?: string
}

async function loadCatalog(): Promise<EndpointCatalog | null> {
  try {
    const catalogPath = path.join(
      process.cwd(),
      'apps',
      'rhythm-studio-ui',
      'public',
      'dev',
      'endpoint-catalog.json',
    )
    const raw = await fs.readFile(catalogPath, 'utf8')
    return JSON.parse(raw) as EndpointCatalog
  } catch {
    return null
  }
}

async function loadVersionInfo(): Promise<VersionInfo | null> {
  try {
    const versionPath = path.join(process.cwd(), 'public', 'version.json')
    const raw = await fs.readFile(versionPath, 'utf8')
    return JSON.parse(raw) as VersionInfo
  } catch {
    return null
  }
}

/**
 * Feature Disabled UI Component
 * Shown when DEV_ENDPOINT_CATALOG is not enabled
 */
function FeatureDisabledUI() {
  return (
    <div className="p-8">
      <div className="w-full max-w-2xl">
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-6">
          <h1 className="text-xl font-semibold text-amber-900">
            🔒 Endpoint Catalog Disabled
          </h1>
          <p className="mt-2 text-sm text-amber-800">
            This developer tool is currently disabled in this environment.
          </p>
          <div className="mt-4 rounded bg-amber-100 p-3">
            <p className="text-xs font-mono text-amber-900">
              Reason: DEV_ENDPOINT_CATALOG environment variable is not set to &apos;1&apos;
            </p>
          </div>
          <p className="mt-4 text-xs text-amber-700">
            To enable this feature, set <code className="bg-amber-100 px-1 rounded">DEV_ENDPOINT_CATALOG=1</code> in
            your environment variables.
          </p>
        </div>
      </div>
    </div>
  )
}

export default async function DevEndpointsPage() {
  // Feature flag check - show disabled UI instead of 404
  if (!flagEnabled(env.DEV_ENDPOINT_CATALOG)) {
    return <FeatureDisabledUI />
  }

  const user = await getCurrentUser()
  if (!user) {
    redirect('/?error=authentication_required&message=Bitte melden Sie sich an.')
  }

  const role = await getUserRole()
  if (role !== 'admin') {
    redirect('/?error=access_denied&message=Keine Berechtigung für diese Seite.')
  }

  const catalog = await loadCatalog()
  const versionInfo = await loadVersionInfo()
  if (!catalog) {
    return (
      <div className="space-y-2">
        <h1 className="text-xl font-semibold text-slate-900">Endpoint Catalog</h1>
        <p className="text-sm text-slate-600">
          Catalog file not found. Generate it via:
        </p>
        <pre className="text-xs bg-slate-50 border border-slate-200 rounded p-3 overflow-x-auto">
          node scripts/dev/endpoint-catalog/generate.js --repo-root . --out-dir docs/api --allowlist
          docs/api/endpoint-allowlist.json
        </pre>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-slate-100">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-[center] sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Endpoint Catalog</h1>
            <p className="text-sm text-slate-400">
              Letzte Version: {versionInfo?.version ?? 'v0.6'}
            </p>
          </div>
          <div className="text-sm text-slate-300 space-y-1">
            <p>
              Commit:{' '}
              <span className="font-mono">
                {versionInfo?.commitHashShort ?? versionInfo?.commitSha ?? 'unknown'}
              </span>
            </p>
            <p>
              Generated:{' '}
              <span className="font-mono">
                {versionInfo?.generatedAt ?? 'unknown'}
              </span>
            </p>
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-3 text-sm">
          <a
            href="/version.json"
            className="inline-flex items-[center] rounded-md border border-slate-700 px-3 py-1.5 text-slate-200 hover:bg-slate-800"
          >
            /version.json
          </a>
          <a
            href="/dev/endpoint-catalog.json"
            className="inline-flex items-[center] rounded-md border border-slate-700 px-3 py-1.5 text-slate-200 hover:bg-slate-800"
          >
            /dev/endpoint-catalog.json
          </a>
          {versionInfo?.baseUrl ? (
            <span className="text-xs text-slate-400">Base: {versionInfo.baseUrl}</span>
          ) : null}
        </div>
      </div>

      <EndpointCatalogClient catalog={catalog} />
    </div>
  )
}
