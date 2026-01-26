'use client'

import React, { useState } from 'react'
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

// ==========================================
// TYPES
// ==========================================

interface QuestionOption {
  id: string
  label: string
  icon?: string
  description?: string
}

interface Question {
  id: string
  title: string
  subtitle?: string
  options: QuestionOption[]
  whyWeAsk: string
}

// ==========================================
// DEMO DATA - CLEARLY LABELED AS FIXTURE
// ==========================================

const __DEV_FIXTURE__QUESTIONS: Question[] = [
  {
    id: 'energy-level',
    title: 'How would you rate your energy level today?',
    subtitle: 'Select the option that best describes your current state',
    options: [
      {
        id: 'excellent',
        label: 'Excellent',
        icon: '💚',
        description: 'I feel energized and ready to take on the day',
      },
      {
        id: 'good',
        label: 'Good',
        icon: '💙',
        description: 'I have good energy, maybe a little tired',
      },
      {
        id: 'fair',
        label: 'Fair',
        icon: '💛',
        description: 'My energy is okay, but I could use a boost',
      },
      {
        id: 'poor',
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
    title: 'How many hours did you sleep last night?',
    subtitle: 'Think about your actual sleep time, not time in bed',
    options: [
      {
        id: 'less-than-4',
        label: 'Less than 4 hours',
        description: 'Very little sleep',
      },
      {
        id: '4-6',
        label: '4-6 hours',
        description: 'Below recommended amount',
      },
      {
        id: '6-8',
        label: '6-8 hours',
        description: 'Recommended sleep duration',
      },
      {
        id: 'more-than-8',
        label: 'More than 8 hours',
        description: 'Extended sleep period',
      },
    ],
    whyWeAsk:
      'Sleep duration affects your recovery, cognitive function, and overall health. Understanding your sleep patterns helps us provide better support.',
  },
  {
    id: 'stress-level',
    title: 'How stressed do you feel right now?',
    subtitle: 'Be honest - there are no wrong answers',
    options: [
      {
        id: 'not-at-all',
        label: 'Not at all',
        description: 'I feel calm and relaxed',
      },
      {
        id: 'slightly',
        label: 'Slightly',
        description: 'A little stress, but manageable',
      },
      {
        id: 'moderately',
        label: 'Moderately',
        description: 'Noticeable stress affecting my day',
      },
      {
        id: 'very-stressed',
        label: 'Very stressed',
        description: 'High stress levels, hard to cope',
      },
      {
        id: 'extremely-stressed',
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
  initialLoading?: boolean
  hasError?: boolean
  mode?: 'demo' | 'live'
  questions?: Question[]
}

// ==========================================
// CUSTOM RADIO OPTION COMPONENT
// ==========================================

interface RadioOptionProps {
  option: QuestionOption
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
  initialLoading = false,
  hasError = false,
  mode = 'live',
  questions,
}: AssessmentFlowV2ClientProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(initialLoading)
  const [error, setError] = useState(hasError)
  const [currentStep, setCurrentStep] = useState(1)
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const resolvedQuestions = mode === 'demo' ? __DEV_FIXTURE__QUESTIONS : questions ?? []
  const totalSteps = resolvedQuestions.length
  const currentQuestion = resolvedQuestions[currentStep - 1]
  const progressPercentage = totalSteps > 0
    ? Math.round((currentStep / totalSteps) * 100)
    : 0
  const selectedAnswer = answers[currentQuestion?.id]
  
  // I2.5: Use canonical navigation utility for deterministic exit
  const exitRoute = getAssessmentFlowExitRoute(mode)

  // ==========================================
  // EVENT HANDLERS (I2.5 Navigation Consistency)
  // ==========================================

  const handleSelectOption = (optionId: string) => {
    if (!currentQuestion) return
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionId,
    }))
  }

  const handleContinue = () => {
    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1)
    } else {
      // Assessment complete - deterministic exit via canonical route
      router.push(exitRoute)
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
    setIsLoading(true)

    setTimeout(() => {
      setIsLoading(false)
    }, 1000)
  }

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
            message="We couldn't load the assessment questions. Please try again."
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
                  selected={selectedAnswer === option.id}
                  onSelect={() => handleSelectOption(option.id)}
                />
              ))}
            </div>
          </div>
        </Card>

        {/* Why We Ask This - Accordion */}
        <Accordion title="Why we ask this question">{currentQuestion.whyWeAsk}</Accordion>

        {/* Footer - Action Buttons */}
        <div className="flex items-center justify-between gap-4 pt-4">
          <Button variant="ghost" size="lg" onClick={handleSkip}>
            Skip
          </Button>

          <Button
            variant="primary"
            size="lg"
            onClick={handleContinue}
            disabled={!selectedAnswer}
          >
            {currentStep < totalSteps ? 'Continue' : 'Complete'}
          </Button>
        </div>
      </div>
    </div>
  )
}
