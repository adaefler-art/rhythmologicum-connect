/**
 * Server-side queries for reports data
 * V05-I03.4: Result Screen Report Library
 */

import 'server-only'
import { createServerSupabaseClient } from '../supabase.server'

export type ReportWithAssessment = {
  id: string
  assessment_id: string
  score_numeric: number | null
  sleep_score: number | null
  risk_level: 'low' | 'moderate' | 'high' | null
  report_text_short: string | null
  created_at: string
  updated_at: string
  assessment: {
    id: string
    funnel: string
    completed_at: string | null
  } | null
}

export type KeyOutcomes = {
  score_numeric: number | null
  sleep_score: number | null
  risk_level: 'low' | 'moderate' | 'high' | null
  total_reports: number
}

/**
 * Fetch all reports for a specific assessment
 * Uses RLS - only returns reports user has access to
 * Deterministic ordering: created_at DESC, then id DESC for tie-breaking
 */
export async function getReportsForAssessment(
  assessmentId: string,
): Promise<{ data: ReportWithAssessment[] | null; error: Error | null }> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase
      .from('reports')
      .select(
        `
        id,
        assessment_id,
        score_numeric,
        sleep_score,
        risk_level,
        report_text_short,
        created_at,
        updated_at,
        assessment:assessments!assessment_id (
          id,
          funnel,
          completed_at
        )
      `,
      )
      .eq('assessment_id', assessmentId)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })

    if (error) {
      console.error('Error fetching reports for assessment:', { assessmentId, errorMessage: error.message })
      return { data: null, error: new Error(error.message) }
    }

    return { data: data as ReportWithAssessment[], error: null }
  } catch (err) {
    console.error('Unexpected error fetching reports:', { assessmentId })
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') }
  }
}

/**
 * Fetch all reports for current user across all assessments
 * Uses RLS - automatically filtered to current user
 */
export async function getReportsForCurrentUser(): Promise<{
  data: ReportWithAssessment[] | null
  error: Error | null
}> {
  try {
    const supabase = await createServerSupabaseClient()

    // First get current user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return { data: null, error: new Error('Not authenticated') }
    }

    // Get patient profile
    const { data: profile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return { data: null, error: new Error('Patient profile not found') }
    }

    // Get all assessments for this patient
    const { data: assessments, error: assessmentsError } = await supabase
      .from('assessments')
      .select('id')
      .eq('patient_id', profile.id)

    if (assessmentsError) {
      return { data: null, error: new Error(assessmentsError.message) }
    }

    if (!assessments || assessments.length === 0) {
      return { data: [], error: null }
    }

    const assessmentIds = assessments.map((a) => a.id)

    // Fetch all reports for these assessments
    // Deterministic ordering: created_at DESC, then id DESC for tie-breaking
    const { data, error } = await supabase
      .from('reports')
      .select(
        `
        id,
        assessment_id,
        score_numeric,
        sleep_score,
        risk_level,
        report_text_short,
        created_at,
        updated_at,
        assessment:assessments!assessment_id (
          id,
          funnel,
          completed_at
        )
      `,
      )
      .in('assessment_id', assessmentIds)
      .order('created_at', { ascending: false })
      .order('id', { ascending: false })

    if (error) {
      console.error('Error fetching reports for current user:', { userId: user.id, errorMessage: error.message })
      return { data: null, error: new Error(error.message) }
    }

    return { data: data as ReportWithAssessment[], error: null }
  } catch (err) {
    console.error('Unexpected error fetching user reports:', { userId: user.id })
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') }
  }
}

/**
 * Get key outcomes summary for an assessment
 * Returns aggregated data from the most recent report (deterministic: latest by created_at, then id)
 * All fields come from existing reports table columns - no fantasy fields
 */
export async function getKeyOutcomesForAssessment(
  assessmentId: string,
): Promise<{ data: KeyOutcomes | null; error: Error | null }> {
  try {
    const { data: reports, error } = await getReportsForAssessment(assessmentId)

    if (error || !reports || reports.length === 0) {
      return {
        data: { score_numeric: null, sleep_score: null, risk_level: null, total_reports: 0 },
        error: error,
      }
    }

    // Use most recent report for key outcomes (deterministically ordered by created_at DESC, id DESC)
    const latestReport = reports[0]

    return {
      data: {
        score_numeric: latestReport.score_numeric,
        sleep_score: latestReport.sleep_score,
        risk_level: latestReport.risk_level,
        total_reports: reports.length,
      },
      error: null,
    }
  } catch (err) {
    console.error('Unexpected error getting key outcomes:', { assessmentId })
    return { data: null, error: err instanceof Error ? err : new Error('Unknown error') }
  }
}
