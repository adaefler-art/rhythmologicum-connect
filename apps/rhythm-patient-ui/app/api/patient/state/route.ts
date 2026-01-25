/**
 * Patient State API Route
 * 
 * GET /api/patient/state - Fetch current patient state
 * PATCH /api/patient/state - Update patient state (idempotent)
 * 
 * Issue: I2.1 - Canonical Patient State v0.1
 * 
 * RLS: Patient can only access their own state; clinicians can view all
 * Versioning: Returns patient_state_version in response
 */

import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import {
  createDefaultPatientState,
  PATIENT_STATE_VERSION,
  type PatientStateV01,
  type PatientStateUpdate,
} from '@/lib/types/patient-state'

/**
 * GET /api/patient/state
 * 
 * Fetches the current patient state. If no state exists, creates and returns
 * a default empty state.
 * 
 * @returns PatientStateV01 with 200 status
 * @returns Error with 401 if unauthorized
 * @returns Error with 500 if database error
 */
export async function GET(request: NextRequest) {
  try {
    // Auth check - FIRST
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

    // Get patient profile ID
    const { data: profile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROFILE_NOT_FOUND',
            message: 'Patient profile not found',
          },
        },
        { status: 404 },
      )
    }

    // Fetch patient state (RLS automatically filters by user)
    const { data: state, error: stateError } = await supabase
      .from('patient_state')
      .select('*')
      .eq('patient_id', profile.id)
      .single()

    // If no state exists, create default state
    if (stateError?.code === 'PGRST116' || !state) {
      const defaultState = createDefaultPatientState()
      
      const { data: newState, error: insertError } = await supabase
        .from('patient_state')
        .insert({
          patient_id: profile.id,
          ...defaultState,
        })
        .select()
        .single()

      if (insertError) {
        console.error('[GET /api/patient/state] Error creating default state:', insertError)
        return NextResponse.json(
          {
            success: false,
            error: {
              code: 'CREATE_STATE_FAILED',
              message: 'Failed to create patient state',
            },
          },
          { status: 500 },
        )
      }

      return NextResponse.json(
        {
          success: true,
          data: newState as PatientStateV01,
          meta: {
            version: PATIENT_STATE_VERSION,
            created: true,
          },
        },
        { status: 200 },
      )
    }

    if (stateError) {
      console.error('[GET /api/patient/state] Error fetching state:', stateError)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FETCH_STATE_FAILED',
            message: 'Failed to fetch patient state',
          },
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: state as PatientStateV01,
        meta: {
          version: PATIENT_STATE_VERSION,
          created: false,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('[GET /api/patient/state] Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 },
    )
  }
}

/**
 * PATCH /api/patient/state
 * 
 * Updates the patient state with partial data. Uses idempotent update logic.
 * Deep merges the provided fields with existing state.
 * 
 * @param request - Request with PatientStateUpdate in body
 * @returns Updated PatientStateV01 with 200 status
 * @returns Error with 400 if invalid payload
 * @returns Error with 401 if unauthorized
 * @returns Error with 500 if database error
 */
export async function PATCH(request: NextRequest) {
  try {
    // Auth check - FIRST
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

    // Parse request body
    let updatePayload: PatientStateUpdate
    try {
      updatePayload = await request.json()
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'INVALID_PAYLOAD',
            message: 'Invalid JSON payload',
          },
        },
        { status: 400 },
      )
    }

    // Get patient profile ID
    const { data: profile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profile) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'PROFILE_NOT_FOUND',
            message: 'Patient profile not found',
          },
        },
        { status: 404 },
      )
    }

    // Fetch current state to merge with updates
    const { data: currentState, error: fetchError } = await supabase
      .from('patient_state')
      .select('*')
      .eq('patient_id', profile.id)
      .single()

    if (fetchError) {
      console.error('[PATCH /api/patient/state] Error fetching current state:', fetchError)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'FETCH_STATE_FAILED',
            message: 'Failed to fetch current state for update',
          },
        },
        { status: 500 },
      )
    }

    // Deep merge update payload with current state
    const mergedState = {
      assessment: {
        ...currentState.assessment,
        ...updatePayload.assessment,
      },
      results: {
        ...currentState.results,
        ...updatePayload.results,
      },
      dialog: {
        ...currentState.dialog,
        ...updatePayload.dialog,
      },
      activity: {
        ...currentState.activity,
        ...updatePayload.activity,
      },
      metrics: {
        ...currentState.metrics,
        ...updatePayload.metrics,
      },
    }

    // Update state (RLS automatically filters by user)
    const { data: updatedState, error: updateError } = await supabase
      .from('patient_state')
      .update(mergedState)
      .eq('patient_id', profile.id)
      .select()
      .single()

    if (updateError) {
      console.error('[PATCH /api/patient/state] Error updating state:', updateError)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: 'UPDATE_STATE_FAILED',
            message: 'Failed to update patient state',
          },
        },
        { status: 500 },
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: updatedState as PatientStateV01,
        meta: {
          version: PATIENT_STATE_VERSION,
          updated: true,
        },
      },
      { status: 200 },
    )
  } catch (error) {
    console.error('[PATCH /api/patient/state] Unexpected error:', error)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: 'INTERNAL_ERROR',
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 },
    )
  }
}
