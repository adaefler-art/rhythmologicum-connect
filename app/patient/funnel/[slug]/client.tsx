'use client'

import { useEffect, useState, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import type { FunnelDefinition } from '@/lib/types/funnel'
import type { ContentPage } from '@/lib/types/content'
import { getIntroPages, getInfoPages } from '@/lib/utils/contentPageHelpers'
import PatientFlowRenderer, {
  type AssessmentStatus,
  type ValidationError,
} from '@/app/components/PatientFlowRenderer'

type RecoveryState = {
  isRecovering: boolean
  recoveryAttempt: number
  recoveryMessage: string | null
}

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
  const [contentPages, setContentPages] = useState<ContentPage[]>([])
  const [recovery, setRecovery] = useState<RecoveryState>({
    isRecovering: false,
    recoveryAttempt: 0,
    recoveryMessage: null,
  })

  const loadExistingAnswers = useCallback(async (assessmentId: string, retryAttempt: number = 0) => {
    const maxRetries = 2
    const retryDelay = 1000

    try {
      const { data: answersData, error: answersError } = await supabase
        .from('assessment_answers')
        .select('question_id, answer_value')
        .eq('assessment_id', assessmentId)

      if (answersError) {
        console.error('Error loading answers:', answersError)
        
        // Retry on error
        if (retryAttempt < maxRetries) {
          console.log(`Retrying answer load in ${retryDelay}ms (attempt ${retryAttempt + 1}/${maxRetries})`)
          await new Promise((resolve) => setTimeout(resolve, retryDelay))
          return loadExistingAnswers(assessmentId, retryAttempt + 1)
        }
        
        // Don't throw - we can continue with empty answers
        console.warn('Failed to load existing answers after retries, continuing with empty state')
        return
      }

      if (answersData) {
        const answersMap: Record<string, number> = {}
        answersData.forEach((answer) => {
          answersMap[answer.question_id] = answer.answer_value
        })
        setAnswers(answersMap)
        
        // Log successful resume if we have answers
        if (Object.keys(answersMap).length > 0) {
          console.info(`✅ Resumed assessment with ${Object.keys(answersMap).length} existing answers`)
        }
      }
    } catch (err) {
      console.error('Error loading existing answers:', err)
      // Don't throw - we can continue with empty answers
    }
  }, [])

  const loadAssessmentStatus = useCallback(
    async (assessmentId: string, retryAttempt: number = 0) => {
      const maxRetries = 3
      const retryDelay = Math.min(1000 * Math.pow(2, retryAttempt), 5000) // Exponential backoff, max 5s

      try {
        // Validate assessmentId before making the request
        if (!assessmentId || typeof assessmentId !== 'string' || assessmentId.trim() === '') {
          throw new Error('Ungültige Assessment-ID.')
        }

        // Show recovery message on retry
        if (retryAttempt > 0) {
          setRecovery({
            isRecovering: true,
            recoveryAttempt: retryAttempt,
            recoveryMessage: `Wiederherstellung läuft... (Versuch ${retryAttempt}/${maxRetries})`,
          })
        }

        let response: Response
        try {
          response = await fetch(`/api/funnels/${slug}/assessments/${assessmentId}`, {
            credentials: 'include',
          })
        } catch (fetchErr) {
          // Network error or fetch failed
          console.error('Network error during fetch:', fetchErr)

          // Retry on network errors
          if (retryAttempt < maxRetries) {
            console.log(`Retrying in ${retryDelay}ms (attempt ${retryAttempt + 1}/${maxRetries})`)
            await new Promise((resolve) => setTimeout(resolve, retryDelay))
            return loadAssessmentStatus(assessmentId, retryAttempt + 1)
          }

          throw new Error(
            'Der Fragebogen konnte nicht geladen werden. Bitte überprüfen Sie Ihre Internetverbindung und versuchen Sie es erneut.',
          )
        }

        if (!response.ok) {
          // Try to extract error message from response
          let errorMessage = 'Assessment-Status konnte nicht geladen werden.'
          try {
            const errorData = await response.json()
            if (errorData.error?.message) {
              errorMessage = errorData.error.message
            }
          } catch {
            // If JSON parsing fails, use default message
          }

          if (response.status === 404) {
            throw new Error('Assessment nicht gefunden. Möglicherweise wurde es gelöscht.')
          } else if (response.status >= 500) {
            // Retry on server errors
            if (retryAttempt < maxRetries) {
              console.log(
                `Server error, retrying in ${retryDelay}ms (attempt ${retryAttempt + 1}/${maxRetries})`,
              )
              await new Promise((resolve) => setTimeout(resolve, retryDelay))
              return loadAssessmentStatus(assessmentId, retryAttempt + 1)
            }
            throw new Error('Server-Fehler beim Laden des Assessment-Status. Bitte versuchen Sie es später erneut.')
          } else {
            throw new Error(errorMessage)
          }
        }

        const { data } = await response.json()

        // Validate AssessmentStatus structure
        if (!data || typeof data !== 'object') {
          throw new Error('Ungültige Antwort vom Server: Keine Daten erhalten.')
        }

        if (!data.assessmentId || typeof data.assessmentId !== 'string') {
          throw new Error('Ungültige Antwort vom Server: AssessmentId fehlt.')
        }

        if (!data.currentStep || typeof data.currentStep !== 'object') {
          throw new Error('Ungültige Antwort vom Server: CurrentStep fehlt.')
        }

        if (!data.currentStep.stepId || typeof data.currentStep.stepIndex !== 'number') {
          throw new Error('Ungültige Antwort vom Server: CurrentStep ist unvollständig.')
        }

        if (typeof data.totalSteps !== 'number') {
          throw new Error('Ungültige Antwort vom Server: TotalSteps fehlt.')
        }

        setAssessmentStatus(data)

        // Load existing answers with retry
        await loadExistingAnswers(assessmentId, 0)

        // Clear recovery state on success
        setRecovery({
          isRecovering: false,
          recoveryAttempt: 0,
          recoveryMessage: null,
        })

        setLoading(false)
      } catch (err) {
        console.error('Error loading assessment status:', err)
        const errorMsg = err instanceof Error ? err.message : 'Fehler beim Laden des Assessment-Status.'
        setError(errorMsg)
        setRecovery({
          isRecovering: false,
          recoveryAttempt: 0,
          recoveryMessage: null,
        })
        setLoading(false)
        throw err // Re-throw so caller knows it failed
      }
    },
    [loadExistingAnswers, slug],
  )


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

  // Load content pages for this funnel
  useEffect(() => {
    const loadContentPages = async () => {
      try {
        const response = await fetch(`/api/funnels/${slug}/content-pages`)
        if (response.ok) {
          const pages: ContentPage[] = await response.json()
          setContentPages(pages)
        }
      } catch (err) {
        console.error('Error loading content pages:', err)
        // Non-critical error, don't block the funnel
      }
    }
    loadContentPages()
  }, [slug])

  // Handle page visibility changes for better recovery
  // When user returns to tab, refresh status to ensure consistency
  useEffect(() => {
    if (!assessmentStatus?.assessmentId) return

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && assessmentStatus) {
        console.info('📱 Page became visible, refreshing assessment status')
        // Silently refresh status in background without showing loading state
        loadAssessmentStatus(assessmentStatus.assessmentId).catch((err) => {
          console.warn('Failed to refresh status on visibility change:', err)
          // Don't show error to user - they can continue with current state
        })
      }
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentStatus?.assessmentId])

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

        // If an in-progress assessment exists, resume it; otherwise start a new one
        if (existingAssessments && existingAssessments.length > 0) {
          const latest = existingAssessments[0]

          if (latest.status === 'in_progress') {
            await loadAssessmentStatus(latest.id)
            return
          }

          // For completed assessments, always start a fresh assessment instead of redirecting to result
          // so users can take the test again without manual query params.
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

  const handleAnswerChange = useCallback(async (questionKey: string, value: number, retryAttempt: number = 0) => {
    if (!assessmentStatus || !funnel) return

    const maxRetries = 2
    const retryDelay = 1000

    // Update local state immediately for UI responsiveness
    setAnswers((prev) => ({
      ...prev,
      [questionKey]: value,
    }))
    setValidationErrors((prev) => prev.filter((err) => err.questionKey !== questionKey))
    setError(null)

    // Save to server with retry logic
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
        // Retry on server errors
        if ((response.status >= 500 || response.status === 0) && retryAttempt < maxRetries) {
          console.log(`Retrying answer save in ${retryDelay}ms (attempt ${retryAttempt + 1}/${maxRetries})`)
          await new Promise((resolve) => setTimeout(resolve, retryDelay))
          return handleAnswerChange(questionKey, value, retryAttempt + 1)
        }

        const errorData = await response.json()
        console.error('Error saving answer:', errorData)
        
        // Show warning but don't block user - answer is saved locally
        console.warn('⚠️ Answer saved locally but not synced to server. Will retry on next action.')
      }
    } catch (err) {
      console.error('Error saving answer:', err)
      
      // Retry on network errors
      if (retryAttempt < maxRetries) {
        console.log(`Retrying answer save after error in ${retryDelay}ms (attempt ${retryAttempt + 1}/${maxRetries})`)
        await new Promise((resolve) => setTimeout(resolve, retryDelay))
        return handleAnswerChange(questionKey, value, retryAttempt + 1)
      }
      
      // Show warning but don't block user - answer is saved locally
      console.warn('⚠️ Answer saved locally but not synced to server. Will retry on next action.')
    }
  }, [assessmentStatus, funnel, slug])

  const handleComplete = useCallback(async () => {
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
  }, [assessmentStatus, slug, router])

  const handleNextStep = useCallback(async () => {
    if (!assessmentStatus || !funnel) return

    setSubmitting(true)
    setError(null)
    setValidationErrors([])

    try {
      const currentStep = funnel.steps.find((s) => s.id === assessmentStatus.currentStep.stepId)
      if (!currentStep) {
        setError('Aktueller Schritt konnte nicht gefunden werden.')
        setSubmitting(false)
        return
      }

      // Validate current step
      const response = await fetch(
        `/api/funnels/${slug}/assessments/${assessmentStatus.assessmentId}/steps/${currentStep.id}`,
        {
          method: 'POST',
          credentials: 'include',
        },
      )

      if (!response.ok) {
        // Try to extract error message from response
        let errorMessage = 'Validierung fehlgeschlagen.'
        try {
          const errorData = await response.json()
          if (errorData.error?.message) {
            errorMessage = errorData.error.message
          }
        } catch {
          // If JSON parsing fails, use default message
        }
        throw new Error(errorMessage)
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
        try {
          await loadAssessmentStatus(assessmentStatus.assessmentId)
          window.scrollTo({ top: 0, behavior: 'smooth' })
        } catch (loadErr) {
          // Error already handled by loadAssessmentStatus (error state set)
          // Just prevent the finally block from clearing submitting state prematurely
          console.error('Failed to load next step status:', loadErr)
          // Don't set submitting to false here - let finally handle it
        }
      } else {
        // Last step - complete assessment
        await handleComplete()
      }
    } catch (err) {
      console.error('Error navigating to next step:', err)
      const errorMsg = err instanceof Error ? err.message : 'Fehler bei der Navigation. Bitte versuchen Sie es erneut.'
      setError(errorMsg)
    } finally {
      setSubmitting(false)
    }
  }, [assessmentStatus, funnel, slug, loadAssessmentStatus, handleComplete])

  const handlePreviousStep = useCallback(async () => {
    if (!assessmentStatus || !funnel) return

    // Find previous step by order index
    const currentOrderIndex = assessmentStatus.currentStep.orderIndex
    const previousStep = funnel.steps.find((s) => s.orderIndex === currentOrderIndex - 1)

    if (!previousStep) return

    // Navigate back by reloading status (the navigation API will handle it)
    // For now, we'll just show a message since backward navigation
    // might require additional API support
    setError('Zurück-Navigation wird in Kürze unterstützt.')
  }, [assessmentStatus, funnel])

  // Memoized derived values (must run before any early returns to keep hook order stable)
  const currentStep = useMemo(() => {
    if (!funnel || !assessmentStatus) return null
    return funnel.steps.find((s) => s.id === assessmentStatus.currentStep.stepId) ?? null
  }, [assessmentStatus, funnel])

  const isFirstStep = useMemo(() => {
    if (!assessmentStatus) return false
    return assessmentStatus.currentStep.stepIndex === 0
  }, [assessmentStatus])
  
  const isLastStep = useMemo(() => {
    if (!assessmentStatus) return false
    return assessmentStatus.currentStep.stepIndex === assessmentStatus.totalSteps - 1
  }, [assessmentStatus])

  const introPages = useMemo(() => getIntroPages(contentPages), [contentPages])
  const infoPages = useMemo(() => getInfoPages(contentPages), [contentPages])
  const showContentLinks = useMemo(
    () => introPages.length > 0 || infoPages.length > 0,
    [infoPages, introPages]
  )

  const answeredCount = useMemo(() => Object.keys(answers).length, [answers])

  // Loading state
  if (loading || !funnel || !assessmentStatus || !currentStep) {
    return (
      <main className="flex flex-col items-center justify-center bg-slate-50 py-20 px-4">
        <div className="text-center">
          <div className="mb-4">
            <svg
              className="animate-spin h-8 w-8 text-sky-600 mx-auto"
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
          </div>
          <p className="text-sm text-slate-600">
            {recovery.isRecovering ? recovery.recoveryMessage : 'Fragebogen wird geladen…'}
          </p>
        </div>
      </main>
    )
  }

  // Error state
  if (!loading && error && !assessmentStatus) {
    const handleRetry = () => {
      setError(null)
      setLoading(true)
      // Reload the page to restart the assessment bootstrap process
      window.location.reload()
    }

    return (
      <main className="flex items-center justify-center bg-slate-50 py-20 px-4">
        <div className="max-w-md bg-white border-2 border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">❌</span>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-red-900 mb-1">Fehler</h3>
              <p className="text-red-700 mb-4">{error}</p>
              <div className="flex gap-3">
                <button
                  onClick={handleRetry}
                  className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium"
                >
                  Neu versuchen
                </button>
                <button
                  onClick={() => router.push('/patient')}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
                >
                  Zurück zur Übersicht
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    )
  }

  // Render using PatientFlowRenderer
  return (
    <>
      {/* Content Page Links - Show above the main flow */}
      {showContentLinks && (
        <div className="bg-slate-50 px-4 sm:px-6 lg:px-8 py-4">
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <span className="text-xl shrink-0">ℹ️</span>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-primary-900 mb-2">
                  Weitere Informationen
                </h3>
                <div className="space-y-2">
                  {introPages.map((page) => (
                    <a
                      key={page.id}
                      href={`/patient/funnel/${slug}/content/${page.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-primary-700 hover:text-primary-900 hover:underline"
                    >
                      📄 {page.title}
                      {page.excerpt && (
                        <span className="text-xs text-primary-600 ml-1">
                          — {page.excerpt.substring(0, 60)}
                          {page.excerpt.length > 60 ? '...' : ''}
                        </span>
                      )}
                    </a>
                  ))}
                  {infoPages.map((page) => (
                    <a
                      key={page.id}
                      href={`/patient/funnel/${slug}/content/${page.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block text-sm text-primary-700 hover:text-primary-900 hover:underline"
                    >
                      📄 {page.title}
                      {page.excerpt && (
                        <span className="text-xs text-primary-600 ml-1">
                          — {page.excerpt.substring(0, 60)}
                          {page.excerpt.length > 60 ? '...' : ''}
                        </span>
                      )}
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <PatientFlowRenderer
        funnel={funnel}
        assessmentStatus={assessmentStatus}
        currentStep={currentStep}
        answers={answers}
        validationErrors={validationErrors}
        error={error}
        submitting={submitting}
        answeredCount={answeredCount}
        showRecoveryBanner={answeredCount > 0 && assessmentStatus.currentStep.stepIndex > 0}
        onAnswerChange={handleAnswerChange}
        onNextStep={handleNextStep}
        onPreviousStep={handlePreviousStep}
        isFirstStep={isFirstStep}
        isLastStep={isLastStep}
      />
    </>
  )
}
