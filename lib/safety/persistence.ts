/**
 * Safety Check Persistence - V05-I05.6
 * 
 * Database persistence for AI-powered safety check results.
 * Implements idempotent save based on evaluation_key_hash.
 * 
 * @module lib/safety/persistence
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { SafetyCheckResultV1, SafetyAction, SafetySeverity } from '@/lib/contracts/safetyCheck'
import { SAFETY_SEVERITY } from '@/lib/contracts/safetyCheck'

// ============================================================
// Types
// ============================================================

export interface SaveSafetyCheckOptions {
  /** If true, updates existing record; if false, errors on conflict */
  upsert?: boolean
}

export interface SafetyCheckRecord {
  id: string
  job_id: string
  sections_id: string
  safety_version: string
  prompt_version: string
  model_provider: string
  model_name: string | null
  model_temperature: number | null
  model_max_tokens: number | null
  overall_action: SafetyAction
  safety_score: number
  overall_severity: SafetySeverity
  check_data: SafetyCheckResultV1
  findings_count: number
  critical_findings_count: number
  high_findings_count: number
  medium_findings_count: number
  low_findings_count: number
  evaluation_time_ms: number
  llm_call_count: number
  prompt_tokens: number | null
  completion_tokens: number | null
  total_tokens: number | null
  fallback_used: boolean
  evaluation_key_hash: string | null
  evaluated_at: string
  created_at: string
  updated_at: string
}

// ============================================================
// Helper Functions
// ============================================================

/**
 * Compute evaluation key hash for idempotent behavior
 * Hash is based on sections_id + prompt_version
 */
async function computeEvaluationKeyHash(
  sectionsId: string,
  promptVersion: string,
): Promise<string> {
  const canonical = JSON.stringify({ sectionsId, promptVersion })
  
  // Use Web Crypto API
  const encoder = new TextEncoder()
  const data = encoder.encode(canonical)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
}

/**
 * Count findings by severity
 */
function countFindingsBySeverity(result: SafetyCheckResultV1): {
  critical: number
  high: number
  medium: number
  low: number
} {
  const counts = {
    critical: 0,
    high: 0,
    medium: 0,
    low: 0,
  }
  
  for (const finding of result.findings) {
    switch (finding.severity) {
      case SAFETY_SEVERITY.CRITICAL:
        counts.critical++
        break
      case SAFETY_SEVERITY.HIGH:
        counts.high++
        break
      case SAFETY_SEVERITY.MEDIUM:
        counts.medium++
        break
      case SAFETY_SEVERITY.LOW:
        counts.low++
        break
    }
  }
  
  return counts
}

// ============================================================
// Main Functions
// ============================================================

/**
 * Save safety check result to database
 * Idempotent: Upserts based on job_id
 * 
 * @param supabase - Supabase client
 * @param jobId - Processing job ID
 * @param result - Safety check result
 * @param options - Save options
 * @returns Saved record ID or error
 */
export async function saveSafetyCheck(
  supabase: SupabaseClient,
  jobId: string,
  result: SafetyCheckResultV1,
  options: SaveSafetyCheckOptions = {},
): Promise<{ success: true; id: string } | { success: false; error: string }> {
  try {
    const { upsert = true } = options
    
    // Compute evaluation key hash for idempotency
    const evaluationKeyHash = await computeEvaluationKeyHash(
      result.sectionsId,
      result.promptVersion,
    )
    
    // Count findings by severity
    const severityCounts = countFindingsBySeverity(result)
    
    // Build record
    const record = {
      job_id: jobId,
      sections_id: result.sectionsId,
      safety_version: result.safetyVersion,
      prompt_version: result.promptVersion,
      model_provider: result.modelConfig?.provider || 'anthropic',
      model_name: result.modelConfig?.model || null,
      model_temperature: result.modelConfig?.temperature ?? null,
      model_max_tokens: result.modelConfig?.maxTokens ?? null,
      overall_action: result.recommendedAction,
      safety_score: result.safetyScore,
      overall_severity: result.overallSeverity,
      check_data: result,
      findings_count: result.findings.length,
      critical_findings_count: severityCounts.critical,
      high_findings_count: severityCounts.high,
      medium_findings_count: severityCounts.medium,
      low_findings_count: severityCounts.low,
      evaluation_time_ms: result.metadata.evaluationTimeMs,
      llm_call_count: result.metadata.llmCallCount,
      prompt_tokens: result.metadata.tokenUsage?.promptTokens ?? null,
      completion_tokens: result.metadata.tokenUsage?.completionTokens ?? null,
      total_tokens: result.metadata.tokenUsage?.totalTokens ?? null,
      fallback_used: result.metadata.fallbackUsed,
      evaluation_key_hash: evaluationKeyHash,
      evaluated_at: result.evaluatedAt,
    }
    
    // Upsert record
    const { data, error } = upsert
      ? await supabase
          .from('safety_check_results')
          .upsert(record, { onConflict: 'job_id' })
          .select('id')
          .single()
      : await supabase
          .from('safety_check_results')
          .insert(record)
          .select('id')
          .single()
    
    if (error) {
      return {
        success: false,
        error: `Failed to save safety check: ${error.message}`,
      }
    }
    
    if (!data) {
      return {
        success: false,
        error: 'Failed to save safety check: No data returned',
      }
    }
    
    return {
      success: true,
      id: data.id,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during save',
    }
  }
}

/**
 * Load safety check result by job ID
 * 
 * @param supabase - Supabase client
 * @param jobId - Processing job ID
 * @returns Safety check result or error
 */
export async function loadSafetyCheck(
  supabase: SupabaseClient,
  jobId: string,
): Promise<{ success: true; data: SafetyCheckResultV1 } | { success: false; error: string }> {
  try {
    const { data, error } = await supabase
      .from('safety_check_results')
      .select('check_data')
      .eq('job_id', jobId)
      .single()
    
    if (error) {
      return {
        success: false,
        error: `Failed to load safety check: ${error.message}`,
      }
    }
    
    if (!data || !data.check_data) {
      return {
        success: false,
        error: 'Safety check not found',
      }
    }
    
    return {
      success: true,
      data: data.check_data as SafetyCheckResultV1,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during load',
    }
  }
}

/**
 * Load safety check result by sections ID
 * Returns most recent if multiple exist
 * 
 * @param supabase - Supabase client
 * @param sectionsId - Report sections ID
 * @returns Safety check result or error
 */
export async function loadSafetyCheckBySections(
  supabase: SupabaseClient,
  sectionsId: string,
): Promise<{ success: true; data: SafetyCheckResultV1 } | { success: false; error: string }> {
  try {
    const { data, error } = await supabase
      .from('safety_check_results')
      .select('check_data')
      .eq('sections_id', sectionsId)
      .order('evaluated_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error) {
      return {
        success: false,
        error: `Failed to load safety check: ${error.message}`,
      }
    }
    
    if (!data || !data.check_data) {
      return {
        success: false,
        error: 'Safety check not found',
      }
    }
    
    return {
      success: true,
      data: data.check_data as SafetyCheckResultV1,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during load',
    }
  }
}

/**
 * Delete safety check result
 * 
 * @param supabase - Supabase client
 * @param jobId - Processing job ID
 * @returns Success status
 */
export async function deleteSafetyCheck(
  supabase: SupabaseClient,
  jobId: string,
): Promise<{ success: true } | { success: false; error: string }> {
  try {
    const { error } = await supabase
      .from('safety_check_results')
      .delete()
      .eq('job_id', jobId)
    
    if (error) {
      return {
        success: false,
        error: `Failed to delete safety check: ${error.message}`,
      }
    }
    
    return { success: true }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during delete',
    }
  }
}

/**
 * List safety checks that require review (BLOCK or UNKNOWN)
 * 
 * @param supabase - Supabase client
 * @param limit - Maximum number of results (default: 50)
 * @returns List of safety check results
 */
export async function listSafetyChecksRequiringReview(
  supabase: SupabaseClient,
  limit: number = 50,
): Promise<{
  success: true
  data: Array<{ jobId: string; result: SafetyCheckResultV1; evaluatedAt: string }>
} | { success: false; error: string }> {
  try {
    const { data, error } = await supabase
      .from('safety_check_results')
      .select('job_id, check_data, evaluated_at')
      .in('overall_action', ['BLOCK', 'UNKNOWN'])
      .order('evaluated_at', { ascending: false })
      .limit(limit)
    
    if (error) {
      return {
        success: false,
        error: `Failed to list safety checks: ${error.message}`,
      }
    }
    
    return {
      success: true,
      data: data.map((row) => ({
        jobId: row.job_id,
        result: row.check_data as SafetyCheckResultV1,
        evaluatedAt: row.evaluated_at,
      })),
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during list',
    }
  }
}

/**
 * Count safety checks by action
 * 
 * @param supabase - Supabase client
 * @returns Count by action
 */
export async function countSafetyChecksByAction(
  supabase: SupabaseClient,
): Promise<{
  success: true
  data: {
    PASS: number
    FLAG: number
    BLOCK: number
    UNKNOWN: number
  }
} | { success: false; error: string }> {
  try {
    const { data, error } = await supabase
      .from('safety_check_results')
      .select('overall_action')
    
    if (error) {
      return {
        success: false,
        error: `Failed to count safety checks: ${error.message}`,
      }
    }
    
    const counts = {
      PASS: 0,
      FLAG: 0,
      BLOCK: 0,
      UNKNOWN: 0,
    }
    
    for (const row of data) {
      counts[row.overall_action as keyof typeof counts]++
    }
    
    return {
      success: true,
      data: counts,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error during count',
    }
  }
}
