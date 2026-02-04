/**
 * Studio Diagnosis Artifact API - Latest Artifact by Run
 * 
 * GET /api/studio/diagnosis/runs/[runId]/artifact
 * 
 * Returns latest diagnosis artifact for a run.
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient, hasClinicianRole } from '@/lib/db/supabase.server'
import { ErrorCode } from '@/lib/api/responseTypes'

type RouteContext = {
  params: Promise<{ runId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { runId } = await context.params
    const supabase = await createServerSupabaseClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'Authentication required',
          },
        },
        { status: 401 },
      )
    }

    const isClinician = await hasClinicianRole()
    if (!isClinician) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: 'Clinician or admin role required',
          },
        },
        { status: 403 },
      )
    }

    const { data: artifact, error } = await supabase
      .from('diagnosis_artifacts')
      .select('*')
      .eq('run_id', runId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[studio/diagnosis/runs/[runId]/artifact GET] Query error:', error)

      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Failed to fetch diagnosis artifact',
          },
        },
        { status: 500 },
      )
    }

    if (!artifact) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Artifact not found for run',
          },
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: artifact,
    })
  } catch (err) {
    console.error('[studio/diagnosis/runs/[runId]/artifact GET] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 },
    )
  }
}
