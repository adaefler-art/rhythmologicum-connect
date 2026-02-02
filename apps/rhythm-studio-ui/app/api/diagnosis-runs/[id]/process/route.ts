/**
 * Diagnosis Run Processing API - E76.4
 * POST /api/diagnosis-runs/[id]/process - Execute worker for a queued diagnosis run
 *
 * Strategy A Compliance:
 * - Literal callsite exists in lib/diagnosis/__tests__/integration.test.ts
 * - Internal system endpoint (requires admin/system role)
 */

import { NextResponse } from 'next/server'
import { createServerClient } from '@/lib/db/supabase.server'
import { executeDiagnosisRun } from '@/lib/diagnosis/worker'

/**
 * POST /api/diagnosis-runs/[id]/process
 * Execute diagnosis run worker
 * Requires admin or system role
 */
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const supabase = await createServerClient()

    // Check authentication
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check role (admin or system only)
    const role = user.app_metadata?.role || user.user_metadata?.role
    if (role !== 'admin' && role !== 'system') {
      return NextResponse.json(
        {
          error: 'Forbidden - requires admin or system role',
        },
        { status: 403 },
      )
    }

    const { id } = params

    if (!id) {
      return NextResponse.json({ error: 'Run ID is required' }, { status: 400 })
    }

    // Execute diagnosis run
    const result = await executeDiagnosisRun(supabase, id)

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
          errorCode: result.errorCode,
          runId: result.runId,
          status: result.status,
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
