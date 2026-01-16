/**
 * E6.6.6 — Triage Session Database Persistence
 *
 * PHI-safe persistence of triage sessions for pilot debugging.
 * - NO raw inputText storage (hash only)
 * - Deterministic SHA-256 hashing
 * - Insert after eligibility validation
 */

import { createHash } from 'crypto'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import type { TriageResultV1 } from '@/lib/api/contracts/triage'
import { TRIAGE_RULESET_VERSION } from './engine'

/**
 * Triage session record (database schema)
 */
export type TriageSession = {
  id: string
  created_at: string
  patient_id: string
  correlation_id: string
  tier: string
  next_action: string
  red_flags: string[]
  input_hash: string
  rules_version: string
  rationale: string | null
}

/**
 * Compute deterministic SHA-256 hash of input text
 * AC1: No raw text stored, only hash for idempotency/debugging
 *
 * @param inputText - Raw input text to hash
 * @returns 64-character hex SHA-256 hash
 */
export function computeInputHash(inputText: string): string {
  // Normalize before hashing for consistency
  const normalizedInput = inputText.trim().toLowerCase()
  const hash = createHash('sha256')
  hash.update(normalizedInput, 'utf8')
  return hash.digest('hex')
}

/**
 * Insert triage session record into database
 * AC3: Insert after eligibility and validation
 *
 * @param params - Triage session parameters
 * @returns Inserted triage session or null on error
 */
export async function insertTriageSession(params: {
  patientId: string
  correlationId: string
  inputText: string
  triageResult: TriageResultV1
}): Promise<TriageSession | null> {
  const { patientId, correlationId, inputText, triageResult } = params

  try {
    // AC1: Compute hash instead of storing raw text
    const inputHash = computeInputHash(inputText)

    // Prepare insert data
    const insertData = {
      patient_id: patientId,
      correlation_id: correlationId,
      tier: triageResult.tier,
      next_action: triageResult.nextAction,
      red_flags: triageResult.redFlags,
      input_hash: inputHash,
      rules_version: TRIAGE_RULESET_VERSION,
      rationale: triageResult.rationale || null,
    }

    console.log('[triage/sessionStorage] Inserting triage session', {
      patientId,
      correlationId,
      tier: triageResult.tier,
      inputHashPrefix: inputHash.substring(0, 8),
    })

    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('triage_sessions')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('[triage/sessionStorage] Failed to insert triage session', {
        error: error.message,
        code: error.code,
        correlationId,
      })
      return null
    }

    console.log('[triage/sessionStorage] Triage session inserted successfully', {
      sessionId: data.id,
      correlationId,
    })

    return data as TriageSession
  } catch (err) {
    console.error('[triage/sessionStorage] Unexpected error inserting triage session', {
      error: err,
      correlationId,
    })
    return null
  }
}

/**
 * Get triage sessions for a patient
 * 
 * @param patientId - Patient user ID
 * @param limit - Maximum number of sessions to return (default: 50)
 * @returns Array of triage sessions
 */
export async function getTriageSessionsForPatient(
  patientId: string,
  limit = 50,
): Promise<TriageSession[]> {
  try {
    const supabase = await createServerSupabaseClient()
    const { data, error } = await supabase
      .from('triage_sessions')
      .select('*')
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('[triage/sessionStorage] Failed to get triage sessions', {
        error: error.message,
        patientId,
      })
      return []
    }

    return (data as TriageSession[]) || []
  } catch (err) {
    console.error('[triage/sessionStorage] Unexpected error getting triage sessions', {
      error: err,
      patientId,
    })
    return []
  }
}
