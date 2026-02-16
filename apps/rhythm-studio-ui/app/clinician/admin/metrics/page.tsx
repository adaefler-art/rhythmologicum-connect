'use client'

import { useEffect, useMemo, useState } from 'react'
import { Info } from 'lucide-react'
import { Card, ErrorState, LoadingSpinner, PageHeader, SectionHeader } from '@/lib/ui'
import { useActiveNavLabel } from '@/lib/contexts/NavigationContext'

type MetricsResponse = {
  totals: {
    intakes_total: number
    reviews_total: number
    approved_rate: number
    hard_stop_rate: number
    override_rate: number
    followup_yield: number
    upload_completion_rate: number
  }
  timeseries: {
    by_day: Array<{
      date: string
      intakes: number
      reviews: number
      hard_stops: number
      overrides: number
      followup_shown: number
      followup_answered: number
    }>
  }
  thresholds: Array<{
    kpi_key: string
    warning_threshold: number | null
    critical_threshold: number | null
    target_threshold: number | null
  }>
}

type CardModel = {
  id: string
  label: string
  value: string
  definition: string
  reference: string
}

const asPercent = (value: number) => `${(value * 100).toFixed(1)}%`

const toThresholdDisplay = (value: number | null | undefined, asRate: boolean) => {
  if (value === null || value === undefined) return null

  if (asRate) {
    const percent = value <= 1 ? value * 100 : value
    return `${percent.toFixed(1)}%`
  }

  return Number.isInteger(value) ? String(value) : value.toFixed(2)
}

const InfoHint = ({ text }: { text: string }) => (
  <span className="relative inline-flex items-center">
    <span
      className="group inline-flex cursor-help items-center rounded-full p-0.5 text-slate-300 hover:text-white"
      aria-label={text}
    >
      <Info size={14} />
      <span className="pointer-events-none absolute left-1/2 top-full z-20 mt-2 hidden w-72 -translate-x-1/2 rounded-md border border-slate-700 bg-slate-900 p-2 text-xs normal-case text-slate-100 shadow-lg group-hover:block">
        {text}
      </span>
    </span>
  </span>
)

export default function AdminMetricsPage() {
  useActiveNavLabel('Metrics')

  const [days, setDays] = useState<7 | 30>(7)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<MetricsResponse | null>(null)

  useEffect(() => {
    let cancelled = false

    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const metricsResponse = await fetch(`/api/admin/metrics?days=${days}`)

        const metricsJson = await metricsResponse.json().catch(() => null)

        if (!metricsResponse.ok || !metricsJson?.success) {
          throw new Error(metricsJson?.error?.message || 'Failed to load metrics')
        }

        if (!cancelled) {
          setData(metricsJson.data as MetricsResponse)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load metrics')
          setData(null)
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    run()

    return () => {
      cancelled = true
    }
  }, [days])

  const cards = useMemo(() => {
    if (!data) return []

    const thresholdByKey = new Map(data.thresholds.map((entry) => [entry.kpi_key, entry]))

    const referenceFromThreshold = (keys: string[], asRate: boolean, fallback: string) => {
      const threshold = keys.map((key) => thresholdByKey.get(key)).find(Boolean)
      if (!threshold) return fallback

      const parts = [
        threshold.target_threshold !== null && threshold.target_threshold !== undefined
          ? `Ziel ${toThresholdDisplay(threshold.target_threshold, asRate)}`
          : null,
        threshold.warning_threshold !== null && threshold.warning_threshold !== undefined
          ? `Warnung ${toThresholdDisplay(threshold.warning_threshold, asRate)}`
          : null,
        threshold.critical_threshold !== null && threshold.critical_threshold !== undefined
          ? `Kritisch ${toThresholdDisplay(threshold.critical_threshold, asRate)}`
          : null,
      ].filter(Boolean)

      if (parts.length === 0) return fallback
      return parts.join(' · ')
    }

    const models: CardModel[] = [
      {
        id: 'intakes',
        label: 'Intakes',
        value: String(data.totals.intakes_total),
        definition: 'Anzahl neu erzeugter Clinical-Intakes im gewählten Zeitfenster.',
        reference: referenceFromThreshold(['cre_intakes_total', 'intakes_total'], false, 'Referenz: TBD'),
      },
      {
        id: 'reviews',
        label: 'Reviews',
        value: String(data.totals.reviews_total),
        definition: 'Anzahl angelegter Clinical-Intake-Reviews im gewählten Zeitfenster.',
        reference: referenceFromThreshold(['cre_reviews_total', 'reviews_total'], false, 'Referenz: TBD'),
      },
      {
        id: 'approved_rate',
        label: 'Approved Rate',
        value: asPercent(data.totals.approved_rate),
        definition: 'Anteil abgeschlossener Reviews mit Status "approved".',
        reference: referenceFromThreshold(
          ['cre_review_approval_rate', 'approved_rate'],
          true,
          'Referenz: Ziel > 50% (initial)',
        ),
      },
      {
        id: 'hard_stop_rate',
        label: 'Hard Stop Rate',
        value: asPercent(data.totals.hard_stop_rate),
        definition: 'Anteil Intakes mit ausgelöstem Hard-Stop-Safety-Ereignis.',
        reference: referenceFromThreshold(
          ['cre_hard_stop_rate', 'hard_stop_rate'],
          true,
          'Referenz: Warnung >= 30% (initial)',
        ),
      },
      {
        id: 'override_rate',
        label: 'Override Rate',
        value: asPercent(data.totals.override_rate),
        definition: 'Anteil Intakes mit gesetztem Policy-Override durch Clinician/Admin.',
        reference: referenceFromThreshold(['cre_override_rate', 'override_rate'], true, 'Referenz: TBD'),
      },
      {
        id: 'followup_yield',
        label: 'Follow-up Yield',
        value: asPercent(data.totals.followup_yield),
        definition: 'Anteil beantworteter Follow-up-Fragen relativ zu gezeigten Follow-ups.',
        reference: referenceFromThreshold(
          ['cre_followup_yield', 'followup_yield'],
          true,
          'Referenz: Ziel >= 60% (initial)',
        ),
      },
      {
        id: 'upload_completion',
        label: 'Upload Completion',
        value: asPercent(data.totals.upload_completion_rate),
        definition: 'Anteil abgeschlossener Uploads relativ zu angefragten Uploads.',
        reference: referenceFromThreshold(
          ['cre_upload_completion_rate', 'upload_completion_rate'],
          true,
          'Referenz: Ziel >= 50% (initial)',
        ),
      },
    ]

    return models
  }, [data])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Studio Metrics"
        description="KPI-Überblick mit Definitionen und Referenzwerten (falls unbekannt: TBD)."
      />

      <div className="flex gap-2">
        <button
          type="button"
          className={`rounded-md border px-3 py-1 text-sm ${days === 7 ? 'border-slate-500 bg-slate-900 text-white' : 'border-slate-600 bg-slate-800 text-slate-200'}`}
          onClick={() => setDays(7)}
        >
          Last 7 days
        </button>
        <button
          type="button"
          className={`rounded-md border px-3 py-1 text-sm ${days === 30 ? 'border-slate-500 bg-slate-900 text-white' : 'border-slate-600 bg-slate-800 text-slate-200'}`}
          onClick={() => setDays(30)}
        >
          Last 30 days
        </button>
      </div>

      {loading ? <LoadingSpinner text="Lade Metrics…" centered /> : null}
      {error ? <ErrorState title="Metrics konnten nicht geladen werden" message={error} /> : null}

      {!loading && !error && data ? (
        <>
          <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <Card key={card.id} padding="md" shadow="sm">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium text-slate-100">{card.label}</p>
                  <InfoHint text={card.definition} />
                </div>
                <p className="mt-2 text-3xl font-bold text-white">{card.value}</p>
                <p className="mt-2 text-xs text-slate-200">{card.reference}</p>
              </Card>
            ))}
          </section>

          <Card padding="md" shadow="sm">
            <SectionHeader title="Daily Trend" description={`Window: ${days} days`} />
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm text-slate-100">
                <thead>
                  <tr className="border-b border-slate-700 text-xs uppercase tracking-wide text-slate-300">
                    <th className="px-2 py-2">Date</th>
                    <th className="px-2 py-2">Intakes</th>
                    <th className="px-2 py-2">Reviews</th>
                    <th className="px-2 py-2">Hard Stops</th>
                    <th className="px-2 py-2">Overrides</th>
                    <th className="px-2 py-2">Follow-up shown</th>
                    <th className="px-2 py-2">Follow-up answered</th>
                  </tr>
                </thead>
                <tbody>
                  {data.timeseries.by_day.map((row) => (
                    <tr key={row.date} className="border-b border-slate-800 odd:bg-slate-900/20 even:bg-slate-900/5 last:border-b-0">
                      <td className="px-2 py-2 font-medium text-slate-100">{row.date}</td>
                      <td className="px-2 py-2 text-slate-200">{row.intakes}</td>
                      <td className="px-2 py-2 text-slate-200">{row.reviews}</td>
                      <td className="px-2 py-2 text-slate-200">{row.hard_stops}</td>
                      <td className="px-2 py-2 text-slate-200">{row.overrides}</td>
                      <td className="px-2 py-2 text-slate-200">{row.followup_shown}</td>
                      <td className="px-2 py-2 text-slate-200">{row.followup_answered}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : null}
    </div>
  )
}
