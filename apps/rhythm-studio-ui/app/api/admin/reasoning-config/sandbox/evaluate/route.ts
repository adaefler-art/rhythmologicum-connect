import { requireAdminOrClinicianRole } from '@/lib/api/authHelpers'
import {
  databaseErrorResponse,
  missingFieldsResponse,
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/api/responses'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { generateReasoningPack } from '@/lib/cre/reasoning/engine'
import {
  loadActiveClinicalReasoningConfig,
  loadClinicalReasoningConfigById,
} from '@/lib/cre/reasoning/configStore'
import type { StructuredIntakeData } from '@/lib/types/clinicalIntake'

const summarizeDifferences = (params: {
  active: ReturnType<typeof generateReasoningPack>
  selected: ReturnType<typeof generateReasoningPack>
}) => {
  const activeLabels = params.active.differentials.map((entry) => entry.label)
  const selectedLabels = params.selected.differentials.map((entry) => entry.label)

  return {
    risk_level_changed: params.active.risk_estimation.level !== params.selected.risk_estimation.level,
    active_only_differentials: activeLabels.filter((label) => !selectedLabels.includes(label)),
    selected_only_differentials: selectedLabels.filter((label) => !activeLabels.includes(label)),
    open_question_count_delta:
      params.selected.open_questions.length - params.active.open_questions.length,
  }
}

export async function POST(request: Request) {
  const { user: _user, error } = await requireAdminOrClinicianRole()
  if (error || !_user) {
    return error ?? unauthorizedResponse()
  }

  try {
    const body = (await request.json()) as {
      intake_json?: unknown
      version_id?: string
    }

    if (!body.intake_json || typeof body.intake_json !== 'object') {
      return missingFieldsResponse('intake_json is required.')
    }

    const intake = body.intake_json as StructuredIntakeData
    const admin = createAdminSupabaseClient()

    const active = await loadActiveClinicalReasoningConfig({ supabase: admin })
    if (!active) {
      return validationErrorResponse('No active reasoning config found.')
    }

    const activeResult = generateReasoningPack(intake, active.config_json)

    if (!body.version_id) {
      return successResponse({
        active_result: activeResult,
        selected_result: null,
        differences: null,
      })
    }

    const selected = await loadClinicalReasoningConfigById({
      supabase: admin,
      id: body.version_id,
    })

    if (!selected) {
      return validationErrorResponse('Selected reasoning config version not found.')
    }

    const selectedResult = generateReasoningPack(intake, selected.config_json)

    return successResponse({
      active_result: activeResult,
      selected_result: selectedResult,
      differences: summarizeDifferences({ active: activeResult, selected: selectedResult }),
    })
  } catch (error) {
    console.error('Error in POST /api/admin/reasoning-config/sandbox/evaluate:', error)
    return databaseErrorResponse('Failed to evaluate reasoning sandbox.')
  }
}
