/**
 * Content Generation API - V05-I05.4
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { processContentStage } from '@/lib/processing/contentStageProcessor'

export async function POST(request: NextRequest) {
  try {
    // Auth check BEFORE parsing body (DoS prevention)
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      },
    )
    
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
    
    const { data: userData } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single()
    
    // Only trust app_metadata for authorization (user_metadata is user-modifiable)
    const userRole = userData?.role || user.app_metadata?.role
    
    if (!userRole || !['clinician', 'admin'].includes(userRole)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHORIZATION_FAILED',
            message: 'Only clinicians and admins can generate content',
          },
        },
        { status: 403 },
      )
    }
    
    // Parse and validate request body AFTER auth
    const body = await request.json()
    const { jobId, programTier } = body
    
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
    
    const { data: job, error: jobError } = await supabase
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
        { status: 404 },
      )
    }
    
    const result = await processContentStage(supabase, jobId, programTier)
    
    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROCESSING_FAILED',
            message: result.error || 'Content generation failed',
            details: result.details,
          },
        },
        { status: 422 },
      )
    }
    
    const status = result.isNewSections ? 201 : 200
    
    return NextResponse.json(
      {
        success: true,
        data: {
          sectionsId: result.sectionsId,
          isNewSections: result.isNewSections,
        },
      },
      { status },
    )
  } catch (error) {
    console.error('[ContentAPI] Unexpected error:', error)
    
    const message = error instanceof Error ? error.message : 'Unknown error'
    
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: `Internal server error: ${message}`,
        },
      },
      { status: 500 },
    )
  }
}
