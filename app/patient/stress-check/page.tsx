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
}

const QUESTIONS: Question[] = [
  {
    id: 'stress_q1',
    text: 'Wie häufig fühlen Sie sich im Alltag gestresst?',
    group: 'stress',
  },
  {
    id: 'stress_q2',
    text: 'Fühlen Sie sich häufig überfordert?',
    group: 'stress',
  },
  {
    id: 'stress_q3',
    text: 'Wie oft hatten Sie das Gefühl, keine Kontrolle zu haben?',
    group: 'stress',
  },
  {
    id: 'stress_q4',
    text: 'Wie häufig reagieren Sie angespannt oder gereizt?',
    group: 'stress',
  },
  {
    id: 'sleep_q1',
    text: 'Wie gut schlafen Sie typischerweise ein?',
    group: 'sleep',
  },
  {
    id: 'sleep_q2',
    text: 'Wie oft wachen Sie nachts auf?',
    group: 'sleep',
  },
  {
    id: 'sleep_q3',
    text: 'Wie erholt fühlen Sie sich morgens beim Aufstehen?',
    group: 'sleep',
  },
  {
    id: 'sleep_q4',
    text: 'Wie oft verspüren Sie Erschöpfung am Tag?',
    group: 'sleep',
  },
]

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

  const totalQuestions = QUESTIONS.length
  const answeredCount = Object.keys(answers).length
  const allAnswered = answeredCount === totalQuestions

  if (initialLoading) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
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
      <main className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-sm text-slate-600">Laden…</p>
      </main>
    )
  }

  const stressQuestions = QUESTIONS.filter((q) => q.group === 'stress')
  const sleepQuestions = QUESTIONS.filter((q) => q.group === 'sleep')

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10">
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
        <div className="mb-6 flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <span>
              Beantwortet: <strong>{answeredCount}</strong> von{' '}
              <strong>{totalQuestions}</strong> Fragen
            </span>
            {!allAnswered && (
              <span>Sie können den Test abschließen, wenn alles ausgefüllt ist.</span>
            )}
          </div>
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-2 bg-sky-500 transition-all"
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
          <p className="mt-6 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <div className="mt-8 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <p className="text-xs text-slate-500 max-w-sm">
            Nach dem Abschicken werden Ihre Antworten anonymisiert ausgewertet.
            Anschließend sehen Sie Ihren persönlichen Stress- und Schlaf-Report.
          </p>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            className="inline-flex justify-center items-center px-4 py-2.5 rounded-lg bg-sky-600 text-white text-sm font-semibold shadow-sm hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {submitting ? 'Bitte warten…' : 'Antworten speichern & weiter'}
          </button>
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
  return (
    <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/60">
      <p className="text-sm font-medium text-slate-900 mb-3">
        <span className="text-slate-400 mr-1">{index}.</span>
        {question.text}
      </p>
      <div className="flex flex-wrap gap-2 md:gap-3">
        {SCALE.map((option) => {
          const id = `${question.id}-${option.value}`
          const checked = value === option.value
          return (
            <label
              key={option.value}
              htmlFor={id}
              className={`flex items-center gap-2 text-xs md:text-sm px-3 py-2 rounded-full border cursor-pointer transition ${
                checked
                  ? 'bg-sky-600 text-white border-sky-600'
                  : 'bg-white text-slate-700 border-slate-200 hover:border-sky-400 hover:bg-sky-50'
              }`}
            >
              <input
                id={id}
                type="radio"
                className="hidden"
                name={question.id}
                value={option.value}
                checked={checked}
                onChange={() => onChange(question.id, option.value)}
              />
              <span className="font-semibold">{option.value}</span>
              <span className="hidden sm:inline">– {option.label}</span>
            </label>
          )
        })}
      </div>
    </div>
  )
}
