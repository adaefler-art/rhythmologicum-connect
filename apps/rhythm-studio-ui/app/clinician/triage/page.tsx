'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Badge, Card, Table, LoadingSpinner, ErrorState } from '@/lib/ui'
import { env } from '@/lib/env'
import type { TableColumn } from '@/lib/ui/Table'
import {
  FileCheck,
  AlertTriangle,
  Clock,
  Loader,
} from 'lucide-react'

// Triage status types matching the acceptance criteria
type TriageStatus = 'incomplete' | 'processing' | 'report_ready' | 'flagged'

type AssessmentTriage = {
  assessment_id: string
  patient_id: string
  patient_name: string
  funnel_slug: string
  funnel_title: string | null
  started_at: string
  completed_at: string | null
  assessment_status: string
  assessment_state: string | null
  processing_status: string | null
  processing_stage: string | null
  report_status: string | null
  report_id: string | null
  risk_level: string | null
  risk_score: number | null
  result_computed_at: string | null
  triage_status: TriageStatus
  flagged_reason: string | null
}

type TriageDiagnosisKind =
  | 'NO_SESSION'
  | 'QUERY_ERROR'
  | 'NO_ROWS_VISIBLE'
  | 'JOIN_BLOCKED'
  | 'JOIN_RLS_BLOCKING'
  | 'OK'

type TriageDiagnosisResult =
  | { kind: 'NO_SESSION' }
  | { kind: 'QUERY_ERROR'; message: string }
  | { kind: 'NO_ROWS_VISIBLE' }
  | { kind: 'JOIN_BLOCKED' }
  | { kind: 'JOIN_RLS_BLOCKING'; data: AssessmentTriage[] }
  | { kind: 'OK'; data: AssessmentTriage[] }

export default function TriagePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assessments, setAssessments] = useState<AssessmentTriage[]>([])
  const [diagnosis, setDiagnosis] = useState<TriageDiagnosisResult | null>(null)
  const [healthAssessmentsTotal, setHealthAssessmentsTotal] = useState<number | null>(null)
  const [retryTrigger, setRetryTrigger] = useState(0)
  const [userId, setUserId] = useState<string | null>(null)

  const loadTriageData = useCallback(async (): Promise<TriageDiagnosisResult> => {
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      setUserId(null)
      return { kind: 'NO_SESSION' }
    }

    setUserId(user.id)

    const { data: assessmentsData, error: assessmentsError } = await supabase
      .from('assessments')
      .select(
        `
          id,
          patient_id,
          funnel,
          funnel_id,
          started_at,
          completed_at,
          status,
          state
        `,
      )
      .order('started_at', { ascending: false })
      .limit(100)

    if (assessmentsError) {
      return {
        kind: 'QUERY_ERROR',
        message: assessmentsError.message || 'Unbekannter Fehler',
      }
    }

    const assessmentsLen = assessmentsData?.length ?? 0

    if (assessmentsLen === 0) {
      return { kind: 'NO_ROWS_VISIBLE' }
    }

    const patientIds = Array.from(
      new Set((assessmentsData ?? []).map((row: any) => row.patient_id).filter(Boolean)),
    )
    const funnelIds = Array.from(
      new Set((assessmentsData ?? []).map((row: any) => row.funnel_id).filter(Boolean)),
    )

    let patientProfiles: any[] = []
    let funnels: any[] = []
    let joinFailed = false

    if (patientIds.length > 0) {
      const { data: patientData, error: patientError } = await supabase
        .from('patient_profiles')
        .select('id, full_name, user_id')
        .in('id', patientIds)

      if (patientError) {
        joinFailed = true
      } else {
        patientProfiles = patientData ?? []
      }
    }

    if (funnelIds.length > 0) {
      const { data: funnelData, error: funnelError } = await supabase
        .from('funnels')
        .select('id, slug, title')
        .in('id', funnelIds)

      if (funnelError) {
        joinFailed = true
      } else {
        funnels = funnelData ?? []
      }
    }

    const patientMap = new Map(patientProfiles.map((profile: any) => [profile.id, profile]))
    const funnelMap = new Map(funnels.map((funnel: any) => [funnel.id, funnel]))

    const assessmentIds = (assessmentsData ?? []).map((a: any) => a.id)
        
      let processingData = null
      let reportsData = null
      let resultsData = null

    if (assessmentIds.length > 0) {
      const { data: pData, error: processingError } = await supabase
        .from('processing_jobs')
        .select('assessment_id, status, stage, delivery_status')
        .in('assessment_id', assessmentIds)

      if (processingError) console.warn('Processing jobs query failed:', processingError)
      processingData = pData

      const { data: rData, error: reportsError } = await supabase
        .from('reports')
        .select('assessment_id, id, status, risk_level')
        .in('assessment_id', assessmentIds)

      if (reportsError) console.warn('Reports query failed:', reportsError)
      reportsData = rData

      const { data: crData, error: resultsError } = await supabase
        .from('calculated_results')
        .select('assessment_id, scores, risk_models, computed_at')
        .in('assessment_id', assessmentIds)

      if (resultsError) console.warn('Calculated results query failed:', resultsError)
      resultsData = crData
    }

        // Map processing and report data
        const processingMap = new Map(
          (processingData ?? []).map((p: any) => [p.assessment_id, p])
        )
        const reportsMap = new Map(
          (reportsData ?? []).map((r: any) => [r.assessment_id, r])
        )
        const resultsMap = new Map(
          (resultsData ?? []).map((r: any) => [r.assessment_id, r])
        )

    const triageData: AssessmentTriage[] = (assessmentsData ?? []).map((a: any) => {
      const processing = processingMap.get(a.id)
      const report = reportsMap.get(a.id)
      const calculated = resultsMap.get(a.id)
      const patientProfile = patientMap.get(a.patient_id)
      const funnel = a.funnel_id ? funnelMap.get(a.funnel_id) : null
      const riskLevel =
        calculated?.risk_models?.riskLevel ||
        calculated?.risk_models?.risk_level ||
        report?.risk_level ||
        null
      const riskScore = calculated?.scores?.riskScore ?? calculated?.scores?.stress_score ?? null
      const resultComputedAt = calculated?.computed_at || null

      let triageStatus: TriageStatus
      let flaggedReason: string | null = null

      if (a.status === 'in_progress') {
        triageStatus = 'incomplete'
      } else if (a.completed_at && processing) {
        if (processing.status === 'failed') {
          triageStatus = 'flagged'
          flaggedReason = 'Processing failed'
        } else if (calculated) {
          triageStatus = 'report_ready'
          if (riskLevel === 'high' || riskLevel === 'critical') {
            triageStatus = 'flagged'
            flaggedReason = 'High risk detected'
          }
        } else if (processing.status === 'queued' || processing.status === 'in_progress') {
          triageStatus = 'processing'
        } else {
          triageStatus = calculated ? 'report_ready' : 'processing'
        }
      } else if (a.completed_at && !processing) {
        triageStatus = calculated ? 'report_ready' : 'processing'
        if (calculated && (riskLevel === 'high' || riskLevel === 'critical')) {
          triageStatus = 'flagged'
          flaggedReason = 'High risk detected'
        }
      } else {
        triageStatus = 'incomplete'
      }

      return {
        assessment_id: a.id,
        patient_id: a.patient_id,
        patient_name:
          patientProfile?.full_name ||
          patientProfile?.user_id ||
          a.patient_id ||
          'Unbekannt (RLS)',
        funnel_slug: a.funnel || funnel?.slug || 'unknown',
        funnel_title: funnel?.title || null,
        started_at: a.started_at,
        completed_at: a.completed_at,
        assessment_status: a.status,
        assessment_state: a.state,
        processing_status: processing?.status || null,
        processing_stage: processing?.stage || null,
        report_status: report?.status || null,
        report_id: report?.id || null,
        risk_level: riskLevel,
        risk_score: typeof riskScore === 'number' ? riskScore : null,
        result_computed_at: resultComputedAt,
        triage_status: triageStatus,
        flagged_reason: flaggedReason,
      }
    })

    const missingJoins =
      joinFailed || patientProfiles.length === 0 || (funnelIds.length > 0 && funnels.length === 0)

    if (missingJoins) {
      return { kind: 'JOIN_RLS_BLOCKING', data: triageData }
    }

    return { kind: 'OK', data: triageData }
  }, [])

  const handleDiagnosis = useCallback((result: TriageDiagnosisResult) => {
    setDiagnosis(result)
    switch (result.kind) {
      case 'NO_SESSION':
        setError('Bitte einloggen')
        setAssessments([])
        setHealthAssessmentsTotal(null)
        break
      case 'QUERY_ERROR':
        setError(`Datenabfrage fehlgeschlagen: ${result.message}`)
        setAssessments([])
        setHealthAssessmentsTotal(null)
        break
      case 'JOIN_BLOCKED':
        setError('Zugriff auf Patient/Funnel-Daten blockiert (RLS auf patient_profiles/funnels prüfen)')
        setAssessments([])
        setHealthAssessmentsTotal(null)
        break
      case 'JOIN_RLS_BLOCKING':
        setError('Teilweise Daten sichtbar (RLS blockt patient_profiles/funnels)')
        setAssessments(result.data)
        setHealthAssessmentsTotal(null)
        break
      case 'NO_ROWS_VISIBLE':
        setError('Keine Assessments sichtbar (RLS oder falsches Supabase-Projekt)')
        setAssessments([])
        setHealthAssessmentsTotal(null)
        break
      case 'OK':
        setError(null)
        setAssessments(result.data)
        setHealthAssessmentsTotal(null)
        break
    }

    if (result.kind !== 'OK') {
      console.warn('[triage-diagnose]', {
        kind: result.kind,
        supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL ?? null,
        userId,
      })
    }
  }, [userId])

  useEffect(() => {
    let isMounted = true

    const run = async () => {
      setLoading(true)
      try {
        const result = await loadTriageData()
        if (!isMounted) return
        handleDiagnosis(result)
      } catch (e) {
        if (!isMounted) return
        console.error(e)
        setError('Fehler beim Laden der Triage-Daten.')
        setAssessments([])
        setDiagnosis(null)
      } finally {
        if (isMounted) setLoading(false)
      }
    }

    run()

    return () => {
      isMounted = false
    }
  }, [loadTriageData, handleDiagnosis, retryTrigger])

  useEffect(() => {
    if (diagnosis?.kind !== 'NO_ROWS_VISIBLE') return

    let isMounted = true

    const loadHealth = async () => {
      try {
        const response = await fetch('/api/triage/health')
        if (!response.ok) return

        const payload = await response.json()
        const assessmentsTotal =
          typeof payload.assessmentsTotal === 'number' ? payload.assessmentsTotal : null

        if (!isMounted) return

        setHealthAssessmentsTotal(assessmentsTotal)

        if (assessmentsTotal === 0) {
          setError('Keine Daten in diesem Supabase-Projekt (0 Assessments laut Server).')
          console.warn('[triage-diagnose]', {
            kind: 'NO_DATA_IN_PROJECT',
            supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL ?? null,
            assessmentsTotal,
            userId,
          })
        } else if (typeof assessmentsTotal === 'number') {
          setError(
            `RLS blockt (Server sieht Daten, Client nicht). Server count = ${assessmentsTotal}`,
          )
          console.warn('[triage-diagnose]', {
            kind: 'RLS_BLOCKING',
            supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL ?? null,
            assessmentsTotal,
            userId,
          })
        }
      } catch (err) {
        console.warn('[triage-diagnose]', {
          kind: 'HEALTHCHECK_FAILED',
          supabaseUrl: env.NEXT_PUBLIC_SUPABASE_URL ?? null,
          userId,
        })
      }
    }

    loadHealth()

    return () => {
      isMounted = false
    }
  }, [diagnosis, userId])

  // Retry handler that triggers data reload without full page refresh
  const handleRetry = useCallback(() => {
    setRetryTrigger((prev) => prev + 1)
  }, [])

  // Calculate statistics
  const stats = useMemo(() => {
    const incomplete = assessments.filter((a) => a.triage_status === 'incomplete').length
    const processing = assessments.filter((a) => a.triage_status === 'processing').length
    const reportReady = assessments.filter((a) => a.triage_status === 'report_ready').length
    const flagged = assessments.filter((a) => a.triage_status === 'flagged').length

    return { incomplete, processing, reportReady, flagged, total: assessments.length }
  }, [assessments])

  const getTriageStatusBadge = useCallback((status: TriageStatus) => {
    switch (status) {
      case 'incomplete':
        return { variant: 'secondary' as const, label: 'Unvollständig', icon: Clock }
      case 'processing':
        return { variant: 'info' as const, label: 'In Bearbeitung', icon: Loader }
      case 'report_ready':
        return { variant: 'success' as const, label: 'Bericht bereit', icon: FileCheck }
      case 'flagged':
        return { variant: 'danger' as const, label: 'Markiert', icon: AlertTriangle }
    }
  }, [])

  const formatDateTime = useCallback((isoString: string | null): string => {
    if (!isoString) return '—'
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
  }, [])

  const handleRowClick = useCallback(
    (assessment: AssessmentTriage) => {
      router.push(`/clinician/patient/${assessment.patient_id}`)
    },
    [router]
  )

  // Define table columns
  const columns: TableColumn<AssessmentTriage>[] = useMemo(
    () => [
      {
        header: 'Patient:in',
        accessor: (row) => (
          <span className="font-medium text-slate-900 dark:text-slate-50">
            {row.patient_name}
          </span>
        ),
        sortable: true,
      },
      {
        header: 'Funnel',
        accessor: (row) => (
          <span className="text-slate-700 dark:text-slate-300">
            {row.funnel_title || row.funnel_slug}
          </span>
        ),
        sortable: true,
      },
      {
        header: 'Status',
        accessor: (row) => {
          const badge = getTriageStatusBadge(row.triage_status)
          return (
            <div className="flex flex-col gap-1">
              <Badge variant={badge.variant}>{badge.label}</Badge>
              {row.flagged_reason && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  {row.flagged_reason}
                </span>
              )}
            </div>
          )
        },
        sortable: true,
      },
      {
        header: 'Result',
        accessor: (row) => (
          <div className="flex flex-col gap-1 text-xs text-slate-600 dark:text-slate-300">
            <span>
              {row.risk_level ? `Risk: ${row.risk_level}` : 'Risk: —'}
            </span>
            <span>
              {typeof row.risk_score === 'number' ? `Score: ${Math.round(row.risk_score)}` : 'Score: —'}
            </span>
          </div>
        ),
      },
      {
        header: 'Gestartet',
        accessor: (row) => (
          <span className="text-slate-700 dark:text-slate-300 whitespace-nowrap">
            {formatDateTime(row.started_at)}
          </span>
        ),
        sortable: true,
      },
      {
        header: 'Abgeschlossen',
        accessor: (row) => (
          <span className="text-slate-700 dark:text-slate-300 whitespace-nowrap">
            {formatDateTime(row.completed_at)}
          </span>
        ),
        sortable: true,
      },
    ],
    [getTriageStatusBadge, formatDateTime]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" text="Triage-Übersicht wird geladen…" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <ErrorState
          title="Fehler beim Laden"
          message={error}
          onRetry={handleRetry}
          retryText="Neu laden"
        />
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
          Triage / Übersicht
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Aktive Patienten und Funnels mit aktuellem Bearbeitungsstatus
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Incomplete Assessments */}
        <Card
          padding="lg"
          shadow="md"
          radius="lg"
          className="hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Unvollständig
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">
                {stats.incomplete}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Noch in Bearbeitung
              </p>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <Clock className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
          </div>
        </Card>

        {/* Processing */}
        <Card
          padding="lg"
          shadow="md"
          radius="lg"
          className="hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                In Bearbeitung
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">
                {stats.processing}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Bericht wird erstellt</p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Loader className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        {/* Report Ready */}
        <Card
          padding="lg"
          shadow="md"
          radius="lg"
          className="hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Bericht bereit
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">
                {stats.reportReady}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bereit zur Einsicht
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <FileCheck className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        {/* Flagged */}
        <Card
          padding="lg"
          shadow="md"
          radius="lg"
          className="hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Markiert
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">
                {stats.flagged}
              </p>
              {stats.flagged > 0 && (
                <Badge variant="danger" size="sm" className="mt-1">
                  Aufmerksamkeit erforderlich
                </Badge>
              )}
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Assessments Table */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              Alle Assessments
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {stats.total} aktive Assessments insgesamt
            </p>
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        data={assessments}
        keyExtractor={(row) => row.assessment_id}
        hoverable
        bordered
        onRowClick={handleRowClick}
        emptyMessage="Noch keine Assessments vorhanden"
      />
    </div>
  )
}
