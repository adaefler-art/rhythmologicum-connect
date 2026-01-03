import { NextRequest } from 'next/server'
import { createServerSupabaseClient, getCurrentUser } from '@/lib/db/supabase.server'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
import {
  isValidMimeType,
  isValidFileSize,
  generateStoragePath,
  uploadToStorage,
  verifyAssessmentOwnership,
} from '@/lib/documents/helpers'
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES, DocumentUploadResponse } from '@/lib/types/documents'
import { logUnauthorized, logForbidden } from '@/lib/logging/logger'

/**
 * API Route: Upload Document
 * 
 * POST /api/documents/upload
 * 
 * Uploads a document file to Supabase Storage and creates a database record.
 * 
 * Request: multipart/form-data
 * - file: File (PDF or image)
 * - assessmentId: string (UUID)
 * - docType: string (optional - e.g., 'lab_report', 'prescription')
 * 
 * Response (B8 standardized):
 * {
 *   success: boolean,
 *   data?: DocumentUploadResponse,
 *   error?: { code: string, message: string }
 * }
 * 
 * Security:
 * - Requires authentication (401 if not authenticated)
 * - Validates user owns the assessment (403 if not)
 * - Validates file type and size
 * - RLS policies enforce row-level security
 */

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const user = await getCurrentUser()
    if (!user) {
      logUnauthorized({
        endpoint: '/api/documents/upload',
      })
      return unauthorizedResponse('Authentifizierung erforderlich. Bitte melden Sie sich an.')
    }

    // Parse multipart form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const assessmentId = formData.get('assessmentId') as string | null
    const docType = (formData.get('docType') as string | null) || undefined

    // Validate required fields
    if (!file) {
      return validationErrorResponse('Datei ist erforderlich.', {
        field: 'file',
        message: 'Keine Datei hochgeladen',
      })
    }

    if (!assessmentId) {
      return validationErrorResponse('Assessment-ID ist erforderlich.', {
        field: 'assessmentId',
        message: 'Assessment-ID fehlt',
      })
    }

    // Validate UUID format for assessmentId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(assessmentId)) {
      return validationErrorResponse('Ungültige Assessment-ID.', {
        field: 'assessmentId',
        message: 'Assessment-ID muss eine gültige UUID sein',
      })
    }

    // Verify user owns the assessment
    const ownershipCheck = await verifyAssessmentOwnership(assessmentId, user.id)
    if (!ownershipCheck.valid) {
      logForbidden(
        {
          endpoint: '/api/documents/upload',
          userId: user.id,
          resource: `assessment:${assessmentId}`,
        },
        ownershipCheck.error || 'Assessment ownership verification failed',
      )
      return forbiddenResponse(
        'Sie haben keine Berechtigung, Dokumente für dieses Assessment hochzuladen.',
      )
    }

    // Validate file type
    if (!isValidMimeType(file.type)) {
      return validationErrorResponse(
        `Ungültiger Dateityp. Erlaubte Typen: ${ALLOWED_MIME_TYPES.join(', ')}`,
        {
          field: 'file',
          message: `Dateityp ${file.type} ist nicht erlaubt`,
          allowedTypes: ALLOWED_MIME_TYPES,
        },
      )
    }

    // Validate file size
    if (!isValidFileSize(file.size)) {
      const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024)
      return validationErrorResponse(
        `Datei ist zu groß. Maximale Größe: ${maxSizeMB} MB`,
        {
          field: 'file',
          message: `Dateigröße ${file.size} überschreitet Maximum von ${MAX_FILE_SIZE} Bytes`,
          maxSize: MAX_FILE_SIZE,
        },
      )
    }

    // Generate storage path
    const storagePath = generateStoragePath(user.id, assessmentId, file.name)

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Upload to storage
    const uploadResult = await uploadToStorage(buffer, storagePath, {
      userId: user.id,
      assessmentId,
      originalFilename: file.name,
      mimeType: file.type,
      size: file.size,
      uploadedAt: new Date().toISOString(),
    })

    if (!uploadResult.success) {
      return internalErrorResponse(
        `Fehler beim Hochladen der Datei: ${uploadResult.error}`,
      )
    }

    // Create database record
    const supabase = await createServerSupabaseClient()
    const { data: document, error: dbError } = await supabase
      .from('documents')
      .insert({
        assessment_id: assessmentId,
        storage_path: storagePath,
        doc_type: docType,
        parsing_status: 'pending',
      })
      .select('id, assessment_id, storage_path, doc_type, parsing_status, created_at')
      .single()

    if (dbError || !document) {
      // If DB insert fails, we should ideally delete the uploaded file
      // For now, log the error - cleanup can be added later
      console.error('Failed to create document record after upload:', dbError)
      return internalErrorResponse('Fehler beim Erstellen des Dokument-Datensatzes.')
    }

    // Build response - assessment_id should always be present since we just inserted it
    const response: DocumentUploadResponse = {
      id: document.id,
      assessmentId: document.assessment_id!,
      storagePath: document.storage_path,
      fileName: file.name,
      mimeType: file.type,
      size: file.size,
      parsingStatus: document.parsing_status,
      createdAt: document.created_at,
    }

    return successResponse(response, 201)
  } catch (error) {
    console.error('Unexpected error in document upload:', error)
    return internalErrorResponse('Ein unerwarteter Fehler ist aufgetreten.')
  }
}
