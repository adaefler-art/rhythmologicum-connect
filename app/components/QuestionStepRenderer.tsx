'use client'

import { memo, useCallback } from 'react'
import type { QuestionStepDefinition, QuestionDefinition } from '@/lib/types/funnel'
import type { ValidationError } from './PatientFlowRenderer'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import MobileQuestionScreen from './MobileQuestionScreen'

/**
 * QuestionStepRenderer - Renders a step containing questions
 * 
 * Displays all questions in the step with their answer controls.
 * On mobile (<640px), uses the new adaptive MobileQuestionScreen layout.
 * On desktop, uses the traditional card-based layout.
 */

const SCALE = [
  { value: 0, label: 'Nie' },
  { value: 1, label: 'Selten' },
  { value: 2, label: 'Manchmal' },
  { value: 3, label: 'Oft' },
  { value: 4, label: 'Sehr häufig' },
]

export type QuestionStepRendererProps = {
  step: QuestionStepDefinition
  answers: Record<string, number>
  validationErrors: ValidationError[]
  onAnswerChange: (questionKey: string, value: number) => void
  onNextStep?: () => void
  onPreviousStep?: () => void
  isFirstStep?: boolean
  isLastStep?: boolean
  submitting?: boolean
  totalQuestions?: number
  funnelTitle?: string
}

export default function QuestionStepRenderer({
  step,
  answers,
  validationErrors,
  onAnswerChange,
  onNextStep,
  onPreviousStep,
  isFirstStep,
  isLastStep,
  submitting,
  totalQuestions,
  funnelTitle,
}: QuestionStepRendererProps) {
  const isMobile = useIsMobile()

  // On mobile, use the new adaptive single-question screen
  if (isMobile && step.questions.length === 1) {
    const question = step.questions[0]
    const hasError = validationErrors.some((err) => err.questionId === question.id)
    const errorMsg = hasError ? 'Diese Pflichtfrage muss beantwortet werden' : null

    // Wrap the onChange handler to convert string to number if needed
    const handleMobileChange = (questionKey: string, value: number | string) => {
      // If the value is a string and represents a number, convert it
      const numValue = typeof value === 'string' ? parseFloat(value) : value
      if (!isNaN(numValue)) {
        onAnswerChange(questionKey, numValue)
      }
    }

    return (
      <MobileQuestionScreen
        question={question}
        questionIndex={step.orderIndex}
        totalQuestions={totalQuestions || 1}
        value={answers[question.key]}
        onChange={handleMobileChange}
        onNext={onNextStep}
        onPrevious={onPreviousStep}
        isFirst={isFirstStep}
        isLast={isLastStep}
        isRequired={question.isRequired}
        error={errorMsg}
        isSubmitting={submitting}
        funnelTitle={funnelTitle}
      />
    )
  }

  // Desktop or multi-question step: use traditional card layout
  return (
    <div className="space-y-4">
      {step.questions.map((question, index) => (
        <QuestionCard
          key={question.id}
          index={index + 1}
          question={question}
          value={answers[question.key]}
          onChange={onAnswerChange}
          hasError={validationErrors.some((err) => err.questionId === question.id)}
        />
      ))}
    </div>
  )
}

type QuestionCardProps = {
  index: number
  question: QuestionDefinition
  value?: number
  onChange: (key: string, value: number) => void
  hasError?: boolean
}

const QuestionCard = memo(function QuestionCard({
  index,
  question,
  value,
  onChange,
  hasError,
}: QuestionCardProps) {
  const isAnswered = value !== undefined

  // Memoize the onChange handler for this specific question
  const handleChange = useCallback(
    (val: number) => onChange(question.key, val),
    [onChange, question.key],
  )

  return (
    <div
      id={`question-${question.id}`}
      className={`border-2 rounded-xl p-4 sm:p-5 md:p-6 transition-all ${
        hasError
          ? 'border-red-300 bg-red-50/30'
          : isAnswered
            ? 'border-sky-200 bg-sky-50/30'
            : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-2 sm:gap-3 mb-4">
        <span
          className={`shrink-0 flex items-center justify-center w-7 h-7 sm:w-8 sm:h-8 rounded-full text-xs sm:text-sm font-bold ${
            hasError
              ? 'bg-red-600 text-white'
              : isAnswered
                ? 'bg-sky-600 text-white'
                : 'bg-slate-200 text-slate-600'
          }`}
        >
          {index}
        </span>
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <p className="text-sm sm:text-base md:text-lg font-medium text-slate-900 leading-relaxed pt-0.5 flex-1">
              {question.label}
            </p>
            {!question.isRequired && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 sm:py-1 rounded-md whitespace-nowrap">
                Optional
              </span>
            )}
          </div>
        </div>
      </div>
      {question.helpText && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 sm:p-4 mb-3 sm:mb-4 ml-0 sm:ml-11">
          <p className="text-xs sm:text-sm text-sky-900 leading-relaxed flex items-start gap-2">
            <span className="text-base sm:text-lg shrink-0">💡</span>
            <span>{question.helpText}</span>
          </p>
        </div>
      )}
      {hasError && (
        <p className="text-xs sm:text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3 ml-0 sm:ml-11">
          ⚠️ Diese Pflichtfrage muss beantwortet werden
        </p>
      )}
      {!isAnswered && !hasError && question.isRequired && (
        <p className="text-xs sm:text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 ml-0 sm:ml-11">
          ⚠️ Bitte wählen Sie eine Antwort aus
        </p>
      )}
      <div className="flex flex-wrap gap-2 sm:gap-2.5">
        {SCALE.map((option) => {
          const id = `${question.id}-${option.value}`
          const checked = value === option.value
          return (
            <label
              key={option.value}
              htmlFor={id}
              className={`flex-1 min-w-[70px] sm:min-w-[90px] md:min-w-[100px] flex flex-col items-center justify-center gap-0.5 px-2 py-2.5 sm:px-3 sm:py-3 rounded-lg border-2 cursor-pointer transition-all touch-manipulation ${
                checked
                  ? 'bg-sky-600 text-white border-sky-600 shadow-md scale-105'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-sky-400 hover:bg-sky-50 hover:shadow-sm active:scale-95'
              }`}
              style={{ minHeight: '44px', minWidth: '44px' }}
            >
              <input
                id={id}
                type="radio"
                className="sr-only"
                name={question.id}
                value={option.value}
                checked={checked}
                onChange={() => handleChange(option.value)}
                aria-label={`${option.label} (Wert ${option.value})`}
              />
              <span className="text-lg sm:text-xl md:text-2xl font-bold">{option.value}</span>
              <span className="text-xs sm:text-sm font-medium text-center leading-tight">{option.label}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
})
