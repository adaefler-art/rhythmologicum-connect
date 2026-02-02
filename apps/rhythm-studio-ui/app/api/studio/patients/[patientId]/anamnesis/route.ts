/**
 * E75.2: Studio Anamnesis API - List Patient Entries
 * 
 * GET /api/studio/patients/[patientId]/anamnesis
 * 
 * Returns list of anamnesis entries for a specific patient.
 * Accessible by clinicians assigned to the patient.
 * 
 * Security:
 * - Requires authentication
 * - Requires clinician or admin role
 * - RLS ensures clinician can only see assigned patient entries
 * - Returns 403 if not clinician
 * - Returns 404 if patient not found or not accessible
 * 
 * Response Format:
 * {
 *   success: true,
 *   data: {
 *     entries: Array<{
 *       id: string,
 *       title: string,
 *       content: object,
 *       entry_type: string | null,
 *       tags: string[],
 *       is_archived: boolean,
 *       created_at: string,
 *       updated_at: string,
 *       version_count: number
 *     }>
 *   }
 * }
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient, hasClinicianRole } from '@/lib/db/supabase.server'
import { ErrorCode } from '@/lib/api/responseTypes'
import { getPatientOrganizationId } from '@/lib/api/anamnesis/helpers'
import { validateCreateEntry } from '@/lib/api/anamnesis/validation'
import type { Json } from '@/lib/types/supabase'
import { z } from 'zod'

type RouteContext = {
  params: Promise<{ patientId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { patientId } = await context.params
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

    // Verify patient exists
    const { data: patient, error: patientError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('id', patientId)
      .maybeSingle()

    if (patientError || !patient) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Patient not found',
          },
        },
        { status: 404 }
      )
    }

    // Fetch anamnesis entries
    // RLS policies automatically filter to assigned patients
    const { data: entries, error: queryError } = await supabase
      .from('anamnesis_entries')
      .select(
        `
        id,
        title,
        content,
        entry_type,
        tags,
        is_archived,
        created_at,
        updated_at,
        created_by,
        updated_by
      `
      )
      .eq('patient_id', patientId)
      .order('updated_at', { ascending: false })

    if (queryError) {
      console.error('[studio/patients/anamnesis GET] Query error:', queryError)
      
      // If query returns no rows due to RLS, treat as 404
      if (queryError.code === 'PGRST116') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ErrorCode.NOT_FOUND,
              message: 'Patient not accessible or not assigned',
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
            message: 'Failed to fetch anamnesis entries',
          },
        },
        { status: 500 }
      )
    }

    // Get version counts for each entry
    const entriesWithVersions = await Promise.all(
      (entries || []).map(async (entry) => {
        const { count } = await supabase
          .from('anamnesis_entry_versions')
          .select('*', { count: 'exact', head: true })
          .eq('entry_id', entry.id)

        return {
          ...entry,
          version_count: count || 0,
        }
      })
    )

    return NextResponse.json({
      success: true,
      data: {
        entries: entriesWithVersions,
      },
    })
  } catch (err) {
    console.error('[studio/patients/anamnesis GET] Unexpected error:', err)
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

/**
 * POST /api/studio/patients/[patientId]/anamnesis
 * 
 * Creates a new anamnesis entry for a specific patient.
 * Accessible by clinicians assigned to the patient.
 * 
 * Security:
 * - Requires authentication
 * - Requires clinician or admin role
 * - RLS ensures clinician can only create entries for assigned patients
 * - Returns 403 if not clinician
 * - Returns 404 if patient not found or not accessible
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
export async function POST(request: Request, context: RouteContext) {
  try {
    const { patientId } = await context.params
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

    // Verify patient exists
    const { data: patient, error: patientError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('id', patientId)
      .maybeSingle()

    if (patientError || !patient) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Patient not found',
          },
        },
        { status: 404 }
      )
    }

    // Get organization ID
    const organizationId = await getPatientOrganizationId(supabase, patientId)

    if (!organizationId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Patient organization not found',
          },
        },
        { status: 404 }
      )
    }

    // Parse and validate request body
    const body = await request.json()
    let validatedData

    try {
      validatedData = validateCreateEntry(body)
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

    // Create anamnesis entry
    // Database trigger will automatically create version 1
    // RLS will ensure clinician has access to this patient
    const { data: entry, error: createError } = await supabase
      .from('anamnesis_entries')
      .insert({
        patient_id: patientId,
        organization_id: organizationId,
        title: validatedData.title,
        content: validatedData.content as Json,
        entry_type: validatedData.entry_type || null,
        tags: validatedData.tags || [],
        created_by: user.id,
        updated_by: user.id,
      })
      .select()
      .single()

    if (createError) {
      console.error('[studio/patients/anamnesis POST] Create error:', createError)
      
      // If RLS prevents insert, return 404 (patient not assigned)
      if (createError.code === '42501' || createError.code === 'PGRST301') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ErrorCode.NOT_FOUND,
              message: 'Patient not accessible or not assigned',
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
            message: 'Failed to create anamnesis entry',
          },
        },
        { status: 500 }
      )
    }

    // Fetch the version that was created by the trigger
    const { data: version, error: versionError } = await supabase
      .from('anamnesis_entry_versions')
      .select('*')
      .eq('entry_id', entry.id)
      .eq('version_number', 1)
      .single()

    if (versionError) {
      console.error('[studio/patients/anamnesis POST] Version fetch error:', versionError)
      // Entry was created but version fetch failed - still return success
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          entry,
          version: version || null,
        },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[studio/patients/anamnesis POST] Unexpected error:', err)
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
