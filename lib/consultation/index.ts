/**
 * Issue 7: Consultation to Structured Facts Pipeline
 * 
 * Main exports for consultation fact extraction and Risk/Results integration
 */

export * from './types'
export * from './questionMapping'
export * from './factExtraction'
export * from './syntheticAssessment'
export * from './pipeline'

// Re-export commonly used functions
export { processConsultationToRiskPipeline, triggerRiskStageForConsultation } from './pipeline'
export { extractFactsFromConsultation } from './factExtraction'
export { createSyntheticAssessment } from './syntheticAssessment'
export {
  CONSULTATION_QUESTION_MAPPINGS,
  EXTRACTOR_VERSION,
  DEFAULT_CONSULTATION_FUNNEL,
} from './questionMapping'
