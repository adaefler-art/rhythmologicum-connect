'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MobileHeader from '@/app/components/MobileHeader'
import { Card, LoadingSpinner, ErrorState } from '@/lib/ui'
import { typography } from '@/lib/design-tokens'

type Assessment = {
  id: string
  funnel: string
  funnel_id: string | null
  started_at: string
  completed_at: string | null
}

/**
 * Patient Dashboard Client Component (E6.4.2)
 * 
 * Displays next steps for patient:
 * - Continue in-progress assessments (AC3)
 * - Start new assessments if none in progress (AC3)
 * - Access to funnel catalog
 */
export default function DashboardClient() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [inProgressAssessment, setInProgressAssessment] = useState<Assessment | null>(null)

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Check for in-progress assessments
        const response = await fetch('/api/assessments/in-progress')
        
        if (!response.ok) {
          if (response.status === 404) {
            // No in-progress assessments - this is fine
            setInProgressAssessment(null)
          } else {
            throw new Error('Failed to load dashboard data')
          }
        } else {
          const data = await response.json()
          if (data.success && data.data) {
            setInProgressAssessment(data.data)
          }
        }
      } catch (err) {
        console.error('[dashboard] Error loading data:', err)
        setError('Dashboard konnte nicht geladen werden.')
      } finally {
        setLoading(false)
      }
    }

    loadDashboardData()
  }, [])

  const handleContinueAssessment = () => {
    if (inProgressAssessment) {
      router.push(`/patient/funnel/${inProgressAssessment.funnel}`)
    }
  }

  const handleStartAssessment = () => {
    router.push('/patient/funnels')
  }

  const handleViewHistory = () => {
    router.push('/patient/history')
  }

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-sky-50 via-slate-50 to-slate-100 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950 transition-colors duration-150">
      <MobileHeader
        variant="with-title"
        title="Dashboard"
        subtitle="Rhythmologicum Connect"
        showBack={false}
      />

      <main
        className="flex-1 overflow-y-auto px-4 pt-4 sm:pt-6"
        style={{ paddingBottom: 'calc(6rem + env(safe-area-inset-bottom))' }}
      >
        <div className="w-full max-w-4xl mx-auto space-y-6">
          <div className="space-y-2">
            <h1
              className="font-bold leading-tight text-slate-900 dark:text-slate-100"
              style={{
                fontSize: typography.fontSize['2xl'],
                lineHeight: typography.lineHeight.tight,
              }}
            >
              Willkommen zurück
            </h1>
            <p className="text-slate-600 dark:text-slate-400">
              Ihr persönliches Gesundheits-Dashboard
            </p>
          </div>

          {loading && <LoadingSpinner size="lg" centered />}

          {error && <ErrorState message={error} />}

          {!loading && !error && (
            <div className="space-y-4">
              {/* Next Step Card - E6.4.2 AC3 */}
              <Card padding="lg" radius="lg">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-sky-100 dark:bg-sky-900/30 flex items-center justify-center">
                      <span className="text-2xl">🎯</span>
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        Nächster Schritt
                      </h2>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {inProgressAssessment
                          ? 'Setzen Sie Ihr Assessment fort'
                          : 'Starten Sie Ihr erstes Assessment'}
                      </p>
                    </div>
                  </div>

                  {inProgressAssessment ? (
                    <div className="space-y-3">
                      <div className="p-4 bg-sky-50 dark:bg-sky-900/20 rounded-lg border border-sky-200 dark:border-sky-800">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-sky-900 dark:text-sky-100">
                            {inProgressAssessment.funnel}
                          </span>
                          <span className="text-xs text-sky-700 dark:text-sky-300">
                            In Bearbeitung
                          </span>
                        </div>
                        <p className="text-xs text-sky-700 dark:text-sky-300">
                          Gestartet am{' '}
                          {new Date(inProgressAssessment.started_at).toLocaleDateString('de-DE')}
                        </p>
                      </div>
                      <button
                        onClick={handleContinueAssessment}
                        className="w-full px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg transition-colors duration-200"
                      >
                        Assessment fortsetzen
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handleStartAssessment}
                      className="w-full px-6 py-3 bg-sky-600 hover:bg-sky-700 text-white font-medium rounded-lg transition-colors duration-200"
                    >
                      Neues Assessment starten
                    </button>
                  )}
                </div>
              </Card>

              {/* Quick Actions */}
              <div className="grid gap-4 sm:grid-cols-2">
                <Card padding="md" radius="lg" interactive onClick={handleStartAssessment}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📋</span>
                    <div className="flex-1 text-left">
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">
                        Assessments
                      </h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Alle verfügbaren Assessments
                      </p>
                    </div>
                  </div>
                </Card>

                <Card padding="md" radius="lg" interactive onClick={handleViewHistory}>
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📊</span>
                    <div className="flex-1 text-left">
                      <h3 className="font-medium text-slate-900 dark:text-slate-100">Verlauf</h3>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        Bisherige Assessments
                      </p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
