'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { featureFlags } from '@/lib/featureFlags'
import { Badge, Card, Button, Tabs, TabsList, TabTrigger, TabContent } from '@/lib/ui'
import { colors } from '@/lib/design-tokens'
import { PatientOverviewHeader } from './PatientOverviewHeader'
import { AssessmentList } from './AssessmentList'
import { AssessmentRunDetails } from './AssessmentRunDetails'
import { KeyLabsSection } from './KeyLabsSection'
import { MedicationsSection } from './MedicationsSection'
import { FindingsScoresSection } from './FindingsScoresSection'
import { InterventionsSection, type RankedIntervention } from './InterventionsSection'
import { QAReviewPanel } from './QAReviewPanel'
import { WorkupStatusSection } from './WorkupStatusSection'
import { AnamnesisSection } from './AnamnesisSection'
import { DiagnosisSection } from './DiagnosisSection'
import { getResults } from '@/lib/fetchClinician'
import { AmyInsightsSection } from './AmyInsightsSection'
import { Plus, Brain, LineChart } from 'lucide-react'
import type { LabValue, Medication } from '@/lib/types/extraction'
import type { WorkupStatus } from '@/lib/types/workupStatus'

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
  first_name?: string | null
  last_name?: string | null
  birth_year: number | null
  sex: string | null
  user_id: string
}

type AssessmentSummary = {
  id: string
  status: string
  workup_status?: WorkupStatus
  missing_data_fields?: string[] | null
  started_at: string
  completed_at: string | null
  funnel: string | null
  funnel_id: string | null
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
  // PatientKey SSOT: /clinician/patient/[id] expects patient_profiles.id
  const patientId = params.id as string

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [patient, setPatient] = useState<PatientProfile | null>(null)
  const [resolvedPatientId, setResolvedPatientId] = useState<string | null>(null)
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
  const [resultsDebugHint, setResultsDebugHint] = useState<string | null>(null)
  
  // V05-I07.3: Review records for QA Panel
  const [reviewRecords, setReviewRecords] = useState<string[]>([])

  const [assessmentSummaries, setAssessmentSummaries] = useState<AssessmentSummary[]>([])
  
  // E74.8: Selected assessment for detailed view
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<string | null>(null)
  
  const [showRawData, setShowRawData] = useState(false)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)

        const logProfileResolution = (details: {
          lookupBy: 'id'
          outcome: 'match' | 'not_found' | 'multiple' | 'rls_blocked' | 'error'
          rowCount: number | null
        }) => {
          console.info(
            JSON.stringify({
              event: 'PATIENT_PROFILE_RESOLUTION',
              route: '/clinician/patient/[id]',
              paramId: patientId,
              ...details,
            })
          )
        }

        const resolvePatientProfile = async (): Promise<PatientProfile | null> => {
          const { data, error: profileError } = await supabase
            .from('patient_profiles')
            .select('id, user_id, full_name, first_name, last_name, birth_year, sex')
            .eq('id', patientId)
            .maybeSingle()

          if (profileError) {
            if ((profileError as { code?: string }).code === 'PGRST116') {
              const { data: diagnosticRows } = await supabase
                .from('patient_profiles')
                .select('id')
                .eq('id', patientId)
                .limit(2)

              logProfileResolution({
                lookupBy: 'id',
                outcome: 'multiple',
                rowCount: diagnosticRows?.length ?? 0,
              })
              return null
            }

            logProfileResolution({
              lookupBy: 'id',
              outcome: 'error',
              rowCount: null,
            })
            throw profileError
          }

          if (data) {
            logProfileResolution({
              lookupBy: 'id',
              outcome: 'match',
              rowCount: 1,
            })
            
            // Debug logging for patient name data (privacy-safe)
            console.info('[PatientDetailPage] Patient profile loaded:', {
              patientId: data.id.slice(0, 8) + '...',
              hasFullName: !!data.full_name,
              hasFirstName: !!data.first_name,
              hasLastName: !!data.last_name,
            })
            
            return data
          }

          logProfileResolution({
            lookupBy: 'id',
            outcome: 'not_found',
            rowCount: 0,
          })

          return null
        }

        const resolvedProfile = await resolvePatientProfile()
        if (!resolvedProfile) {
          const { data: assessmentProbe, error: assessmentError } = await supabase
            .from('assessments')
            .select('id')
            .eq('patient_id', patientId)
            .limit(1)

          const hasAssessment = !assessmentError && (assessmentProbe?.length ?? 0) > 0
          const errorMessage = hasAssessment
            ? 'Kein Zugriff auf patient_profiles (RLS).' 
            : 'Patientenprofil nicht gefunden.'

          if (hasAssessment) {
            logProfileResolution({
              lookupBy: 'id',
              outcome: 'rls_blocked',
              rowCount: 0,
            })
          }

          setPatient(null)
          setResolvedPatientId(null)
          setError(errorMessage)
          return
        }

        const profileId = resolvedProfile.id
        setPatient(resolvedProfile)
        setResolvedPatientId(profileId)

        // Load patient profile and measures in parallel for better performance
        const measuresResult = await supabase
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
          .eq('patient_id', profileId)
          .order('created_at', { ascending: false })

        if (measuresResult.error) throw measuresResult.error
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
          .select('id, status, workup_status, missing_data_fields, started_at, completed_at, funnel, funnel_id')
          .eq('patient_id', profileId)
          .order('started_at', { ascending: false })) as {
          data: AssessmentSummary[] | null
          error: unknown
        }

        if (assessmentsError) {
          console.warn('[I07.2]', 'E_QUERY_ASSESSMENTS', 'assessments')
          setAssessmentSummaries([])
          // Cannot proceed without assessments - set all sections to empty
          setLabsState({ state: 'empty' })
          setMedsState({ state: 'empty' })
          setSafetyState({ state: 'empty' })
          setScoresState({ state: 'empty' })
          setInterventionsState({ state: 'empty' })
        } else if (assessmentsData && assessmentsData.length > 0) {
          setAssessmentSummaries(assessmentsData)
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

          try {
            setResultsDebugHint(null)
            const { data, error, debugHint } = await getResults(profileId)

            setResultsDebugHint(debugHint ?? null)

            if (error || !data?.success) {
              const evidenceCode = mapSupabaseErrorToEvidenceCode(data?.error, 'RESULTS')
              setSafetyState({ state: 'error', evidenceCode })
              setScoresState({ state: 'error', evidenceCode })
              setInterventionsState({ state: 'error', evidenceCode })
              setReviewRecords([])
            } else {
              const reports = data.data?.reports ?? []
              const calculatedResults = data.data?.calculatedResults ?? []
              const priorityRankings = data.data?.priorityRankings ?? []
              const reviewRecordsData = data.data?.reviewRecords ?? []

              setSafetyState(
                reports.length > 0
                  ? { state: 'ok', items: [reports[0] as ReportWithSafety] }
                  : { state: 'empty' },
              )

              setScoresState(
                calculatedResults.length > 0
                  ? { state: 'ok', items: [calculatedResults[0] as CalculatedResult] }
                  : { state: 'empty' },
              )

              if (priorityRankings.length > 0) {
                const ranking = priorityRankings[0] as PriorityRanking
                const interventions =
                  ranking.ranking_data?.topInterventions ??
                  ranking.ranking_data?.rankedInterventions?.slice(0, 5) ??
                  []
                setInterventionsState(
                  interventions.length > 0 ? { state: 'ok', items: interventions } : { state: 'empty' },
                )
              } else {
                setInterventionsState({ state: 'empty' })
              }

              setReviewRecords(reviewRecordsData.map((record: { id: string }) => record.id))
            }
          } catch (resultsError) {
            console.warn('[I07.2]', 'E_QUERY_RESULTS', resultsError)
            setSafetyState({ state: 'error', evidenceCode: 'E_QUERY_RESULTS' })
            setScoresState({ state: 'error', evidenceCode: 'E_QUERY_RESULTS' })
            setInterventionsState({ state: 'error', evidenceCode: 'E_QUERY_RESULTS' })
            setReviewRecords([])
          }
        } else {
          setAssessmentSummaries([])
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
          const response = await fetch(
            `/api/patient/assessments-with-results?patientId=${profileId}`
          )
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
  const patientProfileId = patient?.id ?? resolvedPatientId ?? patientId
  const latestAssessment = assessmentSummaries.length > 0 ? assessmentSummaries[0] : null
  const formatAssessmentStatus = (status: string) => {
    switch (status) {
      case 'completed':
        return { label: 'Abgeschlossen', variant: 'success' as const }
      case 'in_progress':
        return { label: 'In Bearbeitung', variant: 'warning' as const }
      default:
        return { label: 'Unbekannt', variant: 'secondary' as const }
    }
  }

  return (
    <div className="w-full">
      {/* Back Button */}
      <button
        onClick={() => router.push('/clinician')}
        className="mb-4 px-4 py-2.5 min-h-11 text-sm md:text-base text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 hover:underline transition touch-manipulation inline-flex items-center gap-2"
      >
        ← Zurück zur Übersicht
      </button>

      {/* Patient Overview Header */}
      <PatientOverviewHeader
        fullName={patient.full_name}
        firstName={patient.first_name ?? null}
        lastName={patient.last_name ?? null}
        birthYear={patient.birth_year}
        sex={patient.sex}
        patientId={patientProfileId}
        latestRiskLevel={latestMeasure?.risk_level}
        hasPendingAssessment={latestMeasure?.risk_level === 'pending'}
      />

      {/* Tabbed Content */}
      <Tabs defaultTab="overview">
        <TabsList>
          <TabTrigger value="overview">Overview</TabTrigger>
          <TabTrigger value="assessments">Assessments</TabTrigger>
          <TabTrigger value="anamnese">Anamnese</TabTrigger>
          <TabTrigger value="diagnosis">Diagnosis</TabTrigger>
          <TabTrigger value="insights">AMY Insights</TabTrigger>
          <TabTrigger value="actions">Actions</TabTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabContent value="overview">
          {measures.length === 0 && assessmentSummaries.length === 0 ? (
            <Card padding="lg" shadow="md">
              <div className="text-center py-8">
                <p className="text-6xl mb-4" aria-label="Beruhigendes Symbol">
                  🌿
                </p>
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
                  Noch keine Assessments vorhanden
                </h2>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Für diese:n Patient:in liegen noch keine Assessments vor.
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
                    <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{assessmentSummaries.length + measures.length}</p>
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
              {latestAssessment && (
                <Card 
                  padding="lg" 
                  shadow="md" 
                  interactive
                  onClick={() => setSelectedAssessmentId(latestAssessment.id)}
                  className="cursor-pointer"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Letztes Assessment</p>
                      <p className="text-lg font-semibold text-slate-900 dark:text-slate-50">
                        {formatDate(latestAssessment.started_at)}
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        {latestAssessment.funnel || latestAssessment.funnel_id?.slice(0, 8) || '—'}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant={formatAssessmentStatus(latestAssessment.status).variant}>
                        {formatAssessmentStatus(latestAssessment.status).label}
                      </Badge>
                      <span className="text-sky-600 dark:text-sky-400 text-sm font-medium">Details →</span>
                    </div>
                  </div>
                </Card>
              )}

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
              {resultsDebugHint && (
                <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
                  {resultsDebugHint}
                </div>
              )}

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
          {/* E74.8: Show detailed view if an assessment is selected */}
          {selectedAssessmentId ? (
            <div className="mb-6">
              <AssessmentRunDetails
                assessmentId={selectedAssessmentId}
                onClose={() => setSelectedAssessmentId(null)}
              />
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-4">
                  Assessment-Historie
                </h3>
                {assessmentSummaries.length === 0 ? (
                  <Card padding="lg" shadow="sm">
                    <p className="text-sm text-slate-600 dark:text-slate-300">
                      Keine Assessments vorhanden.
                    </p>
                  </Card>
                ) : (
                  <div className="space-y-3">
                    {assessmentSummaries.map((assessment) => {
                      const statusBadge = formatAssessmentStatus(assessment.status)
                      const funnelLabel = assessment.funnel || assessment.funnel_id?.slice(0, 8) || '—'

                      return (
                        <Card
                          key={assessment.id}
                          padding="lg"
                          shadow="sm"
                          interactive
                          onClick={() => setSelectedAssessmentId(assessment.id)}
                        >
                          <div className="flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-50">
                                  {funnelLabel}
                                </h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Gestartet: {formatDate(assessment.started_at)}
                                </p>
                                {assessment.completed_at && (
                                  <p className="text-xs text-slate-500 dark:text-slate-400">
                                    Abgeschlossen: {formatDate(assessment.completed_at)}
                                  </p>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <Badge variant={statusBadge.variant} size="sm">
                                  {statusBadge.label}
                                </Badge>
                                <span className="text-sky-600 text-xs font-medium">Öffnen →</span>
                              </div>
                            </div>
                          </div>
                        </Card>
                      )
                    })}
                  </div>
                )}
              </div>
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
                        <Card 
                          key={assessment.id} 
                          padding="lg" 
                          shadow="md"
                          interactive
                          onClick={() => setSelectedAssessmentId(assessment.id)}
                        >
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
                              <div className="flex items-center gap-2">
                                <Badge variant="success" size="sm">Abgeschlossen</Badge>
                                <span className="text-sky-600 text-sm font-medium">Details →</span>
                              </div>
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
            </>
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

        {/* Anamnese Tab - E75.4 */}
        <TabContent value="anamnese">
          <AnamnesisSection patientId={patientProfileId} />
        </TabContent>

        {/* Diagnosis Tab */}
        <TabContent value="diagnosis">
          <DiagnosisSection patientId={patientProfileId} />
        </TabContent>

        {/* AMY Insights Tab */}
        <TabContent value="insights">
          <AmyInsightsSection patientId={patientProfileId} isEnabled={featureFlags.AMY_CHAT_ENABLED} />
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
