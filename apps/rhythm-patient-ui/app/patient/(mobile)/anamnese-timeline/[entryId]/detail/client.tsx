'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import {
  Card,
  Button,
  Badge,
  ErrorState,
  LoadingSkeleton,
} from '@/lib/ui/mobile-v2'
import { ArrowLeft, Clock } from '@/lib/ui/mobile-v2/icons'

/**
 * E75.3: Anamnese Entry Detail Client Component
 * 
 * Displays entry details with:
 * - Full entry information
 * - Version history
 * - Edit functionality (creates new version)
 * - Archive functionality
 */

type AnamnesisEntry = {
  id: string
  title: string
  content: Record<string, unknown>
  entry_type: string | null
  tags: string[]
  is_archived: boolean
  created_at: string
  updated_at: string
  created_by: string | null
  updated_by: string | null
}

type AnamnesisVersion = {
  id: string
  version_number: number
  title: string
  content: Record<string, unknown>
  entry_type: string | null
  tags: string[] | null
  changed_at: string
  change_reason: string | null
  changed_by: string | null
}

type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | {
      status: 'success'
      entry: AnamnesisEntry
      versions: AnamnesisVersion[]
    }
  | { status: 'error'; message: string }

const ENTRY_TYPE_LABELS: Record<string, string> = {
  medical_history: 'Medizinische Vorgeschichte',
  symptoms: 'Symptome',
  medications: 'Medikamente',
  allergies: 'Allergien',
  family_history: 'Familienanamnese',
  lifestyle: 'Lebensstil',
  other: 'Sonstiges',
}

export default function AnamneseDetailClient({ entryId }: { entryId: string }) {
  const router = useRouter()
  const [state, setState] = useState<FetchState>({ status: 'idle' })
  const [isEditing, setIsEditing] = useState(false)
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false)

  useEffect(() => {
    const fetchEntry = async () => {
      setState({ status: 'loading' })

      try {
        const response = await fetch(`/api/patient/anamnesis/${entryId}`)
        const result = await response.json()

        if (!result.success) {
          setState({
            status: 'error',
            message: result.error?.message || 'Fehler beim Laden des Eintrags',
          })
          return
        }

        setState({
          status: 'success',
          entry: result.data.entry,
          versions: result.data.versions || [],
        })
      } catch (err) {
        console.error('[AnamneseDetail] Fetch error:', err)
        setState({
          status: 'error',
          message: 'Unerwarteter Fehler beim Laden',
        })
      }
    }

    fetchEntry()
  }, [entryId])

  const handleArchive = async () => {
    try {
      const response = await fetch(`/api/patient/anamnesis/${entryId}/archive`, {
        method: 'POST',
      })

      const result = await response.json()

      if (!result.success) {
        alert('Fehler beim Archivieren: ' + (result.error?.message || 'Unbekannter Fehler'))
        return
      }

      // Navigate back to timeline
      router.push('/patient/anamnese-timeline')
    } catch (err) {
      console.error('[AnamneseDetail] Archive error:', err)
      alert('Unerwarteter Fehler beim Archivieren')
    }
  }

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  // Loading state
  if (state.status === 'loading' || state.status === 'idle') {
    return (
      <div className="flex w-full flex-col gap-6 px-4 py-10">
        <LoadingSkeleton variant="text" count={2} />
        <LoadingSkeleton variant="card" count={2} />
      </div>
    )
  }

  // Error state
  if (state.status === 'error') {
    return (
      <div className="flex w-full flex-col gap-6 px-4 py-10">
        <button
          onClick={() => router.push('/patient/anamnese-timeline')}
          className="self-start inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Timeline
        </button>
        <ErrorState
          title="Fehler beim Laden"
          message={state.message}
          onRetry={() => window.location.reload()}
        />
      </div>
    )
  }

  const { entry, versions } = state

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/patient/anamnese-timeline')}
          className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zur Timeline
        </button>
        {!entry.is_archived && (
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              Bearbeiten
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowArchiveConfirm(true)}
            >
              Archivieren
            </Button>
          </div>
        )}
      </div>

      {/* Entry Details */}
      <Card padding="md" shadow="sm">
        <div className="flex flex-col gap-4">
          {/* Title & Status */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <h1 className="text-xl font-bold text-slate-900">{entry.title}</h1>
              <p className="text-sm text-slate-500 mt-1">
                {entry.entry_type
                  ? ENTRY_TYPE_LABELS[entry.entry_type] || 'Sonstiges'
                  : 'Keine Kategorie'}
              </p>
            </div>
            <Badge variant={entry.is_archived ? 'neutral' : 'success'} size="md">
              {entry.is_archived ? 'Archiviert' : 'Aktiv'}
            </Badge>
          </div>

          {/* Metadata */}
          <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-100">
            <div>
              <p className="text-xs text-slate-500">Erstellt</p>
              <p className="text-sm text-slate-900 mt-1">
                {formatDateTime(entry.created_at)}
              </p>
            </div>
            <div>
              <p className="text-xs text-slate-500">Zuletzt aktualisiert</p>
              <p className="text-sm text-slate-900 mt-1">
                {formatDateTime(entry.updated_at)}
              </p>
            </div>
          </div>

          {/* Tags */}
          {entry.tags.length > 0 && (
            <div>
              <p className="text-xs text-slate-500 mb-2">Tags</p>
              <div className="flex flex-wrap gap-1">
                {entry.tags.map((tag, idx) => (
                  <span
                    key={idx}
                    className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-600"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Content */}
          <div>
            <p className="text-xs text-slate-500 mb-2">Inhalt</p>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
              <pre className="text-sm text-slate-700 whitespace-pre-wrap font-sans">
                {JSON.stringify(entry.content, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      </Card>

      {/* Version History */}
      {versions.length > 1 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-slate-800">
            Versionshistorie ({versions.length})
          </h2>
          {versions.map((version) => (
            <Card key={version.id} padding="sm" shadow="sm">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <Clock className="h-3 w-3 text-slate-400" />
                    <p className="text-sm font-medium text-slate-900">
                      Version {version.version_number}
                    </p>
                  </div>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatDateTime(version.changed_at)}
                  </p>
                  {version.change_reason && (
                    <p className="text-xs text-slate-600 mt-2 italic">
                      {version.change_reason}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Modal */}
      {isEditing && (
        <EditEntryModal
          entry={entry}
          onClose={() => setIsEditing(false)}
          onSuccess={() => {
            setIsEditing(false)
            window.location.reload()
          }}
        />
      )}

      {/* Archive Confirmation Modal */}
      {showArchiveConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
          <div className="bg-white rounded-xl p-6 w-full">
            <h3 className="text-lg font-bold text-slate-900 mb-2">
              Eintrag archivieren?
            </h3>
            <p className="text-sm text-slate-600 mb-6">
              Der Eintrag wird archiviert und aus der aktiven Timeline entfernt. Sie können
              ihn weiterhin unter "Archiviert" ansehen.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={() => setShowArchiveConfirm(false)}
              >
                Abbrechen
              </Button>
              <Button variant="primary" onClick={handleArchive}>
                Archivieren
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Edit Entry Modal Component
 */
function EditEntryModal({
  entry,
  onClose,
  onSuccess,
}: {
  entry: AnamnesisEntry
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    title: entry.title,
    entry_type: entry.entry_type || 'other',
    tags: entry.tags,
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch(`/api/patient/anamnesis/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          content: entry.content, // Keep existing content for MVP
        }),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error?.message || 'Fehler beim Speichern')
        return
      }

      onSuccess()
    } catch (err) {
      console.error('[EditEntry] Error:', err)
      setError('Unerwarteter Fehler beim Speichern')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="w-full bg-white rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">Eintrag bearbeiten</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Titel *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              required
              disabled={isSubmitting}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Kategorie *
            </label>
            <select
              value={formData.entry_type}
              onChange={(e) => setFormData({ ...formData, entry_type: e.target.value })}
              className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
              disabled={isSubmitting}
            >
              <option value="symptoms">Symptome</option>
              <option value="medications">Medikamente</option>
              <option value="allergies">Allergien</option>
              <option value="medical_history">Medizinische Vorgeschichte</option>
              <option value="family_history">Familienanamnese</option>
              <option value="lifestyle">Lebensstil</option>
              <option value="other">Sonstiges</option>
            </select>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Abbrechen
            </Button>
            <Button type="submit" variant="primary" disabled={isSubmitting}>
              {isSubmitting ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
