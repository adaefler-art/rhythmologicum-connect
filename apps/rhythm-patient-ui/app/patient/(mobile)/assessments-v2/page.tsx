import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import AssessmentsV2Client from './client'

export const dynamic = 'force-dynamic'

/**
 * Assessments Overview v2 Page
 * 
 * Modern mobile-first assessments overview using mobile-v2 design system.
 * Displays filterable list of available assessments with status and progress.
 * 
 * Features:
 * - Overall progress card showing completion percentage
 * - Filter chips: All / Not started / In progress / Completed
 * - Assessment cards with status, duration, progress, and CTA
 * - Loading, empty, and error states
 * - Demo fixture data for development
 * 
 * Route: /patient/assessments-v2
 */
export default async function AssessmentsV2Page() {
  console.log('[ASSESSMENTS_V2] STEP=pageRender start=true')

  // ==========================================
  // STEP 1: CREATE SUPABASE CLIENT
  // ==========================================
  let supabase
  try {
    supabase = await createServerSupabaseClient()
    console.log('[ASSESSMENTS_V2] STEP=createSupabaseClient success=true')
  } catch (err) {
    console.error('[ASSESSMENTS_V2] STEP=createSupabaseClient success=false', {
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
    console.log('[ASSESSMENTS_V2] STEP=getUser success=true', {
      hasUser: !!user,
      hasError: !!error,
    })
    
    if (error) {
      console.error('[ASSESSMENTS_V2] STEP=getUser authError', {
        errorMessage: error.message,
      })
    }
  } catch (err) {
    console.error('[ASSESSMENTS_V2] STEP=getUser success=false', {
      errorType: err instanceof Error ? err.name : 'unknown',
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    redirect('/?error=auth_error')
  }

  if (!user) {
    console.log('[ASSESSMENTS_V2] STEP=redirect reason=noUser')
    redirect('/')
  }

  // ==========================================
  // STEP 3: FETCH ASSESSMENTS DATA (OPTIONAL)
  // ==========================================
  // For now, we're using fixture data in the client component
  // In the future, fetch real user assessment data here
  try {
    console.log('[ASSESSMENTS_V2] STEP=fetchAssessments userId=%s', user.id)
    // TODO: Fetch user assessments from database
    // const { data: assessments, error: assessmentsError } = await supabase
    //   .from('assessments')
    //   .select('*')
    //   .eq('user_id', user.id)
  } catch (err) {
    // Non-fatal: use fixture data on error
    console.error('[ASSESSMENTS_V2] STEP=fetchAssessments success=false', {
      errorType: err instanceof Error ? err.name : 'unknown',
      errorMessage: err instanceof Error ? err.message : String(err),
    })
  }

  // ==========================================
  // STEP 4: RENDER CLIENT COMPONENT
  // ==========================================
  console.log('[ASSESSMENTS_V2] STEP=render success=true')
  
  return <AssessmentsV2Client />
}
