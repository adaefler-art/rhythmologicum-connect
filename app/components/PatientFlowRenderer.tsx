'use client'

import type { FunnelDefinition, StepDefinition } from '@/lib/types/funnel'
import { isQuestionStep, isInfoStep } from '@/lib/types/funnel'
import QuestionStepRenderer from './QuestionStepRenderer'
import InfoStepRenderer from './InfoStepRenderer'
import AssessmentProgress from './AssessmentProgress'
import AssessmentNavigationController from './AssessmentNavigationController'

/**
 * PatientFlowRenderer - Central component for rendering the patient assessment flow
 * 
 * Responsibilities:
 * - Determine current node type (Question, Info, Result)
 * - Delegate rendering to appropriate node-specific renderer
 * - Display progress indicators
 * - Coordinate navigation between nodes
 * 
 * This is a presentational component - state management happens in parent.
 */

export type AssessmentStatus = {
  assessmentId: string
  status: 'in_progress' | 'completed'
  currentStep: {
    stepId: string
    title: string
    type: string
    stepIndex: number
    orderIndex: number
  }
  completedSteps: number
  totalSteps: number
}

export type ValidationError = {
  questionId: string
  questionKey: string
  questionLabel: string
  orderIndex: number
}

export type PatientFlowRendererProps = {
  funnel: FunnelDefinition
  assessmentStatus: AssessmentStatus
  currentStep: StepDefinition
  answers: Record<string, number>
  validationErrors: ValidationError[]
  error: string | null
  submitting: boolean
  answeredCount: number
  showRecoveryBanner: boolean
  onAnswerChange: (questionKey: string, value: number) => void
  onNextStep: () => void
  onPreviousStep: () => void
  isFirstStep: boolean
  isLastStep: boolean
}

export default function PatientFlowRenderer({
  funnel,
  assessmentStatus,
  currentStep,
  answers,
  validationErrors,
  error,
  submitting,
  answeredCount,
  showRecoveryBanner,
  onAnswerChange,
  onNextStep,
  onPreviousStep,
  isFirstStep,
  isLastStep,
}: PatientFlowRendererProps) {
  const totalQuestions = funnel.totalQuestions
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0

  return (
    <main className="bg-slate-50 px-4 py-10">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8">
        {/* Recovery Banner */}
        {showRecoveryBanner && answeredCount > 0 && assessmentStatus.currentStep.stepIndex > 0 && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0">✅</span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-green-900 mb-1">
                  Fortschritt wiederhergestellt
                </h3>
                <p className="text-sm text-green-700">
                  Sie setzen Ihre Umfrage fort. Ihre bisherigen {answeredCount} Antworten wurden
                  wiederhergestellt.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Header */}
        <header className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wide text-sky-600 mb-1">
            {funnel.title}
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2">
            Schritt {assessmentStatus.currentStep.stepIndex + 1} von {assessmentStatus.totalSteps}:{' '}
            {currentStep.title}
          </h1>
          {currentStep.description && (
            <p className="text-sm text-slate-600 leading-relaxed">{currentStep.description}</p>
          )}
        </header>

        {/* Progress Indicator */}
        <AssessmentProgress
          answeredCount={answeredCount}
          totalQuestions={totalQuestions}
          progressPercent={progressPercent}
        />

        {/* Step Content Renderer - Delegates to node-specific renderers */}
        <div className="mb-6">
          {isQuestionStep(currentStep) && (
            <QuestionStepRenderer
              step={currentStep}
              answers={answers}
              validationErrors={validationErrors}
              onAnswerChange={onAnswerChange}
            />
          )}

          {isInfoStep(currentStep) && <InfoStepRenderer step={currentStep} />}

          {/* Future: Add ResultRenderer for result steps */}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mt-6 text-sm md:text-base text-red-700 bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3.5 flex items-start gap-3">
            <span className="text-xl shrink-0">❌</span>
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* Navigation Controls */}
        <AssessmentNavigationController
          onNextStep={onNextStep}
          onPreviousStep={onPreviousStep}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
          submitting={submitting}
        />

        {/* Last Step Helper Text */}
        {isLastStep && (
          <p className="mt-4 text-xs md:text-sm text-slate-500 text-center leading-relaxed px-4">
            Nach dem Abschicken werden Ihre Antworten ausgewertet. Anschließend sehen Sie Ihre
            Ergebnisse.
          </p>
        )}
      </div>
    </main>
  )
}
