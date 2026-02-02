/**
 * E75.2: Patient Anamnesis API - Archive Entry
 * 
 * POST /api/patient/anamnesis/[entryId]/archive
 * 
 * Archives an anamnesis entry (soft delete).
 * 
 * Security:
 * - Requires authentication
 * - RLS ensures patient can only archive their own entries
 * - Returns 404 if entry not found or not accessible
 * 
 * Response:
 * {
 *   success: true,
 *   data: {
 *     entry: { id, is_archived: true, ... }
 *   }
 * }
 */

import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { getAnamnesisEntry } from '@/lib/api/anamnesis/helpers'
import { ErrorCode } from '@/lib/api/responseTypes'

type RouteContext = {
  params: Promise<{ entryId: string }>
}

export async function POST(_request: Request, context: RouteContext) {
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

    // Fetch entry (RLS will ensure it's patient's own entry)
    const entry = await getAnamnesisEntry(supabase, entryId)

    if (!entry) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Anamnesis entry not found',
          },
        },
        { status: 404 }
      )
    }

    // Archive entry
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
      console.error('[patient/anamnesis/archive POST] Archive error:', archiveError)
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Failed to archive entry',
          },
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        entry: archivedEntry,
      },
    })
  } catch (err) {
    console.error('[patient/anamnesis/archive POST] Unexpected error:', err)
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
