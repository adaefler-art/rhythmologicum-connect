import { requireAdminOrClinicianRole } from '@/lib/api/authHelpers'
import {
  databaseErrorResponse,
  successResponse,
  unauthorizedResponse,
} from '@/lib/api/responses'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { loadAllClinicalReasoningConfigs } from '@/lib/cre/reasoning/configStore'

export async function GET() {
  const { user: _user, error } = await requireAdminOrClinicianRole()
  if (error || !_user) {
    return error ?? unauthorizedResponse()
  }

  try {
    const admin = createAdminSupabaseClient()
    const versions = await loadAllClinicalReasoningConfigs({ supabase: admin })
    const activeVersion = versions.find((version) => version.status === 'active') ?? null

    return successResponse({
      active_version: activeVersion,
      latest_change: versions[0]?.created_at ?? null,
      versions,
    })
  } catch (error) {
    console.error('Error in GET /api/admin/reasoning-config:', error)
    return databaseErrorResponse('Failed to load clinical reasoning config.')
  }
}
