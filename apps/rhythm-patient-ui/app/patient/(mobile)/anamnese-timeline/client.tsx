'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { 
  Card, 
  Button, 
  Badge, 
  EmptyState, 
  ErrorState, 
  LoadingSkeleton 
} from '@/lib/ui/mobile-v2'
import { Plus, Clock, ArrowLeft } from '@/lib/ui/mobile-v2/icons'

/**
 * E75.3: Patient Record Timeline Client Component
 * 
 * Displays patient medical history entries with:
 * - List grouped by entry_type and date
 * - Loading/empty/error states
 * - Add entry functionality
 * - Navigation to detail/edit view
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
  version_count: number
}

type FetchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; entries: AnamnesisEntry[] }
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

const ENTRY_TYPE_COLORS: Record<string, 'primary' | 'success' | 'warning' | 'danger' | 'neutral'> = {
  medical_history: 'primary',
  symptoms: 'danger',
  medications: 'success',
  allergies: 'warning',
  family_history: 'neutral',
  lifestyle: 'primary',
  other: 'neutral',
}

export default function AnamneseTimelineClient() {
  const router = useRouter()
  const [state, setState] = useState<FetchState>({ status: 'idle' })
  const [showAddModal, setShowAddModal] = useState(false)
  const [filter, setFilter] = useState<'all' | 'active' | 'archived'>('active')

  useEffect(() => {
    const fetchEntries = async () => {
      setState({ status: 'loading' })

      try {
        const response = await fetch('/api/patient/anamnesis')
        const result = await response.json()

        if (!result.success) {
          setState({ 
            status: 'error', 
            message: result.error?.message || 'Fehler beim Laden der Einträge' 
          })
          return
        }

        setState({ 
          status: 'success', 
          entries: result.data?.entries || [] 
        })
      } catch (err) {
        console.error('[AnamneseTimeline] Fetch error:', err)
        setState({ 
          status: 'error', 
          message: 'Unerwarteter Fehler beim Laden' 
        })
      }
    }

    fetchEntries()
  }, [])

  const handleRefresh = () => {
    window.location.reload()
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

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('de-DE', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    })
  }

  // Loading state
  if (state.status === 'loading' || state.status === 'idle') {
    return (
      <div className="flex w-full flex-col gap-6 px-4 py-10">
        <div className="flex items-center gap-3">
          <LoadingSkeleton variant="circle" count={1} />
          <LoadingSkeleton variant="text" count={1} />
        </div>
        <LoadingSkeleton variant="card" count={3} />
      </div>
    )
  }

  // Error state
  if (state.status === 'error') {
    return (
      <div className="flex w-full flex-col gap-6 px-4 py-10">
        <button
          onClick={() => router.push('/patient/dashboard')}
          className="self-start inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zum Dashboard
        </button>
        <ErrorState
          title="Fehler beim Laden"
          message={state.message}
          onRetry={handleRefresh}
        />
      </div>
    )
  }

  // Filter entries
  const filteredEntries = state.entries.filter((entry) => {
    if (filter === 'all') return true
    if (filter === 'active') return !entry.is_archived
    if (filter === 'archived') return entry.is_archived
    return true
  })

  // Group entries by entry_type
  const groupedEntries = filteredEntries.reduce((acc, entry) => {
    const type = entry.entry_type || 'other'
    if (!acc[type]) {
      acc[type] = []
    }
    acc[type].push(entry)
    return acc
  }, {} as Record<string, AnamnesisEntry[]>)

  // Empty state
  if (state.entries.length === 0) {
    return (
      <div className="flex w-full flex-col gap-6 px-4 py-10">
        <div className="flex items-center justify-between">
          <button
            onClick={() => router.push('/patient/dashboard')}
            className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück zum Dashboard
          </button>
        </div>
        <EmptyState
          iconVariant="inbox"
          title="Keine Einträge vorhanden"
          message="Beginnen Sie mit der Dokumentation Ihrer Patient Record"
          ctaText="Ersten Eintrag hinzufügen"
          onCtaClick={() => setShowAddModal(true)}
        />
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.push('/patient/dashboard')}
          className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zum Dashboard
        </button>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setShowAddModal(true)}
        >
          <Plus className="h-4 w-4 mr-1" />
          Neu
        </Button>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Patient Record Timeline</h1>
        <p className="text-sm text-slate-600 mt-1">
          {filteredEntries.length} {filteredEntries.length === 1 ? 'Eintrag' : 'Einträge'}
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setFilter('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'active'
              ? 'bg-sky-100 text-sky-900'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Aktiv
        </button>
        <button
          onClick={() => setFilter('archived')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'archived'
              ? 'bg-sky-100 text-sky-900'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Archiviert
        </button>
        <button
          onClick={() => setFilter('all')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            filter === 'all'
              ? 'bg-sky-100 text-sky-900'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
          }`}
        >
          Alle
        </button>
      </div>

      {/* Empty filtered state */}
      {filteredEntries.length === 0 && (
        <div className="mt-8">
          <EmptyState
            iconVariant="search"
            title="Keine Einträge gefunden"
            message={`Keine ${filter === 'active' ? 'aktiven' : 'archivierten'} Einträge vorhanden`}
          />
        </div>
      )}

      {/* Grouped Timeline */}
      {Object.keys(groupedEntries).map((entryType) => (
        <section key={entryType} className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-slate-800">
            {ENTRY_TYPE_LABELS[entryType] || 'Sonstiges'}
          </h2>
          <div className="space-y-3">
            {groupedEntries[entryType].map((entry) => (
              <Card
                key={entry.id}
                padding="md"
                shadow="sm"
                hover
                onClick={() => router.push(`/patient/anamnese-timeline/${entry.id}/detail`)}
              >
                <div className="flex flex-col gap-3">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-semibold text-slate-900 truncate">
                        {entry.title}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <Clock className="h-3 w-3 text-slate-400" />
                        <p className="text-xs text-slate-500">
                          {formatDateTime(entry.updated_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge
                        variant={entry.is_archived ? 'neutral' : ENTRY_TYPE_COLORS[entryType]}
                        size="sm"
                      >
                        {entry.is_archived ? 'Archiviert' : 'Aktiv'}
                      </Badge>
                      {entry.version_count > 1 && (
                        <span className="text-xs text-slate-500" aria-label="Anzahl Versionen">
                          Version {entry.version_count}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Tags */}
                  {entry.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {entry.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="px-2 py-0.5 text-xs rounded-full bg-slate-100 text-slate-600"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Content Preview */}
                  {Object.keys(entry.content).length > 0 && (
                    <div className="rounded-lg border border-slate-100 bg-slate-50/50 p-3">
                      <p className="text-sm text-slate-700 line-clamp-2">
                        {JSON.stringify(entry.content, null, 2)}
                      </p>
                    </div>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </section>
      ))}

      {/* Add Modal - Simplified for MVP */}
      {showAddModal && (
        <AddEntryModal
          onClose={() => setShowAddModal(false)}
          onSuccess={() => {
            setShowAddModal(false)
            handleRefresh()
          }}
        />
      )}
    </div>
  )
}

/**
 * Add Entry Modal Component
 * MVP implementation with basic form
 */
function AddEntryModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void
  onSuccess: () => void
}) {
  const [formData, setFormData] = useState({
    title: '',
    entry_type: 'symptoms' as string,
    content: {} as Record<string, unknown>,
    tags: [] as string[],
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)

    try {
      const response = await fetch('/api/patient/anamnesis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const result = await response.json()

      if (!result.success) {
        setError(result.error?.message || 'Fehler beim Speichern')
        return
      }

      onSuccess()
    } catch (err) {
      console.error('[AddEntry] Error:', err)
      setError('Unerwarteter Fehler beim Speichern')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50">
      <div className="w-full bg-white rounded-t-2xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-slate-900">Neuer Eintrag</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
          >
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
              placeholder="z.B. Kopfschmerzen, Medikament X"
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
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
