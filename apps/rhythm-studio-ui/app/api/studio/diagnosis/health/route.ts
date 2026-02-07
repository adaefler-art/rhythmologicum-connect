import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { isFeatureEnabled } from '@/lib/featureFlags'

const newRequestId = () => `${Math.random().toString(16).slice(2)}-${Date.now().toString(16)}`

export async function GET() {
  const requestId = newRequestId()
  const headers = { 'x-request-id': requestId }

  const diagnosisEnabled = isFeatureEnabled('DIAGNOSIS_ENABLED')
  if (!diagnosisEnabled) {
    return NextResponse.json(
      {
        success: false,
        status: 'disabled',
        requestId,
        error: {
          code: 'FEATURE_DISABLED',
          message: 'Diagnosis feature is not enabled',
        },
      },
      { status: 503, headers },
    )
  }

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      {
        success: false,
        status: 'unauthorized',
        requestId,
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication required',
        },
      },
      { status: 401, headers },
    )
  }

  const userRole = user.app_metadata?.role
  const isAuthorized = userRole === 'clinician' || userRole === 'admin'

  if (!isAuthorized) {
    return NextResponse.json(
      {
        success: false,
        status: 'forbidden',
        requestId,
        error: {
          code: 'FORBIDDEN',
          message: 'Only clinicians and admins can access diagnosis',
        },
      },
      { status: 403, headers },
    )
  }

  return NextResponse.json(
    {
      success: true,
      status: 'available',
      requestId,
    },
    { status: 200, headers },
  )
}
