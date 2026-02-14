'use client'

import { useMemo } from 'react'
import { usePatientData, type ReviewStatus } from '@/lib/hooks/usePatientData'

const toGermanDate = (value?: string | null) => {
  if (!value) return '—'
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return '—'
  return new Intl.DateTimeFormat('de-DE', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(parsed)
}

const toFriendlySafetyLevel = (level: string | null | undefined) => {
  const normalized = (level ?? '').toUpperCase()
  if (normalized === 'A') return 'Sofortige ärztliche Abklärung empfohlen.'
  if (normalized === 'B') return 'Bitte zeitnah medizinisch abklären lassen.'
  if (normalized === 'C') return 'Aktuell kein akuter Hinweis, Verlauf beobachten.'
  return 'Noch keine Sicherheits-Einstufung verfügbar.'
}

const toReviewLabel = (status: ReviewStatus | null) => {
  if (status === 'in_review') return 'In Prüfung'
  if (status === 'needs_more_info') return 'Rückfragen offen'
  if (status === 'approved') return 'Freigegeben'
  if (status === 'rejected') return 'Abgelehnt'
  if (status === 'draft') return 'Entwurf'
  return 'Keine Review-Information'
}

export function DashboardCards() {
  const { loading, error, intake, review, openFollowupCount } = usePatientData()

  const reviewStatus = review?.status ?? null

  const nextStep = useMemo(() => {
    if (reviewStatus === 'needs_more_info') {
      return 'Bitte beantworten Sie die offenen Fragen.'
    }
    if (openFollowupCount > 0) {
      return 'Bitte beantworten Sie 1–3 Fragen.'
    }
    return 'Wir prüfen Ihre Angaben / kein weiterer Schritt erforderlich.'
  }, [openFollowupCount, reviewStatus])

  const requestedItems = Array.isArray(review?.requested_items) ? review.requested_items : []
  const safetyLevel =
    intake?.structured_data?.safety?.effective_policy_result?.escalation_level ??
    intake?.structured_data?.safety?.effective_policy_result?.level ??
    null

  if (loading) {
    return (
      <div className="dashboard-card text-sm text-slate-600">Daten werden geladen…</div>
    )
  }

  if (error) {
    return <div className="dashboard-card text-sm text-red-700">{error}</div>
  }

  return (
    <>
      <section className="dashboard-card">
        <h2 className="text-lg font-semibold text-slate-900">Status</h2>
        <dl className="mt-3 space-y-3 text-sm text-slate-700">
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:gap-3">
            <dt className="font-medium">Intake</dt>
            <dd className="m-0 wrap-break-word">
              Version {intake?.version_number ?? '—'} · zuletzt {toGermanDate(intake?.updated_at)}
            </dd>
          </div>
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:gap-3">
            <dt className="font-medium">Safety</dt>
            <dd className="m-0 wrap-break-word">{toFriendlySafetyLevel(safetyLevel)}</dd>
          </div>
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:gap-3">
            <dt className="font-medium">Review</dt>
            <dd className="m-0 wrap-break-word">{toReviewLabel(reviewStatus)}</dd>
          </div>
          <div className="grid gap-1 sm:grid-cols-[140px_1fr] sm:gap-3">
            <dt className="font-medium">Follow-up</dt>
            <dd className="m-0 wrap-break-word">{openFollowupCount} offene Frage(n)</dd>
          </div>
        </dl>
      </section>

      <section className="dashboard-card">
        <h2 className="text-lg font-semibold text-slate-900">Nächster Schritt</h2>
        <p className="mt-2 w-full text-sm text-slate-700 wrap-break-word">{nextStep}</p>
      </section>

      <section className="dashboard-card">
        <h2 className="text-lg font-semibold text-slate-900">Anforderungen / Uploads</h2>

        {requestedItems.length > 0 ? (
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700 wrap-break-word">
            {requestedItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-slate-600 wrap-break-word">
            Aktuell keine angeforderten Dokumente/Befunde.
          </p>
        )}

        <button
          type="button"
          disabled
          title="coming next"
          className="mt-3 cursor-not-allowed rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-500"
        >
          Upload (coming next)
        </button>
      </section>
    </>
  )
}
