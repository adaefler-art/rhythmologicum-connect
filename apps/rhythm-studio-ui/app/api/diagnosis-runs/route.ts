/**
 * Diagnosis Runs API - E76.4
 * POST /api/diagnosis-runs - Create/queue a diagnosis run
 * GET /api/diagnosis-runs - List diagnosis runs for user
 *
 * Strategy A Compliance:
 * - Literal callsite exists in lib/diagnosis/__tests__/integration.test.ts
 * - Internal system endpoint (no external access)
 */

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/supabase.server'
import { createDiagnosisRun } from '@/lib/diagnosis/worker'

/**
 * POST /api/diagnosis-runs
 * Create a new diagnosis run (idempotent)
 */
export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Parse request body
    const body = await request.json()
    const { assessmentId, correlationId } = body

    if (!assessmentId) {
      return NextResponse.json({ error: 'assessmentId is required' }, { status: 400 })
    }

    if (!correlationId) {
      return NextResponse.json({ error: 'correlationId is required' }, { status: 400 })
    }

    // Create diagnosis run
    const result = await createDiagnosisRun(supabase, assessmentId, correlationId)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          errorCode: result.errorCode,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      runId: result.runId,
      status: result.status,
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}

/**
 * GET /api/diagnosis-runs
 * List diagnosis runs for authenticated user
 */
export async function GET() {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch diagnosis runs (RLS policies filter by user ownership)
    const { data: runs, error } = await supabase
      .from('diagnosis_runs')
      .select('id, assessment_id, status, created_at, updated_at, started_at, completed_at')
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch diagnosis runs: ${error.message}`,
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      runs: runs || [],
    })
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    )
  }
}
