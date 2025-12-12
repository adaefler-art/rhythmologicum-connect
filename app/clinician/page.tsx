'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Badge, Card, Table } from '@/lib/ui'
import type { TableColumn } from '@/lib/ui/Table'
import { Users, ClipboardList, FileCheck, AlertTriangle } from 'lucide-react'

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

type SortField = 'name' | 'risk' | 'date' | 'score'
type SortDirection = 'asc' | 'desc'

export default function ClinicianOverviewPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [measures, setMeasures] = useState<PatientMeasure[]>([])
  const [sortField, setSortField] = useState<SortField>('date')
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc')

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

  // Sort the patient overviews
  const sortedPatients = useMemo(() => {
    const sorted = [...patientOverviews]

    const riskOrder: Record<string, number> = {
      high: 3,
      moderate: 2,
      low: 1,
      pending: 0,
    }

    sorted.sort((a, b) => {
      let comparison = 0

      switch (sortField) {
        case 'name':
          comparison = a.patient_name.localeCompare(b.patient_name)
          break
        case 'risk': {
          const aRisk = riskOrder[a.latest_risk_level ?? ''] ?? -1
          const bRisk = riskOrder[b.latest_risk_level ?? ''] ?? -1
          comparison = aRisk - bRisk
          break
        }
        case 'date':
          comparison =
            new Date(a.latest_measurement_time).getTime() -
            new Date(b.latest_measurement_time).getTime()
          break
        case 'score':
          comparison = (a.latest_stress_score ?? 0) - (b.latest_stress_score ?? 0)
          break
      }

      return sortDirection === 'asc' ? comparison : -comparison
    })

    return sorted
  }, [patientOverviews, sortField, sortDirection])

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection(field === 'risk' ? 'desc' : 'asc')
    }
  }

  const getRiskLabel = (risk: RiskLevel): string => {
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

  const getRiskBadgeVariant = (
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
  }

  const formatDateTime = (isoString: string): string => {
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

  const handleRowClick = (patient: PatientOverview) => {
    router.push(`/clinician/patient/${patient.patient_id}`)
  }

  // Calculate dashboard statistics (must run on every render to keep hook order stable)
  const stats = useMemo(() => {
    const totalPatients = patientOverviews.length
    const highRiskCount = patientOverviews.filter((p) => p.latest_risk_level === 'high').length
    const moderateRiskCount = patientOverviews.filter(
      (p) => p.latest_risk_level === 'moderate'
    ).length
    const totalMeasurements = measures.length
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const recentCount = measures.filter((m) => new Date(m.created_at) > oneDayAgo).length

    return {
      totalPatients,
      highRiskCount,
      moderateRiskCount,
      totalMeasurements,
      recentCount,
    }
  }, [patientOverviews, measures])

  // Define table columns
  const columns: TableColumn<PatientOverview>[] = [
    {
      header: 'Patient:in',
      accessor: (row) => <span className="font-medium text-slate-900">{row.patient_name}</span>,
      sortable: true,
    },
    {
      header: 'StressScore',
      accessor: (row) =>
        row.latest_stress_score !== null ? (
          <span className="text-slate-900 font-semibold">
            {Math.round(row.latest_stress_score)}
          </span>
        ) : (
          <span className="text-slate-400">—</span>
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
        <span className="text-slate-700 whitespace-nowrap">
          {formatDateTime(row.latest_measurement_time)}
        </span>
      ),
      sortable: true,
    },
    {
      header: 'Messungen',
      accessor: (row) => <span className="text-slate-600">{row.measurement_count}</span>,
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-600">Patientenübersicht wird geladen…</p>
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
    <>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-slate-600">
          Übersicht aller Patientinnen und Patienten mit aktuellen Assessments
        </p>
      </div>

        {/* KPI Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Active Patients */}
          <Card padding="lg" shadow="md" radius="lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Active Patients</p>
                <p className="text-3xl font-bold text-slate-900">{stats.totalPatients}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
            </div>
          </Card>

          {/* Open Funnels */}
          <Card padding="lg" shadow="md" radius="lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Open Funnels</p>
                <p className="text-3xl font-bold text-slate-900">{stats.totalMeasurements}</p>
                {stats.moderateRiskCount > 0 && (
                  <Badge variant="warning" size="sm" className="mt-2">
                    {stats.moderateRiskCount} pending
                  </Badge>
                )}
              </div>
              <div className="p-3 bg-teal-100 rounded-lg">
                <ClipboardList className="w-5 h-5 text-teal-700" />
              </div>
            </div>
          </Card>

          {/* Recent Assessments */}
          <Card padding="lg" shadow="md" radius="lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Recent Assessments</p>
                <p className="text-3xl font-bold text-slate-900">{stats.recentCount}</p>
                {stats.recentCount > 0 && (
                  <Badge variant="info" size="sm" className="mt-2">
                    Today
                  </Badge>
                )}
              </div>
              <div className="p-3 bg-purple-100 rounded-lg">
                <FileCheck className="w-5 h-5 text-purple-600" />
              </div>
            </div>
          </Card>

          {/* Red Flags */}
          <Card padding="lg" shadow="md" radius="lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-slate-500 mb-1">Red Flags (24h)</p>
                <p className="text-3xl font-bold text-slate-900">{stats.highRiskCount}</p>
                {stats.highRiskCount > 0 && (
                  <Badge variant="danger" size="sm" className="mt-2">
                    Urgent
                  </Badge>
                )}
              </div>
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Recent Assessments Table */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-slate-900">Recent Assessments</h2>
        </div>

      <Table
        columns={columns}
        data={sortedPatients}
        keyExtractor={(row) => row.patient_id}
        hoverable
        bordered
        onRowClick={handleRowClick}
        emptyMessage="Noch keine Assessments vorhanden"
        loading={loading}
      />
    </>
  )
}
