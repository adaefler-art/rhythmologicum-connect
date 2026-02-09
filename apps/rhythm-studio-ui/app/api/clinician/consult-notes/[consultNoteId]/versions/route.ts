/**
 * Issue 5: Consult Note Versions API
 * 
 * GET /api/clinician/consult-notes/[consultNoteId]/versions
 * Retrieves version history for a consult note
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient, hasClinicianRole } from '@/lib/db/supabase.server'
import { ErrorCode } from '@/lib/api/responseTypes'
import type { ConsultNoteVersion, ConsultNoteApiResponse } from '@/lib/types/consultNote'
import { randomUUID } from 'crypto'

type RouteContext = {
  params: Promise<{ consultNoteId: string }>
}

/**
 * GET - Retrieve version history for consult note
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ConsultNoteApiResponse<ConsultNoteVersion[]>>> {
  const requestId = randomUUID()
  const { consultNoteId } = await context.params
  const endpoint = `/api/clinician/consult-notes/${consultNoteId}/versions`

  try {
    console.log('[consult-notes/versions] GET request received', {
      requestId,
      endpoint,
      consultNoteId,
    })

    // Auth check
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.warn('[consult-notes/versions] Unauthorized access attempt', {
        requestId,
        consultNoteId,
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

    // Check clinician role
    const isClinician = await hasClinicianRole()
    if (!isClinician) {
      console.warn('[consult-notes/versions] Non-clinician access attempt', {
        requestId,
        userId: user.id,
        consultNoteId,
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.FORBIDDEN,
            message: 'Clinician role required',
          },
        },
        { status: 403 }
      )
    }

    // Fetch version history
    const { data: versions, error: queryError } = await supabase
      .from('consult_note_versions')
      .select('*')
      .eq('consult_note_id', consultNoteId)
      .order('version_number', { ascending: false })

    if (queryError) {
      console.error('[consult-notes/versions] Database query error', {
        requestId,
        consultNoteId,
        error: queryError.message,
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Failed to fetch version history',
            details: queryError.message,
          },
        },
        { status: 500 }
      )
    }

    console.log('[consult-notes/versions] Version history fetched successfully', {
      requestId,
      consultNoteId,
      versionCount: versions?.length || 0,
    })

    return NextResponse.json({
      success: true,
      data: (versions || []) as ConsultNoteVersion[],
    })
  } catch (error) {
    console.error('[consult-notes/versions] Unexpected error', {
      requestId,
      consultNoteId,
      error: String(error),
    })

    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'Internal server error',
        },
      },
      { status: 500 }
    )
  }
}
