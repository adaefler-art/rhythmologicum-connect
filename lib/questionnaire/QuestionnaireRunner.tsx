/**
 * Adaptive Questionnaire Runner (V05-I03.2)
 * 
 * Manifest-driven questionnaire component with conditional logic and validation.
 * No persistence - pure UI state machine for questionnaire flow.
 * All types from registry and funnelManifest contracts.
 */

'use client'

import { useState, useCallback, useMemo } from 'react'
import type { FunnelQuestionnaireConfig, QuestionConfig } from '@/lib/contracts/funnelManifest'
import {
  initQuestionnaireState,
  updateAnswer,
  goToNextStep,
  goToPreviousStep,
  getCurrentStep,
  validateCurrentStep,
  getProgress,
  canGoNext,
  canGoBack,
  type QuestionnaireState,
} from './stateMachine'
import type { AnswersMap } from './conditionalLogic'
import QuestionRenderer from './QuestionRenderer'

export type QuestionnaireRunnerProps = {
  /** Questionnaire configuration from funnel manifest */
  config: FunnelQuestionnaireConfig
  /** Initial answers (for resume) */
  initialAnswers?: AnswersMap
  /** Called when questionnaire is completed */
  onComplete?: (answers: AnswersMap) => void
  /** Called when answers change (for auto-save) */
  onAnswersChange?: (answers: AnswersMap) => void
  /** Optional title */
  title?: string
}

export default function QuestionnaireRunner({
  config,
  initialAnswers = {},
  onComplete,
  onAnswersChange,
  title,
}: QuestionnaireRunnerProps) {
  // Initialize state
  const [state, setState] = useState<QuestionnaireState>(() => {
    const initial = initQuestionnaireState(config)
    // Apply initial answers if provided
    if (Object.keys(initialAnswers).length > 0) {
      let updatedState = initial
      for (const [questionId, value] of Object.entries(initialAnswers)) {
        updatedState = updateAnswer(updatedState, questionId, value)
      }
      return updatedState
    }
    return initial
  })

  const [validationErrors, setValidationErrors] = useState<QuestionConfig[]>([])

  // Current step and progress
  const currentStep = useMemo(() => getCurrentStep(state), [state])
  const progress = useMemo(() => getProgress(state), [state])

  // Handle answer change
  const handleAnswerChange = useCallback(
    (questionId: string, value: string | number | boolean | string[]) => {
      const newState = updateAnswer(state, questionId, value)
      setState(newState)
      setValidationErrors([]) // Clear validation errors on answer change

      // Notify parent
      onAnswersChange?.(newState.answers)
    },
    [state, onAnswersChange],
  )

  // Handle next step
  const handleNext = useCallback(() => {
    // Validate current step
    const validation = validateCurrentStep(state)

    if (!validation.isValid) {
      setValidationErrors(validation.missingQuestions)
      // Scroll to first missing question
      if (validation.missingQuestions.length > 0) {
        const firstMissing = validation.missingQuestions[0]
        setTimeout(() => {
          const element = document.getElementById(`question-${firstMissing.id}`)
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }, 100)
      }
      return
    }

    setValidationErrors([])

    // Check if we can go next
    if (!canGoNext(state)) {
      // Last step - complete questionnaire
      setState((prev) => ({ ...prev, isComplete: true }))
      onComplete?.(state.answers)
      return
    }

    // Go to next step
    const newState = goToNextStep(state)
    setState(newState)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [state, onComplete])

  // Handle previous step
  const handlePrevious = useCallback(() => {
    if (!canGoBack(state)) return

    setValidationErrors([])
    const newState = goToPreviousStep(state)
    setState(newState)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [state])

  // Completion state
  if (state.isComplete) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-8">
          <div className="text-6xl mb-4">✅</div>
          <h2 className="text-2xl font-bold text-green-900 mb-2">Fragebogen abgeschlossen</h2>
          <p className="text-green-700">
            Vielen Dank für Ihre Antworten. Sie haben {progress.answeredQuestions} von{' '}
            {progress.totalQuestions} Fragen beantwortet.
          </p>
        </div>
      </div>
    )
  }

  // No current step (error state)
  if (!currentStep) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12 text-center">
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-8">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-red-900 mb-2">Fehler</h2>
          <p className="text-red-700">Kein aktueller Schritt gefunden. Bitte laden Sie die Seite neu.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      {title && (
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
        </div>
      )}

      {/* Progress bar */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-slate-600">
            Schritt {progress.currentStep} von {progress.totalSteps}
          </span>
          <span className="text-sm text-slate-500">
            {progress.answeredQuestions} / {progress.totalQuestions} Fragen beantwortet
          </span>
        </div>
        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-sky-500 transition-all duration-300"
            style={{ width: `${progress.percentComplete}%` }}
          />
        </div>
      </div>

      {/* Current step */}
      <div className="bg-white border-2 border-slate-200 rounded-xl p-6 mb-6">
        <h2 className="text-xl font-bold text-slate-900 mb-2">{currentStep.title}</h2>
        {currentStep.description && (
          <p className="text-slate-600 mb-6">{currentStep.description}</p>
        )}

        {/* Questions */}
        <div className="space-y-6">
          {currentStep.questions.map((question) => {
            const hasError = validationErrors.some((q) => q.id === question.id)
            const errorMsg = hasError ? 'Diese Pflichtfrage muss beantwortet werden' : null

            return (
              <div key={question.id} id={`question-${question.id}`}>
                <label className="block mb-3">
                  <span className="text-base font-semibold text-slate-900">
                    {question.label}
                    {question.required && <span className="text-red-500 ml-1">*</span>}
                  </span>
                  {question.helpText && (
                    <span className="block text-sm text-slate-600 mt-1">{question.helpText}</span>
                  )}
                </label>

                <QuestionRenderer
                  question={question}
                  value={state.answers[question.id]}
                  onChange={(value) => handleAnswerChange(question.id, value)}
                  error={errorMsg}
                />

                {hasError && (
                  <p className="mt-2 text-sm text-red-600 font-medium">{errorMsg}</p>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {/* Validation errors summary */}
      {validationErrors.length > 0 && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-lg">
          <p className="text-sm font-semibold text-red-900 mb-2">
            Bitte beantworten Sie alle Pflichtfragen
          </p>
          <ul className="text-sm text-red-700 space-y-1">
            {validationErrors.map((q) => (
              <li key={q.id}>• {q.label}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Navigation */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={handlePrevious}
          disabled={!canGoBack(state)}
          className={`px-6 py-3 rounded-lg font-semibold transition-all ${
            canGoBack(state)
              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          }`}
        >
          Zurück
        </button>

        <button
          type="button"
          onClick={handleNext}
          className="flex-1 px-6 py-3 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition-all"
        >
          {canGoNext(state) ? 'Weiter' : 'Abschließen'}
        </button>
      </div>
    </div>
  )
}
