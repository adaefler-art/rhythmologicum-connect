'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { featureFlags } from '@/lib/featureFlags'
import { Badge, Card, Button, Tabs, TabsList, TabTrigger, TabContent } from '@/lib/ui'
import { colors } from '@/lib/design-tokens'
import { PatientOverviewHeader } from './PatientOverviewHeader'
import { AssessmentList } from './AssessmentList'
import { Plus, Brain, LineChart } from 'lucide-react'

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

  const getRiskBadgeVariant = (risk: string): 'danger' | 'warning' | 'success' | 'secondary' => {
    switch (risk) {
      case 'high':
        return 'danger'
      case 'moderate':
        return 'warning'
      case 'low':
        return 'success'
      default:
        return 'secondary'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-600">Patientendaten werden geladen…</p>
      </div>
    )
  }

  if (error || !patient) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="max-w-md text-center">
          <p className="text-red-500 mb-4">{error ?? 'Patient nicht gefunden.'}</p>
          <Button variant="primary" onClick={() => router.push('/clinician')}>
            Zurück zur Übersicht
          </Button>
        </div>
      </div>
    )
  }

  // Get latest measure for status badges
  const latestMeasure = measures.length > 0 ? measures[0] : null

  return (
    <div className="w-full">
      {/* Back Button */}
      <button
        onClick={() => router.push('/clinician')}
        className="mb-4 px-4 py-2.5 min-h-[44px] text-sm md:text-base text-sky-600 hover:text-sky-700 hover:underline transition touch-manipulation inline-flex items-center gap-2"
      >
        ← Zurück zur Übersicht
      </button>

      {/* Patient Overview Header */}
      <PatientOverviewHeader
        fullName={patient.full_name}
        birthYear={patient.birth_year}
        sex={patient.sex}
        patientId={patientId}
        latestRiskLevel={latestMeasure?.risk_level}
        hasPendingAssessment={latestMeasure?.risk_level === 'pending'}
      />

      {/* Tabbed Content */}
      <Tabs defaultTab="overview">
        <TabsList>
          <TabTrigger value="overview">Overview</TabTrigger>
          <TabTrigger value="assessments">Assessments</TabTrigger>
          <TabTrigger value="insights">AMY Insights</TabTrigger>
          <TabTrigger value="actions">Actions</TabTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabContent value="overview">
          {measures.length === 0 ? (
            <Card padding="lg" shadow="md">
              <div className="text-center py-8">
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
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card padding="lg" shadow="md">
                  <div className="text-center">
                    <p className="text-sm text-slate-500 mb-1">Total Assessments</p>
                    <p className="text-3xl font-bold text-slate-900">{measures.length}</p>
                  </div>
                </Card>
                <Card padding="lg" shadow="md">
                  <div className="text-center">
                    <p className="text-sm text-slate-500 mb-1">Latest Stress Score</p>
                    <p className="text-3xl font-bold text-slate-900">
                      {latestMeasure?.stress_score ?? '—'}
                    </p>
                  </div>
                </Card>
                <Card padding="lg" shadow="md">
                  <div className="text-center">
                    <p className="text-sm text-slate-500 mb-1">Latest Sleep Score</p>
                    <p className="text-3xl font-bold text-slate-900">
                      {latestMeasure?.sleep_score ?? '—'}
                    </p>
                  </div>
                </Card>
              </div>

              {/* Charts Section */}
              {featureFlags.CHARTS_ENABLED && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <Card padding="lg" shadow="md">
                    <div className="flex items-center gap-2 mb-4">
                      <LineChart className="w-5 h-5 text-sky-600" />
                      <h2 className="text-base md:text-lg font-semibold">Stress-Verlauf</h2>
                    </div>
                    <StressChart measures={measures} />
                  </Card>

                  <Card padding="lg" shadow="md">
                    <div className="flex items-center gap-2 mb-4">
                      <LineChart className="w-5 h-5 text-purple-600" />
                      <h2 className="text-base md:text-lg font-semibold">Schlaf-Verlauf</h2>
                    </div>
                    <SleepChart measures={measures} />
                  </Card>
                </div>
              )}

              {/* Raw Data Section */}
              <Card padding="lg" shadow="md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base md:text-lg font-semibold">Rohdaten (JSON)</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRawData(!showRawData)}
                  >
                    {showRawData ? 'Verbergen' : 'Anzeigen'}
                  </Button>
                </div>
                {showRawData && (
                  <pre className="bg-slate-50 rounded p-4 overflow-x-auto text-xs md:text-sm text-slate-800">
                    {JSON.stringify({ patient, measures }, null, 2)}
                  </pre>
                )}
              </Card>
            </div>
          )}
        </TabContent>

        {/* Assessments Tab */}
        <TabContent value="assessments">
          <AssessmentList
            assessments={measures}
            onViewDetails={(id) => {
              // Navigate to report or assessment detail if available
              const measure = measures.find((m) => m.id === id)
              if (measure?.report_id) {
                router.push(`/clinician/report/${measure.report_id}`)
              }
            }}
          />
        </TabContent>

        {/* AMY Insights Tab */}
        <TabContent value="insights">
          {featureFlags.AMY_ENABLED && measures.some((m) => m.reports?.report_text_short) ? (
            <div className="space-y-4">
              <Card padding="lg" shadow="md">
                <div className="flex items-center gap-2 mb-4">
                  <Brain className="w-5 h-5 text-purple-600" />
                  <h2 className="text-lg font-semibold">AMY-Berichte (Chronologisch)</h2>
                </div>
                <div className="space-y-4">
                  {measures
                    .filter((m) => m.reports?.report_text_short)
                    .map((measure) => (
                      <div
                        key={measure.id}
                        className={`border-l-4 pl-4 py-3 ${
                          measure.risk_level === 'high'
                            ? 'border-red-400'
                            : measure.risk_level === 'moderate'
                            ? 'border-amber-400'
                            : 'border-emerald-400'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="text-xs md:text-sm text-slate-500">
                              {formatDate(measure.created_at)}
                            </span>
                            <Badge variant={getRiskBadgeVariant(measure.risk_level)} size="sm">
                              {getRiskLabel(measure.risk_level)}
                            </Badge>
                          </div>
                          <div className="text-xs md:text-sm text-slate-500">
                            Stress: {measure.stress_score ?? '—'} | Schlaf:{' '}
                            {measure.sleep_score ?? '—'}
                          </div>
                        </div>
                        <p className="text-sm md:text-base text-slate-700 whitespace-pre-line">
                          {measure.reports!.report_text_short}
                        </p>
                      </div>
                    ))}
                </div>
              </Card>
            </div>
          ) : (
            <Card padding="lg" shadow="md">
              <div className="text-center py-8">
                <Brain className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Keine AMY Insights verfügbar
                </h3>
                <p className="text-sm text-slate-600">
                  {!featureFlags.AMY_ENABLED
                    ? 'AMY-Integration ist derzeit deaktiviert.'
                    : 'Für diese:n Patient:in liegen noch keine AMY-generierten Berichte vor.'}
                </p>
              </div>
            </Card>
          )}
        </TabContent>

        {/* Actions Tab */}
        <TabContent value="actions">
          <Card padding="lg" shadow="md">
            <h2 className="text-lg font-semibold mb-4">Verfügbare Aktionen</h2>
            <div className="space-y-3">
              <Button
                variant="primary"
                fullWidth
                icon={<Plus className="w-4 h-4" />}
                onClick={() => {
                  // TODO: Navigate to new assessment creation
                  alert('Assessment-Erstellung wird in v0.5 implementiert')
                }}
              >
                Neues Assessment starten
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={() => router.push('/clinician')}
              >
                Zurück zur Patientenübersicht
              </Button>
            </div>
          </Card>
        </TabContent>
      </Tabs>
    </div>
  )
}

// Reusable line chart component
type DataPoint = {
  value: number
  date: Date
}

function SimpleLineChart({
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
              stroke={colors.neutral[200]}
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
    <SimpleLineChart
      dataPoints={dataPoints}
      color={colors.primary[500]}
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
    <SimpleLineChart
      dataPoints={dataPoints}
      color={colors.semantic.info}
      emptyMessage="Keine Schlaf-Daten vorhanden"
    />
  )
}
