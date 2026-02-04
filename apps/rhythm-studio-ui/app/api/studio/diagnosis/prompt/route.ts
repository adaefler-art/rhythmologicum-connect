/**
 * E76.5: Diagnosis Prompt API Route
 * 
 * Provides access to diagnosis prompt schema and validation.
 * Feature-gated behind NEXT_PUBLIC_FEATURE_DIAGNOSIS_PROMPT_ENABLED.
 * 
 * @endpoint-intent diagnosis:prompt Diagnosis prompt schema and validation
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { isFeatureEnabled } from '@/lib/featureFlags'
import { getPrompt } from '@/lib/prompts/registry'
import {
  validateDiagnosisPromptOutputV1,
  DIAGNOSIS_PROMPT_BUNDLE_VERSION,
  DIAGNOSIS_PROMPT_VERSION,
  DIAGNOSIS_SCHEMA_VERSION,
  type DiagnosisPromptOutputV1,
} from '@/lib/contracts/diagnosis-prompt'

/**
 * GET /api/studio/diagnosis/prompt
 * 
 * Get diagnosis prompt metadata and schema information.
 * 
 * Query params:
 * - version (optional): Prompt version to retrieve (default: v1.0.0)
 * 
 * Response:
 * - success: boolean
 * - data: Prompt metadata and schema version info
 */
export async function GET(request: NextRequest) {
  try {
    // Feature flag check
    const diagnosisPromptEnabled = isFeatureEnabled('DIAGNOSIS_PROMPT_ENABLED')
    if (!diagnosisPromptEnabled) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FEATURE_DISABLED',
            message: 'Diagnosis prompt feature is not enabled',
          },
        },
        { status: 503 },
      )
    }

    // Check authentication
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
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 },
      )
    }

    // Check if user is clinician or admin
    const userRole = user.app_metadata?.role
    const isAuthorized = userRole === 'clinician' || userRole === 'admin'

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only clinicians and admins can access diagnosis prompt',
          },
        },
        { status: 403 },
      )
    }

    // Get version from query params
    const { searchParams } = new URL(request.url)
    const version = searchParams.get('version') || DIAGNOSIS_PROMPT_VERSION

    // Get prompt from registry
    const prompt = getPrompt('diagnosis', version)

    if (!prompt) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROMPT_NOT_FOUND',
            message: `Diagnosis prompt version ${version} not found`,
          },
        },
        { status: 404 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        prompt_bundle_version: DIAGNOSIS_PROMPT_BUNDLE_VERSION,
        prompt_version: DIAGNOSIS_PROMPT_VERSION,
        schema_version: DIAGNOSIS_SCHEMA_VERSION,
        metadata: prompt.metadata,
        placeholders: prompt.placeholders,
        guardrails: prompt.guardrails,
      },
    })
  } catch (error) {
    console.error('Diagnosis prompt error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: String(error),
        },
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/studio/diagnosis/prompt
 * 
 * Validate diagnosis prompt output against schema.
 * 
 * Body:
 * - output: DiagnosisPromptOutputV1 object to validate
 * 
 * Response:
 * - success: boolean
 * - data: { valid: boolean, errors?: ZodError }
 */
export async function POST(request: NextRequest) {
  try {
    // Feature flag check
    const diagnosisPromptEnabled = isFeatureEnabled('DIAGNOSIS_PROMPT_ENABLED')
    if (!diagnosisPromptEnabled) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FEATURE_DISABLED',
            message: 'Diagnosis prompt feature is not enabled',
          },
        },
        { status: 503 },
      )
    }

    // Check authentication
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
            code: 'UNAUTHORIZED',
            message: 'Authentication required',
          },
        },
        { status: 401 },
      )
    }

    // Check if user is clinician or admin
    const userRole = user.app_metadata?.role
    const isAuthorized = userRole === 'clinician' || userRole === 'admin'

    if (!isAuthorized) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FORBIDDEN',
            message: 'Only clinicians and admins can validate diagnosis prompt output',
          },
        },
        { status: 403 },
      )
    }

    // Parse request body
    const body = await request.json()
    const { output } = body

    if (!output) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Missing required field: output',
          },
        },
        { status: 400 },
      )
    }

    // Validate output against schema
    const validationResult = validateDiagnosisPromptOutputV1(output)

    if (validationResult.success) {
      return NextResponse.json({
        success: true,
        data: {
          valid: true,
          output: validationResult.data,
          schema_version: DIAGNOSIS_SCHEMA_VERSION,
        },
      })
    } else {
      return NextResponse.json({
        success: true,
        data: {
          valid: false,
          errors: validationResult.error.errors,
          schema_version: DIAGNOSIS_SCHEMA_VERSION,
        },
      })
    }
  } catch (error) {
    console.error('Diagnosis prompt validation error:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
          details: String(error),
        },
      },
      { status: 500 },
    )
  }
}
