'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

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
  const funnelId = params.id as string

  const [funnel, setFunnel] = useState<Funnel | null>(null)
  const [steps, setSteps] = useState<Step[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Edit mode state
  const [editingFunnel, setEditingFunnel] = useState(false)
  const [editedFunnel, setEditedFunnel] = useState<Partial<Funnel>>({})
  const [editingStep, setEditingStep] = useState<string | null>(null)
  const [editedStep, setEditedStep] = useState<Partial<Step>>({})

  const loadFunnelDetails = useCallback(async () => {
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
  }, [funnelId])

  useEffect(() => {
    loadFunnelDetails()
  }, [loadFunnelDetails])

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

  const startEditingFunnel = () => {
    setEditingFunnel(true)
    setEditedFunnel({
      title: funnel?.title || '',
      subtitle: funnel?.subtitle || '',
      description: funnel?.description || '',
    })
  }

  const cancelEditingFunnel = () => {
    setEditingFunnel(false)
    setEditedFunnel({})
  }

  const saveFunnelEdit = async () => {
    if (!funnel) return

    try {
      setSaving(true)
      const response = await fetch(`/api/admin/funnels/${funnelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedFunnel.title,
          subtitle: editedFunnel.subtitle,
          description: editedFunnel.description,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update funnel')
      }

      const data = await response.json()
      setFunnel(data.funnel)
      setEditingFunnel(false)
      setEditedFunnel({})
    } catch (err) {
      console.error('Error updating funnel:', err)
      alert('Fehler beim Speichern der Änderungen')
    } finally {
      setSaving(false)
    }
  }

  const startEditingStep = (step: Step) => {
    setEditingStep(step.id)
    setEditedStep({
      title: step.title,
      description: step.description,
    })
  }

  const cancelEditingStep = () => {
    setEditingStep(null)
    setEditedStep({})
  }

  const saveStepEdit = async (stepId: string) => {
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/funnel-steps/${stepId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: editedStep.title,
          description: editedStep.description,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update step')
      }

      await loadFunnelDetails()
      setEditingStep(null)
      setEditedStep({})
    } catch (err) {
      console.error('Error updating step:', err)
      alert('Fehler beim Speichern der Änderungen')
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

        {/* Funnel Header - Editable */}
        <div className="bg-white border border-slate-200 rounded-lg p-6 mb-6">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex-1">
              {editingFunnel ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Titel
                    </label>
                    <input
                      type="text"
                      value={editedFunnel.title || ''}
                      onChange={(e) =>
                        setEditedFunnel({ ...editedFunnel, title: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Untertitel
                    </label>
                    <input
                      type="text"
                      value={editedFunnel.subtitle || ''}
                      onChange={(e) =>
                        setEditedFunnel({ ...editedFunnel, subtitle: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Beschreibung
                    </label>
                    <textarea
                      value={editedFunnel.description || ''}
                      onChange={(e) =>
                        setEditedFunnel({ ...editedFunnel, description: e.target.value })
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveFunnelEdit}
                      disabled={saving}
                      className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Speichert…' : 'Speichern'}
                    </button>
                    <button
                      onClick={cancelEditingFunnel}
                      disabled={saving}
                      className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
                    {funnel.title}
                  </h1>
                  {funnel.subtitle && (
                    <p className="text-lg text-slate-600 mb-2">{funnel.subtitle}</p>
                  )}
                  {funnel.description && (
                    <p className="text-sm text-slate-500 mb-3">{funnel.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-sm text-slate-400">
                    <span>ID: {funnel.slug}</span>
                    <span>•</span>
                    <span>{steps.length} Schritte</span>
                    <span>•</span>
                    <span>
                      {steps.reduce((total, step) => total + step.questions.length, 0)} Fragen
                    </span>
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!editingFunnel && (
                <button
                  onClick={startEditingFunnel}
                  className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Bearbeiten
                </button>
              )}
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
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-slate-900">Schritte</h2>
        {steps.map((step, stepIndex) => (
          <div
            key={step.id}
            className="bg-white border border-slate-200 rounded-lg overflow-hidden"
          >
            {/* Step Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              {editingStep === step.id ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Schritt-Titel
                    </label>
                    <input
                      type="text"
                      value={editedStep.title || ''}
                      onChange={(e) => setEditedStep({ ...editedStep, title: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Schritt-Beschreibung
                    </label>
                    <textarea
                      value={editedStep.description || ''}
                      onChange={(e) =>
                        setEditedStep({ ...editedStep, description: e.target.value })
                      }
                      rows={2}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveStepEdit(step.id)}
                      disabled={saving}
                      className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Speichert…' : 'Speichern'}
                    </button>
                    <button
                      onClick={cancelEditingStep}
                      disabled={saving}
                      className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-1">
                      <span className="text-xs font-semibold text-slate-500 uppercase">
                        Schritt {step.order_index + 1}
                      </span>
                      <span className="text-xs text-slate-400">
                        (Typ: {step.type === 'question_step' ? 'Fragen' : step.type})
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900">{step.title}</h3>
                    {step.description && (
                      <p className="text-sm text-slate-600 mt-1">{step.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEditingStep(step)}
                      className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded transition-colors"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => moveStep(step.id, stepIndex, 'up')}
                      disabled={stepIndex === 0 || saving}
                      className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Nach oben"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveStep(step.id, stepIndex, 'down')}
                      disabled={stepIndex === steps.length - 1 || saving}
                      className="px-3 py-1.5 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Nach unten"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Questions */}
            {step.questions.length > 0 && (
              <div className="divide-y divide-slate-200">
                <div className="px-6 py-3 bg-slate-50 border-b border-slate-200">
                  <h4 className="text-sm font-semibold text-slate-700">Fragen</h4>
                </div>
                {step.questions.map((question) => (
                  <div key={question.id} className="px-6 py-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-500">
                            Frageschlüssel:
                          </span>
                          <span className="text-xs font-mono text-slate-500">
                            {question.key}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-slate-500">Typ:</span>
                          <span className="text-xs text-slate-500">
                            {question.question_type === 'slider'
                              ? 'Schieberegler'
                              : question.question_type === 'text'
                                ? 'Text'
                                : question.question_type === 'select'
                                  ? 'Auswahl'
                                  : question.question_type}
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
                        {question.is_required ? 'Pflichtfeld' : 'Optional'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {step.questions.length === 0 && (
              <div className="px-6 py-4 text-center text-sm text-slate-500">
                Keine Fragen in diesem Schritt
              </div>
            )}
          </div>
        ))}
      </div>

      {steps.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <p className="text-slate-600">Keine Schritte definiert.</p>
        </div>
      )}
    </div>
  )
}
