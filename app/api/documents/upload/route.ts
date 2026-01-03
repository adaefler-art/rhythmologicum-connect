import { NextRequest } from 'next/server'
import { createServerSupabaseClient, getCurrentUser } from '@/lib/db/supabase.server'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  validationErrorResponse,
  internalErrorResponse,
  unsupportedMediaTypeResponse,
  payloadTooLargeResponse,
} from '@/lib/api/responses'
import {
  isValidMimeType,
  isValidFileSize,
  generateStoragePath,
  uploadToStorage,
  verifyAssessmentOwnership,
  deleteFromStorage,
} from '@/lib/documents/helpers'
import { MAX_FILE_SIZE, ALLOWED_MIME_TYPES, DocumentUploadResponse } from '@/lib/types/documents'
import { logUnauthorized, logForbidden } from '@/lib/logging/logger'
import { randomUUID } from 'crypto'

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
 * - Fail-closed: validates before writing, cleans up on failure
 */

export async function POST(request: NextRequest) {
  const requestId = randomUUID()
  
  try {
    // ============================================================================
    // STEP 1: Authentication Check (MUST be first - 401 before any other status)
    // ============================================================================
    const user = await getCurrentUser()
    if (!user) {
      logUnauthorized({
        endpoint: '/api/documents/upload',
        requestId,
      })
      return unauthorizedResponse('Authentifizierung erforderlich. Bitte melden Sie sich an.')
    }

    // ============================================================================
    // STEP 2: Parse and validate request data (after auth confirmed)
    // ============================================================================
    
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
        requestId,
      })
    }

    if (!assessmentId) {
      return validationErrorResponse('Assessment-ID ist erforderlich.', {
        field: 'assessmentId',
        message: 'Assessment-ID fehlt',
        requestId,
      })
    }

    // Validate UUID format for assessmentId
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
    if (!uuidRegex.test(assessmentId)) {
      return validationErrorResponse('Ungültige Assessment-ID.', {
        field: 'assessmentId',
        message: 'Assessment-ID muss eine gültige UUID sein',
        requestId,
      })
    }

    // Validate file type (fail fast - check before expensive operations)
    // Returns 415 Unsupported Media Type for authenticated users
    if (!isValidMimeType(file.type)) {
      return unsupportedMediaTypeResponse(
        `Ungültiger Dateityp. Erlaubte Typen: PDF, JPEG, PNG, HEIC`,
        {
          field: 'file',
          mimeType: file.type,
          allowedTypes: ['application/pdf', 'image/jpeg', 'image/png', 'image/heic'],
          requestId,
        },
      )
    }

    // Validate file size (fail fast - check before expensive operations)
    // Returns 413 Payload Too Large for authenticated users
    if (!isValidFileSize(file.size)) {
      const maxSizeMB = MAX_FILE_SIZE / (1024 * 1024)
      return payloadTooLargeResponse(
        `Datei ist zu groß. Maximale Größe: ${maxSizeMB} MB`,
        {
          field: 'file',
          size: file.size,
          maxSize: MAX_FILE_SIZE,
          maxSizeMB,
          requestId,
        },
      )
    }

    // ============================================================================
    // STEP 3: Authorization Check (verify user owns the assessment)
    // ============================================================================
    const ownershipCheck = await verifyAssessmentOwnership(assessmentId, user.id)
    if (!ownershipCheck.valid) {
      logForbidden(
        {
          endpoint: '/api/documents/upload',
          userId: user.id,
          resource: `assessment:${assessmentId}`,
          requestId,
        },
        ownershipCheck.error || 'Assessment ownership verification failed',
      )
      return forbiddenResponse(
        'Sie haben keine Berechtigung, Dokumente für dieses Assessment hochzuladen.',
      )
    }

    // ============================================================================
    // STEP 4: Upload to storage and create DB record (fail-closed)
    // ============================================================================
    
    // Generate storage path with sanitized filename
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
      console.error('[UPLOAD_FAILED]', {
        requestId,
        userId: user.id,
        assessmentId,
        error: 'Storage upload failed',
      })
      return internalErrorResponse('Fehler beim Hochladen der Datei.')
    }

    // Create database record (fail-closed: if this fails, cleanup storage)
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
      // Cleanup: Delete uploaded file since DB record creation failed
      console.error('[DB_INSERT_FAILED]', {
        requestId,
        userId: user.id,
        assessmentId,
        storagePath,
        error: 'Database record creation failed',
      })
      
      // Attempt cleanup (don't fail request if cleanup fails)
      await deleteFromStorage(storagePath)
      
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
    console.error('[UPLOAD_UNEXPECTED_ERROR]', {
      requestId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    return internalErrorResponse('Ein unerwarteter Fehler ist aufgetreten.')
  }
}
