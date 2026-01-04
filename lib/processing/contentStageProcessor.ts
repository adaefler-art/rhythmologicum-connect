/**
 * Content Stage Processor - V05-I05.4
 * 
 * Processes the CONTENT stage in the processing pipeline.
 * Generates modular report sections from risk bundles and rankings.
 * 
 * @module lib/processing/contentStageProcessor
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import { loadRiskBundle } from '@/lib/risk/persistence'
import { loadPriorityRanking } from '@/lib/ranking/persistence'
import { generateSections, type SectionGenerationContext } from '@/lib/sections/generator'
import { saveReportSections, loadReportSections } from '@/lib/sections/persistence'

// ============================================================
// Constants
// ============================================================

const DEFAULT_ALGORITHM_VERSION = 'v1.0.0'

// ============================================================
// Content Stage Processor
// ============================================================

export interface ContentStageResult {
  success: boolean
  sectionsId?: string
  isNewSections?: boolean
  error?: string
  details?: any
}

/**
 * Process content stage for a job
 * 
 * Steps:
 * 1. Check if sections already exist (idempotency)
 * 2. Load risk bundle
 * 3. Load priority ranking (if available)
 * 4. Generate sections
 * 5. Save sections to database
 * 
 * @param supabase - Supabase admin client (service role)
 * @param jobId - Processing job ID
 * @param programTier - Optional program tier constraint
 */
export async function processContentStage(
  supabase: SupabaseClient,
  jobId: string,
  programTier?: string,
): Promise<ContentStageResult> {
  try {
    // Step 1: Check for existing sections (idempotency)
    const existingCheck = await loadReportSections(supabase, jobId)
    if (existingCheck.success && existingCheck.sections) {
      console.log(`[ContentStage] Sections already exist for job ${jobId}, returning existing`)
      return {
        success: true,
        sectionsId: existingCheck.sections.riskBundleId,
        isNewSections: false,
      }
    }
    
    // Step 2: Load risk bundle
    const riskBundleResult = await loadRiskBundle(supabase, jobId)
    if (!riskBundleResult.success || !riskBundleResult.bundle) {
      return {
        success: false,
        error: riskBundleResult.error || 'Risk bundle not found for job',
      }
    }
    
    const riskBundle = riskBundleResult.bundle
    
    // Step 3: Load priority ranking (optional)
    let ranking
    const rankingResult = await loadPriorityRanking(supabase, jobId)
    if (rankingResult.success && rankingResult.ranking) {
      ranking = rankingResult.ranking
      console.log(`[ContentStage] Loaded ranking for job ${jobId}`)
    } else {
      console.log(`[ContentStage] No ranking found for job ${jobId}, proceeding without`)
    }
    
    // Step 4: Prepare generation context
    const context: SectionGenerationContext = {
      jobId,
      riskBundle,
      ranking,
      programTier,
      algorithmVersion: DEFAULT_ALGORITHM_VERSION,
      funnelVersion: riskBundle.funnelVersion,
    }
    
    // Step 5: Generate sections
    console.log(`[ContentStage] Generating sections for job ${jobId}`)
    const generationResult = await generateSections(context, {
      method: 'template', // Start with template-based, can add LLM later
    })
    
    if (!generationResult.success) {
      return {
        success: false,
        error: generationResult.error?.message || 'Section generation failed',
        details: generationResult.error,
      }
    }
    
    const sections = generationResult.data
    
    // Step 6: Save sections to database
    const saveResult = await saveReportSections(supabase, jobId, sections)
    
    if (!saveResult.success) {
      return {
        success: false,
        error: saveResult.error || 'Failed to save sections',
      }
    }
    
    console.log(`[ContentStage] Successfully created sections for job ${jobId}`)
    return {
      success: true,
      sectionsId: saveResult.sectionsId,
      isNewSections: true,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('[ContentStage] Unexpected error:', message)
    return {
      success: false,
      error: `Unexpected error during content generation: ${message}`,
    }
  }
}
