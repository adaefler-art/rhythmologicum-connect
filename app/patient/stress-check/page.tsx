'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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

const SCALE = [
  { value: 0, label: 'Nie' },
  { value: 1, label: 'Selten' },
  { value: 2, label: 'Manchmal' },
  { value: 3, label: 'Oft' },
  { value: 4, label: 'Sehr häufig' },
]

export default function StressCheckPage() {
  return (
    <Suspense fallback={<StressCheckLoadingFallback />}>
      <StressCheckPageContent />
    </Suspense>
  )
}

function StressCheckPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const debugEnabled = searchParams.get('debug') === '1'
  const [initialLoading, setInitialLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [error, setError] = useState<string | null>(null)
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([])
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [hasConsent, setHasConsent] = useState(false)
  const [funnel, setFunnel] = useState<FunnelDefinition | null>(null)
  const [assessmentStatus, setAssessmentStatus] = useState<AssessmentStatus | null>(null)
  const [debugInfo, setDebugInfo] = useState<string | null>(null)
  const [statusLoading, setStatusLoading] = useState(false)

  // Check if user explicitly wants to start a new assessment
  const forceNew = searchParams.get('new') === 'true'

  // Load funnel definition from API
  useEffect(() => {
    const loadFunnel = async () => {
      try {
        const response = await fetch('/api/funnels/stress/definition')
        const data: FunnelDefinition = await response.json()

        setDebugInfo(
          JSON.stringify({
            endpoint: 'funnel-definition',
            ok: response.ok,
            status: response.status,
            steps: data?.steps?.map((s) => ({ id: s.id, type: s.type, orderIndex: s.orderIndex })),
            totalSteps: data?.totalSteps,
          }),
        )

        if (!response.ok) {
          throw new Error('Failed to load funnel definition')
        }
        setFunnel(data)
      } catch (err) {
        console.error('Error loading funnel:', err)
        setError('Fehler beim Laden der Fragen. Bitte laden Sie die Seite neu.')
        setDebugInfo(
          JSON.stringify({
            endpoint: 'funnel-definition',
            error: err instanceof Error ? err.message : String(err),
          }),
        )
      }
    }

    loadFunnel()
  }, [])

  // B6 AK1: Bootstrap assessment - check for existing or start new
  const bootstrapAssessment = async () => {
    setStatusLoading(true)
    try {
      // Check for existing in-progress assessment
      const { data: profileData, error: profileError } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (profileError || !profileData) {
        throw new Error('Patientenprofil nicht gefunden.')
      }

      const { data: existingAssessments, error: existingError } = await supabase
        .from('assessments')
        .select('id, status')
        .eq('patient_id', profileData.id)
        .eq('funnel', 'stress')
        .order('started_at', { ascending: false })
        .limit(1)

      if (existingError) {
        throw existingError
      }

      let currentAssessmentId: string | null = null

      // Handle existing assessments:
      // - Completed assessments always trigger a fresh start (results are available via Verlauf)
      // - In-progress assessments are resumed unless the user explicitly requested a new start
      if (existingAssessments && existingAssessments.length > 0) {
        const latest = existingAssessments[0]
        // Use existing in-progress assessment (but not when forceNew is true)
        if (latest.status === 'in_progress' && !forceNew) {
          currentAssessmentId = latest.id
        }
      }

      // Start new assessment if none exists
      if (!currentAssessmentId) {
        const startResponse = await fetch('/api/funnels/stress/assessments', {
          method: 'POST',
          credentials: 'include',
        })

        if (!startResponse.ok) {
          const errorData = await startResponse.json()
          throw new Error(errorData.error || 'Fehler beim Starten des Assessments.')
        }

        const startData = await startResponse.json()
        const startAssessmentId =
          startData?.assessmentId ?? startData?.data?.assessmentId ?? null

        setDebugInfo(
          JSON.stringify({
            endpoint: 'create',
            ok: startResponse.ok,
            status: startResponse.status,
            body: startData,
          }),
        )

        if (!startAssessmentId) {
          throw new Error('Keine Assessment-ID vom Server erhalten.')
        }

        currentAssessmentId = startAssessmentId
      }

      // Load assessment status
      if (currentAssessmentId) {
        await loadAssessmentStatus(currentAssessmentId)
      } else {
        throw new Error('Keine Assessment-ID verfügbar.')
      }
    } catch (err) {
      console.error('Error bootstrapping assessment:', err)
      setError('Fehler beim Laden des Assessments. Bitte laden Sie die Seite neu.')
      setDebugInfo(
        JSON.stringify({
          endpoint: 'bootstrap',
          error: err instanceof Error ? err.message : String(err),
        }),
      )
      setInitialLoading(false)
      setStatusLoading(false)
    }
  }

  // B6 AK1: Load assessment status from Runtime API
  const loadAssessmentStatus = async (assessmentId: string) => {
    setStatusLoading(true)
    try {
      const response = await fetch(`/api/funnels/stress/assessments/${assessmentId}`, {
        credentials: 'include',
      })

      const statusJson = await response.json()
      
      // Debug: Log response before processing
      setDebugInfo(JSON.stringify({
        endpoint: 'assessment-status',
        ok: response.ok,
        status: response.status,
        body: statusJson,
      }))

      if (!response.ok) {
        const message = statusJson?.error?.message || 'Fehler beim Laden des Assessment-Status.'
        throw new Error(message)
      }

      // Extract data from B8 standardized response format
      const statusData = (statusJson?.data ?? statusJson) as Partial<AssessmentStatus>
      
      // Validate AssessmentStatus structure
      if (!statusData || typeof statusData !== 'object') {
        throw new Error('Ungültige Antwort vom Server: Keine Daten erhalten.')
      }

      if (!statusData.assessmentId || typeof statusData.assessmentId !== 'string') {
        throw new Error('Ungültige Antwort vom Server: AssessmentId fehlt.')
      }

      if (!statusData.currentStep || typeof statusData.currentStep !== 'object') {
        throw new Error('Ungültige Antwort vom Server: CurrentStep fehlt.')
      }

      if (!statusData.currentStep.stepId || typeof statusData.currentStep.stepIndex !== 'number') {
        throw new Error('Ungültige Antwort vom Server: CurrentStep ist unvollständig.')
      }

      if (typeof statusData.totalSteps !== 'number') {
        throw new Error('Ungültige Antwort vom Server: TotalSteps fehlt.')
      }

      // If we got here, statusData is a valid AssessmentStatus
      setAssessmentStatus(statusData as AssessmentStatus)

      // Load existing answers to populate the UI
      const { data: existingAnswers, error: answersError } = await supabase
        .from('assessment_answers')
        .select('question_id, answer_value')
        .eq('assessment_id', assessmentId)

      if (!answersError && existingAnswers) {
        const answersMap: Record<string, number> = {}
        existingAnswers.forEach((a) => {
          answersMap[a.question_id] = a.answer_value
        })
        setAnswers(answersMap)
      }

      setInitialLoading(false)
    } catch (err) {
      console.error('Error loading assessment status:', err)
      setError('Fehler beim Laden des Assessment-Status. Bitte laden Sie die Seite neu.')
      setDebugInfo(JSON.stringify({
        endpoint: 'assessment-status',
        error: err instanceof Error ? err.message : String(err),
      }))
      setInitialLoading(false)
    } finally {
      setStatusLoading(false)
    }
  }

  useEffect(() => {
    const handleConsentCheckFailure = () => {
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

  // B6 AK1: Bootstrap assessment after consent is confirmed
  useEffect(() => {
    if (hasConsent && userId && funnel && !assessmentStatus) {
      bootstrapAssessment()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasConsent, userId, funnel, forceNew])

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

  // B6 AK4: Save answer using Runtime API endpoint
  const saveAnswer = async (questionKey: string, value: number) => {
    if (!assessmentStatus) return

    try {
      const response = await fetch('/api/assessment-answers/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          assessmentId: assessmentStatus.assessmentId,
          questionId: questionKey,
          answerValue: value,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Fehler beim Speichern der Antwort.')
      }
    } catch (err) {
      console.error('Error saving answer:', err)
      setError('Fehler beim Speichern der Antwort. Bitte versuchen Sie es erneut.')
    }
  }

  // Handle answer change with auto-save
  const handleAnswerChange = async (questionKey: string, value: number) => {
    handleSetAnswer(questionKey, value)
    await saveAnswer(questionKey, value)
  }

  // B6 AK3: Validate current step using Runtime API
  const validateCurrentStep = async (): Promise<{ isValid: boolean; nextStep?: unknown }> => {
    if (!funnel || !assessmentStatus) return { isValid: false }

    const currentStep = funnel.steps.find((s) => s.id === assessmentStatus.currentStep.stepId)
    if (!currentStep || !isQuestionStep(currentStep)) return { isValid: true }

    try {
      const response = await fetch(
        `/api/funnels/stress/assessments/${assessmentStatus.assessmentId}/steps/${currentStep.id}`,
        {
          method: 'POST',
          credentials: 'include',
        },
      )

      const json = await response.json()

      if (!response.ok || !json?.success) {
        const message = json?.error?.message || 'Validierung fehlgeschlagen'
        setError(message)
        return { isValid: false }
      }

      const payload = (json.data ?? json) as {
        isValid?: boolean
        missingQuestions?: ValidationError[]
        nextStep?: unknown
      }

      if (!payload?.isValid) {
        const missingQuestions = payload?.missingQuestions ?? []
        setValidationErrors(missingQuestions)

        // Count different types of missing questions
        const requiredCount = missingQuestions.filter((q) => q.reason === 'required').length
        const conditionalCount = missingQuestions.filter(
          (q) => q.reason === 'conditional_required',
        ).length

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
        if (missingQuestions.length > 0) {
          const firstMissing = missingQuestions[0]
          setTimeout(() => {
            const element = document.getElementById(`question-${firstMissing.questionId}`)
            element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 100)
        }

        return { isValid: false }
      }

      setValidationErrors([])
      setError(null)
      return { isValid: true, nextStep: payload.nextStep }
    } catch (err) {
      console.error('Error validating step:', err)
      setError('Fehler bei der Validierung. Bitte versuchen Sie es erneut.')
      return { isValid: false }
    }
  }

  // B6 AK3: Navigate to next step using Runtime API
  const handleNextStep = async () => {
    if (!funnel || !assessmentStatus) return

    setSubmitting(true)
    setError(null)

    try {
      // Validate current step before proceeding
      const validationResult = await validateCurrentStep()
      if (!validationResult.isValid) {
        setSubmitting(false)
        return
      }

      // If there's a next step, reload status to get updated current step
      if (validationResult.nextStep) {
        await loadAssessmentStatus(assessmentStatus.assessmentId)
        window.scrollTo({ top: 0, behavior: 'smooth' })
      } else {
        // No next step - this is the last step, proceed to completion
        await handleComplete()
      }
    } catch (err) {
      console.error('Error in handleNextStep:', err)
      setError(
        err instanceof Error
          ? err.message
          : 'Fehler beim Laden des nächsten Schritts. Bitte versuchen Sie es erneut.'
      )
    } finally {
      setSubmitting(false)
    }
  }

  // B6 AK3: Navigate to previous step
  const handlePreviousStep = () => {
    if (!funnel || !assessmentStatus) return

    const currentStepIndex = assessmentStatus.currentStep.stepIndex
    if (currentStepIndex > 0) {
      // Find previous step by stepIndex
      const previousStep = funnel.steps.find(
        (s) => s.orderIndex === funnel.steps[currentStepIndex - 1]?.orderIndex,
      )

      if (previousStep) {
        // Update assessment status to reflect the previous step
        setAssessmentStatus({
          ...assessmentStatus,
          currentStep: {
            stepId: previousStep.id,
            title: previousStep.title,
            type: previousStep.type,
            stepIndex: currentStepIndex - 1,
            orderIndex: previousStep.orderIndex,
          },
        })
        setError(null)
        setValidationErrors([])
        window.scrollTo({ top: 0, behavior: 'smooth' })
      }
    }
  }

  // B6 AK5: Complete assessment using Runtime API
  const handleComplete = async () => {
    if (!assessmentStatus) {
      console.error('Kein Assessment-Status in handleComplete')
      setError('Es gab ein Problem. Bitte laden Sie die Seite neu.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      const response = await fetch(
        `/api/funnels/stress/assessments/${assessmentStatus.assessmentId}/complete`,
        {
          method: 'POST',
          credentials: 'include',
        },
      )

      const json = await response.json()

      if (!response.ok || !json?.success) {
        const missingQuestions: ValidationError[] =
          json?.error?.details?.missingQuestions || json?.missingQuestions || []

        if (missingQuestions.length > 0) {
          setValidationErrors(missingQuestions)
          setError(json?.error?.message || 'Nicht alle Pflichtfragen wurden beantwortet.')
        } else {
          setError(json?.error?.message || 'Fehler beim Abschließen des Assessments.')
        }

        setSubmitting(false)
        return
      }

      const payload = (json.data ?? json) as { assessmentId?: string }

      // Success - redirect to result page
      const resultAssessmentId = payload.assessmentId || assessmentStatus.assessmentId
      router.push(`/patient/stress-check/result?assessmentId=${resultAssessmentId}`)
    } catch (err) {
      console.error('Fehler in handleComplete:', err)
      const message =
        err instanceof Error
          ? err.message
          : 'Beim Abschließen des Assessments ist ein Fehler aufgetreten.'
      setError(message)
    } finally {
      setSubmitting(false)
    }
  }


  // Defensive: If assessmentStatus or currentStep is missing, show error
  if (initialLoading || statusLoading) {
    return (
      <main className="flex items-center justify-center bg-slate-50 py-20">
        <p className="text-sm text-slate-600">Bitte warten…</p>
      </main>
    )
  }

  if (!funnel) {
    return (
      <main className="flex items-center justify-center bg-slate-50 py-20">
        <p className="text-sm text-red-600">Fehler: Fragen konnten nicht geladen werden.</p>
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

  if (!assessmentStatus || !assessmentStatus.currentStep) {
    console.warn('Invalid assessment status render path', {
      assessmentStatus,
      initialLoading,
      statusLoading,
      debugInfo,
    })
    // Zeige Fehler dauerhaft, blockiere weitere UI (KEIN Redirect mehr möglich)
    window.stop?.() // Bricht evtl. laufende Weiterleitungen ab (nur im Browser)
    return (
      <main className="flex items-center justify-center bg-slate-50 py-20 min-h-screen">
        <div className="max-w-md w-full text-center space-y-4">
          <div className="mx-auto h-12 w-12 rounded-full border-4 border-red-200 border-t-red-500 animate-pulse" />
          <p className="text-base md:text-lg text-red-600 font-medium">
            Fehler: Assessment-Status ungültig.<br />Bitte Seite neu laden oder Support kontaktieren.
          </p>
          <p className="text-sm text-slate-500">
            Es wurden keine gültigen Daten vom Server empfangen.<br />
            Sollte das Problem bestehen, bitte an die Praxis wenden.
          </p>
          {debugEnabled && debugInfo && (
            <pre className="text-left text-[11px] bg-slate-900 text-slate-100 p-3 rounded-lg overflow-auto max-h-60 whitespace-pre-wrap break-words">
              {debugInfo}
            </pre>
          )}
        </div>
      </main>
    )
  }

  // B6 AK2: Render step based on API data
  const currentStep = funnel.steps.find((s) => s.id === assessmentStatus.currentStep.stepId)
  if (!currentStep) {
    return (
      <main className="flex items-center justify-center bg-slate-50 py-20">
        <p className="text-sm text-red-600">Fehler: Aktueller Schritt nicht gefunden.</p>
      </main>
    )
  }

  const isFirstStep = assessmentStatus.currentStep.stepIndex === 0
  const isLastStep = assessmentStatus.currentStep.stepIndex === assessmentStatus.totalSteps - 1

  // Calculate progress based on answered questions
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
            Schritt {assessmentStatus.currentStep.stepIndex + 1} von {assessmentStatus.totalSteps}: {currentStep.title}
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
            <span className="text-xl shrink-0">❌</span>
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
      {debugEnabled && debugInfo && <DebugPanel debugInfo={debugInfo} />}
    </main>
  )
}

function DebugPanel({ debugInfo }: { debugInfo: string }) {
  return (
    <div className="fixed bottom-4 right-4 max-w-md w-[360px] bg-slate-900 text-slate-100 rounded-xl shadow-2xl border border-slate-700 p-3 text-xs leading-snug z-50">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-slate-100">Debug</span>
        <span className="text-[10px] text-slate-400">?debug=1</span>
      </div>
      <pre className="whitespace-pre-wrap break-words max-h-60 overflow-auto">{debugInfo}</pre>
    </div>
  )
}

function StressCheckLoadingFallback() {
  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full text-center space-y-4">
        <div className="mx-auto h-12 w-12 rounded-full border-4 border-slate-200 border-t-sky-500 animate-spin" />
        <p className="text-base md:text-lg text-slate-600 font-medium">
          Lade deinen Stress-Check …
        </p>
        <p className="text-sm text-slate-500">
          Einen kleinen Moment bitte. Wir bereiten deine Fragen vor.
        </p>
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
          className={`shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
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
            <span className="text-lg shrink-0">💡</span>
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
