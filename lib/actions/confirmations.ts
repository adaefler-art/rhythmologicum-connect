/**
 * Document Confirmation Server Actions (V05-I04.3)
 * 
 * Server-side handlers for patient confirmation of extracted document data.
 * Handles confirmation persistence with:
 * - Idempotent operations
 * - RLS enforcement (patient can only confirm own documents)
 * - Audit logging (PHI-free)
 * - Per-field status tracking
 * 
 * @module lib/actions/confirmations
 */

'use server'

import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import {
  SaveConfirmationRequestSchema,
  ConfirmationDataSchema,
  type ConfirmationResponse,
  type SaveConfirmationRequest,
} from '@/lib/types/extraction'
import { logAuditEvent } from '@/lib/audit'

// ============================================================
// Helper: Get Authenticated Supabase Client
// ============================================================

async function getAuthenticatedClient() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { supabase: null, user: null, error: 'Not authenticated' }
  }

  return { supabase, user, error: null }
}

// ============================================================
// Document Ownership Verification
// ============================================================

/**
 * Verifies that the user owns the document (via assessment → patient chain)
 */
async function verifyDocumentOwnership(
  supabase: any,
  documentId: string,
  userId: string,
): Promise<{ valid: boolean; error?: string }> {
  // Get document with assessment relationship
  const { data: document, error: docError } = await supabase
    .from('documents')
    .select(
      `
      id,
      assessment_id,
      assessments:assessment_id (
        id,
        patient_id
      )
    `,
    )
    .eq('id', documentId)
    .single()

  if (docError || !document) {
    return { valid: false, error: 'Document not found' }
  }

  // Check if user owns the assessment
  const assessment = document.assessments as any
  if (!assessment || assessment.patient_id !== userId) {
    return { valid: false, error: 'Not authorized to confirm this document' }
  }

  return { valid: true }
}

// ============================================================
// Save Confirmation Action
// ============================================================

/**
 * Saves patient confirmation of extracted document data
 * Idempotent: Can be called multiple times to update confirmations
 * 
 * @param request - Confirmation request with document_id and confirmed_data
 * @returns Result with confirmation timestamp or error
 */
export async function saveDocumentConfirmation(
  request: SaveConfirmationRequest,
): Promise<ConfirmationResponse> {
  try {
    // Validate input
    const validationResult = SaveConfirmationRequestSchema.safeParse(request)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return {
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: firstError?.message || 'Invalid confirmation data',
        },
      }
    }

    const { document_id, confirmed_data } = validationResult.data

    // Get authenticated user
    const { supabase, user, error: authError } = await getAuthenticatedClient()
    if (authError || !supabase || !user) {
      return {
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'You must be logged in to confirm documents',
        },
      }
    }

    // Verify document ownership
    const ownershipCheck = await verifyDocumentOwnership(supabase, document_id, user.id)
    if (!ownershipCheck.valid) {
      return {
        success: false,
        error: {
          code: 'AUTHORIZATION_FAILED',
          message: ownershipCheck.error || 'Not authorized',
        },
      }
    }

    // Save confirmation (idempotent update)
    const { data: updatedDoc, error: updateError } = await supabase
      .from('documents')
      .update({
        confirmed_data: confirmed_data,
        confirmed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', document_id)
      .select('id, confirmed_at')
      .single()

    if (updateError || !updatedDoc) {
      console.error('[saveDocumentConfirmation] Update failed:', updateError)
      return {
        success: false,
        error: {
          code: 'UPDATE_FAILED',
          message: 'Failed to save confirmation',
        },
      }
    }

    // Log audit event (PHI-free)
    await logAuditEvent({
      entity_type: 'document',
      entity_id: document_id,
      action: 'confirmation_saved',
      actor_id: user.id,
      metadata: {
        field_count: Object.keys(confirmed_data.field_confirmations || {}).length,
        has_edits: Object.values(confirmed_data.field_confirmations || {}).some(
          fc => fc.status === 'edited',
        ),
        has_rejections: Object.values(confirmed_data.field_confirmations || {}).some(
          fc => fc.status === 'rejected',
        ),
      },
    })

    return {
      success: true,
      data: {
        document_id: updatedDoc.id,
        confirmed_at: updatedDoc.confirmed_at,
      },
    }
  } catch (error) {
    console.error('[saveDocumentConfirmation] Unexpected error:', error)
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }
  }
}

// ============================================================
// Get Document with Extraction Data
// ============================================================

/**
 * Retrieves document with extraction and confirmation data
 * Used to populate the confirmation UI
 */
export async function getDocumentForConfirmation(documentId: string): Promise<{
  success: boolean
  data?: {
    id: string
    extracted_data: any
    confidence: any
    confirmed_data: any
    confirmed_at: string | null
  }
  error?: { code: string; message: string }
}> {
  try {
    // Get authenticated user
    const { supabase, user, error: authError } = await getAuthenticatedClient()
    if (authError || !supabase || !user) {
      return {
        success: false,
        error: {
          code: 'AUTHENTICATION_REQUIRED',
          message: 'You must be logged in to view documents',
        },
      }
    }

    // Verify document ownership
    const ownershipCheck = await verifyDocumentOwnership(supabase, documentId, user.id)
    if (!ownershipCheck.valid) {
      return {
        success: false,
        error: {
          code: 'AUTHORIZATION_FAILED',
          message: ownershipCheck.error || 'Not authorized',
        },
      }
    }

    // Get document data
    const { data: document, error: docError } = await supabase
      .from('documents')
      .select('id, extracted_json, confidence_json, confirmed_data, confirmed_at')
      .eq('id', documentId)
      .single()

    if (docError || !document) {
      return {
        success: false,
        error: {
          code: 'NOT_FOUND',
          message: 'Document not found',
        },
      }
    }

    return {
      success: true,
      data: {
        id: document.id,
        extracted_data: document.extracted_json || {},
        confidence: document.confidence_json || {},
        confirmed_data: document.confirmed_data || {},
        confirmed_at: document.confirmed_at,
      },
    }
  } catch (error) {
    console.error('[getDocumentForConfirmation] Unexpected error:', error)
    return {
      success: false,
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
      },
    }
  }
}
