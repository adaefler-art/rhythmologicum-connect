import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import {
  unauthorizedResponse,
  forbiddenResponse,
  notFoundResponse,
  internalErrorResponse,
  successResponse,
} from '@/lib/api/responses'
import { logUnauthorized, logForbidden, logDatabaseError } from '@/lib/logging/logger'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string; assessmentId: string }> },
) {
  const { slug, assessmentId } = await context.params

  if (!slug || !assessmentId) {
    return notFoundResponse('Assessment', 'Assessment nicht gefunden.')
  }

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

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    logUnauthorized({ endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/result`, assessmentId })
    return unauthorizedResponse()
  }

  const { data: patientProfile, error: profileError } = await supabase
    .from('patient_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (profileError || !patientProfile) {
    logDatabaseError({ userId: user.id, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/result` }, profileError)
    return notFoundResponse('Benutzerprofil')
  }

  const { data: assessment, error: assessmentError } = await supabase
    .from('assessments')
    .select('id, patient_id, funnel, completed_at, status')
    .eq('id', assessmentId)
    .eq('funnel', slug)
    .single()

  if (assessmentError) {
    logDatabaseError({ userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/result` }, assessmentError)
    return internalErrorResponse('Fehler beim Laden des Assessments.')
  }

  if (!assessment) {
    return notFoundResponse('Assessment', 'Assessment nicht gefunden.')
  }

  if (assessment.patient_id !== patientProfile.id) {
    logForbidden({ userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/result` }, 'Assessment does not belong to user')
    return forbiddenResponse('Sie haben keine Berechtigung, dieses Assessment anzusehen.')
  }

  const { data: funnelRow, error: funnelError } = await supabase
    .from('funnels')
    .select('title')
    .eq('slug', slug)
    .single()

  if (funnelError) {
    logDatabaseError({ userId: user.id, assessmentId, endpoint: `/api/funnels/${slug}/assessments/${assessmentId}/result` }, funnelError)
    return internalErrorResponse('Fehler beim Laden des Funnels.')
  }

  return NextResponse.json(
    successResponse({
      id: assessment.id,
      funnel: assessment.funnel,
      completedAt: assessment.completed_at,
      status: assessment.status,
      funnelTitle: funnelRow?.title ?? null,
    }),
  )
}
