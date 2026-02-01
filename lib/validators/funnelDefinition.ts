/**
 * E74.1: Canonical Funnel Definition Schema v1 Validator
 * 
 * Server-side validator with deterministic error codes for funnel definitions.
 * Validates:
 * - JSON schema compliance
 * - Referential integrity (step IDs, question IDs, etc.)
 * - Required fields and constraints
 * - Schema version compatibility
 * 
 * All error codes follow the pattern: DEF_<CATEGORY>_<SPECIFIC_ERROR>
 */

import { z } from 'zod'
import {
  FunnelQuestionnaireConfigSchema,
  FunnelContentManifestSchema,
  type FunnelQuestionnaireConfig,
  type FunnelContentManifest,
} from '@/lib/contracts/funnelManifest'

/**
 * Deterministic error codes for funnel definition validation
 * Format: DEF_<CATEGORY>_<SPECIFIC_ERROR>
 */
export const VALIDATION_ERROR_CODES = {
  // Schema structure errors
  DEF_INVALID_SCHEMA: 'DEF_INVALID_SCHEMA',
  DEF_INVALID_SCHEMA_VERSION: 'DEF_INVALID_SCHEMA_VERSION',
  DEF_MISSING_SCHEMA_VERSION: 'DEF_MISSING_SCHEMA_VERSION',
  
  // Questionnaire config errors
  DEF_MISSING_STEPS: 'DEF_MISSING_STEPS',
  DEF_EMPTY_STEPS: 'DEF_EMPTY_STEPS',
  DEF_MISSING_STEP_TITLE: 'DEF_MISSING_STEP_TITLE',
  DEF_MISSING_STEP_ID: 'DEF_MISSING_STEP_ID',
  DEF_DUPLICATE_STEP_ID: 'DEF_DUPLICATE_STEP_ID',
  DEF_MISSING_QUESTIONS: 'DEF_MISSING_QUESTIONS',
  DEF_EMPTY_QUESTIONS: 'DEF_EMPTY_QUESTIONS',
  DEF_MISSING_QUESTION_ID: 'DEF_MISSING_QUESTION_ID',
  DEF_MISSING_QUESTION_KEY: 'DEF_MISSING_QUESTION_KEY',
  DEF_MISSING_QUESTION_TYPE: 'DEF_MISSING_QUESTION_TYPE',
  DEF_MISSING_QUESTION_LABEL: 'DEF_MISSING_QUESTION_LABEL',
  DEF_DUPLICATE_QUESTION_ID: 'DEF_DUPLICATE_QUESTION_ID',
  DEF_DUPLICATE_QUESTION_KEY: 'DEF_DUPLICATE_QUESTION_KEY',
  DEF_INVALID_QUESTION_TYPE: 'DEF_INVALID_QUESTION_TYPE',
  DEF_MISSING_OPTIONS_FOR_CHOICE: 'DEF_MISSING_OPTIONS_FOR_CHOICE',
  DEF_EMPTY_OPTIONS_FOR_CHOICE: 'DEF_EMPTY_OPTIONS_FOR_CHOICE',
  
  // Conditional logic errors
  DEF_INVALID_CONDITIONAL_REFERENCE: 'DEF_INVALID_CONDITIONAL_REFERENCE',
  DEF_CONDITIONAL_SELF_REFERENCE: 'DEF_CONDITIONAL_SELF_REFERENCE',
  DEF_CONDITIONAL_FORWARD_REFERENCE: 'DEF_CONDITIONAL_FORWARD_REFERENCE',
  
  // Content manifest errors
  DEF_MISSING_PAGES: 'DEF_MISSING_PAGES',
  DEF_EMPTY_PAGES: 'DEF_EMPTY_PAGES',
  DEF_MISSING_PAGE_SLUG: 'DEF_MISSING_PAGE_SLUG',
  DEF_MISSING_PAGE_TITLE: 'DEF_MISSING_PAGE_TITLE',
  DEF_DUPLICATE_PAGE_SLUG: 'DEF_DUPLICATE_PAGE_SLUG',
  DEF_INVALID_PAGE_SLUG: 'DEF_INVALID_PAGE_SLUG',
  DEF_MISSING_SECTIONS: 'DEF_MISSING_SECTIONS',
  DEF_EMPTY_SECTIONS: 'DEF_EMPTY_SECTIONS',
  
  // Asset errors
  DEF_DUPLICATE_ASSET_KEY: 'DEF_DUPLICATE_ASSET_KEY',
  DEF_INVALID_ASSET_URL: 'DEF_INVALID_ASSET_URL',
} as const

export type ValidationErrorCode = typeof VALIDATION_ERROR_CODES[keyof typeof VALIDATION_ERROR_CODES]

/**
 * Validation error with deterministic code
 */
export interface ValidationError {
  code: ValidationErrorCode
  message: string
  path?: string[]
  details?: Record<string, unknown>
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings?: ValidationError[]
}

/**
 * Validates schema version
 */
function validateSchemaVersion(config: unknown): ValidationError[] {
  const errors: ValidationError[] = []
  
  if (typeof config !== 'object' || config === null) {
    return errors
  }
  
  const obj = config as Record<string, unknown>
  
  if (!('schema_version' in obj)) {
    errors.push({
      code: VALIDATION_ERROR_CODES.DEF_MISSING_SCHEMA_VERSION,
      message: 'schema_version field is required',
      path: ['schema_version'],
    })
  } else if (obj.schema_version !== 'v1') {
    errors.push({
      code: VALIDATION_ERROR_CODES.DEF_INVALID_SCHEMA_VERSION,
      message: `Invalid schema_version: expected "v1", got "${obj.schema_version}"`,
      path: ['schema_version'],
      details: { expected: 'v1', actual: obj.schema_version },
    })
  }
  
  return errors
}

/**
 * Validates questionnaire config for referential integrity
 */
function validateQuestionnaireIntegrity(
  config: FunnelQuestionnaireConfig,
): ValidationError[] {
  const errors: ValidationError[] = []
  
  // Check if steps array exists and is not empty
  if (!config.steps) {
    errors.push({
      code: VALIDATION_ERROR_CODES.DEF_MISSING_STEPS,
      message: 'steps array is required',
      path: ['steps'],
    })
    return errors
  }
  
  if (config.steps.length === 0) {
    errors.push({
      code: VALIDATION_ERROR_CODES.DEF_EMPTY_STEPS,
      message: 'steps array must contain at least one step',
      path: ['steps'],
    })
    return errors
  }
  
  // Track unique IDs and keys
  const stepIds = new Set<string>()
  const questionIds = new Set<string>()
  const questionKeys = new Set<string>()
  const questionIdToStepIndex = new Map<string, number>()
  
  // Validate each step
  config.steps.forEach((step, stepIndex) => {
    const stepPath = ['steps', stepIndex.toString()]
    
    // Check step ID
    if (!step.id || step.id.trim() === '') {
      errors.push({
        code: VALIDATION_ERROR_CODES.DEF_MISSING_STEP_ID,
        message: `Step at index ${stepIndex} is missing id`,
        path: [...stepPath, 'id'],
      })
    } else if (stepIds.has(step.id)) {
      errors.push({
        code: VALIDATION_ERROR_CODES.DEF_DUPLICATE_STEP_ID,
        message: `Duplicate step id: "${step.id}"`,
        path: [...stepPath, 'id'],
        details: { stepId: step.id },
      })
    } else {
      stepIds.add(step.id)
    }
    
    // Check step title
    if (!step.title || step.title.trim() === '') {
      errors.push({
        code: VALIDATION_ERROR_CODES.DEF_MISSING_STEP_TITLE,
        message: `Step "${step.id}" is missing title`,
        path: [...stepPath, 'title'],
        details: { stepId: step.id },
      })
    }
    
    // Check questions
    if (!step.questions) {
      errors.push({
        code: VALIDATION_ERROR_CODES.DEF_MISSING_QUESTIONS,
        message: `Step "${step.id}" is missing questions array`,
        path: [...stepPath, 'questions'],
        details: { stepId: step.id },
      })
      return
    }
    
    if (step.questions.length === 0) {
      errors.push({
        code: VALIDATION_ERROR_CODES.DEF_EMPTY_QUESTIONS,
        message: `Step "${step.id}" has empty questions array`,
        path: [...stepPath, 'questions'],
        details: { stepId: step.id },
      })
    }
    
    // Validate each question
    step.questions.forEach((question, qIndex) => {
      const questionPath = [...stepPath, 'questions', qIndex.toString()]
      
      // Check question ID
      if (!question.id || question.id.trim() === '') {
        errors.push({
          code: VALIDATION_ERROR_CODES.DEF_MISSING_QUESTION_ID,
          message: `Question at step "${step.id}", index ${qIndex} is missing id`,
          path: [...questionPath, 'id'],
          details: { stepId: step.id, questionIndex: qIndex },
        })
      } else {
        if (questionIds.has(question.id)) {
          errors.push({
            code: VALIDATION_ERROR_CODES.DEF_DUPLICATE_QUESTION_ID,
            message: `Duplicate question id: "${question.id}"`,
            path: [...questionPath, 'id'],
            details: { questionId: question.id },
          })
        } else {
          questionIds.add(question.id)
          questionIdToStepIndex.set(question.id, stepIndex)
        }
      }
      
      // Check question key
      if (!question.key || question.key.trim() === '') {
        errors.push({
          code: VALIDATION_ERROR_CODES.DEF_MISSING_QUESTION_KEY,
          message: `Question "${question.id}" is missing key`,
          path: [...questionPath, 'key'],
          details: { questionId: question.id },
        })
      } else if (questionKeys.has(question.key)) {
        errors.push({
          code: VALIDATION_ERROR_CODES.DEF_DUPLICATE_QUESTION_KEY,
          message: `Duplicate question key: "${question.key}"`,
          path: [...questionPath, 'key'],
          details: { questionKey: question.key },
        })
      } else {
        questionKeys.add(question.key)
      }
      
      // Check question type
      if (!question.type || question.type.trim() === '') {
        errors.push({
          code: VALIDATION_ERROR_CODES.DEF_MISSING_QUESTION_TYPE,
          message: `Question "${question.id}" is missing type`,
          path: [...questionPath, 'type'],
          details: { questionId: question.id },
        })
      }
      
      // Check question label
      if (!question.label || question.label.trim() === '') {
        errors.push({
          code: VALIDATION_ERROR_CODES.DEF_MISSING_QUESTION_LABEL,
          message: `Question "${question.id}" is missing label`,
          path: [...questionPath, 'label'],
          details: { questionId: question.id },
        })
      }
      
      // Check options for choice-type questions
      if (question.type === 'radio' || question.type === 'checkbox') {
        if (!question.options) {
          errors.push({
            code: VALIDATION_ERROR_CODES.DEF_MISSING_OPTIONS_FOR_CHOICE,
            message: `Question "${question.id}" of type "${question.type}" requires options`,
            path: [...questionPath, 'options'],
            details: { questionId: question.id, questionType: question.type },
          })
        } else if (question.options.length === 0) {
          errors.push({
            code: VALIDATION_ERROR_CODES.DEF_EMPTY_OPTIONS_FOR_CHOICE,
            message: `Question "${question.id}" of type "${question.type}" has empty options array`,
            path: [...questionPath, 'options'],
            details: { questionId: question.id, questionType: question.type },
          })
        }
      }
    })
    
    // Validate conditional logic for step
    if (step.conditionalLogic) {
      step.conditionalLogic.conditions.forEach((condition, condIndex) => {
        const condPath = [...stepPath, 'conditionalLogic', 'conditions', condIndex.toString()]
        
        // Check if referenced question exists
        if (!questionIds.has(condition.questionId)) {
          errors.push({
            code: VALIDATION_ERROR_CODES.DEF_INVALID_CONDITIONAL_REFERENCE,
            message: `Conditional logic references non-existent question: "${condition.questionId}"`,
            path: [...condPath, 'questionId'],
            details: { 
              stepId: step.id, 
              questionId: condition.questionId,
            },
          })
        } else {
          // Check for forward references
          const refStepIndex = questionIdToStepIndex.get(condition.questionId)
          if (refStepIndex !== undefined && refStepIndex > stepIndex) {
            errors.push({
              code: VALIDATION_ERROR_CODES.DEF_CONDITIONAL_FORWARD_REFERENCE,
              message: `Conditional logic in step "${step.id}" references future question: "${condition.questionId}"`,
              path: [...condPath, 'questionId'],
              details: { 
                stepId: step.id, 
                questionId: condition.questionId,
                currentStepIndex: stepIndex,
                referencedStepIndex: refStepIndex,
              },
            })
          }
        }
      })
    }
  })
  
  // Validate global conditional logic
  if (config.conditionalLogic) {
    config.conditionalLogic.forEach((logic, logicIndex) => {
      logic.conditions.forEach((condition, condIndex) => {
        const condPath = ['conditionalLogic', logicIndex.toString(), 'conditions', condIndex.toString()]
        
        if (!questionIds.has(condition.questionId)) {
          errors.push({
            code: VALIDATION_ERROR_CODES.DEF_INVALID_CONDITIONAL_REFERENCE,
            message: `Global conditional logic references non-existent question: "${condition.questionId}"`,
            path: [...condPath, 'questionId'],
            details: { questionId: condition.questionId },
          })
        }
      })
    })
  }
  
  return errors
}

/**
 * Validates content manifest for referential integrity
 */
function validateContentManifestIntegrity(
  manifest: FunnelContentManifest,
): ValidationError[] {
  const errors: ValidationError[] = []
  
  // Check if pages array exists
  if (!manifest.pages) {
    errors.push({
      code: VALIDATION_ERROR_CODES.DEF_MISSING_PAGES,
      message: 'pages array is required',
      path: ['pages'],
    })
    return errors
  }
  
  if (manifest.pages.length === 0) {
    errors.push({
      code: VALIDATION_ERROR_CODES.DEF_EMPTY_PAGES,
      message: 'pages array must contain at least one page',
      path: ['pages'],
    })
  }
  
  const pageSlugs = new Set<string>()
  
  // Validate each page
  manifest.pages.forEach((page, pageIndex) => {
    const pagePath = ['pages', pageIndex.toString()]
    
    // Check page slug
    if (!page.slug || page.slug.trim() === '') {
      errors.push({
        code: VALIDATION_ERROR_CODES.DEF_MISSING_PAGE_SLUG,
        message: `Page at index ${pageIndex} is missing slug`,
        path: [...pagePath, 'slug'],
      })
    } else if (pageSlugs.has(page.slug)) {
      errors.push({
        code: VALIDATION_ERROR_CODES.DEF_DUPLICATE_PAGE_SLUG,
        message: `Duplicate page slug: "${page.slug}"`,
        path: [...pagePath, 'slug'],
        details: { slug: page.slug },
      })
    } else {
      pageSlugs.add(page.slug)
    }
    
    // Check page title
    if (!page.title || page.title.trim() === '') {
      errors.push({
        code: VALIDATION_ERROR_CODES.DEF_MISSING_PAGE_TITLE,
        message: `Page "${page.slug}" is missing title`,
        path: [...pagePath, 'title'],
        details: { slug: page.slug },
      })
    }
    
    // Check sections
    if (!page.sections) {
      errors.push({
        code: VALIDATION_ERROR_CODES.DEF_MISSING_SECTIONS,
        message: `Page "${page.slug}" is missing sections array`,
        path: [...pagePath, 'sections'],
        details: { slug: page.slug },
      })
    } else if (page.sections.length === 0) {
      errors.push({
        code: VALIDATION_ERROR_CODES.DEF_EMPTY_SECTIONS,
        message: `Page "${page.slug}" has empty sections array`,
        path: [...pagePath, 'sections'],
        details: { slug: page.slug },
      })
    }
  })
  
  // Validate assets
  if (manifest.assets) {
    const assetKeys = new Set<string>()
    
    manifest.assets.forEach((asset, assetIndex) => {
      const assetPath = ['assets', assetIndex.toString()]
      
      if (assetKeys.has(asset.key)) {
        errors.push({
          code: VALIDATION_ERROR_CODES.DEF_DUPLICATE_ASSET_KEY,
          message: `Duplicate asset key: "${asset.key}"`,
          path: [...assetPath, 'key'],
          details: { key: asset.key },
        })
      } else {
        assetKeys.add(asset.key)
      }
    })
  }
  
  return errors
}

/**
 * Validates questionnaire config
 */
export function validateQuestionnaireConfig(config: unknown): ValidationResult {
  const errors: ValidationError[] = []
  
  // First, validate schema version
  errors.push(...validateSchemaVersion(config))
  
  // Validate against Zod schema
  const schemaResult = FunnelQuestionnaireConfigSchema.safeParse(config)
  
  if (!schemaResult.success) {
    // Convert Zod errors to our error format
    schemaResult.error.issues.forEach((err) => {
      errors.push({
        code: VALIDATION_ERROR_CODES.DEF_INVALID_SCHEMA,
        message: err.message,
        path: err.path.map(String),
        details: { zodError: err },
      })
    })
    
    return {
      valid: false,
      errors,
    }
  }
  
  // Validate referential integrity
  const integrityErrors = validateQuestionnaireIntegrity(schemaResult.data)
  errors.push(...integrityErrors)
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validates content manifest
 */
export function validateContentManifest(manifest: unknown): ValidationResult {
  const errors: ValidationError[] = []
  
  // First, validate schema version
  errors.push(...validateSchemaVersion(manifest))
  
  // Validate against Zod schema
  const schemaResult = FunnelContentManifestSchema.safeParse(manifest)
  
  if (!schemaResult.success) {
    // Convert Zod errors to our error format
    schemaResult.error.issues.forEach((err) => {
      errors.push({
        code: VALIDATION_ERROR_CODES.DEF_INVALID_SCHEMA,
        message: err.message,
        path: err.path.map(String),
        details: { zodError: err },
      })
    })
    
    return {
      valid: false,
      errors,
    }
  }
  
  // Validate referential integrity
  const integrityErrors = validateContentManifestIntegrity(schemaResult.data)
  errors.push(...integrityErrors)
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Validates complete funnel version (both configs)
 */
export function validateFunnelVersion(data: {
  questionnaire_config: unknown
  content_manifest: unknown
}): ValidationResult {
  const errors: ValidationError[] = []
  
  // Validate questionnaire config
  const questionnaireResult = validateQuestionnaireConfig(data.questionnaire_config)
  errors.push(
    ...questionnaireResult.errors.map((err) => ({
      ...err,
      path: ['questionnaire_config', ...(err.path || [])],
    })),
  )
  
  // Validate content manifest
  const manifestResult = validateContentManifest(data.content_manifest)
  errors.push(
    ...manifestResult.errors.map((err) => ({
      ...err,
      path: ['content_manifest', ...(err.path || [])],
    })),
  )
  
  return {
    valid: errors.length === 0,
    errors,
  }
}

/**
 * Formats validation errors for display
 */
export function formatValidationErrors(errors: ValidationError[]): string {
  return errors
    .map((err) => {
      const pathStr = err.path ? err.path.join('.') : 'root'
      return `[${err.code}] ${pathStr}: ${err.message}`
    })
    .join('\n')
}
