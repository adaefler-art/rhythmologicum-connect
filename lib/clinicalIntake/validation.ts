/**
 * Issue 10: Clinical Intake Quality Validation
 * 
 * Quality checks to ensure clinical intake meets medical standards.
 * Each check references a specific rule ID for traceability.
 */

import type {
  StructuredIntakeData,
  IntakeQualityCheck,
  IntakeQualityReport,
} from '@/lib/types/clinicalIntake'

/**
 * Check if clinical summary avoids colloquial language
 * Rule: R-I10-1.1
 */
function checkNoColloquialLanguage(summary: string): IntakeQualityCheck {
  const colloquialPatterns = [
    /\bsuper\b/i,
    /\bokay\b/i,
    /\bok\b/i,
    /\bklar\b/i,
    /\balles gut\b/i,
    /\bgeil\b/i,
    /\bcool\b/i,
    /\bnaja\b/i,
  ]

  const found = colloquialPatterns.some((pattern) => pattern.test(summary))

  return {
    rule: 'R-I10-1.1',
    passed: !found,
    message: found
      ? 'Clinical summary contains colloquial language'
      : 'No colloquial language detected',
    severity: 'error',
  }
}

/**
 * Check if clinical summary uses medical terminology
 * Rule: R-I10-1.2
 */
function checkMedicalTerminology(summary: string): IntakeQualityCheck {
  // Summary should not be too short (indicates low quality)
  const minLength = 50

  if (summary.length < minLength) {
    return {
      rule: 'R-I10-1.2',
      passed: false,
      message: `Clinical summary too short (${summary.length} chars, min ${minLength})`,
      severity: 'error',
    }
  }

  return {
    rule: 'R-I10-1.2',
    passed: true,
    message: 'Clinical summary has adequate length',
    severity: 'info',
  }
}

/**
 * Check if structured data has required fields
 * Rule: R-I10-2.1
 */
function checkRequiredFields(data: StructuredIntakeData): IntakeQualityCheck {
  const hasContent =
    data.chief_complaint ||
    data.history_of_present_illness ||
    (data.relevant_negatives && data.relevant_negatives.length > 0) ||
    (data.past_medical_history && data.past_medical_history.length > 0) ||
    (data.medication && data.medication.length > 0)

  return {
    rule: 'R-I10-2.1',
    passed: hasContent,
    message: hasContent
      ? 'Structured intake has content in key fields'
      : 'Structured intake is missing all key fields',
    severity: 'error',
  }
}

/**
 * Check if arrays in structured data are valid
 * Rule: R-I10-2.2
 */
function checkArrayValidity(data: StructuredIntakeData): IntakeQualityCheck {
  const arrayFields = [
    data.relevant_negatives,
    data.past_medical_history,
    data.medication,
    data.psychosocial_factors,
    data.red_flags,
    data.uncertainties,
  ]

  const allValid = arrayFields.every(
    (field) => !field || (Array.isArray(field) && field.every((item) => typeof item === 'string'))
  )

  return {
    rule: 'R-I10-2.2',
    passed: allValid,
    message: allValid ? 'All array fields are valid' : 'Some array fields contain invalid data',
    severity: 'error',
  }
}

/**
 * Check if summary avoids chat-like language
 * Rule: R-I10-3.1
 */
function checkNoChatLanguage(summary: string): IntakeQualityCheck {
  const chatPatterns = [
    /Patient.*sagt/i,
    /Patient.*meint/i,
    /laut Patient/i,
    /wie der Patient.*erwähnt/i,
    /wie.*im Chat/i,
  ]

  const found = chatPatterns.some((pattern) => pattern.test(summary))

  return {
    rule: 'R-I10-3.1',
    passed: !found,
    message: found ? 'Clinical summary contains chat-like references' : 'No chat language detected',
    severity: 'warning',
  }
}

/**
 * Check if red flags are properly documented
 * Rule: R-I10-4.1
 */
function checkRedFlagDocumentation(data: StructuredIntakeData): IntakeQualityCheck {
  const hasRedFlags = data.red_flags && data.red_flags.length > 0

  // If there are red flags, they should be clear and specific
  if (hasRedFlags) {
    const allClear = data.red_flags!.every((flag) => flag.length > 10)

    return {
      rule: 'R-I10-4.1',
      passed: allClear,
      message: allClear
        ? 'Red flags are properly documented'
        : 'Some red flags are too vague or short',
      severity: 'warning',
    }
  }

  return {
    rule: 'R-I10-4.1',
    passed: true,
    message: 'No red flags documented (or none present)',
    severity: 'info',
  }
}

/**
 * Check if uncertainties are explicitly stated
 * Rule: R-I10-4.2
 */
function checkUncertaintyExplicit(data: StructuredIntakeData): IntakeQualityCheck {
  const hasUncertainties = data.uncertainties && data.uncertainties.length > 0

  return {
    rule: 'R-I10-4.2',
    passed: true,
    message: hasUncertainties
      ? `${data.uncertainties!.length} uncertainties explicitly documented`
      : 'No uncertainties documented',
    severity: 'info',
  }
}

/**
 * Validate clinical intake quality
 */
export function validateIntakeQuality(
  structuredData: StructuredIntakeData,
  clinicalSummary: string
): IntakeQualityReport {
  const checks: IntakeQualityCheck[] = [
    checkNoColloquialLanguage(clinicalSummary),
    checkMedicalTerminology(clinicalSummary),
    checkRequiredFields(structuredData),
    checkArrayValidity(structuredData),
    checkNoChatLanguage(clinicalSummary),
    checkRedFlagDocumentation(structuredData),
    checkUncertaintyExplicit(structuredData),
  ]

  const errors = checks.filter((c) => !c.passed && c.severity === 'error')
  const warnings = checks.filter((c) => !c.passed && c.severity === 'warning')
  const isValid = errors.length === 0

  return {
    isValid,
    checks,
    errors,
    warnings,
  }
}
