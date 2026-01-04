/**
 * PDF Stage Processor - V05-I05.8
 * 
 * Processes PDF generation stage in the processing pipeline.
 * Generates PDF from approved report sections, stores in PHI-free path.
 * 
 * @module lib/processing/pdfStageProcessor
 */

import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { generatePdf, isValidPdfBuffer } from '@/lib/pdf/generator'
import {
  generatePdfStoragePath,
  uploadPdfToStorage,
  deletePdfFromStorage,
  computePdfHash,
} from '@/lib/pdf/storage'
import type { PdfGenerationInput, PdfGenerationResult } from '@/lib/contracts/pdfGeneration'
import type { ReportSectionsV1 } from '@/lib/contracts/reportSections'

/**
 * Process PDF stage
 * Generates PDF from report sections and stores in secure storage
 * 
 * @param jobId - Processing job ID
 * @returns Processing result
 */
export async function processPdfStage(jobId: string): Promise<PdfGenerationResult> {
  const startTime = Date.now()

  try {
    const supabase = await createServerSupabaseClient()

    // ============================================================================
    // STEP 1: Fetch processing job with PDF metadata
    // ============================================================================
    const { data: job, error: jobError } = await supabase
      .from('processing_jobs')
      .select('id, assessment_id, stage, status, pdf_path, pdf_metadata, pdf_generated_at')
      .eq('id', jobId)
      .single()

    if (jobError || !job) {
      return {
        success: false,
        error: {
          code: 'JOB_NOT_FOUND',
          message: 'Processing job not found',
        },
      }
    }

    // Type assertion for new columns (until types are regenerated)
    const jobWithPdf = job as typeof job & {
      stage: string
      assessment_id: string
      pdf_path?: string | null
      pdf_metadata?: Record<string, any> | null
      pdf_generated_at?: string | null
    }

    // Verify job is in correct stage
    if (jobWithPdf.stage !== 'pdf') {
      return {
        success: false,
        error: {
          code: 'INVALID_STAGE',
          message: `Job is in stage ${jobWithPdf.stage}, expected pdf`,
        },
      }
    }

    // ============================================================================
    // STEP 2: Fetch report sections from content stage
    // ============================================================================
    // Report sections are stored in the content stage output
    // We need to fetch them from the processing job or related table
    const { data: sectionsData, error: sectionsError } = await supabase
      .from('report_sections')
      .select('*')
      .eq('job_id', jobId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (sectionsError || !sectionsData) {
      // Fallback: Try to get from processing job metadata or fail
      return {
        success: false,
        error: {
          code: 'SECTIONS_NOT_FOUND',
          message: 'Report sections not found for job',
        },
      }
    }

    // Parse sections data
    const sections = sectionsData.sections_data as ReportSectionsV1

    // ============================================================================
    // STEP 2.5: Idempotency Check - Return existing PDF if content unchanged
    // ============================================================================
    // Compute hash of current sections to check for changes
    const sectionsJson = JSON.stringify(sections)
    const currentContentHash = computePdfHash(Buffer.from(sectionsJson))

    // If PDF already exists and content hash matches, return existing metadata
    if (
      jobWithPdf.pdf_path &&
      jobWithPdf.pdf_metadata &&
      jobWithPdf.pdf_metadata.sectionsContentHash === currentContentHash
    ) {
      console.log('[PDF_IDEMPOTENT_RETURN]', {
        jobId,
        pdfPath: jobWithPdf.pdf_path,
        contentHash: currentContentHash,
        message: 'PDF already exists with same content, returning existing',
      })

      return {
        success: true,
        data: {
          pdfPath: jobWithPdf.pdf_path,
          metadata: jobWithPdf.pdf_metadata as any,
          generationTimeMs: 0, // No generation needed
        },
      }
    }

    // If PDF exists but content changed, delete old PDF before creating new one
    if (jobWithPdf.pdf_path) {
      console.log('[PDF_CONTENT_CHANGED]', {
        jobId,
        oldPath: jobWithPdf.pdf_path,
        message: 'Content changed, will replace PDF',
      })
      // Best-effort delete of old PDF (don't fail if it doesn't exist)
      await deletePdfFromStorage(jobWithPdf.pdf_path)
    }

    // ============================================================================
    // STEP 3: Fetch minimal patient data (for PDF header only)
    // ============================================================================
    const { data: assessment, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, patient_id, created_at')
      .eq('id', jobWithPdf.assessment_id)
      .single()

    if (assessmentError || !assessment) {
      return {
        success: false,
        error: {
          code: 'ASSESSMENT_NOT_FOUND',
          message: 'Assessment not found',
        },
      }
    }

    // Type assertion for assessment (until types are regenerated)
    const assessmentData = assessment as typeof assessment & {
      patient_id: string
      created_at: string
    }

    // For now, we skip patient initials to avoid any PHI
    // They can be added manually by the user if needed
    const patientData = {
      assessmentDate: assessmentData.created_at,
    }

    // ============================================================================
    // STEP 4: Generate PDF
    // ============================================================================
    const pdfInput: PdfGenerationInput = {
      jobId,
      assessmentId: jobWithPdf.assessment_id,
      sectionsData: sections,
      patientData,
      options: {
        includePageNumbers: true,
        includeTimestamp: true,
        includeDisclaimer: true,
      },
    }

    const pdfResult = await generatePdf(pdfInput)

    if (!pdfResult.success || !pdfResult.buffer || !pdfResult.metadata) {
      return {
        success: false,
        error: {
          code: 'PDF_GENERATION_FAILED',
          message: pdfResult.error || 'Failed to generate PDF',
        },
      }
    }

    // Validate PDF buffer
    if (!isValidPdfBuffer(pdfResult.buffer)) {
      return {
        success: false,
        error: {
          code: 'INVALID_PDF',
          message: 'Generated PDF is invalid (missing magic bytes)',
        },
      }
    }

    // ============================================================================
    // STEP 5: Upload to storage
    // ============================================================================
    const storagePath = generatePdfStoragePath(jobId, Date.now())

    const uploadResult = await uploadPdfToStorage(
      pdfResult.buffer,
      storagePath,
      pdfResult.metadata,
    )

    if (!uploadResult.success) {
      return {
        success: false,
        error: {
          code: 'UPLOAD_FAILED',
          message: uploadResult.error || 'Failed to upload PDF to storage',
        },
      }
    }

    // ============================================================================
    // STEP 6: Update processing job with PDF metadata (including content hash)
    // ============================================================================
    // Add sectionsContentHash to metadata for idempotency checks
    const metadataWithHash = {
      ...pdfResult.metadata,
      sectionsContentHash: currentContentHash,
    }

    // Type assertion for new columns (until types are regenerated)
    const { error: updateError } = await supabase
      .from('processing_jobs')
      .update({
        pdf_path: storagePath,
        pdf_metadata: metadataWithHash as any,
        pdf_generated_at: new Date().toISOString(),
        stage: 'delivery', // Move to next stage
        status: 'in_progress',
        updated_at: new Date().toISOString(),
      } as any)
      .eq('id', jobId)

    if (updateError) {
      // Cleanup uploaded PDF on DB update failure
      await deletePdfFromStorage(storagePath)

      return {
        success: false,
        error: {
          code: 'DB_UPDATE_FAILED',
          message: 'Failed to update job with PDF metadata',
        },
      }
    }

    // ============================================================================
    // STEP 7: Return success
    // ============================================================================
    const generationTimeMs = Date.now() - startTime

    return {
      success: true,
      data: {
        pdfPath: storagePath,
        metadata: metadataWithHash,
        generationTimeMs,
      },
    }
  } catch (error) {
    console.error('[PDF_STAGE_PROCESSOR_ERROR]', {
      jobId,
      error: error instanceof Error ? error.message : 'Unknown error',
    })

    return {
      success: false,
      error: {
        code: 'PROCESSOR_ERROR',
        message: error instanceof Error ? error.message : 'Unknown processor error',
      },
    }
  }
}
