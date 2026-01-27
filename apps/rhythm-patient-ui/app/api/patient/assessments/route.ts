import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'

/**
 * GET /api/patient/assessments
 *
 * Returns the assessment history for the authenticated patient.
 * Includes assessment status, funnel info, timestamps, and result summaries.
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
      { success: false, error: { code: 'UNAUTHORIZED', message: 'Nicht angemeldet.' } },
      { status: 401 }
    )
  }

  // Parse query params
  const { searchParams } = new URL(request.url)
  const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 100)
  const status = searchParams.get('status') // 'completed', 'in_progress', or null for all

  try {
    // Get patient profile ID first - assessments.patient_id references patient_profiles.id
    const { data: patientProfile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', user.id)
      .maybeSingle()

    if (profileError) {
      console.error('[patient/assessments] Error fetching patient profile:', profileError)
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: 'Fehler beim Laden des Profils.' } },
        { status: 500 }
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

    // Build query for assessments
    // Note: 'funnel' column contains slug for catalog-based funnels
    // 'funnels' join works for legacy funnels with funnel_id set
    let query = supabase
      .from('assessments')
      .select(`
        id,
        funnel,
        funnel_id,
        status,
        started_at,
        completed_at,
        result,
        funnels!assessments_funnel_id_fkey (
          slug,
          title
        )
      `)
      .eq('patient_id', patientProfile.id)
      .order('started_at', { ascending: false })
      .limit(limit)

    // Filter by status if provided
    if (status === 'completed') {
      query = query.eq('status', 'completed')
    } else if (status === 'in_progress') {
      query = query.eq('status', 'in_progress')
    }

    const { data: assessments, error: assessmentsError } = await query

    if (assessmentsError) {
      console.error('[patient/assessments] Error fetching assessments:', assessmentsError)
      return NextResponse.json(
        { success: false, error: { code: 'DB_ERROR', message: 'Fehler beim Laden der Assessments.' } },
        { status: 500 }
      )
    }

    // Transform data for client
    // For catalog-based funnels: funnel column has slug, funnels join is null
    // For legacy funnels: funnels join has data
    const transformedAssessments = (assessments || []).map((a) => {
      const funnelData = a.funnels as { slug?: string; title?: string } | null
      return {
        id: a.id,
        funnelId: a.funnel_id,
        // Prefer funnel column (slug) for catalog funnels, fall back to joined data
        funnelSlug: a.funnel || funnelData?.slug || null,
        funnelName: funnelData?.title || a.funnel || 'Unbekannt',
        status: a.status,
        startedAt: a.started_at,
        completedAt: a.completed_at,
        // Extract summary from result if present
        summaryTitle: (a.result as Record<string, unknown> | null)?.summaryTitle || null,
        riskBand:
          ((a.result as Record<string, unknown> | null)?.derived as Record<string, unknown> | null)
            ?.riskBand || null,
      }
    })

    return NextResponse.json({
      success: true,
      data: {
        assessments: transformedAssessments,
        count: transformedAssessments.length,
      },
    })
  } catch (err) {
    console.error('[patient/assessments] Unexpected error:', err)
    return NextResponse.json(
      { success: false, error: { code: 'INTERNAL_ERROR', message: 'Unerwarteter Fehler.' } },
      { status: 500 }
    )
  }
}
