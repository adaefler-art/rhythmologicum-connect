'use client'

import { useEffect, useMemo, useState } from 'react'

type ReviewStatus = 'draft' | 'in_review' | 'approved' | 'needs_more_info' | 'rejected'

type IntakeLatestResponse = {
  success: boolean
  intake: {
    version_number: number
    updated_at: string
    structured_data?: {
      safety?: {
        effective_policy_result?: {
          escalation_level?: string | null
          level?: string | null
        }
      }
      followup?: {
        next_questions?: unknown[]
      }
    }
    review_state?: {
      status: ReviewStatus
      requested_items: string[] | null
    } | null
  } | null
}

type ReviewStatusResponse = {
  success: boolean
  review: {
    status: ReviewStatus
    requested_items: string[]
    updated_at: string
  } | null
}

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

export default function PatientDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [intake, setIntake] = useState<IntakeLatestResponse['intake']>(null)
  const [review, setReview] = useState<ReviewStatusResponse['review']>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setLoading(true)
        setError(null)

        const [intakeResponse, reviewResponse] = await Promise.all([
          fetch('/api/patient/intake/latest', { cache: 'no-store' }),
          fetch('/api/patient/review/status', { cache: 'no-store' }),
        ])

        const intakeJson = (await intakeResponse.json()) as IntakeLatestResponse
        const reviewJson = (await reviewResponse.json()) as ReviewStatusResponse

        if (!active) return

        if (!intakeResponse.ok || !intakeJson.success) {
          throw new Error('Intake konnte nicht geladen werden.')
        }

        const safeReview =
          reviewResponse.ok && reviewJson.success
            ? reviewJson.review
            : intakeJson.intake?.review_state
              ? {
                  status: intakeJson.intake.review_state.status,
                  requested_items: Array.isArray(intakeJson.intake.review_state.requested_items)
                    ? intakeJson.intake.review_state.requested_items
                    : [],
                  updated_at: intakeJson.intake.updated_at,
                }
              : null

        setIntake(intakeJson.intake)
        setReview(safeReview)
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Dashboard konnte nicht geladen werden.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()
    return () => {
      active = false
    }
  }, [])

  const openFollowupCount = useMemo(() => {
    const raw = intake?.structured_data?.followup?.next_questions
    return Array.isArray(raw) ? raw.length : 0
  }, [intake])

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

  return (
    <main className="min-h-screen bg-linear-to-b from-sky-50 via-slate-50 to-slate-100 px-4 py-6">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">Dashboard</h1>

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            Daten werden geladen…
          </div>
        )}

        {error && (
          <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>
        )}

        {!loading && !error && (
          <>
            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-slate-900">Status</h2>
              <dl className="mt-3 grid gap-2 text-sm text-slate-700">
                <div className="flex items-center justify-between gap-3">
                  <dt className="font-medium">Intake</dt>
                  <dd>
                    Version {intake?.version_number ?? '—'} · zuletzt {toGermanDate(intake?.updated_at)}
                  </dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="font-medium">Safety</dt>
                  <dd className="text-right">{toFriendlySafetyLevel(safetyLevel)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="font-medium">Review</dt>
                  <dd>{toReviewLabel(reviewStatus)}</dd>
                </div>
                <div className="flex items-center justify-between gap-3">
                  <dt className="font-medium">Follow-up</dt>
                  <dd>{openFollowupCount} offene Frage(n)</dd>
                </div>
              </dl>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-slate-900">Nächster Schritt</h2>
              <p className="mt-2 text-sm text-slate-700">{nextStep}</p>
            </section>

            <section className="rounded-xl border border-slate-200 bg-white p-4">
              <h2 className="text-lg font-semibold text-slate-900">Anforderungen / Uploads</h2>

              {requestedItems.length > 0 ? (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-slate-700">
                  {requestedItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              ) : (
                <p className="mt-2 text-sm text-slate-600">Aktuell keine angeforderten Dokumente/Befunde.</p>
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
        )}
      </div>
    </main>
  )
}
