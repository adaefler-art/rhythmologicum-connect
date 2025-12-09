import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getCurrentStep } from '@/lib/navigation/assessmentNavigation'
import {
  successResponse,
  missingFieldsResponse,
  unauthorizedResponse,
  notFoundResponse,
  forbiddenResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
import {
  logUnauthorized,
  logForbidden,
  logDatabaseError,
} from '@/lib/logging/logger'

/**
 * B5/B8: Get assessment status and current step
 * 
 * GET /api/funnels/[slug]/assessments/[assessmentId]
 * 
 * Returns the current status of an assessment including:
 * - Assessment status (in_progress, completed)
 * - Current step information
 * - Number of completed steps
 * - Total steps in funnel
 * 
 * Response (B8 standardized):
 * {
 *   success: true,
 *   data: {
 *     assessmentId: string,
 *     status: 'in_progress' | 'completed',
 *     currentStep: { stepId, title, type, stepIndex, orderIndex },
 *     completedSteps: number,
 *     totalSteps: number
 *   }
 * }
 */

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string; assessmentId: string }> },
) {
  let slug: string | undefined
  let assessmentId: string | undefined

  try {
    const paramsResolved = await params
    slug = paramsResolved.slug
    assessmentId = paramsResolved.assessmentId

    // Validate parameters
    if (!slug || !assessmentId) {
      return missingFieldsResponse('Funnel-Slug oder Assessment-ID fehlt.')
    }

    // Create Supabase server client
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          },
        },
      },
    )

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      logUnauthorized({ endpoint: `/api/funnels/${slug}/assessments/${assessmentId}`, assessmentId })
      return unauthorizedResponse()
    }

    // Get patient profile
    const { data: patientProfile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !patientProfile) {
      logDatabaseError({ userId: user.id, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}` }, profileError)
      return notFoundResponse('Benutzerprofil')
    }

    // Load assessment and verify ownership
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, patient_id, funnel, funnel_id, status, started_at, completed_at')
      .eq('id', assessmentId)
      .eq('funnel', slug)
      .single()

    if (assessmentError || !assessment) {
      logDatabaseError({ userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}` }, assessmentError)
      return notFoundResponse('Assessment')
    }

    // Verify ownership
    if (assessment.patient_id !== patientProfile.id) {
      logForbidden({ userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}` }, 'Assessment does not belong to user')
      return forbiddenResponse('Sie haben keine Berechtigung, dieses Assessment anzusehen.')
    }

    // Get funnel info (self-heal legacy rows missing funnel_id)
    if (!assessment.funnel_id) {
      const { data: funnelRow, error: funnelLookupError } = await supabase
        .from('funnels')
        .select('id')
        .eq('slug', slug)
        .single()

      if (funnelLookupError || !funnelRow?.id) {
        return internalErrorResponse('Funnel-ID fehlt im Assessment.')
      }

      const { error: repairError } = await supabase
        .from('assessments')
        .update({ funnel_id: funnelRow.id })
        .eq('id', assessment.id)

      if (repairError) {
        return internalErrorResponse('Funnel-ID fehlt im Assessment.')
      }

      assessment.funnel_id = funnelRow.id
    }

    // Get total steps count
    const { data: steps, error: stepsError } = await supabase
      .from('funnel_steps')
      .select('id, order_index')
      .eq('funnel_id', assessment.funnel_id)
      .order('order_index', { ascending: true })

    if (stepsError || !steps) {
      logDatabaseError({ userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}` }, stepsError)
      return internalErrorResponse('Fehler beim Laden der Schritte.')
    }

    const totalSteps = steps.length

    // Determine current step using B3 navigation logic
    const currentStep = await getCurrentStep(supabase, assessmentId, assessment.funnel_id)

    if (!currentStep) {
      logDatabaseError({ userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}` }, new Error('Failed to determine current step'))
      return internalErrorResponse('Fehler beim Ermitteln des aktuellen Schritts.')
    }

    // Count completed steps (steps before current step where all required questions are answered)
    const completedSteps = currentStep.stepIndex

    // Return success response
    return successResponse({
      assessmentId: assessment.id,
      status: assessment.status,
      currentStep: {
        stepId: currentStep.stepId,
        title: currentStep.title,
        type: currentStep.type,
        stepIndex: currentStep.stepIndex,
        orderIndex: currentStep.orderIndex,
      },
      completedSteps,
      totalSteps,
    })
  } catch (error) {
    logDatabaseError({ assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}` }, error)
    return internalErrorResponse()
  }
}
