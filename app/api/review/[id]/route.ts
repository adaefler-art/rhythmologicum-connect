/**
 * Review Details API - V05-I05.7
 * 
 * Get review record details (redacted, no PHI)
 * Auth: clinician/admin only
 * 
 * GET /api/review/[id] - Get review details
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { loadReviewRecordById } from '@/lib/review/persistence'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  try {
    // Auth check
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

    // Role check
    const userRole = user.app_metadata?.role
    
    if (!userRole || !['clinician', 'admin'].includes(userRole)) {
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
    
    // Get review ID from params
    const { id: reviewId } = await context.params
    
    if (!reviewId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Review ID is required',
          },
        },
        { status: 400 }
      )
    }
    
    // Use admin client
    const admin = createAdminSupabaseClient()
    
    // Load review record
    const result = await loadReviewRecordById(admin, reviewId)
    
    if (!result.success) {
      if (result.errorCode === 'NOT_FOUND') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'NOT_FOUND',
              message: 'Review record not found',
            },
          },
          { status: 404 }
        )
      }
      
      return NextResponse.json(
        {
          success: false,
          error: {
            code: result.errorCode ?? 'FETCH_FAILED',
            message: result.error,
          },
        },
        { status: 500 }
      )
    }
    
    // Return review record (already PHI-free)
    return NextResponse.json(
      {
        success: true,
        data: result.data,
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('[review/[id]] Unexpected error:', err)
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
