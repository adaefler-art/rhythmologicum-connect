import { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getCurrentStep } from '@/lib/navigation/assessmentNavigation'
import {
  successResponse,
  missingFieldsResponse,
  unauthorizedResponse,
  notFoundResponse,
  invalidInputResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
import {
  logUnauthorized,
  logDatabaseError,
} from '@/lib/logging/logger'

/**
 * B5/B8: Start a new assessment for a funnel
 * 
 * POST /api/funnels/[slug]/assessments
 * 
 * Creates a new assessment for the authenticated patient and returns
 * the assessment ID and first step information.
 * 
 * Response (B8 standardized):
 * {
 *   success: true,
 *   data: {
 *     assessmentId: string,
 *     status: 'in_progress',
 *     currentStep: { stepId, title, type, ... }
 *   }
 * }
 */

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  try {
    const { slug } = await context.params

    // Validate slug parameter
    if (!slug) {
      return missingFieldsResponse('Funnel-Slug fehlt.')
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
      logUnauthorized({
        endpoint: `/api/funnels/${slug}/assessments`,
      })
      return unauthorizedResponse()
    }

    // Get patient profile
    const { data: patientProfile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !patientProfile) {
      logDatabaseError(
        {
          userId: user.id,
          endpoint: `/api/funnels/${slug}/assessments`,
        },
        profileError,
      )
      return notFoundResponse('Benutzerprofil')
    }

    // Load funnel by slug and verify it's active
    const { data: funnel, error: funnelError } = await supabase
      .from('funnels')
      .select('id, title, is_active')
      .eq('slug', slug)
      .single()

    if (funnelError || !funnel) {
      logDatabaseError(
        {
          userId: user.id,
          endpoint: `/api/funnels/${slug}/assessments`,
        },
        funnelError,
      )
      return notFoundResponse('Funnel')
    }

    if (!funnel.is_active) {
      return invalidInputResponse('Dieser Funnel ist nicht aktiv.')
    }

    // Create new assessment with status = in_progress
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .insert({
        patient_id: patientProfile.id,
        funnel: slug,
        funnel_id: funnel.id,
        status: 'in_progress',
      })
      .select()
      .single()

    if (assessmentError || !assessment) {
      logDatabaseError(
        {
          userId: user.id,
          endpoint: `/api/funnels/${slug}/assessments`,
        },
        assessmentError,
      )
      return internalErrorResponse('Fehler beim Erstellen des Assessments.')
    }

    // Determine first step using B3 navigation logic
    const currentStep = await getCurrentStep(supabase, assessment.id, funnel.id)

    if (!currentStep) {
      logDatabaseError(
        {
          userId: user.id,
          assessmentId: assessment.id,
          endpoint: `/api/funnels/${slug}/assessments`,
        },
        new Error('Failed to determine first step'),
      )
      return internalErrorResponse('Fehler beim Ermitteln des ersten Schritts.')
    }

    // Return success response
    return successResponse(
      {
        assessmentId: assessment.id,
        status: assessment.status,
        currentStep: {
          stepId: currentStep.stepId,
          title: currentStep.title,
          type: currentStep.type,
          orderIndex: currentStep.orderIndex,
          stepIndex: currentStep.stepIndex,
        },
      },
      201,
    )
  } catch (error) {
    logDatabaseError(
      {
        endpoint: 'POST /api/funnels/[slug]/assessments',
      },
      error,
    )
    return internalErrorResponse()
  }
}
