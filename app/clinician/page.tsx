'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { Button, Badge, Card } from '@/lib/ui'

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
  const [sortField, setSortField] = useState<SortField>('risk')
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

  const getRiskBadgeVariant = (risk: RiskLevel): 'danger' | 'warning' | 'success' | 'secondary' | 'default' => {
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

  const handlePatientClick = (patientId: string) => {
    router.push(`/clinician/patient/${patientId}`)
  }

  // Calculate dashboard statistics (must run on every render to keep hook order stable)
  const stats = useMemo(() => {
    const totalPatients = patientOverviews.length
    const highRiskCount = patientOverviews.filter(p => p.latest_risk_level === 'high').length
    const moderateRiskCount = patientOverviews.filter(p => p.latest_risk_level === 'moderate').length
    const totalMeasurements = measures.length
    const now = new Date()
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    const recentCount = measures.filter(m => new Date(m.created_at) > oneDayAgo).length

    return {
      totalPatients,
      highRiskCount,
      moderateRiskCount,
      totalMeasurements,
      recentCount,
    }
  }, [patientOverviews, measures])

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return (
        <svg
          className="w-4 h-4 text-slate-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
          />
        </svg>
      )
    }
    return sortDirection === 'asc' ? (
      <svg
        className="w-4 h-4 text-sky-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 15l7-7 7 7"
        />
      </svg>
    ) : (
      <svg
        className="w-4 h-4 text-sky-600"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M19 9l-7 7-7-7"
        />
      </svg>
    )
  }

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p className="text-slate-600">Patientenübersicht wird geladen…</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Neu laden
          </Button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <div className="mb-6 lg:mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-900 mb-2">Dashboard</h1>
        <p className="text-sm sm:text-base text-slate-600">
          Übersicht aller Pilotpatient:innen mit ihrer jeweils letzten Messung.
        </p>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
        <Card padding="lg" shadow="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Aktive Patient:innen</p>
              <p className="text-3xl font-bold text-slate-900">{stats.totalPatients}</p>
            </div>
            <div className="p-3 bg-sky-100 rounded-lg">
              <svg className="w-6 h-6 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card padding="lg" shadow="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Messungen (24h)</p>
              <p className="text-3xl font-bold text-slate-900">{stats.recentCount}</p>
              {stats.recentCount > 0 && (
                <Badge variant="info" size="sm" className="mt-2">Heute</Badge>
              )}
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>
        </Card>

        <Card padding="lg" shadow="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Erhöhtes Risiko</p>
              <p className="text-3xl font-bold text-slate-900">{stats.moderateRiskCount}</p>
              {stats.moderateRiskCount > 0 && (
                <Badge variant="warning" size="sm" className="mt-2">Achtung</Badge>
              )}
            </div>
            <div className="p-3 bg-amber-100 rounded-lg">
              <svg className="w-6 h-6 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
          </div>
        </Card>

        <Card padding="lg" shadow="md">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-sm text-slate-500 mb-1">Hohes Risiko</p>
              <p className="text-3xl font-bold text-slate-900">{stats.highRiskCount}</p>
              {stats.highRiskCount > 0 && (
                <Badge variant="danger" size="sm" className="mt-2">Dringend</Badge>
              )}
            </div>
            <div className="p-3 bg-red-100 rounded-lg">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </Card>
      </div>

      {/* Patient Table */}
      <Card padding="none" shadow="md">
        {sortedPatients.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="mx-auto max-w-md">
              <p className="text-4xl mb-4" aria-label="Kein Inhalt Symbol">
                📋
              </p>
              <h2 className="text-lg font-semibold text-slate-900">
                Noch keine Messungen vorhanden
              </h2>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">
                Es wurden bisher noch keine Patientenmessungen erfasst. Sobald
                Patient:innen ihre ersten Assessments durchführen, werden sie hier
                angezeigt.
              </p>
            </div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm md:text-base">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th
                  className="text-left px-4 md:px-6 py-4 md:py-5 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition touch-manipulation"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center gap-2">
                    <span>Patient:in</span>
                    <SortIcon field="name" />
                  </div>
                </th>
                <th
                  className="text-left px-4 md:px-6 py-4 md:py-5 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition touch-manipulation"
                  onClick={() => handleSort('score')}
                >
                  <div className="flex items-center gap-2">
                    <span>StressScore</span>
                    <SortIcon field="score" />
                  </div>
                </th>
                <th
                  className="text-left px-4 md:px-6 py-4 md:py-5 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition touch-manipulation"
                  onClick={() => handleSort('risk')}
                >
                  <div className="flex items-center gap-2">
                    <span>RiskLevel</span>
                    <SortIcon field="risk" />
                  </div>
                </th>
                <th
                  className="text-left px-4 md:px-6 py-4 md:py-5 font-semibold text-slate-700 cursor-pointer hover:bg-slate-100 transition touch-manipulation"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center gap-2">
                    <span>Letzte Messung</span>
                    <SortIcon field="date" />
                  </div>
                </th>
                <th className="text-left px-4 md:px-6 py-4 md:py-5 font-semibold text-slate-700">
                  Messungen
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedPatients.map((patient, index) => (
                <tr
                  key={patient.patient_id}
                  className={`hover:bg-slate-50 transition cursor-pointer touch-manipulation ${
                    index !== sortedPatients.length - 1 ? 'border-b border-slate-100' : ''
                  }`}
                  onClick={() => handlePatientClick(patient.patient_id)}
                >
                  <td className="px-4 md:px-6 py-4 md:py-5">
                    <span className="font-medium text-slate-900">
                      {patient.patient_name}
                    </span>
                  </td>
                  <td className="px-4 md:px-6 py-4 md:py-5">
                    {patient.latest_stress_score !== null ? (
                      <span className="text-slate-900 font-semibold">
                        {Math.round(patient.latest_stress_score)}
                      </span>
                    ) : (
                      <span className="text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-4 md:px-6 py-4 md:py-5">
                    <Badge variant={getRiskBadgeVariant(patient.latest_risk_level)}>
                      {getRiskLabel(patient.latest_risk_level)}
                    </Badge>
                  </td>
                  <td className="px-4 md:px-6 py-4 md:py-5 text-slate-700 whitespace-nowrap">
                    {formatDateTime(patient.latest_measurement_time)}
                  </td>
                  <td className="px-4 md:px-6 py-4 md:py-5 text-slate-600">
                    {patient.measurement_count}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        )}
      </Card>
    </main>
  )
}
