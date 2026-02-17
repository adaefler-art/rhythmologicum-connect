import {
  normalizeAnsweredKeys,
  resolveQuestionCursorFromRuntime,
  type ResumeQuestionDescriptor,
} from '@/lib/funnels/runtimeResume'

describe('runtimeResume', () => {
  const questions: ResumeQuestionDescriptor[] = [
    { id: 'q1-id', key: 'q1-key', stepId: 'step-1', stepIndex: 0 },
    { id: 'q2-id', key: 'q2-key', stepId: 'step-1', stepIndex: 0 },
    { id: 'q3-id', key: 'q3-key', stepId: 'step-2', stepIndex: 1 },
  ]

  it('normalizes answered key arrays', () => {
    expect(normalizeAnsweredKeys([' q1-key ', '', 42, null])).toEqual(['q1-key'])
    expect(normalizeAnsweredKeys(undefined)).toEqual([])
  })

  it('resumes at first unanswered question in current step', () => {
    const cursor = resolveQuestionCursorFromRuntime({
      questions,
      stepId: 'step-1',
      stepIndex: 0,
      answeredQuestionKeysCurrentStep: ['q1-key'],
    })

    expect(cursor).toBe(1)
  })

  it('falls back to first question in step when all are already answered', () => {
    const cursor = resolveQuestionCursorFromRuntime({
      questions,
      stepId: 'step-1',
      stepIndex: 0,
      answeredQuestionKeysCurrentStep: ['q1-key', 'q2-key'],
    })

    expect(cursor).toBe(0)
  })
})
