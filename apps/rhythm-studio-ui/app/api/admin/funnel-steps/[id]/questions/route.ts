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
import {
  FunnelQuestionnaireConfigSchema,
  QuestionConfigSchema,
} from '@/lib/contracts/funnelManifest'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const requestId = getRequestId(request)

  try {
    const { id } = await params
    const body = await request.json()

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

    const versionId = typeof body?.versionId === 'string' ? body.versionId : null
    const question = body?.question as Record<string, unknown> | undefined

    if (!versionId) {
      return withRequestId(validationErrorResponse('versionId is required'), requestId)
    }

    if (!question || typeof question !== 'object') {
      return withRequestId(validationErrorResponse('question payload is required'), requestId)
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

    const rawType = typeof question.type === 'string' ? question.type : ''
    const normalizedType = rawType.toLowerCase()

    const options = Array.isArray(question.options)
      ? question.options
          .map((opt) => ({
            value: typeof opt.value === 'string' ? opt.value : String(opt.value ?? ''),
            label: typeof opt.label === 'string' ? opt.label : String(opt.label ?? ''),
            helpText: typeof opt.helpText === 'string' ? opt.helpText : undefined,
          }))
          .filter((opt) => opt.value.length > 0 && opt.label.length > 0)
      : undefined

    const newQuestion = {
      id: typeof question.id === 'string' && question.id.trim() ? question.id.trim() : crypto.randomUUID(),
      key: typeof question.key === 'string' ? question.key.trim() : '',
      type: normalizedType,
      label: typeof question.label === 'string' ? question.label.trim() : '',
      helpText: typeof question.helpText === 'string' ? question.helpText.trim() : undefined,
      required: Boolean(question.required),
      options: normalizedType === 'radio' || normalizedType === 'checkbox' ? options : undefined,
      minValue: typeof question.minValue === 'number' ? question.minValue : undefined,
      maxValue: typeof question.maxValue === 'number' ? question.maxValue : undefined,
    }

    const validated = QuestionConfigSchema.safeParse(newQuestion)
    if (!validated.success) {
      return withRequestId(validationErrorResponse('Invalid question payload'), requestId)
    }

    const hasDuplicateKey = config.steps
      .flatMap((step) => step.questions)
      .some((q) => q.key === validated.data.key)

    if (hasDuplicateKey) {
      return withRequestId(validationErrorResponse('Question key must be unique'), requestId)
    }

    const updatedConfig = { ...config }
    updatedConfig.steps = [...config.steps]
    updatedConfig.steps[stepIndex] = {
      ...config.steps[stepIndex],
      questions: [...config.steps[stepIndex].questions, validated.data],
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

    return withRequestId(successResponse({ question: validated.data }), requestId)
  } catch (error) {
    const safeErr = sanitizeSupabaseError(error)
    console.error({ requestId, operation: 'POST /api/admin/funnel-steps/[id]/questions', error: safeErr })
    return withRequestId(internalErrorResponse(), requestId)
  }
}
