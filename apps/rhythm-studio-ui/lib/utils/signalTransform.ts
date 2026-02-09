/**
 * Signal Transformation Utilities (Issue 8)
 * 
 * Transforms raw signal data into clinician-facing and patient-facing formats
 */

import type {
  RawSignalData,
  ClinicianSignal,
  PatientSignalHint,
  SignalValidationResult,
} from '@/lib/types/signals'
import { FORBIDDEN_PATIENT_TERMS, PATIENT_HINT_TEMPLATES } from '@/lib/types/signals'

/**
 * Transform raw signal data into clinician-facing format
 * Full transparency with all technical details
 * Issue 8: R-08.2
 */
export function transformToClinicianSignal(raw: RawSignalData): ClinicianSignal {
  const signalCodes: string[] = []
  const redFlags: ClinicianSignal['redFlags'] = []

  // Extract signal codes from safety findings
  if (raw.safetyFindings && typeof raw.safetyFindings === 'object') {
    Object.keys(raw.safetyFindings).forEach((key) => {
      if (key.includes('finding') || key.includes('code')) {
        signalCodes.push(key)
      }
    })
  }

  // Extract signal codes from risk models
  if (raw.riskModels && typeof raw.riskModels === 'object') {
    Object.keys(raw.riskModels).forEach((key) => {
      if (key !== 'riskLevel' && key !== 'riskScore') {
        signalCodes.push(key)
      }
    })
  }

  // Extract red flags
  if (raw.redFlags && Array.isArray(raw.redFlags)) {
    raw.redFlags.forEach((flag) => {
      redFlags.push({
        code: flag,
        severity: 'high', // Default severity
      })
    })
  }

  // Extract priority ranking
  let priorityRanking: ClinicianSignal['priorityRanking'] = null
  if (raw.priorityRanking && typeof raw.priorityRanking === 'object') {
    priorityRanking = {
      tier: (raw.priorityRanking as { program_tier?: string }).program_tier,
      rank: (raw.priorityRanking as { rank?: number }).rank,
      interventions: (raw.priorityRanking as { topInterventions?: unknown[] }).topInterventions,
    }
  }

  return {
    riskLevel: raw.riskLevel,
    riskScore: raw.safetyScore,
    signalCodes,
    priorityRanking,
    redFlags,
    generatedAt: new Date().toISOString(),
  }
}

/**
 * Transform raw signal data into patient-friendly format
 * Limited, non-diagnostic, simplified view
 * Issue 8: R-08.3
 */
export function transformToPatientHints(raw: RawSignalData): PatientSignalHint {
  const hasRedFlags = Boolean(raw.redFlags && raw.redFlags.length > 0)
  const riskAreaHints: string[] = []
  const recommendedNextSteps: string[] = []

  // Map risk level to patient-friendly hint (max 3 hints)
  if (raw.riskLevel) {
    const riskLevelMap: Record<string, string> = {
      high: 'Einige Ihrer Angaben deuten auf erhöhte Aufmerksamkeit hin',
      moderate: 'Bestimmte Bereiche könnten genauer betrachtet werden',
      low: 'Die Angaben zeigen keine auffälligen Hinweise',
    }
    const hint = riskLevelMap[raw.riskLevel.toLowerCase()]
    if (hint) {
      riskAreaHints.push(hint)
    }
  }

  // Add generic hints based on safety findings (without specific scores)
  if (
    raw.safetyFindings &&
    typeof raw.safetyFindings === 'object' &&
    Object.keys(raw.safetyFindings).length > 0
  ) {
    riskAreaHints.push('Es wurden einige Aspekte zur weiteren Bewertung markiert')
  }

  // Limit to max 3 hints
  const limitedHints = riskAreaHints.slice(0, 3)

  // Add recommended next steps (non-directive)
  if (hasRedFlags || raw.riskLevel === 'high' || raw.riskLevel === 'moderate') {
    recommendedNextSteps.push(PATIENT_HINT_TEMPLATES.nextStep)
    recommendedNextSteps.push(PATIENT_HINT_TEMPLATES.generalFollowUp)
  }

  return {
    hasRedFlags,
    riskAreaHints: limitedHints,
    recommendedNextSteps: recommendedNextSteps.slice(0, 2), // Max 2 next steps
    isCollapsed: true, // Always collapsed by default
  }
}

/**
 * Validate patient-facing signal content
 * Ensures no forbidden terms or scores are present
 * Issue 8: R-08.4
 */
export function validatePatientSignal(hint: PatientSignalHint): SignalValidationResult {
  const violations: SignalValidationResult['violations'] = []

  // Check all text content for forbidden terms
  const allText = [
    ...hint.riskAreaHints,
    ...hint.recommendedNextSteps,
  ].join(' ').toLowerCase()

  // Check for numeric scores
  if (/\d+/.test(allText)) {
    violations.push({
      type: 'NUMERIC_SCORE',
      content: 'Numeric values found in patient hints',
      ruleName: 'R-08.4.1',
    })
  }

  // Check for percentages
  if (/%|prozent/i.test(allText)) {
    violations.push({
      type: 'PERCENTAGE',
      content: 'Percentage values found in patient hints',
      ruleName: 'R-08.4.2',
    })
  }

  // Check for forbidden terms
  FORBIDDEN_PATIENT_TERMS.forEach((term) => {
    if (allText.includes(term.toLowerCase())) {
      violations.push({
        type: 'DIAGNOSTIC_TERM',
        content: `Forbidden term found: ${term}`,
        ruleName: 'R-08.4.3',
      })
    }
  })

  return {
    isValid: violations.length === 0,
    violations,
  }
}

/**
 * Get patient-safe red flag message
 * Issue 8: R-08.3
 */
export function getRedFlagMessage(hasRedFlags: boolean): string {
  return hasRedFlags
    ? PATIENT_HINT_TEMPLATES.hasRedFlags
    : PATIENT_HINT_TEMPLATES.noRedFlags
}

/**
 * Check if signal hint exceeds max bullet points
 * Issue 8: R-08.3 (max 5 bullets)
 */
export function validateMaxBullets(hint: PatientSignalHint): boolean {
  const totalBullets = hint.riskAreaHints.length + hint.recommendedNextSteps.length + 1 // +1 for red flag message
  return totalBullets <= 5
}
