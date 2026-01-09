import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { CURRENT_CONSENT_VERSION } from '@/lib/contracts/onboarding'

export const dynamic = 'force-dynamic'
export const revalidate = 0

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

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store, max-age=0',
  Pragma: 'no-cache',
  Expires: '0',
} as const

function ok(data: OnboardingStatusData) {
  return NextResponse.json(
    { success: true, data } satisfies ApiResponse<OnboardingStatusData>,
    { headers: NO_STORE_HEADERS },
  )
}

function fail(code: string, message: string, status: number) {
  return NextResponse.json(
    { success: false, error: { code, message } } satisfies ApiResponse<never>,
    { status, headers: NO_STORE_HEADERS },
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
    .order('consented_at', { ascending: false })
    .limit(1)

  if (consentError) {
    return fail('CONSENT_STATUS_FAILED', 'Failed to check consent status', 500)
  }

  // Profile: patient_profiles row with non-empty full_name
  const { data: profileData, error: profileError } = await supabase
    .from('patient_profiles')
    .select('id, full_name')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)

  if (profileError) {
    return fail('PROFILE_STATUS_FAILED', 'Failed to check profile status', 500)
  }

  const hasConsent = (consentData?.length ?? 0) > 0
  const firstProfile = profileData?.[0]
  const hasProfile = !!(firstProfile && (firstProfile as { full_name?: string | null }).full_name)

  const needsConsent = !hasConsent
  const needsProfile = !hasProfile

  return ok({
    needsConsent,
    needsProfile,
    completed: !needsConsent && !needsProfile,
  })
}
