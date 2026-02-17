export type ResumeQuestionDescriptor = {
  id: string
  key: string
  stepId: string
  stepIndex: number
}

export function normalizeAnsweredKeys(value: unknown): string[] {
  if (!Array.isArray(value)) return []
  return value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0)
}

export function resolveQuestionCursorFromRuntime(params: {
  questions: ResumeQuestionDescriptor[]
  stepId: string
  stepIndex: number
  answeredQuestionKeysCurrentStep: string[]
}): number {
  const { questions, stepId, stepIndex, answeredQuestionKeysCurrentStep } = params

  if (questions.length === 0) return 0

  const answeredSet = new Set(answeredQuestionKeysCurrentStep)
  const stepQuestionsWithIndex = questions
    .map((question, index) => ({ question, index }))
    .filter(({ question }) => question.stepId === stepId || question.stepIndex === stepIndex)

  if (stepQuestionsWithIndex.length === 0) {
    const fallbackIndex = questions.findIndex((question) => question.stepIndex === stepIndex)
    return fallbackIndex >= 0 ? fallbackIndex : 0
  }

  const firstUnanswered = stepQuestionsWithIndex.find(({ question }) => {
    return !answeredSet.has(question.key) && !answeredSet.has(question.id)
  })

  if (firstUnanswered) {
    return firstUnanswered.index
  }

  return stepQuestionsWithIndex[0].index
}
