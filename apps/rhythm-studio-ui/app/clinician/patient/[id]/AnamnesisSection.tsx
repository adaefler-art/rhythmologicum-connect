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
import { Card, Badge, Button, Modal, FormField, Textarea, Alert } from '@/lib/ui'
import { FileText, Plus } from 'lucide-react'
import {
  getAnamnesis,
  getConsultNotes,
  createConsultNote,
  getConsultNote,
  getConsultNoteVersions,
  updateConsultNote,
} from '@/lib/fetchClinician'
import type { ConsultNote, ConsultNoteContent, ConsultNoteVersion } from '@/lib/types/consultNote'

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
  displaySummary?: string | null
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
  const [latestIntakeEntry, setLatestIntakeEntry] = useState<AnamnesisEntry | null>(null)
  const [debugHint, setDebugHint] = useState<string | null>(null)
  const [intakeVersions, setIntakeVersions] = useState<AnamnesisVersion[]>([])
  const [isIntakeHistoryOpen, setIsIntakeHistoryOpen] = useState(false)
  const [isIntakeHistoryLoading, setIsIntakeHistoryLoading] = useState(false)
  const [intakeHistoryError, setIntakeHistoryError] = useState<string | null>(null)
  const [patientOrganizationId, setPatientOrganizationId] = useState<string | null>(null)

  const [consultNotes, setConsultNotes] = useState<ConsultNote[]>([])
  const [notesLoading, setNotesLoading] = useState(false)
  const [notesError, setNotesError] = useState<string | null>(null)
  const [selectedConsultNote, setSelectedConsultNote] = useState<ConsultNote | null>(null)
  const [consultNoteVersions, setConsultNoteVersions] = useState<ConsultNoteVersion[]>([])
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false)
  const [noteDraftText, setNoteDraftText] = useState('')
  const [noteMode, setNoteMode] = useState<'create' | 'edit'>('create')
  const [noteSaving, setNoteSaving] = useState(false)
  const [noteError, setNoteError] = useState<string | null>(null)

  // Fetch entries on mount
  useEffect(() => {
    fetchEntries()
  }, [patientId])

  const fetchEntries = async () => {
    setIsLoading(true)
    setError(null)
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
        setEntries(loadedEntries)
        setPatientOrganizationId(
          typeof data.data.patientOrganizationId === 'string'
            ? data.data.patientOrganizationId
            : null,
        )

        const providedIntake = (data.data.latestIntakeEntry as unknown) as AnamnesisEntry | null
        const fallbackIntake = loadedEntries.find((entry) => entry.entry_type === 'intake') || null
        const resolvedIntake = providedIntake ?? fallbackIntake
        setLatestIntakeEntry(resolvedIntake)

        const intakeHistory = (data.data.intakeHistory || []) as unknown as AnamnesisVersion[]
        setIntakeVersions(intakeHistory)
      }
    } catch (err) {
      console.error('[AnamnesisSection] Fetch error:', err)
      setError('Fehler beim Laden der Patient Record-Einträge')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    void loadConsultNotes()
  }, [patientId])

  const buildConsultNoteContent = (noteText: string): ConsultNoteContent => {
    const nowIso = new Date().toISOString()
    const trimmed = noteText.trim()
    const title = trimmed.split('\n')[0]?.trim() || 'Notiz'
    const summaryLines = trimmed
      ? trimmed.split('\n').map((line) => line.trim()).filter(Boolean).slice(0, 10)
      : ['Draft']

    return {
      header: {
        timestamp: nowIso,
        consultationType: 'first',
        source: 'Manual note',
        uncertaintyProfile: 'qualitative',
        assertiveness: 'conservative',
        audience: 'clinician',
      },
      chiefComplaint: {
        text: title,
      },
      hpi: {},
      redFlagsScreening: {
        screened: false,
        positive: [],
      },
      medicalHistory: {},
      medications: {},
      objectiveData: {
        note: 'Manual note',
      },
      problemList: {
        problems: [
          'Manuelle Notiz (Draft)',
          'Weitere Abklaerung ausstehend',
          'Keine Diagnose festgelegt',
        ],
      },
      preliminaryAssessment: {
        hypotheses: ['Keine Hypothesen dokumentiert'],
      },
      missingData: {},
      nextSteps: {},
      handoffSummary: {
        summary: summaryLines,
      },
    }
  }

  const extractNoteText = (note: ConsultNote | null) => {
    if (!note) return ''
    const summary = note.content?.handoffSummary?.summary
    if (Array.isArray(summary) && summary.length > 0) {
      return summary.join('\n')
    }
    return note.content?.chiefComplaint?.text || ''
  }

  const loadConsultNotes = async () => {
    setNotesLoading(true)
    setNotesError(null)

    try {
      const { data, error } = await getConsultNotes(patientId)
      if (error) {
        throw new Error(error.message || 'Fehler beim Laden der Notizen')
      }

      const notes = (data?.data?.consultNotes || []) as unknown as ConsultNote[]
      setConsultNotes(notes)
    } catch (err) {
      console.error('[AnamnesisSection] Consult notes fetch error:', err)
      setNotesError(err instanceof Error ? err.message : 'Fehler beim Laden der Notizen')
    } finally {
      setNotesLoading(false)
    }
  }

  const loadConsultNoteVersions = async (consultNoteId: string) => {
    try {
      const { data, error } = await getConsultNoteVersions(consultNoteId)
      if (error) {
        throw new Error(error.message || 'Fehler beim Laden der Versionen')
      }
      const versions = (data?.data || []) as unknown as ConsultNoteVersion[]
      setConsultNoteVersions(versions)
    } catch (err) {
      console.error('[AnamnesisSection] Consult note versions error:', err)
      setNoteError(err instanceof Error ? err.message : 'Fehler beim Laden der Versionen')
    }
  }

  const openNewNote = () => {
    setNoteMode('create')
    setSelectedConsultNote(null)
    setNoteDraftText('')
    setConsultNoteVersions([])
    setNoteError(null)
    setIsNoteModalOpen(true)
  }

  const openNoteDetail = async (noteId: string) => {
    setNoteMode('edit')
    setNoteError(null)

    try {
      const { data, error } = await getConsultNote(noteId)
      if (error) {
        throw new Error(error.message || 'Fehler beim Laden der Notiz')
      }

      const note = (data?.data || null) as ConsultNote | null
      if (!note) {
        throw new Error('Notiz nicht gefunden')
      }

      setSelectedConsultNote(note)
      setNoteDraftText(extractNoteText(note))
      await loadConsultNoteVersions(note.id)
      setIsNoteModalOpen(true)
    } catch (err) {
      console.error('[AnamnesisSection] Consult note detail error:', err)
      setNoteError(err instanceof Error ? err.message : 'Fehler beim Laden der Notiz')
    }
  }

  const saveNote = async () => {
    if (!noteDraftText.trim()) {
      setNoteError('Bitte eine Notiz eingeben.')
      return
    }

    setNoteSaving(true)
    setNoteError(null)

    try {
      const content = buildConsultNoteContent(noteDraftText)

      if (noteMode === 'create') {
        if (!patientOrganizationId) {
          throw new Error('Organisation konnte nicht ermittelt werden.')
        }

        const { error } = await createConsultNote({
          patientId,
          organizationId: patientOrganizationId,
          content: content as Record<string, unknown>,
        })

        if (error) {
          throw new Error(error.message || 'Fehler beim Erstellen der Notiz')
        }
      } else if (selectedConsultNote) {
        const { error } = await updateConsultNote({
          consultNoteId: selectedConsultNote.id,
          content: content as Record<string, unknown>,
        })

        if (error) {
          throw new Error(error.message || 'Fehler beim Aktualisieren der Notiz')
        }
      }

      setIsNoteModalOpen(false)
      await loadConsultNotes()
    } catch (err) {
      console.error('[AnamnesisSection] Consult note save error:', err)
      setNoteError(err instanceof Error ? err.message : 'Fehler beim Speichern der Notiz')
    } finally {
      setNoteSaving(false)
    }
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

  const getContentText = (content: Record<string, unknown>): string | null => {
    const textValue = (content as { text?: unknown }).text
    if (typeof textValue === 'string' && textValue.trim()) return textValue
    if (typeof textValue === 'number') return String(textValue)
    const narrativeValue = (content as { narrative?: unknown }).narrative
    if (typeof narrativeValue === 'string' && narrativeValue.trim()) return narrativeValue
    const narrativeSummary = (content as { narrativeSummary?: unknown }).narrativeSummary
    if (typeof narrativeSummary === 'string' && narrativeSummary.trim()) return narrativeSummary
    return null
  }

  const getIntakeNarrative = (content: Record<string, unknown>): string | null => {
    const summaryAlias = (content as { summary?: unknown }).summary
    if (typeof summaryAlias === 'string' && summaryAlias.trim()) return summaryAlias.trim()
    const narrativeSummary = (content as { narrativeSummary?: unknown }).narrativeSummary
    if (typeof narrativeSummary === 'string' && narrativeSummary.trim()) return narrativeSummary.trim()
    const complaint = (content as { chiefComplaint?: unknown }).chiefComplaint
    if (typeof complaint === 'string' && complaint.trim()) return complaint.trim()
    const narrative = (content as { narrative?: unknown }).narrative
    if (typeof narrative === 'string' && narrative.trim()) return narrative.trim()
    const status = (content as { status?: unknown }).status
    if (typeof status === 'string' && status.trim()) return status.trim()
    return getContentText(content)
  }

  const normalizeIntakeContent = (content: unknown): Record<string, unknown> => {
    if (content && typeof content === 'object' && !Array.isArray(content)) {
      return content as Record<string, unknown>
    }

    if (typeof content === 'string' && content.trim()) {
      try {
        const parsed = JSON.parse(content)
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>
        }
      } catch {
        return { text: content }
      }
    }

    return {}
  }

  const hasStructuredSignals = (content: Record<string, unknown>): boolean => {
    const structured = (content as { structured?: unknown }).structured
    if (!structured || typeof structured !== 'object') return false

    const timeline = (structured as { timeline?: unknown }).timeline
    const keySymptoms = (structured as { keySymptoms?: unknown }).keySymptoms

    const hasTimeline = Array.isArray(timeline) && timeline.length > 0
    const hasSymptoms = Array.isArray(keySymptoms) && keySymptoms.length > 0

    return hasTimeline || hasSymptoms
  }

  const buildIntakeFallbackSummary = (content: Record<string, unknown>): string | null => {
    const complaint = getIntakeChiefComplaint(content)
    if (!complaint) return null

    const structured = (content as { structured?: unknown }).structured
    const keySymptoms = structured && typeof structured === 'object'
      ? (structured as { keySymptoms?: unknown }).keySymptoms
      : null

    if (Array.isArray(keySymptoms) && keySymptoms.length > 0) {
      const sample = keySymptoms
        .filter((item) => typeof item === 'string' && item.trim())
        .slice(0, 2)
      if (sample.length > 0) {
        return `${complaint} · Symptome: ${sample.join(', ')}`
      }
    }

    return complaint
  }

  const isDraftOnlyIntake = (content: Record<string, unknown>): boolean => {
    const status = (content as { status?: unknown }).status
    if (typeof status !== 'string' || !status.trim()) return false

    const summary = (content as { narrativeSummary?: unknown }).narrativeSummary
    const chiefComplaint = (content as { chiefComplaint?: unknown }).chiefComplaint
    const narrative = (content as { narrative?: unknown }).narrative
    const summaryAlias = (content as { summary?: unknown }).summary
    const evidenceRefs = (content as { evidenceRefs?: unknown }).evidenceRefs

    const hasSummary =
      (typeof summary === 'string' && summary.trim()) ||
      (typeof summaryAlias === 'string' && summaryAlias.trim()) ||
      (typeof narrative === 'string' && narrative.trim())
    const hasChiefComplaint = typeof chiefComplaint === 'string' && chiefComplaint.trim()
    const hasStructured = hasStructuredSignals(content)
    const hasEvidenceRefs = Array.isArray(evidenceRefs) && evidenceRefs.length > 0

    return !hasSummary && !hasChiefComplaint && !hasStructured && !hasEvidenceRefs
  }

  const getIntakeStatus = (content: Record<string, unknown>): string | null => {
    const status = (content as { status?: unknown }).status
    if (typeof status === 'string' && status.trim()) return status.trim()
    return null
  }

  const getIntakeChiefComplaint = (content: Record<string, unknown>): string | null => {
    const complaint = (content as { chiefComplaint?: unknown }).chiefComplaint
    if (typeof complaint === 'string' && complaint.trim()) return complaint.trim()
    return null
  }

  const getIntakeEvidence = (content: Record<string, unknown>): string[] => {
    const items: string[] = []
    const evidenceRefs = (content as { evidenceRefs?: unknown }).evidenceRefs
    if (Array.isArray(evidenceRefs)) {
      evidenceRefs.forEach((entry) => {
        if (typeof entry === 'string' && entry.trim()) {
          items.push(entry.trim())
        }
      })
    }

    const structured = (content as { structured?: unknown }).structured
    if (structured && typeof structured === 'object') {
      const keySymptoms = (structured as { keySymptoms?: unknown }).keySymptoms
      if (Array.isArray(keySymptoms)) {
        keySymptoms.forEach((symptom) => {
          if (typeof symptom === 'string' && symptom.trim()) {
            items.push(`Symptom: ${symptom.trim()}`)
          }
        })
      }
    }

    const redFlags = (content as { redFlags?: unknown }).redFlags
    if (Array.isArray(redFlags)) {
      redFlags.forEach((flag) => {
        if (typeof flag === 'string' && flag.trim()) {
          items.push(`Red Flag: ${flag.trim()}`)
        }
      })
    }

    return items
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

  const latestIntake = latestIntakeEntry || entries.find((entry) => entry.entry_type === 'intake') || null
  const intakeRawContent = intakeVersions[0]?.content || latestIntake?.content
  const intakeContent = normalizeIntakeContent(intakeRawContent)
  const intakeEvidence = latestIntake ? getIntakeEvidence(intakeContent) : []
  const intakeSummary = latestIntake?.displaySummary || (latestIntake ? getIntakeNarrative(intakeContent) : null)
  const intakeFallbackSummary = latestIntake ? buildIntakeFallbackSummary(intakeContent) : null
  const intakeChiefComplaint = latestIntake ? getIntakeChiefComplaint(intakeContent) : null
  const intakeStatus = latestIntake ? getIntakeStatus(intakeContent) : null
  const intakeUpdatedAt = intakeVersions[0]?.changed_at || latestIntake?.updated_at
  const intakeIsDraftOnly = latestIntake ? isDraftOnlyIntake(intakeContent) : false

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
                {intakeUpdatedAt && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Aktualisiert: {formatDate(intakeUpdatedAt)}
                  </p>
                )}
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
            {intakeSummary ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {intakeSummary}
              </p>
            ) : intakeFallbackSummary ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {intakeFallbackSummary}
              </p>
            ) : intakeIsDraftOnly ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Draft gespeichert (noch keine Zusammenfassung).
              </p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Keine Intake-Zusammenfassung vorhanden.
              </p>
            )}
            {intakeChiefComplaint && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hauptbeschwerde: {intakeChiefComplaint}
              </p>
            )}
            {intakeStatus && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Status: {intakeStatus}
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
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">
              Notizen
            </h2>
          </div>
          <Button variant="primary" size="sm" onClick={openNewNote}>
            <Plus className="w-4 h-4 mr-1" />
            Neue Notiz
          </Button>
        </div>

        {notesLoading ? (
          <p className="text-sm text-slate-500 dark:text-slate-400">Notizen werden geladen…</p>
        ) : notesError ? (
          <Alert variant="error">{notesError}</Alert>
        ) : consultNotes.length === 0 ? (
          <div className="text-center py-6">
            <FileText className="w-8 h-8 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Noch keine Notizen vorhanden.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {consultNotes.map((note) => (
              <button
                key={note.id}
                type="button"
                onClick={() => openNoteDetail(note.id)}
                className="w-full text-left p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 transition-colors"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                      {note.content?.chiefComplaint?.text || 'Notiz'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Aktualisiert: {formatDate(note.updated_at)}
                    </p>
                  </div>
                  <Badge variant="secondary" size="sm">
                    Draft
                  </Badge>
                </div>
                {note.updated_by && (
                  <p className="text-xs text-slate-400 dark:text-slate-500 mt-2">
                    Author: {note.updated_by.slice(0, 8)}…
                  </p>
                )}
              </button>
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
                {getIntakeNarrative(version.content) ? (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {getIntakeNarrative(version.content)}
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

      <Modal
        isOpen={isNoteModalOpen}
        onClose={() => setIsNoteModalOpen(false)}
        title={noteMode === 'create' ? 'Neue Notiz' : 'Notiz bearbeiten'}
        size="xl"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsNoteModalOpen(false)} disabled={noteSaving}>
              Abbrechen
            </Button>
            <Button variant="primary" onClick={saveNote} disabled={noteSaving}>
              {noteSaving ? 'Wird gespeichert…' : 'Speichern'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          {noteError && <Alert variant="error">{noteError}</Alert>}

          <FormField label="Notiz" required>
            <Textarea
              value={noteDraftText}
              onChange={(event) => setNoteDraftText(event.target.value)}
              placeholder="Freie Notiz fuer Arzt/Nurse…"
              rows={8}
            />
          </FormField>

          {consultNoteVersions.length > 0 && (
            <div className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
              <p className="text-xs font-semibold text-slate-600 dark:text-slate-300 mb-2">
                Versionshistorie
              </p>
              <div className="space-y-2">
                {consultNoteVersions.map((version) => (
                  <div key={version.id} className="text-xs text-slate-600 dark:text-slate-300">
                    v{version.version_number} · {formatDate(version.created_at)}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </Modal>

    </>
  )
}
