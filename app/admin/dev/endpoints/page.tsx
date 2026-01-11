import { notFound, redirect } from 'next/navigation'
import { env } from '@/lib/env'
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
    isOrphan: boolean
    isAllowedOrphan: boolean
  }>
}

async function loadCatalog(): Promise<EndpointCatalog | null> {
  try {
    const catalogPath = path.join(process.cwd(), 'docs', 'api', 'endpoint-catalog.json')
    const raw = await fs.readFile(catalogPath, 'utf8')
    return JSON.parse(raw) as EndpointCatalog
  } catch {
    return null
  }
}

export default async function DevEndpointsPage() {
  if (env.DEV_ENDPOINT_CATALOG !== '1') {
    notFound()
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

  return <EndpointCatalogClient catalog={catalog} />
}
