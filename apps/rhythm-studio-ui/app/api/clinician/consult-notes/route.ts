/**
 * Issue 5: Consult Notes API — Create & List
 * 
 * POST /api/clinician/consult-notes
 * Creates a new consult note for a patient
 * 
 * GET /api/clinician/consult-notes?patientId=xxx
 * Lists consult notes for a patient
 */

import { NextResponse, type NextRequest } from 'next/server'
import { createServerSupabaseClient, hasClinicianRole } from '@/lib/db/supabase.server'
import { ErrorCode } from '@/lib/api/responseTypes'
import type {
  ConsultNoteContent,
  CreateConsultNotePayload,
  ConsultNoteApiResponse,
  CreateConsultNoteResponse,
  ListConsultNotesResponse,
} from '@/lib/types/consultNote'
import type { Json } from '@/lib/types/supabase'
import { validateConsultNote } from '@/lib/validation/consultNote'
import { createConsultNotePayload } from '@/lib/consultNote/helpers'
import { randomUUID } from 'crypto'

/**
 * POST - Create new consult note
 */
export async function POST(request: NextRequest): Promise<NextResponse<ConsultNoteApiResponse<CreateConsultNoteResponse>>> {
  const requestId = randomUUID()
  const endpoint = '/api/clinician/consult-notes'

  try {
    console.log('[consult-notes] POST request received', { requestId, endpoint })

    // Auth check
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.warn('[consult-notes] Unauthorized access attempt', { requestId })
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
      console.warn('[consult-notes] Non-clinician access attempt', { requestId, userId: user.id })
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

    // Parse request body
    const body = await request.json().catch((parseError) => {
      console.error('[consult-notes] JSON parsing error', { requestId, error: String(parseError) })
      return null
    })

    if (!body) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.INVALID_INPUT,
            message: 'Invalid JSON in request body',
          },
        },
        { status: 400 }
      )
    }

    // Validate required fields
    const { patient_id, organization_id, content } = body as Partial<CreateConsultNotePayload>

    if (!patient_id || !organization_id || !content) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_FAILED,
            message: 'Missing required fields: patient_id, organization_id, content',
          },
        },
        { status: 400 }
      )
    }

    // Validate consult note structure
    const validation = validateConsultNote(content as ConsultNoteContent)

    if (!validation.valid) {
      console.warn('[consult-notes] Validation failed', {
        requestId,
        errors: validation.errors,
        warnings: validation.warnings,
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_FAILED,
            message: 'Consult note validation failed',
            details: {
              errors: validation.errors,
              warnings: validation.warnings,
            },
          },
        },
        { status: 400 }
      )
    }

    // Create payload with defaults
    const payload = createConsultNotePayload(
      patient_id,
      organization_id,
      content as ConsultNoteContent,
      {
        chatSessionId: body.chat_session_id,
        consultationType: body.consultation_type,
        guidelineVersion: body.guideline_version,
        uncertaintyProfile: body.uncertainty_profile,
        assertiveness: body.assertiveness,
        audience: body.audience,
      }
    )

    // Add created_by
    const insertPayload = {
      ...payload,
      content: payload.content as unknown as Json,
      metadata: payload.metadata as unknown as Json,
      created_by: user.id,
      updated_by: user.id,
    }

    // Insert into database
    const { data: consultNote, error: insertError } = await supabase
      .from('consult_notes')
      .insert(insertPayload)
      .select()
      .single()

    if (insertError) {
      console.error('[consult-notes] Database insert error', {
        requestId,
        error: insertError.message,
        code: insertError.code,
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Failed to create consult note',
            details: insertError.message,
          },
        },
        { status: 500 }
      )
    }

    console.log('[consult-notes] Consult note created successfully', {
      requestId,
      consultNoteId: consultNote.id,
      patientId: patient_id,
    })

    return NextResponse.json({
      success: true,
      data: {
        consultNote,
        validation,
      },
    })
  } catch (error) {
    console.error('[consult-notes] Unexpected error', {
      requestId,
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

/**
 * GET - List consult notes for a patient
 */
export async function GET(request: NextRequest): Promise<NextResponse<ConsultNoteApiResponse<ListConsultNotesResponse>>> {
  const requestId = randomUUID()
  const endpoint = '/api/clinician/consult-notes'

  try {
    console.log('[consult-notes] GET request received', { requestId, endpoint })

    // Auth check
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.warn('[consult-notes] Unauthorized access attempt', { requestId })
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
      console.warn('[consult-notes] Non-clinician access attempt', { requestId, userId: user.id })
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

    // Parse query parameters
    const { searchParams } = new URL(request.url)
    const patientId = searchParams.get('patientId')
    const page = parseInt(searchParams.get('page') || '1', 10)
    const perPage = parseInt(searchParams.get('perPage') || '20', 10)

    if (!patientId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.VALIDATION_FAILED,
            message: 'Missing required parameter: patientId',
          },
        },
        { status: 400 }
      )
    }

    // Query consult notes with pagination
    const offset = (page - 1) * perPage
    const { data: consultNotes, error: queryError, count } = await supabase
      .from('consult_notes')
      .select('*', { count: 'exact' })
      .eq('patient_id', patientId)
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + perPage - 1)

    if (queryError) {
      console.error('[consult-notes] Database query error', {
        requestId,
        error: queryError.message,
      })
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Failed to fetch consult notes',
            details: queryError.message,
          },
        },
        { status: 500 }
      )
    }

    console.log('[consult-notes] Consult notes fetched successfully', {
      requestId,
      patientId,
      count: consultNotes?.length || 0,
      total: count,
    })

    return NextResponse.json({
      success: true,
      data: {
        consultNotes: consultNotes || [],
        total: count || 0,
        page,
        perPage,
      },
    })
  } catch (error) {
    console.error('[consult-notes] Unexpected error', {
      requestId,
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
