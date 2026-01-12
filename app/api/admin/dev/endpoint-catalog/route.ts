import { NextRequest } from 'next/server'
import path from 'path'
import fs from 'fs/promises'

import {
  forbiddenResponse,
  internalErrorResponse,
  notFoundResponse,
  unauthorizedResponse,
} from '@/lib/api/responses'
import { getCurrentUser } from '@/lib/db/supabase.server'
import { isDevEndpointCatalogEnabled } from '@/lib/env'
import { logError, logForbidden, logUnauthorized } from '@/lib/logging/logger'

export async function GET(_request: NextRequest) {
  // Feature flag gate (404 by design)
  if (!isDevEndpointCatalogEnabled()) {
    return notFoundResponse('Resource')
  }

  // Auth gate (401-first)
  const user = await getCurrentUser()
  if (!user) {
    logUnauthorized({ endpoint: '/api/admin/dev/endpoint-catalog' })
    return unauthorizedResponse()
  }

  // Authorization gate (admin-only)
  const role = user.app_metadata?.role || user.user_metadata?.role
  if (role !== 'admin') {
    logForbidden(
      { endpoint: '/api/admin/dev/endpoint-catalog', userId: user.id, role },
      'non-admin user',
    )
    return forbiddenResponse()
  }

  // Fail closed: no filesystem access until after flag+auth+role gates.
  const catalogPath = path.join(process.cwd(), 'docs', 'api', 'endpoint-catalog.json')

  try {
    const raw = await fs.readFile(catalogPath, 'utf8')
    return new Response(raw, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
      },
    })
  } catch (error: unknown) {
    const err = error as NodeJS.ErrnoException

    if (err?.code === 'ENOENT') {
      return internalErrorResponse(
        'Endpoint catalog file missing at docs/api/endpoint-catalog.json. Generate it via: node scripts/dev/endpoint-catalog/generate.js --repo-root . --out-dir docs/api --allowlist docs/api/endpoint-allowlist.json',
      )
    }

    logError('Failed to read endpoint catalog file', { endpoint: '/api/admin/dev/endpoint-catalog' }, error)
    return internalErrorResponse('Failed to read endpoint catalog file.')
  }
}
