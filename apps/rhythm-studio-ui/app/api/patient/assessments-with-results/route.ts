import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'

type FunnelInfo = {
  slug?: string
  title?: string
} | null

type AssessmentResultRow = {
  id: string
  scores: Record<string, unknown> | null
  risk_models: Record<string, unknown> | null
  algorithm_version: string | null
  computed_at: string | null
}

type AssessmentWithResultsRow = {
  id: string
  funnel: string | null
  funnel_id: string | null
  status: string
  started_at: string | null
  completed_at: string | null
  funnels?: FunnelInfo | FunnelInfo[] | null
  calculated_results?: AssessmentResultRow[] | null
}

/**
 * E73.5 — SSOT for Patient Assessments with Results (Clinician View)
 * 
 * GET /api/patient/assessments-with-results
 *
 * Returns completed assessments that have calculated results available.
 * This is the Single Source of Truth (SSOT) for clinician views.
 * 
 * Query Params:
 * - patientId: Required for clinician views
 * - limit: Optional (default 50, max 100)
 * 
 * Visibility Rules:
 * - Assessment must have status = 'completed'
 * - Calculated results must exist (inner join)
 * - Only latest result per assessment (if multiple algorithm versions exist)
 * 
 * Response Format:
 * {
 *   success: true,
 *   data: {
 *     assessments: [{
 *       id: string
 *       funnelSlug: string
 *       funnelName: string
 *       status: 'completed'
 *       startedAt: string
 *       completedAt: string
 *       result: {
 *         id: string
 *         scores: { stress_score?: number, ... }
 *         riskModels?: { ... }
 *         algorithmVersion: string
 *         computedAt: string
 *       }
 *     }],
 *     count: number
 *   }
 * }
 */
export async function GET(request: Request) {
  const supabase = await createServerSupabaseClient()

  // Check authentication
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'UNAUTHORIZED', message: 'Nicht angemeldet.' },
      },
      { status: 401 },
    )
  }

  // Parse query params
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
  const patientId = searchParams.get('patientId')

  if (!patientId) {
    return NextResponse.json(
      {
        success: false,
        error: { code: 'MISSING_PARAM', message: 'patientId is required' },
      },
      { status: 400 },
    )
  }

  try {
    // Query assessments with calculated_results (INNER JOIN)
    // Only returns completed assessments that have results
    const { data: assessmentsWithResults, error: queryError } = await supabase
      .from('assessments')
      .select(
        `
        id,
        funnel,
        funnel_id,
        status,
        started_at,
        completed_at,
        funnels!assessments_funnel_id_fkey (
          slug,
          title
        ),
        calculated_results!inner (
          id,
          scores,
          risk_models,
          algorithm_version,
          computed_at
        )
      `,
      )
      .eq('patient_id', patientId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(limit)

    if (queryError) {
      console.error('[studio/patient/assessments-with-results] Query error:', queryError)
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DB_ERROR', message: 'Fehler beim Laden der Assessments.' },
        },
        { status: 500 },
      )
    }

    // Transform data for client
    const transformedAssessments = ((assessmentsWithResults as AssessmentWithResultsRow[]) || []).map(
      (a) => {
        const funnelData = (Array.isArray(a.funnels)
          ? a.funnels[0]
          : a.funnels) as FunnelInfo
      // calculated_results is an array due to join, but we only want latest
        const resultsArray = (a.calculated_results || []) as AssessmentResultRow[]
      const latestResult = resultsArray && resultsArray.length > 0 ? resultsArray[0] : null

        return {
          id: a.id,
          funnelSlug: a.funnel || funnelData?.slug || null,
          funnelName: funnelData?.title || a.funnel || 'Unbekannt',
          status: a.status,
          startedAt: a.started_at,
          completedAt: a.completed_at,
          result: latestResult
            ? {
                id: latestResult.id,
                scores: latestResult.scores || {},
                riskModels: latestResult.risk_models || null,
                algorithmVersion: latestResult.algorithm_version,
                computedAt: latestResult.computed_at,
              }
            : null,
        }
      },
    )

    // Filter out any without results (shouldn't happen with inner join, but safety check)
    const validAssessments = transformedAssessments.filter((a) => a.result !== null)

    return NextResponse.json({
      success: true,
      data: {
        assessments: validAssessments,
        count: validAssessments.length,
      },
    })
  } catch (err) {
    console.error('[studio/patient/assessments-with-results] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Unerwarteter Fehler.' },
      },
      { status: 500 },
    )
  }
}
