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
    // Auth check FIRST - before reading request body
    const publicClient = await createServerSupabaseClient()

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
      // Return 404 for unauthorized access (no existence disclosure)
      return NextResponse.json(
        { success: false, error: 'Not Found' },
        { status: 404 }
      )
    }

    // Only NOW read request body (after auth confirmed)
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

    // Create admin client for DB operations
    const adminClient = await createAdminSupabaseClient()

    // Process ranking stage (no logging of request body or ranking data)
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
          // Do NOT include details that might contain PHI
        },
        { status: statusCode }
      )
    }

    // Load ranking to get version fields for response
    const { loadPriorityRanking } = await import('@/lib/ranking/persistence')
    const loadResult = await loadPriorityRanking(adminClient, jobId)
    
    const versionInfo = loadResult.success && loadResult.ranking ? {
      rankingVersion: loadResult.ranking.rankingVersion,
      algorithmVersion: loadResult.ranking.algorithmVersion,
      registryVersion: loadResult.ranking.registryVersion,
    } : undefined

    return NextResponse.json(
      {
        success: true,
        data: {
          rankingId: result.rankingId,
          isNewRanking: result.isNewRanking,
          ...versionInfo, // Include version identity in response
        },
      },
      { status: result.isNewRanking ? 201 : 200 }
    )
  } catch (error) {
    // Log error code/type only - never log error details that might contain PHI
    console.error('[API] Error processing ranking stage - error type:', error?.constructor?.name || 'Unknown')
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}
