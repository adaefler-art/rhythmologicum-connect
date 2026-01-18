import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { markDashboardVisited } from '@/lib/utils/dashboardFirstPolicy'
import DashboardClient from './client'

export const dynamic = 'force-dynamic'

/**
 * Patient Dashboard Page (E6.4.2, E6.5.1)
 * 
 * Landing page after onboarding completion.
 * Shows next steps for patient (start/continue assessments).
 * 
 * E6.5.1: Dashboard-first entry point - marks dashboard as visited
 * 
 * Route: /patient/dashboard
 */
export default async function PatientDashboardPage() {
  // STEP 1: Create Supabase server client
  let supabase
  try {
    supabase = await createServerSupabaseClient()
    console.log('[PATIENT_DASHBOARD] STEP=createSupabaseClient success=true')
  } catch (err) {
    // Fail-closed: configuration error → redirect to login with error marker
    console.error('[PATIENT_DASHBOARD] STEP=createSupabaseClient success=false', {
      errorType: err instanceof Error ? err.name : 'unknown',
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    redirect('/?error=configuration_error')
  }

  // STEP 2: Check authentication (AC3: 401-first, no DB calls before auth)
  let user
  try {
    const { data, error } = await supabase.auth.getUser()
    user = data?.user
    console.log('[PATIENT_DASHBOARD] STEP=getUser success=true', {
      hasUser: !!user,
      hasError: !!error,
    })
    if (error) {
      console.error('[PATIENT_DASHBOARD] STEP=getUser authError', {
        errorMessage: error.message,
      })
    }
  } catch (err) {
    // Auth service error → redirect to login
    console.error('[PATIENT_DASHBOARD] STEP=getUser success=false', {
      errorType: err instanceof Error ? err.name : 'unknown',
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    redirect('/?error=auth_error')
  }

  if (!user) {
    console.log('[PATIENT_DASHBOARD] STEP=redirect reason=noUser')
    redirect('/')
  }

  // STEP 3: E6.5.1 AC1: Mark dashboard as visited for this session
  // This allows subsequent navigation to funnels/results
  try {
    await markDashboardVisited()
    console.log('[PATIENT_DASHBOARD] STEP=markDashboardVisited success=true')
  } catch (err) {
    // Cookie error is non-fatal: log but continue
    console.error('[PATIENT_DASHBOARD] STEP=markDashboardVisited success=false', {
      errorType: err instanceof Error ? err.name : 'unknown',
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    // Continue rendering - dashboard visit tracking is not critical
  }

  // STEP 4: Render client component
  console.log('[PATIENT_DASHBOARD] STEP=render')
  return <DashboardClient />
}
