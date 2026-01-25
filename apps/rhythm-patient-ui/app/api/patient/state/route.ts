/**
 * I2.1: Patient State API - GET/POST Endpoints
 * 
 * Provides read/write access to canonical patient state v0.1
 * Enforces RLS and authentication
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient, getCurrentUser } from '@/lib/db/supabase.server'
import {
  createEmptyPatientState,
  mergePatientState,
  safeValidatePatientState,
  type PatientStateV01,
  type UpdatePatientStateRequest,
  PATIENT_STATE_VERSION,
} from '@/lib/api/contracts/patient/state'
import { randomUUID } from 'crypto'

export const dynamic = 'force-dynamic'
export const revalidate = 0

/**
 * GET /api/patient/state
 * Fetches current patient state for authenticated user
 * Returns empty state if no state exists
 */
export async function GET() {
  const correlationId = randomUUID()

  try {
    // Auth check first
    const user = await getCurrentUser()
    if (!user) {
      console.log('[PATIENT_STATE_API] STEP=requireAuth success=false reason=unauthorized', {
        correlationId,
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        },
        { status: 401 },
      )
    }

    console.log('[PATIENT_STATE_API] STEP=requireAuth success=true', {
      correlationId,
      userId: user.id,
    })

    // Get supabase client
    const supabase = await createServerSupabaseClient()

    // Fetch patient state
    const { data, error } = await supabase
      .from('patient_state')
      .select('id, user_id, patient_state_version, state_data, updated_at, created_at')
      .eq('user_id', user.id)
      .single()

    if (error) {
      // If no state found, return empty state (not an error)
      if (error.code === 'PGRST116') {
        console.log('[PATIENT_STATE_API] STEP=fetchState success=true reason=notFound', {
          correlationId,
          userId: user.id,
        })
        
        const emptyState = createEmptyPatientState()
        return NextResponse.json(
          {
            success: true,
            data: emptyState,
            schemaVersion: PATIENT_STATE_VERSION,
            requestId: correlationId,
          },
          { status: 200 },
        )
      }

      // Other errors
      console.error('[PATIENT_STATE_API] STEP=fetchState success=false', {
        correlationId,
        errorCode: error.code,
        errorMessage: error.message,
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'DATABASE_ERROR',
            message: 'Failed to fetch patient state',
          },
        },
        { status: 500 },
      )
    }

    // Validate and parse state_data
    const stateData = data.state_data as unknown
    const validatedState = safeValidatePatientState(stateData)

    if (!validatedState) {
      console.warn('[PATIENT_STATE_API] STEP=validateState success=false reason=invalidSchema', {
        correlationId,
        userId: user.id,
      })
      
      // Return empty state if validation fails
      const emptyState = createEmptyPatientState()
      return NextResponse.json(
        {
          success: true,
          data: emptyState,
          schemaVersion: PATIENT_STATE_VERSION,
          requestId: correlationId,
        },
        { status: 200 },
      )
    }

    console.log('[PATIENT_STATE_API] STEP=fetchState success=true', {
      correlationId,
      userId: user.id,
      version: validatedState.patient_state_version,
    })

    return NextResponse.json(
      {
        success: true,
        data: validatedState,
        schemaVersion: PATIENT_STATE_VERSION,
        requestId: correlationId,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('[PATIENT_STATE_API] STEP=GET exception', {
      correlationId,
      errorType: error instanceof Error ? error.name : 'unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      },
      { status: 500 },
    )
  }
}

/**
 * POST /api/patient/state
 * Updates patient state (partial updates supported)
 * Creates state if it doesn't exist
 */
export async function POST(request: Request) {
  const correlationId = randomUUID()

  try {
    // Auth check first
    const user = await getCurrentUser()
    if (!user) {
      console.log('[PATIENT_STATE_API] STEP=requireAuth success=false reason=unauthorized', {
        correlationId,
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
          },
        },
        { status: 401 },
      )
    }

    console.log('[PATIENT_STATE_API] STEP=requireAuth success=true', {
      correlationId,
      userId: user.id,
    })

    // Parse request body
    let updateRequest: UpdatePatientStateRequest
    try {
      updateRequest = await request.json()
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_REQUEST',
            message: 'Invalid JSON in request body',
          },
        },
        { status: 400 },
      )
    }

    // Get supabase client
    const supabase = await createServerSupabaseClient()

    // Fetch existing state
    const { data: existingData, error: fetchError } = await supabase
      .from('patient_state')
      .select('id, user_id, patient_state_version, state_data, updated_at, created_at')
      .eq('user_id', user.id)
      .single()

    let currentState: PatientStateV01
    let isNewState = false

    if (fetchError) {
      if (fetchError.code === 'PGRST116') {
        // No existing state, create new
        currentState = createEmptyPatientState()
        isNewState = true
        console.log('[PATIENT_STATE_API] STEP=fetchExistingState success=true reason=notFound', {
          correlationId,
          userId: user.id,
        })
      } else {
        console.error('[PATIENT_STATE_API] STEP=fetchExistingState success=false', {
          correlationId,
          errorCode: fetchError.code,
          errorMessage: fetchError.message,
        })
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Failed to fetch existing state',
            },
          },
          { status: 500 },
        )
      }
    } else {
      // Parse existing state
      const stateData = existingData.state_data as unknown
      const validatedState = safeValidatePatientState(stateData)
      
      if (!validatedState) {
        console.warn('[PATIENT_STATE_API] STEP=validateExistingState success=false', {
          correlationId,
          userId: user.id,
        })
        currentState = createEmptyPatientState()
      } else {
        currentState = validatedState
      }
      
      console.log('[PATIENT_STATE_API] STEP=fetchExistingState success=true', {
        correlationId,
        userId: user.id,
      })
    }

    // Merge update into current state
    const updatedState = mergePatientState(currentState, updateRequest)

    // Save to database
    if (isNewState) {
      // Insert new state
      const { error: insertError } = await supabase.from('patient_state').insert({
        user_id: user.id,
        patient_state_version: PATIENT_STATE_VERSION,
        state_data: updatedState as unknown as Record<string, unknown>,
      })

      if (insertError) {
        console.error('[PATIENT_STATE_API] STEP=insertState success=false', {
          correlationId,
          errorCode: insertError.code,
          errorMessage: insertError.message,
        })
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Failed to create patient state',
            },
          },
          { status: 500 },
        )
      }

      console.log('[PATIENT_STATE_API] STEP=insertState success=true', {
        correlationId,
        userId: user.id,
      })
    } else {
      // Update existing state
      const { error: updateError } = await supabase
        .from('patient_state')
        .update({
          state_data: updatedState as unknown as Record<string, unknown>,
        })
        .eq('user_id', user.id)

      if (updateError) {
        console.error('[PATIENT_STATE_API] STEP=updateState success=false', {
          correlationId,
          errorCode: updateError.code,
          errorMessage: updateError.message,
        })
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'DATABASE_ERROR',
              message: 'Failed to update patient state',
            },
          },
          { status: 500 },
        )
      }

      console.log('[PATIENT_STATE_API] STEP=updateState success=true', {
        correlationId,
        userId: user.id,
      })
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedState,
        schemaVersion: PATIENT_STATE_VERSION,
        requestId: correlationId,
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('[PATIENT_STATE_API] STEP=POST exception', {
      correlationId,
      errorType: error instanceof Error ? error.name : 'unknown',
      errorMessage: error instanceof Error ? error.message : String(error),
    })
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'Internal server error',
        },
      },
      { status: 500 },
    )
  }
}
