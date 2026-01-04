/**
 * Review Queue API - V05-I05.7
 * 
 * List review queue items (flagged + sampled jobs)
 * Auth: clinician/admin only
 * 
 * GET /api/review/queue - List all pending reviews
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { listReviewQueue, countReviewsByStatus } from '@/lib/review/persistence'
import { REVIEW_STATUS } from '@/lib/contracts/reviewRecord'

export async function GET(request: NextRequest) {
  try {
    // Auth check BEFORE processing (DoS prevention)
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

    // Role check: only clinician/admin can access review queue
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
    
    // Parse query parameters
    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') as typeof REVIEW_STATUS[keyof typeof REVIEW_STATUS] | null
    const isSampled = searchParams.get('sampled') === 'true' ? true : 
                      searchParams.get('sampled') === 'false' ? false : 
                      undefined
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!, 10) : 50
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!, 10) : 0
    const includeCounts = searchParams.get('counts') === 'true'
    
    // Validate limit
    if (limit < 1 || limit > 100) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Limit must be between 1 and 100',
          },
        },
        { status: 400 }
      )
    }
    
    // Use admin client for queue queries (bypasses RLS, auth already verified)
    const admin = createAdminSupabaseClient()
    
    // Get queue items
    const queueResult = await listReviewQueue(admin, {
      status: status ?? undefined,
      isSampled,
      limit,
      offset,
    })
    
    if (!queueResult.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: queueResult.errorCode ?? 'QUEUE_FETCH_FAILED',
            message: queueResult.error,
          },
        },
        { status: 500 }
      )
    }
    
    // Optionally include status counts
    let counts
    if (includeCounts) {
      const countsResult = await countReviewsByStatus(admin)
      if (countsResult.success) {
        counts = countsResult.data
      }
    }
    
    return NextResponse.json(
      {
        success: true,
        data: {
          items: queueResult.data,
          pagination: {
            limit,
            offset,
            count: queueResult.data.length,
          },
          counts,
        },
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('[review/queue] Unexpected error:', err)
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
