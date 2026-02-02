/**
 * E75.2: Studio Anamnesis API - Create Version
 * 
 * POST /api/studio/anamnesis/[entryId]/versions
 * 
 * Creates a new version of an existing anamnesis entry.
 * Accessible by clinicians assigned to the patient.
 * 
 * Security:
 * - Requires authentication
 * - Requires clinician or admin role
 * - RLS ensures clinician can only update entries for assigned patients
 * - Returns 403 if not clinician
 * - Returns 404 if entry not found or not accessible
 * - Returns 409 if entry is archived
 * 
 * Request Body:
 * {
 *   title: string,
 *   content: object,
 *   entry_type?: string,
 *   tags?: string[],
 *   change_reason?: string
 * }
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     entry: { id, title, content, ... },
 *     version: { id, version_number, ... }
 *   }
 * }
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient, hasClinicianRole } from '@/lib/db/supabase.server'
import { getAnamnesisEntry } from '@/lib/api/anamnesis/helpers'
import { ErrorCode } from '@/lib/api/responseTypes'
import { validateCreateVersion } from '@/lib/api/anamnesis/validation'
import type { Json } from '@/lib/types/supabase'
import { z } from 'zod'

type RouteContext = {
  params: Promise<{ entryId: string }>
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { entryId } = await context.params
    const supabase = await createServerSupabaseClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'Authentication required',
          },
        },
        { status: 401 }
      )
    }

    // Check clinician role
    const isClinician = await hasClinicianRole()

    if (!isClinician) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: 'Clinician or admin role required',
          },
        },
        { status: 403 }
      )
    }

    // Fetch entry (RLS will ensure clinician has access to patient)
    const entry = await getAnamnesisEntry(supabase, entryId)

    if (!entry) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Anamnesis entry not found or not accessible',
          },
        },
        { status: 404 }
      )
    }

    // Check if entry is archived
    if (entry.is_archived) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.STATE_CONFLICT,
            message: 'Cannot update archived entry',
          },
        },
        { status: 409 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    let validatedData

    try {
      validatedData = validateCreateVersion(body)
    } catch (err) {
      if (err instanceof z.ZodError) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ErrorCode.VALIDATION_FAILED,
              message: 'Validation failed',
              details: err.issues,
            },
          },
          { status: 400 }
        )
      }
      throw err
    }

    // Update entry (trigger will create new version)
    const { data: updatedEntry, error: updateError } = await supabase
      .from('anamnesis_entries')
      .update({
        title: validatedData.title,
        content: validatedData.content as Json,
        entry_type: validatedData.entry_type || entry.entry_type,
        tags: validatedData.tags || entry.tags,
        updated_by: user.id,
      })
      .eq('id', entryId)
      .select()
      .single()

    if (updateError) {
      console.error('[studio/anamnesis/versions POST] Update error:', updateError)
      
      // If RLS prevents update, return 404
      if (updateError.code === '42501' || updateError.code === 'PGRST301') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ErrorCode.NOT_FOUND,
              message: 'Anamnesis entry not accessible',
            },
          },
          { status: 404 }
        )
      }

      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Failed to create version',
          },
        },
        { status: 500 }
      )
    }

    // Fetch the latest version that was created by the trigger
    const { data: version, error: versionError } = await supabase
      .from('anamnesis_entry_versions')
      .select('*')
      .eq('entry_id', entryId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    if (versionError) {
      console.error('[studio/anamnesis/versions POST] Version fetch error:', versionError)
      // Entry was updated but version fetch failed - still return success
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          entry: updatedEntry,
          version: version || null,
        },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[studio/anamnesis/versions POST] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 }
    )
  }
}
