/**
 * E76.8: Diagnosis Deduplication Policy
 * 
 * Implements deterministic deduplication based on inputs_hash:
 * - Policy B: Time-window-based deduplication (default 24 hours)
 * - Prevents redundant diagnosis runs for identical inputs
 * - Logs warnings for duplicate attempts
 * - Feature-gated behind NEXT_PUBLIC_FEATURE_DIAGNOSIS_DEDUPE_ENABLED
 */

import 'server-only'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/supabase'
import { env } from '@/lib/env'

export interface DedupeCheckResult {
  isDuplicate: boolean
  existingRunId?: string
  message?: string
  timeWindowHours?: number
}

export interface DedupeConfig {
  enabled: boolean
  timeWindowHours: number
}

/**
 * Default dedupe configuration
 * Can be overridden via environment variables
 */
export const DEFAULT_DEDUPE_CONFIG: DedupeConfig = {
  enabled: env.NEXT_PUBLIC_FEATURE_DIAGNOSIS_DEDUPE_ENABLED === 'true',
  timeWindowHours: 24, // 24 hours default window
}

/**
 * Check if a diagnosis run with the same inputs_hash already exists
 * within the specified time window.
 * 
 * @param supabase - Supabase client (admin or user client)
 * @param inputs_hash - SHA256 hash of normalized context pack inputs
 * @param patient_id - Patient ID to scope the dedupe check
 * @param config - Dedupe configuration (optional, uses defaults)
 * @returns DedupeCheckResult indicating if duplicate exists
 */
export async function checkDuplicateRun(
  supabase: SupabaseClient<Database>,
  inputs_hash: string,
  patient_id: string,
  config: DedupeConfig = DEFAULT_DEDUPE_CONFIG,
): Promise<DedupeCheckResult> {
  // If dedupe is disabled, always allow
  if (!config.enabled) {
    return {
      isDuplicate: false,
      message: 'Deduplication disabled',
    }
  }

  // Calculate time threshold (now - timeWindowHours)
  const timeThreshold = new Date()
  timeThreshold.setHours(timeThreshold.getHours() - config.timeWindowHours)
  const timeThresholdISO = timeThreshold.toISOString()

  // Query for existing runs with same inputs_hash within time window
  const { data, error } = await supabase
    .from('diagnosis_runs')
    .select('id, created_at, status')
    .eq('inputs_hash', inputs_hash)
    .eq('patient_id', patient_id)
    .gte('created_at', timeThresholdISO)
    .order('created_at', { ascending: false })
    .limit(1)

  if (error) {
    console.error('[E76.8] Error checking for duplicate runs:', error)
    // On error, fail open (allow the run)
    return {
      isDuplicate: false,
      message: `Dedupe check failed: ${error.message}`,
    }
  }

  if (data && data.length > 0) {
    const existingRun = data[0]
    const message = `Duplicate run detected (inputs_hash: ${inputs_hash.substring(0, 12)}..., existing run: ${existingRun.id}, status: ${existingRun.status}, created: ${existingRun.created_at})`

    console.warn(`[E76.8 DEDUPE WARNING] ${message}`)

    return {
      isDuplicate: true,
      existingRunId: existingRun.id,
      message,
      timeWindowHours: config.timeWindowHours,
    }
  }

  return {
    isDuplicate: false,
    message: 'No duplicate found',
    timeWindowHours: config.timeWindowHours,
  }
}

/**
 * Extract inputs_meta from context pack for persistence
 * 
 * @param contextPack - Full patient context pack
 * @returns inputs_meta object with IDs and references
 */
export function extractInputsMeta(contextPack: {
  patient_id: string
  demographics: Record<string, unknown>
  anamnesis: { entries: Array<{ id: string }> }
  funnel_runs: { runs: Array<{ assessment_id: string }> }
  current_measures: Record<string, unknown> | null
  metadata: { context_version: string; inputs_hash: string }
}): Record<string, unknown> {
  return {
    context_version: contextPack.metadata.context_version,
    patient_id: contextPack.patient_id,
    anamnesis_ids: contextPack.anamnesis.entries.map((e) => e.id).sort(),
    funnel_run_ids: contextPack.funnel_runs.runs.map((r) => r.assessment_id).sort(),
    demographics: contextPack.demographics,
    measures: contextPack.current_measures,
  }
}
