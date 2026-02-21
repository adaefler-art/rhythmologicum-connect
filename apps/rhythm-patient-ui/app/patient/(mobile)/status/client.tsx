'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Badge, Button, ErrorState, LoadingSkeleton } from '@/lib/ui/mobile-v2'
import { ArrowLeft, MessageCircle } from '@/lib/ui/mobile-v2/icons'

type ReviewStatus = 'draft' | 'in_review' | 'approved' | 'needs_more_info' | 'rejected'
type ReadinessState = 'SafetyReady' | 'VisitReady' | 'ProblemReady' | 'ProgramReady'
type LifecycleState = 'active' | 'needs_review' | 'completed'
type ObjectiveStatus = 'missing' | 'unclear' | 'resolved' | 'answered' | 'verified' | 'blocked_by_safety'

type ProgramReadiness = {
  readiness_state: ReadinessState
  lifecycle_state: LifecycleState
  active_block_id: string | null
}

type FollowupObjective = {
  id: string
  label: string
  status: ObjectiveStatus
}

type CorrectionType =
  | 'medication_missing'
  | 'medication_incorrect'
  | 'history_missing'
  | 'symptom_timeline'
  | 'free_text'

type CorrectionSourceContext = 'status_page' | 'chat' | 'followup'

type CorrectionJournalEntry = {
  id: string
  created_at: string
  type: CorrectionType
  source_context: CorrectionSourceContext
  message_excerpt?: string
  answer_classification?: string
  asked_question_id?: string
}

type IntakeRecord = {
  id: string
  version_number: number
  updated_at: string
  review_state?: {
    status: ReviewStatus
    requested_items: string[] | null
  } | null
  program_readiness?: ProgramReadiness | null
  structured_data?: {
    chief_complaint?: string
    medication?: string[]
    past_medical_history?: string[]
    psychosocial_factors?: string[]
    followup?: {
      objectives?: FollowupObjective[]
      next_questions?: unknown[]
      correction_journal?: CorrectionJournalEntry[]
    }
  }
}

type IntakeLatestResponse = {
  success: boolean
  intake: IntakeRecord | null
}

const toGermanDate = (value?: string) => {
  if (!value) return '—'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '—'
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(date)
}

const toReviewLabel = (status?: ReviewStatus | null) => {
  if (status === 'in_review') return 'In Prüfung'
  if (status === 'needs_more_info') return 'Rückfragen offen'
  if (status === 'approved') return 'Freigegeben'
  if (status === 'rejected') return 'Abgelehnt'
  return 'Entwurf'
}

const toReadinessLabel = (state?: ReadinessState) => {
  if (state === 'ProgramReady') return 'ProgramReady'
  if (state === 'ProblemReady') return 'ProblemReady'
  if (state === 'VisitReady') return 'VisitReady'
  return 'SafetyReady'
}

const toLifecycleLabel = (state?: LifecycleState) => {
  if (state === 'completed') return 'Abgeschlossen'
  if (state === 'needs_review') return 'Review erforderlich'
  return 'Aktiv'
}

const toStatusVariant = (state?: ReadinessState | LifecycleState | ReviewStatus | null) => {
  if (state === 'ProgramReady' || state === 'completed' || state === 'approved') return 'success'
  if (state === 'needs_review' || state === 'needs_more_info') return 'warning'
  if (state === 'rejected') return 'danger'
  if (state === 'ProblemReady') return 'primary'
  return 'neutral'
}

const toBlockLabel = (blockId?: string | null) => {
  if (!blockId) return 'Kein aktiver Block'
  return blockId
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

const isOpenObjectiveStatus = (status: ObjectiveStatus) =>
  status === 'missing' || status === 'unclear' || status === 'blocked_by_safety'

const toCorrectionTypeLabel = (type?: CorrectionType) => {
  if (type === 'medication_missing') return 'Medikation ergänzt'
  if (type === 'medication_incorrect') return 'Medikation korrigiert'
  if (type === 'history_missing') return 'Vorerkrankung ergänzt'
  if (type === 'symptom_timeline') return 'Beschwerdeverlauf korrigiert'
  return 'Freitext-Korrektur'
}

const toCorrectionSourceLabel = (value?: CorrectionSourceContext) => {
  if (value === 'status_page') return 'aus Statusseite'
  if (value === 'followup') return 'aus Follow-up'
  return 'aus Chat'
}

export default function PatientStatusClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [intake, setIntake] = useState<IntakeRecord | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch('/api/patient/intake/latest', { cache: 'no-store' })
        const payload = (await response.json()) as IntakeLatestResponse

        if (!response.ok || !payload.success) {
          throw new Error('Status konnte nicht geladen werden.')
        }

        if (!active) return
        setIntake(payload.intake)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Status konnte nicht geladen werden.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  const objectives = useMemo(() => {
    const raw = intake?.structured_data?.followup?.objectives
    return Array.isArray(raw) ? raw : []
  }, [intake])

  const openObjectiveTodos = useMemo(
    () => objectives.filter((entry) => isOpenObjectiveStatus(entry.status)),
    [objectives],
  )

  const reviewTodos = useMemo(() => {
    const raw = intake?.review_state?.requested_items
    return Array.isArray(raw) ? raw : []
  }, [intake])

  const nextQuestionCount = useMemo(() => {
    const raw = intake?.structured_data?.followup?.next_questions
    return Array.isArray(raw) ? raw.length : 0
  }, [intake])

  const capturedSummary = useMemo(() => {
    const structured = intake?.structured_data
    const medicationCount = Array.isArray(structured?.medication) ? structured.medication.length : 0
    const historyCount = Array.isArray(structured?.past_medical_history)
      ? structured.past_medical_history.length
      : 0
    const psychosocialCount = Array.isArray(structured?.psychosocial_factors)
      ? structured.psychosocial_factors.length
      : 0

    return {
      chiefComplaint: structured?.chief_complaint?.trim() || null,
      medicationCount,
      historyCount,
      psychosocialCount,
    }
  }, [intake])

  const totalOpenTodos = openObjectiveTodos.length + reviewTodos.length + nextQuestionCount

  const latestCorrection = useMemo(() => {
    const raw = intake?.structured_data?.followup?.correction_journal
    if (!Array.isArray(raw) || raw.length === 0) return null

    const sorted = [...raw].sort((left, right) => {
      const leftTime = Date.parse(left.created_at ?? '')
      const rightTime = Date.parse(right.created_at ?? '')
      if (Number.isNaN(leftTime) || Number.isNaN(rightTime)) return 0
      return rightTime - leftTime
    })

    return sorted[0] ?? null
  }, [intake])

  if (loading) {
    return (
      <div className="flex w-full flex-col gap-6 px-4 py-10">
        <LoadingSkeleton variant="text" count={2} />
        <LoadingSkeleton variant="card" count={3} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex w-full flex-col gap-6 px-4 py-10">
        <button
          onClick={() => router.push('/patient/start')}
          className="self-start inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück zum Dashboard
        </button>
        <ErrorState title="Fehler beim Laden" message={error} onRetry={() => window.location.reload()} />
      </div>
    )
  }

  if (!intake) {
    return (
      <div className="flex w-full flex-col gap-6 px-4 py-10">
        <div className="flex items-center justify-between gap-3">
          <button
            onClick={() => router.push('/patient/start')}
            className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Zurück
          </button>
          <Button variant="secondary" size="sm" onClick={() => router.push('/patient/dialog?context=status')}>
            Im Chat öffnen
          </Button>
        </div>

        <Card padding="md" shadow="sm" className="space-y-3">
          <h1 className="text-xl font-semibold text-slate-900">Noch kein Status verfügbar</h1>
          <p className="text-sm text-slate-700">
            Sobald Ihre Erfassung vorliegt, sehen Sie hier Prozessstand, offene Punkte und Korrekturen.
          </p>
          <div className="pt-1">
            <Button variant="primary" size="md" onClick={() => router.push('/patient/dialog?context=status')}>
              Erfassung im Chat starten
            </Button>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex w-full flex-col gap-6 px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <button
          onClick={() => router.push('/patient/start')}
          className="inline-flex items-center gap-2 text-sm font-medium text-sky-700 hover:text-sky-900"
        >
          <ArrowLeft className="h-4 w-4" />
          Zurück
        </button>
        <Button variant="secondary" size="sm" onClick={() => router.push('/patient/dialog?context=status')}> 
          Im Chat öffnen
        </Button>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Prozessstatus</h1>
        <p className="mt-1 text-sm text-slate-600">Version {intake?.version_number ?? '—'} · zuletzt {toGermanDate(intake?.updated_at)}</p>
      </div>

      <Card padding="md" shadow="sm" className="space-y-4">
        <h2 className="text-base font-semibold text-slate-900">Ablauf</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs text-slate-500">Review</p>
            <Badge variant={toStatusVariant(intake?.review_state?.status)}>{toReviewLabel(intake?.review_state?.status ?? null)}</Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-500">Readiness</p>
            <Badge variant={toStatusVariant(intake?.program_readiness?.readiness_state)}>
              {toReadinessLabel(intake?.program_readiness?.readiness_state)}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-500">Follow-up Lifecycle</p>
            <Badge variant={toStatusVariant(intake?.program_readiness?.lifecycle_state)}>
              {toLifecycleLabel(intake?.program_readiness?.lifecycle_state)}
            </Badge>
          </div>
          <div className="space-y-1">
            <p className="text-xs text-slate-500">Aktiver Block</p>
            <p className="text-sm font-medium text-slate-800">{toBlockLabel(intake?.program_readiness?.active_block_id)}</p>
          </div>
        </div>
      </Card>

      <Card padding="md" shadow="sm" className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Erfasste Daten</h2>
        <div className="space-y-2 text-sm text-slate-700">
          <p>
            <span className="font-medium text-slate-900">Hauptanliegen:</span>{' '}
            {capturedSummary.chiefComplaint ?? 'Noch nicht erfasst'}
          </p>
          <p>
            <span className="font-medium text-slate-900">Medikation:</span> {capturedSummary.medicationCount} Einträge
          </p>
          <p>
            <span className="font-medium text-slate-900">Vorerkrankungen:</span> {capturedSummary.historyCount} Einträge
          </p>
          <p>
            <span className="font-medium text-slate-900">Psychosoziale Faktoren:</span> {capturedSummary.psychosocialCount} Einträge
          </p>
        </div>
      </Card>

      <Card padding="md" shadow="sm" className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-base font-semibold text-slate-900">Offene ToDos</h2>
          <Badge variant={totalOpenTodos > 0 ? 'warning' : 'success'}>{totalOpenTodos}</Badge>
        </div>

        {totalOpenTodos === 0 ? (
          <p className="text-sm text-slate-600">Aktuell sind keine offenen Punkte vorhanden.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            {openObjectiveTodos.map((item) => (
              <li key={item.id}>{item.label}</li>
            ))}
            {reviewTodos.map((item) => (
              <li key={`review-${item}`}>Review-Rückfrage: {item}</li>
            ))}
            {nextQuestionCount > 0 ? <li>{nextQuestionCount} Follow-up Frage(n) warten auf Antwort</li> : null}
          </ul>
        )}
      </Card>

      <Card padding="md" shadow="sm" className="space-y-3">
        <h2 className="text-base font-semibold text-slate-900">Korrektur per Chat</h2>
        <p className="text-sm text-slate-700">
          Wenn etwas fehlt oder falsch ist, können Sie es direkt im Dialog ergänzen.
        </p>
        <div className="grid grid-cols-1 gap-2">
          <Button
            variant="secondary"
            size="md"
            icon={<MessageCircle className="h-4 w-4" />}
            onClick={() =>
              router.push(
                `/patient/dialog?context=correction&correction_type=medication_missing&correction_source_context=status_page&prefill=${encodeURIComponent(
                  'Ich habe ein Medikament vergessen: ',
                )}`,
              )
            }
          >
            Vergessenes Medikament melden
          </Button>
          <Button
            variant="ghost"
            size="md"
            onClick={() =>
              router.push(
                `/patient/dialog?context=correction&correction_type=free_text&correction_source_context=status_page&prefill=${encodeURIComponent(
                  'Bitte korrigiere folgende Angabe: ',
                )}`,
              )
            }
          >
            Freitext-Korrektur starten
          </Button>
        </div>

        {latestCorrection ? (
          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
            <p className="font-semibold text-slate-900">Zuletzt gemeldete Korrektur</p>
            <p className="mt-1">
              {toCorrectionTypeLabel(latestCorrection.type)} · {toCorrectionSourceLabel(latestCorrection.source_context)} ·{' '}
              {toGermanDate(latestCorrection.created_at)}
            </p>
            {latestCorrection.message_excerpt ? <p className="mt-1">„{latestCorrection.message_excerpt}“</p> : null}
          </div>
        ) : (
          <p className="text-xs text-slate-500">Noch keine Korrektur gemeldet.</p>
        )}
      </Card>
    </div>
  )
}