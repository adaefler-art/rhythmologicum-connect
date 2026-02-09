/**
 * AnamnesisSection Component
 * 
 * E75.4: Displays patient anamnesis (medical history) entries for clinicians.
 * 
 * Features:
 * - List anamnesis entries with latest versions
 * - Add new entries (notes/diagnosis/medication)
 * - Edit existing entries (creates new version)
 * - Archive entries
 * - Access only via assignment (enforced by RLS)
 * 
 * Data source: /api/clinician/patient/[patientId]/anamnesis
 * Access control: Requires clinician role + patient assignment
 */

import { useState, useEffect } from 'react'
import { Card, Badge, Button, Modal, FormField, Input, Textarea, Select, Alert } from '@/lib/ui'
import { FileText, Plus, Edit, Archive, Clock } from 'lucide-react'
import { ENTRY_TYPES } from '@/lib/api/anamnesis/validation'
import type { EntryType } from '@/lib/api/anamnesis/validation'
import { getAnamnesis, postAnamnesis } from '@/lib/fetchClinician'

export interface AnamnesisEntry {
  id: string
  title: string
  content: Record<string, unknown>
  entry_type: string | null
  tags: string[]
  is_archived: boolean
  created_at: string
  updated_at: string
  created_by: string
  updated_by: string
  version_count: number
}

export interface AnamnesisVersion {
  id: string
  version_number: number
  title: string
  content: Record<string, unknown>
  entry_type: string | null
  tags: string[] | null
  changed_at: string
  change_reason: string | null
}

export interface SuggestedFact {
  id: string
  label: string
  value: string
  sourceType: string
  sourceId: string
  occurredAt: string | null
}

export interface AnamnesisSectionProps {
  /** Patient ID for fetching/creating entries */
  patientId: string
  /** Loading state */
  loading?: boolean
  /** Error evidence code (PHI-safe) */
  errorEvidenceCode?: string
}

/**
 * Displays patient anamnesis entries with add/edit/archive capabilities
 */
export function AnamnesisSection({ patientId, loading, errorEvidenceCode }: AnamnesisSectionProps) {
  const [entries, setEntries] = useState<AnamnesisEntry[]>([])
  const [isLoading, setIsLoading] = useState(loading ?? false)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [selectedEntry, setSelectedEntry] = useState<AnamnesisEntry | null>(null)
  const [latestEntry, setLatestEntry] = useState<AnamnesisEntry | null>(null)
  const [versions, setVersions] = useState<AnamnesisVersion[]>([])
  const [suggestedFacts, setSuggestedFacts] = useState<SuggestedFact[]>([])
  const [selectedFactIds, setSelectedFactIds] = useState<string[]>([])
  const [isCreatingVersion, setIsCreatingVersion] = useState(false)
  const [suggestedError, setSuggestedError] = useState<string | null>(null)
  const [isSuggestedPreviewOpen, setIsSuggestedPreviewOpen] = useState(false)
  const [previewText, setPreviewText] = useState('')
  const [previewFacts, setPreviewFacts] = useState<SuggestedFact[]>([])
  const [debugHint, setDebugHint] = useState<string | null>(null)
  const [intakeVersions, setIntakeVersions] = useState<AnamnesisVersion[]>([])
  const [isIntakeHistoryOpen, setIsIntakeHistoryOpen] = useState(false)
  const [isIntakeHistoryLoading, setIsIntakeHistoryLoading] = useState(false)
  const [intakeHistoryError, setIntakeHistoryError] = useState<string | null>(null)

  // Form state for add/edit
  const [formTitle, setFormTitle] = useState('')
  const [formContent, setFormContent] = useState('')
  const [formEntryType, setFormEntryType] = useState<EntryType | ''>('')
  const [formTags, setFormTags] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)

  // Fetch entries on mount
  useEffect(() => {
    fetchEntries()
  }, [patientId])

  const fetchEntries = async () => {
    setIsLoading(true)
    setError(null)
    setSuggestedError(null)
    setDebugHint(null)

    try {
      const { data, error, debugHint } = await getAnamnesis(patientId)

      setDebugHint(debugHint ?? null)

      if (error) {
        if (error.status === 404) {
          setError('Patient nicht gefunden oder nicht zugewiesen')
        } else if (error.status === 403) {
          setError('Keine Berechtigung für diesen Patienten')
        } else {
          setError(error.message || 'Fehler beim Laden der Patient Record-Einträge')
        }
        return
      }

      if (data?.success && data.data) {
        const loadedEntries = (data.data.entries || []) as unknown as AnamnesisEntry[]
        const nonIntakeEntries = loadedEntries.filter((entry) => entry.entry_type !== 'intake')
        const fallbackLatest = nonIntakeEntries[0] || null

        setEntries(loadedEntries)
        const providedLatest = (data.data.latestEntry as unknown) as AnamnesisEntry | null
        const resolvedLatest =
          providedLatest && providedLatest.entry_type !== 'intake'
            ? providedLatest
            : fallbackLatest

        setLatestEntry(resolvedLatest)
        setVersions((data.data.versions || []) as unknown as AnamnesisVersion[])
        setSuggestedFacts((data.data.suggestedFacts || []) as unknown as SuggestedFact[])
        setSelectedFactIds([])
      }
    } catch (err) {
      console.error('[AnamnesisSection] Fetch error:', err)
      setError('Fehler beim Laden der Patient Record-Einträge')
    } finally {
      setIsLoading(false)
    }
  }

  const buildSuggestedText = (facts: SuggestedFact[]) => {
    if (facts.length === 0) return ''
    const lines = facts.map((fact) => `- ${fact.label}: ${fact.value}`)
    return ['Patient Record (Vorschlag)', ...lines].join('\n')
  }

  const openSuggestedPreview = () => {
    if (selectedFactIds.length === 0) {
      setSuggestedError('Bitte wählen Sie mindestens einen Vorschlag aus.')
      return
    }

    const selectedFacts = suggestedFacts.filter((fact) => selectedFactIds.includes(fact.id))
    setPreviewFacts(selectedFacts)
    setPreviewText(buildSuggestedText(selectedFacts))
    setIsSuggestedPreviewOpen(true)
  }

  const submitSuggestedFacts = async (facts: SuggestedFact[]) => {
    setIsCreatingVersion(true)
    setSuggestedError(null)

    try {
      const text = buildSuggestedText(facts)
      const title = `Patient Record Vorschlag ${new Date().toLocaleDateString('de-DE')}`

      const { error } = await postAnamnesis(patientId, { text, sources: facts, title })

      if (error) {
        throw new Error(error.message || 'Fehler beim Erstellen der Version')
      }

      await fetchEntries()
      setIsSuggestedPreviewOpen(false)
    } catch (err) {
      console.error('[AnamnesisSection] Suggested version error:', err)
      setSuggestedError(err instanceof Error ? err.message : 'Fehler beim Speichern der Version')
    } finally {
      setIsCreatingVersion(false)
    }
  }

  const handleAddEntry = async () => {
    if (!formTitle.trim()) {
      return
    }

    setIsSaving(true)
    setFormError(null)

    try {
      const { error } = await postAnamnesis(patientId, {
        title: formTitle,
        content: { text: formContent },
        entry_type: formEntryType || null,
        tags: formTags ? formTags.split(',').map((t) => t.trim()) : [],
      })

      if (error) {
        throw new Error(error.message || 'Fehler beim Erstellen des Eintrags')
      }

      // Reset form and close dialog
      resetForm()
      setIsAddDialogOpen(false)

      // Refresh entries
      await fetchEntries()
    } catch (err) {
      console.error('[AnamnesisSection] Add error:', err)
      setFormError(err instanceof Error ? err.message : 'Fehler beim Erstellen des Eintrags')
    } finally {
      setIsSaving(false)
    }
  }

  const handleEditEntry = async () => {
    if (!selectedEntry || !formTitle.trim()) {
      return
    }

    setIsSaving(true)
    setFormError(null)

    try {
      const response = await fetch(`/api/clinician/anamnesis/${selectedEntry.id}/versions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formTitle,
          content: { text: formContent },
          entry_type: formEntryType || null,
          tags: formTags ? formTags.split(',').map((t) => t.trim()) : [],
          change_reason: 'Clinician update',
        }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || 'Fehler beim Aktualisieren des Eintrags')
      }

      // Reset form and close dialog
      resetForm()
      setIsEditDialogOpen(false)
      setSelectedEntry(null)
      
      // Refresh entries
      await fetchEntries()
    } catch (err) {
      console.error('[AnamnesisSection] Edit error:', err)
      setFormError(err instanceof Error ? err.message : 'Fehler beim Aktualisieren des Eintrags')
    } finally {
      setIsSaving(false)
    }
  }

  const handleArchiveEntry = async (entryId: string) => {
    if (!confirm('Möchten Sie diesen Eintrag wirklich archivieren?')) {
      return
    }

    try {
      const response = await fetch(`/api/clinician/anamnesis/${entryId}/archive`, {
        method: 'POST',
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.error?.message || 'Fehler beim Archivieren')
      }

      // Refresh entries
      await fetchEntries()
    } catch (err) {
      console.error('[AnamnesisSection] Archive error:', err)
      setError(err instanceof Error ? err.message : 'Fehler beim Archivieren des Eintrags')
    }
  }

  const openEditDialog = (entry: AnamnesisEntry) => {
    setSelectedEntry(entry)
    setFormTitle(entry.title)
    setFormContent(
      typeof entry.content === 'object' && entry.content !== null && 'text' in entry.content
        ? String(entry.content.text)
        : ''
    )
    setFormEntryType((entry.entry_type as EntryType) || '')
    setFormTags(entry.tags.join(', '))
    setIsEditDialogOpen(true)
  }

  const resetForm = () => {
    setFormTitle('')
    setFormContent('')
    setFormEntryType('')
    setFormTags('')
    setFormError(null)
  }

  const formatDate = (isoString: string): string => {
    try {
      return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(isoString))
    } catch {
      return 'Datum unbekannt'
    }
  }

  const getEntryTypeLabel = (type: string | null): string => {
    if (!type) return 'Sonstiges'
    
    const labels: Record<string, string> = {
      medical_history: 'Krankengeschichte',
      symptoms: 'Symptome',
      medications: 'Medikation',
      allergies: 'Allergien',
      family_history: 'Familienanamnese',
      lifestyle: 'Lebensstil',
      intake: 'Intake',
      funnel_summary: 'Funnel-Zusammenfassung',
      other: 'Sonstiges',
    }
    
    return labels[type] || type
  }

  const getContentText = (content: Record<string, unknown>): string | null => {
    const textValue = (content as { text?: unknown }).text
    if (typeof textValue === 'string' && textValue.trim()) return textValue
    if (typeof textValue === 'number') return String(textValue)
    const narrativeValue = (content as { narrative?: unknown }).narrative
    if (typeof narrativeValue === 'string' && narrativeValue.trim()) return narrativeValue
    return null
  }

  const getContentSources = (content: Record<string, unknown>): SuggestedFact[] => {
    const sourcesValue = (content as { sources?: unknown }).sources
    if (!Array.isArray(sourcesValue)) return []

    return sourcesValue
      .filter((item) => typeof item === 'object' && item !== null)
      .map((item) => {
        const source = item as Partial<SuggestedFact>
        return {
          id: source.id || `${source.sourceType || 'source'}:${source.sourceId || ''}:${source.label || ''}`,
          label: source.label ? String(source.label) : 'Quelle',
          value: source.value ? String(source.value) : '',
          sourceType: source.sourceType ? String(source.sourceType) : 'source',
          sourceId: source.sourceId ? String(source.sourceId) : '',
          occurredAt: source.occurredAt ? String(source.occurredAt) : null,
        }
      })
      .filter((source) => source.value.trim().length > 0)
  }

  const getIntakeEvidence = (content: Record<string, unknown>): string[] => {
    const evidenceValue = (content as { evidence?: unknown }).evidence
    if (!Array.isArray(evidenceValue)) return []

    return evidenceValue
      .filter((item) => typeof item === 'object' && item !== null)
      .map((item) => {
        const entry = item as { label?: unknown; ref?: unknown }
        const label = entry.label ? String(entry.label) : null
        const ref = entry.ref ? String(entry.ref) : ''
        if (!ref.trim()) return null
        return label ? `${label}: ${ref}` : ref
      })
      .filter((value): value is string => Boolean(value))
  }

  const fetchIntakeHistory = async (entryId: string) => {
    setIsIntakeHistoryLoading(true)
    setIntakeHistoryError(null)

    try {
      const response = await fetch(`/api/clinician/anamnesis/${entryId}/versions`)
      const data = await response.json()

      if (!response.ok || !data?.success) {
        throw new Error(data?.error?.message || 'Fehler beim Laden der Intake-Historie')
      }

      setIntakeVersions((data.data?.versions || []) as AnamnesisVersion[])
      setIsIntakeHistoryOpen(true)
    } catch (err) {
      console.error('[AnamnesisSection] Intake history error:', err)
      setIntakeHistoryError(
        err instanceof Error ? err.message : 'Fehler beim Laden der Intake-Historie',
      )
    } finally {
      setIsIntakeHistoryLoading(false)
    }
  }

  if (isLoading) {
    return (
      <Card padding="lg" shadow="md">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
            Patient Record
          </h2>
        </div>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Patient Record-Einträge werden geladen…
        </p>
      </Card>
    )
  }

  if (errorEvidenceCode || error) {
    return (
      <Card padding="lg" shadow="md">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
            Patient Record
          </h2>
        </div>
        <div className="text-center py-6">
          <FileText className="w-8 h-8 text-amber-300 dark:text-amber-600 mx-auto mb-3" />
          <p className="text-sm font-medium text-slate-700 dark:text-slate-200 mb-1">
            {error || 'Datenquelle aktuell nicht verfügbar'}
          </p>
          {errorEvidenceCode && (
            <p className="text-xs text-slate-500 dark:text-slate-400">
              EVIDENCE: {errorEvidenceCode}
            </p>
          )}
          {debugHint && (
            <p className="mt-2 text-xs text-amber-600 dark:text-amber-400">{debugHint}</p>
          )}
        </div>
      </Card>
    )
  }

  const intakeEntries = entries.filter((entry) => entry.entry_type === 'intake')
  const latestIntake = intakeEntries[0] || null
  const intakeEvidence = latestIntake ? getIntakeEvidence(latestIntake.content) : []

  return (
    <>
      <Card padding="lg" shadow="md" className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
            Intake
          </h2>
        </div>

        {latestIntake ? (
          <div className="space-y-3">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                  {latestIntake.title || 'Intake (letzter Kontakt)'}
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Aktualisiert: {formatDate(latestIntake.updated_at)}
                </p>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => fetchIntakeHistory(latestIntake.id)}
                disabled={isIntakeHistoryLoading}
              >
                {isIntakeHistoryLoading ? 'Laedt…' : 'History'}
              </Button>
            </div>
            {getContentText(latestIntake.content) ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {getContentText(latestIntake.content)}
              </p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Keine Intake-Zusammenfassung vorhanden.
              </p>
            )}
            {intakeEvidence.length > 0 && (
              <div className="rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 p-3">
                <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                  Key Facts
                </p>
                <div className="space-y-1">
                  {intakeEvidence.map((fact, index) => (
                    <div key={`${latestIntake.id}-fact-${index}`} className="text-xs text-slate-600 dark:text-slate-300">
                      {fact}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {intakeHistoryError && (
              <Alert variant="error">{intakeHistoryError}</Alert>
            )}
          </div>
        ) : (
          <div className="text-center py-6">
            <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Noch kein Intake erfasst
            </p>
          </div>
        )}
      </Card>

      <Card padding="lg" shadow="md" className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
          <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
            Vorschläge
          </h2>
        </div>

        {suggestedFacts.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Keine Vorschläge aus Assessments oder Ergebnissen verfügbar.
          </p>
        ) : (
          <div className="space-y-3">
            {suggestedFacts.map((fact) => (
              <label key={fact.id} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={selectedFactIds.includes(fact.id)}
                  onChange={(event) => {
                    setSelectedFactIds((prev) =>
                      event.target.checked
                        ? [...prev, fact.id]
                        : prev.filter((id) => id !== fact.id),
                    )
                  }}
                />
                <div>
                  <p className="text-sm font-medium text-slate-900 dark:text-slate-50">
                    {fact.label}: {fact.value}
                  </p>
                  {fact.occurredAt && (
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      {formatDate(fact.occurredAt)}
                    </p>
                  )}
                </div>
              </label>
            ))}
          </div>
        )}

        {suggestedError && (
          <div className="mt-4">
            <Alert variant="error">{suggestedError}</Alert>
          </div>
        )}

        <div className="mt-4">
          <Button
            variant="primary"
            size="sm"
            onClick={openSuggestedPreview}
            disabled={suggestedFacts.length === 0 || isCreatingVersion}
          >
            {isCreatingVersion ? 'Wird gespeichert…' : 'Vorschau & speichern'}
          </Button>
        </div>
      </Card>

      <Card padding="lg" shadow="md">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
              Patient Record
            </h2>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddDialogOpen(true)}
          >
            <Plus className="w-4 h-4 mr-1" />
            Eintrag hinzufügen
          </Button>
        </div>

        {entries.filter((entry) => entry.entry_type !== 'intake').length === 0 ? (
          <div className="text-center py-6">
            <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Noch keine Patient Record-Einträge vorhanden
            </p>
            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">
              Fügen Sie einen neuen Eintrag hinzu, um zu beginnen
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries
              .filter((entry) => !entry.is_archived)
              .filter((entry) => entry.entry_type !== 'intake')
              .map((entry) => (
                <div
                  key={entry.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700"
                >
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50 mb-1">
                        {entry.title}
                      </h3>
                      <div className="flex flex-wrap gap-2 items-center">
                        {entry.entry_type && (
                          <Badge variant="secondary" size="sm">
                            {getEntryTypeLabel(entry.entry_type)}
                          </Badge>
                        )}
                        {entry.version_count > 1 && (
                          <Badge variant="secondary" size="sm">
                            <Clock className="w-3 h-3 mr-1" />
                            v{entry.version_count}
                          </Badge>
                        )}
                        {entry.tags.map((tag) => (
                          <Badge key={tag} variant="secondary" size="sm">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openEditDialog(entry)}
                        className="p-2 text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                        title="Bearbeiten"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleArchiveEntry(entry.id)}
                        className="p-2 text-slate-600 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded transition-colors"
                        title="Archivieren"
                      >
                        <Archive className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {getContentText(entry.content) && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                      {getContentText(entry.content)}
                    </p>
                  )}

                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Aktualisiert: {formatDate(entry.updated_at)}
                  </p>
                </div>
              ))}
          </div>
        )}
      </Card>

      <Modal
        isOpen={isIntakeHistoryOpen}
        onClose={() => setIsIntakeHistoryOpen(false)}
        title="Intake Historie"
        size="xl"
      >
        {intakeVersions.length === 0 ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Keine Intake-Versionen gefunden.
          </p>
        ) : (
          <div className="space-y-3">
            {intakeVersions.map((version) => (
              <div
                key={version.id}
                className="rounded-lg border border-slate-200 dark:border-slate-700 p-3"
              >
                <div className="flex items-center justify-between gap-3 mb-2">
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                    v{version.version_number}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    {formatDate(version.changed_at)}
                  </p>
                </div>
                {getContentText(version.content) ? (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {getContentText(version.content)}
                  </p>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Keine Inhalte in dieser Version.
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>

      {/* Add Entry Dialog */}
      <Modal
        isOpen={isSuggestedPreviewOpen}
        onClose={() => setIsSuggestedPreviewOpen(false)}
        title="Vorschau: neue Patient Record-Version"
        size="xl"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setIsSuggestedPreviewOpen(false)}
              disabled={isCreatingVersion}
            >
              Abbrechen
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                if (!previewText) return
                navigator.clipboard?.writeText(previewText)
              }}
              disabled={!previewText}
            >
              Text kopieren
            </Button>
            <Button
              variant="primary"
              onClick={() => submitSuggestedFacts(previewFacts)}
              disabled={previewFacts.length === 0 || isCreatingVersion}
            >
              {isCreatingVersion ? 'Wird gespeichert…' : 'Als neue Version speichern'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {previewText ? (
            <pre className="whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-200 bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
              {previewText}
            </pre>
          ) : (
            <p className="text-sm text-slate-500 dark:text-slate-400">Keine Vorschlaege ausgewaehlt.</p>
          )}

          {previewFacts.length > 0 && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">Quellen</p>
              <div className="space-y-1">
                {previewFacts.map((source) => (
                  <div key={source.id} className="text-xs text-slate-600 dark:text-slate-300">
                    <span className="font-medium">{source.label}:</span> {source.value}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isAddDialogOpen}
        onClose={() => {
          setIsAddDialogOpen(false)
          resetForm()
        }}
        title="Neuer Patient Record-Eintrag"
        size="xl"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setIsAddDialogOpen(false)
                resetForm()
              }}
              disabled={isSaving}
            >
              Abbrechen
            </Button>
            <Button
              variant="primary"
              onClick={handleAddEntry}
              disabled={!formTitle.trim() || isSaving}
            >
              {isSaving ? 'Wird gespeichert…' : 'Speichern'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <Alert variant="error">
              {formError}
            </Alert>
          )}

          <FormField label="Titel" required>
            <Input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="z.B. Chronische Rückenschmerzen"
              required
            />
          </FormField>

          <FormField label="Typ">
            <Select
              value={formEntryType}
              onChange={(e) => setFormEntryType(e.target.value as EntryType | '')}
            >
              <option value="">Bitte wählen</option>
              {ENTRY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {getEntryTypeLabel(type)}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Inhalt">
            <Textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Detaillierte Informationen zum Patient Record-Eintrag..."
              rows={6}
            />
          </FormField>

          <FormField label="Tags (kommagetrennt)">
            <Input
              type="text"
              value={formTags}
              onChange={(e) => setFormTags(e.target.value)}
              placeholder="z.B. chronisch, behandelt"
            />
          </FormField>
        </div>
      </Modal>

      {/* Edit Entry Dialog */}
      <Modal
        isOpen={isEditDialogOpen}
        onClose={() => {
          setIsEditDialogOpen(false)
          setSelectedEntry(null)
          resetForm()
        }}
        title="Patient Record-Eintrag bearbeiten"
        size="xl"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setIsEditDialogOpen(false)
                setSelectedEntry(null)
                resetForm()
              }}
              disabled={isSaving}
            >
              Abbrechen
            </Button>
            <Button
              variant="primary"
              onClick={handleEditEntry}
              disabled={!formTitle.trim() || isSaving}
            >
              {isSaving ? 'Wird gespeichert…' : 'Änderungen speichern'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {formError && (
            <Alert variant="error">
              {formError}
            </Alert>
          )}

          <FormField label="Titel" required>
            <Input
              type="text"
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              placeholder="z.B. Chronische Rückenschmerzen"
              required
            />
          </FormField>

          <FormField label="Typ">
            <Select
              value={formEntryType}
              onChange={(e) => setFormEntryType(e.target.value as EntryType | '')}
            >
              <option value="">Bitte wählen</option>
              {ENTRY_TYPES.map((type) => (
                <option key={type} value={type}>
                  {getEntryTypeLabel(type)}
                </option>
              ))}
            </Select>
          </FormField>

          <FormField label="Inhalt">
            <Textarea
              value={formContent}
              onChange={(e) => setFormContent(e.target.value)}
              placeholder="Detaillierte Informationen zum Patient Record-Eintrag..."
              rows={6}
            />
          </FormField>

          <FormField label="Tags (kommagetrennt)">
            <Input
              type="text"
              value={formTags}
              onChange={(e) => setFormTags(e.target.value)}
              placeholder="z.B. chronisch, behandelt"
            />
          </FormField>

          {selectedEntry && selectedEntry.version_count > 0 && (
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <p className="text-xs text-blue-800 dark:text-blue-200">
                <Clock className="w-3 h-3 inline mr-1" />
                Beim Speichern wird eine neue Version (v{selectedEntry.version_count + 1}) erstellt
              </p>
            </div>
          )}
        </div>
      </Modal>
    </>
  )
}
