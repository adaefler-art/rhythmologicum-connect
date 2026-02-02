/**
 * Diagnosis Run Detail API - E76.4
 * GET /api/diagnosis-runs/[id] - Get diagnosis run status and result
 *
 * Strategy A Compliance:
 * - Literal callsite exists in lib/diagnosis/__tests__/integration.test.ts
 * - Internal system endpoint (no external access)
 */

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/supabase.server'

/**
 * GET /api/diagnosis-runs/[id]
 * Get diagnosis run by ID
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'Run ID is required' }, { status: 400 })
    }

    // Fetch diagnosis run (RLS policies enforce ownership)
    const { data: run, error } = await supabase
      .from('diagnosis_runs')
      .select('*')
      .eq('id', id)
      .single()

    if (error || !run) {
      return NextResponse.json(
        {
          success: false,
          error: 'Diagnosis run not found or access denied',
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      run,
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
