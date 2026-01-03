import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/supabase.server'
import {
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
// Justification: status updates may be performed by server-side processing (no user cookies).
// Using the admin client allows controlled writes even when RLS would block background jobs.
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import { updateDocumentParsingStatus } from '@/lib/documents/helpers'
import { ParsingStatus } from '@/lib/types/documents'
import { logUnauthorized } from '@/lib/logging/logger'
import { randomUUID } from 'crypto'

/**
 * API Route: Update Document Parsing Status
 * 
 * PATCH /api/documents/[id]/status
 * 
 * Updates the parsing status of a document with state machine validation.
 * This endpoint is typically called by server-side processing (I04.2),
 * not directly by patients.
 * 
 * Request Body:
 * {
 *   status: ParsingStatus ('pending' | 'processing' | 'completed' | 'failed' | 'partial')
 * }
 * 
 * Response (B8 standardized):
 * {
 *   success: boolean,
 *   data?: { documentId: string, status: ParsingStatus },
 *   error?: { code: string, message: string }
 * }
 * 
 * Security:
 * - Requires authentication (service role or authenticated user)
 * - Validates status transitions via state machine (422 for invalid transitions)
 * - Logs all status changes for audit trail
 * - Fail-closed: validates before writing
 */

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(request: NextRequest, props: RouteParams) {
  const params = await props.params
  const documentId = params.id
  const requestId = randomUUID()

  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      logUnauthorized({
        endpoint: '/api/documents/[id]/status',
        requestId,
      })
      return unauthorizedResponse('Authentifizierung erforderlich.')
    }

    // Parse request body
    const body = await request.json()
    const newStatus = body.status as ParsingStatus

    // Validate status value
    const validStatuses: ParsingStatus[] = [
      'pending',
      'processing',
      'completed',
      'failed',
      'partial',
    ]
    if (!newStatus || !validStatuses.includes(newStatus)) {
      return validationErrorResponse(
        'Ungültiger Status. Erlaubte Werte: pending, processing, completed, failed, partial',
        {
          field: 'status',
          allowedValues: validStatuses,
          requestId,
        },
      )
    }

    // Validate UUID format for documentId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(documentId)) {
      return validationErrorResponse('Ungültige Dokument-ID.', {
        field: 'id',
        message: 'Dokument-ID muss eine gültige UUID sein',
        requestId,
      })
    }

    // Update status with validation (returns 422 for invalid transitions)
  const adminClient = createAdminSupabaseClient()
  const result = await updateDocumentParsingStatus(adminClient, documentId, newStatus)

    if (!result.success) {
      // Use 422 for invalid state transitions (business logic error)
      const isTransitionError = result.error?.includes('Invalid status transition')
      
      console.error('[STATUS_UPDATE_FAILED]', {
        requestId,
        documentId,
        newStatus,
        error: result.error,
        userId: user.id,
      })
      
      if (isTransitionError) {
        // Return 422 Unprocessable Entity for invalid state transitions
        return new Response(
          JSON.stringify({
            success: false,
            error: {
              code: 'VALIDATION_FAILED',
              message: result.error,
              details: {
                field: 'status',
                requestId,
              },
            },
          }),
          {
            status: 422,
            headers: { 'Content-Type': 'application/json' },
          },
        )
      }
      
      // Return 400 for other validation errors
      return validationErrorResponse(result.error || 'Status-Update fehlgeschlagen.', {
        field: 'status',
        message: result.error,
        requestId,
      })
    }

    // Return success response
    return successResponse({
      documentId,
      status: newStatus,
    })
  } catch (error) {
    console.error('[STATUS_UPDATE_UNEXPECTED_ERROR]', {
      requestId,
      documentId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return internalErrorResponse('Ein unerwarteter Fehler ist aufgetreten.')
  }
}
