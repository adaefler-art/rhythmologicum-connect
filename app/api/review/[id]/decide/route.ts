/**
 * Review Decision API - V05-I05.7
 * 
 * Make a review decision (approve/reject/changes requested)
 * Auth: clinician/admin only
 * Idempotent: same decision can be applied multiple times
 * 
 * POST /api/review/[id]/decide - Make review decision with audit trail
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { updateReviewDecision } from '@/lib/review/persistence'
import { 
  ReviewDecisionSchema, 
  isValidDecisionReason,
  REVIEW_STATUS,
} from '@/lib/contracts/reviewRecord'
import { logAuditEvent } from '@/lib/audit/log'

type RouteContext = {
  params: Promise<{ id: string }>
}

export async function POST(request: NextRequest, context: RouteContext) {
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

    // Role check: only clinician/admin can make decisions
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
    
    // Parse and validate request body
    const body = await request.json()
    
    const decisionParse = ReviewDecisionSchema.safeParse(body)
    if (!decisionParse.success) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid decision format',
            details: decisionParse.error.issues,
          },
        },
        { status: 400 }
      )
    }
    
    const decision = decisionParse.data
    
    // Validate reason code matches status
    if (!isValidDecisionReason(decision.status, decision.reasonCode)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'VALIDATION_ERROR',
            message: `Reason code '${decision.reasonCode}' is not valid for status '${decision.status}'`,
          },
        },
        { status: 400 }
      )
    }
    
    // Use admin client for decision updates
    const admin = createAdminSupabaseClient()
    
    // Update review decision
    const result = await updateReviewDecision(admin, {
      reviewId,
      decision,
      reviewerUserId: user.id,
      reviewerRole: userRole as 'clinician' | 'admin',
    })
    
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
            code: result.errorCode ?? 'UPDATE_FAILED',
            message: result.error,
          },
        },
        { status: 422 }
      )
    }
    
    // Log audit event (PHI-free)
    await logAuditEvent({
      source: 'api',
      actor_user_id: user.id,
      actor_role: userRole as 'clinician' | 'admin',
      entity_type: 'review_record',
      entity_id: reviewId,
      action: decision.status === REVIEW_STATUS.APPROVED ? 'approve' : 
              decision.status === REVIEW_STATUS.REJECTED ? 'reject' : 
              'request_changes',
      diff: {
        before: { status: 'PENDING' },
        after: { 
          status: decision.status,
          reasonCode: decision.reasonCode,
        },
      },
      metadata: {
        review_id: reviewId,
        job_id: result.data.jobId,
        decision_reason: decision.reasonCode,
        has_notes: !!decision.notes,
      },
    })
    
    return NextResponse.json(
      {
        success: true,
        data: {
          reviewId: result.data.id,
          status: result.data.status,
          decidedAt: result.data.decidedAt,
        },
      },
      { status: 200 }
    )
  } catch (err) {
    console.error('[review/[id]/decide] Unexpected error:', err)
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
