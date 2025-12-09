'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import type { FunnelDefinition, QuestionDefinition } from '@/lib/types/funnel'
import { isQuestionStep } from '@/lib/types/funnel'

type AssessmentStatus = {
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

type ValidationError = {
  questionId: string
  questionKey: string
  questionLabel: string
  orderIndex: number
}

const SCALE = [
  { value: 0, label: 'Nie' },
  { value: 1, label: 'Selten' },
  { value: 2, label: 'Manchmal' },
  { value: 3, label: 'Oft' },
  { value: 4, label: 'Sehr häufig' },
]

type FunnelClientProps = {
  slug: string
}

export default function FunnelClient({ slug }: FunnelClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [funnel, setFunnel] = useState<FunnelDefinition | null>(null)
  const [assessmentStatus, setAssessmentStatus] = useState<AssessmentStatus | null>(null)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [submitting, setSubmitting] = useState(false)

  // Load funnel definition
  useEffect(() => {
    const loadFunnelData = async () => {
      try {
        const response = await fetch(`/api/funnels/${slug}/definition`)
        if (!response.ok) {
          throw new Error('Funnel konnte nicht geladen werden.')
        }
        const data: FunnelDefinition = await response.json()
        setFunnel(data)
      } catch (err) {
        console.error('Error loading funnel:', err)
        setError('Fehler beim Laden des Funnels. Bitte versuchen Sie es erneut.')
        setLoading(false)
      }
    }
    loadFunnelData()
  }, [slug])

  // Bootstrap assessment once funnel is loaded
  useEffect(() => {
    const initAssessment = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get user and patient profile
        const {
          data: { user },
        } = await supabase.auth.getUser()
        if (!user) {
          router.push('/login')
          return
        }

        const { data: profileData, error: profileError } = await supabase
          .from('patient_profiles')
          .select('id')
          .eq('user_id', user.id)
          .single()

        if (profileError || !profileData) {
          throw new Error('Benutzerprofil konnte nicht geladen werden.')
        }

        // Check for existing in_progress assessment
        const { data: existingAssessments } = await supabase
          .from('assessments')
          .select('id, status, completed_at')
          .eq('patient_id', profileData.id)
          .eq('funnel', slug)
          .order('started_at', { ascending: false })
          .limit(1)

        // If completed assessment exists, redirect to result
        if (existingAssessments && existingAssessments.length > 0) {
          const latest = existingAssessments[0]
          if (latest.status === 'completed' && latest.completed_at) {
            router.push(`/patient/funnel/${slug}/result?assessmentId=${latest.id}`)
            return
          }

          // Resume existing in_progress assessment
          if (latest.status === 'in_progress') {
            await loadAssessmentStatus(latest.id)
            return
          }
        }

        // Start new assessment via API
        const response = await fetch(`/api/funnels/${slug}/assessments`, {
          method: 'POST',
          credentials: 'include',
        })

        if (!response.ok) {
          throw new Error('Assessment konnte nicht gestartet werden.')
        }

        const { data } = await response.json()
        await loadAssessmentStatus(data.assessmentId)
      } catch (err) {
        console.error('Error bootstrapping assessment:', err)
        setError(err instanceof Error ? err.message : 'Fehler beim Starten des Assessments.')
        setLoading(false)
      }
    }

    if (funnel) {
      initAssessment()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [funnel, slug])

  const loadAssessmentStatus = async (assessmentId: string) => {
    try {
      const response = await fetch(`/api/funnels/${slug}/assessments/${assessmentId}`, {
        credentials: 'include',
      })

      if (!response.ok) {
        throw new Error('Assessment-Status konnte nicht geladen werden.')
      }

      const { data } = await response.json()
      setAssessmentStatus(data)

      // Load existing answers
      await loadExistingAnswers(assessmentId)

      setLoading(false)
    } catch (err) {
      console.error('Error loading assessment status:', err)
      setError('Fehler beim Laden des Assessment-Status.')
      setLoading(false)
    }
  }

  const loadExistingAnswers = async (assessmentId: string) => {
    try {
      const { data: answersData } = await supabase
        .from('assessment_answers')
        .select('question_id, answer_value')
        .eq('assessment_id', assessmentId)

      if (answersData) {
        const answersMap: Record<string, number> = {}
        answersData.forEach((answer) => {
          answersMap[answer.question_id] = answer.answer_value
        })
        setAnswers(answersMap)
      }
    } catch (err) {
      console.error('Error loading existing answers:', err)
    }
  }

  const handleAnswerChange = async (questionKey: string, value: number) => {
    if (!assessmentStatus || !funnel) return

    // Update local state immediately for UI responsiveness
    setAnswers((prev) => ({
      ...prev,
      [questionKey]: value,
    }))
    setValidationErrors((prev) => prev.filter((err) => err.questionKey !== questionKey))
    setError(null)

    // Save to server
    try {
      const currentStep = funnel.steps.find((s) => s.id === assessmentStatus.currentStep.stepId)
      if (!currentStep) return

      const response = await fetch(
        `/api/funnels/${slug}/assessments/${assessmentStatus.assessmentId}/answers/save`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          credentials: 'include',
          body: JSON.stringify({
            stepId: currentStep.id,
            questionId: questionKey,
            answerValue: value,
          }),
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Error saving answer:', errorData)
        setError('Fehler beim Speichern der Antwort.')
      }
    } catch (err) {
      console.error('Error saving answer:', err)
      setError('Fehler beim Speichern der Antwort.')
    }
  }

  const handleNextStep = async () => {
    if (!assessmentStatus || !funnel) return

    setSubmitting(true)
    setError(null)
    setValidationErrors([])

    try {
      const currentStep = funnel.steps.find((s) => s.id === assessmentStatus.currentStep.stepId)
      if (!currentStep) return

      // Validate current step
      const response = await fetch(
        `/api/funnels/${slug}/assessments/${assessmentStatus.assessmentId}/steps/${currentStep.id}`,
        {
          method: 'POST',
          credentials: 'include',
        },
      )

      if (!response.ok) {
        throw new Error('Validierung fehlgeschlagen.')
      }

      const { data } = await response.json()

      if (!data.isValid) {
        // Show validation errors
        setValidationErrors(data.missingQuestions || [])
        setError(
          `Bitte beantworten Sie alle Pflichtfragen (${data.missingQuestions?.length || 0} fehlend).`,
        )

        // Scroll to first missing question
        if (data.missingQuestions && data.missingQuestions.length > 0) {
          const firstMissing = data.missingQuestions[0]
          setTimeout(() => {
            const element = document.getElementById(`question-${firstMissing.questionId}`)
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 100)
        }

        setSubmitting(false)
        return
      }

      // Validation passed
      if (data.nextStep) {
        // Reload status to get updated current step
        await loadAssessmentStatus(assessmentStatus.assessmentId)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        // Last step - complete assessment
        await handleComplete()
      }
    } catch (err) {
      console.error('Error navigating to next step:', err)
      setError('Fehler bei der Navigation. Bitte versuchen Sie es erneut.')
    } finally {
      setSubmitting(false)
    }
  }

  const handlePreviousStep = async () => {
    if (!assessmentStatus || !funnel) return

    // Find previous step by order index
    const currentOrderIndex = assessmentStatus.currentStep.orderIndex
    const previousStep = funnel.steps.find((s) => s.orderIndex === currentOrderIndex - 1)

    if (!previousStep) return

    // Navigate back by reloading status (the navigation API will handle it)
    // For now, we'll just show a message since backward navigation
    // might require additional API support
    setError('Zurück-Navigation wird in Kürze unterstützt.')
  }

  const handleComplete = async () => {
    if (!assessmentStatus) return

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/funnels/${slug}/assessments/${assessmentStatus.assessmentId}/complete`,
        {
          method: 'POST',
          credentials: 'include',
        },
      )

      if (!response.ok) {
        const errorData = await response.json()
        if (errorData.error?.details?.missingQuestions) {
          setValidationErrors(errorData.error.details.missingQuestions)
          setError('Nicht alle Pflichtfragen wurden beantwortet.')
          setSubmitting(false)
          return
        }
        throw new Error('Fehler beim Abschließen des Assessments.')
      }

      // Redirect to result page
      router.push(`/patient/funnel/${slug}/result?assessmentId=${assessmentStatus.assessmentId}`)
    } catch (err) {
      console.error('Error completing assessment:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Fehler beim Abschließen des Assessments. Bitte versuchen Sie es erneut.',
      )
      setSubmitting(false)
    }
  }

  // Loading state
  if (loading || !funnel || !assessmentStatus) {
    return (
      <main className="flex items-center justify-center bg-slate-50 py-20">
        <p className="text-sm text-slate-600">Bitte warten…</p>
      </main>
    )
  }

  // Error state
  if (!loading && error && !assessmentStatus) {
    return (
      <main className="flex items-center justify-center bg-slate-50 py-20 px-4">
        <div className="max-w-md bg-white border-2 border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">❌</span>
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-1">Fehler</h3>
              <p className="text-red-700">{error}</p>
              <button
                onClick={() => router.push('/patient')}
                className="mt-4 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Zurück zur Übersicht
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const currentStep = funnel.steps.find((s) => s.id === assessmentStatus.currentStep.stepId)

  if (!currentStep) {
    return (
      <main className="flex items-center justify-center bg-slate-50 py-20 px-4">
        <div className="max-w-md bg-white border-2 border-red-200 rounded-xl p-6">
          <p className="text-red-700">Schritt konnte nicht gefunden werden.</p>
        </div>
      </main>
    )
  }

  const isFirstStep = assessmentStatus.currentStep.stepIndex === 0
  const isLastStep = assessmentStatus.currentStep.stepIndex === assessmentStatus.totalSteps - 1

  // Calculate progress
  const totalQuestions = funnel.totalQuestions
  const answeredCount = Object.keys(answers).length
  const progressPercent = totalQuestions > 0 ? (answeredCount / totalQuestions) * 100 : 0

  return (
    <main className="bg-slate-50 px-4 py-10">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8">
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

        {/* Progress */}
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm md:text-base text-slate-700">
            <span className="font-medium">
              Frage {answeredCount} von {totalQuestions} beantwortet
            </span>
            <span className="text-xs md:text-sm text-slate-500">
              {Math.round(progressPercent)}% abgeschlossen
            </span>
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-3 bg-sky-500 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        {isQuestionStep(currentStep) && (
          <div className="space-y-4">
            {currentStep.questions.map((question, index) => (
              <QuestionCard
                key={question.id}
                index={index + 1}
                question={question}
                value={answers[question.key]}
                onChange={handleAnswerChange}
                hasError={validationErrors.some((err) => err.questionId === question.id)}
              />
            ))}
          </div>
        )}

        {/* Info step */}
        {!isQuestionStep(currentStep) && 'content' in currentStep && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
            <p className="text-blue-900">{currentStep.content || currentStep.description}</p>
          </div>
        )}

        {/* Error message */}
        {error && (
          <div className="mt-6 text-sm md:text-base text-red-700 bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3.5 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">❌</span>
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="mt-8 flex gap-4">
          {!isFirstStep && (
            <button
              type="button"
              onClick={handlePreviousStep}
              disabled={submitting}
              className="flex-1 inline-flex justify-center items-center px-6 py-4 md:py-5 rounded-xl bg-slate-200 text-slate-700 text-base md:text-lg font-semibold hover:bg-slate-300 disabled:opacity-60 disabled:cursor-not-allowed transition-all"
            >
              ← Zurück
            </button>
          )}
          <button
            type="button"
            onClick={handleNextStep}
            disabled={submitting}
            className="flex-1 inline-flex justify-center items-center px-6 py-4 md:py-5 rounded-xl bg-sky-600 text-white text-base md:text-lg font-semibold shadow-md hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-sky-600 transition-all"
            style={{ minHeight: '56px' }}
          >
            {submitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
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
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Bitte warten…
              </>
            ) : isLastStep ? (
              '✓ Antworten speichern & weiter'
            ) : (
              'Weiter →'
            )}
          </button>
        </div>

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

type QuestionCardProps = {
  index: number
  question: QuestionDefinition
  value?: number
  onChange: (key: string, value: number) => void
  hasError?: boolean
}

function QuestionCard({ index, question, value, onChange, hasError }: QuestionCardProps) {
  const isAnswered = value !== undefined

  return (
    <div
      id={`question-${question.id}`}
      className={`border-2 rounded-xl p-5 md:p-6 transition-all ${
        hasError
          ? 'border-red-300 bg-red-50/30'
          : isAnswered
            ? 'border-sky-200 bg-sky-50/30'
            : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-3 mb-4">
        <span
          className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
            hasError
              ? 'bg-red-600 text-white'
              : isAnswered
                ? 'bg-sky-600 text-white'
                : 'bg-slate-200 text-slate-600'
          }`}
        >
          {index}
        </span>
        <div className="flex-1">
          <div className="flex items-start gap-2">
            <p className="text-base md:text-lg font-medium text-slate-900 leading-relaxed pt-1 flex-1">
              {question.label}
            </p>
            {!question.isRequired && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md whitespace-nowrap">
                Optional
              </span>
            )}
          </div>
        </div>
      </div>
      {question.helpText && (
        <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-4 ml-11">
          <p className="text-sm text-sky-900 leading-relaxed flex items-start gap-2">
            <span className="text-lg flex-shrink-0">💡</span>
            <span>{question.helpText}</span>
          </p>
        </div>
      )}
      {hasError && (
        <p className="text-xs md:text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3 ml-11">
          ⚠️ Diese Pflichtfrage muss beantwortet werden
        </p>
      )}
      {!isAnswered && !hasError && question.isRequired && (
        <p className="text-xs md:text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3 ml-11">
          ⚠️ Bitte wählen Sie eine Antwort aus
        </p>
      )}
      <div className="flex flex-wrap gap-2">
        {SCALE.map((option) => {
          const id = `${question.id}-${option.value}`
          const checked = value === option.value
          return (
            <label
              key={option.value}
              htmlFor={id}
              className={`flex-1 min-w-[90px] sm:min-w-[100px] flex flex-col items-center gap-0.5 px-2 py-2.5 sm:px-3 sm:py-3 rounded-lg border-2 cursor-pointer transition-all ${
                checked
                  ? 'bg-sky-600 text-white border-sky-600 shadow-md scale-105'
                  : 'bg-white text-slate-700 border-slate-300 hover:border-sky-400 hover:bg-sky-50 hover:shadow-sm'
              }`}
            >
              <input
                id={id}
                type="radio"
                className="sr-only"
                name={question.id}
                value={option.value}
                checked={checked}
                onChange={() => onChange(question.key, option.value)}
                aria-label={`${option.label} (Wert ${option.value})`}
              />
              <span className="text-xl sm:text-2xl font-bold">{option.value}</span>
              <span className="text-xs sm:text-sm font-medium">{option.label}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
