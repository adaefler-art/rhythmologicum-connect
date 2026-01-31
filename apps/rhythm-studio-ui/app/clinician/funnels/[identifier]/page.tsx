'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Badge,
  Button,
  Card,
  ErrorState,
  Input,
  Label,
  LoadingSpinner,
  PageHeader,
  SectionHeader,
  Select,
  Textarea,
} from '@/lib/ui'

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

type NewQuestionDraft = {
  key: string
  label: string
  helpText: string
  type: string
  required: boolean
  minValue: string
  maxValue: string
  optionsText: string
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

  const [addingQuestionStepId, setAddingQuestionStepId] = useState<string | null>(null)
  const [newQuestion, setNewQuestion] = useState<NewQuestionDraft>({
    key: '',
    label: '',
    helpText: '',
    type: 'text',
    required: false,
    minValue: '',
    maxValue: '',
    optionsText: '',
  })
  const [questionError, setQuestionError] = useState<string | null>(null)

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

  const getActiveVersionId = () => {
    const defaultVersion = versions.find((version) => version.is_default)
    return defaultVersion?.id ?? versions[0]?.id ?? null
  }

  const resetNewQuestion = () => {
    setNewQuestion({
      key: '',
      label: '',
      helpText: '',
      type: 'text',
      required: false,
      minValue: '',
      maxValue: '',
      optionsText: '',
    })
  }

  const openAddQuestion = (stepId: string) => {
    setQuestionError(null)
    resetNewQuestion()
    setAddingQuestionStepId(stepId)
  }

  const closeAddQuestion = () => {
    setAddingQuestionStepId(null)
    setQuestionError(null)
  }

  const parseQuestionOptions = (raw: string) => {
    return raw
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        const [value, label, helpText] = line.split('|').map((part) => part?.trim() ?? '')
        return {
          value,
          label: label || value,
          helpText: helpText || undefined,
        }
      })
      .filter((option) => option.value.length > 0 && option.label.length > 0)
  }

  const createQuestion = async () => {
    if (!addingQuestionStepId) return

    const versionId = getActiveVersionId()
    if (!versionId) {
      setQuestionError('Keine Funnel-Version verfügbar.')
      return
    }

    const key = newQuestion.key.trim()
    const label = newQuestion.label.trim()
    const type = newQuestion.type.trim()

    if (!key || !label || !type) {
      setQuestionError('Bitte Schlüssel, Titel und Typ angeben.')
      return
    }

    const minValue = newQuestion.minValue.trim().length > 0 ? Number(newQuestion.minValue) : undefined
    const maxValue = newQuestion.maxValue.trim().length > 0 ? Number(newQuestion.maxValue) : undefined

    const shouldIncludeOptions = type === 'radio' || type === 'checkbox'
    const options = shouldIncludeOptions ? parseQuestionOptions(newQuestion.optionsText) : undefined

    if (shouldIncludeOptions && (!options || options.length === 0)) {
      setQuestionError('Bitte mindestens eine Option angeben (value|label pro Zeile).')
      return
    }

    try {
      setSaving(true)
      setQuestionError(null)

      const response = await fetch(`/api/admin/funnel-steps/${addingQuestionStepId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          versionId,
          question: {
            key,
            label,
            helpText: newQuestion.helpText.trim() || undefined,
            type,
            required: newQuestion.required,
            minValue: typeof minValue === 'number' && !Number.isNaN(minValue) ? minValue : undefined,
            maxValue: typeof maxValue === 'number' && !Number.isNaN(maxValue) ? maxValue : undefined,
            options,
          },
        }),
      })

      if (!response.ok) {
        let requestId = response.headers.get('x-request-id')
        let message = 'Failed to create question'

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

      await loadFunnelDetails()
      closeAddQuestion()
    } catch (err) {
      console.error('Error creating question:', err)
      setQuestionError(
        err instanceof Error ? err.message : 'Fehler beim Hinzufügen der Frage',
      )
    } finally {
      setSaving(false)
    }
  }

  const deleteQuestion = async (stepId: string, questionId: string) => {
    const versionId = getActiveVersionId()
    if (!versionId) {
      alert('Keine Funnel-Version verfügbar.')
      return
    }

    if (!confirm('Soll diese Frage wirklich gelöscht werden?')) return

    try {
      setSaving(true)
      const response = await fetch(
        `/api/admin/funnel-steps/${stepId}/questions/${questionId}?versionId=${versionId}`,
        { method: 'DELETE' },
      )

      if (!response.ok) {
        throw new Error('Failed to delete question')
      }

      await loadFunnelDetails()
    } catch (err) {
      console.error('Error deleting question:', err)
      alert('Fehler beim Löschen der Frage')
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
    <div className="w-full">
      <PageHeader
        title={editingFunnel ? 'Funnel bearbeiten' : funnel.title}
        description={
          editingFunnel
            ? 'Aktualisieren Sie die Metadaten dieses Funnels.'
            : funnel.description || 'Details und Inhalte des ausgewählten Funnels.'
        }
        actions={
          <>
            <Link href={`/clinician/funnels/${identifier}/editor`}>
              <Button variant="primary" size="sm">
                Content Editor
              </Button>
            </Link>
            {!editingFunnel && (
              <Button variant="secondary" size="sm" onClick={startEditingFunnel}>
                Bearbeiten
              </Button>
            )}
            <Button
              variant={funnel.is_active ? 'secondary' : 'primary'}
              size="sm"
              onClick={toggleFunnelActive}
              disabled={saving}
            >
              {saving ? 'Speichert…' : funnel.is_active ? 'Aktiv' : 'Inaktiv'}
            </Button>
          </>
        }
      />

      <div className="mb-4">
        <Link href="/clinician/funnels">
          <Button variant="ghost" size="sm">← Zurück zur Übersicht</Button>
        </Link>
      </div>

      <Card>
        {editingFunnel ? (
          <div className="space-y-4">
            <div>
              <Label htmlFor="funnel-title">Titel</Label>
              <Input
                id="funnel-title"
                type="text"
                value={editedFunnel.title || ''}
                onChange={(e) => setEditedFunnel({ ...editedFunnel, title: e.target.value })}
                inputSize="md"
              />
            </div>
            <div>
              <Label htmlFor="funnel-description">Beschreibung</Label>
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
              <Button variant="primary" size="sm" onClick={saveFunnelEdit} disabled={saving}>
                {saving ? 'Speichert…' : 'Speichern'}
              </Button>
              <Button variant="ghost" size="sm" onClick={cancelEditingFunnel} disabled={saving}>
                Abbrechen
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
                {funnel.title}
              </h2>
              <Badge variant={funnel.is_active ? 'success' : 'secondary'} size="sm">
                {funnel.is_active ? 'Aktiv' : 'Inaktiv'}
              </Badge>
            </div>
            {funnel.description && (
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-3">
                {funnel.description}
              </p>
            )}
            <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
              <span>ID: {funnel.id}</span>
              <span>•</span>
              <span>Slug: {funnel.slug}</span>
              <span>•</span>
              <span>{steps.length} Schritte</span>
              <span>•</span>
              <span>
                {steps.reduce((total, step) => total + step.questions.length, 0)} Fragen
              </span>
            </div>
          </div>
        )}
      </Card>

      {/* Version Management Section */}
      {versions.length > 0 && (
        <div className="mb-8">
          <SectionHeader title="Versionen" />
          <Card padding="none">
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
                            <Badge variant="info" size="sm">
                              Standard
                            </Badge>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={version.is_default ? 'success' : 'secondary'} size="sm">
                          {version.is_default ? 'Aktiv' : 'Bereit'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Input
                            type="number"
                            min="0"
                            max="100"
                            defaultValue={version.rollout_percent}
                            onBlur={(e) => {
                              const value = parseInt(e.target.value, 10)
                              if (!isNaN(value) && value >= 0 && value <= 100 && value !== version.rollout_percent) {
                                updateVersionRollout(version.id, value)
                              } else if (value !== version.rollout_percent) {
                                // Reset to current value if invalid
                                e.target.value = String(version.rollout_percent)
                              }
                            }}
                            disabled={saving}
                            inputSize="sm"
                            className="max-w-22"
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setDefaultVersion(version.id)}
                            disabled={saving}
                          >
                            Als Standard setzen
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
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
        <SectionHeader title="Schritte" />
        {steps.map((step, stepIndex) => (
          <Card key={step.id} padding="none">
            {/* Step Header */}
            <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
              {editingStep === step.id ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor={`step-title-${step.id}`}>Schritt-Titel</Label>
                    <Input
                      id={`step-title-${step.id}`}
                      type="text"
                      value={editedStep.title || ''}
                      onChange={(e) => setEditedStep({ ...editedStep, title: e.target.value })}
                      inputSize="md"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`step-desc-${step.id}`}>Schritt-Beschreibung</Label>
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
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => saveStepEdit(step.id)}
                      disabled={saving}
                    >
                      {saving ? 'Speichert…' : 'Speichern'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelEditingStep}
                      disabled={saving}
                    >
                      Abbrechen
                    </Button>
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
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => openAddQuestion(step.id)}
                      disabled={saving}
                    >
                      Frage hinzufügen
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => startEditingStep(step)}>
                      Bearbeiten
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveStep(step.id, stepIndex, 'up')}
                      disabled={stepIndex === 0 || saving}
                      title="Nach oben"
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => moveStep(step.id, stepIndex, 'down')}
                      disabled={stepIndex === steps.length - 1 || saving}
                      title="Nach unten"
                    >
                      ↓
                    </Button>
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
                        <Badge
                          variant={step.content_page.status === 'published' ? 'success' : 'warning'}
                          size="sm"
                          className="mt-2"
                        >
                          {step.content_page.status === 'published' ? 'Veröffentlicht' : 'Entwurf'}
                        </Badge>
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

                      <Button
                        variant={question.is_required ? 'secondary' : 'ghost'}
                        size="sm"
                        onClick={() =>
                          toggleQuestionRequired(
                            question.funnel_step_question_id,
                            question.is_required
                          )
                        }
                        disabled={saving}
                      >
                        {question.is_required ? 'Pflichtfeld' : 'Optional'}
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteQuestion(step.id, question.id)}
                        disabled={saving}
                      >
                        Löschen
                      </Button>
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
          </Card>
        ))}
      </div>

      {steps.length === 0 && (
        <Card>
          <p className="text-slate-600 text-center">Keine Schritte definiert.</p>
        </Card>
      )}

      {addingQuestionStepId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4 py-8">
          <Card className="w-full max-w-2xl" shadow="lg">
            <div className="space-y-5">
              <div>
                <h3 className="text-lg font-semibold text-slate-900">Frage hinzufügen</h3>
                <p className="text-sm text-slate-600">
                  Neue Frage für diesen Schritt definieren.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="question-key">Frageschlüssel</Label>
                  <Input
                    id="question-key"
                    type="text"
                    value={newQuestion.key}
                    onChange={(event) =>
                      setNewQuestion((prev) => ({ ...prev, key: event.target.value }))
                    }
                    inputSize="md"
                  />
                </div>
                <div>
                  <Label htmlFor="question-type">Typ</Label>
                  <Select
                    id="question-type"
                    value={newQuestion.type}
                    onChange={(event) =>
                      setNewQuestion((prev) => ({ ...prev, type: event.target.value }))
                    }
                    selectSize="md"
                  >
                    <option value="text">Text</option>
                    <option value="textarea">Textfeld</option>
                    <option value="number">Zahl</option>
                    <option value="scale">Skala</option>
                    <option value="slider">Slider</option>
                    <option value="radio">Radio</option>
                    <option value="checkbox">Checkbox</option>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="question-label">Fragetitel</Label>
                <Input
                  id="question-label"
                  type="text"
                  value={newQuestion.label}
                  onChange={(event) =>
                    setNewQuestion((prev) => ({ ...prev, label: event.target.value }))
                  }
                  inputSize="md"
                />
              </div>

              <div>
                <Label htmlFor="question-help">Hilfetext (optional)</Label>
                <Textarea
                  id="question-help"
                  value={newQuestion.helpText}
                  onChange={(event) =>
                    setNewQuestion((prev) => ({ ...prev, helpText: event.target.value }))
                  }
                  rows={2}
                  textareaSize="md"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="question-required"
                  type="checkbox"
                  checked={newQuestion.required}
                  onChange={(event) =>
                    setNewQuestion((prev) => ({ ...prev, required: event.target.checked }))
                  }
                  className="h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                />
                <Label htmlFor="question-required">Pflichtfeld</Label>
              </div>

              {(newQuestion.type === 'number' ||
                newQuestion.type === 'scale' ||
                newQuestion.type === 'slider') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="question-min">Min-Wert</Label>
                    <Input
                      id="question-min"
                      type="number"
                      value={newQuestion.minValue}
                      onChange={(event) =>
                        setNewQuestion((prev) => ({ ...prev, minValue: event.target.value }))
                      }
                      inputSize="md"
                    />
                  </div>
                  <div>
                    <Label htmlFor="question-max">Max-Wert</Label>
                    <Input
                      id="question-max"
                      type="number"
                      value={newQuestion.maxValue}
                      onChange={(event) =>
                        setNewQuestion((prev) => ({ ...prev, maxValue: event.target.value }))
                      }
                      inputSize="md"
                    />
                  </div>
                </div>
              )}

              {(newQuestion.type === 'radio' || newQuestion.type === 'checkbox') && (
                <div>
                  <Label htmlFor="question-options">Optionen</Label>
                  <Textarea
                    id="question-options"
                    value={newQuestion.optionsText}
                    onChange={(event) =>
                      setNewQuestion((prev) => ({ ...prev, optionsText: event.target.value }))
                    }
                    rows={4}
                    textareaSize="md"
                  />
                  <p className="text-xs text-slate-500 mt-2">
                    Eine Option pro Zeile, Format: <span className="font-mono">value|label|hilfetext</span>
                  </p>
                </div>
              )}

              {questionError && (
                <p className="text-sm text-red-600" role="alert">
                  {questionError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={closeAddQuestion} disabled={saving}>
                  Abbrechen
                </Button>
                <Button variant="primary" size="sm" onClick={createQuestion} disabled={saving}>
                  {saving ? 'Speichert…' : 'Hinzufügen'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  )
}
