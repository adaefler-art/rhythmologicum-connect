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
 * Data sources: /api/clinician/patient/[patientId]/anamnesis (entries) +
 *               /api/clinician/patient/[patientId]/clinical-intake/latest (intake)
 * Access control: Requires clinician role + patient assignment
 */

import { useState, useEffect, useCallback } from 'react'
import { Card, Badge, Button, Modal, FormField, Textarea, Alert } from '@/lib/ui'
import { FileText, Plus } from 'lucide-react'
import { env } from '@/lib/env'
import {
  getAnamnesis,
  getConsultNotes,
  createConsultNote,
  getConsultNote,
  getConsultNoteVersions,
  updateConsultNote,
  getClinicalIntakeLatest,
  getClinicalIntakeHistory,
  updateClinicalIntakeOverride,
  getClinicalIntakeReviewLatest,
  updateClinicalIntakeReview,
} from '@/lib/fetchClinician'
import type { ConsultNote, ConsultNoteContent, ConsultNoteVersion } from '@/lib/types/consultNote'
import type {
  SafetyEvaluation,
  SafetyOverride,
  SafetyPolicyResult,
  SafetyTriggeredRule,
  ChatAction,
  EscalationLevel,
} from '@/lib/types/clinicalIntake'
import { getSafetyUiState } from '@/lib/cre/safety/policy'

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

export interface ClinicalIntakeRecord {
  id: string
  status: string
  version_number: number
  clinical_summary: string | null
  structured_data: Record<string, unknown>
  trigger_reason: string | null
  last_updated_from_messages: string[] | null
  created_at: string
  updated_at: string
}

export interface ClinicalIntakeReviewRecord {
  id: string
  intake_id: string
  status: 'draft' | 'in_review' | 'approved' | 'needs_more_info' | 'rejected'
  review_notes: string | null
  requested_items: string[] | null
  reviewed_by: string
  is_current: boolean
  created_at: string
  updated_at: string
}


export interface AnamnesisSectionProps {
  /** Patient ID for fetching/creating entries */
  patientId: string
  /** Loading state */
  loading?: boolean
  /** Error evidence code (PHI-safe) */
  errorEvidenceCode?: string
}

type EvidenceExcerpt = {
  text: string
  source: 'chat' | 'intake'
  refId: string
}

type TriggeredRuleUi = {
  ruleId: string
  title: string
  level: string
  shortReason: string
  excerpts: EvidenceExcerpt[]
  allEvidenceRefs: string[]
}

const MAX_EXCERPT_LENGTH = 220
const MAX_RULE_EXCERPTS = 3
const REVIEW_STATUSES = ['draft', 'in_review', 'approved', 'needs_more_info', 'rejected'] as const

const isReviewStatus = (
  value: unknown,
): value is ClinicalIntakeReviewRecord['status'] =>
  typeof value === 'string' &&
  (REVIEW_STATUSES as readonly string[]).includes(value)

const parseClinicalIntakeReviewRecord = (
  value: unknown,
): ClinicalIntakeReviewRecord | null => {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null

  const record = value as Record<string, unknown>
  const { id, intake_id, status, review_notes, requested_items, reviewed_by, is_current, created_at, updated_at } =
    record

  if (
    typeof id !== 'string' ||
    typeof intake_id !== 'string' ||
    !isReviewStatus(status) ||
    (review_notes !== null && typeof review_notes !== 'string') ||
    (requested_items !== null &&
      requested_items !== undefined &&
      (!Array.isArray(requested_items) ||
        requested_items.some((item) => typeof item !== 'string'))) ||
    typeof reviewed_by !== 'string' ||
    typeof is_current !== 'boolean' ||
    typeof created_at !== 'string' ||
    typeof updated_at !== 'string'
  ) {
    return null
  }

  return {
    id,
    intake_id,
    status,
    review_notes,
    requested_items: Array.isArray(requested_items) ? requested_items : null,
    reviewed_by,
    is_current,
    created_at,
    updated_at,
  }
}

const clampExcerpt = (value: string, max = MAX_EXCERPT_LENGTH) =>
  value.length > max ? `${value.slice(0, max).trim()}…` : value

const buildIntakeExcerpts = (structuredIntakeData: Record<string, unknown> | null) => {
  if (!structuredIntakeData) return [] as EvidenceExcerpt[]
  const excerpts: EvidenceExcerpt[] = []

  const pushExcerpt = (text: string | undefined, refId: string) => {
    if (!text) return
    const trimmed = text.trim()
    if (!trimmed) return
    excerpts.push({ text: clampExcerpt(trimmed), source: 'intake', refId })
  }

  pushExcerpt(
    typeof structuredIntakeData.chief_complaint === 'string'
      ? structuredIntakeData.chief_complaint
      : undefined,
    'intake:chief_complaint',
  )
  pushExcerpt(
    typeof structuredIntakeData.narrative_summary === 'string'
      ? structuredIntakeData.narrative_summary
      : undefined,
    'intake:narrative_summary',
  )

  const hpi = structuredIntakeData.history_of_present_illness
  if (hpi && typeof hpi === 'object') {
    const record = hpi as Record<string, unknown>
    pushExcerpt(
      typeof record.onset === 'string' ? record.onset : undefined,
      'intake:hpi:onset',
    )
    pushExcerpt(
      typeof record.duration === 'string' ? record.duration : undefined,
      'intake:hpi:duration',
    )
    pushExcerpt(
      typeof record.course === 'string' ? record.course : undefined,
      'intake:hpi:course',
    )
  }

  const arrayFields: Array<{ key: string; label: string }> = [
    { key: 'relevant_negatives', label: 'intake:relevant_negatives' },
    { key: 'past_medical_history', label: 'intake:past_medical_history' },
    { key: 'medication', label: 'intake:medication' },
    { key: 'psychosocial_factors', label: 'intake:psychosocial_factors' },
    { key: 'uncertainties', label: 'intake:uncertainties' },
  ]

  arrayFields.forEach(({ key, label }) => {
    const value = structuredIntakeData[key]
    if (!Array.isArray(value)) return
    const first = value.find((item) => typeof item === 'string' && item.trim()) as string | undefined
    pushExcerpt(first, label)
  })

  return excerpts
}

const resolveEvidenceRefs = (params: {
  refIds: string[]
  structuredIntakeData: Record<string, unknown> | null
}): EvidenceExcerpt[] => {
  const { refIds, structuredIntakeData } = params
  const resolved: EvidenceExcerpt[] = []

  const evidenceRefsRaw = structuredIntakeData?.evidence_refs
  const evidenceMap = new Map<string, EvidenceExcerpt>()
  if (Array.isArray(evidenceRefsRaw)) {
    evidenceRefsRaw.forEach((entry) => {
      if (!entry || typeof entry !== 'object') return
      const record = entry as { ref?: unknown; text?: unknown; source?: unknown }
      if (typeof record.ref === 'string' && typeof record.text === 'string') {
        evidenceMap.set(record.ref, {
          text: clampExcerpt(record.text),
          source: record.source === 'chat' ? 'chat' : 'intake',
          refId: record.ref,
        })
      }
    })
  }

  refIds.forEach((refId) => {
    if (!refId) return
    const mapped = evidenceMap.get(refId)
    if (mapped) {
      resolved.push(mapped)
    }
  })

  if (resolved.length === 0) {
    return buildIntakeExcerpts(structuredIntakeData).slice(0, MAX_RULE_EXCERPTS)
  }

  return resolved
}

/**
 * Displays patient anamnesis entries with add/edit/archive capabilities
 */
export function AnamnesisSection({ patientId, loading, errorEvidenceCode }: AnamnesisSectionProps) {
  const [, setEntries] = useState<AnamnesisEntry[]>([])
  const [isLoading, setIsLoading] = useState(loading ?? false)
  const [error, setError] = useState<string | null>(null)
  const [latestClinicalIntake, setLatestClinicalIntake] = useState<ClinicalIntakeRecord | null>(null)
  const [debugHint, setDebugHint] = useState<string | null>(null)
  const [intakeVersions, setIntakeVersions] = useState<ClinicalIntakeRecord[]>([])
  const [isIntakeHistoryOpen, setIsIntakeHistoryOpen] = useState(false)
  const [isIntakeHistoryLoading, setIsIntakeHistoryLoading] = useState(false)
  const [intakeHistoryError, setIntakeHistoryError] = useState<string | null>(null)
  const [intakeError, setIntakeError] = useState<string | null>(null)
  const [patientOrganizationId, setPatientOrganizationId] = useState<string | null>(null)
  const [overrideLevel, setOverrideLevel] = useState<EscalationLevel | 'none'>('none')
  const [overrideAction, setOverrideAction] = useState<ChatAction | 'none'>('none')
  const [overrideReason, setOverrideReason] = useState('')
  const [overrideSaving, setOverrideSaving] = useState(false)
  const [overrideError, setOverrideError] = useState<string | null>(null)
  const [isOverrideEditing, setIsOverrideEditing] = useState(false)
  const [reviewState, setReviewState] = useState<ClinicalIntakeReviewRecord | null>(null)
  const [reviewAudit, setReviewAudit] = useState<ClinicalIntakeReviewRecord[]>([])
  const [reviewStatusDraft, setReviewStatusDraft] = useState<
    'draft' | 'in_review' | 'approved' | 'needs_more_info' | 'rejected'
  >('in_review')
  const [reviewNotes, setReviewNotes] = useState('')
  const [requestedItemsText, setRequestedItemsText] = useState('')
  const [reviewLoading, setReviewLoading] = useState(false)
  const [reviewSaving, setReviewSaving] = useState(false)
  const [reviewError, setReviewError] = useState<string | null>(null)

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

  const loadLatestClinicalIntake = useCallback(async () => {
    setIntakeError(null)

    try {
      const { data, error } = await getClinicalIntakeLatest(patientId)

      if (error) {
        if (error.status === 403) {
          setIntakeError('Keine Berechtigung fuer diesen Intake')
        } else if (error.status === 404) {
          setIntakeError('Intake nicht gefunden')
        } else {
          setIntakeError(error.message || 'Fehler beim Laden des Intakes')
        }
        setLatestClinicalIntake(null)
        return
      }

      const intake = (data?.data?.intake || null) as ClinicalIntakeRecord | null
      setLatestClinicalIntake(intake)

      if (!intake?.id) {
        setReviewState(null)
        setReviewAudit([])
      }
    } catch (err) {
      console.error('[AnamnesisSection] Intake fetch error:', err)
      setIntakeError('Fehler beim Laden des Intakes')
      setLatestClinicalIntake(null)
    }
  }, [patientId])

  const loadClinicalIntakeReview = useCallback(async (intakeId: string | null) => {
    if (!intakeId) {
      setReviewState(null)
      setReviewAudit([])
      return
    }

    setReviewLoading(true)
    setReviewError(null)

    try {
      const { data, error } = await getClinicalIntakeReviewLatest(patientId, intakeId)
      if (error) {
        throw new Error(error.message || 'Fehler beim Laden des Reviews')
      }

      const currentReview = parseClinicalIntakeReviewRecord(data?.review_state)
      const audit = Array.isArray(data?.audit)
        ? data.audit
            .map((item) => parseClinicalIntakeReviewRecord(item))
            .filter((item): item is ClinicalIntakeReviewRecord => item !== null)
        : []

      setReviewState(currentReview)
      setReviewAudit(audit)
      setReviewStatusDraft(currentReview?.status ?? 'in_review')
      setReviewNotes(currentReview?.review_notes ?? '')
      setRequestedItemsText((currentReview?.requested_items || []).join('\n'))
    } catch (err) {
      console.error('[AnamnesisSection] Review fetch error:', err)
      setReviewError(err instanceof Error ? err.message : 'Fehler beim Laden des Reviews')
      setReviewState(null)
      setReviewAudit([])
    } finally {
      setReviewLoading(false)
    }
  }, [patientId])

  const fetchEntries = useCallback(async () => {
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
      }

      await loadLatestClinicalIntake()
    } catch (err) {
      console.error('[AnamnesisSection] Fetch error:', err)
      setError('Fehler beim Laden der Patient Record-Einträge')
    } finally {
      setIsLoading(false)
    }
  }, [loadLatestClinicalIntake, patientId])

  // Fetch entries on mount
  useEffect(() => {
    void fetchEntries()
  }, [fetchEntries])

  const loadConsultNotes = useCallback(async () => {
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
  }, [patientId])

  useEffect(() => {
    void loadConsultNotes()
  }, [loadConsultNotes])

  useEffect(() => {
    const safety = latestClinicalIntake?.structured_data?.safety as SafetyEvaluation | undefined
    const override = safety?.override ?? null
    setOverrideLevel((override?.level_override as EscalationLevel) ?? 'none')
    setOverrideAction((override?.chat_action_override as ChatAction) ?? 'none')
    setOverrideReason(override?.reason ?? '')
    setIsOverrideEditing(Boolean(!override))
  }, [latestClinicalIntake])

  useEffect(() => {
    void loadClinicalIntakeReview(latestClinicalIntake?.id ?? null)
  }, [latestClinicalIntake?.id, loadClinicalIntakeReview])

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
          content: content as unknown as Record<string, unknown>,
        })

        if (error) {
          throw new Error(error.message || 'Fehler beim Erstellen der Notiz')
        }
      } else if (selectedConsultNote) {
        const { error } = await updateConsultNote({
          consultNoteId: selectedConsultNote.id,
          content: content as unknown as Record<string, unknown>,
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

  const getInterpretedClinicalSummary = (content: Record<string, unknown>) => {
    const interpreted = (content as { interpreted_clinical_summary?: unknown })
      .interpreted_clinical_summary
    if (!interpreted || typeof interpreted !== 'object' || Array.isArray(interpreted)) {
      return null
    }

    const record = interpreted as Record<string, unknown>
    const shortSummary = Array.isArray(record.short_summary)
      ? record.short_summary.filter((item) => typeof item === 'string' && item.trim())
      : []
    const narrativeHistory =
      typeof record.narrative_history === 'string' && record.narrative_history.trim()
        ? record.narrative_history.trim()
        : ''
    const openQuestions = Array.isArray(record.open_questions)
      ? record.open_questions.filter((item) => typeof item === 'string' && item.trim())
      : []
    const relevantNegatives = Array.isArray(record.relevant_negatives)
      ? record.relevant_negatives.filter((item) => typeof item === 'string' && item.trim())
      : []
    const meds = Array.isArray(record.meds)
      ? record.meds.filter((item) => typeof item === 'string' && item.trim())
      : []
    const redFlagsRecord = record.red_flags
    const redFlags =
      redFlagsRecord && typeof redFlagsRecord === 'object' && !Array.isArray(redFlagsRecord)
        ? {
            present: Boolean((redFlagsRecord as { present?: unknown }).present),
            items: (() => {
              const itemsValue = (redFlagsRecord as { items?: unknown }).items
              if (!Array.isArray(itemsValue)) return []

              return itemsValue.filter(
                (item): item is string => typeof item === 'string' && item.trim().length > 0,
              )
            })(),
          }
        : { present: false, items: [] }

    if (
      shortSummary.length === 0 &&
      !narrativeHistory &&
      openQuestions.length === 0 &&
      relevantNegatives.length === 0 &&
      meds.length === 0 &&
      redFlags.items.length === 0
    ) {
      return null
    }

    return {
      shortSummary,
      narrativeHistory,
      openQuestions,
      relevantNegatives,
      meds,
      redFlags,
    }
  }

  const getClinicalSummary = (content: Record<string, unknown>): string | null => {
    const summary = (content as { clinical_summary?: unknown }).clinical_summary
    if (typeof summary === 'string' && summary.trim()) return summary.trim()
    return null
  }

  const buildIntakeContent = (intake: ClinicalIntakeRecord): Record<string, unknown> => ({
    status: intake.status,
    clinical_summary: intake.clinical_summary,
    structured_data: intake.structured_data,
    trigger_reason: intake.trigger_reason,
    last_updated_from_messages: intake.last_updated_from_messages,
  })

  const getStructuredIntakeData = (content: Record<string, unknown>) => {
    const structured = (content as { structured_data?: unknown }).structured_data
    if (structured && typeof structured === 'object' && !Array.isArray(structured)) {
      return structured as Record<string, unknown>
    }

    const structuredIntake = (content as { structured_intake_data?: unknown }).structured_intake_data
    if (structuredIntake && typeof structuredIntake === 'object' && !Array.isArray(structuredIntake)) {
      return structuredIntake as Record<string, unknown>
    }

    const legacyStructured = (content as { structured?: unknown }).structured

    return {
      chief_complaint: (content as { chiefComplaint?: unknown }).chiefComplaint ?? '',
      narrative_summary: (content as { narrativeSummary?: unknown }).narrativeSummary ?? '',
      structured:
        legacyStructured && typeof legacyStructured === 'object'
          ? {
              timeline: (legacyStructured as { timeline?: unknown }).timeline ?? [],
              key_symptoms: (legacyStructured as { keySymptoms?: unknown }).keySymptoms ?? [],
            }
          : { timeline: [], key_symptoms: [] },
      red_flags: (content as { redFlags?: unknown }).redFlags ?? [],
      open_questions: (content as { openQuestions?: unknown }).openQuestions ?? [],
      evidence_refs: (content as { evidenceRefs?: unknown }).evidenceRefs ?? [],
    }
  }

  const getSafetyInfo = (content: Record<string, unknown>) => {
    const structuredData = getStructuredIntakeData(content)
    const safety = (structuredData as { safety?: unknown }).safety
    if (safety && typeof safety === 'object' && !Array.isArray(safety)) {
      return safety as Record<string, unknown>
    }
    return null
  }

  const getEscalationBadge = (level: string | null) => {
    if (!level) return null
    if (level === 'A') return { label: 'Level A', variant: 'danger' as const }
    if (level === 'B') return { label: 'Level B', variant: 'warning' as const }
    return { label: 'Level C', variant: 'secondary' as const }
  }

  const getIntakeNarrative = (content: Record<string, unknown>): string | null => {
    const summary = getClinicalSummary(content)
    if (summary) return summary

    const interpreted = getInterpretedClinicalSummary(content)
    if (interpreted?.narrativeHistory) return interpreted.narrativeHistory
    if (interpreted?.shortSummary && interpreted.shortSummary.length > 0) {
      return interpreted.shortSummary[0]
    }

    const structuredData = getStructuredIntakeData(content)
    const narrativeSummary = structuredData?.narrative_summary
    if (typeof narrativeSummary === 'string' && narrativeSummary.trim()) return narrativeSummary.trim()
    const complaint = structuredData?.chief_complaint
    if (typeof complaint === 'string' && complaint.trim()) return complaint.trim()

    const summaryAlias = (content as { summary?: unknown }).summary
    if (typeof summaryAlias === 'string' && summaryAlias.trim()) return summaryAlias.trim()
    const narrativeSummaryLegacy = (content as { narrativeSummary?: unknown }).narrativeSummary
    if (typeof narrativeSummaryLegacy === 'string' && narrativeSummaryLegacy.trim()) {
      return narrativeSummaryLegacy.trim()
    }
    const complaintLegacy = (content as { chiefComplaint?: unknown }).chiefComplaint
    if (typeof complaintLegacy === 'string' && complaintLegacy.trim()) return complaintLegacy.trim()
    const narrative = (content as { narrative?: unknown }).narrative
    if (typeof narrative === 'string' && narrative.trim()) return narrative.trim()
    const status = (content as { status?: unknown }).status
    if (typeof status === 'string' && status.trim()) return status.trim()
    return getContentText(content)
  }

  const getIntakeStatus = (content: Record<string, unknown>): string | null => {
    const status = (content as { status?: unknown }).status
    if (typeof status === 'string' && status.trim()) return status.trim()
    return null
  }

  const getIntakeChiefComplaint = (content: Record<string, unknown>): string | null => {
    const structuredData = getStructuredIntakeData(content)
    const complaint = structuredData?.chief_complaint ?? (content as { chiefComplaint?: unknown }).chiefComplaint
    if (typeof complaint === 'string' && complaint.trim()) return complaint.trim()
    return null
  }

  const fetchIntakeHistory = async () => {
    setIsIntakeHistoryLoading(true)
    setIntakeHistoryError(null)

    try {
      const { data, error } = await getClinicalIntakeHistory(patientId)

      if (error) {
        throw new Error(error.message || 'Fehler beim Laden der Intake-Historie')
      }

      setIntakeVersions((data?.data?.intakes || []) as unknown as ClinicalIntakeRecord[])
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

  const latestIntake = latestClinicalIntake
  const intakeContent = latestIntake ? buildIntakeContent(latestIntake) : {}
  const intakeClinicalSummary = latestIntake ? getClinicalSummary(intakeContent) : null
  const structuredIntakeData = latestIntake ? getStructuredIntakeData(intakeContent) : null
  const safetyInfo = latestIntake ? getSafetyInfo(intakeContent) : null
  const escalationLevel =
    safetyInfo && typeof safetyInfo.escalation_level === 'string'
      ? safetyInfo.escalation_level
      : null
  const safetyEvaluation =
    safetyInfo && typeof safetyInfo === 'object'
      ? (safetyInfo as unknown as SafetyEvaluation)
      : null
  const safetyUiState = getSafetyUiState(safetyEvaluation)
  const escalationBadge = getEscalationBadge(escalationLevel)
  const redFlags =
    safetyInfo && Array.isArray(safetyInfo.red_flags)
      ? (safetyInfo.red_flags as Array<Record<string, unknown>>)
      : []
  const structuredIntakeDisplay = structuredIntakeData
    ? (() => {
        const { evidence_refs: _evidenceRefs, ...rest } = structuredIntakeData
        void _evidenceRefs
        return rest
      })()
    : null
  const intakeChiefComplaint = latestIntake ? getIntakeChiefComplaint(intakeContent) : null
  const intakeStatus = latestIntake ? getIntakeStatus(intakeContent) : null
  const intakeUpdatedAt = latestIntake?.updated_at
  const showDebug = env.NODE_ENV !== 'production'
  const policyResult = safetyEvaluation?.policy_result as SafetyPolicyResult | undefined
  const effectiveLevel = safetyEvaluation?.effective_level ?? policyResult?.escalation_level ?? null
  const effectiveAction = safetyEvaluation?.effective_action ?? policyResult?.chat_action ?? 'none'
  const overrideInfo = safetyEvaluation?.override as SafetyOverride | null | undefined
  const triggeredRules = safetyEvaluation?.triggered_rules as SafetyTriggeredRule[] | undefined
  const triggeredRuleUi: TriggeredRuleUi[] = Array.isArray(triggeredRules)
    ? triggeredRules.map((rule) => {
        const legacyRule = rule as unknown as Record<string, unknown>
        const ruleId = typeof rule.rule_id === 'string' ? rule.rule_id : ''
        const title = typeof rule.title === 'string' && rule.title.trim() ? rule.title : ruleId
        const level = (typeof rule.level === 'string'
          ? rule.level
          : (legacyRule.severity as string) || 'C') as EscalationLevel | 'needs_review'
        const shortReason =
          typeof rule.short_reason === 'string'
            ? rule.short_reason
            : typeof legacyRule.rationale === 'string'
              ? legacyRule.rationale
              : ''
        const evidenceItems = Array.isArray(rule.evidence)
          ? rule.evidence
          : []
        const evidenceRefs = Array.isArray((legacyRule as { evidence_message_ids?: unknown }).evidence_message_ids)
          ? (legacyRule as { evidence_message_ids?: string[] }).evidence_message_ids ?? []
          : []
        const excerpts = evidenceItems.length > 0
          ? evidenceItems
              .filter((item) => typeof item.excerpt === 'string' && item.excerpt.trim())
              .map((item) => ({
                refId: item.source_id,
                source: item.source,
                text: item.excerpt,
              }))
              .slice(0, MAX_RULE_EXCERPTS)
          : resolveEvidenceRefs({
              refIds: evidenceRefs,
              structuredIntakeData: structuredIntakeData as Record<string, unknown> | null,
            }).slice(0, MAX_RULE_EXCERPTS)

        return {
          ruleId,
          title,
          level,
          shortReason,
          excerpts,
          allEvidenceRefs: evidenceItems.map((item) => item.source_id).concat(evidenceRefs),
        }
      })
    : []

  const handleOverrideSave = async () => {
    if (!latestIntake) return
    const shouldRequireReason = overrideLevel !== 'none' || overrideAction !== 'none'
    if (shouldRequireReason && !overrideReason.trim()) {
      setOverrideError('Bitte einen Grund fuer die Uebersteuerung angeben.')
      return
    }

    setOverrideSaving(true)
    setOverrideError(null)

    try {
      const payload = {
        override_level: overrideLevel === 'none' ? null : overrideLevel,
        override_action: overrideAction === 'none' ? null : overrideAction,
        reason: overrideReason.trim(),
      }

      const { error } = await updateClinicalIntakeOverride(patientId, latestIntake.id, payload)
      if (error) {
        throw new Error(error.message || 'Fehler beim Speichern der Uebersteuerung')
      }

      await loadLatestClinicalIntake()
      setIsOverrideEditing(false)
    } catch (err) {
      setOverrideError(err instanceof Error ? err.message : 'Fehler beim Speichern')
    } finally {
      setOverrideSaving(false)
    }
  }

  const getReviewStatusBadge = (status: ClinicalIntakeReviewRecord['status']) => {
    if (status === 'approved') return { label: 'Approved', variant: 'success' as const }
    if (status === 'rejected') return { label: 'Rejected', variant: 'danger' as const }
    if (status === 'needs_more_info') return { label: 'Needs more info', variant: 'warning' as const }
    if (status === 'in_review') return { label: 'In review', variant: 'secondary' as const }
    return { label: 'Draft', variant: 'secondary' as const }
  }

  const saveReviewState = async (
    status: 'draft' | 'in_review' | 'approved' | 'needs_more_info' | 'rejected',
  ) => {
    if (!latestIntake?.id) return

    const requestedItems = requestedItemsText
      .split(/\n|,/)
      .map((item) => item.trim())
      .filter(Boolean)

    setReviewSaving(true)
    setReviewError(null)

    try {
      const { data, error } = await updateClinicalIntakeReview(patientId, latestIntake.id, {
        status,
        review_notes: reviewNotes,
        requested_items: requestedItems,
      })

      if (error) {
        throw new Error(error.message || 'Fehler beim Speichern des Reviews')
      }

      const currentReview = parseClinicalIntakeReviewRecord(data?.review_state)
      const audit = Array.isArray(data?.audit)
        ? data.audit
            .map((item) => parseClinicalIntakeReviewRecord(item))
            .filter((item): item is ClinicalIntakeReviewRecord => item !== null)
        : []
      setReviewState(currentReview)
      setReviewAudit(audit)
      setReviewStatusDraft(currentReview?.status ?? status)
      setReviewNotes(currentReview?.review_notes ?? reviewNotes)
      setRequestedItemsText((currentReview?.requested_items || requestedItems).join('\n'))
    } catch (err) {
      console.error('[AnamnesisSection] Review save error:', err)
      setReviewError(err instanceof Error ? err.message : 'Fehler beim Speichern des Reviews')
    } finally {
      setReviewSaving(false)
    }
  }

  const handleExportIntake = (format: 'pdf' | 'json') => {
    if (!latestIntake?.id) return

    const url = `/api/clinician/patient/${patientId}/clinical-intake/${latestIntake.id}/export/${format}`

    if (typeof window !== 'undefined') {
      window.open(url, '_blank', 'noopener,noreferrer')
    }
  }

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
                  Intake (letzter Kontakt)
                </h3>
                {intakeUpdatedAt && (
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Aktualisiert: {formatDate(intakeUpdatedAt)}
                  </p>
                )}
                <div className="mt-1 flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                  {intakeStatus && <span>Status: {intakeStatus}</span>}
                  {typeof latestIntake.version_number === 'number' && (
                    <span>Version: v{latestIntake.version_number}</span>
                  )}
                  {escalationBadge && (
                    <Badge variant={escalationBadge.variant} size="sm">
                      Eskalation: {escalationBadge.label}
                    </Badge>
                  )}
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => fetchIntakeHistory()}
                  disabled={isIntakeHistoryLoading}
                >
                  {isIntakeHistoryLoading ? 'Laedt…' : 'History'}
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleExportIntake('pdf')}
                >
                  Export PDF
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => handleExportIntake('json')}
                >
                  Export JSON
                </Button>
              </div>
            </div>
            <p className="text-xs text-amber-600 dark:text-amber-400">
              Automatisch generierte klinische Zusammenfassung – aerztlich zu pruefen.
            </p>
            {intakeClinicalSummary ? (
              <p className="text-sm text-slate-600 dark:text-slate-300">
                {intakeClinicalSummary}
              </p>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Intake generiert, aber keine klinische Zusammenfassung vorhanden.
              </p>
            )}
            {intakeChiefComplaint && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Hauptbeschwerde: {intakeChiefComplaint}
              </p>
            )}
            {safetyUiState.showClinicianReview && (
              <p className="text-xs text-amber-700">
                Draft – Review erforderlich (Level B).
              </p>
            )}
            {redFlags.length > 0 && (
              <div className="rounded-lg border border-rose-200 bg-rose-50 p-3">
                <p className="text-xs font-semibold text-rose-700 mb-2">Safety Red Flags</p>
                <div className="space-y-2">
                  {redFlags.map((flag, index) => (
                    <div key={`red-flag-${index}`} className="text-xs text-rose-700">
                      <div className="font-semibold">
                        {((flag.rule_id as string) || (flag.id as string) || 'Red Flag')}
                      </div>
                      {Array.isArray((flag as { evidence_message_ids?: unknown }).evidence_message_ids) && (
                        <div className="text-rose-600">
                          Evidence: {(flag as { evidence_message_ids?: string[] }).evidence_message_ids?.join(', ') || 'n/a'}
                        </div>
                      )}
                      {typeof flag.rationale === 'string' && flag.rationale.trim() && (
                        <div>{flag.rationale}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {triggeredRuleUi.length > 0 && (
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-semibold text-slate-600 mb-2">Triggered Rules</p>
                <div className="space-y-3">
                  {triggeredRuleUi.map((rule) => (
                    <div key={rule.ruleId} className="rounded-md border border-slate-100 p-2">
                      <div className="text-xs font-semibold text-slate-700">
                        {rule.title} · Level {rule.level}
                      </div>
                      {rule.shortReason && (
                        <div className="text-xs text-slate-600 mt-1">{rule.shortReason}</div>
                      )}
                      <div className="mt-1 space-y-1">
                        {rule.excerpts.map((excerpt) => (
                          <div key={`${rule.ruleId}-${excerpt.refId}`} className="text-xs text-slate-600">
                            <span className="font-semibold">{excerpt.source}:</span> {excerpt.text}
                          </div>
                        ))}
                      </div>
                      <details className="mt-2">
                        <summary className="cursor-pointer text-xs text-slate-500">
                          Show details
                        </summary>
                        <div className="mt-1 text-xs text-slate-500">
                          Evidence refs: {rule.allEvidenceRefs.join(', ') || 'n/a'}
                        </div>
                      </details>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {(policyResult || effectiveLevel || effectiveAction) && (
              <div className="rounded-lg border border-slate-200 p-3">
                <p className="text-xs font-semibold text-slate-600 mb-2">Effective Policy Result</p>
                <p className="text-xs text-slate-600">
                  Level: {effectiveLevel ?? 'None'} · Action: {effectiveAction}
                </p>
                {policyResult && (
                  <p className="text-xs text-slate-500 mt-1">
                    Policy: {policyResult.escalation_level ?? 'None'} · {policyResult.chat_action}
                  </p>
                )}
              </div>
            )}
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold text-slate-600 mb-2">Review</p>
              {reviewLoading ? (
                <p className="text-xs text-slate-500">Review wird geladen…</p>
              ) : (
                <>
                  {reviewState ? (
                    <div className="mb-2 flex items-center gap-2">
                      <Badge variant={getReviewStatusBadge(reviewState.status).variant} size="sm">
                        {getReviewStatusBadge(reviewState.status).label}
                      </Badge>
                      <span className="text-xs text-slate-500">
                        Letztes Update: {formatDate(reviewState.updated_at)}
                      </span>
                    </div>
                  ) : (
                    <p className="mb-2 text-xs text-slate-500">Noch kein Review gesetzt.</p>
                  )}

                  <FormField label="Review notes">
                    <Textarea
                      value={reviewNotes}
                      onChange={(event) => setReviewNotes(event.target.value)}
                      rows={3}
                      placeholder="Review notes..."
                    />
                  </FormField>

                  <FormField label="Requested items (bei Request more info)">
                    <Textarea
                      value={requestedItemsText}
                      onChange={(event) => setRequestedItemsText(event.target.value)}
                      rows={3}
                      placeholder="Ein fehlendes Item pro Zeile"
                    />
                  </FormField>

                  <div className="mt-2 flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={reviewSaving}
                      onClick={() => void saveReviewState('in_review')}
                    >
                      In Review
                    </Button>
                    <Button
                      variant="primary"
                      size="sm"
                      disabled={reviewSaving}
                      onClick={() => void saveReviewState('approved')}
                    >
                      Approve
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      disabled={reviewSaving}
                      onClick={() => void saveReviewState('needs_more_info')}
                    >
                      Request more info
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      disabled={reviewSaving}
                      onClick={() => void saveReviewState('rejected')}
                    >
                      Reject
                    </Button>
                  </div>

                  {reviewError && <Alert variant="error">{reviewError}</Alert>}

                  {reviewAudit.length > 0 && (
                    <details className="mt-3">
                      <summary className="cursor-pointer text-xs text-slate-500">
                        Audit ({reviewAudit.length})
                      </summary>
                      <div className="mt-2 space-y-1">
                        {reviewAudit.map((entry) => (
                          <div key={entry.id} className="text-xs text-slate-600">
                            {formatDate(entry.created_at)} · {entry.status} · {entry.reviewed_by.slice(0, 8)}…
                          </div>
                        ))}
                      </div>
                    </details>
                  )}
                </>
              )}
            </div>
            <div className="rounded-lg border border-slate-200 p-3">
              <p className="text-xs font-semibold text-slate-600 mb-2">Override</p>
              {overrideInfo && (
                <p className="text-xs text-slate-500 mb-2">
                  Override von {overrideInfo.by_user_id} am {formatDate(overrideInfo.at)} — {overrideInfo.reason}
                </p>
              )}
              {overrideInfo && !isOverrideEditing && (
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsOverrideEditing(true)}
                >
                  Override aendern
                </Button>
              )}
              {(!overrideInfo || isOverrideEditing) && (
                <>
                  <div className="grid gap-3 md:grid-cols-2">
                    <FormField label="Level">
                      <select
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                        value={overrideLevel}
                        onChange={(event) => setOverrideLevel(event.target.value as EscalationLevel | 'none')}
                      >
                        <option value="none">Kein Override</option>
                        <option value="A">Level A</option>
                        <option value="B">Level B</option>
                        <option value="C">Level C</option>
                      </select>
                    </FormField>
                    <FormField label="Chat Action">
                      <select
                        className="w-full rounded-md border border-slate-200 bg-white px-2 py-1 text-xs"
                        value={overrideAction}
                        onChange={(event) => setOverrideAction(event.target.value as ChatAction | 'none')}
                      >
                        <option value="none">Kein Override</option>
                        <option value="warn">Warn</option>
                        <option value="require_confirm">Require Confirm</option>
                        <option value="hard_stop">Hard Stop</option>
                      </select>
                    </FormField>
                  </div>
                  <FormField label="Begruendung" required={overrideLevel !== 'none' || overrideAction !== 'none'}>
                    <Textarea
                      value={overrideReason}
                      onChange={(event) => setOverrideReason(event.target.value)}
                      rows={3}
                      placeholder="Grund fuer die Uebersteuerung..."
                    />
                  </FormField>
                  {overrideError && <Alert variant="error">{overrideError}</Alert>}
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleOverrideSave}
                    disabled={overrideSaving}
                  >
                    {overrideSaving ? 'Speichern…' : 'Override speichern'}
                  </Button>
                </>
              )}
            </div>
            {showDebug && structuredIntakeDisplay && (
              <details className="rounded-lg border border-slate-200 dark:border-slate-700 p-3">
                <summary className="cursor-pointer text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Structured Intake-Daten (Debug)
                </summary>
                <pre className="mt-2 text-xs text-slate-600 dark:text-slate-300 whitespace-pre-wrap">
{JSON.stringify(structuredIntakeDisplay, null, 2)}
                </pre>
              </details>
            )}
            {intakeError && <Alert variant="error">{intakeError}</Alert>}
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
                    {formatDate(version.updated_at)}
                  </p>
                </div>
                {getIntakeNarrative(buildIntakeContent(version)) ? (
                  <p className="text-sm text-slate-600 dark:text-slate-300">
                    {getIntakeNarrative(buildIntakeContent(version))}
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
