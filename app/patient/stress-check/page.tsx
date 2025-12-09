'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { CONSENT_TEXT, CONSENT_VERSION } from '@/lib/consentConfig'
import { supabase } from '@/lib/supabaseClient'
import ConsentModal from './ConsentModal'

type Question = {
  id: string
  text: string
  group: 'stress' | 'sleep'
  helpText: string | null
  isRequired: boolean
}

type StepQuestionPayload = {
  key: string
  label: string
  help_text: string | null
}

type StepQuestionRow = {
  order_index: number
  is_required: boolean
  questions: StepQuestionPayload | StepQuestionPayload[] | null
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
  const [showConsentModal, setShowConsentModal] = useState(false)
  const [hasConsent, setHasConsent] = useState(false)
  const [questions, setQuestions] = useState<Question[]>([])
  const [questionsLoading, setQuestionsLoading] = useState(true)

  // Load questions from database
  useEffect(() => {
    const loadQuestions = async () => {
      try {
        // Get the stress funnel
        const { data: funnel, error: funnelError } = await supabase
          .from('funnels')
          .select('id')
          .eq('slug', 'stress')
          .eq('is_active', true)
          .single()

        if (funnelError) throw funnelError
        if (!funnel) throw new Error('Stress funnel not found')

        // Get funnel steps
        const { data: steps, error: stepsError } = await supabase
          .from('funnel_steps')
          .select('id, order_index')
          .eq('funnel_id', funnel.id)
          .order('order_index', { ascending: true })

        if (stepsError) throw stepsError
        if (!steps || steps.length === 0) {
          throw new Error('No steps found for stress funnel')
        }

        // Get all questions for these steps ordered by step and question order
        const sortedQuestions: Question[] = []
        
        for (const step of steps) {
          const group = step.order_index === 1 ? 'stress' : 'sleep'
          
          const { data: stepQuestions, error: stepQuestionsError } = await supabase
            .from('funnel_step_questions')
            .select(`
              order_index,
              is_required,
              questions (
                key,
                label,
                help_text
              )
            `)
            .eq('funnel_step_id', step.id)
            .order('order_index', { ascending: true })

          if (stepQuestionsError) throw stepQuestionsError

          const normalizedQuestions = ((stepQuestions || []) as StepQuestionRow[])
            .map((sq) => {
              const questionRecord = Array.isArray(sq.questions)
                ? sq.questions[0]
                : sq.questions

              if (!questionRecord) {
                return null
              }

              const questionGroup: Question['group'] = group

              return {
                id: questionRecord.key,
                text: questionRecord.label,
                helpText: questionRecord.help_text,
                group: questionGroup,
                isRequired: sq.is_required,
              }
            })
            .filter((item): item is Question => Boolean(item))

          const questionsInStep = normalizedQuestions
          
          sortedQuestions.push(...questionsInStep)
        }

        setQuestions(sortedQuestions)
      } catch (err) {
        console.error('Error loading questions:', err)
        setError('Fehler beim Laden der Fragen. Bitte laden Sie die Seite neu.')
      } finally {
        setQuestionsLoading(false)
      }
    }

    loadQuestions()
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
  }

  const handleSubmit = async () => {
    if (!userId) {
      console.error('Kein userId in handleSubmit')
      setError(
        'Es gab ein Problem mit der Anmeldung. Bitte melden Sie sich erneut an.'
      )
      router.push('/login')
      return
    }

    // Check for unanswered required questions and provide specific feedback
    if (!allAnswered) {
      const unansweredQuestions = questions.filter(q => answers[q.id] === undefined)
      const requiredUnanswered = unansweredQuestions.filter(q => q.isRequired)
      
      // If there are required questions unanswered, block submission
      if (requiredUnanswered.length > 0) {
        const questionNumbers = requiredUnanswered.map(q => questions.indexOf(q) + 1).join(', ')
        setError(
          `Bitte beantworten Sie alle Pflichtfragen. Fehlend: Frage ${questionNumbers}`
        )
        // Scroll to first unanswered required question
        const firstUnanswered = requiredUnanswered[0]
        if (firstUnanswered) {
          const element = document.getElementById(`question-${firstUnanswered.id}`)
          element?.scrollIntoView({ behavior: 'smooth', block: 'center' })
        }
        return
      }
      
      // Optional questions unanswered - allow but warn
      const questionNumbers = unansweredQuestions.map(q => questions.indexOf(q) + 1).join(', ')
      console.log(`Optional questions unanswered: ${questionNumbers}`)
    }

    setSubmitting(true)
    setError(null)

    try {
      // 1) Patient-Profile holen
      const { data: profileData, error: profileError } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', userId)
        .single()

      console.log('patient_profiles Result:', { profileData, profileError })

      if (profileError) {
        throw profileError
      }
      if (!profileData) {
        throw new Error('Kein Patientenprofil gefunden.')
      }

      // 2) Assessment anlegen
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          patient_id: profileData.id,
          funnel: 'stress',
        })
        .select('id')
        .single()

      console.log('assessments Insert Result:', {
        assessmentData,
        assessmentError,
      })

      if (assessmentError) {
        throw assessmentError
      }
      if (!assessmentData) {
        throw new Error('Assessment konnte nicht angelegt werden.')
      }

      const assessmentId = assessmentData.id

      // 3) Antworten vorbereiten
      const answerRows = Object.entries(answers).map(([qId, value]) => ({
        assessment_id: assessmentId,
        question_id: qId,
        answer_value: value,
      }))

      console.log('Antworten, die gespeichert werden sollen:', answerRows)

      // 4) Antworten speichern
      const { data: insertedAnswers, error: answersError } = await supabase
        .from('assessment_answers')
        .insert(answerRows)
        .select('*')

      console.log('assessment_answers Insert Result:', {
        insertedAnswers,
        answersError,
      })

      if (answersError) {
        throw answersError
      }

      // 5) Weiterleiten zur Result-Seite
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

  const totalQuestions = questions.length
  const requiredQuestions = questions.filter(q => q.isRequired)
  const answeredCount = Object.keys(answers).length
  const requiredAnsweredCount = requiredQuestions.filter(q => answers[q.id] !== undefined).length
  const allAnswered = answeredCount === totalQuestions
  const allRequiredAnswered = requiredAnsweredCount === requiredQuestions.length

  if (initialLoading || questionsLoading) {
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

  const stressQuestions = questions.filter((q) => q.group === 'stress')
  const sleepQuestions = questions.filter((q) => q.group === 'sleep')

  return (
    <main className="bg-slate-50 px-4 py-10">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8">
        {/* Header / Einleitung */}
        <header className="mb-6">
          <p className="text-xs font-medium uppercase tracking-wide text-sky-600 mb-1">
            Stress &amp; Resilienz
          </p>
          <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2">
            Ihr persönlicher Stress- &amp; Schlaf-Check
          </h1>
          <p className="text-sm text-slate-600 leading-relaxed">
            Bitte beantworten Sie die folgenden Fragen so gut es geht nach Ihrem
            Gefühl der letzten Wochen. Es gibt keine richtigen oder falschen
            Antworten – wichtig ist nur, dass es zu Ihnen passt.
          </p>
        </header>

        {/* Fortschritt */}
        <div className="mb-6 flex flex-col gap-3">
          <div className="flex items-center justify-between text-sm md:text-base text-slate-700">
            <span className="font-medium">
              Frage {answeredCount} von {totalQuestions}
            </span>
            {!allRequiredAnswered && (
              <span className="text-xs md:text-sm text-amber-600">
                Pflichtfragen: {requiredAnsweredCount}/{requiredQuestions.length}
              </span>
            )}
          </div>
          <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-3 bg-sky-500 transition-all"
              style={{
                width: `${(answeredCount / totalQuestions) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="space-y-8">
          {/* Stress-Block */}
          <section>
            <h2 className="text-sm font-semibold text-slate-800 mb-3">
              1. Bereich: Umgang mit Stress
            </h2>
            <div className="space-y-4">
              {stressQuestions.map((q, index) => (
                <QuestionCard
                  key={q.id}
                  index={index + 1}
                  question={q}
                  value={answers[q.id]}
                  onChange={handleSetAnswer}
                />
              ))}
            </div>
          </section>

          {/* Schlaf-Block */}
          <section>
            <h2 className="text-sm font-semibold text-slate-800 mb-3">
              2. Bereich: Schlaf &amp; Erholung
            </h2>
            <div className="space-y-4">
              {sleepQuestions.map((q, index) => (
                <QuestionCard
                  key={q.id}
                  index={index + 1 + stressQuestions.length}
                  question={q}
                  value={answers[q.id]}
                  onChange={handleSetAnswer}
                />
              ))}
            </div>
          </section>
        </div>

        {error && (
          <div className="mt-6 text-sm md:text-base text-red-700 bg-red-50 border-2 border-red-200 rounded-xl px-4 py-3.5 flex items-start gap-3">
            <span className="text-xl flex-shrink-0">❌</span>
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        <div className="mt-8 flex flex-col gap-4">
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allRequiredAnswered || submitting}
            className="w-full inline-flex justify-center items-center px-6 py-4 md:py-5 rounded-xl bg-sky-600 text-white text-base md:text-lg font-semibold shadow-md hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:bg-sky-600 transition-all"
            style={{ minHeight: '56px' }}
          >
            {submitting ? (
              <>
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Bitte warten…
              </>
            ) : (
              <>
                {allRequiredAnswered ? '✓ ' : ''}Antworten speichern & weiter
              </>
            )}
          </button>
          <p className="text-xs md:text-sm text-slate-500 text-center leading-relaxed px-4">
            Nach dem Abschicken werden Ihre Antworten anonymisiert ausgewertet.
            Anschließend sehen Sie Ihren persönlichen Stress- und Schlaf-Report.
          </p>
        </div>
      </div>
    </main>
  )
}

type QuestionCardProps = {
  index: number
  question: Question
  value?: number
  onChange: (id: string, value: number) => void
}

function QuestionCard({ index, question, value, onChange }: QuestionCardProps) {
  const isAnswered = value !== undefined
  
  return (
    <div 
      id={`question-${question.id}`}
      className={`border-2 rounded-xl p-5 md:p-6 transition-all ${
        isAnswered 
          ? 'border-sky-200 bg-sky-50/30' 
          : 'border-slate-200 bg-white'
      }`}
    >
      <div className="flex items-start gap-3 mb-4">
        <span className={`flex-shrink-0 flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
          isAnswered 
            ? 'bg-sky-600 text-white' 
            : 'bg-slate-200 text-slate-600'
        }`}>
          {index}
        </span>
        <div className="flex-1">
          <div className="flex items-start gap-2">
            <p className="text-base md:text-lg font-medium text-slate-900 leading-relaxed pt-1 flex-1">
              {question.text}
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
      {!isAnswered && question.isRequired && (
        <p className="text-xs md:text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mb-3">
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
                onChange={() => onChange(question.id, option.value)}
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
