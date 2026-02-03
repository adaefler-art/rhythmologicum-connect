/**
 * E76.2: Patient Context Pack API Route
 * 
 * Provides access to patient context pack for MCP server and Studio UI.
 * Feature-gated behind NEXT_PUBLIC_FEATURE_MCP_ENABLED.
 * 
 * @endpoint-intent mcp:context-pack Patient context retrieval for diagnosis
 */

import { NextRequest, NextResponse } from 'next/server'
import { buildPatientContextPack } from '@/lib/mcp/contextPackBuilder'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const { patient_id } = await request.json()

    if (!patient_id || typeof patient_id !== 'string') {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_INPUT',
            message: 'patient_id is required and must be a string',
          },
        },
        { status: 400 },
      )
    }

    // Validate UUID format
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(patient_id)) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_UUID',
            message: 'patient_id must be a valid UUID',
          },
        },
        { status: 400 },
      )
    }

    // Check authentication and authorization
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
            message: 'Only clinicians and admins can access patient context packs',
          },
        },
        { status: 403 },
      )
    }

    // Build context pack
    const contextPack = await buildPatientContextPack(patient_id)

    return NextResponse.json({
      success: true,
      data: contextPack,
    })
  } catch (error) {
    console.error('Error building patient context pack:', error)

    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'Unknown error',
        },
      },
      { status: 500 },
    )
  }
}
