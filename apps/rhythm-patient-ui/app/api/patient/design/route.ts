/**
 * E73.9: Patient Design Tokens API
 * 
 * GET /api/patient/design
 * Returns merged design tokens (global defaults + org-specific overrides)
 * 
 * Used by patient UI to apply Studio-configured design customizations.
 * Tokens are merged server-side using get_design_tokens(org_id) function.
 */

import { requireAuth } from '@/lib/api/authHelpers'
import { versionedSuccessResponse, internalErrorResponse } from '@/lib/api/responses'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'
export const revalidate = 0

type DesignTokensResponse = {
  tokens: Record<string, unknown>
  organizationId: string | null
  appliedAt: string
}

/**
 * GET /api/patient/design
 * 
 * Returns merged design tokens for the authenticated patient's organization.
 * 
 * AC1: Unauthenticated → 401
 * AC2: Returns merged tokens (global + org overrides)
 * AC3: Safe defaults if no custom tokens exist
 * 
 * Response format:
 * {
 *   success: true,
 *   data: {
 *     tokens: { spacing: {...}, colors: {...}, ... },
 *     organizationId: 'uuid' | null,
 *     appliedAt: '2026-01-29T...'
 *   },
 *   schemaVersion: 1
 * }
 */
export async function GET() {
  const correlationId = randomUUID()
  
  try {
    // AC1: Auth check FIRST (401-first ordering)
    const authResult = await requireAuth()
    
    if (authResult.error) {
      console.log('[PATIENT_DESIGN_API][GET] Unauthorized access attempt', {
        correlationId,
      })
      return authResult.error
    }
    
    const user = authResult.user!
    console.log('[PATIENT_DESIGN_API][GET] Auth success', {
      correlationId,
      userId: user.id,
    })
    
    // Create Supabase client
    const supabase = (await createServerSupabaseClient()) as any
    
    // Get patient's organization ID (if assigned)
    // For now, we'll use null (global tokens) as org assignment is not yet implemented
    // TODO E73.9: Implement org lookup from patient_profiles or user metadata
    const organizationId: string | null = null
    
    // AC2: Fetch merged tokens using get_design_tokens function
    // This function merges global defaults with org-specific overrides
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: tokensData, error: tokensError } = await supabase
      .rpc('get_design_tokens', { org_id: organizationId as any })
    
    if (tokensError) {
      console.error('[PATIENT_DESIGN_API][GET] Failed to fetch tokens', {
        correlationId,
        errorCode: tokensError.code,
        errorMessage: tokensError.message,
      })
      
      // AC3: Fail gracefully with empty tokens (client will use static defaults)
      return versionedSuccessResponse(
        {
          tokens: {},
          organizationId: null,
          appliedAt: new Date().toISOString(),
        } as DesignTokensResponse,
        '1',
        200,
        correlationId,
      )
    }
    
    // Parse tokens (RPC returns jsonb)
    const tokens = tokensData || {}
    
    console.log('[PATIENT_DESIGN_API][GET] Success', {
      correlationId,
      userId: user.id,
      organizationId,
      tokenCategories: Object.keys(tokens),
    })
    
    // Return merged tokens
    return versionedSuccessResponse(
      {
        tokens,
        organizationId,
        appliedAt: new Date().toISOString(),
      } as DesignTokensResponse,
      '1',
      200,
      correlationId,
    )
  } catch (error) {
    console.error('[PATIENT_DESIGN_API][GET] Unexpected error', {
      correlationId,
      errorType: error instanceof Error ? error.name : 'unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
    })
    
    return internalErrorResponse('Failed to fetch design tokens', correlationId)
  }
}
