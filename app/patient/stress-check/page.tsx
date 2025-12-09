'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CONSENT_TEXT, CONSENT_VERSION } from '@/lib/consentConfig'
import { supabase } from '@/lib/supabaseClient'
import ConsentModal from './ConsentModal'
import type { FunnelDefinition, QuestionDefinition } from '@/lib/types/funnel'
import { isQuestionStep } from '@/lib/types/funnel'

type ValidationError = {
  questionId: string
  questionKey: string
  questionLabel: string
  orderIndex: number
  reason?: 'required' | 'conditional_required'
  ruleDescription?: string
}

const SCALE = [
  { value: 0, label: 'Nie' },
  { value: 1, label: 'Selten' },
  { value: 2, label: 'Manchmal' },
  { value: 3, label: 'Oft' },
  { value: 4, label: 'Sehr häufig' },
]

export default function StressCheckPage() {
  const router = useRouter()
  const [initialLoading, setInitialLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [hasConsent, setHasConsent] = useState(false)
  const [funnel, setFunnel] = useState<FunnelDefinition | null>(null)
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [assessmentId, setAssessmentId] = useState<string | null>(null)

  // Load funnel definition from API
  useEffect(() => {
    const loadFunnel = async () => {
      try {
        const response = await fetch('/api/funnels/stress/definition')
        if (!response.ok) {
          throw new Error('Failed to load funnel definition')
        }
        const data: FunnelDefinition = await response.json()
        setFunnel(data)
      } catch (err) {
        console.error('Error loading funnel:', err)
        setError('Fehler beim Laden der Fragen. Bitte laden Sie die Seite neu.')
      }
    }

    loadFunnel()
  }, [])

  useEffect(() => {
    const handleConsentCheckFailure = () => {
      // Default to showing consent modal if check fails (fail-safe)
      setShowConsentModal(true)
      setHasConsent(false)
    }

    const checkAuth = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser()

      if (error) {
        console.error('Fehler bei getUser:', error)
      }

      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)

      // Check consent status via API endpoint
      try {
        const response = await fetch(`/api/consent/status?version=${CONSENT_VERSION}`)
        
        if (response.ok) {
          const data = await response.json()
          
          if (!data.hasConsent) {
            setShowConsentModal(true)
            setHasConsent(false)
          } else {
            setHasConsent(true)
          }
        } else {
          console.error('Error checking consent status:', await response.text())
          handleConsentCheckFailure()
        }
      } catch (consentError) {
        console.error('Error checking consent:', consentError)
        handleConsentCheckFailure()
      }

      setInitialLoading(false)
    }

    checkAuth()
  }, [router])

  const handleConsentAccepted = () => {
    setShowConsentModal(false)
    setHasConsent(true)
  }

  const handleConsentDeclined = () => {
    router.push(
      `/?error=consent_declined&message=${encodeURIComponent(
        CONSENT_TEXT.errors.consentDeclined,
      )}`,
    )
  }

  const handleSetAnswer = (qId: string, value: number) => {
    setAnswers((prev) => ({
      ...prev,
      [qId]: value,
    }))
    setValidationErrors((prev) => prev.filter((err) => err.questionId !== qId))
    setError(null)
  }

  // Create assessment on first answer if not exists
  const createAssessmentIfNeeded = async () => {
    if (assessmentId || !userId) return assessmentId

    try {
      const { data: profileData, error: profileError } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (profileError) throw profileError
      if (!profileData) throw new Error('Kein Patientenprofil gefunden.')

      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          patient_id: profileData.id,
          funnel: 'stress',
        })
        .select('id')
        .single()

      if (assessmentError) throw assessmentError
      if (!assessmentData) throw new Error('Assessment konnte nicht angelegt werden.')

      setAssessmentId(assessmentData.id)
      return assessmentData.id
    } catch (err) {
      console.error('Error creating assessment:', err)
      throw err
    }
  }

  // Save answer to database
  const saveAnswer = async (questionKey: string, value: number) => {
    try {
      const currentAssessmentId = await createAssessmentIfNeeded()
      if (!currentAssessmentId) return

      const { error: answerError } = await supabase
        .from('assessment_answers')
        .upsert({
          assessment_id: currentAssessmentId,
          question_id: questionKey,
          answer_value: value,
        })

      if (answerError) throw answerError
    } catch (err) {
      console.error('Error saving answer:', err)
      setError('Fehler beim Speichern der Antwort.')
    }
  }

  // Handle answer change with auto-save
  const handleAnswerChange = async (questionKey: string, value: number) => {
    handleSetAnswer(questionKey, value)
    await saveAnswer(questionKey, value)
  }

  // Validate current step before navigation
  const validateCurrentStep = async (): Promise<boolean> => {
    if (!funnel || !assessmentId) return false

    const currentStep = funnel.steps[currentStepIndex]
    if (!isQuestionStep(currentStep)) return true

    try {
      const response = await fetch('/api/assessment-validation/validate-step', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assessmentId,
          stepId: currentStep.id,
          extended: true, // Use B4 extended validation
        }),
      })

      const data = await response.json()

      if (!data.success) {
        setError(data.error || 'Validierung fehlgeschlagen')
        return false
      }

      if (!data.isValid) {
        setValidationErrors(data.missingQuestions || [])

        // Count different types of missing questions
        const requiredCount = data.missingQuestions?.filter(
          (q: ValidationError) => q.reason === 'required',
        ).length || 0
        const conditionalCount = data.missingQuestions?.filter(
          (q: ValidationError) => q.reason === 'conditional_required',
        ).length || 0

        // Generate appropriate error message
        let errorMessage = 'Bitte beantworten Sie '
        if (requiredCount > 0 && conditionalCount > 0) {
          errorMessage += `alle ${requiredCount + conditionalCount} Pflichtfragen in diesem Schritt.`
        } else if (requiredCount > 0) {
          errorMessage += `alle ${requiredCount} Pflichtfragen in diesem Schritt.`
        } else if (conditionalCount > 0) {
          errorMessage += `die ${conditionalCount} zusätzlich erforderlichen Fragen (abhängig von Ihren vorherigen Antworten).`
        } else {
          errorMessage += 'die fehlenden Fragen.'
        }

        setError(errorMessage)

        // Scroll to first missing question
        if (data.missingQuestions && data.missingQuestions.length > 0) {
          const firstMissing = data.missingQuestions[0]
          setTimeout(() => {
            const element = document.getElementById(`question-${firstMissing.questionId}`)
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 100)
        }

        return false
      }

      setValidationErrors([])
      setError(null)
      return true
    } catch (err) {
      console.error('Error validating step:', err)
      setError('Fehler bei der Validierung. Bitte versuchen Sie es erneut.')
      return false
    }
  }

  // Navigate to next step
  const handleNextStep = async () => {
    if (!funnel) return

    // Validate current step before proceeding
    const isValid = await validateCurrentStep()
    if (!isValid) return

    // Move to next step
    if (currentStepIndex < funnel.steps.length - 1) {
      setCurrentStepIndex(currentStepIndex + 1)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } else {
      // Last step - submit
      await handleSubmit()
    }
  }

  // Navigate to previous step
  const handlePreviousStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStepIndex(currentStepIndex - 1)
      setError(null)
      setValidationErrors([])
      window.scrollTo({ top: 0, behavior: 'smooth' })
    }
  }

  const handleSubmit = async () => {
    if (!userId || !assessmentId) {
      console.error('Kein userId oder assessmentId in handleSubmit')
      setError('Es gab ein Problem mit der Anmeldung. Bitte melden Sie sich erneut an.')
      router.push('/login')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Mark assessment as completed
      const { error: updateError } = await supabase
        .from('assessments')
        .update({ completed_at: new Date().toISOString() })
        .eq('id', assessmentId)

      if (updateError) throw updateError

      // Redirect to result page
      router.push(`/patient/stress-check/result?assessmentId=${assessmentId}`)
    } catch (err) {
      console.error('Fehler in handleSubmit:', err)
      const message =
        err instanceof Error
          ? err.message
          : 'Beim Speichern der Antworten ist ein Fehler aufgetreten.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (initialLoading || !funnel) {
    return (
      <main className="flex items-center justify-center bg-slate-50 py-20">
        <p className="text-sm text-slate-600">Bitte warten…</p>
      </main>
    )
  }

  if (showConsentModal) {
    return (
      <ConsentModal
        onConsent={handleConsentAccepted}
        onDecline={handleConsentDeclined}
      />
    )
  }

  if (!hasConsent) {
    return (
      <main className="flex items-center justify-center bg-slate-50 py-20">
        <p className="text-sm text-slate-600">Laden…</p>
      </main>
    )
  }

  const currentStep = funnel.steps[currentStepIndex]
  const isFirstStep = currentStepIndex === 0
  const isLastStep = currentStepIndex === funnel.steps.length - 1

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
            Schritt {currentStepIndex + 1} von {funnel.totalSteps}: {currentStep.title}
          </h1>
          {currentStep.description && (
            <p className="text-sm text-slate-600 leading-relaxed">
              {currentStep.description}
            </p>
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

        {/* Questions for current step */}
        {isQuestionStep(currentStep) && (
          <div className="space-y-4">
            {currentStep.questions.map((question, index) => {
              const validationError = validationErrors.find((err) => err.questionId === question.id)
              return (
                <QuestionCard
                  key={question.id}
                  index={index + 1}
                  question={question}
                  value={answers[question.key]}
                  onChange={handleAnswerChange}
                  hasError={!!validationError}
                  validationError={validationError}
                />
              )
            })}
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
            Nach dem Abschicken werden Ihre Antworten anonymisiert ausgewertet. Anschließend
            sehen Sie Ihren persönlichen Stress- und Schlaf-Report.
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
  validationError?: ValidationError
}

function QuestionCard({
  index,
  question,
  value,
  onChange,
  hasError,
  validationError,
}: QuestionCardProps) {
  const isAnswered = value !== undefined

  // Determine the type of error message to show
  const isConditionalRequired = validationError?.reason === 'conditional_required'
  const isBaseRequired = validationError?.reason === 'required'

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
            {!question.isRequired && !isConditionalRequired && (
              <span className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded-md whitespace-nowrap">
                Optional
              </span>
            )}
            {isConditionalRequired && (
              <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-md whitespace-nowrap">
                Pflicht (abhängig)
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
      {hasError && isBaseRequired && (
        <p className="text-xs md:text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3 ml-11">
          ⚠️ Diese Pflichtfrage muss beantwortet werden
        </p>
      )}
      {hasError && isConditionalRequired && validationError?.ruleDescription && (
        <p className="text-xs md:text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-3 ml-11">
          ⚠️ Diese Frage muss beantwortet werden, weil {validationError.ruleDescription}
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
