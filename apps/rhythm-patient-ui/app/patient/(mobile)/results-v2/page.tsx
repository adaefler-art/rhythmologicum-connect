import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import ResultsV2Client from './client'

export const dynamic = 'force-dynamic'

/**
 * Results & Next Steps v2 Page
 * 
 * Modern mobile-first results page using mobile-v2 design system.
 * Displays assessment results with AMY summary, current situation, recommended actions,
 * data protection info, and next steps timeline.
 * 
 * Features:
 * - AMY summary card with AI-generated overview and gradient background
 * - Overall wellness score with circular progress indicator
 * - Current situation with bullet points (stress, sleep, activity, wellbeing)
 * - 4 recommended action cards (Download PDF, Video, Book Visit, Chat with AMY)
 * - Data protection information card
 * - "What happens next" timeline with steps
 * - Loading, empty, and error states
 * - Demo fixture data for development
 * 
 * Route: /patient/results-v2
 */
export default async function ResultsV2Page() {
  console.log('[RESULTS_V2] STEP=pageRender start=true')

  // ==========================================
  // STEP 1: CREATE SUPABASE CLIENT
  // ==========================================
  let supabase
  try {
    supabase = await createServerSupabaseClient()
    console.log('[RESULTS_V2] STEP=createSupabaseClient success=true')
  } catch (err) {
    console.error('[RESULTS_V2] STEP=createSupabaseClient success=false', {
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
    console.log('[RESULTS_V2] STEP=getUser success=true', {
      hasUser: !!user,
      hasError: !!error,
    })
    
    if (error) {
      console.error('[RESULTS_V2] STEP=getUser authError', {
        errorMessage: error.message,
      })
    }
  } catch (err) {
    console.error('[RESULTS_V2] STEP=getUser success=false', {
      errorType: err instanceof Error ? err.name : 'unknown',
      errorMessage: err instanceof Error ? err.message : String(err),
    })
    redirect('/?error=auth_error')
  }

  if (!user) {
    console.log('[RESULTS_V2] STEP=redirect reason=noUser')
    redirect('/')
  }

  // ==========================================
  // STEP 3: FETCH ASSESSMENT RESULTS (OPTIONAL)
  // ==========================================
  // For now, we're using fixture data in the client component
  // In the future, fetch real user assessment results here
  try {
    console.log('[RESULTS_V2] STEP=fetchResults userId=%s', user.id)
    // TODO: Fetch user assessment results from database
    // const { data: results, error: resultsError } = await supabase
    //   .from('assessments')
    //   .select('*, reports(*)')
    //   .eq('user_id', user.id)
    //   .order('created_at', { ascending: false })
    //   .limit(1)
    //   .single()
  } catch (err) {
    // Non-fatal: use fixture data on error
    console.error('[RESULTS_V2] STEP=fetchResults success=false', {
      errorType: err instanceof Error ? err.name : 'unknown',
      errorMessage: err instanceof Error ? err.message : String(err),
    })
  }

  // ==========================================
  // STEP 4: RENDER CLIENT COMPONENT
  // ==========================================
  console.log('[RESULTS_V2] STEP=render success=true')
  
  return <ResultsV2Client />
}
