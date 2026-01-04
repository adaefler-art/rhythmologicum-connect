/**
 * PDF Storage Helpers - V05-I05.8
 * 
 * Server-side helpers for PDF storage, retrieval, and signed URL generation.
 * Ensures PHI-free storage paths and secure access control.
 * 
 * @module lib/pdf/storage
 */

import { createHash } from 'crypto'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import type { PdfMetadata } from '@/lib/contracts/pdfGeneration'

// Storage bucket name for PDFs
const PDF_BUCKET = 'reports'

/**
 * Generates PHI-free storage path for PDF
 * Format: reports/{job_id_hash}/{timestamp}_{hash_prefix}.pdf
 * 
 * @param jobId - Processing job ID
 * @param timestamp - Generation timestamp (ms)
 * @returns PHI-free storage path
 */
export function generatePdfStoragePath(jobId: string, timestamp: number = Date.now()): string {
  // Hash job ID to avoid exposing raw UUIDs in storage paths
  const jobIdHash = createHash('sha256').update(jobId).digest('hex').substring(0, 16)

  // Add timestamp for uniqueness and ordering
  const timestampStr = timestamp.toString()

  // Create deterministic but opaque path
  const pathHash = createHash('sha256')
    .update(`${jobId}-${timestampStr}`)
    .digest('hex')
    .substring(0, 8)

  return `${jobIdHash}/${timestampStr}_${pathHash}.pdf`
}

/**
 * Uploads PDF to Supabase Storage
 * 
 * @param pdfBuffer - PDF file buffer
 * @param storagePath - PHI-free storage path
 * @param metadata - PDF metadata
 * @returns Upload result with path or error
 */
export async function uploadPdfToStorage(
  pdfBuffer: Buffer,
  storagePath: string,
  metadata: PdfMetadata,
): Promise<{ success: boolean; path?: string; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase.storage.from(PDF_BUCKET).upload(storagePath, pdfBuffer, {
      contentType: 'application/pdf',
      upsert: false, // Fail if already exists (prevent overwrites)
      metadata: {
        // Store only PHI-free metadata
        version: metadata.version,
        generatedAt: metadata.generatedAt,
        contentHash: metadata.contentHash,
        pageCount: metadata.pageCount.toString(),
        fileSizeBytes: metadata.fileSizeBytes.toString(),
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
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown upload error',
    }
  }
}

/**
 * Generates signed URL for PDF download
 * 
 * @param storagePath - PDF storage path
 * @param expiresIn - Expiry time in seconds (default: 1 hour)
 * @returns Signed URL or error
 */
export async function generateSignedUrl(
  storagePath: string,
  expiresIn: number = 3600,
): Promise<{ success: boolean; url?: string; expiresAt?: string; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient()

    const { data, error } = await supabase.storage
      .from(PDF_BUCKET)
      .createSignedUrl(storagePath, expiresIn)

    if (error) {
      return {
        success: false,
        error: error.message,
      }
    }

    if (!data?.signedUrl) {
      return {
        success: false,
        error: 'Failed to generate signed URL',
      }
    }

    // Calculate expiry timestamp
    const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString()

    return {
      success: true,
      url: data.signedUrl,
      expiresAt,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error generating signed URL',
    }
  }
}

/**
 * Verifies user has access to PDF for given assessment
 * Checks ownership (patient) or role (clinician/admin)
 * 
 * @param assessmentId - Assessment ID
 * @param userId - User ID requesting access
 * @returns Access verification result
 */
export async function verifyPdfAccess(
  assessmentId: string,
  userId: string,
): Promise<{ authorized: boolean; error?: string }> {
  try {
    const supabase = await createServerSupabaseClient()

    // Get user role
    const { data: userData, error: userError } = await supabase.auth.getUser()
    if (userError || !userData?.user) {
      return {
        authorized: false,
        error: 'User not found',
      }
    }

    const userRole = userData.user.app_metadata?.role || 'patient'

    // Clinicians and admins have access to all PDFs
    if (userRole === 'clinician' || userRole === 'admin') {
      return { authorized: true }
    }

    // Patients can only access their own PDFs
    // Verify ownership via assessment → patient_profile → user_id
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, patient_id')
      .eq('id', assessmentId)
      .single()

    if (assessmentError || !assessment) {
      return {
        authorized: false,
        error: 'Assessment not found',
      }
    }

    const { data: patientProfile, error: profileError } = await supabase
      .from('patient_profiles')
      .select('user_id')
      .eq('id', assessment.patient_id)
      .single()

    if (profileError || !patientProfile) {
      return {
        authorized: false,
        error: 'Patient profile not found',
      }
    }

    if (patientProfile.user_id !== userId) {
      return {
        authorized: false,
        error: 'Unauthorized: Assessment belongs to different user',
      }
    }

    return { authorized: true }
  } catch (error) {
    return {
      authorized: false,
      error: error instanceof Error ? error.message : 'Unknown authorization error',
    }
  }
}

/**
 * Deletes PDF from storage (cleanup on failure)
 * 
 * @param storagePath - Path to PDF in storage bucket
 * @returns Success boolean
 */
export async function deletePdfFromStorage(storagePath: string): Promise<boolean> {
  try {
    const supabase = await createServerSupabaseClient()
    const { error } = await supabase.storage.from(PDF_BUCKET).remove([storagePath])

    if (error) {
      console.error('[PDF_STORAGE_CLEANUP_FAILED]', {
        path: storagePath,
        error: error.message,
      })
      return false
    }

    return true
  } catch (error) {
    console.error('[PDF_STORAGE_CLEANUP_ERROR]', { path: storagePath })
    return false
  }
}

/**
 * Computes SHA-256 hash of PDF content for determinism verification
 * 
 * @param pdfBuffer - PDF file buffer
 * @returns Hex-encoded SHA-256 hash
 */
export function computePdfHash(pdfBuffer: Buffer): string {
  return createHash('sha256').update(pdfBuffer).digest('hex')
}
