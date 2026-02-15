'use client'

import { useEffect, useMemo, useState } from 'react'
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
}

const asPercent = (value: number) => `${(value * 100).toFixed(1)}%`

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
        const response = await fetch(`/api/admin/metrics?days=${days}`)
        const json = await response.json().catch(() => null)

        if (!response.ok || !json?.success) {
          throw new Error(json?.error?.message || 'Failed to load metrics')
        }

        if (!cancelled) {
          setData(json.data as MetricsResponse)
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
    return [
      { label: 'Intakes', value: String(data.totals.intakes_total) },
      { label: 'Reviews', value: String(data.totals.reviews_total) },
      { label: 'Approved Rate', value: asPercent(data.totals.approved_rate) },
      { label: 'Hard Stop Rate', value: asPercent(data.totals.hard_stop_rate) },
      { label: 'Override Rate', value: asPercent(data.totals.override_rate) },
      { label: 'Follow-up Yield', value: asPercent(data.totals.followup_yield) },
      { label: 'Upload Completion', value: asPercent(data.totals.upload_completion_rate) },
    ]
  }, [data])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Studio Metrics"
        description="KPI-Überblick für den Livetest (Events + Verlauf)."
      />

      <div className="flex gap-2">
        <button
          type="button"
          className={`rounded-md border px-3 py-1 text-sm ${days === 7 ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'}`}
          onClick={() => setDays(7)}
        >
          Last 7 days
        </button>
        <button
          type="button"
          className={`rounded-md border px-3 py-1 text-sm ${days === 30 ? 'bg-slate-900 text-white' : 'bg-white text-slate-800'}`}
          onClick={() => setDays(30)}
        >
          Last 30 days
        </button>
      </div>

      {loading ? <LoadingSpinner text="Lade Metrics…" centered /> : null}
      {error ? <ErrorState title="Metrics konnten nicht geladen werden" message={error} /> : null}

      {!loading && !error && data ? (
        <>
          <section className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => (
              <Card key={card.label} padding="md" shadow="sm">
                <p className="text-xs text-slate-500">{card.label}</p>
                <p className="mt-1 text-2xl font-semibold text-slate-900">{card.value}</p>
              </Card>
            ))}
          </section>

          <Card padding="md" shadow="sm">
            <SectionHeader title="Daily Trend" description={`Window: ${days} days`} />
            <div className="mt-3 overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs uppercase tracking-wide text-slate-500">
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
                    <tr key={row.date} className="border-b last:border-b-0">
                      <td className="px-2 py-2 font-medium">{row.date}</td>
                      <td className="px-2 py-2">{row.intakes}</td>
                      <td className="px-2 py-2">{row.reviews}</td>
                      <td className="px-2 py-2">{row.hard_stops}</td>
                      <td className="px-2 py-2">{row.overrides}</td>
                      <td className="px-2 py-2">{row.followup_shown}</td>
                      <td className="px-2 py-2">{row.followup_answered}</td>
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
