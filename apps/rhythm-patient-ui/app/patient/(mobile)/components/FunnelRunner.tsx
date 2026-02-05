'use client'

/**
 * E74.4 — Patient Funnel Execution UI v1
 * 
 * Step-by-step funnel runner that loads definition from database,
 * uses runtime API for currentStep, validates before navigation,
 * supports conditional logic, and implements resume capability.
 * 
 * Key principles:
 * - NO build-time content: all content from database
 * - currentStep from API, not local state
 * - Validation endpoint before navigation
 * - Deterministic error states (loading/empty/offline)
 */

import React, { useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  Card,
  Button,
  ProgressBar,
  LoadingSkeleton,
  EmptyState,
  ErrorState,
} from '@/lib/ui/mobile-v2'
import { ChevronDown, ChevronUp } from '@/lib/ui/mobile-v2/icons'
import QuestionRenderer from '@/lib/questionnaire/QuestionRenderer'
import { isStepVisible } from '@/lib/questionnaire/conditionalLogic'
import type { FunnelQuestionnaireConfig, QuestionnaireStep, QuestionConfig, ConditionalLogic } from '@/lib/contracts/funnelManifest'
import type { StartAssessmentResponseData, ResumeAssessmentResponseData } from '@/lib/api/contracts/patient'

// ============================================================
// Types
// ============================================================

interface FunnelRunnerProps {
  slug: string
  mode?: 'live' | 'demo'
  onComplete?: (assessmentId: string) => void
  onExit?: () => void
}

interface RuntimeState {
  assessmentId: string
  status: 'in_progress' | 'completed'
  currentStepId: string
  currentStepIndex: number
  totalSteps: number
}

interface FunnelManifest {
  questionnaireConfig: FunnelQuestionnaireConfig
  title: string
  description?: string
}

interface ValidationResult {
  isValid: boolean
  missingQuestions: Array<{
    questionId: string
    questionKey: string
    questionLabel: string
  }>
  nextStep?: {
    stepId: string
    title: string
    stepIndex: number
  }
}

// ============================================================
// Error State Types
// ============================================================

type ErrorType = 'loading' | 'not_found' | 'unauthorized' | 'network' | 'server' | null

interface ErrorDetails {
  type: ErrorType
  message: string
  retryable: boolean
}

// ============================================================
// Main Component
// ============================================================

export function FunnelRunner({ slug, mode = 'live', onComplete, onExit }: FunnelRunnerProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const assessmentIdFromQuery = searchParams.get('assessmentId')

  // Loading and error states
  const [isInitializing, setIsInitializing] = useState(() => mode !== 'demo')
  const [error, setError] = useState<ErrorDetails | null>(null)

  // Funnel definition from database
  const [manifest, setManifest] = useState<FunnelManifest | null>(null)

  // Runtime state from API
  const [runtime, setRuntime] = useState<RuntimeState | null>(null)

  // User answers (step -> question -> value)
  const [answers, setAnswers] = useState<Record<string, unknown>>({})

  // Navigation state
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const startRequestRef = useRef<{ inFlight: boolean; idempotencyKey: string | null }>({
    inFlight: false,
    idempotencyKey: null,
  })

  // ============================================================
  // API Helpers
  // ============================================================

  const startAssessment = useCallback(async (): Promise<StartAssessmentResponseData | null> => {
    try {
      if (startRequestRef.current.inFlight) {
        return null
      }

      startRequestRef.current.inFlight = true
      if (!startRequestRef.current.idempotencyKey) {
        startRequestRef.current.idempotencyKey = crypto.randomUUID()
      }

      const idempotencyKey = startRequestRef.current.idempotencyKey
      const response = await fetch(`/api/funnels/${slug}/assessments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Idempotency-Key': idempotencyKey,
          'X-Correlation-Id': idempotencyKey,
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          setError({ type: 'not_found', message: 'Funnel nicht gefunden', retryable: false })
        } else if (response.status === 401) {
          setError({ type: 'unauthorized', message: 'Bitte melden Sie sich an', retryable: false })
        } else {
          setError({ type: 'server', message: 'Fehler beim Starten', retryable: true })
        }
        return null
      }

      const payload = await response.json()
      return payload.data || payload
    } catch (err) {
      setError({ type: 'network', message: 'Netzwerkfehler', retryable: true })
      return null
    } finally {
      startRequestRef.current.inFlight = false
    }
  }, [slug])

  const resumeAssessment = useCallback(
    async (assessmentId: string): Promise<ResumeAssessmentResponseData | null> => {
      try {
        const response = await fetch(`/api/funnels/${slug}/assessments/${assessmentId}`, {
          method: 'GET',
        })

        if (!response.ok) {
          if (response.status === 404) {
            setError({ type: 'not_found', message: 'Assessment nicht gefunden', retryable: false })
          } else if (response.status === 401) {
            setError({ type: 'unauthorized', message: 'Bitte melden Sie sich an', retryable: false })
          } else {
            setError({ type: 'server', message: 'Fehler beim Laden', retryable: true })
          }
          return null
        }

        const payload = await response.json()
        return payload.data || payload
      } catch (err) {
        setError({ type: 'network', message: 'Netzwerkfehler', retryable: true })
        return null
      }
    },
    [slug],
  )

  const loadManifest = useCallback(async (): Promise<FunnelManifest | null> => {
    try {
      const response = await fetch(`/api/funnels/${slug}/definition`)
      if (!response.ok) {
        return null
      }
      const definition = await response.json()
      
      // Transform definition to manifest format
      // The definition endpoint already loads from database
      return {
        questionnaireConfig: {
          schema_version: 'v1',
          version: '1.0',
          steps: definition.steps?.map((step: any) => ({
            id: step.id,
            title: step.title,
            description: step.description,
            questions: step.questions?.map((q: any) => ({
              id: q.id,
              key: q.key,
              type: q.questionType || q.type,
              label: q.label,
              helpText: q.helpText,
              required: q.isRequired || false,
              options: q.options,
              minValue: q.minValue,
              maxValue: q.maxValue,
            })) || [],
          })) || [],
        },
        title: definition.title || 'Assessment',
        description: definition.description,
      }
    } catch (err) {
      return null
    }
  }, [slug])

  const saveAnswer = useCallback(async (questionId: string, answerValue: unknown): Promise<boolean> => {
    if (!runtime) return false

    try {
      const response = await fetch(`/api/funnels/${slug}/assessments/${runtime.assessmentId}/answers/save`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          stepId: runtime.currentStepId,
          questionId,
          answerValue,
        }),
      })

      return response.ok
    } catch {
      return false
    }
  }, [slug, runtime])

  const validateStep = useCallback(async (stepId: string): Promise<ValidationResult | null> => {
    if (!runtime) return null

    try {
      const response = await fetch(
        `/api/funnels/${slug}/assessments/${runtime.assessmentId}/steps/${stepId}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        },
      )

      if (!response.ok) {
        return null
      }

      const payload = await response.json()
      return payload.data || payload
    } catch {
      return null
    }
  }, [slug, runtime])

  const completeAssessment = useCallback(async (): Promise<boolean> => {
    if (!runtime) return false

    try {
      const response = await fetch(`/api/funnels/${slug}/assessments/${runtime.assessmentId}/complete`, {
        method: 'POST',
      })

      return response.ok
    } catch {
      return false
    }
  }, [slug, runtime])

  // ============================================================
  // Initialization
  // ============================================================

  useEffect(() => {
    if (mode === 'demo') {
      return
    }

    let isMounted = true

    const initialize = async () => {
      setIsInitializing(true)
      setError(null)

      // Load manifest first
      const loadedManifest = await loadManifest()
      if (!isMounted) return

      if (!loadedManifest) {
        setError({ type: 'not_found', message: 'Funnel nicht gefunden', retryable: true })
        setIsInitializing(false)
        return
      }

      setManifest(loadedManifest)

      // Resume or start assessment
      if (assessmentIdFromQuery) {
        const resumed = await resumeAssessment(assessmentIdFromQuery)
        if (!isMounted) return

        if (resumed) {
          setRuntime({
            assessmentId: resumed.assessmentId,
            status: resumed.status,
            currentStepId: resumed.currentStep.stepId,
            currentStepIndex: resumed.currentStep.stepIndex,
            totalSteps: resumed.totalSteps,
          })

          if (resumed.status === 'completed') {
            onComplete?.(resumed.assessmentId)
          }
        }
      } else {
        const started = await startAssessment()
        if (!isMounted) return

        if (started) {
          setRuntime({
            assessmentId: started.assessmentId,
            status: started.status,
            currentStepId: started.currentStep.stepId,
            currentStepIndex: started.currentStep.stepIndex,
            totalSteps: loadedManifest.questionnaireConfig.steps.length,
          })
        }
      }

      setIsInitializing(false)
    }

    initialize()

    return () => {
      isMounted = false
    }
  }, [mode, slug, assessmentIdFromQuery, loadManifest, startAssessment, resumeAssessment, onComplete])

  // ============================================================
  // Event Handlers
  // ============================================================

  const handleAnswerChange = useCallback(async (questionId: string, value: unknown) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }))
    
    // Auto-save answer
    await saveAnswer(questionId, value)
  }, [saveAnswer])

  const handleContinue = useCallback(async () => {
    if (!runtime || !manifest) return

    setIsSubmitting(true)
    setValidationErrors([])

    const currentStep = manifest.questionnaireConfig.steps[runtime.currentStepIndex]
    if (!currentStep) {
      setIsSubmitting(false)
      return
    }

    // Validate current step
    const validation = await validateStep(runtime.currentStepId)
    if (!validation) {
      setValidationErrors(['Validierung fehlgeschlagen. Bitte versuchen Sie es erneut.'])
      setIsSubmitting(false)
      return
    }

    if (!validation.isValid) {
      const errors = validation.missingQuestions.map((q) => `${q.questionLabel} ist erforderlich`)
      setValidationErrors(errors)
      setIsSubmitting(false)
      return
    }

    // Move to next step or complete
    if (validation.nextStep) {
      setRuntime((prev) => prev ? {
        ...prev,
        currentStepId: validation.nextStep!.stepId,
        currentStepIndex: validation.nextStep!.stepIndex,
      } : null)
    } else {
      // Last step - complete assessment
      const completed = await completeAssessment()
      if (completed && runtime.assessmentId) {
        onComplete?.(runtime.assessmentId)
      }
    }

    setIsSubmitting(false)
  }, [runtime, manifest, validateStep, completeAssessment, onComplete])

  const handleBack = useCallback(() => {
    if (!runtime || runtime.currentStepIndex === 0) return

    setRuntime((prev) => prev ? {
      ...prev,
      currentStepIndex: prev.currentStepIndex - 1,
      currentStepId: manifest?.questionnaireConfig.steps[prev.currentStepIndex - 1]?.id || prev.currentStepId,
    } : null)

    setValidationErrors([])
  }, [runtime, manifest])

  const handleRetry = useCallback(() => {
    setError(null)
    setIsInitializing(true)
    window.location.reload()
  }, [])

  // ============================================================
  // Render States
  // ============================================================

  // Loading state
  if (isInitializing) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] px-4 py-6">
        <Card padding="lg" shadow="md">
          <LoadingSkeleton variant="text" count={5} />
          <p className="text-center text-[#6b7280] mt-4">Lade Assessment...</p>
        </Card>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] px-4 py-6 flex items-center justify-center">
        <ErrorState
          title={error.message}
          message={error.retryable ? 'Bitte versuchen Sie es erneut.' : 'Bitte wenden Sie sich an den Support.'}
          onRetry={error.retryable ? handleRetry : undefined}
        />
      </div>
    )
  }

  // Empty state (no manifest or runtime)
  if (!manifest || !runtime) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] px-4 py-6 flex items-center justify-center">
        <EmptyState
          title="Kein Assessment verfügbar"
          message="Dieser Funnel konnte nicht geladen werden."
        />
      </div>
    )
  }

  // ============================================================
  // Render Active Step
  // ============================================================

  const currentStep = manifest.questionnaireConfig.steps[runtime.currentStepIndex]
  if (!currentStep) {
    return (
      <div className="min-h-screen bg-[#f5f7fa] px-4 py-6 flex items-center justify-center">
        <EmptyState
          title="Schritt nicht gefunden"
          message="Der aktuelle Schritt konnte nicht geladen werden."
        />
      </div>
    )
  }

  // Get visible questions based on conditional logic
  // Note: Conditional logic is at step level, not question level
  // All questions in a visible step are shown (unless they have their own conditional logic in future)
  const visibleQuestions = currentStep.questions.filter((question) => {
    // For now, show all questions in the current step
    // Future: Add question-level conditional logic support
    return true
  })

  const progress = Math.round(((runtime.currentStepIndex + 1) / runtime.totalSteps) * 100)

  return (
    <div className="min-h-screen bg-[#f5f7fa] px-4 py-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1f2937] mb-2">{manifest.title}</h1>
        <ProgressBar value={progress} max={100} />
        <p className="text-sm text-[#6b7280] mt-2">
          Schritt {runtime.currentStepIndex + 1} von {runtime.totalSteps}
        </p>
      </div>

      {/* Step Content */}
      <Card padding="lg" shadow="md" className="mb-6">
        <h2 className="text-xl font-semibold text-[#1f2937] mb-4">{currentStep.title}</h2>
        {currentStep.description && (
          <p className="text-[#6b7280] mb-6">{currentStep.description}</p>
        )}

        {/* Questions */}
        <div className="space-y-6">
          {visibleQuestions.map((question) => (
            <div key={question.id}>
              <QuestionRenderer
                question={question}
                value={answers[question.id] as string | number | boolean | string[] | undefined}
                onChange={(value) => handleAnswerChange(question.id, value)}
                error={validationErrors.find((err) => err.includes(question.label))}
              />
            </div>
          ))}
        </div>

        {/* Validation Errors */}
        {validationErrors.length > 0 && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <ul className="text-sm text-red-700">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}
      </Card>

      {/* Navigation */}
      <div className="flex gap-3">
        {runtime.currentStepIndex > 0 && (
          <Button
            variant="secondary"
            size="lg"
            onClick={handleBack}
            disabled={isSubmitting}
          >
            Zurück
          </Button>
        )}
        <Button
          variant="primary"
          size="lg"
          onClick={handleContinue}
          disabled={isSubmitting}
          className="flex-1"
        >
          {isSubmitting
            ? 'Wird verarbeitet...'
            : runtime.currentStepIndex === runtime.totalSteps - 1
            ? 'Abschließen'
            : 'Weiter'}
        </Button>
      </div>

      {/* Exit */}
      {onExit && (
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={onExit}
            className="text-sm text-[#6b7280] hover:text-[#1f2937]"
          >
            Assessment abbrechen
          </button>
        </div>
      )}
    </div>
  )
}
