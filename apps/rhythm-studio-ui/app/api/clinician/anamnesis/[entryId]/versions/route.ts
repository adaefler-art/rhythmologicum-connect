/**
 * Clinician Anamnesis API - Create Version
 *
 * POST /api/clinician/anamnesis/[entryId]/versions
 */

import { NextResponse } from 'next/server'
import { z } from 'zod'
import { createServerSupabaseClient, hasClinicianRole } from '@/lib/db/supabase.server'
import { getAnamnesisEntry } from '@/lib/api/anamnesis/helpers'
import { ErrorCode } from '@/lib/api/responseTypes'
import { validateCreateVersion } from '@/lib/api/anamnesis/validation'
import type { Json } from '@/lib/types/supabase'

type RouteContext = {
  params: Promise<{ entryId: string }>
}

export async function GET(_request: Request, context: RouteContext) {
  try {
    const { entryId } = await context.params
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
            code: ErrorCode.UNAUTHORIZED,
            message: 'Authentication required',
          },
        },
        { status: 401 },
      )
    }

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
        { status: 403 },
      )
    }

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
        { status: 404 },
      )
    }

    const { data: versions, error: versionsError } = await supabase
      .from('anamnesis_entry_versions')
      .select('id, version_number, title, content, entry_type, tags, changed_at, change_reason')
      .eq('entry_id', entryId)
      .order('version_number', { ascending: false })

    if (versionsError) {
      console.error('[clinician/anamnesis/versions GET] Versions error:', versionsError)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Failed to fetch versions',
          },
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        versions: versions || [],
      },
    })
  } catch (err) {
    console.error('[clinician/anamnesis/versions GET] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 },
    )
  }
}

export async function POST(request: Request, context: RouteContext) {
  try {
    const { entryId } = await context.params
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
            code: ErrorCode.UNAUTHORIZED,
            message: 'Authentication required',
          },
        },
        { status: 401 },
      )
    }

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
        { status: 403 },
      )
    }

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
        { status: 404 },
      )
    }

    if (entry.is_archived) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.STATE_CONFLICT,
            message: 'Cannot update archived entry',
          },
        },
        { status: 409 },
      )
    }

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
          { status: 400 },
        )
      }
      throw err
    }

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
      console.error('[clinician/anamnesis/versions POST] Update error:', updateError)

      if (updateError.code === '42501' || updateError.code === 'PGRST301') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ErrorCode.NOT_FOUND,
              message: 'Anamnesis entry not accessible',
            },
          },
          { status: 404 },
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
        { status: 500 },
      )
    }

    const { data: version, error: versionError } = await supabase
      .from('anamnesis_entry_versions')
      .select('*')
      .eq('entry_id', entryId)
      .order('version_number', { ascending: false })
      .limit(1)
      .single()

    if (versionError) {
      console.error('[clinician/anamnesis/versions POST] Version fetch error:', versionError)
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          entry: updatedEntry,
          version: version || null,
        },
      },
      { status: 201 },
    )
  } catch (err) {
    console.error('[clinician/anamnesis/versions POST] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 },
    )
  }
}
