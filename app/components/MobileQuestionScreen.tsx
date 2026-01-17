'use client'

import { memo, useState } from 'react'
import { motion } from 'framer-motion'
import type { QuestionDefinition } from '@/lib/types/funnel'
import { componentTokens, motion as motionTokens, spacing, typography, colors, shadows } from '@/lib/design-tokens'
import ScaleAnswerButtons from './ScaleAnswerButtons'
import BinaryAnswerButtons from './BinaryAnswerButtons'
import SingleChoiceAnswerButtons from './SingleChoiceAnswerButtons'
import SliderAnswerComponent from './SliderAnswerComponent'
import MobileHeader from './MobileHeader'
import {
  getQuestionOptions,
  getBinaryQuestionConfig,
  hasQuestionOptions,
  isBinaryQuestion,
} from '@/lib/questionOptions'

/**
 * MobileQuestionScreen - Complete mobile-first question screen layout
 * 
 * Implements the new v0.4 adaptive questionnaire design with:
 * - Top Progress Indicator (sticky)
 * - Question Block (scrollable content)
 * - Answer Components (Buttons 1-5, Slider, Boolean, Chips)
 * - Bottom Action Bar (sticky)
 * - Error Handling
 * - Mobile-first autolayout
 * 
 * This is a complete screen component that takes over the entire viewport.
 */

export type MobileQuestionScreenProps = {
  question: QuestionDefinition
  questionIndex: number
  totalQuestions: number
  value?: number | string
  onChange: (questionKey: string, value: number | string) => void
  onNext?: () => void
  onPrevious?: () => void
  isFirst?: boolean
  isLast?: boolean
  isRequired?: boolean
  error?: string | null
  isSubmitting?: boolean
  funnelTitle?: string
  useSlider?: boolean // Optional: Use slider instead of buttons for scale questions
}

const MobileQuestionScreen = memo(function MobileQuestionScreen({
  question,
  questionIndex,
  totalQuestions,
  value,
  onChange,
  onNext,
  onPrevious,
  isFirst = false,
  isLast = false,
  isRequired = true,
  error = null,
  isSubmitting = false,
  funnelTitle = 'Fragebogen',
  useSlider = false,
}: MobileQuestionScreenProps) {
  const [isFocused, setIsFocused] = useState(false)
  const isAnswered = value !== undefined && value !== null

  // Progress calculation
  const progressPercent = totalQuestions > 0 ? (questionIndex / totalQuestions) * 100 : 0

  // Handle answer change
  const handleAnswerChange = (newValue: number | string) => {
    onChange(question.id, newValue)
  }

  // Handle binary answer change (accepts boolean too)
  const handleBinaryAnswerChange = (newValue: number | string | boolean) => {
    onChange(question.id, newValue as number | string)
  }

  // Render answer component based on question type
  const renderAnswerComponent = () => {
    // Binary questions (Yes/No, True/False, etc.)
    if (isBinaryQuestion(question.key)) {
      const config = getBinaryQuestionConfig(question.key)
      if (config) {
        return (
          <BinaryAnswerButtons
            questionId={question.id}
            value={value}
            onChange={handleBinaryAnswerChange}
            disabled={isSubmitting}
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
            onChange={handleAnswerChange}
            disabled={isSubmitting}
            layout={options.length > 4 ? 'grid' : 'vertical'}
          />
        )
      }
    }

    // Scale questions (using minValue and maxValue from database)
    if (question.questionType === 'scale') {
      const minValue = question.minValue ?? 0
      const maxValue = question.maxValue ?? 4

      // Use slider for wider ranges or when explicitly requested
      const shouldUseSlider = useSlider || (maxValue - minValue > 10)

      if (shouldUseSlider) {
        return (
          <SliderAnswerComponent
            questionId={question.id}
            minValue={minValue}
            maxValue={maxValue}
            value={value as number}
            onChange={(val) => handleAnswerChange(val)}
            disabled={isSubmitting}
            showValue={true}
          />
        )
      }

      return (
        <ScaleAnswerButtons
          questionId={question.id}
          minValue={minValue}
          maxValue={maxValue}
          value={value as number}
          onChange={handleAnswerChange}
          disabled={isSubmitting}
        />
      )
    }

    // Text questions (textarea)
    if (question.questionType === 'text') {
      return (
        <textarea
          value={(value as string) || ''}
          onChange={(e) => handleAnswerChange(e.target.value)}
          className="w-full min-h-[120px] border-2 border-slate-300 focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none leading-relaxed bg-white"
          style={{
            padding: componentTokens.mobileQuestionCard.padding,
            borderRadius: componentTokens.answerButton.borderRadius,
            fontSize: typography.fontSize.base,
            transition: `all ${motionTokens.duration.normal} ${motionTokens.easing.smooth}`,
          }}
          placeholder="Ihre Antwort..."
          disabled={isSubmitting}
        />
      )
    }

    // Fallback: unsupported question type
    return (
      <div
        className="text-center bg-amber-50 border border-amber-200"
        style={{
          padding: componentTokens.mobileQuestionCard.padding,
          borderRadius: componentTokens.answerButton.borderRadius,
        }}
      >
        <p className="text-amber-800 text-sm">
          Dieser Fragetyp wird noch nicht unterstützt: {question.questionType}
        </p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 to-white flex flex-col">
      {/* Mobile Header */}
      <MobileHeader
        variant="with-title"
        title={funnelTitle}
        subtitle={`Frage ${questionIndex + 1} von ${totalQuestions}`}
        showBack={!isFirst}
        onBack={onPrevious}
      />

      {/* Progress Bar - Sticky below header */}
      <div 
        className="sticky bg-white border-b border-slate-100"
        style={{ 
          top: '56px', // Height of MobileHeader
          zIndex: 40,
          boxShadow: shadows.sm,
        }}
      >
        <div style={{ padding: `${spacing.sm} ${spacing.lg}` }}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-medium text-slate-600">
              Fortschritt
            </span>
            <span className="text-xs font-semibold text-sky-600">
              {Math.round(progressPercent)}%
            </span>
          </div>
          <div
            className="w-full bg-slate-200 overflow-hidden"
            style={{
              height: componentTokens.progressBar.height,
              borderRadius: componentTokens.progressBar.borderRadius,
            }}
          >
            <motion.div
              className="h-full bg-gradient-to-r from-sky-500 to-sky-600"
              initial={{ width: 0 }}
              animate={{ width: `${progressPercent}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>
      </div>

      {/* Question Block - Scrollable Content */}
      <main
        className="flex-1 overflow-y-auto"
        style={{ padding: `${spacing.lg} ${spacing.lg}` }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className={`bg-white border-2 ${
            isFocused ? 'border-sky-400 shadow-xl' : 'border-slate-200'
          } ${isAnswered ? 'border-sky-200 bg-sky-50/30' : ''}`}
          style={{
            borderRadius: componentTokens.mobileQuestionCard.borderRadius,
            boxShadow: componentTokens.mobileQuestionCard.shadow,
            transition: `all ${motionTokens.duration.normal} ${motionTokens.easing.smooth}`,
          }}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
        >
          {/* Question Text */}
          <div
            style={{
              padding: `${componentTokens.mobileQuestionCard.contentPaddingY} ${componentTokens.mobileQuestionCard.contentPaddingX}`,
              paddingBottom: spacing.md,
            }}
          >
            <h2
              className="font-semibold text-slate-900 leading-relaxed mb-3"
              style={{ fontSize: typography.fontSize.xl }}
            >
              {question.label}
            </h2>

            {/* Help Text */}
            {question.helpText && (
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
                  <span className="shrink-0" style={{ fontSize: typography.fontSize.lg }}>
                    💡
                  </span>
                  <span>{question.helpText}</span>
                </p>
              </div>
            )}

            {/* Required Indicator */}
            {isRequired && !isAnswered && !error && (
              <p
                className="text-amber-700 bg-amber-50 border border-amber-200 mb-3"
                style={{
                  fontSize: typography.fontSize.xs,
                  borderRadius: componentTokens.infoBox.borderRadius,
                  padding: `${spacing.sm} ${spacing.md}`,
                }}
              >
                ⚠️ Bitte wählen Sie eine Antwort aus
              </p>
            )}
          </div>

          {/* Answer Components */}
          <div
            style={{
              padding: `0 ${componentTokens.mobileQuestionCard.contentPaddingX} ${componentTokens.mobileQuestionCard.contentPaddingY}`,
            }}
          >
            {renderAnswerComponent()}
          </div>

          {/* Error Message */}
          {error && (
            <div
              className="text-red-700 bg-red-50 border-2 border-red-200 flex items-start gap-3"
              style={{
                margin: `0 ${componentTokens.mobileQuestionCard.contentPaddingX} ${componentTokens.mobileQuestionCard.contentPaddingY}`,
                fontSize: typography.fontSize.sm,
                borderRadius: componentTokens.infoBox.borderRadius,
                padding: `${spacing.md} ${spacing.md}`,
              }}
            >
              <span className="shrink-0" style={{ fontSize: typography.fontSize.xl }}>
                ❌
              </span>
              <p className="leading-relaxed">{error}</p>
            </div>
          )}
        </motion.div>
      </main>

      {/* Bottom Action Bar - Sticky */}
      <footer
        className="sticky bottom-0 z-10 bg-white border-t border-slate-200 shadow-lg"
        style={{ padding: `${spacing.md} ${spacing.lg}` }}
      >
        <div className="flex gap-3">
          {/* Back Button */}
          {!isFirst && onPrevious && (
            <motion.button
              type="button"
              onClick={onPrevious}
              disabled={isSubmitting}
              className="bg-slate-100 text-slate-700 font-semibold hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
              style={{
                padding: `${componentTokens.navigationButton.paddingY} ${componentTokens.navigationButton.paddingX}`,
                borderRadius: componentTokens.navigationButton.borderRadius,
                minHeight: componentTokens.navigationButton.minHeight,
                transition: componentTokens.navigationButton.transition,
                fontSize: componentTokens.navigationButton.fontSize,
              }}
              whileTap={{ scale: 0.95 }}
            >
              ← Zurück
            </motion.button>
          )}

          {/* Next Button */}
          {onNext && (
            <motion.button
              type="button"
              onClick={onNext}
              disabled={!isAnswered || isSubmitting}
              className="flex-1 font-semibold text-white disabled:opacity-60 disabled:cursor-not-allowed active:scale-95"
              style={{
                padding: `${componentTokens.navigationButton.paddingY} ${componentTokens.navigationButton.paddingX}`,
                borderRadius: componentTokens.navigationButton.borderRadius,
                minHeight: componentTokens.navigationButton.minHeight,
                boxShadow: componentTokens.navigationButton.shadow,
                transition: componentTokens.navigationButton.transition,
                fontSize: componentTokens.navigationButton.fontSize,
                background: isAnswered && !isSubmitting
                  ? `linear-gradient(135deg, ${colors.primary[500]} 0%, ${colors.primary[600]} 100%)`
                  : colors.neutral[400],
              }}
              whileTap={isAnswered && !isSubmitting ? { scale: 0.95 } : undefined}
            >
              {isSubmitting ? (
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
            </motion.button>
          )}
        </div>
      </footer>
    </div>
  )
})

export default MobileQuestionScreen
