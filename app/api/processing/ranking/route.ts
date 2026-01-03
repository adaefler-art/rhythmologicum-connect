/**
 * API Endpoint: POST /api/processing/ranking
 * 
 * Process ranking stage for a job.
 * Ranks interventions based on risk bundle using Impact x Feasibility.
 * 
 * Auth: Requires clinician or admin role
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { hasRole } from '@/lib/api/authHelpers'
import { USER_ROLE } from '@/lib/contracts/registry'
import { processRankingStage } from '@/lib/processing/rankingStageProcessor'

/**
 * POST /api/processing/ranking
 * 
 * Process ranking stage for a processing job
 * 
 * Request body:
 * {
 *   jobId: string (UUID)
 *   riskBundleId?: string (UUID, optional - will use job's risk bundle if not provided)
 *   programTier?: string (optional tier constraint)
 *   topN?: number (optional, default 5)
 * }
 * 
 * Response:
 * 200: { success: true, data: { rankingId: string, isNewRanking: boolean } }
 * 400: { success: false, error: string }
 * 401: { success: false, error: "Unauthorized" }
 * 403: { success: false, error: "Forbidden" }
 * 422: { success: false, error: string }
 * 500: { success: false, error: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Create Supabase clients
    const publicClient = await createServerSupabaseClient()
    const adminClient = await createAdminSupabaseClient() // Admin client for DB operations

    // Auth check
    const {
      data: { user },
      error: authError,
    } = await publicClient.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Role check: Only clinicians and admins can trigger ranking
    const role = user.app_metadata?.role || user.user_metadata?.role
    const isAuthorized = role === USER_ROLE.CLINICIAN || role === USER_ROLE.ADMIN

    if (!isAuthorized) {
      return NextResponse.json(
        { success: false, error: 'Forbidden: Requires clinician or admin role' },
        { status: 403 }
      )
    }

    // Parse request body
    const body = await request.json()
    const { jobId, riskBundleId, programTier, topN } = body

    // Validate required fields
    if (!jobId) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: jobId' },
        { status: 400 }
      )
    }

    // Validate UUID format (basic check)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(jobId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid jobId format' },
        { status: 400 }
      )
    }

    if (riskBundleId && !uuidRegex.test(riskBundleId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid riskBundleId format' },
        { status: 400 }
      )
    }

    // Validate topN if provided
    if (topN !== undefined && (typeof topN !== 'number' || topN < 1 || topN > 10)) {
      return NextResponse.json(
        { success: false, error: 'topN must be a number between 1 and 10' },
        { status: 400 }
      )
    }

    // Process ranking stage
    const result = await processRankingStage(
      adminClient,
      jobId,
      riskBundleId,
      programTier,
      topN
    )

    if (!result.success) {
      // Determine appropriate status code
      const statusCode = result.error?.includes('not found') ? 404 : 422
      return NextResponse.json(
        {
          success: false,
          error: result.error || 'Ranking processing failed',
          details: result.details,
        },
        { status: statusCode }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          rankingId: result.rankingId,
          isNewRanking: result.isNewRanking,
        },
      },
      { status: result.isNewRanking ? 201 : 200 }
    )
  } catch (error) {
    console.error('[API] Error processing ranking stage:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { success: false, error: `Internal server error: ${message}` },
      { status: 500 }
    )
  }
}
