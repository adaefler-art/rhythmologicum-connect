import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'

/**
 * E73.5 — SSOT for Patient Assessments with Results
 * 
 * GET /api/patient/assessments-with-results
 *
 * Returns completed assessments that have calculated results available.
 * This is the Single Source of Truth (SSOT) for both patient history
 * and clinician views.
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
  const patientId = searchParams.get('patientId') // Optional: for clinician views

  try {
    // Get patient profile ID
    let targetPatientId: string

    if (patientId) {
      // Clinician accessing specific patient - verify access
      // TODO: Add clinician role check here if needed
      targetPatientId = patientId
    } else {
      // Patient accessing their own data
      const { data: patientProfile, error: profileError } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (profileError) {
        console.error(
          '[patient/assessments-with-results] Error fetching patient profile:',
          profileError,
        )
        return NextResponse.json(
          {
            success: false,
            error: { code: 'DB_ERROR', message: 'Fehler beim Laden des Profils.' },
          },
          { status: 500 },
        )
      }

      if (!patientProfile) {
        // No patient profile yet - return empty list
        return NextResponse.json({
          success: true,
          data: {
            assessments: [],
            count: 0,
          },
        })
      }

      targetPatientId = patientProfile.id
    }

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
      .eq('patient_id', targetPatientId)
      .eq('status', 'completed')
      .order('completed_at', { ascending: false })
      .limit(limit)

    if (queryError) {
      console.error('[patient/assessments-with-results] Query error:', queryError)
      return NextResponse.json(
        {
          success: false,
          error: { code: 'DB_ERROR', message: 'Fehler beim Laden der Assessments.' },
        },
        { status: 500 },
      )
    }

    // Transform data for client
    const transformedAssessments = (assessmentsWithResults || []).map((a) => {
      const funnelData = a.funnels as { slug?: string; title?: string } | null
      // calculated_results is an array due to join, but we only want latest
      const resultsArray = a.calculated_results as any[]
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
    })

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
    console.error('[patient/assessments-with-results] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: { code: 'INTERNAL_ERROR', message: 'Unerwarteter Fehler.' },
      },
      { status: 500 },
    )
  }
}
