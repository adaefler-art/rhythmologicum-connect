/**
 * Report Sections Persistence - V05-I05.4
 * 
 * Persistence layer for report sections storage and retrieval.
 * Idempotent operations with fail-closed error handling.
 * 
 * @module lib/sections/persistence
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { ReportSectionsV1 } from '@/lib/contracts/reportSections'

// ============================================================
// Result Types
// ============================================================

export interface SaveSectionsResult {
  success: boolean
  sectionsId?: string
  error?: string
}

export interface LoadSectionsResult {
  success: boolean
  sections?: ReportSectionsV1
  error?: string
}

// ============================================================
// Save Report Sections
// ============================================================

/**
 * Save report sections to database
 * Idempotent: Upsert based on job_id
 * 
 * @param supabase - Supabase client (service role required)
 * @param jobId - Processing job ID
 * @param sections - Report sections data
 * @returns Save result with sections ID
 */
export async function saveReportSections(
  supabase: SupabaseClient,
  jobId: string,
  sections: ReportSectionsV1,
): Promise<SaveSectionsResult> {
  try {
    // Extract metadata for top-level columns
    const metadata = sections.metadata || {}
    
    // Prepare row data
    const row = {
      job_id: jobId,
      risk_bundle_id: sections.riskBundleId,
      ranking_id: sections.rankingId || null,
      sections_version: sections.sectionsVersion,
      program_tier: sections.programTier || null,
      sections_data: sections, // Store complete structure
      generation_time_ms: metadata.generationTimeMs || null,
      llm_call_count: metadata.llmCallCount || 0,
      fallback_count: metadata.fallbackCount || 0,
      generated_at: sections.generatedAt,
    }
    
    // Upsert (insert or update)
    const { data, error } = await supabase
      .from('report_sections')
      .upsert(row, {
        onConflict: 'job_id',
      })
      .select('id')
      .single()
    
    if (error) {
      console.error('[ReportSectionsPersistence] Save error:', error.message)
      return {
        success: false,
        error: `Failed to save report sections: ${error.message}`,
      }
    }
    
    return {
      success: true,
      sectionsId: data.id,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[ReportSectionsPersistence] Unexpected save error:', message)
    return {
      success: false,
      error: `Unexpected error saving report sections: ${message}`,
    }
  }
}

// ============================================================
// Load Report Sections by Job ID
// ============================================================

/**
 * Load report sections by job ID
 * 
 * @param supabase - Supabase client
 * @param jobId - Processing job ID
 * @returns Load result with sections data
 */
export async function loadReportSections(
  supabase: SupabaseClient,
  jobId: string,
): Promise<LoadSectionsResult> {
  try {
    const { data, error } = await supabase
      .from('report_sections')
      .select('sections_data')
      .eq('job_id', jobId)
      .single()
    
    if (error) {
      // Not found is not an error (might not be generated yet)
      if (error.code === 'PGRST116') {
        return {
          success: true,
          sections: undefined,
        }
      }
      
      console.error('[ReportSectionsPersistence] Load error:', error.message)
      return {
        success: false,
        error: `Failed to load report sections: ${error.message}`,
      }
    }
    
    if (!data || !data.sections_data) {
      return {
        success: true,
        sections: undefined,
      }
    }
    
    return {
      success: true,
      sections: data.sections_data as ReportSectionsV1,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[ReportSectionsPersistence] Unexpected load error:', message)
    return {
      success: false,
      error: `Unexpected error loading report sections: ${message}`,
    }
  }
}

// ============================================================
// Load Report Sections by Risk Bundle ID
// ============================================================

/**
 * Load most recent report sections for a risk bundle
 * 
 * @param supabase - Supabase client
 * @param riskBundleId - Risk bundle ID
 * @returns Load result with sections data
 */
export async function loadReportSectionsByRiskBundle(
  supabase: SupabaseClient,
  riskBundleId: string,
): Promise<LoadSectionsResult> {
  try {
    const { data, error } = await supabase
      .from('report_sections')
      .select('sections_data')
      .eq('risk_bundle_id', riskBundleId)
      .order('generated_at', { ascending: false })
      .limit(1)
      .single()
    
    if (error) {
      // Not found is not an error
      if (error.code === 'PGRST116') {
        return {
          success: true,
          sections: undefined,
        }
      }
      
      console.error('[ReportSectionsPersistence] Load by risk bundle error:', error.message)
      return {
        success: false,
        error: `Failed to load report sections by risk bundle: ${error.message}`,
      }
    }
    
    if (!data || !data.sections_data) {
      return {
        success: true,
        sections: undefined,
      }
    }
    
    return {
      success: true,
      sections: data.sections_data as ReportSectionsV1,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[ReportSectionsPersistence] Unexpected load by risk bundle error:', message)
    return {
      success: false,
      error: `Unexpected error loading report sections by risk bundle: ${message}`,
    }
  }
}

// ============================================================
// Delete Report Sections
// ============================================================

/**
 * Delete report sections by job ID
 * Used for cleanup or reprocessing
 * 
 * @param supabase - Supabase client (service role required)
 * @param jobId - Processing job ID
 * @returns Success/error result
 */
export async function deleteReportSections(
  supabase: SupabaseClient,
  jobId: string,
): Promise<SaveSectionsResult> {
  try {
    const { error } = await supabase
      .from('report_sections')
      .delete()
      .eq('job_id', jobId)
    
    if (error) {
      console.error('[ReportSectionsPersistence] Delete error:', error.message)
      return {
        success: false,
        error: `Failed to delete report sections: ${error.message}`,
      }
    }
    
    return {
      success: true,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[ReportSectionsPersistence] Unexpected delete error:', message)
    return {
      success: false,
      error: `Unexpected error deleting report sections: ${message}`,
    }
  }
}
