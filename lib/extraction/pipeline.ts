/**
 * Document Extraction Helpers (V05-I04.2)
 * 
 * Server-side utilities for AI document extraction pipeline
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import Anthropic from '@anthropic-ai/sdk'
import { env } from '@/lib/env'
import { CURRENT_EXTRACTOR_VERSION } from '@/lib/contracts/registry'
import type {
  ExtractionPayload,
  ExtractedData,
  ConfidenceMetadata,
  ExtractionResult,
} from '@/lib/types/extraction'
import {
  ExtractedDataSchema,
  ConfidenceMetadataSchema,
  EXTRACTION_ERROR,
} from '@/lib/types/extraction'
import { logError } from '@/lib/logging/logger'

const anthropicApiKey = env.ANTHROPIC_API_KEY || env.ANTHROPIC_API_TOKEN
const MODEL = env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5-20250929'

const anthropic = anthropicApiKey ? new Anthropic({ apiKey: anthropicApiKey }) : null

/**
 * Computes SHA-256 hash of extraction inputs for idempotent behavior
 * Inputs include: document storage path, extractor version, and parsed content hash
 */
export async function computeExtractionInputHash(params: {
  storagePath: string
  extractorVersion: string
  parsedText?: string
}): Promise<string> {
  const { storagePath, extractorVersion, parsedText } = params

  // Normalize inputs to canonical form
  const canonical = JSON.stringify(
    {
      storage_path: storagePath,
      extractor_version: extractorVersion,
      parsed_text_hash: parsedText ? await hashString(parsedText) : null,
    },
    Object.keys({
      storage_path: storagePath,
      extractor_version: extractorVersion,
      parsed_text_hash: '',
    }).sort(),
  )

  return hashString(canonical)
}

/**
 * Computes SHA-256 hash of a string
 */
async function hashString(input: string): Promise<string> {
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Validates document is in PARSED state and ready for extraction
 */
export async function validateDocumentReadyForExtraction(
  supabase: SupabaseClient,
  documentId: string,
): Promise<{ valid: boolean; error?: string; document?: any }> {
  const { data: document, error } = await supabase
    .from('documents')
    .select('id, parsing_status, storage_path, doc_type')
    .eq('id', documentId)
    .single()

  if (error || !document) {
    return {
      valid: false,
      error: 'Document not found',
    }
  }

  // Only allow extraction for documents in PARSED state
  if (document.parsing_status !== 'completed') {
    return {
      valid: false,
      error: `Document must be in 'completed' parsing state, currently: ${document.parsing_status}`,
    }
  }

  return { valid: true, document }
}

/**
 * Checks if extraction already exists for given inputs (idempotency check)
 */
export async function checkExtractionExists(
  supabase: SupabaseClient,
  documentId: string,
  extractorVersion: string,
  inputHash: string,
): Promise<{ exists: boolean; extraction?: any }> {
  const { data, error } = await supabase
    .from('documents')
    .select('id, extractor_version, input_hash, extracted_json, confidence_json')
    .eq('id', documentId)
    .eq('extractor_version', extractorVersion)
    .eq('input_hash', inputHash)
    .maybeSingle()

  if (error) {
    console.error('[checkExtractionExists] Error checking extraction:', error)
    return { exists: false }
  }

  if (data && data.extractor_version && data.input_hash) {
    return { exists: true, extraction: data }
  }

  return { exists: false }
}

/**
 * Extracts structured data from document using Anthropic Claude
 */
export async function extractDataWithAI(
  payload: ExtractionPayload,
): Promise<{
  success: boolean
  extracted_data?: ExtractedData
  confidence?: ConfidenceMetadata
  error?: string
}> {
  if (!anthropic) {
    return {
      success: false,
      error: 'Anthropic API not configured',
    }
  }

  const startTime = Date.now()
  const { documentId, parsedText } = payload

  console.log('[extractDataWithAI] Starting extraction', {
    documentId,
    extractorVersion: payload.extractorVersion,
    hasText: !!parsedText,
  })

  // For now, use a simple prompt to extract structured data
  // In production, this would be more sophisticated
  const systemPrompt = `You are a medical document extraction assistant. Extract structured data from medical documents in JSON format.

Extract the following information when available:
- Lab values (test name, value, unit, reference range, date)
- Medications (name, dosage, frequency, route)
- Vital signs (blood pressure, heart rate, temperature, etc.)
- Diagnoses

Provide confidence scores for each extracted field (0.0 to 1.0).

Return your response as valid JSON with this structure:
{
  "extracted_data": {
    "lab_values": [...],
    "medications": [...],
    "vital_signs": {...},
    "diagnoses": [...]
  },
  "confidence": {
    "overall_confidence": 0.85,
    "field_confidence": {...},
    "evidence": {...}
  }
}

Be conservative with confidence scores. If unsure, mark confidence as low.`

  const userPrompt = parsedText
    ? `Extract structured data from this medical document:\n\n${parsedText.substring(0, 8000)}`
    : 'No text available. Please indicate extraction not possible.'

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 2000,
      temperature: 0.1, // Low temperature for deterministic extraction
      system: systemPrompt,
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: userPrompt }],
        },
      ],
    })

    const duration = Date.now() - startTime
    const textParts = response.content
      .filter((c) => c.type === 'text')
      .map((c) => ('text' in c ? c.text : ''))

    const responseText = textParts.join('\n').trim()

    console.log('[extractDataWithAI] AI response received', {
      duration: `${duration}ms`,
      responseLength: responseText.length,
    })

    // Parse JSON response
    let parsedResponse: any
    try {
      parsedResponse = JSON.parse(responseText)
    } catch (parseError) {
      console.error('[extractDataWithAI] Failed to parse AI response as JSON', {
        error: String(parseError),
        responsePreview: responseText.substring(0, 200),
      })
      return {
        success: false,
        error: 'AI returned invalid JSON response',
      }
    }

    // Validate extracted data
    const extractedData = parsedResponse.extracted_data || parsedResponse
    const validationResult = ExtractedDataSchema.safeParse(extractedData)

    if (!validationResult.success) {
      console.error('[extractDataWithAI] Extracted data validation failed', {
        errors: validationResult.error.issues,
      })
      return {
        success: false,
        error: 'Extracted data validation failed',
      }
    }

    // Build confidence metadata
    const confidence: ConfidenceMetadata = parsedResponse.confidence || {
      overall_confidence: 0.5,
      field_confidence: {},
      evidence: {},
      extraction_timestamp: new Date().toISOString(),
    }

    // Add timestamp if not present
    if (!confidence.extraction_timestamp) {
      confidence.extraction_timestamp = new Date().toISOString()
    }

    // Validate confidence metadata
    const confidenceValidation = ConfidenceMetadataSchema.safeParse(confidence)

    if (!confidenceValidation.success) {
      console.warn('[extractDataWithAI] Confidence metadata validation failed, using defaults', {
        errors: confidenceValidation.error.issues,
      })
      // Use fallback confidence
      confidence.overall_confidence = 0.5
      confidence.field_confidence = {}
      confidence.evidence = {}
    }

    console.log('[extractDataWithAI] Extraction completed successfully', {
      documentId,
      overallConfidence: confidence.overall_confidence,
      duration: `${duration}ms`,
    })

    return {
      success: true,
      extracted_data: validationResult.data,
      confidence,
    }
  } catch (error) {
    const duration = Date.now() - startTime

    console.error('[extractDataWithAI] AI extraction failed', {
      duration: `${duration}ms`,
      error: String(error),
    })

    logError(
      'Document extraction failed',
      {
        documentId,
        extractorVersion: payload.extractorVersion,
        duration,
      },
      error,
    )

    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Persists extraction result to database with idempotent upsert
 */
export async function persistExtractionResult(
  supabase: SupabaseClient,
  params: {
    documentId: string
    extractorVersion: string
    inputHash: string
    extractedData: ExtractedData
    confidence: ConfidenceMetadata
  },
): Promise<{ success: boolean; error?: string }> {
  const { documentId, extractorVersion, inputHash, extractedData, confidence } = params

  try {
    // Update document with extraction results
    const { error } = await supabase
      .from('documents')
      .update({
        extractor_version: extractorVersion,
        input_hash: inputHash,
        extracted_json: extractedData as any,
        confidence_json: confidence as any,
        updated_at: new Date().toISOString(),
      })
      .eq('id', documentId)

    if (error) {
      console.error('[persistExtractionResult] Database update failed', {
        documentId,
        error: error.message,
      })
      return {
        success: false,
        error: error.message,
      }
    }

    console.log('[persistExtractionResult] Extraction persisted successfully', {
      documentId,
      extractorVersion,
      inputHash: inputHash.substring(0, 8),
    })

    return { success: true }
  } catch (error) {
    console.error('[persistExtractionResult] Unexpected error', {
      documentId,
      error: String(error),
    })
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    }
  }
}

/**
 * Main orchestrator function for extraction pipeline
 */
export async function runExtractionPipeline(
  supabase: SupabaseClient,
  params: {
    documentId: string
    forceReextract?: boolean
    parsedText?: string
  },
): Promise<{
  success: boolean
  extraction?: ExtractionResult
  error?: { code: string; message: string }
}> {
  const { documentId, forceReextract = false, parsedText } = params
  const extractorVersion = CURRENT_EXTRACTOR_VERSION

  console.log('[runExtractionPipeline] Starting pipeline', {
    documentId,
    extractorVersion,
    forceReextract,
  })

  // Step 1: Validate document is ready
  const validation = await validateDocumentReadyForExtraction(supabase, documentId)
  if (!validation.valid) {
    return {
      success: false,
      error: {
        code: validation.error?.includes('not found')
          ? EXTRACTION_ERROR.INVALID_STATE
          : EXTRACTION_ERROR.NOT_PARSED,
        message: validation.error || 'Document not ready for extraction',
      },
    }
  }

  const document = validation.document

  // Step 2: Compute input hash
  const inputHash = await computeExtractionInputHash({
    storagePath: document.storage_path,
    extractorVersion,
    parsedText,
  })

  console.log('[runExtractionPipeline] Input hash computed', {
    documentId,
    inputHashPrefix: inputHash.substring(0, 8),
  })

  // Step 3: Check if extraction already exists (idempotency)
  if (!forceReextract) {
    const existing = await checkExtractionExists(supabase, documentId, extractorVersion, inputHash)
    if (existing.exists) {
      console.log('[runExtractionPipeline] Extraction already exists, returning cached result', {
        documentId,
        extractorVersion,
        inputHashPrefix: inputHash.substring(0, 8),
      })

      return {
        success: true,
        extraction: {
          extractor_version: extractorVersion,
          input_hash: inputHash,
          extracted_data: existing.extraction.extracted_json,
          confidence: existing.extraction.confidence_json,
          extracted_at: existing.extraction.updated_at || new Date().toISOString(),
        },
      }
    }
  }

  // Step 4: Run AI extraction
  const extractionResult = await extractDataWithAI({
    documentId,
    storagePath: document.storage_path,
    mimeType: document.doc_type || 'application/pdf',
    extractorVersion,
    parsedText,
  })

  if (!extractionResult.success || !extractionResult.extracted_data || !extractionResult.confidence) {
    return {
      success: false,
      error: {
        code: EXTRACTION_ERROR.EXTRACTION_FAILED,
        message: extractionResult.error || 'Extraction failed',
      },
    }
  }

  // Step 5: Persist results
  const persistResult = await persistExtractionResult(supabase, {
    documentId,
    extractorVersion,
    inputHash,
    extractedData: extractionResult.extracted_data,
    confidence: extractionResult.confidence,
  })

  if (!persistResult.success) {
    return {
      success: false,
      error: {
        code: EXTRACTION_ERROR.STORAGE_ERROR,
        message: persistResult.error || 'Failed to persist extraction results',
      },
    }
  }

  console.log('[runExtractionPipeline] Pipeline completed successfully', {
    documentId,
    extractorVersion,
    inputHashPrefix: inputHash.substring(0, 8),
  })

  return {
    success: true,
    extraction: {
      extractor_version: extractorVersion,
      input_hash: inputHash,
      extracted_data: extractionResult.extracted_data,
      confidence: extractionResult.confidence,
      extracted_at: new Date().toISOString(),
    },
  }
}
