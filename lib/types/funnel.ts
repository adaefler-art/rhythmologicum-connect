// Funnel type definitions based on database schema

import { NODE_TYPE, type NodeType, type AssessmentStatus } from '@/lib/contracts/registry'

// ============================================================
// Node Type Constants
// ============================================================

/**
 * Node/Step type constants for the funnel engine.
 * These correspond to the 'type' field in the funnel_steps table.
 * 
 * Usage:
 * ```typescript
 * import { NODE_TYPE, isContentPageStep } from '@/lib/types/funnel'
 * 
 * // Check step type using constants
 * if (step.type === NODE_TYPE.CONTENT_PAGE) {
 *   // Handle content page step
 * }
 * 
 * // Or use type guard functions
 * if (isContentPageStep(step)) {
 *   // TypeScript knows step is ContentPageStepDefinition
 *   console.log(step.contentPageId)
 * }
 * ```
 */

// Re-export NODE_TYPE and NodeType from registry
export { NODE_TYPE, type NodeType }

// ============================================================
// Base Database Types
// ============================================================

export type Funnel = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  is_active: boolean
  default_theme: string | null
  created_at: string
  updated_at: string
}

export type FunnelStep = {
  id: string
  funnel_id: string
  order_index: number
  title: string
  description: string | null
  type: string
  created_at: string
  updated_at: string
}

export type Question = {
  id: string
  key: string
  label: string
  help_text: string | null
  question_type: string
  min_value: number | null
  max_value: number | null
  created_at: string
  updated_at: string
}

export type FunnelStepQuestion = {
  id: string
  funnel_step_id: string
  question_id: string
  order_index: number
  is_required: boolean
  created_at: string
  updated_at: string
}

export type Assessment = {
  id: string
  patient_id: string
  funnel: string
  funnel_id: string | null
  started_at: string
  completed_at: string | null
  status: AssessmentStatus
}

// Extended types with joined data
export type QuestionWithDetails = Question & {
  funnel_step_questions: FunnelStepQuestion[]
}

export type FunnelStepWithQuestions = FunnelStep & {
  questions: QuestionWithDetails[]
}

export type FunnelWithSteps = Funnel & {
  funnel_steps: FunnelStepWithQuestions[]
}

// For active question determination
export type ActiveQuestion = {
  question: Question
  stepIndex: number
  questionIndex: number
  totalSteps: number
  totalQuestions: number
  funnelStepQuestion: FunnelStepQuestion
}

// ============================================================
// B1: Structured Funnel Definition Types
// ============================================================

// Question with metadata for UI rendering
export type QuestionDefinition = {
  id: string
  key: string
  label: string
  helpText: string | null
  questionType: string
  minValue: number | null
  maxValue: number | null
  isRequired: boolean
  orderIndex: number
}

// Base step interface
export interface BaseStepDefinition {
  id: string
  orderIndex: number
  title: string
  description: string | null
  type: string
}

// Question step with questions
export interface QuestionStepDefinition extends BaseStepDefinition {
  type: 'question_step' | 'form'
  questions: QuestionDefinition[]
}

// Info step (no questions, just content)
export interface InfoStepDefinition extends BaseStepDefinition {
  type: 'info_step' | 'info'
  content?: string
}

// Content page step (references a content page)
export interface ContentPageStepDefinition extends BaseStepDefinition {
  type: 'content_page'
  contentPageId: string
  contentPage?: {
    id: string
    slug: string
    title: string
    excerpt: string | null
    body_markdown: string
    status: string
  }
}

// Other step types
export interface OtherStepDefinition extends BaseStepDefinition {
  type: 'summary' | 'other'
}

// Union type for all step types
export type StepDefinition = QuestionStepDefinition | InfoStepDefinition | ContentPageStepDefinition | OtherStepDefinition

// Complete funnel definition for UI consumption
export type FunnelDefinition = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  theme: string | null
  steps: StepDefinition[]
  totalSteps: number
  totalQuestions: number
  isActive: boolean
}

// Helper type guard functions
export function isQuestionStep(step: StepDefinition): step is QuestionStepDefinition {
  return step.type === NODE_TYPE.QUESTION_STEP || step.type === NODE_TYPE.FORM
}

export function isInfoStep(step: StepDefinition): step is InfoStepDefinition {
  return step.type === NODE_TYPE.INFO_STEP || step.type === NODE_TYPE.INFO
}

export function isContentPageStep(step: StepDefinition): step is ContentPageStepDefinition {
  return step.type === NODE_TYPE.CONTENT_PAGE
}
