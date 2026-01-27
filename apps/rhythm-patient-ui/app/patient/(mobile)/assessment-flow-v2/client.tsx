'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  Button,
  ProgressBar,
  LoadingSkeleton,
  EmptyState,
  ErrorState,
  Chip,
} from '@/lib/ui/mobile-v2'
import { ChevronDown, ChevronUp } from '@/lib/ui/mobile-v2/icons'
import { getAssessmentFlowExitRoute } from '../utils/navigation'
import type { FunnelDefinition, QuestionDefinition, QuestionOption } from '@/lib/types/funnel'
import { isQuestionStep } from '@/lib/types/funnel'

// ==========================================
// TYPES
// ==========================================

interface AssessmentOption {
  id: string
  value: string | number | boolean
  label: string
  icon?: string
  description?: string
}

interface AssessmentQuestion {
  id: string
  key: string
  title: string
  subtitle?: string
  stepId: string
  stepTitle: string
  stepIndex: number
  questionIndex: number
  options: AssessmentOption[]
  whyWeAsk: string
}

// ==========================================
// DEMO DATA - CLEARLY LABELED AS FIXTURE
// ==========================================

const __DEV_FIXTURE__QUESTIONS: AssessmentQuestion[] = [
  {
    id: 'energy-level',
    key: 'energy-level',
    title: 'How would you rate your energy level today?',
    subtitle: 'Select the option that best describes your current state',
    stepId: 'demo-step-1',
    stepTitle: 'Energy',
    stepIndex: 0,
    questionIndex: 0,
    options: [
      {
        id: 'excellent',
        value: 'excellent',
        label: 'Excellent',
        icon: '💚',
        description: 'I feel energized and ready to take on the day',
      },
      {
        id: 'good',
        value: 'good',
        label: 'Good',
        icon: '💙',
        description: 'I have good energy, maybe a little tired',
      },
      {
        id: 'fair',
        value: 'fair',
        label: 'Fair',
        icon: '💛',
        description: 'My energy is okay, but I could use a boost',
      },
      {
        id: 'poor',
        value: 'poor',
        label: 'Poor',
        icon: '❤️',
        description: 'I feel drained and low on energy',
      },
    ],
    whyWeAsk:
      'Energy levels help us understand your daily vitality and identify patterns that may affect your overall health and wellbeing.',
  },
  {
    id: 'sleep-duration',
    key: 'sleep-duration',
    title: 'How many hours did you sleep last night?',
    subtitle: 'Think about your actual sleep time, not time in bed',
    stepId: 'demo-step-2',
    stepTitle: 'Sleep',
    stepIndex: 1,
    questionIndex: 0,
    options: [
      {
        id: 'less-than-4',
        value: 'less-than-4',
        label: 'Less than 4 hours',
        description: 'Very little sleep',
      },
      {
        id: '4-6',
        value: '4-6',
        label: '4-6 hours',
        description: 'Below recommended amount',
      },
      {
        id: '6-8',
        value: '6-8',
        label: '6-8 hours',
        description: 'Recommended sleep duration',
      },
      {
        id: 'more-than-8',
        value: 'more-than-8',
        label: 'More than 8 hours',
        description: 'Extended sleep period',
      },
    ],
    whyWeAsk:
      'Sleep duration affects your recovery, cognitive function, and overall health. Understanding your sleep patterns helps us provide better support.',
  },
  {
    id: 'stress-level',
    key: 'stress-level',
    title: 'How stressed do you feel right now?',
    subtitle: 'Be honest - there are no wrong answers',
    stepId: 'demo-step-3',
    stepTitle: 'Stress',
    stepIndex: 2,
    questionIndex: 0,
    options: [
      {
        id: 'not-at-all',
        value: 'not-at-all',
        label: 'Not at all',
        description: 'I feel calm and relaxed',
      },
      {
        id: 'slightly',
        value: 'slightly',
        label: 'Slightly',
        description: 'A little stress, but manageable',
      },
      {
        id: 'moderately',
        value: 'moderately',
        label: 'Moderately',
        description: 'Noticeable stress affecting my day',
      },
      {
        id: 'very-stressed',
        value: 'very-stressed',
        label: 'Very stressed',
        description: 'High stress levels, hard to cope',
      },
      {
        id: 'extremely-stressed',
        value: 'extremely-stressed',
        label: 'Extremely stressed',
        description: 'Overwhelming stress, need help',
      },
    ],
    whyWeAsk:
      'Understanding your stress levels helps us provide appropriate support and recommend effective coping strategies tailored to your needs.',
  },
]

// ==========================================
// COMPONENT TYPES
// ==========================================

interface AssessmentFlowV2ClientProps {
  slug: string
  initialLoading?: boolean
  hasError?: boolean
  mode?: 'demo' | 'live'
  questions?: AssessmentQuestion[]
}

// ==========================================
// CUSTOM RADIO OPTION COMPONENT
// ==========================================

interface RadioOptionProps {
  option: AssessmentOption
  selected: boolean
  onSelect: () => void
}

function RadioOption({ option, selected, onSelect }: RadioOptionProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`
        w-full text-left p-4 rounded-xl border-2 transition-all duration-200
        ${
          selected
            ? 'border-[#4a90e2] bg-[#eff6ff] shadow-sm'
            : 'border-[#e5e7eb] bg-white hover:border-[#d1d5db] hover:shadow-sm'
        }
      `}
    >
      <div className="flex items-start gap-3">
        {/* Radio Circle */}
        <div className="flex-shrink-0 mt-0.5">
          <div
            className={`
              w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all
              ${selected ? 'border-[#4a90e2] bg-[#4a90e2]' : 'border-[#9ca3af] bg-white'}
            `}
          >
            {selected && <div className="w-2 h-2 rounded-full bg-white" />}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            {option.icon && <span className="text-xl">{option.icon}</span>}
            <span className="font-semibold text-[#1f2937]">{option.label}</span>
          </div>
          {option.description && (
            <p className="text-sm text-[#6b7280] leading-relaxed">{option.description}</p>
          )}
        </div>
      </div>
    </button>
  )
}

// ==========================================
// COLLAPSIBLE ACCORDION COMPONENT
// ==========================================

interface AccordionProps {
  title: string
  children: React.ReactNode
}

function Accordion({ title, children }: AccordionProps) {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="border border-[#e5e7eb] rounded-xl overflow-hidden">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 bg-white hover:bg-[#f9fafb] transition-colors"
      >
        <span className="font-medium text-[#1f2937]">{title}</span>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-[#6b7280]" />
        ) : (
          <ChevronDown className="w-5 h-5 text-[#6b7280]" />
        )}
      </button>
      {isOpen && (
        <div className="p-4 pt-0 bg-white">
          <p className="text-sm text-[#6b7280] leading-relaxed">{children}</p>
        </div>
      )}
    </div>
  )
}

// ==========================================
// MAIN CLIENT COMPONENT
// ==========================================

export default function AssessmentFlowV2Client({
  slug,
  initialLoading = false,
  hasError = false,
  mode = 'live',
  questions,
}: AssessmentFlowV2ClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(initialLoading)
  const [error, setError] = useState(hasError)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [currentStep, setCurrentStep] = useState(1)
  const [answers, setAnswers] = useState<Record<string, string | number | boolean>>({})
  const [assessmentId, setAssessmentId] = useState<string | null>(null)
  const [liveQuestions, setLiveQuestions] = useState<AssessmentQuestion[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationMessage, setValidationMessage] = useState<string | null>(null)

  const resolvedQuestions = mode === 'demo' ? __DEV_FIXTURE__QUESTIONS : questions ?? liveQuestions
  const totalSteps = resolvedQuestions.length
  const currentQuestion = resolvedQuestions[currentStep - 1]
  const progressPercentage = totalSteps > 0
    ? Math.round((currentStep / totalSteps) * 100)
    : 0
  const selectedAnswer = currentQuestion ? answers[currentQuestion.id] : undefined
  
  // I2.5: Use canonical navigation utility for deterministic exit
  const exitRoute = getAssessmentFlowExitRoute(mode)

  // ==========================================
  // EVENT HANDLERS (I2.5 Navigation Consistency)
  // ==========================================

  const handleSelectOption = (option: AssessmentOption) => {
    if (!currentQuestion) return
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: option.value,
    }))
  }

  const handleContinue = async () => {
    if (!currentQuestion || !assessmentId) return
    if (selectedAnswer === undefined || selectedAnswer === null) return

    setIsSubmitting(true)
    setValidationMessage(null)

    try {
      const questionId = resolveQuestionId(currentQuestion)
      const saveResponse = await fetch(
        `/api/funnels/${slug}/assessments/${assessmentId}/answers/save`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            stepId: currentQuestion.stepId,
            questionId,
            answerValue: selectedAnswer,
          }),
        },
      )

      if (!saveResponse.ok) {
        throw new Error('Antwort konnte nicht gespeichert werden.')
      }

      const isLastQuestionInStep = isFinalQuestionInStep(resolvedQuestions, currentStep - 1)
      if (isLastQuestionInStep) {
        const validateResponse = await fetch(
          `/api/funnels/${slug}/assessments/${assessmentId}/steps/${currentQuestion.stepId}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
          },
        )

        if (!validateResponse.ok) {
          throw new Error('Schritt konnte nicht validiert werden.')
        }

        const validationPayload = await validateResponse.json()
        const isValid =
          validationPayload?.data?.isValid ??
          validationPayload?.isValid ??
          validationPayload?.success

        if (!isValid) {
          setValidationMessage('Bitte beantworten Sie alle Pflichtfragen.')
          return
        }
      }

      if (currentStep < totalSteps) {
        setCurrentStep((prev) => prev + 1)
        return
      }

      await fetch(
        `/api/funnels/${slug}/assessments/${assessmentId}/complete`,
        { method: 'POST' },
      )

      await fetch(
        `/api/funnels/${slug}/assessments/${assessmentId}/result`,
        { method: 'GET' },
      )

      router.push(exitRoute)
    } catch (err) {
      setError(true)
      setErrorMessage(err instanceof Error ? err.message : 'Unbekannter Fehler')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSkip = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1)
    } else {
      // Last question skipped - deterministic exit via canonical route
      router.push(exitRoute)
    }
  }

  const handleRetry = () => {
    setError(false)
    setErrorMessage(null)
    setIsLoading(true)
    setAssessmentId(null)
  }

  useEffect(() => {
    if (mode !== 'live') return
    if (!slug) return

    let isMounted = true

    const load = async () => {
      setIsLoading(true)
      setError(false)
      setErrorMessage(null)

      try {
        const definitionResponse = await fetch(`/api/funnels/${slug}/definition`, {
          method: 'GET',
        })

        if (!definitionResponse.ok) {
          throw new Error('Assessment konnte nicht geladen werden.')
        }

        const definition = (await definitionResponse.json()) as FunnelDefinition
        const mappedQuestions = buildQuestionsFromDefinition(definition)

        if (!isMounted) return
        setLiveQuestions(mappedQuestions)

        const startResponse = await fetch(`/api/funnels/${slug}/assessments`, {
          method: 'POST',
        })

        if (!startResponse.ok) {
          throw new Error('Assessment konnte nicht gestartet werden.')
        }

        const startPayload = await startResponse.json()
        const id = startPayload?.data?.assessmentId ?? startPayload?.assessmentId
        if (!id) {
          throw new Error('Assessment konnte nicht gestartet werden.')
        }

        if (!isMounted) return
        setAssessmentId(id)
        setCurrentStep(1)
        setIsLoading(false)
      } catch (err) {
        if (!isMounted) return
        setError(true)
        setErrorMessage(err instanceof Error ? err.message : 'Unbekannter Fehler')
        setIsLoading(false)
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [mode, slug])

  // ==========================================
  // LOADING STATE
  // ==========================================

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] px-4 py-6">
        <div className="w-full space-y-6">
          <div className="flex items-center justify-between mb-6">
            <div className="h-6 bg-[#f3f4f6] rounded animate-pulse w-32" />
            {mode === 'demo' && (
              <Chip variant="neutral" size="sm">
                Demo data
              </Chip>
            )}
          </div>

          <LoadingSkeleton variant="card" count={1} />
          <LoadingSkeleton variant="card" count={3} />
        </div>
      </div>
    )
  }

  // ==========================================
  // ERROR STATE
  // ==========================================

  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] px-4 py-6">
        <div className="w-full">
          <ErrorState
            title="Failed to load assessment"
            message={errorMessage ?? "We couldn't load the assessment questions. Please try again."}
            onRetry={handleRetry}
          />
        </div>
      </div>
    )
  }

  if (resolvedQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] px-4 py-6">
        <EmptyState
          iconVariant="question"
          title="Assessment nicht geladen"
          message="Es liegen noch keine Fragen für dieses Assessment vor. Bitte versuchen Sie es später erneut."
        />
      </div>
    )
  }

  // ==========================================
  // MAIN CONTENT
  // ==========================================

  return (
    <div className="min-h-screen bg-[#f5f7fa] px-4 py-6">
      <div className="w-full space-y-6">
        {/* Header - Step Progress */}
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-semibold text-[#1f2937]">
            Step {currentStep} of {totalSteps}
          </h1>
          {mode === 'demo' && (
            <Chip variant="neutral" size="sm">
              Demo data
            </Chip>
          )}
        </div>

        {/* Progress Bar */}
        <ProgressBar
          value={progressPercentage}
          color="primary"
          showLabel
          label={`${progressPercentage}% complete`}
          size="md"
        />

        {/* Question Card */}
        <Card padding="lg" shadow="md">
          <div className="space-y-4">
            {/* Question Title */}
            <div>
              <h2 className="text-2xl font-bold text-[#1f2937] mb-2">
                {currentQuestion.title}
              </h2>
              {currentQuestion.subtitle && (
                <p className="text-sm text-[#6b7280]">{currentQuestion.subtitle}</p>
              )}
            </div>

            {/* Options List */}
            <div className="space-y-3 pt-2">
              {currentQuestion.options.map((option) => (
                <RadioOption
                  key={option.id}
                  option={option}
                  selected={selectedAnswer === option.value}
                  onSelect={() => handleSelectOption(option)}
                />
              ))}
            </div>
          </div>
        </Card>

        {/* Why We Ask This - Accordion */}
        <Accordion title="Why we ask this question">{currentQuestion.whyWeAsk}</Accordion>

        {validationMessage && (
          <div className="text-sm text-[#b91c1c] bg-[#fee2e2] border border-[#fecaca] rounded-lg px-3 py-2">
            {validationMessage}
          </div>
        )}

        {/* Footer - Action Buttons */}
        <div className="flex items-center justify-between gap-4 pt-4">
          <Button variant="ghost" size="lg" onClick={handleSkip}>
            Skip
          </Button>

          <Button
            variant="primary"
            size="lg"
            onClick={handleContinue}
            disabled={!selectedAnswer || isSubmitting}
          >
            {currentStep < totalSteps ? 'Continue' : 'Complete'}
          </Button>
        </div>
      </div>
    </div>
  )
}

function resolveQuestionId(question: AssessmentQuestion): string {
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (isUuid.test(question.stepId)) {
    return question.key
  }
  return question.id
}

function isFinalQuestionInStep(questions: AssessmentQuestion[], currentIndex: number): boolean {
  const current = questions[currentIndex]
  if (!current) return false
  const next = questions[currentIndex + 1]
  if (!next) return true
  return next.stepId !== current.stepId
}

function buildQuestionsFromDefinition(definition: FunnelDefinition): AssessmentQuestion[] {
  const questions: AssessmentQuestion[] = []

  definition.steps.forEach((step) => {
    if (!isQuestionStep(step)) return
    step.questions.forEach((question, idx) => {
      questions.push({
        id: question.id,
        key: question.key,
        title: question.label,
        subtitle: question.helpText ?? undefined,
        stepId: step.id,
        stepTitle: step.title,
        stepIndex: step.orderIndex,
        questionIndex: idx,
        options: mapQuestionOptions(question),
        whyWeAsk: question.helpText ?? 'Diese Information hilft uns bei der Auswertung.',
      })
    })
  })

  return questions
}

function mapQuestionOptions(question: QuestionDefinition): AssessmentOption[] {
  if (question.options && question.options.length > 0) {
    return question.options.map((option) => ({
      id: String(option.value),
      value: option.value,
      label: option.label,
    }))
  }

  if (typeof question.minValue === 'number' && typeof question.maxValue === 'number') {
    const range = question.maxValue - question.minValue
    const steps = range >= 4 ? 5 : range + 1
    const options: AssessmentOption[] = []
    for (let i = 0; i < steps; i += 1) {
      const value = question.minValue + Math.round((range / (steps - 1)) * i)
      options.push({
        id: String(value),
        value,
        label: String(value),
      })
    }
    return options
  }

  return [
    { id: 'yes', value: true, label: 'Ja' },
    { id: 'no', value: false, label: 'Nein' },
  ]
}
