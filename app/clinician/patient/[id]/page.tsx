'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'

type PatientMeasure = {
  id: string
  patient_id: string
  stress_score: number | null
  sleep_score: number | null
  risk_level: string
  created_at: string
  report_id: string | null
  reports: {
    id: string
    report_text_short: string
    created_at: string
  } | null
}

type PatientProfile = {
  id: string
  full_name: string | null
  birth_year: number | null
  sex: string | null
  user_id: string
}

export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [patient, setPatient] = useState<PatientProfile | null>(null)
  const [measures, setMeasures] = useState<PatientMeasure[]>([])
  const [showRawData, setShowRawData] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load patient profile and measures in parallel for better performance
        const [profileResult, measuresResult] = await Promise.all([
          supabase.from('patient_profiles').select('*').eq('id', patientId).single(),
          supabase
            .from('patient_measures')
            .select(
              `
            id,
            patient_id,
            stress_score,
            sleep_score,
            risk_level,
            created_at,
            report_id,
            reports!fk_patient_measures_report (
              id,
              report_text_short,
              created_at
            )
          `
            )
            .eq('patient_id', patientId)
            .order('created_at', { ascending: false }),
        ])

        if (profileResult.error) throw profileResult.error
        if (measuresResult.error) throw measuresResult.error

        setPatient(profileResult.data)
        // Type assertion for Supabase joined query (one-to-one relationship)
        setMeasures((measuresResult.data ?? []) as unknown as PatientMeasure[])
      } catch (e: unknown) {
        console.error('Error loading patient details:', e)
        const errorMessage =
          e instanceof Error ? e.message : 'Fehler beim Laden der Patientendaten.'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    if (patientId) {
      loadData()
    }
  }, [patientId])

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

  const getRiskLabel = (risk: string): string => {
    switch (risk) {
      case 'high':
        return 'Hoch'
      case 'moderate':
        return 'Mittel'
      case 'low':
        return 'Niedrig'
      case 'pending':
        return 'Ausstehend'
      default:
        return 'Unbekannt'
    }
  }

  const getRiskColor = (risk: string): string => {
    switch (risk) {
      case 'high':
        return 'text-red-600'
      case 'moderate':
        return 'text-amber-600'
      case 'low':
        return 'text-emerald-600'
      default:
        return 'text-slate-600'
    }
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Patientendaten werden geladen…</p>
      </main>
    )
  }

  if (error || !patient) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center">
          <p className="text-red-500 mb-4">{error ?? 'Patient nicht gefunden.'}</p>
          <button
            onClick={() => router.push('/clinician')}
            className="px-4 py-2 rounded bg-sky-600 text-white text-sm hover:bg-sky-700 transition"
          >
            Zurück zur Übersicht
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => router.push('/clinician')}
          className="mb-4 text-sm text-sky-600 hover:text-sky-700 hover:underline transition"
        >
          ← Zurück zur Übersicht
        </button>
        <h1 className="text-3xl font-bold mb-2">
          {patient.full_name ?? 'Patient:in'}
        </h1>
        <div className="text-sm text-slate-600 space-x-4">
          {patient.birth_year && <span>Jahrgang: {patient.birth_year}</span>}
          {patient.sex && <span>Geschlecht: {patient.sex}</span>}
          <span>{measures.length} Messung{measures.length !== 1 ? 'en' : ''}</span>
        </div>
      </div>

      {measures.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white px-6 py-12 text-center">
          <div className="mx-auto max-w-md">
            <p className="text-6xl mb-4" aria-label="Beruhigendes Symbol">
              🌿
            </p>
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              Noch keine Messungen vorhanden
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Für diese:n Patient:in liegen noch keine Stress- oder Schlafmessungen vor.
              Sobald das erste Assessment durchgeführt wurde, werden die Ergebnisse hier
              angezeigt.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Stress Score Chart */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold mb-4">Stress-Verlauf</h2>
              <StressChart measures={measures} />
            </div>

            {/* Sleep Score Chart */}
            <div className="rounded-xl border border-slate-200 bg-white p-6">
              <h2 className="text-lg font-semibold mb-4">Schlaf-Verlauf</h2>
              <SleepChart measures={measures} />
            </div>
          </div>

          {/* AMY Reports Timeline */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold mb-4">AMY-Berichte (Chronologisch)</h2>
            <div className="space-y-4">
              {measures
                .filter((m) => m.reports?.report_text_short)
                .map((measure) => (
                  <div
                    key={measure.id}
                    className={`border-l-4 pl-4 py-2 ${
                      measure.risk_level === 'high'
                        ? 'border-red-400'
                        : measure.risk_level === 'moderate'
                        ? 'border-amber-400'
                        : 'border-emerald-400'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <span className="text-xs text-slate-500">
                          {formatDate(measure.created_at)}
                        </span>
                        <span
                          className={`ml-3 text-xs font-medium ${getRiskColor(
                            measure.risk_level
                          )}`}
                        >
                          {getRiskLabel(measure.risk_level)}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500">
                        Stress: {measure.stress_score ?? '—'} | Schlaf:{' '}
                        {measure.sleep_score ?? '—'}
                      </div>
                    </div>
                    <p className="text-sm text-slate-700 whitespace-pre-line">
                      {measure.reports!.report_text_short}
                    </p>
                  </div>
                ))}
            </div>
          </div>

          {/* Raw Data Section */}
          <div className="rounded-xl border border-slate-200 bg-white p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Rohdaten (JSON)</h2>
              <button
                onClick={() => setShowRawData(!showRawData)}
                className="text-sm text-sky-600 hover:text-sky-700 transition"
              >
                {showRawData ? 'Verbergen' : 'Anzeigen'}
              </button>
            </div>
            {showRawData && (
              <pre className="bg-slate-50 rounded p-4 overflow-x-auto text-xs text-slate-800">
                {JSON.stringify({ patient, measures }, null, 2)}
              </pre>
            )}
          </div>
        </div>
      )}
    </main>
  )
}

// Reusable line chart component
type DataPoint = {
  value: number
  date: Date
}

function LineChart({
  dataPoints,
  color,
  emptyMessage,
}: {
  dataPoints: DataPoint[]
  color: string
  emptyMessage: string
}) {
  if (dataPoints.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-sm text-slate-400">
        {emptyMessage}
      </div>
    )
  }

  const maxValue = 100
  const minValue = 0
  const chartHeight = 160
  const chartWidth = 100 // percentage

  const calculateY = (value: number) =>
    chartHeight - ((value - minValue) / (maxValue - minValue)) * chartHeight

  const calculateX = (index: number) =>
    (index / Math.max(dataPoints.length - 1, 1)) * chartWidth

  const points = dataPoints
    .map((point, index) => {
      const x = calculateX(index)
      const y = calculateY(point.value)
      return `${x},${y}`
    })
    .join(' ')

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${chartWidth} ${chartHeight}`}
        className="w-full h-48"
        preserveAspectRatio="none"
      >
        {/* Grid lines */}
        {[0, 25, 50, 75, 100].map((val) => {
          const y = calculateY(val)
          return (
            <line
              key={val}
              x1="0"
              y1={y}
              x2={chartWidth}
              y2={y}
              stroke="#e2e8f0"
              strokeWidth="0.5"
            />
          )
        })}

        {/* Line */}
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {/* Points */}
        {dataPoints.map((point, index) => {
          const x = calculateX(index)
          const y = calculateY(point.value)
          return <circle key={index} cx={x} cy={y} r="2" fill={color} />
        })}
      </svg>
      <div className="flex justify-between text-xs text-slate-500 mt-2">
        <span>0</span>
        <span>100</span>
      </div>
    </div>
  )
}

// Stress chart wrapper
function StressChart({ measures }: { measures: PatientMeasure[] }) {
  // Convert measures to oldest-first for chronological chart display
  const dataPoints = measures
    .filter((m) => m.stress_score !== null)
    .reverse()
    .map((m) => ({
      value: m.stress_score!,
      date: new Date(m.created_at),
    }))

  return (
    <LineChart
      dataPoints={dataPoints}
      color="#0ea5e9"
      emptyMessage="Keine Stress-Daten vorhanden"
    />
  )
}

// Sleep chart wrapper
function SleepChart({ measures }: { measures: PatientMeasure[] }) {
  // Convert measures to oldest-first for chronological chart display
  const dataPoints = measures
    .filter((m) => m.sleep_score !== null)
    .reverse()
    .map((m) => ({
      value: m.sleep_score!,
      date: new Date(m.created_at),
    }))

  return (
    <LineChart
      dataPoints={dataPoints}
      color="#8b5cf6"
      emptyMessage="Keine Schlaf-Daten vorhanden"
    />
  )
}
