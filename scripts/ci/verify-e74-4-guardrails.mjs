#!/usr/bin/env node

/**
 * E74.4 Guardrails Verification Script
 * 
 * Verifies that the FunnelRunner implementation follows E74.4 requirements:
 * - Runtime state from API, not local calculation
 * - No build-time content
 * - Validation before navigation
 * - Resume from API
 * - Deterministic error states
 * - Uses conditional logic evaluator
 */

import { readFileSync } from 'fs'
import { join } from 'path'

const FUNNEL_RUNNER_PATH = join(
  process.cwd(),
  'apps/rhythm-patient-ui/app/patient/(mobile)/components/FunnelRunner.tsx'
)

// Error code to rule ID mapping
const ERROR_CODE_TO_RULE_ID = {
  'E74_4_RUNTIME_STATE': 'R-E74.4-001',
  'E74_4_NO_BUILD_CONTENT': 'R-E74.4-002',
  'E74_4_VALIDATE_BEFORE_NAV': 'R-E74.4-003',
  'E74_4_RESUME_FROM_API': 'R-E74.4-004',
  'E74_4_DETERMINISTIC_ERRORS': 'R-E74.4-005',
  'E74_4_CONDITIONAL_EVALUATOR': 'R-E74.4-006',
}

const violations = []

function addViolation(code, message, line = null) {
  const ruleId = ERROR_CODE_TO_RULE_ID[code]
  const fullMessage = `[${code}] violates ${ruleId}: ${message}`
  if (line) {
    console.error(`  Line ${line}: ${fullMessage}`)
  } else {
    console.error(`  ${fullMessage}`)
  }
  violations.push({ code, ruleId, message, line })
}

console.log('🔍 E74.4 Guardrails Verification\n')

try {
  const content = readFileSync(FUNNEL_RUNNER_PATH, 'utf-8')
  const lines = content.split('\n')

  // R-E74.4-001: Runtime State Source
  console.log('Checking R-E74.4-001: Runtime State Source...')
  const hasLocalStepCalc = /const\s+currentStep\s*=\s*\d+/.test(content) || 
                          /setCurrentStep\s*\(\s*\d+/.test(content) ||
                          /currentStep\s*\+\+/.test(content)
  
  if (hasLocalStepCalc) {
    addViolation('E74_4_RUNTIME_STATE', 'Found local step calculation instead of using API response')
  }

  const usesRuntimeCurrentStep = /currentStepId:\s*validation\.nextStep/gm.test(content)
  if (!usesRuntimeCurrentStep) {
    addViolation('E74_4_RUNTIME_STATE', 'Does not use nextStep from validation API response')
  }

  // R-E74.4-002: No Build-time Content
  console.log('Checking R-E74.4-002: No Build-time Content...')
  const hasHardcodedQuestions = /__DEV_FIXTURE__QUESTIONS/.test(content) ||
                                /const\s+questions\s*=\s*\[/.test(content)
  
  if (hasHardcodedQuestions) {
    addViolation('E74_4_NO_BUILD_CONTENT', 'Found hardcoded questions in FunnelRunner')
  }

  const loadsFromAPI = /\/api\/funnels\/.*\/definition/.test(content)
  if (!loadsFromAPI) {
    addViolation('E74_4_NO_BUILD_CONTENT', 'Does not load funnel definition from API')
  }

  // R-E74.4-003: Validation Before Navigation
  console.log('Checking R-E74.4-003: Validation Before Navigation...')
  
  // Find handleContinue function - just check if it contains validateStep call
  const hasHandleContinue = /const handleContinue\s*=/.test(content)
  if (!hasHandleContinue) {
    addViolation('E74_4_VALIDATE_BEFORE_NAV', 'Could not find handleContinue function')
  }

  const validatesBeforeNav = /const validation\s*=\s*await validateStep/.test(content)
  if (!validatesBeforeNav) {
    addViolation('E74_4_VALIDATE_BEFORE_NAV', 'handleContinue does not call validateStep before navigation')
  }

  // Check if setRuntime only happens after validation check
  const hasValidationGuard = /if\s*\(\s*!validation\s*\)\s*{[\s\S]*?return/.test(content) ||
                              /if\s*\(\s*!validation\.isValid\s*\)\s*{[\s\S]*?return/.test(content)
  
  if (validatesBeforeNav && !hasValidationGuard) {
    addViolation('E74_4_VALIDATE_BEFORE_NAV', 'setRuntime not guarded by validation result check')
  }

  // R-E74.4-004: Resume from API
  console.log('Checking R-E74.4-004: Resume from API...')
  const hasResumeFromAPI = /await resumeAssessment/.test(content)
  if (!hasResumeFromAPI) {
    addViolation('E74_4_RESUME_FROM_API', 'Does not call resumeAssessment API')
  }

  const usesLocalStorage = /localStorage\.getItem.*currentStep/.test(content)
  if (usesLocalStorage) {
    addViolation('E74_4_RESUME_FROM_API', 'Uses localStorage for currentStep instead of API')
  }

  // R-E74.4-005: Deterministic Error States
  console.log('Checking R-E74.4-005: Deterministic Error States...')
  const hasErrorType = /type:\s*ErrorType/.test(content) || 
                       /type:\s*['"]not_found['"]/.test(content) ||
                       /type:\s*['"]unauthorized['"]/.test(content)
  
  if (!hasErrorType) {
    addViolation('E74_4_DETERMINISTIC_ERRORS', 'Error states not typed (not_found, unauthorized, network, server)')
  }

  const hasRandomLoading = /Math\.random/.test(content) || 
                          /setTimeout.*random/i.test(content)
  
  if (hasRandomLoading) {
    addViolation('E74_4_DETERMINISTIC_ERRORS', 'Found random/non-deterministic loading behavior')
  }

  // R-E74.4-006: Conditional Logic Evaluator
  console.log('Checking R-E74.4-006: Conditional Logic Evaluator...')
  const importsConditionalLogic = /from\s+['"]@\/lib\/questionnaire\/conditionalLogic['"]/.test(content)
  
  if (!importsConditionalLogic) {
    addViolation('E74_4_CONDITIONAL_EVALUATOR', 'Does not import from @/lib/questionnaire/conditionalLogic')
  }

  const hasInlineConditionalLogic = /if\s*\(.*answer.*===.*\)/g.test(content) &&
                                   !/evaluateConditionalLogic|isStepVisible/.test(content)
  
  if (hasInlineConditionalLogic) {
    addViolation('E74_4_CONDITIONAL_EVALUATOR', 'Found inline conditional logic instead of using evaluator')
  }

  // Summary
  console.log('\n' + '='.repeat(60))
  if (violations.length === 0) {
    console.log('✅ All E74.4 guardrails satisfied!')
    console.log('Coverage: 100.0% (6/6 rules with checks)')
    process.exit(0)
  } else {
    console.log(`❌ Found ${violations.length} violation(s)\n`)
    console.log('Violations by rule:')
    
    const violationsByRule = violations.reduce((acc, v) => {
      if (!acc[v.ruleId]) acc[v.ruleId] = []
      acc[v.ruleId].push(v)
      return acc
    }, {})

    Object.entries(violationsByRule).forEach(([ruleId, vios]) => {
      console.log(`  ${ruleId}: ${vios.length} violation(s)`)
      vios.forEach(v => {
        console.log(`    - ${v.message}`)
      })
    })

    console.log('\nCoverage: ' + 
      `${Math.round((6 - Object.keys(violationsByRule).length) / 6 * 100)}%` +
      ` (${6 - Object.keys(violationsByRule).length}/6 rules passed)`)
    
    process.exit(1)
  }
} catch (error) {
  console.error('Error running guardrails verification:', error.message)
  process.exit(1)
}
