#!/usr/bin/env node

/**
 * Issue 8: Signal Validation Guardrails
 * 
 * Validates that patient-facing signals comply with all requirements:
 * - No forbidden terms
 * - No numeric scores or percentages
 * - Max 5 bullet points
 * - Collapsed by default
 * - Separated from consult notes
 * 
 * Each rule has a check implementation and vice versa.
 */

import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Issue 8 rules
const RULES = {
  'R-08.1': 'Patient view must not contain forbidden terms',
  'R-08.2': 'Clinician view must show all signal data',
  'R-08.3': 'Patient view must be collapsed by default with max 5 bullets',
  'R-08.4': 'Patient view must not contain scores, percentages, or codes',
  'R-08.5': 'Signals must be separated from consult notes',
}

// Forbidden terms from signals.ts
const FORBIDDEN_TERMS = [
  'diagnose',
  'erkrankung festgestellt',
  'krankheit',
  'pathologie',
  'kritisches risiko',
  'gefährlich',
  'sofortige behandlung',
  'score',
  'prozent',
  '%',
  'signal code',
  'tier',
  'ranking',
  'algorithmus',
]

let violations = []
let checks = []

/**
 * Check R-08.1: Patient view must not contain forbidden terms
 */
function checkR081() {
  checks.push('R-08.1')
  const patientSectionPath = join(
    __dirname,
    '../apps/rhythm-patient-ui/app/patient/(mobile)/components/PatientSignalsSection.tsx'
  )

  try {
    const content = readFileSync(patientSectionPath, 'utf-8').toLowerCase()
    
    FORBIDDEN_TERMS.forEach((term) => {
      // Check if term appears in actual display logic (not in comments or const definitions)
      const termLower = term.toLowerCase()
      const lines = content.split('\n')
      
      lines.forEach((line, idx) => {
        // Skip comments and constant definitions
        if (line.trim().startsWith('//') || line.trim().startsWith('*')) return
        if (line.includes('FORBIDDEN_PATIENT_TERMS') || line.includes('forbidden')) return
        
        // Check display text
        if (line.includes(termLower) && (line.includes('<p>') || line.includes('<span>') || line.includes('text='))) {
          violations.push({
            rule: 'R-08.1',
            message: `Forbidden term "${term}" found in patient view at line ${idx + 1}`,
            file: patientSectionPath,
          })
        }
      })
    })
  } catch (err) {
    violations.push({
      rule: 'R-08.1',
      message: `Could not read PatientSignalsSection.tsx: ${err.message}`,
      file: patientSectionPath,
    })
  }
}

/**
 * Check R-08.2: Clinician view must show all signal data
 */
function checkR082() {
  checks.push('R-08.2')
  const clinicianSectionPath = join(
    __dirname,
    '../apps/rhythm-studio-ui/app/clinician/patient/[id]/ClinicianSignalsSection.tsx'
  )

  try {
    const content = readFileSync(clinicianSectionPath, 'utf-8')
    
    const requiredFields = [
      'riskLevel',
      'riskScore',
      'signalCodes',
      'redFlags',
      'priorityRanking',
    ]
    
    requiredFields.forEach((field) => {
      if (!content.includes(field)) {
        violations.push({
          rule: 'R-08.2',
          message: `Required field "${field}" not displayed in clinician view`,
          file: clinicianSectionPath,
        })
      }
    })
    
    // Check for "automatisch generiert" label
    if (!content.includes('automatisch generiert') && !content.includes('Automatisch generierte')) {
      violations.push({
        rule: 'R-08.2',
        message: 'Missing "automatically generated" label in clinician view',
        file: clinicianSectionPath,
      })
    }
  } catch (err) {
    violations.push({
      rule: 'R-08.2',
      message: `Could not read ClinicianSignalsSection.tsx: ${err.message}`,
      file: clinicianSectionPath,
    })
  }
}

/**
 * Check R-08.3: Patient view collapsed by default with max 5 bullets
 */
function checkR083() {
  checks.push('R-08.3')
  const patientSectionPath = join(
    __dirname,
    '../apps/rhythm-patient-ui/app/patient/(mobile)/components/PatientSignalsSection.tsx'
  )

  try {
    const content = readFileSync(patientSectionPath, 'utf-8')
    
    // Check for collapsed state
    if (!content.includes('useState(false)') && !content.includes("isCollapsed: true")) {
      violations.push({
        rule: 'R-08.3',
        message: 'Patient signals section is not collapsed by default',
        file: patientSectionPath,
      })
    }
    
    // Check for max 5 bullets validation
    if (!content.includes('/5') && !content.includes('<= 5')) {
      violations.push({
        rule: 'R-08.3',
        message: 'Missing validation for max 5 bullet points',
        file: patientSectionPath,
      })
    }
  } catch (err) {
    violations.push({
      rule: 'R-08.3',
      message: `Could not read PatientSignalsSection.tsx: ${err.message}`,
      file: patientSectionPath,
    })
  }
}

/**
 * Check R-08.4: No scores, percentages, or codes in patient view
 */
function checkR084() {
  checks.push('R-08.4')
  const transformPath = join(
    __dirname,
    '../apps/rhythm-studio-ui/lib/utils/signalTransform.ts'
  )

  try {
    const content = readFileSync(transformPath, 'utf-8')
    
    // Check that validation exists
    if (!content.includes('validatePatientSignal')) {
      violations.push({
        rule: 'R-08.4',
        message: 'Missing validatePatientSignal function',
        file: transformPath,
      })
    }
    
    // Check for numeric/percentage validation
    if (!content.includes('NUMERIC_SCORE') || !content.includes('PERCENTAGE')) {
      violations.push({
        rule: 'R-08.4',
        message: 'Missing validation for numeric scores or percentages',
        file: transformPath,
      })
    }
  } catch (err) {
    violations.push({
      rule: 'R-08.4',
      message: `Could not read signalTransform.ts: ${err.message}`,
      file: transformPath,
    })
  }
}

/**
 * Check R-08.5: Signals separated from consult notes
 */
function checkR085() {
  checks.push('R-08.5')
  const clinicianPagePath = join(
    __dirname,
    '../apps/rhythm-studio-ui/app/clinician/patient/[id]/page.tsx'
  )

  try {
    const content = readFileSync(clinicianPagePath, 'utf-8')
    
    // Check that both sections exist and are separate
    const hasSignalsSection = content.includes('ClinicianSignalsSection')
    const hasConsultNoteSection = content.includes('ConsultNote') || content.includes('DiagnosisSection')
    
    if (!hasSignalsSection) {
      violations.push({
        rule: 'R-08.5',
        message: 'ClinicianSignalsSection not found in clinician page',
        file: clinicianPagePath,
      })
    }
    
    if (hasSignalsSection && hasConsultNoteSection) {
      // Check they are in separate components/sections
      const signalsIdx = content.indexOf('ClinicianSignalsSection')
      const consultIdx = content.indexOf('DiagnosisSection')
      
      if (Math.abs(signalsIdx - consultIdx) < 100) {
        violations.push({
          rule: 'R-08.5',
          message: 'Signals and consult notes may not be properly separated',
          file: clinicianPagePath,
        })
      }
    }
  } catch (err) {
    violations.push({
      rule: 'R-08.5',
      message: `Could not read clinician page.tsx: ${err.message}`,
      file: clinicianPagePath,
    })
  }
}

// Run all checks
function runChecks() {
  console.log('\n🔍 Issue 8: Running Signal Validation Guardrails...\n')
  
  checkR081()
  checkR082()
  checkR083()
  checkR084()
  checkR085()
  
  // Report results
  console.log(`✅ Checks performed: ${checks.length}`)
  console.log(`   Rules: ${checks.join(', ')}\n`)
  
  if (violations.length === 0) {
    console.log('✅ All validations passed!\n')
    return 0
  } else {
    console.log(`❌ Found ${violations.length} violation(s):\n`)
    violations.forEach((v) => {
      console.log(`   [violates ${v.rule}] ${v.message}`)
      console.log(`   File: ${v.file}\n`)
    })
    return 1
  }
}

// Verify rule-check matrix
function verifyMatrix() {
  const allRules = Object.keys(RULES)
  const checkedRules = [...new Set(checks)]
  
  const rulesWithoutChecks = allRules.filter((r) => !checkedRules.includes(r))
  const checksWithoutRules = checkedRules.filter((c) => !allRules.includes(c))
  
  if (rulesWithoutChecks.length > 0) {
    console.log(`⚠️  Rules without checks: ${rulesWithoutChecks.join(', ')}`)
  }
  
  if (checksWithoutRules.length > 0) {
    console.log(`⚠️  Checks without rules: ${checksWithoutRules.join(', ')}`)
  }
  
  if (rulesWithoutChecks.length === 0 && checksWithoutRules.length === 0) {
    console.log('✅ Rule-Check matrix is complete\n')
  }
}

const exitCode = runChecks()
verifyMatrix()

process.exit(exitCode)
