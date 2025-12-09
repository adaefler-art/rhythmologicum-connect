'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'

type Question = {
  id: string
  key: string
  label: string
  help_text: string | null
  question_type: string
  funnel_step_question_id: string
  is_required: boolean
  order_index: number
}

type Step = {
  id: string
  funnel_id: string
  order_index: number
  title: string
  description: string | null
  type: string
  questions: Question[]
}

type Funnel = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function FunnelDetailPage() {
  const params = useParams()
  const router = useRouter()
  const funnelId = params.id as string

  const [funnel, setFunnel] = useState<Funnel | null>(null)
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadFunnelDetails()
  }, [funnelId])

  const loadFunnelDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/funnels/${funnelId}`)

      if (!response.ok) {
        throw new Error('Failed to load funnel details')
      }

      const data = await response.json()
      setFunnel(data.funnel)
      setSteps(data.steps || [])
    } catch (err) {
      console.error('Error loading funnel details:', err)
      setError('Fehler beim Laden der Funnel-Details')
    } finally {
      setLoading(false)
    }
  }

  const toggleFunnelActive = async () => {
    if (!funnel) return

    try {
      setSaving(true)
      const response = await fetch(`/api/admin/funnels/${funnelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !funnel.is_active }),
      })

      if (!response.ok) {
        throw new Error('Failed to update funnel')
      }

      const data = await response.json()
      setFunnel(data.funnel)
    } catch (err) {
      console.error('Error updating funnel:', err)
      alert('Fehler beim Aktualisieren des Funnels')
    } finally {
      setSaving(false)
    }
  }

  const toggleQuestionRequired = async (questionId: string, currentRequired: boolean) => {
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/funnel-step-questions/${questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_required: !currentRequired }),
      })

      if (!response.ok) {
        throw new Error('Failed to update question')
      }

      // Reload data
      await loadFunnelDetails()
    } catch (err) {
      console.error('Error updating question:', err)
      alert('Fehler beim Aktualisieren der Frage')
    } finally {
      setSaving(false)
    }
  }

  const moveStep = async (stepId: string, currentIndex: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1

    // Check bounds
    if (newIndex < 0 || newIndex >= steps.length) return

    try {
      setSaving(true)

      // Get the other step that we're swapping with
      const otherStep = steps[newIndex]

      // Update both steps
      await Promise.all([
        fetch(`/api/admin/funnel-steps/${stepId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_index: newIndex }),
        }),
        fetch(`/api/admin/funnel-steps/${otherStep.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order_index: currentIndex }),
        }),
      ])

      // Reload data
      await loadFunnelDetails()
    } catch (err) {
      console.error('Error moving step:', err)
      alert('Fehler beim Verschieben des Steps')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-600">Lade Funnel-Details…</p>
        </div>
      </div>
    )
  }

  if (error || !funnel) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error || 'Funnel nicht gefunden'}</p>
        </div>
        <div className="mt-4">
          <Link
            href="/clinician/funnels"
            className="inline-flex items-center text-sm text-sky-600 hover:text-sky-700 font-medium"
          >
            ← Zurück zur Übersicht
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4">
          <Link
            href="/clinician/funnels"
            className="inline-flex items-center text-sm text-sky-600 hover:text-sky-700 font-medium"
          >
            ← Zurück zur Übersicht
          </Link>
        </div>

        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              {funnel.title}
            </h1>
            {funnel.subtitle && (
              <p className="text-lg text-slate-600 mb-2">{funnel.subtitle}</p>
            )}
            <div className="flex items-center gap-3 text-sm text-slate-500">
              <span>Slug: {funnel.slug}</span>
              <span>•</span>
              <span>{steps.length} Steps</span>
              <span>•</span>
              <span>
                {steps.reduce((total, step) => total + step.questions.length, 0)} Fragen
              </span>
            </div>
          </div>

          <button
            onClick={toggleFunnelActive}
            disabled={saving}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
              funnel.is_active
                ? 'bg-green-100 text-green-800 hover:bg-green-200'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {saving ? 'Speichert…' : funnel.is_active ? 'Aktiv' : 'Inaktiv'}
          </button>
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-6">
        {steps.map((step, stepIndex) => (
          <div
            key={step.id}
            className="bg-white border border-slate-200 rounded-lg overflow-hidden"
          >
            {/* Step Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xs font-semibold text-slate-500 uppercase">
                      Step {step.order_index + 1}
                    </span>
                    <span className="text-xs text-slate-500">({step.type})</span>
                  </div>
                  <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                  {step.description && (
                    <p className="text-sm text-slate-600 mt-1">{step.description}</p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => moveStep(step.id, stepIndex, 'up')}
                    disabled={stepIndex === 0 || saving}
                    className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Nach oben verschieben"
                  >
                    ↑
                  </button>
                  <button
                    onClick={() => moveStep(step.id, stepIndex, 'down')}
                    disabled={stepIndex === steps.length - 1 || saving}
                    className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Nach unten verschieben"
                  >
                    ↓
                  </button>
                </div>
              </div>
            </div>

            {/* Questions */}
            {step.questions.length > 0 && (
              <div className="divide-y divide-slate-200">
                {step.questions.map((question) => (
                  <div key={question.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-mono text-slate-500">
                            {question.key}
                          </span>
                          <span className="text-xs text-slate-400">
                            ({question.question_type})
                          </span>
                        </div>
                        <p className="text-sm font-medium text-slate-900 mb-1">
                          {question.label}
                        </p>
                        {question.help_text && (
                          <p className="text-xs text-slate-600">{question.help_text}</p>
                        )}
                      </div>

                      <button
                        onClick={() =>
                          toggleQuestionRequired(
                            question.funnel_step_question_id,
                            question.is_required
                          )
                        }
                        disabled={saving}
                        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                          question.is_required
                            ? 'bg-orange-100 text-orange-800 hover:bg-orange-200'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        } disabled:opacity-50 disabled:cursor-not-allowed`}
                      >
                        {question.is_required ? 'Pflicht' : 'Optional'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step.questions.length === 0 && (
              <div className="px-6 py-4 text-center text-sm text-slate-500">
                Keine Fragen in diesem Step
              </div>
            )}
          </div>
        ))}
      </div>

      {steps.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <p className="text-slate-600">Keine Steps definiert.</p>
        </div>
      )}
    </div>
  )
}
