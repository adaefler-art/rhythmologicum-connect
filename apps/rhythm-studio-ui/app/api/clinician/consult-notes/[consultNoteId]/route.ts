/**
 * Issue 5: Consult Note Detail API
 * 
 * GET /api/clinician/consult-notes/[consultNoteId]
 * Retrieves a specific consult note by ID
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient, hasClinicianRole } from '@/lib/db/supabase.server'
import { ErrorCode } from '@/lib/api/responseTypes'
import type { ConsultNote, ConsultNoteApiResponse, ConsultNoteContent } from '@/lib/types/consultNote'
import { randomUUID } from 'crypto'

type RouteContext = {
  params: Promise<{ consultNoteId: string }>
}

/**
 * GET - Retrieve specific consult note
 */
export async function GET(
  request: NextRequest,
  context: RouteContext
): Promise<NextResponse<ConsultNoteApiResponse<ConsultNote>>> {
  const requestId = randomUUID()
  const { consultNoteId } = await context.params
  const endpoint = `/api/clinician/consult-notes/${consultNoteId}`

  try {
    console.log('[consult-notes] GET request received', { requestId, endpoint, consultNoteId })

    // Auth check
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.warn('[consult-notes] Unauthorized access attempt', { requestId, consultNoteId })
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
      console.warn('[consult-notes] Non-clinician access attempt', {
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

    // Fetch consult note
    const { data: consultNote, error: queryError } = await supabase
      .from('consult_notes')
      .select('*')
      .eq('id', consultNoteId)
      .single()

    if (queryError) {
      if (queryError.code === 'PGRST116') {
        // Not found
        console.warn('[consult-notes] Consult note not found', { requestId, consultNoteId })
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ErrorCode.NOT_FOUND,
              message: 'Consult note not found',
            },
          },
          { status: 404 }
        )
      }

      console.error('[consult-notes] Database query error', {
        requestId,
        consultNoteId,
        error: queryError.message,
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Failed to fetch consult note',
            details: queryError.message,
          },
        },
        { status: 500 }
      )
    }

    console.log('[consult-notes] Consult note fetched successfully', {
      requestId,
      consultNoteId,
      patientId: consultNote.patient_id,
    })

    const metadata = consultNote.metadata
    const normalizedMetadata =
      metadata && typeof metadata === 'object' && !Array.isArray(metadata)
        ? (metadata as Record<string, unknown>)
        : undefined

    const typedConsultNote: ConsultNote = {
      ...consultNote,
      content: consultNote.content as unknown as ConsultNoteContent,
      metadata: normalizedMetadata,
    }

    return NextResponse.json({
      success: true,
      data: typedConsultNote,
    })
  } catch (error) {
    console.error('[consult-notes] Unexpected error', {
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
