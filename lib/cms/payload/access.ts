import 'server-only'

import type { NextRequest } from 'next/server'
import { getCurrentUser, getUserRole, hasAdminOrClinicianRole } from '@/lib/db/supabase.server'
import type { UserRole } from '@/lib/contracts/registry'

export type CmsAccessContext = {
  authorized: boolean
  authMode: 'secret' | 'role' | 'none'
  actorUserId?: string
  actorRole?: UserRole
  errorCode?: 'UNAUTHORIZED' | 'FORBIDDEN' | 'CONFIGURATION_ERROR'
  errorMessage?: string
}

type CmsAccessOptions = {
  headerName?: string
  secretValue?: string
  allowRoleAccess?: boolean
}

function hasValidSecret(request: NextRequest, headerName: string, secretValue?: string): boolean {
  if (!secretValue) {
    return false
  }

  const provided = request.headers.get(headerName)
  return !!provided && provided === secretValue
}

export async function resolveCmsAccess(
  request: NextRequest,
  options: CmsAccessOptions,
): Promise<CmsAccessContext> {
  const headerName = options.headerName ?? 'x-cms-secret'

  if (hasValidSecret(request, headerName, options.secretValue)) {
    return {
      authorized: true,
      authMode: 'secret',
    }
  }

  if (!options.allowRoleAccess) {
    return {
      authorized: false,
      authMode: 'none',
      errorCode: 'UNAUTHORIZED',
      errorMessage: 'Missing or invalid secret',
    }
  }

  const hasRole = await hasAdminOrClinicianRole()
  if (!hasRole) {
    return {
      authorized: false,
      authMode: 'none',
      errorCode: 'FORBIDDEN',
      errorMessage: 'Clinician or admin role required',
    }
  }

  const user = await getCurrentUser()
  const role = await getUserRole()

  return {
    authorized: true,
    authMode: 'role',
    actorUserId: user?.id,
    actorRole: (role as UserRole | null) ?? undefined,
  }
}
