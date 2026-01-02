import { NextRequest } from 'next/server'
import {
  configurationErrorResponse,
  databaseErrorResponse,
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
import { classifySupabaseError, sanitizeSupabaseError, getRequestId, withRequestId, isBlank, logError } from '@/lib/db/errors'
import { env } from '@/lib/env'

/**
 * B7 API Endpoint: Get funnel details with steps and questions
 * GET /api/admin/funnels/[id]
 * 
 * Returns complete funnel structure with all steps and questions
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request)
  
  try {
    const { id } = await params

    // Check Supabase configuration
    if (isBlank(env.NEXT_PUBLIC_SUPABASE_URL) || isBlank(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      return withRequestId(
        configurationErrorResponse(
          'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
        ),
        requestId,
      )
    }

    // Auth gate (must run before any DB calls)
    const authClient = await createServerSupabaseClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return withRequestId(unauthorizedResponse(), requestId)
    }

    // Authorization gate (clinician/admin)
    const role = user.app_metadata?.role || user.user_metadata?.role
    const isAuthorized = role === 'clinician' || role === 'admin'
    if (!isAuthorized) {
      return withRequestId(forbiddenResponse(), requestId)
    }

    // Prefer admin client for cross-user metadata queries, but fall back to auth client
    // if the service role key is missing/invalid.
    let readClient: ReturnType<typeof createAdminSupabaseClient> | Awaited<ReturnType<typeof createServerSupabaseClient>>
    let usingAdminClient = false
    try {
      readClient = createAdminSupabaseClient()
      usingAdminClient = true
    } catch (err) {
      logError({
        requestId,
        operation: 'create_admin_client',
        userId: user.id,
        error: err,
      })
      readClient = authClient
    }

    const maybeFallbackClient = async (operation: string, error: unknown) => {
      if (!usingAdminClient) return false
      const classified = classifySupabaseError(error)
      if (classified.kind !== 'CONFIGURATION_ERROR') return false

      logError({
        requestId,
        operation,
        userId: user.id,
        error,
      })

      usingAdminClient = false
      readClient = authClient
      return true
    }

    // Fetch funnel
    let { data: funnel, error: funnelError } = await readClient
      .from('funnels')
      .select('*')
      .eq('id', id)
      .single()

    if (funnelError && (await maybeFallbackClient('fetch_funnel_admin_fallback', funnelError))) {
      ;({ data: funnel, error: funnelError } = await readClient
        .from('funnels')
        .select('*')
        .eq('id', id)
        .single())
    }

    if (funnelError) {
      const safeErr = sanitizeSupabaseError(funnelError)
      const classified = classifySupabaseError(safeErr)

      if (classified.kind === 'SCHEMA_NOT_READY') {
        logError({ requestId, operation: 'fetch_funnel', userId: user.id, error: safeErr })
        return withRequestId(schemaNotReadyResponse(), requestId)
      }

      if (classified.kind === 'AUTH_OR_RLS') {
        logError({ requestId, operation: 'fetch_funnel', userId: user.id, error: safeErr })
        return withRequestId(forbiddenResponse(), requestId)
      }

      if (classified.kind === 'TRANSIENT') {
        logError({ requestId, operation: 'fetch_funnel', userId: user.id, error: safeErr })
        return withRequestId(databaseErrorResponse(), requestId)
      }

      if (classified.kind === 'CONFIGURATION_ERROR') {
        logError({ requestId, operation: 'fetch_funnel', userId: user.id, error: safeErr })
        return withRequestId(
          configurationErrorResponse(
            'Server-Konfigurationsfehler (Supabase). Bitte prüfen Sie URL/Keys (gleiches Projekt, keine Anführungszeichen, keine Leerzeichen/Zeilenumbrüche) und deployen Sie erneut.',
          ),
          requestId,
        )
      }

      // PGRST116 means no rows found
      if (safeErr.code === 'PGRST116') {
        return withRequestId(notFoundResponse('Funnel'), requestId)
      }

      logError({ requestId, operation: 'fetch_funnel', userId: user.id, error: safeErr })
      return withRequestId(internalErrorResponse('Failed to fetch funnel.'), requestId)
    }

    if (!funnel) {
      return withRequestId(notFoundResponse('Funnel'), requestId)
    }

    // Fetch funnel steps
    let { data: steps, error: stepsError } = await readClient
      .from('funnel_steps')
      .select('*')
      .eq('funnel_id', id)
      .order('order_index', { ascending: true })

    if (stepsError && (await maybeFallbackClient('fetch_steps_admin_fallback', stepsError))) {
      ;({ data: steps, error: stepsError } = await readClient
        .from('funnel_steps')
        .select('*')
        .eq('funnel_id', id)
        .order('order_index', { ascending: true }))
    }

    if (stepsError) {
      const safeErr = sanitizeSupabaseError(stepsError)
      const classified = classifySupabaseError(safeErr)

      if (classified.kind === 'SCHEMA_NOT_READY') {
        logError({ requestId, operation: 'fetch_steps', userId: user.id, error: safeErr })
        return withRequestId(schemaNotReadyResponse(), requestId)
      }

      if (classified.kind === 'AUTH_OR_RLS') {
        logError({ requestId, operation: 'fetch_steps', userId: user.id, error: safeErr })
        return withRequestId(forbiddenResponse(), requestId)
      }

      if (classified.kind === 'TRANSIENT') {
        logError({ requestId, operation: 'fetch_steps', userId: user.id, error: safeErr })
        return withRequestId(databaseErrorResponse(), requestId)
      }

      if (classified.kind === 'CONFIGURATION_ERROR') {
        logError({ requestId, operation: 'fetch_steps', userId: user.id, error: safeErr })
        return withRequestId(
          configurationErrorResponse(
            'Server-Konfigurationsfehler (Supabase). Bitte prüfen Sie URL/Keys (gleiches Projekt, keine Anführungszeichen, keine Leerzeichen/Zeilenumbrüche) und deployen Sie erneut.',
          ),
          requestId,
        )
      }

      logError({ requestId, operation: 'fetch_steps', userId: user.id, error: safeErr })
      return withRequestId(internalErrorResponse('Failed to fetch steps.'), requestId)
    }

    // For each step, fetch questions and content pages
    const stepsWithQuestions = await Promise.all(
      (steps || []).map(async (step) => {
        // Fetch content page if this is a content_page step
        let contentPage = null
        if (step.type === 'content_page' && step.content_page_id) {
          const { data: cpData } = await readClient
            .from('content_pages')
            .select('id, slug, title, excerpt, status')
            .eq('id', step.content_page_id)
            .single()
          contentPage = cpData
        }

        const { data: stepQuestions, error: stepQuestionsError } = await readClient
          .from('funnel_step_questions')
          .select('*')
          .eq('funnel_step_id', step.id)
          .order('order_index', { ascending: true })

        if (stepQuestionsError) {
          const safeErr = sanitizeSupabaseError(stepQuestionsError)
          console.error({ requestId, operation: 'fetch_step_questions', stepId: step.id, supabaseError: safeErr })
          return { ...step, questions: [], content_page: contentPage }
        }

        const questionIds = (stepQuestions || []).map((sq) => sq.question_id)

        if (questionIds.length === 0) {
          return { ...step, questions: [], content_page: contentPage }
        }

        const { data: questions, error: questionsError } = await readClient
          .from('questions')
          .select('*')
          .in('id', questionIds)

        if (questionsError) {
          const safeErr = sanitizeSupabaseError(questionsError)
          console.error({ requestId, operation: 'fetch_questions', stepId: step.id, supabaseError: safeErr })
          return { ...step, questions: [], content_page: contentPage }
        }

        // Combine questions with metadata
        const questionsWithMeta = (stepQuestions || [])
          .map((sq) => {
            const question = (questions || []).find((q) => q.id === sq.question_id)
            if (!question) return null

            return {
              ...question,
              funnel_step_question_id: sq.id,
              is_required: sq.is_required,
              order_index: sq.order_index,
            }
          })
          .filter((q) => q !== null)

        return {
          ...step,
          questions: questionsWithMeta,
          content_page: contentPage,
        }
      })
    )

    return withRequestId(
      successResponse({
        funnel,
        steps: stepsWithQuestions,
      }),
      requestId,
    )
  } catch (error) {
    const safeErr = sanitizeSupabaseError(error)
    console.error({ requestId, operation: 'GET /api/admin/funnels/[id]', error: safeErr })
    return withRequestId(internalErrorResponse(), requestId)
  }
}

/**
 * B7 API Endpoint: Update funnel is_active status or content fields
 * PATCH /api/admin/funnels/[id]
 * 
 * Body: { is_active?: boolean, title?: string, subtitle?: string, description?: string }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const requestId = getRequestId(request)
  
  try {
    const { id } = await params
    const body = await request.json()

    // Check Supabase configuration
    if (isBlank(env.NEXT_PUBLIC_SUPABASE_URL) || isBlank(env.NEXT_PUBLIC_SUPABASE_ANON_KEY)) {
      return withRequestId(
        configurationErrorResponse(
          'Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.',
        ),
        requestId,
      )
    }

    // Auth gate (must run before any DB calls)
    const authClient = await createServerSupabaseClient()
    const {
      data: { user },
    } = await authClient.auth.getUser()

    if (!user) {
      return withRequestId(unauthorizedResponse(), requestId)
    }

    // Authorization gate (clinician/admin)
    const role = user.app_metadata?.role || user.user_metadata?.role
    const isAuthorized = role === 'clinician' || role === 'admin'
    if (!isAuthorized) {
      return withRequestId(forbiddenResponse(), requestId)
    }

    // Build update object with only provided fields
    const updateData: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    }

    if (typeof body.is_active === 'boolean') {
      updateData.is_active = body.is_active
    }
    if (typeof body.title === 'string') {
      const trimmedTitle = body.title.trim()
      if (trimmedTitle.length === 0) {
        return withRequestId(
          validationErrorResponse('Title cannot be empty'),
          requestId,
        )
      }
      if (trimmedTitle.length > 255) {
        return withRequestId(
          validationErrorResponse('Title too long (max 255 characters)'),
          requestId,
        )
      }
      updateData.title = trimmedTitle
    }
    if (typeof body.subtitle === 'string') {
      const trimmedSubtitle = body.subtitle.trim()
      if (trimmedSubtitle.length > 500) {
        return withRequestId(
          validationErrorResponse('Subtitle too long (max 500 characters)'),
          requestId,
        )
      }
      updateData.subtitle = trimmedSubtitle || null
    }
    if (typeof body.description === 'string') {
      const trimmedDescription = body.description.trim()
      if (trimmedDescription.length > 2000) {
        return withRequestId(
          validationErrorResponse('Description too long (max 2000 characters)'),
          requestId,
        )
      }
      updateData.description = trimmedDescription || null
    }

    // Use admin client for cross-user update (metadata tables only)
    // Justification: Clinicians need to manage all funnels, not just their own
    let writeClient: ReturnType<typeof createAdminSupabaseClient> | Awaited<ReturnType<typeof createServerSupabaseClient>>
    let usingAdminClient = false
    try {
      writeClient = createAdminSupabaseClient()
      usingAdminClient = true
    } catch (err) {
      logError({
        requestId,
        operation: 'create_admin_client',
        userId: user.id,
        error: err,
      })
      writeClient = authClient
    }

    // Update funnel
    let { data, error } = await writeClient
      .from('funnels')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error && usingAdminClient) {
      const classified = classifySupabaseError(error)
      if (classified.kind === 'CONFIGURATION_ERROR') {
        logError({ requestId, operation: 'update_funnel_admin_fallback', userId: user.id, error })
        usingAdminClient = false
        writeClient = authClient
        ;({ data, error } = await writeClient
          .from('funnels')
          .update(updateData)
          .eq('id', id)
          .select()
          .single())
      }
    }

    if (error) {
      const safeErr = sanitizeSupabaseError(error)
      const classified = classifySupabaseError(safeErr)

      if (classified.kind === 'SCHEMA_NOT_READY') {
        logError({ requestId, operation: 'update_funnel', userId: user.id, error: safeErr })
        return withRequestId(schemaNotReadyResponse(), requestId)
      }

      if (classified.kind === 'AUTH_OR_RLS') {
        logError({ requestId, operation: 'update_funnel', userId: user.id, error: safeErr })
        return withRequestId(forbiddenResponse(), requestId)
      }

      if (classified.kind === 'TRANSIENT') {
        logError({ requestId, operation: 'update_funnel', userId: user.id, error: safeErr })
        return withRequestId(databaseErrorResponse(), requestId)
      }

      if (classified.kind === 'CONFIGURATION_ERROR') {
        logError({ requestId, operation: 'update_funnel', userId: user.id, error: safeErr })
        return withRequestId(
          configurationErrorResponse(
            'Server-Konfigurationsfehler (Supabase). Bitte prüfen Sie URL/Keys (gleiches Projekt, keine Anführungszeichen, keine Leerzeichen/Zeilenumbrüche) und deployen Sie erneut.',
          ),
          requestId,
        )
      }

      // PGRST116 means no rows found
      if (safeErr.code === 'PGRST116') {
        return withRequestId(notFoundResponse('Funnel'), requestId)
      }

      logError({ requestId, operation: 'update_funnel', userId: user.id, error: safeErr })
      return withRequestId(internalErrorResponse('Failed to update funnel.'), requestId)
    }

    return withRequestId(successResponse({ funnel: data }), requestId)
  } catch (error) {
    const safeErr = sanitizeSupabaseError(error)
    console.error({ requestId, operation: 'PATCH /api/admin/funnels/[id]', error: safeErr })
    return withRequestId(internalErrorResponse(), requestId)
  }
}
