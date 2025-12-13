'use client'

import type { FunnelDefinition, StepDefinition } from '@/lib/types/funnel'
import { isQuestionStep, isInfoStep, isContentPageStep } from '@/lib/types/funnel'
import QuestionStepRenderer from './QuestionStepRenderer'
import InfoStepRenderer from './InfoStepRenderer'
import ContentPageStepRenderer from './ContentPageStepRenderer'
import AssessmentProgress from './AssessmentProgress'
import AssessmentNavigationController from './AssessmentNavigationController'
import { useIsMobile } from '@/lib/hooks/useIsMobile'

/**
 * PatientFlowRenderer - Central component for rendering the patient assessment flow
 * 
 * Responsibilities:
 * - Determine current node type (Question, Info, Content Page, Result)
 * - Delegate rendering to appropriate node-specific renderer
 * - Display progress indicators
 * - Coordinate navigation between nodes
 * 
 * On mobile (<640px) with single-question steps, uses full-screen adaptive layout.
 * On desktop or multi-question steps, uses traditional card-based layout.
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
  const isMobile = useIsMobile()

  // On mobile with single-question step, use full-screen adaptive layout
  const useMobileFullScreen = isMobile && isQuestionStep(currentStep) && currentStep.questions.length === 1

  if (useMobileFullScreen) {
    // Mobile full-screen adaptive layout - rendered by QuestionStepRenderer
    return (
      <QuestionStepRenderer
        step={currentStep}
        answers={answers}
        validationErrors={validationErrors}
        onAnswerChange={onAnswerChange}
        onNextStep={onNextStep}
        onPreviousStep={onPreviousStep}
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
        submitting={submitting}
        totalQuestions={totalQuestions}
        funnelTitle={funnel.title}
      />
    )
  }

  // Desktop or multi-question step: full-width patient layout
  return (
    <main className="w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      {/* Recovery Banner */}
      {showRecoveryBanner && answeredCount > 0 && assessmentStatus.currentStep.stepIndex > 0 && (
        <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start gap-2 sm:gap-3">
            <span className="text-lg sm:text-xl shrink-0">✅</span>
            <div className="flex-1">
              <h3 className="text-xs sm:text-sm font-semibold text-green-900 mb-1">
                Fortschritt wiederhergestellt
              </h3>
              <p className="text-xs sm:text-sm text-green-700">
                Sie setzen Ihre Umfrage fort. Ihre bisherigen {answeredCount} Antworten wurden
                wiederhergestellt.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header className="mb-4 sm:mb-6">
        <p className="text-xs sm:text-sm font-medium uppercase tracking-wide text-sky-600 mb-2">
          {funnel.title}
        </p>
        <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-semibold text-slate-900 mb-2 leading-tight">
          Schritt {assessmentStatus.currentStep.stepIndex + 1} von {assessmentStatus.totalSteps}:{' '}
          {currentStep.title}
        </h1>
        {currentStep.description && (
          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">{currentStep.description}</p>
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
            onNextStep={onNextStep}
            onPreviousStep={onPreviousStep}
            isFirstStep={isFirstStep}
            isLastStep={isLastStep}
            submitting={submitting}
            totalQuestions={totalQuestions}
            funnelTitle={funnel.title}
          />
        )}

        {isInfoStep(currentStep) && <InfoStepRenderer step={currentStep} />}

        {isContentPageStep(currentStep) && (
          <ContentPageStepRenderer
            step={currentStep}
            onNextStep={onNextStep}
            onPreviousStep={onPreviousStep}
            isFirstStep={isFirstStep}
            isLastStep={isLastStep}
            submitting={submitting}
            totalQuestions={totalQuestions}
            answeredCount={answeredCount}
          />
        )}

        {/* Future: Add ResultRenderer for result steps */}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-4 sm:mt-6 text-xs sm:text-sm md:text-base text-red-700 bg-red-50 border-2 border-red-200 rounded-xl px-3 sm:px-4 py-3 sm:py-3.5 flex items-start gap-2 sm:gap-3">
          <span className="text-lg sm:text-xl shrink-0">❌</span>
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
        <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-500 text-center leading-relaxed px-2 sm:px-4">
          Nach dem Abschicken werden Ihre Antworten ausgewertet. Anschließend sehen Sie Ihre
          Ergebnisse.
        </p>
      )}
    </main>
  )
}
