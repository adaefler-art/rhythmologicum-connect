'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { featureFlags } from '@/lib/featureFlags'
import { Badge, Card, Button, Tabs, TabsList, TabTrigger, TabContent } from '@/lib/ui'
import { colors } from '@/lib/design-tokens'
import { PatientOverviewHeader } from './PatientOverviewHeader'
import { AssessmentList } from './AssessmentList'
import { KeyLabsSection } from './KeyLabsSection'
import { MedicationsSection } from './MedicationsSection'
import { FindingsScoresSection } from './FindingsScoresSection'
import { InterventionsSection, type RankedIntervention } from './InterventionsSection'
import { Plus, Brain, LineChart } from 'lucide-react'
import type { LabValue, Medication } from '@/lib/types/extraction'

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

type ExtractedDocument = {
  id: string
  extracted_json: {
    lab_values?: LabValue[]
    medications?: Medication[]
    vital_signs?: Record<string, unknown>
    diagnoses?: string[]
    notes?: string
  }
  doc_type: string | null
  created_at: string
}

type ReportWithSafety = {
  id: string
  assessment_id: string
  safety_score: number | null
  safety_findings: Record<string, unknown> | null
  created_at: string
}

type CalculatedResult = {
  id: string
  assessment_id: string
  scores: Record<string, unknown>
  risk_models: Record<string, unknown> | null
  created_at: string
}

type PriorityRanking = {
  id: string
  ranking_data: {
    topInterventions?: RankedIntervention[]
    rankedInterventions?: RankedIntervention[]
  }
}

export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [patient, setPatient] = useState<PatientProfile | null>(null)
  const [measures, setMeasures] = useState<PatientMeasure[]>([])
  const [documents, setDocuments] = useState<ExtractedDocument[]>([])
  const [latestReport, setLatestReport] = useState<ReportWithSafety | null>(null)
  const [latestCalculated, setLatestCalculated] = useState<CalculatedResult | null>(null)
  const [latestRanking, setLatestRanking] = useState<PriorityRanking | null>(null)
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

        // V05-I07.2: Load additional data for new sections (Key Labs, Medications, Findings, Interventions)
        // NOTE: These queries access tables that exist in schema (documents, reports, calculated_results, priority_rankings)
        // but may not yet have data populated by the processing pipeline (V05-I05).
        // Empty states are shown when data is not available. No mock/fantasy data is used.
        // All sections are presentational components that receive props and fail gracefully.
        
        // First, get assessments for this patient to use as filter for related data
        const { data: assessmentsData, error: assessmentsError } = await supabase
          .from('assessments')
          .select('id')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })

        if (assessmentsError) {
          console.warn('Error loading assessments:', assessmentsError)
        } else if (assessmentsData && assessmentsData.length > 0) {
          const assessmentIds = assessmentsData.map((a) => a.id)

          // Load documents with extracted data
          const { data: docsData, error: docsError } = await supabase
            .from('documents')
            .select('id, extracted_json, doc_type, created_at')
            .in('assessment_id', assessmentIds)
            .not('extracted_json', 'is', null)
            .order('created_at', { ascending: false })
            .limit(10)

          if (docsError) {
            console.warn('Error loading documents:', docsError)
          } else if (docsData) {
            setDocuments(docsData as ExtractedDocument[])
          }

          // Load latest report with safety data
          const { data: reportsData, error: reportsError } = await supabase
            .from('reports')
            .select('id, assessment_id, safety_score, safety_findings, created_at')
            .in('assessment_id', assessmentIds)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          if (reportsError && reportsError.code !== 'PGRST116') {
            // PGRST116 is "no rows returned", which is ok
            console.warn('Error loading reports:', reportsError)
          } else if (reportsData) {
            setLatestReport(reportsData as ReportWithSafety)
          }

          // Load latest calculated results
          const { data: calcData, error: calcError } = await supabase
            .from('calculated_results')
            .select('id, assessment_id, scores, risk_models, created_at')
            .in('assessment_id', assessmentIds)
            .order('created_at', { ascending: false })
            .limit(1)
            .single()

          if (calcError && calcError.code !== 'PGRST116') {
            console.warn('Error loading calculated results:', calcError)
          } else if (calcData) {
            setLatestCalculated(calcData as CalculatedResult)
          }

          // Load latest priority ranking
          // We need to get processing jobs for these assessments first
          const { data: jobsData, error: jobsError } = await supabase
            .from('processing_jobs')
            .select('id')
            .in('assessment_id', assessmentIds)
            .order('created_at', { ascending: false })
            .limit(10)

          if (jobsError) {
            console.warn('Error loading processing jobs:', jobsError)
          } else if (jobsData && jobsData.length > 0) {
            const jobIds = jobsData.map((j) => j.id)

            const { data: rankingData, error: rankingError } = await supabase
              .from('priority_rankings')
              .select('id, ranking_data')
              .in('job_id', jobIds)
              .order('created_at', { ascending: false })
              .limit(1)
              .single()

            if (rankingError && rankingError.code !== 'PGRST116') {
              console.warn('Error loading priority rankings:', rankingError)
            } else if (rankingData) {
              setLatestRanking(rankingData as PriorityRanking)
            }
          }
        }
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
        <p className="text-slate-600 dark:text-slate-300">Patientendaten werden geladen…</p>
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
        className="mb-4 px-4 py-2.5 min-h-[44px] text-sm md:text-base text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline transition touch-manipulation inline-flex items-center gap-2"
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
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                  Noch keine Messungen vorhanden
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
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
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Total Assessments</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{measures.length}</p>
                  </div>
                </Card>
                <Card padding="lg" shadow="md">
                  <div className="text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Latest Stress Score</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                      {latestMeasure?.stress_score ?? '—'}
                    </p>
                  </div>
                </Card>
                <Card padding="lg" shadow="md">
                  <div className="text-center">
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-1">Latest Sleep Score</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
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
                      <LineChart className="w-5 h-5 text-sky-600 dark:text-sky-400" />
                      <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">Stress-Verlauf</h2>
                    </div>
                    <StressChart measures={measures} />
                  </Card>

                  <Card padding="lg" shadow="md">
                    <div className="flex items-center gap-2 mb-4">
                      <LineChart className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">Schlaf-Verlauf</h2>
                    </div>
                    <SleepChart measures={measures} />
                  </Card>
                </div>
              )}

              {/* Key Labs and Medications Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <KeyLabsSection
                  labValues={
                    documents
                      .flatMap((doc) => doc.extracted_json?.lab_values ?? [])
                      .slice(0, 5) // Show top 5 most recent lab values
                  }
                  loading={false}
                />
                <MedicationsSection
                  medications={documents.flatMap(
                    (doc) => doc.extracted_json?.medications ?? []
                  )}
                  loading={false}
                />
              </div>

              {/* Findings & Scores Section */}
              <FindingsScoresSection
                safetyScore={latestReport?.safety_score}
                safetyFindings={latestReport?.safety_findings}
                calculatedScores={latestCalculated?.scores}
                riskModels={latestCalculated?.risk_models}
                loading={false}
              />

              {/* Interventions Section */}
              <InterventionsSection
                interventions={
                  latestRanking?.ranking_data?.topInterventions ??
                  latestRanking?.ranking_data?.rankedInterventions?.slice(0, 5) ??
                  []
                }
                loading={false}
              />

              {/* Raw Data Section */}
              <Card padding="lg" shadow="md">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-50">Rohdaten (JSON)</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowRawData(!showRawData)}
                  >
                    {showRawData ? 'Verbergen' : 'Anzeigen'}
                  </Button>
                </div>
                {showRawData && (
                  <pre className="bg-slate-50 dark:bg-slate-900/50 rounded p-4 overflow-x-auto text-xs md:text-sm text-slate-800 dark:text-slate-200">
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
                  <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                  <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">AMY-Berichte (Chronologisch)</h2>
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
                            <span className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                              {formatDate(measure.created_at)}
                            </span>
                            <Badge variant={getRiskBadgeVariant(measure.risk_level)} size="sm">
                              {getRiskLabel(measure.risk_level)}
                            </Badge>
                          </div>
                          <div className="text-xs md:text-sm text-slate-500 dark:text-slate-400">
                            Stress: {measure.stress_score ?? '—'} | Schlaf:{' '}
                            {measure.sleep_score ?? '—'}
                          </div>
                        </div>
                        <p className="text-sm md:text-base text-slate-700 dark:text-slate-300 whitespace-pre-line">
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
                <Brain className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                  Keine AMY Insights verfügbar
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-300">
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
