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
