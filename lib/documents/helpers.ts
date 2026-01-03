/**
 * Document Upload Helpers
 * 
 * Server-side helpers for document upload and status management (V05-I04.1)
 */

import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
import {
  ParsingStatus,
  PARSING_STATUS_TRANSITIONS,
  DocumentMetadata,
  ALLOWED_MIME_TYPES,
  MAX_FILE_SIZE,
} from '@/lib/types/documents'

/**
 * Validates file type against allowed MIME types
 */
export function isValidMimeType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType as any)
}

/**
 * Validates file size against maximum
 */
export function isValidFileSize(size: number): boolean {
  return size > 0 && size <= MAX_FILE_SIZE
}

/**
 * Validates if a parsing status transition is allowed
 */
export function isValidParsingStatusTransition(
  from: ParsingStatus,
  to: ParsingStatus,
): boolean {
  const allowedTransitions = PARSING_STATUS_TRANSITIONS[from]
  return allowedTransitions.includes(to)
}

/**
 * Updates document parsing status with validation
 * 
 * @param documentId - Document ID
 * @param newStatus - New parsing status
 * @returns Success boolean and error if any
 */
export async function updateDocumentParsingStatus(
  documentId: string,
  newStatus: ParsingStatus,
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createAdminSupabaseClient()

  // Get current document
  const { data: document, error: fetchError } = await supabase
    .from('documents')
    .select('id, parsing_status')
    .eq('id', documentId)
    .single()

  if (fetchError || !document) {
    return {
      success: false,
      error: 'Document not found',
    }
  }

  const currentStatus = document.parsing_status

  // Validate transition
  if (!isValidParsingStatusTransition(currentStatus, newStatus)) {
    return {
      success: false,
      error: `Invalid status transition from ${currentStatus} to ${newStatus}`,
    }
  }

  // Update status
  const { error: updateError } = await supabase
    .from('documents')
    .update({
      parsing_status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', documentId)

  if (updateError) {
    return {
      success: false,
      error: updateError.message,
    }
  }

  return { success: true }
}

/**
 * Generates storage path for document
 * Format: {userId}/{assessmentId}/{timestamp}_{filename}
 */
export function generateStoragePath(
  userId: string,
  assessmentId: string,
  filename: string,
): string {
  const timestamp = Date.now()
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  return `${userId}/${assessmentId}/${timestamp}_${sanitizedFilename}`
}

/**
 * Gets file extension from filename or MIME type
 */
export function getFileExtension(filename: string, mimeType: string): string {
  // Try to get from filename first
  const parts = filename.split('.')
  if (parts.length > 1) {
    return parts[parts.length - 1].toLowerCase()
  }

  // Fallback to MIME type
  const mimeMap: Record<string, string> = {
    'application/pdf': 'pdf',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/heic': 'heic',
    'image/heif': 'heif',
  }

  return mimeMap[mimeType] || 'bin'
}

/**
 * Uploads file to Supabase Storage
 * 
 * @param file - File buffer or blob
 * @param storagePath - Path in storage bucket
 * @param metadata - Document metadata
 * @returns Upload result with path or error
 */
export async function uploadToStorage(
  file: Buffer | Blob,
  storagePath: string,
  metadata: DocumentMetadata,
): Promise<{ success: boolean; path?: string; error?: string }> {
  const supabase = await createServerSupabaseClient()

  const { data, error } = await supabase.storage
    .from('documents')
    .upload(storagePath, file, {
      contentType: metadata.mimeType,
      upsert: false,
      metadata: {
        userId: metadata.userId,
        assessmentId: metadata.assessmentId,
        originalFilename: metadata.originalFilename,
        uploadedAt: metadata.uploadedAt,
      },
    })

  if (error) {
    return {
      success: false,
      error: error.message,
    }
  }

  return {
    success: true,
    path: data.path,
  }
}

/**
 * Verifies user owns the assessment via patient_id
 */
export async function verifyAssessmentOwnership(
  assessmentId: string,
  userId: string,
): Promise<{ valid: boolean; error?: string }> {
  const supabase = await createServerSupabaseClient()

  // Get assessment with patient profile to check user ownership
  const { data: assessment, error } = await supabase
    .from('assessments')
    .select('id, patient_id')
    .eq('id', assessmentId)
    .single()

  if (error || !assessment) {
    return {
      valid: false,
      error: 'Assessment not found',
    }
  }

  // Get patient profile to verify user_id
  const { data: patientProfile, error: profileError } = await supabase
    .from('patient_profiles')
    .select('user_id')
    .eq('id', assessment.patient_id)
    .single()

  if (profileError || !patientProfile) {
    return {
      valid: false,
      error: 'Patient profile not found',
    }
  }

  if (patientProfile.user_id !== userId) {
    return {
      valid: false,
      error: 'Assessment does not belong to user',
    }
  }

  return { valid: true }
}
