// Funnel type definitions based on database schema

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
  status: 'in_progress' | 'completed'
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

// Other step types
export interface OtherStepDefinition extends BaseStepDefinition {
  type: 'summary' | 'other'
}

// Union type for all step types
export type StepDefinition = QuestionStepDefinition | InfoStepDefinition | OtherStepDefinition

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
  return step.type === 'question_step' || step.type === 'form'
}

export function isInfoStep(step: StepDefinition): step is InfoStepDefinition {
  return step.type === 'info_step' || step.type === 'info'
}
