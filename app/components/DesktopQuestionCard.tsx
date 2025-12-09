'use client'

import { useState } from 'react'
import type { Question, Funnel } from '@/lib/types/funnel'
import ScaleAnswerButtons from './ScaleAnswerButtons'
import BinaryAnswerButtons from './BinaryAnswerButtons'
import SingleChoiceAnswerButtons from './SingleChoiceAnswerButtons'
import {
  getQuestionOptions,
  getBinaryQuestionConfig,
  hasQuestionOptions,
  isBinaryQuestion,
} from '@/lib/questionOptions'
import { componentTokens, motion, typography } from '@/lib/design-tokens'

export type DesktopQuestionCardProps = {
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
}

/**
 * Desktop Question Card Component
 * 
 * Renders a single question in desktop layout with:
 * - Horizontal layout with question on left, answers on right
 * - Progress tracking
 * - Navigation buttons
 * - Support for multiple question types (scale, binary, single-choice, text)
 */
export default function DesktopQuestionCard({
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
}: DesktopQuestionCardProps) {
  const [isFocused, setIsFocused] = useState(false)
  const isAnswered = value !== undefined && value !== null

  const progressPercent = ((currentQuestionIndex + 1) / totalQuestions) * 100
  
  // Use design tokens for consistent styling
  const cardTokens = componentTokens.desktopQuestionCard
  const navTokens = componentTokens.navigationButton
  const progressTokens = componentTokens.progressBar

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
            onChange={(val) => onChange(question.id, val as number | string)}
            disabled={isLoading}
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
            onChange={(val) => onChange(question.id, val as number | string)}
            disabled={isLoading}
            layout="grid"
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
          onChange={(val) => onChange(question.id, val)}
          disabled={isLoading}
        />
      )
    }

    // Text questions (textarea)
    if (question.question_type === 'text') {
      return (
        <textarea
          value={(value as string) || ''}
          onChange={(e) => onChange(question.id, e.target.value)}
          className="w-full min-h-[120px] border-2 border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none leading-relaxed"
          style={{
            padding: cardTokens.padding,
            borderRadius: cardTokens.borderRadius,
            fontSize: typography.fontSize.base,
            transition: `all ${motion.duration.normal} ${motion.easing.smooth}`,
          }}
          placeholder="Ihre Antwort..."
          disabled={isLoading}
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
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Header */}
      <header 
        className="bg-white border-b border-slate-200 shadow-sm"
        style={{ padding: `${cardTokens.headerPaddingY} ${cardTokens.headerPaddingX}` }}
      >
        <div className="max-w-5xl mx-auto">
          <p className="font-medium uppercase tracking-wide text-sky-600 mb-1" style={{ fontSize: typography.fontSize.xs }}>
            {funnel.subtitle || 'Fragebogen'}
          </p>
          <h1 className="font-semibold text-slate-900 leading-tight" style={{ fontSize: typography.fontSize['2xl'] }}>
            {funnel.title}
          </h1>
        </div>
      </header>

      {/* Progress Bar */}
      <div 
        className="bg-white border-b border-slate-200"
        style={{ padding: `${cardTokens.headerPaddingY} ${cardTokens.headerPaddingX}` }}
      >
        <div className="max-w-5xl mx-auto">
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

      {/* Question Card - Desktop Layout */}
      <main 
        className="flex-1 flex items-start justify-center"
        style={{ padding: `${cardTokens.padding} ${cardTokens.headerPaddingX}` }}
      >
        <div className="w-full max-w-5xl">
          <div
            className={`bg-white border-2 ${
              isFocused ? 'border-sky-400 shadow-xl' : 'border-slate-200'
            } ${isAnswered ? 'border-sky-200 bg-sky-50/30' : ''}`}
            style={{
              borderRadius: cardTokens.borderRadius,
              boxShadow: cardTokens.shadow,
              padding: cardTokens.padding,
              transition: `all ${motion.duration.normal} ${motion.easing.smooth}`,
            }}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
          >
            {/* Question Text Section */}
            <div className="mb-6">
              <div className="flex items-start gap-4 mb-4">
                <span
                  className={`flex-shrink-0 flex items-center justify-center rounded-full font-bold ${
                    isAnswered ? 'bg-sky-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                  style={{
                    width: '2.5rem',
                    height: '2.5rem',
                    fontSize: typography.fontSize.base,
                  }}
                >
                  {currentQuestionIndex + 1}
                </span>
                <h2 className="font-semibold text-slate-900 leading-relaxed pt-1" style={{ fontSize: typography.fontSize['2xl'] }}>
                  {question.label}
                </h2>
              </div>

              {question.help_text && (
                <div 
                  className="bg-sky-50 border border-sky-200 ml-14"
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
                  className="text-amber-700 bg-amber-50 border border-amber-200 mt-4 ml-14"
                  style={{
                    fontSize: typography.fontSize.sm,
                    borderRadius: componentTokens.infoBox.borderRadius,
                    padding: `${componentTokens.infoBox.padding}`,
                  }}
                >
                  ⚠️ Bitte wählen Sie eine Antwort aus
                </p>
              )}
            </div>

            {/* Answer Options Section */}
            <div className="ml-14">
              {renderAnswerSection()}
            </div>

            {/* Error Message */}
            {error && (
              <div 
                className="mt-6 ml-14 text-red-700 bg-red-50 border-2 border-red-200 flex items-start gap-3"
                style={{
                  fontSize: typography.fontSize.sm,
                  borderRadius: cardTokens.borderRadius,
                  padding: `${cardTokens.headerPaddingY} ${cardTokens.headerPaddingX}`,
                }}
              >
                <span className="flex-shrink-0" style={{ fontSize: typography.fontSize.xl }}>❌</span>
                <p className="leading-relaxed">{error}</p>
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="mt-8 ml-14 flex gap-4">
              {!isFirst && onPrevious && (
                <button
                  type="button"
                  onClick={onPrevious}
                  disabled={isLoading}
                  className="bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    padding: `${cardTokens.headerPaddingY} ${navTokens.paddingX}`,
                    borderRadius: navTokens.borderRadius,
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
                  className="flex-1 bg-sky-600 text-white font-semibold hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed"
                  style={{
                    padding: `${cardTokens.headerPaddingY} ${navTokens.paddingX}`,
                    borderRadius: navTokens.borderRadius,
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
          </div>
        </div>
      </main>
    </div>
  )
}
