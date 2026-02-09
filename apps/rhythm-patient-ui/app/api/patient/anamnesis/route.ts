/**
 * E75.2: Patient Anamnesis API - List Entries
 * 
 * GET /api/patient/anamnesis
 * 
 * Returns list of anamnesis entry heads (without full version history) for the authenticated patient.
 * 
 * Security:
 * - Requires authentication
 * - RLS ensures patient can only see their own entries
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
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { getPatientProfileId, getPatientOrganizationId } from '@/lib/api/anamnesis/helpers'
import { ErrorCode } from '@/lib/api/responseTypes'
import { validateCreateEntry } from '@/lib/api/anamnesis/validation'
import type { Json } from '@/lib/types/supabase'
import { z } from 'zod'

const logIntakeEvent = (params: {
  runId: string | null
  userId: string | null
  action: 'create'
  entryId: string | null
  entryType: string | null
  ok: boolean
  errorCode?: string
}) => {
  console.info(
    JSON.stringify({
      runId: params.runId,
      userId: params.userId,
      action: params.action,
      entryId: params.entryId,
      entryType: params.entryType,
      ok: params.ok,
      errorCode: params.errorCode ?? null,
    }),
  )
}

export async function GET() {
  try {
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

    // Get patient profile ID
    const patientId = await getPatientProfileId(supabase, user.id)

    if (!patientId) {
      // No patient profile - return empty list
      return NextResponse.json({
        success: true,
        data: {
          entries: [],
        },
      })
    }

    // Fetch anamnesis entries with version count
    // RLS policies automatically filter to patient's own entries
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
        updated_at
      `
      )
      .eq('patient_id', patientId)
      .order('updated_at', { ascending: false })

    if (queryError) {
      console.error('[patient/anamnesis] Query error:', queryError)
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
    console.error('[patient/anamnesis] Unexpected error:', err)
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
 * POST /api/patient/anamnesis
 * 
 * Creates a new anamnesis entry for the authenticated patient.
 * Automatically creates version 1 via database trigger.
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
export async function POST(request: Request) {
  const runId = request.headers.get('x-intake-run-id')

  try {
    const supabase = await createServerSupabaseClient()

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      logIntakeEvent({
        runId,
        userId: user?.id ?? null,
        action: 'create',
        entryId: null,
        entryType: null,
        ok: false,
        errorCode: ErrorCode.UNAUTHORIZED,
      })
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

    // Get patient profile ID
    const patientId = await getPatientProfileId(supabase, user.id)

    if (!patientId) {
      logIntakeEvent({
        runId,
        userId: user.id,
        action: 'create',
        entryId: null,
        entryType: null,
        ok: false,
        errorCode: ErrorCode.NOT_FOUND,
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Patient profile not found',
          },
        },
        { status: 404 }
      )
    }

    // Get organization ID
    const organizationId = await getPatientOrganizationId(supabase, patientId)

    if (!organizationId) {
      logIntakeEvent({
        runId,
        userId: user.id,
        action: 'create',
        entryId: null,
        entryType: null,
        ok: false,
        errorCode: ErrorCode.NOT_FOUND,
      })
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
        logIntakeEvent({
          runId,
          userId: user.id,
          action: 'create',
          entryId: null,
          entryType: typeof body?.entry_type === 'string' ? body.entry_type : null,
          ok: false,
          errorCode: ErrorCode.VALIDATION_FAILED,
        })
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
      console.error('[patient/anamnesis POST] Create error:', createError)
      logIntakeEvent({
        runId,
        userId: user.id,
        action: 'create',
        entryId: null,
        entryType: validatedData.entry_type || null,
        ok: false,
        errorCode: ErrorCode.DATABASE_ERROR,
      })
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

    const { data: version, error: versionError } = await supabase
      .from('anamnesis_entry_versions')
      .select('*')
      .eq('entry_id', entry.id)
      .eq('version_number', 1)
      .single()

    if (versionError) {
      console.error('[patient/anamnesis POST] Version fetch error:', versionError)
    }

    const { count: versionsCount, error: versionsCountError } = await supabase
      .from('anamnesis_entry_versions')
      .select('*', { count: 'exact', head: true })
      .eq('entry_id', entry.id)

    if (versionsCountError) {
      console.error('[patient/anamnesis POST] Versions count error:', versionsCountError)
    }

    logIntakeEvent({
      runId,
      userId: user.id,
      action: 'create',
      entryId: entry.id,
      entryType: entry.entry_type,
      ok: true,
    })

    return NextResponse.json(
      {
        success: true,
        data: {
          entry,
          version: version || null,
          entryId: entry.id,
          created_at: entry.created_at,
          entry_type: entry.entry_type,
          versions_count: versionsCount || 0,
        },
      },
      { status: 201 }
    )
  } catch (err) {
    console.error('[patient/anamnesis POST] Unexpected error:', err)
    logIntakeEvent({
      runId,
      userId: null,
      action: 'create',
      entryId: null,
      entryType: null,
      ok: false,
      errorCode: ErrorCode.INTERNAL_ERROR,
    })
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
