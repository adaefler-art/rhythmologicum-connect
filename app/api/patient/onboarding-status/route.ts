import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { CURRENT_CONSENT_VERSION } from '@/lib/contracts/onboarding'

type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: { code: string; message: string }
}

type OnboardingStatusData = {
  needsConsent: boolean
  needsProfile: boolean
  completed: boolean
}

function ok(data: OnboardingStatusData) {
  return NextResponse.json({ success: true, data } satisfies ApiResponse<OnboardingStatusData>)
}

function fail(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } } satisfies ApiResponse<never>,
    { status },
  )
}

export async function GET() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser()

  // 401-first: no session / no authenticated user
  if (userError || !user) {
    return fail('AUTH_REQUIRED', 'Authentication required', 401)
  }

  // Consent: user_consents row for current consent version
  const { data: consentData, error: consentError } = await supabase
    .from('user_consents')
    .select('id')
    .eq('user_id', user.id)
    .eq('consent_version', CURRENT_CONSENT_VERSION)
    .maybeSingle()

  if (consentError) {
    return fail('CONSENT_STATUS_FAILED', 'Failed to check consent status', 500)
  }

  // Profile: patient_profiles row with non-empty full_name
  const { data: profileData, error: profileError } = await supabase
    .from('patient_profiles')
    .select('id, full_name')
    .eq('user_id', user.id)
    .maybeSingle()

  if (profileError) {
    return fail('PROFILE_STATUS_FAILED', 'Failed to check profile status', 500)
  }

  const hasConsent = !!consentData
  const hasProfile = !!(profileData && profileData.full_name)

  const needsConsent = !hasConsent
  const needsProfile = !hasProfile

  return ok({
    needsConsent,
    needsProfile,
    completed: !needsConsent && !needsProfile,
  })
}
