/**
 * Medical Validation API - V05-I05.5
 * 
 * Triggers medical validation stage processing for a job.
 * Auth: clinician/admin only
 */

import { NextRequest, NextResponse } from 'next/server'
import { processValidationStage } from '@/lib/processing/validationStageProcessor'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'

export async function POST(request: NextRequest) {
  try {
    // Auth check BEFORE parsing body (DoS prevention)
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
            code: 'AUTHENTICATION_REQUIRED',
            message: 'User must be authenticated',
          },
        },
        { status: 401 }
      )
    }

    // Role is stored in auth.users.raw_app_meta_data.role and surfaced to the app as app_metadata.role
    const userRole = user.app_metadata?.role
    
    if (!userRole || !['clinician', 'admin'].includes(userRole)) {
      // Return 404 instead of 403 to avoid resource existence disclosure
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Resource not found',
          },
        },
        { status: 404 }
      )
    }
    
    // Parse and validate request body AFTER auth
    const body = await request.json()
    const { jobId } = body
    
    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required field: jobId',
          },
        },
        { status: 400 }
      )
    }
    
    // Use admin client for pipeline reads/writes (processing is system-level and
    // not tied to end-user RLS once auth/RBAC has been verified).
    const admin = createAdminSupabaseClient()

    const { data: job, error: jobError } = await admin
      .from('processing_jobs')
      .select('id, assessment_id')
      .eq('id', jobId)
      .single()
    
    if (jobError || !job) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'NOT_FOUND',
            message: 'Processing job not found',
          },
        },
        { status: 404 }
      )
    }
    
    const result = await processValidationStage(admin, jobId)
    
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.errorCode || 'PROCESSING_FAILED',
            message: result.error || 'Validation processing failed',
          },
        },
        { status: 422 }
      )
    }
    
    // Success response
    return NextResponse.json(
      {
        success: true,
        data: {
          validationId: result.validationId,
          overallPassed: result.overallPassed,
          overallStatus: result.overallStatus,
          criticalFlagsCount: result.criticalFlagsCount,
        },
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[ValidationAPI] Unexpected error:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
}
