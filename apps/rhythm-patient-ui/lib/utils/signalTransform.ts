import type {
  RawSignalData,
  PatientSignalHint,
  SignalValidationResult,
} from '@/lib/types/signals'
import { FORBIDDEN_PATIENT_TERMS, PATIENT_HINT_TEMPLATES } from '@/lib/types/signals'

export function transformToPatientHints(raw: RawSignalData): PatientSignalHint {
  const hasRedFlags = Boolean(raw.redFlags && raw.redFlags.length > 0)
  const riskAreaHints: string[] = []
  const recommendedNextSteps: string[] = []

  if (raw.riskLevel) {
    const riskLevelMap: Record<string, string> = {
      high: 'Einige Ihrer Angaben deuten auf erhoehte Aufmerksamkeit hin',
      moderate: 'Bestimmte Bereiche koennten genauer betrachtet werden',
      low: 'Die Angaben zeigen keine auffaelligen Hinweise',
    }
    const hint = riskLevelMap[raw.riskLevel.toLowerCase()]
    if (hint) {
      riskAreaHints.push(hint)
    }
  }

  if (
    raw.safetyFindings &&
    typeof raw.safetyFindings === 'object' &&
    Object.keys(raw.safetyFindings).length > 0
  ) {
    riskAreaHints.push('Es wurden einige Aspekte zur weiteren Bewertung markiert')
  }

  const limitedHints = riskAreaHints.slice(0, 3)

  if (hasRedFlags || raw.riskLevel === 'high' || raw.riskLevel === 'moderate') {
    recommendedNextSteps.push(PATIENT_HINT_TEMPLATES.nextStep)
    recommendedNextSteps.push(PATIENT_HINT_TEMPLATES.generalFollowUp)
  }

  return {
    hasRedFlags,
    riskAreaHints: limitedHints,
    recommendedNextSteps: recommendedNextSteps.slice(0, 2),
    isCollapsed: true,
  }
}

export function validatePatientSignal(hint: PatientSignalHint): SignalValidationResult {
  const violations: SignalValidationResult['violations'] = []
  const allText = [...hint.riskAreaHints, ...hint.recommendedNextSteps]
    .join(' ')
    .toLowerCase()

  if (/\d+/.test(allText)) {
    violations.push({
      type: 'NUMERIC_SCORE',
      content: 'Numeric values found in patient hints',
      ruleName: 'R-08.4.1',
    })
  }

  if (/%|prozent/i.test(allText)) {
    violations.push({
      type: 'PERCENTAGE',
      content: 'Percentage values found in patient hints',
      ruleName: 'R-08.4.2',
    })
  }

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

export function getRedFlagMessage(hasRedFlags: boolean): string {
  return hasRedFlags
    ? PATIENT_HINT_TEMPLATES.hasRedFlags
    : PATIENT_HINT_TEMPLATES.noRedFlags
}

export function validateMaxBullets(hint: PatientSignalHint): boolean {
  const totalBullets = hint.riskAreaHints.length + hint.recommendedNextSteps.length + 1
  return totalBullets <= 5
}
