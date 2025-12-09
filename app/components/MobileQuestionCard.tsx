'use client'

import { useState } from 'react'
import type { Question, Funnel } from '@/lib/types/funnel'
import ScaleAnswerButtons from './ScaleAnswerButtons'
import BinaryAnswerButtons from './BinaryAnswerButtons'
import SingleChoiceAnswerButtons from './SingleChoiceAnswerButtons'
import SaveIndicator from './SaveIndicator'
import {
  getQuestionOptions,
  getBinaryQuestionConfig,
  hasQuestionOptions,
  isBinaryQuestion,
} from '@/lib/questionOptions'
import { useAssessmentAnswer } from '@/lib/hooks/useAssessmentAnswer'
import { componentTokens, motion, typography } from '@/lib/design-tokens'

export type MobileQuestionCardProps = {
  funnel: Funnel
  question: Question
  currentQuestionIndex: number
  totalQuestions: number
  value?: number | string
  onChange: (questionId: string, value: number | string) => void
  onNext?: () => void
  onPrevious?: () => void
  isFirst?: boolean
  isLast?: boolean
  isRequired?: boolean
  error?: string | null
  isLoading?: boolean
  assessmentId?: string // Optional: Enable save-on-tap if provided
  enableSaveOnTap?: boolean // Optional: Explicitly enable/disable save-on-tap
}

export default function MobileQuestionCard({
  funnel,
  question,
  currentQuestionIndex,
  totalQuestions,
  value,
  onChange,
  onNext,
  onPrevious,
  isFirst = false,
  isLast = false,
  isRequired = true,
  error = null,
  isLoading = false,
  assessmentId,
  enableSaveOnTap = true,
}: MobileQuestionCardProps) {
  const [isFocused, setIsFocused] = useState(false)
  const isAnswered = value !== undefined && value !== null

  // Initialize save-on-tap hook
  const { saveAnswer, saveState, lastError, retry } = useAssessmentAnswer()
  
  // Determine if save-on-tap should be active
  const isSaveOnTapActive = enableSaveOnTap && assessmentId !== undefined

  const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100
  
  // Use design tokens for consistent styling
  const cardTokens = componentTokens.mobileQuestionCard
  const navTokens = componentTokens.navigationButton
  const progressTokens = componentTokens.progressBar

  // Handle answer change with save-on-tap
  const handleAnswerChange = async (questionId: string, newValue: number | string) => {
    // Always call the onChange callback to update local state
    // Note: questionId here is question.id (UUID) for React state management
    onChange(questionId, newValue)

    // If save-on-tap is enabled and we have an assessmentId, save to backend
    if (isSaveOnTapActive && typeof newValue === 'number') {
      await saveAnswer({
        assessmentId: assessmentId!,
        questionId: question.key, // Use question.key (e.g., "stress_frequency") as question_id in DB
        answerValue: newValue,
      })
    }
  }

  // Determine question rendering strategy
  const renderAnswerSection = () => {
    // Binary questions (Yes/No, True/False, etc.)
    if (isBinaryQuestion(question.key)) {
      const config = getBinaryQuestionConfig(question.key)
      if (config) {
        return (
          <BinaryAnswerButtons
            questionId={question.id}
            value={value}
            onChange={(val) => handleAnswerChange(question.id, val as number | string)}
            disabled={isLoading || saveState === 'saving'}
            {...config}
          />
        )
      }
    }

    // Single-choice questions with predefined options
    if (hasQuestionOptions(question.key)) {
      const options = getQuestionOptions(question.key)
      if (options) {
        return (
          <SingleChoiceAnswerButtons
            questionId={question.id}
            options={options}
            value={value as string | number}
            onChange={(val) => handleAnswerChange(question.id, val as number | string)}
            disabled={isLoading || saveState === 'saving'}
            layout={options.length > 4 ? 'grid' : 'vertical'}
          />
        )
      }
    }

    // Scale questions (using min_value and max_value from database)
    if (question.question_type === 'scale') {
      const minValue = question.min_value ?? 0
      const maxValue = question.max_value ?? 4
      
      return (
        <ScaleAnswerButtons
          questionId={question.id}
          minValue={minValue}
          maxValue={maxValue}
          value={value as number}
          onChange={(val) => handleAnswerChange(question.id, val)}
          disabled={isLoading || saveState === 'saving'}
        />
      )
    }

    // Text questions (textarea)
    if (question.question_type === 'text') {
      return (
        <textarea
          value={(value as string) || ''}
          onChange={(e) => handleAnswerChange(question.id, e.target.value)}
          className="w-full min-h-[120px] border-2 border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none leading-relaxed"
          style={{
            padding: cardTokens.padding,
            borderRadius: cardTokens.borderRadius,
            fontSize: typography.fontSize.base,
            transition: `all ${motion.duration.normal} ${motion.easing.smooth}`,
          }}
          placeholder="Ihre Antwort..."
          disabled={isLoading || saveState === 'saving'}
        />
      )
    }

    // Fallback: unsupported question type
    return (
      <div 
        className="text-center bg-amber-50 border border-amber-200"
        style={{
          padding: cardTokens.padding,
          borderRadius: cardTokens.borderRadius,
        }}
      >
        <p className="text-amber-800">
          Dieser Fragetyp wird noch nicht unterstützt: {question.question_type}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex flex-col">
      {/* Header */}
      <header 
        className="bg-white border-b border-slate-200 shadow-sm"
        style={{ padding: `${cardTokens.headerPaddingY} ${cardTokens.headerPaddingX}` }}
      >
        <div className="max-w-2xl mx-auto">
          <p className="font-medium uppercase tracking-wide text-sky-600 mb-1" style={{ fontSize: typography.fontSize.xs }}>
            {funnel.subtitle || 'Fragebogen'}
          </p>
          <h1 className="font-semibold text-slate-900 leading-tight" style={{ fontSize: typography.fontSize.lg }}>
            {funnel.title}
          </h1>
        </div>
      </header>

      {/* Progress Bar */}
      <div 
        className="bg-white border-b border-slate-200"
        style={{ padding: `${cardTokens.headerPaddingY} ${cardTokens.headerPaddingX}` }}
      >
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between text-slate-700 mb-2" style={{ fontSize: typography.fontSize.sm }}>
            <span className="font-medium">
              Frage {currentQuestionIndex + 1} von {totalQuestions}
            </span>
            <span className="text-slate-500" style={{ fontSize: typography.fontSize.xs }}>{Math.round(progressPercent)}%</span>
          </div>
          <div 
            className="w-full bg-slate-200 overflow-hidden"
            style={{ 
              height: progressTokens.height,
              borderRadius: progressTokens.borderRadius,
            }}
          >
            <div
              className="bg-sky-500"
              style={{ 
                width: `${progressPercent}%`,
                height: progressTokens.height,
                borderRadius: progressTokens.borderRadius,
                transition: progressTokens.transition,
              }}
            />
          </div>
        </div>
      </div>

      {/* Question Card - Scrollable Content */}
      <main 
        className="flex-1 overflow-y-auto"
        style={{ padding: `${cardTokens.contentPaddingY} ${cardTokens.contentPaddingX}` }}
      >
        <div className="max-w-2xl mx-auto">
          <div
            className={`bg-white border-2 ${
              isFocused ? 'border-sky-400 shadow-xl' : 'border-slate-200'
            } ${isAnswered ? 'border-sky-200 bg-sky-50/30' : ''}`}
            style={{
              borderRadius: cardTokens.borderRadius,
              boxShadow: cardTokens.shadow,
              transition: `all ${motion.duration.normal} ${motion.easing.smooth}`,
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          >
            {/* Question Text */}
            <div style={{ padding: `${cardTokens.contentPaddingY} ${cardTokens.contentPaddingX}`, paddingBottom: cardTokens.headerPaddingY }}>
              <h2 className="font-semibold text-slate-900 leading-relaxed mb-3" style={{ fontSize: typography.fontSize.xl }}>
                {question.label}
              </h2>
              {question.help_text && (
                <div 
                  className="bg-sky-50 border border-sky-200 mb-4"
                  style={{ 
                    borderRadius: componentTokens.infoBox.borderRadius,
                    padding: componentTokens.infoBox.padding,
                  }}
                >
                  <p 
                    className="text-sky-900 leading-relaxed flex items-start gap-2"
                    style={{ 
                      fontSize: componentTokens.infoBox.fontSize,
                      lineHeight: componentTokens.infoBox.lineHeight,
                    }}
                  >
                    <span className="flex-shrink-0" style={{ fontSize: typography.fontSize.lg }}>💡</span>
                    <span>{question.help_text}</span>
                  </p>
                </div>
              )}
              {isRequired && !isAnswered && (
                <p 
                  className="text-amber-700 bg-amber-50 border border-amber-200 mb-3"
                  style={{
                    fontSize: typography.fontSize.xs,
                    borderRadius: componentTokens.infoBox.borderRadius,
                    padding: `${typography.fontSize.xs} ${cardTokens.headerPaddingX}`,
                  }}
                >
                  ⚠️ Bitte wählen Sie eine Antwort aus
                </p>
              )}
            </div>

            {/* Answer Options */}
            <div style={{ padding: `0 ${cardTokens.contentPaddingX} ${cardTokens.contentPaddingY}` }}>
              {renderAnswerSection()}
              
              {/* Save Indicator - Only shown when save-on-tap is active */}
              {isSaveOnTapActive && (
                <div className="mt-3">
                  <SaveIndicator 
                    saveState={saveState} 
                    error={lastError} 
                    onRetry={retry} 
                  />
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div 
                className="text-red-700 bg-red-50 border-2 border-red-200 flex items-start gap-3"
                style={{
                  margin: `0 ${cardTokens.contentPaddingX} ${cardTokens.contentPaddingY}`,
                  fontSize: typography.fontSize.sm,
                  borderRadius: cardTokens.borderRadius,
                  padding: `${cardTokens.headerPaddingY} ${cardTokens.headerPaddingX}`,
                }}
              >
                <span className="flex-shrink-0" style={{ fontSize: typography.fontSize.xl }}>❌</span>
                <p className="leading-relaxed">{error}</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Navigation Footer */}
      <footer 
        className="bg-white border-t border-slate-200 shadow-lg"
        style={{ padding: cardTokens.headerPaddingY + ' ' + cardTokens.headerPaddingX }}
      >
        <div className="max-w-2xl mx-auto flex gap-3">
          {!isFirst && onPrevious && (
            <button
              type="button"
              onClick={onPrevious}
              disabled={isLoading}
              className="bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              style={{
                padding: `${navTokens.paddingY} ${navTokens.paddingX}`,
                borderRadius: navTokens.borderRadius,
                minHeight: navTokens.minHeight,
                transition: navTokens.transition,
              }}
            >
              ← Zurück
            </button>
          )}
          {onNext && (
            <button
              type="button"
              onClick={onNext}
              disabled={!isAnswered || isLoading}
              className="flex-1 bg-sky-600 text-white font-semibold hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
              style={{
                padding: `${navTokens.paddingY} ${navTokens.paddingX}`,
                borderRadius: navTokens.borderRadius,
                minHeight: navTokens.minHeight,
                boxShadow: navTokens.shadow,
                transition: navTokens.transition,
              }}
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Bitte warten...
                </span>
              ) : (
                <>{isLast ? '✓ Abschließen' : 'Weiter →'}</>
              )}
            </button>
          )}
        </div>
      </footer>
    </div>
  )
}
