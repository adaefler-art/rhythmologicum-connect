/**
 * Clinician Anamnesis API - Archive Entry
 *
 * POST /api/clinician/anamnesis/[entryId]/archive
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient, hasClinicianRole } from '@/lib/db/supabase.server'
import { getAnamnesisEntry } from '@/lib/api/anamnesis/helpers'
import { ErrorCode } from '@/lib/api/responseTypes'

type RouteContext = {
  params: Promise<{ entryId: string }>
}

export async function POST(_request: Request, context: RouteContext) {
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

    const { data: archivedEntry, error: archiveError } = await supabase
      .from('anamnesis_entries')
      .update({
        is_archived: true,
        updated_by: user.id,
      })
      .eq('id', entryId)
      .select()
      .single()

    if (archiveError) {
      console.error('[clinician/anamnesis/archive POST] Archive error:', archiveError)

      if (archiveError.code === '42501' || archiveError.code === 'PGRST301') {
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
            message: 'Failed to archive entry',
          },
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        entry: archivedEntry,
      },
    })
  } catch (err) {
    console.error('[clinician/anamnesis/archive POST] Unexpected error:', err)
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
