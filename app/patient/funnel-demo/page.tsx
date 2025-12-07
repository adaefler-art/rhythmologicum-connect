'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import MobileQuestionCard from '@/app/components/MobileQuestionCard'
import type { Funnel, Question } from '@/lib/types/funnel'

// Demo data matching the database schema
const DEMO_FUNNEL: Funnel = {
  id: 'demo-funnel-id',
  slug: 'stress-assessment',
  title: 'Stress & Resilienz Assessment',
  subtitle: 'Fragebogen',
  description: 'Erfassen Sie Ihren aktuellen Stress- und Belastungszustand',
  is_active: true,
  default_theme: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
}

const DEMO_QUESTIONS: Question[] = [
  {
    id: 'q1',
    key: 'stress_frequency',
    label: 'Wie häufig fühlen Sie sich im Alltag gestresst?',
    help_text: 'Denken Sie dabei an die letzten 2-4 Wochen und berücksichtigen Sie sowohl berufliche als auch private Situationen.',
    question_type: 'scale',
    min_value: 0,
    max_value: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'q2',
    key: 'feeling_overwhelmed',
    label: 'Fühlen Sie sich häufig überfordert?',
    help_text: null,
    question_type: 'scale',
    min_value: 0,
    max_value: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'q3',
    key: 'loss_of_control',
    label: 'Wie oft hatten Sie das Gefühl, keine Kontrolle zu haben?',
    help_text: 'Gemeint sind Situationen, in denen Sie sich hilflos oder machtlos gefühlt haben.',
    question_type: 'scale',
    min_value: 0,
    max_value: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'q4',
    key: 'irritability',
    label: 'Wie häufig reagieren Sie angespannt oder gereizt?',
    help_text: null,
    question_type: 'scale',
    min_value: 0,
    max_value: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

export default function FunnelDemoPage() {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number | string>>({})
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    // Check if viewport is mobile (<640px)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  const currentQuestion = DEMO_QUESTIONS[currentIndex]
  const totalQuestions = DEMO_QUESTIONS.length

  const handleAnswerChange = (questionId: string, value: number | string) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: value,
    }))
    setError(null)
  }

  const handleNext = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1)
    } else {
      handleSubmit()
    }
  }

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
      setError(null)
    }
  }

  const handleSubmit = async () => {
    setIsLoading(true)
    setError(null)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Check all questions answered
    const unanswered = DEMO_QUESTIONS.filter((q) => answers[q.id] === undefined)
    if (unanswered.length > 0) {
      setError('Bitte beantworten Sie alle Fragen.')
      setIsLoading(false)
      return
    }

    // Success - redirect to results
    alert('Demo abgeschlossen! Ihre Antworten:\n\n' + JSON.stringify(answers, null, 2))
    setIsLoading(false)
    router.push('/patient')
  }

  // Desktop fallback view
  if (!isMobile) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-4">
            Mobile Question Component Demo
          </h1>
          <p className="text-slate-600 mb-6">
            Diese Demo ist für mobile Geräte optimiert. Bitte verkleinern Sie Ihr Browserfenster auf unter 640px Breite oder öffnen Sie die Seite auf einem mobilen Gerät.
          </p>
        </div>
      </main>
    )
  }

  return (
    <MobileQuestionCard
      funnel={DEMO_FUNNEL}
      question={currentQuestion}
      currentQuestionIndex={currentIndex}
      totalQuestions={totalQuestions}
      value={answers[currentQuestion.id]}
      onChange={handleAnswerChange}
      onNext={handleNext}
      onPrevious={handlePrevious}
      isFirst={currentIndex === 0}
      isLast={currentIndex === totalQuestions - 1}
      isRequired={true}
      error={error}
      isLoading={isLoading}
    />
  )
}
