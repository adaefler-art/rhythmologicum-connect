import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import DashboardV2Client from './client'

export const dynamic = 'force-dynamic'

/**
 * Patient Dashboard v2 Page
 * 
 * Modern mobile-first dashboard using mobile-v2 design system.
 * Displays health metrics, quick actions, and wellness overview.
 * 
 * Features:
 * - Time-based greeting
 * - Overall health score visualization
 * - AMY Assistant CTA
 * - Health metrics grid (Heart Rate, Sleep, Activity, Stress)
 * - Quick actions (Assessment, History, Appointments)
 * - Weekly activity trend chart
 * - Upcoming appointment card
 * 
 * Route: /patient/dashboard-v2
 */
export default async function DashboardV2Page() {
  console.log('[DASHBOARD_V2] STEP=pageRender start=true')

  // ==========================================
  // STEP 1: CREATE SUPABASE CLIENT
  // ==========================================
  let supabase
  try {
    supabase = await createServerSupabaseClient()
    console.log('[DASHBOARD_V2] STEP=createSupabaseClient success=true')
  } catch (err) {
    console.error('[DASHBOARD_V2] STEP=createSupabaseClient success=false', {
      errorType: err instanceof Error ? err.name : 'unknown',
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    redirect('/?error=configuration_error')
  }

  // ==========================================
  // STEP 2: CHECK AUTHENTICATION
  // ==========================================
  let user
  try {
    const { data, error } = await supabase.auth.getUser()
    user = data?.user
    console.log('[DASHBOARD_V2] STEP=getUser success=true', {
      hasUser: !!user,
      hasError: !!error,
    })
    
    if (error) {
      console.error('[DASHBOARD_V2] STEP=getUser authError', {
        errorMessage: error.message,
      })
    }
  } catch (err) {
    console.error('[DASHBOARD_V2] STEP=getUser success=false', {
      errorType: err instanceof Error ? err.name : 'unknown',
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    redirect('/?error=auth_error')
  }

  if (!user) {
    console.log('[DASHBOARD_V2] STEP=redirect reason=noUser')
    redirect('/')
  }

  // ==========================================
  // STEP 3: FETCH USER DATA (OPTIONAL)
  // ==========================================
  // For now, we're using fixture data in the client component
  // In the future, fetch real user health data here
  try {
    console.log('[DASHBOARD_V2] STEP=fetchUserData userId=%s', user.id)
    // TODO: Fetch user health metrics, appointments, assessments
    // const { data: userData, error: userError } = await supabase
    //   .from('user_health_metrics')
    //   .select('*')
    //   .eq('user_id', user.id)
    //   .single()
  } catch (err) {
    // Non-fatal: use fixture data on error
    console.error('[DASHBOARD_V2] STEP=fetchUserData success=false', {
      errorType: err instanceof Error ? err.name : 'unknown',
      errorMessage: err instanceof Error ? err.message : String(err),
    })
  }

  // ==========================================
  // STEP 4: RENDER CLIENT COMPONENT
  // ==========================================
  console.log('[DASHBOARD_V2] STEP=render success=true')
  
  // Pass props to control states for testing:
  // - initialLoading: show loading skeleton
  // - hasError: show error state
  // - isEmpty: show empty state
  return <DashboardV2Client />
}
