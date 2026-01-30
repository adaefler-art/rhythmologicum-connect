'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, Button } from '@/lib/ui/mobile-v2'
import Link from 'next/link'

type LatestResult = {
  id: string
  funnelSlug: string | null
  funnelName: string
  completedAt: string | null
  result: {
    scores: Record<string, unknown>
    riskModels?: Record<string, unknown> | null
    computedAt: string
  }
} | null

export default function ProfileClient() {
  const [latestResult, setLatestResult] = useState<LatestResult>(null)
  const [loadingResult, setLoadingResult] = useState(true)

  useEffect(() => {
    let active = true
    const loadLatestResult = async () => {
      try {
        setLoadingResult(true)
        const res = await fetch('/api/patient/assessments-with-results?limit=1')
        if (!res.ok) return
        const json = await res.json()
        const first = (json?.data?.assessments || [])[0] || null
        if (active) {
          setLatestResult(first)
        }
      } catch {
        if (active) setLatestResult(null)
      } finally {
        if (active) setLoadingResult(false)
      }
    }

    loadLatestResult()
    return () => {
      active = false
    }
  }, [])
  const handleSignOut = async () => {
    await supabase.auth.signOut()
    try {
      await fetch('/api/auth/signout', { method: 'POST', credentials: 'include' })
    } catch {
      // Ignore network errors; client session is already cleared
    }
    window.location.assign('/')
  }

  return (
    <div className="w-full px-4 py-8">
      <Card padding="lg" shadow="sm">
        <div className="space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-[#1f2937]">Mein Profil</h1>
            <p className="text-sm text-[#6b7280]">
              Verwalten Sie hier Ihre persönlichen Daten und Einstellungen.
            </p>
          </div>

          <div className="rounded-xl border border-sky-200 bg-sky-50 p-4">
            <p className="text-sm text-sky-900">
              ⚙️ In Entwicklung: Profilbearbeitung und Einstellungen
            </p>
          </div>

          <Card padding="md" shadow="sm" className="border border-slate-100">
            <div className="space-y-2">
              <h2 className="text-base font-semibold text-slate-800">Letztes Ergebnis</h2>
              {loadingResult && (
                <p className="text-sm text-slate-500">Lade Ergebnis…</p>
              )}
              {!loadingResult && !latestResult && (
                <p className="text-sm text-slate-500">Noch kein Ergebnis verfügbar.</p>
              )}
              {latestResult && (
                <div className="space-y-2 text-sm text-slate-700">
                  <div className="flex items-center justify-between">
                    <span>{latestResult.funnelName}</span>
                    <span className="text-xs text-slate-500">
                      {latestResult.completedAt
                        ? new Date(latestResult.completedAt).toLocaleDateString()
                        : '—'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Risiko-Level</span>
                    <span className="font-semibold">
                      {String(
                        (latestResult.result?.riskModels as { riskLevel?: string })?.riskLevel ?? '—',
                      )}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Risiko-Score</span>
                    <span className="font-semibold">
                      {String(
                        (latestResult.result?.scores as { riskScore?: number })?.riskScore ?? '—',
                      )}
                    </span>
                  </div>
                  {latestResult.funnelSlug && (
                    <Link
                      className="inline-flex items-center text-sm font-medium text-sky-700 hover:text-sky-900"
                      href={`/patient/results-v2?assessmentId=${latestResult.id}&funnel=${latestResult.funnelSlug}`}
                    >
                      Details anzeigen
                    </Link>
                  )}
                </div>
              )}
            </div>
          </Card>

          <Button variant="secondary" size="md" fullWidth onClick={handleSignOut}>
            Abmelden
          </Button>
        </div>
      </Card>
    </div>
  )
}
