'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Input, Textarea, LoadingSpinner, ErrorState } from '@/lib/ui'

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
  content_page_id: string | null
  content_page?: {
    id: string
    slug: string
    title: string
    excerpt: string | null
    status: string
  } | null
  questions: Question[]
}

type Funnel = {
  id: string
  slug: string
  title: string
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

type FunnelVersion = {
  id: string
  funnel_id: string
  version: string
  is_default: boolean
  rollout_percent: number
  algorithm_bundle_version: string
  prompt_version: string
  created_at: string
  updated_at: string | null
}

// Translation helpers
const translateQuestionType = (type: string): string => {
  const translations: Record<string, string> = {
    slider: 'Schieberegler',
    text: 'Text',
    select: 'Auswahl',
    textarea: 'Textfeld',
    radio: 'Optionsfeld',
    checkbox: 'Kontrollkästchen',
  }
  return translations[type] || type
}

const translateStepType = (type: string): string => {
  const translations: Record<string, string> = {
    question_step: 'Fragen',
    form: 'Formular',
    info_step: 'Informationsschritt',
    info: 'Info',
    content_page: 'Inhaltsseite',
    summary: 'Zusammenfassung',
  }
  return translations[type] || type
}

// UUID regex pattern for strict validation
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function isUUID(value: string): boolean {
  return UUID_PATTERN.test(value)
}

export default function FunnelDetailPage() {
  const params = useParams()
  const identifier = params.identifier as string
  const isId = isUUID(identifier)

  const [funnel, setFunnel] = useState<Funnel | null>(null)
  const [steps, setSteps] = useState<Step[]>([])
  const [versions, setVersions] = useState<FunnelVersion[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)

  // Edit mode state
  const [editingFunnel, setEditingFunnel] = useState(false)
  const [editedFunnel, setEditedFunnel] = useState<Partial<Funnel>>({})
  const [editingStep, setEditingStep] = useState<string | null>(null)
  const [editedStep, setEditedStep] = useState<Partial<Step>>({})

  type Envelope<T> = {
    success?: boolean
    data?: T
    error?: { message?: string; requestId?: string; details?: { requestId?: string } }
  }

  function asEnvelope<T>(value: unknown): Envelope<T> | null {
    return value && typeof value === 'object' ? (value as Envelope<T>) : null
  }

  const loadFunnelDetails = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/admin/funnels/${identifier}`)

      if (!response.ok) {
        let requestId = response.headers.get('x-request-id')
        let message = 'Failed to load funnel details'

        try {
          const json: unknown = await response.json()
          const envelope = asEnvelope<unknown>(json)
          const errorMessage = envelope?.error?.message
          const errorRequestId = envelope?.error?.requestId || envelope?.error?.details?.requestId
          if (typeof errorMessage === 'string' && errorMessage.length > 0) message = errorMessage
          if (typeof errorRequestId === 'string' && errorRequestId.length > 0) requestId = errorRequestId
        } catch {
          // ignore json parse errors
        }

        throw new Error(requestId ? `${message} (requestId: ${requestId})` : message)
      }

      const json: unknown = await response.json()
      const envelope = asEnvelope<{ funnel?: Funnel; steps?: Step[]; versions?: FunnelVersion[] }>(json)
      const funnelData = envelope?.data?.funnel
      const stepsData = envelope?.data?.steps
      const versionsData = envelope?.data?.versions

      setFunnel(funnelData ?? null)
      setSteps(Array.isArray(stepsData) ? stepsData : [])
      setVersions(Array.isArray(versionsData) ? versionsData : [])
    } catch (err) {
      console.error('Error loading funnel details:', err)
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Funnel-Details')
    } finally {
      setLoading(false)
    }
  }, [identifier])

  useEffect(() => {
    loadFunnelDetails()
  }, [loadFunnelDetails])

  const toggleFunnelActive = async () => {
    if (!funnel) return

    try {
      setSaving(true)
      const response = await fetch(`/api/admin/funnels/${identifier}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_active: !funnel.is_active }),
      })

      if (!response.ok) {
        let requestId = response.headers.get('x-request-id')
        let message = 'Failed to update funnel'

        try {
          const json: unknown = await response.json()
          const envelope = asEnvelope<unknown>(json)
          const errorMessage = envelope?.error?.message
          const errorRequestId = envelope?.error?.requestId || envelope?.error?.details?.requestId
          if (typeof errorMessage === 'string' && errorMessage.length > 0) message = errorMessage
          if (typeof errorRequestId === 'string' && errorRequestId.length > 0) requestId = errorRequestId
        } catch {
          // ignore
        }

        throw new Error(requestId ? `${message} (requestId: ${requestId})` : message)
      }

      const json: unknown = await response.json()
      const envelope = asEnvelope<{ funnel?: Funnel }>(json)
      setFunnel(envelope?.data?.funnel ?? null)
    } catch (err) {
      console.error('Error updating funnel:', err)
      alert(`Fehler beim Aktualisieren des Funnels: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`)
    } finally {
      setSaving(false)
    }
  }

  const startEditingFunnel = () => {
    setEditingFunnel(true)
    setEditedFunnel({
      title: funnel?.title || '',
      description: funnel?.description || '',
    })
  }

  const cancelEditingFunnel = () => {
    setEditingFunnel(false)
    setEditedFunnel({})
  }

  const saveFunnelEdit = async () => {
    if (!funnel) return

    // Client-side validation
    const title = editedFunnel.title?.trim() || ''
    if (title.length === 0) {
      alert('Titel darf nicht leer sein')
      return
    }
    if (title.length > 255) {
      alert('Titel ist zu lang (maximal 255 Zeichen)')
      return
    }

    const description = editedFunnel.description?.trim() || ''
    if (description.length > 2000) {
      alert('Beschreibung ist zu lang (maximal 2000 Zeichen)')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/admin/funnels/${identifier}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
        }),
      })

      if (!response.ok) {
        let requestId = response.headers.get('x-request-id')
        let message = 'Failed to update funnel'

        try {
          const json: unknown = await response.json()
          const envelope = asEnvelope<unknown>(json)
          const errorMessage = envelope?.error?.message
          const errorRequestId = envelope?.error?.requestId || envelope?.error?.details?.requestId
          if (typeof errorMessage === 'string' && errorMessage.length > 0) message = errorMessage
          if (typeof errorRequestId === 'string' && errorRequestId.length > 0) requestId = errorRequestId
        } catch {
          // ignore
        }

        throw new Error(requestId ? `${message} (requestId: ${requestId})` : message)
      }

      const json: unknown = await response.json()
      const envelope = asEnvelope<{ funnel?: Funnel }>(json)
      setFunnel(envelope?.data?.funnel ?? null)
      setEditingFunnel(false)
      setEditedFunnel({})
    } catch (err) {
      console.error('Error updating funnel:', err)
      alert(`Fehler beim Speichern: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`)
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
    // Client-side validation
    const title = editedStep.title?.trim() || ''
    if (title.length === 0) {
      alert('Schritt-Titel darf nicht leer sein')
      return
    }
    if (title.length > 255) {
      alert('Schritt-Titel ist zu lang (maximal 255 Zeichen)')
      return
    }

    const description = editedStep.description?.trim() || ''
    if (description.length > 2000) {
      alert('Schritt-Beschreibung ist zu lang (maximal 2000 Zeichen)')
      return
    }

    try {
      setSaving(true)
      const response = await fetch(`/api/admin/funnel-steps/${stepId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          description,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update step')
      }

      await loadFunnelDetails()
      setEditingStep(null)
      setEditedStep({})
    } catch (err) {
      console.error('Error updating step:', err)
      alert(`Fehler beim Speichern: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`)
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

  const setDefaultVersion = async (versionId: string) => {
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/funnel-versions/${versionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_default: true }),
      })

      if (!response.ok) {
        let requestId = response.headers.get('x-request-id')
        let message = 'Failed to set default version'

        try {
          const json: unknown = await response.json()
          const envelope = asEnvelope<unknown>(json)
          const errorMessage = envelope?.error?.message
          const errorRequestId = envelope?.error?.requestId || envelope?.error?.details?.requestId
          if (typeof errorMessage === 'string' && errorMessage.length > 0) message = errorMessage
          if (typeof errorRequestId === 'string' && errorRequestId.length > 0) requestId = errorRequestId
        } catch {
          // ignore
        }

        throw new Error(requestId ? `${message} (requestId: ${requestId})` : message)
      }

      // Reload to get updated versions
      await loadFunnelDetails()
    } catch (err) {
      console.error('Error setting default version:', err)
      alert(`Fehler beim Setzen der Standard-Version: ${err instanceof Error ? err.message : 'Unbekannter Fehler'}`)
    } finally {
      setSaving(false)
    }
  }

  const updateVersionRollout = async (versionId: string, rolloutPercent: number) => {
    try {
      setSaving(true)
      const response = await fetch(`/api/admin/funnel-versions/${versionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rollout_percent: rolloutPercent }),
      })

      if (!response.ok) {
        throw new Error('Failed to update rollout percentage')
      }

      // Reload to get updated versions
      await loadFunnelDetails()
    } catch (err) {
      console.error('Error updating rollout:', err)
      alert('Fehler beim Aktualisieren des Rollouts')
    } finally {
      setSaving(false)
    }
  }

  const updateVersionMetadata = async (versionId: string, algorithmVersion?: string, promptVersion?: string) => {
    try {
      setSaving(true)
      const updatePayload: { algorithm_bundle_version?: string; prompt_version?: string } = {}
      if (algorithmVersion !== undefined) updatePayload.algorithm_bundle_version = algorithmVersion
      if (promptVersion !== undefined) updatePayload.prompt_version = promptVersion

      const response = await fetch(`/api/admin/funnel-versions/${versionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatePayload),
      })

      if (!response.ok) {
        throw new Error('Failed to update version metadata')
      }

      // Reload to get updated versions
      await loadFunnelDetails()
    } catch (err) {
      console.error('Error updating version metadata:', err)
      alert('Fehler beim Aktualisieren der Versions-Metadaten')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="lg" text="Lade Funnel-Details…" centered />
      </div>
    )
  }

  if (error || !funnel) {
    return (
      <div className="max-w-6xl mx-auto">
        <ErrorState
          title="Fehler beim Laden"
          message={error || 'Funnel nicht gefunden'}
          centered
        />
        <div className="mt-4 text-center">
          <Link
            href="/clinician/funnels"
            className="inline-flex items-center text-sm text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-medium"
          >
            ← Zurück zur Übersicht
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto">
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
                    <label htmlFor="funnel-title" className="block text-sm font-medium text-slate-700 mb-1">
                      Titel
                    </label>
                    <Input
                      id="funnel-title"
                      type="text"
                      value={editedFunnel.title || ''}
                      onChange={(e) =>
                        setEditedFunnel({ ...editedFunnel, title: e.target.value })
                      }
                      inputSize="md"
                    />
                  </div>
                  <div>
                    <label htmlFor="funnel-description" className="block text-sm font-medium text-slate-700 mb-1">
                      Beschreibung
                    </label>
                    <Textarea
                      id="funnel-description"
                      value={editedFunnel.description || ''}
                      onChange={(e) =>
                        setEditedFunnel({ ...editedFunnel, description: e.target.value })
                      }
                      rows={3}
                      textareaSize="md"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={saveFunnelEdit}
                      disabled={saving}
                      className="h-10 px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Speichert…' : 'Speichern'}
                    </button>
                    <button
                      onClick={cancelEditingFunnel}
                      disabled={saving}
                      className="h-10 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Abbrechen
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
                    {funnel.title}
                  </h1>
                  {funnel.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">{funnel.description}</p>
                  )}
                  <div className="flex items-center gap-3 text-sm text-slate-400 dark:text-slate-500">
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
              <Link
                href={`/clinician/funnels/${funnel.slug}/editor`}
                className="h-10 px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors inline-flex items-center"
              >
                Content Editor
              </Link>
              {!editingFunnel && (
                <button
                  onClick={startEditingFunnel}
                  className="h-10 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors"
                >
                  Bearbeiten
                </button>
              )}
              <button
                onClick={toggleFunnelActive}
                disabled={saving}
                className={`h-10 px-4 py-2 text-sm font-medium rounded-md transition-colors ${
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

      {/* Version Management Section */}
      {versions.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50 mb-4">Versionen</h2>
          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Version
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Rollout %
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Algorithmus
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Prompt
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Erstellt
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                      Aktionen
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-slate-200">
                  {versions.map((version) => (
                    <tr key={version.id} className={version.is_default ? 'bg-sky-50' : ''}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-slate-900">{version.version}</span>
                          {version.is_default && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-sky-100 text-sky-800">
                              Standard
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          version.is_default 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {version.is_default ? 'Aktiv' : 'Bereit'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={version.rollout_percent}
                            onChange={(e) => {
                              const value = parseInt(e.target.value, 10)
                              if (!isNaN(value) && value >= 0 && value <= 100) {
                                updateVersionRollout(version.id, value)
                              }
                            }}
                            disabled={saving}
                            className="w-16 px-2 py-1 text-sm border border-slate-300 rounded focus:ring-1 focus:ring-sky-500 focus:border-sky-500 disabled:opacity-50 disabled:cursor-not-allowed"
                          />
                          <span className="text-sm text-slate-600">%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-900 font-mono">
                          {version.algorithm_bundle_version}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-slate-900 font-mono">
                          {version.prompt_version}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                        {new Date(version.created_at).toLocaleDateString('de-DE')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                        {!version.is_default && (
                          <button
                            onClick={() => setDefaultVersion(version.id)}
                            disabled={saving}
                            className="inline-flex items-center px-3 py-1.5 border border-sky-600 text-sky-600 hover:bg-sky-50 rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Als Standard setzen
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="mt-4 text-sm text-slate-600">
            <p className="mb-1">
              <strong>Rollout %:</strong> Prozentsatz der Nutzer, die diese Version sehen (0-100). Bei mehreren aktiven Versionen wird nach Prozentsatz gewichtet ausgewählt.
            </p>
            <p>
              <strong>Standard:</strong> Die Standard-Version wird neuen Nutzern zugewiesen und ist die Haupt-Version des Funnels.
            </p>
          </div>
        </div>
      )}

      {/* Steps List */}
      <div className="space-y-6">
        <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Schritte</h2>
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
                    <label htmlFor={`step-title-${step.id}`} className="block text-sm font-medium text-slate-700 mb-1">
                      Schritt-Titel
                    </label>
                    <Input
                      id={`step-title-${step.id}`}
                      type="text"
                      value={editedStep.title || ''}
                      onChange={(e) => setEditedStep({ ...editedStep, title: e.target.value })}
                      inputSize="md"
                    />
                  </div>
                  <div>
                    <label htmlFor={`step-desc-${step.id}`} className="block text-sm font-medium text-slate-700 mb-1">
                      Schritt-Beschreibung
                    </label>
                    <Textarea
                      id={`step-desc-${step.id}`}
                      value={editedStep.description || ''}
                      onChange={(e) =>
                        setEditedStep({ ...editedStep, description: e.target.value })
                      }
                      rows={2}
                      textareaSize="md"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => saveStepEdit(step.id)}
                      disabled={saving}
                      className="h-10 px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {saving ? 'Speichert…' : 'Speichern'}
                    </button>
                    <button
                      onClick={cancelEditingStep}
                      disabled={saving}
                      className="h-10 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
                        (Typ: {translateStepType(step.type)})
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
                      className="h-10 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded transition-colors"
                    >
                      Bearbeiten
                    </button>
                    <button
                      onClick={() => moveStep(step.id, stepIndex, 'up')}
                      disabled={stepIndex === 0 || saving}
                      className="h-10 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Nach oben"
                    >
                      ↑
                    </button>
                    <button
                      onClick={() => moveStep(step.id, stepIndex, 'down')}
                      disabled={stepIndex === steps.length - 1 || saving}
                      className="h-10 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                      title="Nach unten"
                    >
                      ↓
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Content Page Info (for content_page steps) */}
            {step.type === 'content_page' && (
              <div className="px-6 py-4 bg-blue-50 border-b border-blue-200">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h4 className="text-sm font-semibold text-blue-900 mb-2">Zugeordnete Inhaltsseite</h4>
                    {step.content_page ? (
                      <div>
                        <p className="text-sm font-medium text-blue-900">{step.content_page.title}</p>
                        <p className="text-xs text-blue-700 mt-1">Slug: {step.content_page.slug}</p>
                        {step.content_page.excerpt && (
                          <p className="text-xs text-blue-600 mt-1">{step.content_page.excerpt}</p>
                        )}
                        <span className={`inline-block mt-2 px-2 py-1 text-xs rounded ${
                          step.content_page.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {step.content_page.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-red-700">⚠️ Keine Inhaltsseite zugeordnet</p>
                    )}
                  </div>
                </div>
              </div>
            )}

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
                            {translateQuestionType(question.question_type)}
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
