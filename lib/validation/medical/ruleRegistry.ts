/**
 * Medical Validation Rule Registry - V05-I05.5
 * 
 * Versioned, immutable validation rules for Medical Validation Layer 1.
 * Each rule has a unique ID, version, and deterministic evaluation logic.
 * 
 * Storage: File-based registry (follows repo patterns)
 * Versioning: Immutable - new versions create new entries
 * 
 * @module lib/validation/medical/ruleRegistry
 */

import {
  VALIDATION_SEVERITY,
  VALIDATION_FLAG_TYPE,
  type ValidationSeverity,
  type ValidationFlagType,
} from '@/lib/contracts/medicalValidation'

// ============================================================
// Rule Metadata
// ============================================================

export interface RuleMetadata {
  /** Unique rule ID */
  ruleId: string
  
  /** Version (semver) */
  version: string
  
  /** Human-readable description */
  description: string
  
  /** Rule type */
  flagType: ValidationFlagType
  
  /** Severity level */
  severity: ValidationSeverity
  
  /** Section key this rule applies to (or 'all' for global) */
  sectionKey: string | 'all'
  
  /** Creation timestamp (ISO 8601) */
  createdAt: string
  
  /** Immutability flag - always true for registry entries */
  immutable: true
  
  /** Active flag - can be disabled without deletion */
  isActive: boolean
}

// ============================================================
// Rule Logic Types
// ============================================================

/**
 * Pattern-based rule - checks for specific patterns in content
 */
export interface PatternRule {
  type: 'pattern'
  
  /** Regular expression pattern to match */
  pattern: string
  
  /** Whether match indicates a violation (true) or compliance (false) */
  matchIsViolation: boolean
  
  /** Human-readable reason when violated */
  reason: string
}

/**
 * Keyword-based rule - checks for presence of keywords
 */
export interface KeywordRule {
  type: 'keyword'
  
  /** Keywords to search for (case-insensitive) */
  keywords: string[]
  
  /** Whether presence indicates violation (true) or compliance (false) */
  presenceIsViolation: boolean
  
  /** Human-readable reason when violated */
  reason: string
}

/**
 * Contraindication rule - checks for conflicts between sections
 */
export interface ContraIndicationRule {
  type: 'contraindication'
  
  /** Risk signals to check for */
  riskSignals: string[]
  
  /** Recommendation patterns that conflict with these signals */
  conflictingPatterns: string[]
  
  /** Human-readable reason when violated */
  reason: string
}

/**
 * Out-of-bounds rule - checks for numeric values outside acceptable ranges
 */
export interface OutOfBoundsRule {
  type: 'out_of_bounds'
  
  /** Field to check in section inputs */
  field: string
  
  /** Minimum acceptable value (inclusive) */
  minValue?: number
  
  /** Maximum acceptable value (inclusive) */
  maxValue?: number
  
  /** Human-readable reason when violated */
  reason: string
}

/**
 * All rule logic types
 */
export type RuleLogic = PatternRule | KeywordRule | ContraIndicationRule | OutOfBoundsRule

// ============================================================
// Validation Rule
// ============================================================

export interface ValidationRule {
  /** Metadata */
  metadata: RuleMetadata
  
  /** Rule evaluation logic */
  logic: RuleLogic
}

// ============================================================
// Rule Registry
// ============================================================

/**
 * Versioned validation rule registry
 * All rules are immutable once created
 */
export const VALIDATION_RULE_REGISTRY: Record<string, ValidationRule> = {
  // ============================================================
  // Contraindication Rules
  // ============================================================
  
  'contraindication-high-stress-vigorous-exercise-v1.0.0': {
    metadata: {
      ruleId: 'contraindication-high-stress-vigorous-exercise',
      version: 'v1.0.0',
      description: 'Flag vigorous exercise recommendations for patients with critical stress levels',
      flagType: VALIDATION_FLAG_TYPE.CONTRAINDICATION,
      severity: VALIDATION_SEVERITY.WARNING,
      sectionKey: 'recommendations',
      createdAt: '2026-01-04T06:00:00.000Z',
      immutable: true,
      isActive: true,
    },
    logic: {
      type: 'contraindication',
      riskSignals: ['critical', 'high_stress', 'stress_critical'],
      conflictingPatterns: [
        'vigorous exercise',
        'intensive training',
        'high-intensity',
        'HIIT',
      ],
      reason: 'Vigorous exercise may not be appropriate for patients with critical stress levels without medical clearance',
    },
  },
  
  'contraindication-sleep-deprivation-stimulants-v1.0.0': {
    metadata: {
      ruleId: 'contraindication-sleep-deprivation-stimulants',
      version: 'v1.0.0',
      description: 'Flag recommendations for stimulants when sleep deprivation is present',
      flagType: VALIDATION_FLAG_TYPE.CONTRAINDICATION,
      severity: VALIDATION_SEVERITY.WARNING,
      sectionKey: 'recommendations',
      createdAt: '2026-01-04T06:00:00.000Z',
      immutable: true,
      isActive: true,
    },
    logic: {
      type: 'contraindication',
      riskSignals: ['poor_sleep', 'sleep_deprivation', 'insomnia'],
      conflictingPatterns: [
        'caffeine',
        'energy drinks',
        'stimulant',
        'coffee',
      ],
      reason: 'Stimulant recommendations may worsen sleep issues for patients with sleep deprivation',
    },
  },
  
  // ============================================================
  // Plausibility Rules
  // ============================================================
  
  'plausibility-contradictory-risk-level-v1.0.0': {
    metadata: {
      ruleId: 'plausibility-contradictory-risk-level',
      version: 'v1.0.0',
      description: 'Check for contradictory risk level statements',
      flagType: VALIDATION_FLAG_TYPE.PLAUSIBILITY,
      severity: VALIDATION_SEVERITY.CRITICAL,
      sectionKey: 'all',
      createdAt: '2026-01-04T06:00:00.000Z',
      immutable: true,
      isActive: true,
    },
    logic: {
      type: 'pattern',
      pattern: '\\b(low risk|minimal risk)\\b.*\\b(high risk|critical risk|severe)\\b|\\b(high risk|critical risk)\\b.*\\b(low risk|minimal risk)\\b',
      matchIsViolation: true,
      reason: 'Contradictory risk level statements detected in same section',
    },
  },
  
  'plausibility-unrealistic-score-claims-v1.0.0': {
    metadata: {
      ruleId: 'plausibility-unrealistic-score-claims',
      version: 'v1.0.0',
      description: 'Flag unrealistic score improvement claims',
      flagType: VALIDATION_FLAG_TYPE.PLAUSIBILITY,
      severity: VALIDATION_SEVERITY.CRITICAL,
      sectionKey: 'all',
      createdAt: '2026-01-04T06:00:00.000Z',
      immutable: true,
      isActive: true,
    },
    logic: {
      type: 'pattern',
      pattern: '\\b(100%|guarantee|cure|eliminate|completely resolve)\\b',
      matchIsViolation: true,
      reason: 'Unrealistic or absolute claims detected (guarantee, cure, 100% effectiveness)',
    },
  },
  
  // ============================================================
  // Out-of-Bounds Rules
  // ============================================================
  
  'out-of-bounds-risk-score-v1.0.0': {
    metadata: {
      ruleId: 'out-of-bounds-risk-score',
      version: 'v1.0.0',
      description: 'Check for risk scores outside valid range (0-100)',
      flagType: VALIDATION_FLAG_TYPE.OUT_OF_BOUNDS,
      severity: VALIDATION_SEVERITY.CRITICAL,
      sectionKey: 'all',
      createdAt: '2026-01-04T06:00:00.000Z',
      immutable: true,
      isActive: true,
    },
    logic: {
      type: 'out_of_bounds',
      field: 'riskScore',
      minValue: 0,
      maxValue: 100,
      reason: 'Risk score is outside valid range (0-100)',
    },
  },
  
  // ============================================================
  // Medical Safety Rules
  // ============================================================
  
  'safety-no-diagnosis-claims-v1.0.0': {
    metadata: {
      ruleId: 'safety-no-diagnosis-claims',
      version: 'v1.0.0',
      description: 'Ensure no diagnosis claims are made (informational only)',
      flagType: VALIDATION_FLAG_TYPE.PLAUSIBILITY,
      severity: VALIDATION_SEVERITY.CRITICAL,
      sectionKey: 'all',
      createdAt: '2026-01-04T06:00:00.000Z',
      immutable: true,
      isActive: true,
    },
    logic: {
      type: 'keyword',
      keywords: [
        'you have been diagnosed',
        'you are diagnosed with',
        'diagnosis:',
        'medical diagnosis',
        'clinical diagnosis',
      ],
      presenceIsViolation: true,
      reason: 'Content contains diagnosis claims - this tool provides informational guidance only',
    },
  },
  
  'safety-no-medication-prescription-v1.0.0': {
    metadata: {
      ruleId: 'safety-no-medication-prescription',
      version: 'v1.0.0',
      description: 'Ensure no medication prescriptions are recommended',
      flagType: VALIDATION_FLAG_TYPE.PLAUSIBILITY,
      severity: VALIDATION_SEVERITY.CRITICAL,
      sectionKey: 'recommendations',
      createdAt: '2026-01-04T06:00:00.000Z',
      immutable: true,
      isActive: true,
    },
    logic: {
      type: 'keyword',
      keywords: [
        'prescribe',
        'prescription for',
        'take medication',
        'start taking',
        'dosage of',
      ],
      presenceIsViolation: true,
      reason: 'Content contains medication prescription language - only licensed clinicians can prescribe',
    },
  },
}

// ============================================================
// Registry Access Functions
// ============================================================

/**
 * Get a specific rule by ID and version
 */
export function getRule(ruleId: string, version: string): ValidationRule | null {
  const key = `${ruleId}-${version}`
  return VALIDATION_RULE_REGISTRY[key] || null
}

/**
 * Get the latest version of a rule by ID
 */
export function getLatestRule(ruleId: string): ValidationRule | null {
  const rules = Object.values(VALIDATION_RULE_REGISTRY)
    .filter(rule => rule.metadata.ruleId === ruleId)
    .sort((a, b) => b.metadata.version.localeCompare(a.metadata.version))
  
  return rules[0] || null
}

/**
 * List all rules in registry
 */
export function listRules(): ValidationRule[] {
  return Object.values(VALIDATION_RULE_REGISTRY)
}

/**
 * List all active rules
 */
export function listActiveRules(): ValidationRule[] {
  return Object.values(VALIDATION_RULE_REGISTRY)
    .filter(rule => rule.metadata.isActive)
}

/**
 * List rules by section key
 */
export function listRulesBySection(sectionKey: string): ValidationRule[] {
  return Object.values(VALIDATION_RULE_REGISTRY)
    .filter(rule => 
      rule.metadata.isActive && 
      (rule.metadata.sectionKey === sectionKey || rule.metadata.sectionKey === 'all')
    )
}

/**
 * Check if a rule exists in registry
 */
export function hasRule(ruleId: string, version: string): boolean {
  const key = `${ruleId}-${version}`
  return key in VALIDATION_RULE_REGISTRY
}

/**
 * Get all unique rule IDs
 */
export function listRuleIds(): string[] {
  const ids = new Set<string>()
  Object.values(VALIDATION_RULE_REGISTRY).forEach(rule => {
    ids.add(rule.metadata.ruleId)
  })
  return Array.from(ids)
}

/**
 * Get metadata for a specific rule (without logic)
 */
export function getRuleMetadata(ruleId: string, version: string): RuleMetadata | null {
  const rule = getRule(ruleId, version)
  return rule ? rule.metadata : null
}

/**
 * Get current registry version
 * Based on the most recent rule creation date
 */
export function getRegistryVersion(): string {
  const rules = Object.values(VALIDATION_RULE_REGISTRY)
  if (rules.length === 0) {
    return 'v1.0.0'
  }
  
  // Use latest rule version as registry version
  const latestRule = rules.sort((a, b) => 
    b.metadata.createdAt.localeCompare(a.metadata.createdAt)
  )[0]
  
  return latestRule.metadata.version
}
