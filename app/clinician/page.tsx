'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { getRiskLabelShort, type RiskLevel } from '@/lib/utils/riskBadge'

type ReportRow = {
  id: string
  created_at: string
  score_numeric: number
  risk_level: 'low' | 'moderate' | 'high' | null
  assessment_id: string
  assessments: {
    id: string
    patient_id: string
    patient_profiles: {
      id: string
      full_name: string | null
      user_id: string
    }[]
  }[]
}

export default function ClinicianOverviewPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [reports, setReports] = useState<ReportRow[]>([])

  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('reports')
          .select(
            `
            id,
            created_at,
            score_numeric,
            risk_level,
            assessment_id,
            assessments (
              id,
              patient_id,
              patient_profiles (
                id,
                full_name,
                user_id
              )
            )
          `
          )
          .order('created_at', { ascending: false })

        if (error) throw error
        setReports((data ?? []) as unknown as ReportRow[])
      } catch (e: any) {
        console.error(e)
        setError(e.message ?? 'Fehler beim Laden der Reports.')
      } finally {
        setLoading(false)
      }
    }

    loadReports()
  }, [])

  if (loading) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <p>Reports werden geladen…</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center">
        <div className="max-w-md text-center">
          <p className="text-red-500 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded bg-black text-white text-sm"
          >
            Neu laden
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-2">Clinician View</h1>
      <p className="text-gray-600 mb-6">
        Interne Übersicht über die zuletzt durchgeführten Stress-&-Resilienz-Assessments.
      </p>

      {reports.length === 0 ? (
        <p className="text-gray-500">Noch keine Ergebnisse vorhanden.</p>
      ) : (
        <div className="overflow-x-auto border rounded-xl">
          <table className="w-full text-sm">
            <thead className="bg-slate-100">
              <tr>
                <th className="text-left px-4 py-2 border-b">Datum</th>
                <th className="text-left px-4 py-2 border-b">Patient</th>
                <th className="text-left px-4 py-2 border-b">Score</th>
                <th className="text-left px-4 py-2 border-b">Level</th>
                <th className="text-center px-4 py-2 border-b">Details</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => {
                const patientProfile = (r.assessments as any)?.patient_profiles
                const patientName =
                  patientProfile?.full_name ??
                  patientProfile?.user_id ??
                  'Unbekannt'
                const date = new Date(r.created_at).toLocaleString()

                return (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="px-4 py-2 border-b whitespace-nowrap">
                      {date}
                    </td>
                    <td className="px-4 py-2 border-b">{patientName}</td>
                    <td className="px-4 py-2 border-b">{r.score_numeric}</td>
                    <td className="px-4 py-2 border-b">{getRiskLabelShort(r.risk_level as RiskLevel)}</td>
                    <td className="px-4 py-2 border-b text-center">
                      <Link
                        href={`/clinician/report/${r.id}`}
                        className="text-sky-600 underline"
                      >
                        ansehen
                      </Link>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </main>
  )
}
