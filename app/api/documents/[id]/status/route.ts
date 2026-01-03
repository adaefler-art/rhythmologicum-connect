import { NextRequest } from 'next/server'
import { getCurrentUser } from '@/lib/db/supabase.server'
import {
  successResponse,
  unauthorizedResponse,
  validationErrorResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
import { updateDocumentParsingStatus } from '@/lib/documents/helpers'
import { ParsingStatus } from '@/lib/types/documents'
import { logUnauthorized } from '@/lib/logging/logger'

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
 * - Validates status transitions via state machine
 * - Logs all status changes for audit trail
 */

type RouteParams = {
  params: Promise<{
    id: string
  }>
}

export async function PATCH(request: NextRequest, props: RouteParams) {
  const params = await props.params
  const documentId = params.id

  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      logUnauthorized({
        endpoint: '/api/documents/[id]/status',
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
        },
      )
    }

    // Validate UUID format for documentId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(documentId)) {
      return validationErrorResponse('Ungültige Dokument-ID.', {
        field: 'id',
        message: 'Dokument-ID muss eine gültige UUID sein',
      })
    }

    // Update status with validation
    const result = await updateDocumentParsingStatus(documentId, newStatus)

    if (!result.success) {
      return validationErrorResponse(result.error || 'Status-Update fehlgeschlagen.', {
        field: 'status',
        message: result.error,
      })
    }

    // Return success response
    return successResponse({
      documentId,
      status: newStatus,
    })
  } catch (error) {
    console.error('Unexpected error updating document status:', error)
    return internalErrorResponse('Ein unerwarteter Fehler ist aufgetreten.')
  }
}
