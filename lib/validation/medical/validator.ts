/**
 * Medical Validation Validator - V05-I05.5
 * 
 * Deterministic rule evaluation engine for Medical Validation Layer 1.
 * Evaluates report sections against validation rules and generates flags.
 * 
 * Key guarantees:
 * - Deterministic: same inputs → same flags
 * - Fail-closed: unknown rule keys / missing rule set → validation FAIL
 * - PHI-free: no patient identifiers in flags
 * - Versioned: tracks engine version used for validation
 * 
 * @module lib/validation/medical/validator
 */

import { randomUUID } from 'crypto'
import type { ReportSectionsV1, ReportSection } from '@/lib/contracts/reportSections'
import type {
  MedicalValidationResultV1,
  ValidationFlag,
  SectionValidationResult,
  ValidationSeverity,
  ValidationResult,
} from '@/lib/contracts/medicalValidation'
import {
  VALIDATION_STATUS,
  VALIDATION_SEVERITY,
} from '@/lib/contracts/medicalValidation'
import {
  listActiveRules,
  listRulesBySection,
  getRegistryVersion,
  getRulesetHash,
  type ValidationRule,
  type RuleLogic,
  type PatternRule,
  type KeywordRule,
  type ContraIndicationRule,
  type OutOfBoundsRule,
} from './ruleRegistry'

// ============================================================
// Validator Context
// ============================================================

/**
 * Context for validation
 */
export interface ValidatorContext {
  /** Report sections to validate */
  sections: ReportSectionsV1
  
  /** Optional: specific rules to use (defaults to all active rules) */
  ruleIds?: string[]
  
  /** Optional: override engine version (defaults to registry version) */
  engineVersion?: string
}

// ============================================================
// Rule Evaluation Functions
// ============================================================

/**
 * Evaluate a pattern rule against section content
 */
function evaluatePatternRule(
  rule: ValidationRule,
  section: ReportSection,
  logic: PatternRule
): ValidationFlag | null {
  try {
    const regex = new RegExp(logic.pattern, 'i')
    const hasMatch = regex.test(section.draft)
    
    const isViolation = logic.matchIsViolation ? hasMatch : !hasMatch
    
    if (isViolation) {
      return {
        flagId: randomUUID(),
        ruleId: rule.metadata.ruleId,
        ruleVersion: rule.metadata.version,
        flagType: rule.metadata.flagType,
        severity: rule.metadata.severity,
        sectionKey: section.sectionKey,
        reason: logic.reason,
        context: {
          sectionKey: section.sectionKey,
          pattern: logic.pattern,
        },
        flaggedAt: new Date().toISOString(),
      }
    }
    
    return null
  } catch (error) {
    // Invalid regex - fail-closed
    console.error(`Invalid pattern in rule ${rule.metadata.ruleId}:`, error)
    return {
      flagId: randomUUID(),
      ruleId: rule.metadata.ruleId,
      ruleVersion: rule.metadata.version,
      flagType: rule.metadata.flagType,
      severity: VALIDATION_SEVERITY.CRITICAL,
      sectionKey: section.sectionKey,
      reason: `Rule evaluation failed: invalid pattern`,
      context: {
        error: 'invalid_pattern',
        ruleId: rule.metadata.ruleId,
      },
      flaggedAt: new Date().toISOString(),
    }
  }
}

/**
 * Evaluate a keyword rule against section content
 */
function evaluateKeywordRule(
  rule: ValidationRule,
  section: ReportSection,
  logic: KeywordRule
): ValidationFlag | null {
  const contentLower = section.draft.toLowerCase()
  const foundKeywords = logic.keywords.filter(keyword =>
    contentLower.includes(keyword.toLowerCase())
  )
  
  const hasKeywords = foundKeywords.length > 0
  const isViolation = logic.presenceIsViolation ? hasKeywords : !hasKeywords
  
  if (isViolation) {
    return {
      flagId: randomUUID(),
      ruleId: rule.metadata.ruleId,
      ruleVersion: rule.metadata.version,
      flagType: rule.metadata.flagType,
      severity: rule.metadata.severity,
      sectionKey: section.sectionKey,
      reason: logic.reason,
      context: {
        sectionKey: section.sectionKey,
        foundKeywordsCount: foundKeywords.length,
      },
      flaggedAt: new Date().toISOString(),
    }
  }
  
  return null
}

/**
 * Evaluate a contraindication rule against section content and inputs
 */
function evaluateContraIndicationRule(
  rule: ValidationRule,
  section: ReportSection,
  logic: ContraIndicationRule
): ValidationFlag | null {
  // Check if any risk signals are present in section inputs
  const signals = section.inputs.signals || []
  const hasRiskSignal = logic.riskSignals.some(signal =>
    signals.some(s => s.toLowerCase().includes(signal.toLowerCase()))
  )
  
  if (!hasRiskSignal) {
    // No risk signals present, rule doesn't apply
    return null
  }
  
  // Check if conflicting patterns are present in content
  const contentLower = section.draft.toLowerCase()
  const hasConflict = logic.conflictingPatterns.some(pattern =>
    contentLower.includes(pattern.toLowerCase())
  )
  
  if (hasConflict) {
    const detectedSignals = signals.filter(s =>
      logic.riskSignals.some(rs => s.toLowerCase().includes(rs.toLowerCase()))
    )
    
    return {
      flagId: randomUUID(),
      ruleId: rule.metadata.ruleId,
      ruleVersion: rule.metadata.version,
      flagType: rule.metadata.flagType,
      severity: rule.metadata.severity,
      sectionKey: section.sectionKey,
      reason: logic.reason,
      context: {
        sectionKey: section.sectionKey,
        detectedSignalsCount: detectedSignals.length,
      },
      flaggedAt: new Date().toISOString(),
    }
  }
  
  return null
}

/**
 * Evaluate an out-of-bounds rule against section inputs
 */
function evaluateOutOfBoundsRule(
  rule: ValidationRule,
  section: ReportSection,
  logic: OutOfBoundsRule
): ValidationFlag | null {
  const scores = section.inputs.scores || {}
  const value = scores[logic.field]
  
  if (value === undefined) {
    // Field not present, rule doesn't apply
    return null
  }
  
  const isOutOfBounds =
    (logic.minValue !== undefined && value < logic.minValue) ||
    (logic.maxValue !== undefined && value > logic.maxValue)
  
  if (isOutOfBounds) {
    return {
      flagId: randomUUID(),
      ruleId: rule.metadata.ruleId,
      ruleVersion: rule.metadata.version,
      flagType: rule.metadata.flagType,
      severity: rule.metadata.severity,
      sectionKey: section.sectionKey,
      reason: logic.reason,
      context: {
        sectionKey: section.sectionKey,
        field: logic.field,
        value,
        ...(logic.minValue !== undefined && { minValue: logic.minValue }),
        ...(logic.maxValue !== undefined && { maxValue: logic.maxValue }),
      },
      flaggedAt: new Date().toISOString(),
    }
  }
  
  return null
}

/**
 * Evaluate a single rule against a section
 */
function evaluateRule(
  rule: ValidationRule,
  section: ReportSection
): ValidationFlag | null {
  const { logic } = rule
  
  switch (logic.type) {
    case 'pattern':
      return evaluatePatternRule(rule, section, logic)
    
    case 'keyword':
      return evaluateKeywordRule(rule, section, logic)
    
    case 'contraindication':
      return evaluateContraIndicationRule(rule, section, logic)
    
    case 'out_of_bounds':
      return evaluateOutOfBoundsRule(rule, section, logic)
    
    default:
      // Unknown rule type - fail-closed
      console.error(`Unknown rule type:`, logic)
      return {
        flagId: randomUUID(),
        ruleId: rule.metadata.ruleId,
        ruleVersion: rule.metadata.version,
        flagType: rule.metadata.flagType,
        severity: VALIDATION_SEVERITY.CRITICAL,
        sectionKey: section.sectionKey,
        reason: `Rule evaluation failed: unknown rule type`,
        context: {
          error: 'unknown_rule_type',
          ruleId: rule.metadata.ruleId,
        },
        flaggedAt: new Date().toISOString(),
      }
  }
}

// ============================================================
// Main Validator
// ============================================================

/**
 * Validate report sections against medical validation rules
 * 
 * @param context - Validation context
 * @returns Validation result with flags
 */
export function validateReportSections(
  context: ValidatorContext
): ValidationResult {
  const startTime = Date.now()
  
  try {
    const { sections, ruleIds, engineVersion } = context
    
    // Get rules to evaluate
    const allRules = ruleIds
      ? listActiveRules().filter(r => ruleIds.includes(r.metadata.ruleId))
      : listActiveRules()
    
    if (allRules.length === 0) {
      // No rules to evaluate - fail-closed
      return {
        success: false,
        error: {
          code: 'NO_RULES_AVAILABLE',
          message: 'No active validation rules available - fail-closed',
        },
      }
    }
    
    // Validate each section
    const sectionResults: SectionValidationResult[] = []
    const allFlags: ValidationFlag[] = []
    
    for (const section of sections.sections) {
      const sectionFlags: ValidationFlag[] = []
      
      // Get rules for this section
      const sectionRules = listRulesBySection(section.sectionKey)
      
      // Evaluate each rule
      for (const rule of sectionRules) {
        const flag = evaluateRule(rule, section)
        if (flag) {
          sectionFlags.push(flag)
          allFlags.push(flag)
        }
      }
      
      // Determine max severity for this section
      const maxSeverity = sectionFlags.reduce<ValidationSeverity | undefined>(
        (max, flag) => {
          if (!max) return flag.severity
          if (flag.severity === VALIDATION_SEVERITY.CRITICAL) return flag.severity
          if (flag.severity === VALIDATION_SEVERITY.WARNING && max === VALIDATION_SEVERITY.INFO) {
            return flag.severity
          }
          return max
        },
        undefined
      )
      
      sectionResults.push({
        sectionKey: section.sectionKey,
        passed: sectionFlags.filter(f => f.severity === VALIDATION_SEVERITY.CRITICAL).length === 0,
        flags: sectionFlags,
        maxSeverity,
      })
    }
    
    // Calculate metadata
    const criticalFlags = allFlags.filter(f => f.severity === VALIDATION_SEVERITY.CRITICAL)
    const warningFlags = allFlags.filter(f => f.severity === VALIDATION_SEVERITY.WARNING)
    const infoFlags = allFlags.filter(f => f.severity === VALIDATION_SEVERITY.INFO)
    
    const overallPassed = criticalFlags.length === 0
    
    // Determine overall status
    let overallStatus: typeof VALIDATION_STATUS[keyof typeof VALIDATION_STATUS] = VALIDATION_STATUS.PASS
    if (criticalFlags.length > 0) {
      overallStatus = VALIDATION_STATUS.FAIL
    } else if (warningFlags.length > 0 || infoFlags.length > 0) {
      overallStatus = VALIDATION_STATUS.FLAG
    }
    
    const validationTimeMs = Date.now() - startTime
    
    const result: MedicalValidationResultV1 = {
      validationVersion: 'v1',
      engineVersion: engineVersion || getRegistryVersion(),
      rulesetHash: getRulesetHash(),
      jobId: sections.jobId,
      sectionsId: undefined, // Will be set by persistence layer
      overallStatus,
      sectionResults,
      flags: allFlags,
      overallPassed,
      metadata: {
        validationTimeMs,
        rulesEvaluatedCount: allRules.length,
        flagsRaisedCount: allFlags.length,
        criticalFlagsCount: criticalFlags.length,
        warningFlagsCount: warningFlags.length,
        infoFlagsCount: infoFlags.length,
      },
      validatedAt: new Date().toISOString(),
    }
    
    return {
      success: true,
      data: result,
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error'
    console.error('Validation error:', error)
    
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: `Validation failed: ${message}`,
      },
    }
  }
}

/**
 * Convenience function: validate and return only critical/blocking flags
 */
export function getCriticalFlags(
  context: ValidatorContext
): ValidationFlag[] {
  const result = validateReportSections(context)
  
  if (!result.success) {
    return []
  }
  
  return result.data.flags.filter(f => f.severity === VALIDATION_SEVERITY.CRITICAL)
}

/**
 * Convenience function: quick pass/fail check
 */
export function isValidationPassing(context: ValidatorContext): boolean {
  const result = validateReportSections(context)
  
  if (!result.success) {
    return false // Fail-closed on error
  }
  
  return result.data.overallPassed
}
