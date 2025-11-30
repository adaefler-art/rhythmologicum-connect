'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

const QUESTIONS = [
  { id: 'stress_q1', text: 'Wie häufig fühlst du dich im Alltag gestresst?' },
  { id: 'stress_q2', text: 'Fühlst du dich häufig überfordert?' },
  { id: 'stress_q3', text: 'Wie oft hattest du das Gefühl, keine Kontrolle zu haben?' },
  { id: 'stress_q4', text: 'Wie häufig reagierst du angespannt oder gereizt?' },
  { id: 'sleep_q1', text: 'Wie gut schläfst du typischerweise ein?' },
  { id: 'sleep_q2', text: 'Wie oft wachst du nachts auf?' },
  { id: 'sleep_q3', text: 'Wie erholt fühlst du dich morgens beim Aufstehen?' },
  { id: 'sleep_q4', text: 'Wie oft verspürst du Erschöpfung am Tag?' },
]

const SCALE = [0, 1, 2, 3, 4]

export default function StressCheckPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)
  const [answers, setAnswers] = useState<Record<string, number>>({})

  useEffect(() => {
    const checkAuth = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (!user) {
        router.push('/login')
        return
      }

      setUserId(user.id)
      setLoading(false)
    }

    checkAuth()
  }, [router])

  const handleSetAnswer = (qId: string, value: number) => {
    setAnswers((prev) => ({ ...prev, [qId]: value }))
  }

  const handleSubmit = async () => {
    if (!userId) return

    setLoading(true)

    try {
      // 1) Patient Profile holen
      const { data: profileData } = await supabase
        .from('patient_profiles')
        .select('id')
        .eq('user_id', userId)
        .single()

      if (!profileData) throw new Error('Kein patient_profile gefunden')

      // 2) Neues Assessment anlegen
      const { data: assessmentData, error: assessmentError } = await supabase
        .from('assessments')
        .insert({
          patient_id: profileData.id,
          funnel: 'stress',
        })
        .select()
        .single()

      if (assessmentError) throw assessmentError

      const assessmentId = assessmentData.id

      // 3) Antworten speichern
      const answerRows = Object.entries(answers).map(([qId, value]) => ({
        assessment_id: assessmentId,
        question_id: qId,
        answer_value: value,
      }))

      const { error: answersError } = await supabase
        .from('assessment_answers')
        .insert(answerRows)

      if (answersError) throw answersError

      // 4) Weiterleiten zur Result-Seite
      router.push(`/patient/stress-check/result?assessment=${assessmentId}`)
    } catch (err: any) {
      console.error('Fehler:', err.message)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Bitte warten…</p>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-4">Stress & Resilienz – Fragebogen</h1>

      <div className="space-y-6">
        {QUESTIONS.map((q) => (
          <div key={q.id} className="border rounded p-4">
            <p className="font-medium mb-2">{q.text}</p>
            <div className="flex gap-4">
              {SCALE.map((val) => (
                <label key={val} className="flex items-center gap-1">
                  <input
                    type="radio"
                    name={q.id}
                    value={val}
                    onChange={() => handleSetAnswer(q.id, val)}
                  />
                  {val}
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>

      <button
        className="mt-6 px-4 py-2 bg-black text-white rounded disabled:opacity-50"
        onClick={handleSubmit}
        disabled={Object.keys(answers).length !== QUESTIONS.length}
      >
        Antworten speichern & weiter
      </button>
    </main>
  )
}
