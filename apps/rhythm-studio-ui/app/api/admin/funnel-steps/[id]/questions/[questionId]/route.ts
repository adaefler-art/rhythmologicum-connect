import { NextRequest } from 'next/server'
import {
  configurationErrorResponse,
  forbiddenResponse,
  internalErrorResponse,
  notFoundResponse,
  schemaNotReadyResponse,
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
} from '@/lib/api/responses'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import {
  classifySupabaseError,
  sanitizeSupabaseError,
  getRequestId,
  withRequestId,
  isBlank,
} from '@/lib/db/errors'
import { env } from '@/lib/env'
import { FunnelQuestionnaireConfigSchema } from '@/lib/contracts/funnelManifest'

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; questionId: string }> },
) {
  const requestId = getRequestId(request)

  try {
    const { id, questionId } = await params
    const url = new URL(request.url)
    const versionId = url.searchParams.get('versionId')

    if (isBlank(env.NEXT_PUBLIC_SUPABASE_URL) || isBlank(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      return withRequestId(
        configurationErrorResponse(
          'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
        ),
        requestId,
      )
    }

    const authClient = await createServerSupabaseClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return withRequestId(unauthorizedResponse(), requestId)
    }

    const role = user.app_metadata?.role || user.user_metadata?.role
    const isAuthorized = role === 'clinician' || role === 'admin'
    if (!isAuthorized) {
      return withRequestId(forbiddenResponse(), requestId)
    }

    if (!versionId) {
      return withRequestId(validationErrorResponse('versionId is required'), requestId)
    }

    const adminClient = createAdminSupabaseClient()

    const { data: version, error: versionError } = await (adminClient as any)
      .from('funnel_versions')
      .select('id, questionnaire_config')
      .eq('id', versionId)
      .single()

    if (versionError) {
      const safeErr = sanitizeSupabaseError(versionError)
      const classified = classifySupabaseError(safeErr)

      if (classified.kind === 'SCHEMA_NOT_READY') {
        return withRequestId(schemaNotReadyResponse(), requestId)
      }

      if (safeErr.code === 'PGRST116') {
        return withRequestId(notFoundResponse('Funnel version'), requestId)
      }

      return withRequestId(internalErrorResponse('Failed to load funnel version.'), requestId)
    }

    const parsedConfig = FunnelQuestionnaireConfigSchema.safeParse(version.questionnaire_config)
    if (!parsedConfig.success) {
      return withRequestId(
        validationErrorResponse('Invalid questionnaire_config on funnel version'),
        requestId,
      )
    }

    const config = parsedConfig.data
    const stepIndex = config.steps.findIndex((step) => step.id === id)
    if (stepIndex === -1) {
      return withRequestId(notFoundResponse('Funnel step'), requestId)
    }

    const questions = config.steps[stepIndex].questions
    const nextQuestions = questions.filter((question) => question.id !== questionId)

    if (nextQuestions.length === questions.length) {
      return withRequestId(notFoundResponse('Question'), requestId)
    }

    const updatedConfig = { ...config }
    updatedConfig.steps = [...config.steps]
    updatedConfig.steps[stepIndex] = {
      ...config.steps[stepIndex],
      questions: nextQuestions,
    }

    const { error: updateError } = await (adminClient as any)
      .from('funnel_versions')
      .update({
        questionnaire_config: updatedConfig,
        updated_at: new Date().toISOString(),
      })
      .eq('id', versionId)

    if (updateError) {
      const safeErr = sanitizeSupabaseError(updateError)
      const classified = classifySupabaseError(safeErr)

      if (classified.kind === 'SCHEMA_NOT_READY') {
        return withRequestId(schemaNotReadyResponse(), requestId)
      }

      return withRequestId(internalErrorResponse('Failed to update questionnaire_config.'), requestId)
    }

    return withRequestId(successResponse({ questionId }), requestId)
  } catch (error) {
    const safeErr = sanitizeSupabaseError(error)
    console.error({ requestId, operation: 'DELETE /api/admin/funnel-steps/[id]/questions/[questionId]', error: safeErr })
    return withRequestId(internalErrorResponse(), requestId)
  }
}
