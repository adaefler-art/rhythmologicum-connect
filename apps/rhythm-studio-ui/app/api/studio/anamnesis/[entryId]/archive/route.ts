/**
 * E75.2: Studio Anamnesis API - Archive Entry
 * 
 * POST /api/studio/anamnesis/[entryId]/archive
 * 
 * Archives an anamnesis entry (soft delete).
 * Accessible by clinicians assigned to the patient.
 * 
 * Security:
 * - Requires authentication
 * - Requires clinician or admin role
 * - RLS ensures clinician can only archive entries for assigned patients
 * - Returns 403 if not clinician
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

    // Archive entry
    const { data: archivedEntry, error: archiveError } = await (supabase as any)
      .from('anamnesis_entries')  // Type cast due to outdated Supabase types (E76.4)
      .update({
        is_archived: true,
        updated_by: user.id,
      })
      .eq('id', entryId)
      .select()
      .single()

    if (archiveError) {
      console.error('[studio/anamnesis/archive POST] Archive error:', archiveError)
      
      // If RLS prevents update, return 404
      if (archiveError.code === '42501' || archiveError.code === 'PGRST301') {
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
    console.error('[studio/anamnesis/archive POST] Unexpected error:', err)
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
