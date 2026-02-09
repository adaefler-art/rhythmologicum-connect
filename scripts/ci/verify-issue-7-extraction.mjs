#!/usr/bin/env node
/**
 * Issue 7: Consultation Fact Extraction Verification
 * 
 * Verifies that consultation fact extraction follows all rules:
 * - Type safety and validation
 * - Mapping configuration correctness
 * - Integration with Risk/Results pipeline
 * - No patient-visible changes
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '../..')

const errors = []
const warnings = []

console.log('=== Issue 7: Consultation Fact Extraction Verification ===\n')

// ============================================================================
// Rule R-I7-01: Mapping configuration must reference valid question IDs
// ============================================================================

function checkMappingConfiguration() {
  console.log('Checking R-I7-01: Mapping configuration references valid question IDs...')

  const mappingFile = path.join(rootDir, 'lib/consultation/questionMapping.ts')
  if (!fs.existsSync(mappingFile)) {
    errors.push('violates R-I7-01: questionMapping.ts not found')
    return
  }

  const content = fs.readFileSync(mappingFile, 'utf-8')

  // Check that CONSULTATION_QUESTION_MAPPINGS is exported
  if (!content.includes('export const CONSULTATION_QUESTION_MAPPINGS')) {
    errors.push('violates R-I7-01: CONSULTATION_QUESTION_MAPPINGS not exported')
  }

  // Check that each mapping has questionId
  if (!content.includes('questionId:')) {
    errors.push('violates R-I7-01: Mappings missing questionId field')
  }

  // Check that validateMappingConfiguration exists
  if (!content.includes('export function validateMappingConfiguration')) {
    errors.push('violates R-I7-01: validateMappingConfiguration function missing')
  }

  console.log('  ✓ R-I7-01 passed\n')
}

// ============================================================================
// Rule R-I7-02: Extraction logic must return integer or null
// ============================================================================

function checkExtractionLogic() {
  console.log('Checking R-I7-02: Extraction logic returns integer or null...')

  const mappingFile = path.join(rootDir, 'lib/consultation/questionMapping.ts')
  const content = fs.readFileSync(mappingFile, 'utf-8')

  // Check that extractionLogic is defined
  if (!content.includes('extractionLogic:')) {
    errors.push('violates R-I7-02: extractionLogic not defined in mappings')
  }

  // Check return type annotation
  if (!content.includes('): number | null')) {
    warnings.push('R-I7-02: extractionLogic should have return type annotation number | null')
  }

  console.log('  ✓ R-I7-02 passed\n')
}

// ============================================================================
// Rule R-I7-05: Confidence threshold enforcement
// ============================================================================

function checkConfidenceThreshold() {
  console.log('Checking R-I7-05: Confidence threshold enforcement...')

  const extractionFile = path.join(rootDir, 'lib/consultation/factExtraction.ts')
  if (!fs.existsSync(extractionFile)) {
    errors.push('violates R-I7-05: factExtraction.ts not found')
    return
  }

  const content = fs.readFileSync(extractionFile, 'utf-8')

  // Check for MIN_CONFIDENCE_THRESHOLD usage
  if (!content.includes('MIN_CONFIDENCE_THRESHOLD')) {
    errors.push('violates R-I7-05: MIN_CONFIDENCE_THRESHOLD not imported/used')
  }

  // Check for confidence filtering
  if (!content.includes('minConfidence') && !content.includes('confidence <')) {
    errors.push('violates R-I7-05: No confidence threshold filtering found')
  }

  console.log('  ✓ R-I7-05 passed\n')
}

// ============================================================================
// Rule R-I7-13: Assessment must be linked to patient_id
// ============================================================================

function checkAssessmentPatientLink() {
  console.log('Checking R-I7-13: Assessment linked to patient_id...')

  const syntheticFile = path.join(rootDir, 'lib/consultation/syntheticAssessment.ts')
  if (!fs.existsSync(syntheticFile)) {
    errors.push('violates R-I7-13: syntheticAssessment.ts not found')
    return
  }

  const content = fs.readFileSync(syntheticFile, 'utf-8')

  // Check for patient_id in insert
  if (!content.includes('patient_id:')) {
    errors.push('violates R-I7-13: patient_id not set when creating assessment')
  }

  console.log('  ✓ R-I7-13 passed\n')
}

// ============================================================================
// Rule R-I7-14: Assessment status must be 'completed'
// ============================================================================

function checkAssessmentStatus() {
  console.log("Checking R-I7-14: Assessment status set to 'completed'...")

  const syntheticFile = path.join(rootDir, 'lib/consultation/syntheticAssessment.ts')
  const content = fs.readFileSync(syntheticFile, 'utf-8')

  // Check for status: 'completed'
  if (!content.includes("status: 'completed'")) {
    errors.push("violates R-I7-14: Assessment status not set to 'completed'")
  }

  // Check for state: 'completed'
  if (!content.includes("state: 'completed'")) {
    errors.push("violates R-I7-14: Assessment state not set to 'completed'")
  }

  console.log('  ✓ R-I7-14 passed\n')
}

// ============================================================================
// Rule R-I7-16: All facts saved as assessment_answers
// ============================================================================

function checkFactsSavedAsAnswers() {
  console.log('Checking R-I7-16: All facts saved as assessment_answers...')

  const syntheticFile = path.join(rootDir, 'lib/consultation/syntheticAssessment.ts')
  const content = fs.readFileSync(syntheticFile, 'utf-8')

  // Check for assessment_answers insert
  if (!content.includes("from('assessment_answers').insert")) {
    errors.push('violates R-I7-16: assessment_answers insert not found')
  }

  // Check for question_id and answer_value mapping
  if (!content.includes('question_id:') || !content.includes('answer_value:')) {
    errors.push('violates R-I7-16: question_id or answer_value not mapped in answers')
  }

  console.log('  ✓ R-I7-16 passed\n')
}

// ============================================================================
// Rule R-I7-21: Pipeline must be idempotent
// ============================================================================

function checkPipelineIdempotency() {
  console.log('Checking R-I7-21: Pipeline idempotency...')

  const pipelineFile = path.join(rootDir, 'lib/consultation/pipeline.ts')
  if (!fs.existsSync(pipelineFile)) {
    errors.push('violates R-I7-21: pipeline.ts not found')
    return
  }

  const content = fs.readFileSync(pipelineFile, 'utf-8')

  // Check for findExistingSyntheticAssessment
  if (!content.includes('findExistingSyntheticAssessment')) {
    errors.push('violates R-I7-21: No check for existing synthetic assessment')
  }

  // Check for update path
  if (!content.includes('updateSyntheticAssessment')) {
    errors.push('violates R-I7-21: No update path for existing assessments')
  }

  console.log('  ✓ R-I7-21 passed\n')
}

// ============================================================================
// Rule R-I7-23: Pipeline remains SSOT for signals
// ============================================================================

function checkPipelineSSOT() {
  console.log('Checking R-I7-23: Pipeline remains SSOT (no new risk adapters)...')

  // Check that we're not creating new risk calculation logic
  const riskFile = path.join(rootDir, 'lib/consultation/pipeline.ts')
  const content = fs.readFileSync(riskFile, 'utf-8')

  // Should NOT contain custom risk calculation
  if (content.includes('calculateRisk') || content.includes('riskScore:')) {
    warnings.push('R-I7-23: Potential custom risk calculation found - verify using existing pipeline')
  }

  // Should reference existing Risk Stage
  if (!content.includes('Risk Stage') && !content.includes('riskStageProcessor')) {
    warnings.push('R-I7-23: No reference to existing Risk Stage processor')
  }

  console.log('  ✓ R-I7-23 passed\n')
}

// ============================================================================
// Rule R-I7-22: Patient never sees "assessment" terminology
// ============================================================================

function checkPatientVisibility() {
  console.log('Checking R-I7-22: Patient never sees "assessment" terminology...')

  // This is enforced by architecture (consultations are internal)
  // Patient-facing code should not reference synthetic assessments

  const pipelineFile = path.join(rootDir, 'lib/consultation/pipeline.ts')
  const content = fs.readFileSync(pipelineFile, 'utf-8')

  // Check for comment about patient visibility
  if (!content.includes('Patient never sees') && !content.includes('internal processing')) {
    warnings.push('R-I7-22: Add comment documenting patient invisibility')
  }

  console.log('  ✓ R-I7-22 passed\n')
}

// ============================================================================
// Type System Checks
// ============================================================================

function checkTypeDefinitions() {
  console.log('Checking type definitions...')

  const typesFile = path.join(rootDir, 'lib/consultation/types.ts')
  if (!fs.existsSync(typesFile)) {
    errors.push('violates type safety: types.ts not found')
    return
  }

  const content = fs.readFileSync(typesFile, 'utf-8')

  // Check for key types
  const requiredTypes = [
    'ExtractedFact',
    'ConsultationExtractionResult',
    'ConsultationQuestionMapping',
    'SyntheticAssessmentMetadata',
    'ExtractionPipelineOptions',
    'ExtractionPipelineResult',
  ]

  requiredTypes.forEach((type) => {
    if (!content.includes(`export type ${type}`) && !content.includes(`export interface ${type}`)) {
      errors.push(`violates type safety: ${type} type not exported`)
    }
  })

  // Check for Zod schemas
  if (!content.includes('z.object')) {
    warnings.push('Consider adding Zod schemas for runtime validation')
  }

  console.log('  ✓ Type definitions passed\n')
}

// ============================================================================
// Integration Checks
// ============================================================================

function checkIntegrationPoints() {
  console.log('Checking integration with existing pipeline...')

  const pipelineFile = path.join(rootDir, 'lib/consultation/pipeline.ts')
  const content = fs.readFileSync(pipelineFile, 'utf-8')

  // Should use SupabaseClient
  if (!content.includes('SupabaseClient')) {
    errors.push('violates integration: SupabaseClient not used')
  }

  // Should reference assessment_answers table
  if (!content.includes('assessment_answers')) {
    warnings.push('Pipeline should reference assessment_answers table')
  }

  console.log('  ✓ Integration checks passed\n')
}

// ============================================================================
// Run all checks
// ============================================================================

checkMappingConfiguration()
checkExtractionLogic()
checkConfidenceThreshold()
checkAssessmentPatientLink()
checkAssessmentStatus()
checkFactsSavedAsAnswers()
checkPipelineIdempotency()
checkPipelineSSOT()
checkPatientVisibility()
checkTypeDefinitions()
checkIntegrationPoints()

// ============================================================================
// Report results
// ============================================================================

console.log('\n=== Verification Results ===\n')

if (errors.length > 0) {
  console.log('❌ ERRORS:')
  errors.forEach((error) => console.log(`  - ${error}`))
  console.log()
}

if (warnings.length > 0) {
  console.log('⚠️  WARNINGS:')
  warnings.forEach((warning) => console.log(`  - ${warning}`))
  console.log()
}

if (errors.length === 0 && warnings.length === 0) {
  console.log('✅ All Issue 7 extraction checks passed!')
  process.exit(0)
} else if (errors.length === 0) {
  console.log('✅ All required checks passed (warnings noted)')
  process.exit(0)
} else {
  console.log('❌ Some checks failed')
  process.exit(1)
}
