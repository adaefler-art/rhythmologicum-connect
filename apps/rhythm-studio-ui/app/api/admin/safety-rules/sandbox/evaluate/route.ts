import { requireAdminOrClinicianRole } from '@/lib/api/authHelpers'
import {
  databaseErrorResponse,
  missingFieldsResponse,
  notFoundResponse,
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/api/responses'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { evaluateRedFlags } from '@/lib/cre/safety/redFlags'
import type { StructuredIntakeData } from '@/lib/types/clinicalIntake'
import {
  loadActiveSafetyRuleOverrides,
  loadSafetyRuleVersionById,
} from '@/lib/cre/safety/safetyRuleVersions'

export async function POST(request: Request) {
  const { user: _user, error } = await requireAdminOrClinicianRole()
  if (error || !_user) {
    return error ?? unauthorizedResponse()
  }

  try {
    const body = (await request.json()) as {
      conversation?: string | Array<{ id?: string; content?: string }>
      clinical_intake_id?: string
      rule_version_id?: string
    }

    if (!body.conversation) {
      return missingFieldsResponse('conversation is required.')
    }

    let messages: Array<{ id: string; content: string }> = []

    if (typeof body.conversation === 'string') {
      const trimmed = body.conversation.trim()
      if (!trimmed) {
        return validationErrorResponse('conversation text is empty.')
      }
      messages = [{ id: 'sandbox-1', content: trimmed }]
    } else if (Array.isArray(body.conversation)) {
      messages = body.conversation
        .map((entry, index) => ({
          id: entry.id?.trim() || `sandbox-${index + 1}`,
          content: entry.content?.trim() || '',
        }))
        .filter((entry) => entry.content.length > 0)

      if (messages.length === 0) {
        return validationErrorResponse('conversation messages are empty.')
      }
    } else {
      return validationErrorResponse('conversation must be text or array of messages.')
    }

    const admin = createAdminSupabaseClient()
    const activeOverrides = await loadActiveSafetyRuleOverrides({ supabase: admin })

    let ruleOverrides = activeOverrides

    if (body.rule_version_id) {
      const version = await loadSafetyRuleVersionById({
        supabase: admin,
        versionId: body.rule_version_id,
      })

      if (!version) {
        return notFoundResponse('Safety rule version')
      }

      ruleOverrides = {
        ...activeOverrides,
        [version.rule_key]: {
          logic: version.logic,
          defaults: version.defaults,
          version_id: version.id,
          version: version.version,
        },
      }
    }

    const structuredData = { status: 'draft' } as StructuredIntakeData

    const evaluation = evaluateRedFlags({
      structuredData,
      verbatimChatMessages: messages,
      intakeId: body.clinical_intake_id,
      ruleOverrides,
    })

    const triggeredRules = (evaluation.triggered_rules ?? []).map((rule) => ({
      rule_id: rule.rule_id,
      title: rule.title,
      level: rule.level,
      verified: rule.verified,
      evidence: rule.evidence,
      action: ruleOverrides[rule.rule_id]?.defaults?.action_default ?? null,
    }))

    return successResponse({
      triggered_rules: triggeredRules,
      escalation_level: evaluation.escalation_level,
      red_flags: evaluation.red_flags,
    })
  } catch (error) {
    console.error('Error in POST /api/admin/safety-rules/sandbox/evaluate:', error)
    return databaseErrorResponse('Failed to evaluate safety rules in sandbox.')
  }
}
