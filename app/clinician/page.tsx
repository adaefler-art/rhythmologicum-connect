'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Badge, Button, Card, Table } from '@/lib/ui'
import type { TableColumn } from '@/lib/ui/Table'
import {
  Users,
  ClipboardList,
  FileCheck,
  AlertTriangle,
  Download,
  Settings,
} from 'lucide-react'

type RiskLevel = 'low' | 'moderate' | 'high' | 'pending' | null

type PatientMeasure = {
  id: string
  patient_id: string
  created_at: string
  stress_score: number | null
  risk_level: RiskLevel
  report_id: string | null
  patient_profiles: {
    id: string
    full_name: string | null
    user_id: string
  } | null
}

type PatientOverview = {
  patient_id: string
  patient_name: string
  latest_stress_score: number | null
  latest_risk_level: RiskLevel
  latest_measurement_time: string
  measurement_count: number
  report_id: string | null
}

export default function ClinicianOverviewPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [measures, setMeasures] = useState<PatientMeasure[]>([])

  useEffect(() => {
    const loadPatientData = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('patient_measures')
          .select(
            `
            id,
            patient_id,
            created_at,
            stress_score,
            risk_level,
            report_id,
            patient_profiles!fk_patient_measures_patient (
              id,
              full_name,
              user_id
            )
          `
          )
          .order('created_at', { ascending: false })

        if (error) throw error
        setMeasures((data ?? []) as unknown as PatientMeasure[])
      } catch (e: unknown) {
        console.error(e)
        const errorMessage = e instanceof Error ? e.message : 'Fehler beim Laden der Patientendaten.'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadPatientData()
  }, [])

  // Group measures by patient and get the latest for each
  const patientOverviews = useMemo<PatientOverview[]>(() => {
    const patientMap = new Map<string, PatientMeasure[]>()
    
    // Group by patient_id
    measures.forEach((measure) => {
      if (!patientMap.has(measure.patient_id)) {
        patientMap.set(measure.patient_id, [])
      }
      patientMap.get(measure.patient_id)!.push(measure)
    })

    // Create overview for each patient
    const overviews: PatientOverview[] = []
    patientMap.forEach((patientMeasures, patientId) => {
      // Measures are already sorted by created_at desc from the query
      const latestMeasure = patientMeasures[0]
      
      overviews.push({
        patient_id: patientId,
        patient_name:
          latestMeasure.patient_profiles?.full_name ??
          latestMeasure.patient_profiles?.user_id ??
          'Unbekannt',
        latest_stress_score: latestMeasure.stress_score,
        latest_risk_level: latestMeasure.risk_level,
        latest_measurement_time: latestMeasure.created_at,
        measurement_count: patientMeasures.length,
        report_id: latestMeasure.report_id,
      })
    })

    return overviews
  }, [measures])

  // Helper functions wrapped in useCallback for stable references
  const getRiskLabel = useCallback((risk: RiskLevel): string => {
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
  }, [])

  const getRiskBadgeVariant = useCallback((
    risk: RiskLevel
  ): 'danger' | 'warning' | 'success' | 'secondary' | 'default' => {
    switch (risk) {
      case 'high':
        return 'danger'
      case 'moderate':
        return 'warning'
      case 'low':
        return 'success'
      case 'pending':
        return 'secondary'
      default:
        return 'default'
    }
  }, [])

  const formatDateTime = useCallback((isoString: string): string => {
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

  const handleRowClick = useCallback((patient: PatientOverview) => {
    router.push(`/clinician/patient/${patient.patient_id}`)
  }, [router])

  // Calculate dashboard statistics (must run on every render to keep hook order stable)
  const stats = useMemo(() => {
    const totalPatients = patientOverviews.length
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    
    // High risk in last 24h
    const highRiskCount24h = measures.filter(
      (m) => m.risk_level === 'high' && new Date(m.created_at) > oneDayAgo
    ).length
    
    const moderateRiskCount = patientOverviews.filter(
      (p) => p.latest_risk_level === 'moderate'
    ).length
    
    const totalMeasurements = measures.length
    const recentCount = measures.filter((m) => new Date(m.created_at) > oneDayAgo).length
    
    // Count of unique patients with assessments (active funnels)
    const openFunnelsCount = new Set(measures.map((m) => m.patient_id)).size

    return {
      totalPatients,
      highRiskCount24h,
      moderateRiskCount,
      totalMeasurements,
      recentCount,
      openFunnelsCount,
    }
  }, [patientOverviews, measures])

  // Sort patients by date (newest first)
  const sortedPatients = useMemo(() => {
    return [...patientOverviews].sort((a, b) => {
      return new Date(b.latest_measurement_time).getTime() - new Date(a.latest_measurement_time).getTime()
    })
  }, [patientOverviews])

  // Define table columns (memoized for performance)
  const columns: TableColumn<PatientOverview>[] = useMemo(
    () => [
      {
        header: 'Patient:in',
        accessor: (row) => <span className="font-medium text-slate-900 dark:text-slate-50">{row.patient_name}</span>,
        sortable: true,
      },
      {
        header: 'StressScore',
        accessor: (row) =>
          row.latest_stress_score !== null ? (
            <span className="text-slate-900 dark:text-slate-50 font-semibold">
              {Math.round(row.latest_stress_score)}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">—</span>
          ),
        sortable: true,
      },
      {
        header: 'RiskLevel',
        accessor: (row) => (
          <Badge variant={getRiskBadgeVariant(row.latest_risk_level)}>
            {getRiskLabel(row.latest_risk_level)}
          </Badge>
        ),
        sortable: true,
      },
      {
        header: 'Letzte Messung',
        accessor: (row) => (
          <span className="text-slate-700 dark:text-slate-300 whitespace-nowrap">
            {formatDateTime(row.latest_measurement_time)}
          </span>
        ),
        sortable: true,
      },
      {
        header: 'Messungen',
        accessor: (row) => <span className="text-slate-600 dark:text-slate-300">{row.measurement_count}</span>,
      },
    ],
    [getRiskBadgeVariant, getRiskLabel, formatDateTime]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-600 dark:text-slate-300">Patientenübersicht wird geladen…</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="max-w-md text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition"
          >
            Neu laden
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Page Header with Actions */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">Dashboard</h1>
          <p className="text-slate-600 dark:text-slate-300">
            Übersicht aller Patientinnen und Patienten mit aktuellen Assessments
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="secondary"
            size="md"
            icon={<Settings className="w-4 h-4" />}
            onClick={() => router.push('/clinician/funnels')}
          >
            Funnels verwalten
          </Button>
          <Button
            variant="secondary"
            size="md"
            icon={<Download className="w-4 h-4" />}
            onClick={() => window.print()}
          >
            Exportieren
          </Button>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Patients */}
          <Card padding="lg" shadow="md" radius="lg" className="hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Aktive Patienten</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">{stats.totalPatients}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">Patienten mit Assessments</p>
              </div>
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <Users className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </Card>

          {/* Open Funnels */}
          <Card padding="lg" shadow="md" radius="lg" className="hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Offene Funnels</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">{stats.openFunnelsCount}</p>
                {stats.moderateRiskCount > 0 && (
                  <Badge variant="warning" size="sm" className="mt-1">
                    {stats.moderateRiskCount} pending
                  </Badge>
                )}
              </div>
              <div className="p-3 bg-teal-100 dark:bg-teal-900/30 rounded-lg">
                <ClipboardList className="w-5 h-5 text-teal-700 dark:text-teal-400" />
              </div>
            </div>
          </Card>

          {/* Recent Assessments */}
          <Card padding="lg" shadow="md" radius="lg" className="hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Aktuelle Assessments</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">{stats.recentCount}</p>
                {stats.recentCount > 0 && (
                  <Badge variant="info" size="sm" className="mt-1">
                    Today
                  </Badge>
                )}
              </div>
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <FileCheck className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </Card>

          {/* Red Flags */}
          <Card padding="lg" shadow="md" radius="lg" className="hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">Rote Flaggen (24h)</p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">{stats.highRiskCount24h}</p>
                {stats.highRiskCount24h > 0 && (
                  <Badge variant="danger" size="sm" className="mt-1">
                    Urgent
                  </Badge>
                )}
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Assessments Table */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">Recent Assessments</h2>
              <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
                Aktuelle Messungen und Risikobewertungen
              </p>
            </div>
          </div>
        </div>

      <Table
        columns={columns}
        data={sortedPatients}
        keyExtractor={(row) => row.patient_id}
        hoverable
        bordered
        onRowClick={handleRowClick}
        emptyMessage="Noch keine Assessments vorhanden"
      />
    </div>
  )
}
