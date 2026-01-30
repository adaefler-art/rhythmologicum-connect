/**
 * Risk Bundle Persistence - V05-I05.2
 * 
 * Handles saving and loading risk bundles from database.
 * Provides idempotent operations tied to processing jobs.
 * 
 * @module lib/risk/persistence
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { RiskBundleV1 } from '@/lib/contracts/riskBundle'

const resolveMaybeSingle = async (query: any) => {
  if (query && typeof query.maybeSingle === 'function') {
    return query.maybeSingle()
  }
  return query.single()
}

// ============================================================
// Persistence Operations
// ============================================================

/**
 * Save risk bundle to database
 * Idempotent: overwrites existing bundle for same jobId
 * 
 * @param supabase - Supabase client (server-side)
 * @param jobId - Processing job ID
 * @param bundle - Risk bundle to save
 * @returns Success/error result
 */
export async function saveRiskBundle(
  supabase: SupabaseClient,
  jobId: string,
  bundle: RiskBundleV1,
): Promise<{ success: boolean; error?: string }> {
  try {
    // Check if bundle already exists for this job
    const { data: existing, error: fetchError } = await supabase
      .from('risk_bundles')
      .select('id')
      .eq('job_id', jobId)
      .maybeSingle()

    if (fetchError) {
      return { success: false, error: `Error checking existing bundle: ${fetchError.message}` }
    }

    // Upsert: insert or update
    const { data: upserted, error: upsertError } = await supabase
      .from('risk_bundles')
      .upsert({
        job_id: jobId,
        assessment_id: bundle.assessmentId,
        risk_bundle_version: bundle.riskBundleVersion,
        algorithm_version: bundle.algorithmVersion,
        funnel_version: bundle.funnelVersion,
        calculated_at: bundle.calculatedAt,
        bundle_data: bundle, // JSONB column stores complete bundle
        created_at: existing ? undefined : new Date().toISOString(), // Preserve created_at on update
        updated_at: new Date().toISOString(),
      })
      .eq('job_id', jobId)
      .select('id')
      .single()

    if (upsertError) {
      return { success: false, error: `Error saving bundle: ${upsertError.message}` }
    }

    if (!upserted?.id) {
      return { success: false, error: 'Error saving bundle: missing id after upsert' }
    }

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: `Unexpected error saving bundle: ${message}` }
  }
}

/**
 * Load risk bundle from database by job ID
 * 
 * @param supabase - Supabase client (server-side)
 * @param jobId - Processing job ID
 * @returns Risk bundle or null if not found
 */
export async function loadRiskBundle(
  supabase: SupabaseClient,
  jobId: string,
): Promise<{ success: boolean; bundle?: RiskBundleV1; error?: string }> {
  try {
    const query = supabase
      .from('risk_bundles')
      .select('bundle_data')
      .eq('job_id', jobId)

    const { data, error } = await resolveMaybeSingle(query)

    if (error) {
      return { success: false, error: `Error loading bundle: ${error.message}` }
    }

    if (!data) {
      return { success: false, error: 'Bundle not found' }
    }

    return { success: true, bundle: data.bundle_data as RiskBundleV1 }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: `Unexpected error loading bundle: ${message}` }
  }
}

/**
 * Load risk bundle by assessment ID
 * Returns the most recent bundle for the assessment
 * 
 * @param supabase - Supabase client (server-side)
 * @param assessmentId - Assessment ID
 * @returns Risk bundle or null if not found
 */
export async function loadRiskBundleByAssessment(
  supabase: SupabaseClient,
  assessmentId: string,
): Promise<{ success: boolean; bundle?: RiskBundleV1; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('risk_bundles')
      .select('bundle_data')
      .eq('assessment_id', assessmentId)
      .order('calculated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      return { success: false, error: `Error loading bundle: ${error.message}` }
    }

    if (!data) {
      return { success: false, error: 'Bundle not found' }
    }

    return { success: true, bundle: data.bundle_data as RiskBundleV1 }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: `Unexpected error loading bundle: ${message}` }
  }
}

/**
 * Delete risk bundle (for cleanup/testing)
 * 
 * @param supabase - Supabase client (server-side)
 * @param jobId - Processing job ID
 * @returns Success/error result
 */
export async function deleteRiskBundle(
  supabase: SupabaseClient,
  jobId: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('risk_bundles').delete().eq('job_id', jobId)

    if (error) {
      return { success: false, error: `Error deleting bundle: ${error.message}` }
    }

    return { success: true }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    return { success: false, error: `Unexpected error deleting bundle: ${message}` }
  }
}
