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
import { QAReviewPanel } from './QAReviewPanel'
import { WorkupStatusSection } from './WorkupStatusSection'
import { Plus, Brain, LineChart } from 'lucide-react'
import type { LabValue, Medication } from '@/lib/types/extraction'
import type { WorkupStatus, AssessmentListItemWithWorkup } from '@/lib/types/workupStatus'

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

/**
 * Section data state - distinguishes between "no data" and "data source error"
 * Evidence codes follow pattern: E_QUERY_<SOURCE> | E_SCHEMA_<SOURCE> | E_RLS_<SOURCE>
 */
type SectionState<T> =
  | { state: 'ok'; items: T[] }
  | { state: 'empty' }
  | { state: 'error'; evidenceCode: string }

/**
 * Maps Supabase errors to evidence codes (PHI-safe)
 * @param error - Supabase error object
 * @param source - Data source identifier (e.g., "LABS", "MEDS", "SAFETY", "INTERVENTIONS")
 * @returns Evidence code for debugging
 */
function mapSupabaseErrorToEvidenceCode(error: unknown, source: string): string {
  if (!error) return `E_UNKNOWN_${source}`
  
  const err = error as { code?: string; message?: string; details?: string }
  
  // PostgreSQL error codes
  if (err.code === '42P01') return `E_SCHEMA_${source}` // undefined_table
  if (err.code === '42703') return `E_SCHEMA_${source}` // undefined_column
  if (err.code?.startsWith('42')) return `E_SCHEMA_${source}` // syntax/schema errors
  if (err.code === 'PGRST301') return `E_RLS_${source}` // RLS policy violation
  if (err.code?.startsWith('PGRST3')) return `E_RLS_${source}` // RLS/auth errors
  
  // Generic query error
  return `E_QUERY_${source}`
}

export default function PatientDetailPage() {
  const params = useParams()
  const router = useRouter()
  const patientId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [patient, setPatient] = useState<PatientProfile | null>(null)
  const [measures, setMeasures] = useState<PatientMeasure[]>([])
  
  // E73.5: Assessments with calculated results (SSOT)
  const [assessmentsWithResults, setAssessmentsWithResults] = useState<any[]>([])
  
  // E6.4.4: Workup status from latest completed assessment
  const [latestWorkupStatus, setLatestWorkupStatus] = useState<WorkupStatus>(null)
  const [latestMissingDataFields, setLatestMissingDataFields] = useState<string[]>([])
  const [latestAssessmentId, setLatestAssessmentId] = useState<string | null>(null)
  
  // V05-I07.2: Section states - distinguish "no data" from "data source error"
  const [labsState, setLabsState] = useState<SectionState<LabValue>>({ state: 'empty' })
  const [medsState, setMedsState] = useState<SectionState<Medication>>({ state: 'empty' })
  const [safetyState, setSafetyState] = useState<SectionState<ReportWithSafety>>({ state: 'empty' })
  const [scoresState, setScoresState] = useState<SectionState<CalculatedResult>>({ state: 'empty' })
  const [interventionsState, setInterventionsState] = useState<SectionState<RankedIntervention>>({ state: 'empty' })
  
  // V05-I07.3: Review records for QA Panel
  const [reviewRecords, setReviewRecords] = useState<string[]>([])
  
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
        // We distinguish between "no data" (empty state) and "data source error" (error state with evidence code).
        // All sections are presentational components that receive props and fail gracefully.
        
        // First, get assessments for this patient to use as filter for related data
        // E6.4.4: Also fetch workup_status and missing_data_fields
        // Type assertion needed as schema types not yet regenerated from migration
        const { data: assessmentsData, error: assessmentsError } = (await supabase
          .from('assessments')
          .select('id, status, workup_status, missing_data_fields')
          .eq('patient_id', patientId)
          .order('created_at', { ascending: false })) as {
          data: AssessmentListItemWithWorkup[] | null
          error: unknown
        }

        if (assessmentsError) {
          console.warn('[I07.2]', 'E_QUERY_ASSESSMENTS', 'assessments')
          // Cannot proceed without assessments - set all sections to empty
          setLabsState({ state: 'empty' })
          setMedsState({ state: 'empty' })
          setSafetyState({ state: 'empty' })
          setScoresState({ state: 'empty' })
          setInterventionsState({ state: 'empty' })
        } else if (assessmentsData && assessmentsData.length > 0) {
          const assessmentIds = assessmentsData.map((a) => a.id)

          // E6.4.4: Get latest completed assessment's workup status
          const latestCompleted = assessmentsData.find((a) => a.status === 'completed')
          if (latestCompleted) {
            setLatestAssessmentId(latestCompleted.id)
            setLatestWorkupStatus((latestCompleted.workup_status as WorkupStatus) ?? null)
            setLatestMissingDataFields(
              Array.isArray(latestCompleted.missing_data_fields)
                ? (latestCompleted.missing_data_fields as string[])
                : [],
            )
          }

          // Load documents with extracted data (for Labs and Medications)
          const { data: docsData, error: docsError } = await supabase
            .from('documents')
            .select('id, extracted_json, doc_type, created_at')
            .in('assessment_id', assessmentIds)
            .not('extracted_json', 'is', null)
            .order('created_at', { ascending: false })
            .limit(10)

          if (docsError) {
            const evidenceCode = mapSupabaseErrorToEvidenceCode(docsError, 'DOCS')
            console.warn('[I07.2]', evidenceCode, 'documents')
            setLabsState({ state: 'error', evidenceCode })
            setMedsState({ state: 'error', evidenceCode })
          } else if (docsData && docsData.length > 0) {
            // Extract labs and meds from documents
            const labs = docsData.flatMap((doc) => (doc as ExtractedDocument).extracted_json?.lab_values ?? [])
            const meds = docsData.flatMap((doc) => (doc as ExtractedDocument).extracted_json?.medications ?? [])
            
            setLabsState(labs.length > 0 ? { state: 'ok', items: labs.slice(0, 5) } : { state: 'empty' })
            setMedsState(meds.length > 0 ? { state: 'ok', items: meds } : { state: 'empty' })
          } else {
            // No documents found (not an error, just no data yet)
            setLabsState({ state: 'empty' })
            setMedsState({ state: 'empty' })
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
            // PGRST116 is "no rows returned", which is expected/ok (empty state)
            const evidenceCode = mapSupabaseErrorToEvidenceCode(reportsError, 'SAFETY')
            console.warn('[I07.2]', evidenceCode, 'reports')
            setSafetyState({ state: 'error', evidenceCode })
          } else if (reportsData) {
            setSafetyState({ state: 'ok', items: [reportsData as ReportWithSafety] })
          } else {
            setSafetyState({ state: 'empty' })
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
            const evidenceCode = mapSupabaseErrorToEvidenceCode(calcError, 'SCORES')
            console.warn('[I07.2]', evidenceCode, 'calculated_results')
            setScoresState({ state: 'error', evidenceCode })
          } else if (calcData) {
            setScoresState({ state: 'ok', items: [calcData as CalculatedResult] })
          } else {
            setScoresState({ state: 'empty' })
          }

          // Load latest priority ranking
          // First get processing jobs for these assessments
          const { data: jobsData, error: jobsError } = await supabase
            .from('processing_jobs')
            .select('id')
            .in('assessment_id', assessmentIds)
            .order('created_at', { ascending: false })
            .limit(10)

          if (jobsError) {
            const evidenceCode = mapSupabaseErrorToEvidenceCode(jobsError, 'JOBS')
            console.warn('[I07.2]', evidenceCode, 'processing_jobs')
            setInterventionsState({ state: 'error', evidenceCode })
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
              const evidenceCode = mapSupabaseErrorToEvidenceCode(rankingError, 'INTERVENTIONS')
              console.warn('[I07.2]', evidenceCode, 'priority_rankings')
              setInterventionsState({ state: 'error', evidenceCode })
            } else if (rankingData) {
              const ranking = rankingData as PriorityRanking
              const interventions = ranking.ranking_data?.topInterventions ?? 
                                   ranking.ranking_data?.rankedInterventions?.slice(0, 5) ?? []
              setInterventionsState(interventions.length > 0 ? { state: 'ok', items: interventions } : { state: 'empty' })
            } else {
              setInterventionsState({ state: 'empty' })
            }

            // V05-I07.3: Load review records for QA Panel
            const { data: reviewData, error: reviewError } = await supabase
              .from('review_records')
              .select('id')
              .in('job_id', jobIds)
              .order('created_at', { ascending: false })

            if (!reviewError && reviewData && reviewData.length > 0) {
              setReviewRecords(reviewData.map((r) => r.id))
            } else {
              setReviewRecords([])
            }
          } else {
            setInterventionsState({ state: 'empty' })
          }
        } else {
          // No assessments found for this patient (not an error, just no data yet)
          setLabsState({ state: 'empty' })
          setMedsState({ state: 'empty' })
          setSafetyState({ state: 'empty' })
          setScoresState({ state: 'empty' })
          setInterventionsState({ state: 'empty' })
        }

        // E73.5: Fetch assessments with results from SSOT endpoint
        // IMPORTANT: Literal string callsite for endpoint wiring
        try {
          const response = await fetch(`/api/patient/assessments-with-results?patientId=${patientId}`)
          if (response.ok) {
            const json = await response.json()
            if (json.success && json.data?.assessments) {
              setAssessmentsWithResults(json.data.assessments)
            }
          }
        } catch (err) {
          console.warn('[E73.5] Failed to fetch assessments with results:', err)
          // Non-fatal error - continue with page load
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

              {/* E6.4.4: Workup Status Section - Shows consistent status with patient view */}
              {latestAssessmentId && (
                <WorkupStatusSection
                  workupStatus={latestWorkupStatus}
                  missingDataFields={latestMissingDataFields}
                  assessmentId={latestAssessmentId}
                />
              )}

              {/* Key Labs and Medications Section */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <KeyLabsSection
                  labValues={labsState.state === 'ok' ? labsState.items : []}
                  loading={false}
                  errorEvidenceCode={labsState.state === 'error' ? labsState.evidenceCode : undefined}
                />
                <MedicationsSection
                  medications={medsState.state === 'ok' ? medsState.items : []}
                  loading={false}
                  errorEvidenceCode={medsState.state === 'error' ? medsState.evidenceCode : undefined}
                />
              </div>

              {/* Findings & Scores Section */}
              <FindingsScoresSection
                safetyScore={safetyState.state === 'ok' ? safetyState.items[0]?.safety_score : undefined}
                safetyFindings={safetyState.state === 'ok' ? safetyState.items[0]?.safety_findings : undefined}
                calculatedScores={scoresState.state === 'ok' ? scoresState.items[0]?.scores : undefined}
                riskModels={scoresState.state === 'ok' ? scoresState.items[0]?.risk_models : undefined}
                loading={false}
                errorEvidenceCode={
                  safetyState.state === 'error' ? safetyState.evidenceCode :
                  scoresState.state === 'error' ? scoresState.evidenceCode :
                  undefined
                }
              />

              {/* Interventions Section */}
              <InterventionsSection
                interventions={interventionsState.state === 'ok' ? interventionsState.items : []}
                loading={false}
                errorEvidenceCode={interventionsState.state === 'error' ? interventionsState.evidenceCode : undefined}
              />

              {/* V05-I07.3: QA Review Panel - shows Layer 1 & Layer 2 findings with approve/reject actions */}
              {reviewRecords.length > 0 && reviewRecords.map((reviewId) => (
                <QAReviewPanel
                  key={reviewId}
                  reviewId={reviewId}
                  onDecisionMade={() => {
                    // Optionally reload data after decision
                    console.log('Review decision made:', reviewId)
                  }}
                />
              ))}

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
          {/* E73.5: New assessments with calculated results (SSOT) */}
          {assessmentsWithResults.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                Abgeschlossene Assessments mit Ergebnissen
              </h3>
              <div className="space-y-3">
                {assessmentsWithResults.map((assessment) => {
                  const stressScore = assessment.result?.scores?.stress_score
                  const sleepScore = assessment.result?.scores?.sleep_score
                  
                  return (
                    <Card key={assessment.id} padding="lg" shadow="md">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                              {assessment.funnelName}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                              Abgeschlossen: {new Date(assessment.completedAt).toLocaleDateString('de-DE')}
                            </p>
                          </div>
                          <Badge variant="success" size="sm">Abgeschlossen</Badge>
                        </div>
                        
                        {(stressScore != null || sleepScore != null) && (
                          <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100 dark:border-slate-700">
                            {stressScore != null && (
                              <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3">
                                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Stress-Score</p>
                                <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-50">
                                  {Math.round(stressScore)}
                                </p>
                              </div>
                            )}
                            {sleepScore != null && (
                              <div className="rounded-lg border border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-3">
                                <p className="text-xs font-medium text-slate-600 dark:text-slate-400">Schlaf-Score</p>
                                <p className="mt-1 text-xl font-semibold text-slate-900 dark:text-slate-50">
                                  {Math.round(sleepScore)}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          {/* Legacy measures */}
          {measures.length > 0 && (
            <>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4 mt-6">
                Legacy-Messungen
              </h3>
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
            </>
          )}
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
