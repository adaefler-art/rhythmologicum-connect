/**
 * Safety Check API - V05-I05.6
 * 
 * Triggers AI-powered safety check stage processing for a job.
 * Auth: clinician/admin only
 */

import { NextRequest, NextResponse } from 'next/server'
import { processSafetyStage } from '@/lib/processing/safetyStageProcessor'
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
        { status: 401 },
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
        { status: 404 },
      )
    }
    
    // Parse and validate request body AFTER auth
    const body = await request.json()
    const { jobId, promptVersion, forceRecheck } = body
    
    if (!jobId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Missing required field: jobId',
          },
        },
        { status: 400 },
      )
    }
    
    // Use admin client for pipeline reads/writes
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
            code: 'JOB_NOT_FOUND',
            message: 'Processing job not found',
          },
        },
        { status: 404 },
      )
    }
    
    // Process safety check stage
    const result = await processSafetyStage(admin, jobId, {
      promptVersion,
      forceRecheck,
    })
    
    if (!result.success) {
      // Determine appropriate status code based on error
      let status = 500
      if (result.errorCode === 'LOAD_SECTIONS_FAILED') {
        status = 422 // Unprocessable Entity (missing dependency)
      } else if (result.errorCode === 'EVALUATION_FAILED') {
        status = 422
      } else if (result.errorCode === 'SAVE_FAILED') {
        status = 500
      }
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.errorCode || 'UNKNOWN_ERROR',
            message: result.error || 'Unknown error occurred',
          },
        },
        { status },
      )
    }
    
    // Success
    return NextResponse.json(
      {
        success: true,
        data: {
          safetyCheckId: result.safetyCheckId,
          recommendedAction: result.recommendedAction,
          safetyScore: result.safetyScore,
          requiresReview: result.requiresReview,
          isNewCheck: result.isNewCheck,
        },
      },
      { status: result.isNewCheck ? 201 : 200 },
    )
  } catch (error) {
    console.error('Unexpected error in safety check API:', error)
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 },
    )
  }
}
