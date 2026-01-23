/**
 * Account Deletion Request API Endpoint
 * 
 * Allows authenticated users to request deletion of their account
 * in compliance with GDPR Article 17 (Right to Erasure).
 * 
 * @route POST /api/account/deletion-request
 * @returns {Object} Deletion request confirmation with scheduled date
 * 
 * Security:
 * - Requires authentication
 * - Users can only request deletion of their own account
 * - All actions logged to audit_log
 * 
 * V05-I10.2: Account Deletion/Retention MVP
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { logAccountDeletionRequest } from '@/lib/audit/log'

// Default retention period in days before deletion executes
const DEFAULT_RETENTION_DAYS = 30

/**
 * POST /api/account/deletion-request
 * 
 * Request account deletion with retention period
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json()
    const { reason, confirm } = body

    // Validate confirmation
    if (confirm !== true) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account deletion must be explicitly confirmed',
        },
        { status: 400 }
      )
    }

    // Create Supabase client
    const supabase = await createServerSupabaseClient()

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error('[account/deletion-request] Authentication failed', authError)
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required',
        },
        { status: 401 }
      )
    }

    // Get user role from metadata
    const userRole = user.user_metadata?.role || user.app_metadata?.role || 'patient'

    // Check if deletion is already pending
    const currentStatus = user.user_metadata?.account_status
    if (currentStatus === 'deletion_pending') {
      return NextResponse.json(
        {
          success: false,
          error: 'Account deletion is already pending',
          deletion_scheduled_for: user.user_metadata?.deletion_scheduled_for,
        },
        { status: 400 }
      )
    }

    // Call database function to request deletion
    const { data: deletionResult, error: deletionError } = await supabase.rpc(
      'request_account_deletion',
      {
        target_user_id: user.id,
        deletion_reason: reason || null,
        retention_days: DEFAULT_RETENTION_DAYS,
      }
    )

    if (deletionError || !deletionResult) {
      console.error('[account/deletion-request] Database error', {
        userId: user.id,
        error: deletionError,
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to process deletion request',
        },
        { status: 500 }
      )
    }

    if (typeof deletionResult !== 'object' || deletionResult === null || Array.isArray(deletionResult)) {
      console.error('[account/deletion-request] Unexpected RPC result shape', {
        userId: user.id,
        result: deletionResult,
      })
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to process deletion request',
        },
        { status: 500 }
      )
    }

    const deletion = deletionResult as Record<string, unknown>

    const deletionRequestedAt =
      typeof deletion.deletion_requested_at === 'string' ? deletion.deletion_requested_at : undefined

    const deletionScheduledFor =
      typeof deletion.deletion_scheduled_for === 'string'
        ? deletion.deletion_scheduled_for
        : undefined

    const canCancelUntil =
      typeof deletion.can_cancel_until === 'string' ? deletion.can_cancel_until : undefined

    // Log audit event
    const auditResult = await logAccountDeletionRequest({
      actor_user_id: user.id,
      actor_role: userRole,
      account_id: user.id,
      deletion_reason: reason,
      scheduled_for: deletionScheduledFor,
      retention_period_days: DEFAULT_RETENTION_DAYS,
    })

    if (!auditResult.success) {
      console.error('[account/deletion-request] Audit logging failed', {
        userId: user.id,
        auditError: auditResult.error,
      })
      // Continue despite audit failure - deletion request is more important
    }

    console.log('[account/deletion-request] Deletion requested successfully', {
      userId: user.id,
      scheduledFor: deletionScheduledFor,
      auditId: auditResult.audit_id,
    })

    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Account deletion requested successfully',
      deletion_requested_at: deletionRequestedAt,
      deletion_scheduled_for: deletionScheduledFor,
      can_cancel_until: canCancelUntil,
      retention_period_days: DEFAULT_RETENTION_DAYS,
      next_steps: [
        'You will receive a confirmation email',
        'Your account will be deleted after the retention period',
        'You can cancel this request before the deletion date',
        'All your personal data will be permanently removed',
      ],
    })
  } catch (error) {
    console.error('[account/deletion-request] Unexpected error', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    )
  }
}
