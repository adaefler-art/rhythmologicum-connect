
'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ContentPage } from '@/lib/types/content'
import { getResultPages, getInfoPages } from '@/lib/utils/contentPageHelpers'

const GENERIC_ERROR = 'Fehler beim Laden der Ergebnisse.'

type ResultClientProps = {
  slug: string
  assessmentId: string
}

type AssessmentResult = {
  id: string
  funnel: string
  completedAt: string
  status: string
  funnelTitle: string | null
}

type ResultResponse = {
  success: boolean
  data?: AssessmentResult
  error?: { message: string }
}

export default function ResultClient({ slug, assessmentId }: ResultClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null)
  const [contentPages, setContentPages] = useState<ContentPage[]>([])

  const canonicalSlug = assessment?.funnel ?? slug
  const funnelTitle = assessment?.funnelTitle ?? ''

  useEffect(() => {
    const loadResultData = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(
          `/api/funnels/${slug}/assessments/${assessmentId}/result`,
          { credentials: 'include' },
        )

        if (!response.ok) {
          const payload = (await response.json().catch(() => null)) as ResultResponse | null
          const message = payload?.error?.message || GENERIC_ERROR
          throw new Error(message)
        }

        const payload = (await response.json()) as ResultResponse
        if (!payload.success || !payload.data) {
          throw new Error(payload.error?.message || GENERIC_ERROR)
        }

        if (payload.data.status !== 'completed') {
          router.replace(`/patient/funnel/${payload.data.funnel}`)
          return
        }

        setAssessment(payload.data)

        try {
          const pagesRes = await fetch(`/api/funnels/${payload.data.funnel}/content-pages`)
          if (pagesRes.ok) {
            const pages: ContentPage[] = await pagesRes.json()
            setContentPages(pages)
          }
        } catch (err) {
          console.error('Error loading content pages:', err)
        }

        setLoading(false)
      } catch (err) {
        console.error('Error loading result:', err)
        setError(err instanceof Error ? err.message : GENERIC_ERROR)
        setLoading(false)
      }
    }

    loadResultData()
  }, [assessmentId, slug, router])

  if (loading) {
    return (
      <main className="flex items-center justify-center bg-slate-50 py-20">
        <p className="text-sm text-slate-600">Ergebnisse werden geladen…</p>
      </main>
    )
  }

  if (error || !assessment) {
    return (
      <main className="flex items-center justify-center bg-slate-50 py-20 px-4">
        <div className="max-w-md bg-white border-2 border-red-200 rounded-xl p-6">
          <div className="flex items-start gap-3">
            <span className="text-2xl">❌</span>
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-1">Fehler</h3>
              <p className="text-red-700">{error || 'Ergebnisse konnten nicht geladen werden.'}</p>
              <button
                onClick={() => router.push('/patient')}
                className="mt-4 px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors"
              >
                Zurück zur Übersicht
              </button>
            </div>
          </div>
        </div>
      </main>
    )
  }

  const resultPages = getResultPages(contentPages)
  const infoPages = getInfoPages(contentPages)
  const showContentLinks = resultPages.length > 0 || infoPages.length > 0

  return (
    <main className="min-h-screen bg-slate-50 px-4 py-6 sm:py-10">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-4 sm:p-6 md:p-8 mb-4 sm:mb-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-green-100 rounded-full mb-3 sm:mb-4">
              <span className="text-2xl sm:text-3xl">✓</span>
            </div>
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 mb-2 leading-tight">
              Assessment abgeschlossen!
            </h1>
            <p className="text-sm sm:text-base text-slate-600">{funnelTitle || 'Ihr Assessment'} wurde erfolgreich gespeichert.</p>
          </div>

          {/* Main Outcome Box - Prominent display */}
          <div className="bg-gradient-to-br from-sky-50 to-blue-50 border-2 border-sky-200 rounded-xl p-4 sm:p-6 mb-6">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 bg-sky-600 text-white rounded-full mb-3 sm:mb-4">
                <span className="text-xl sm:text-2xl font-bold">✓</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
                Ihre Antworten wurden gespeichert
              </h2>
              <p className="text-sm sm:text-base text-slate-700 leading-relaxed">
                Vielen Dank für Ihre Zeit. Ihre Angaben helfen dabei, ein besseres Verständnis 
                Ihrer Situation zu entwickeln.
              </p>
            </div>
          </div>

          {/* Assessment Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <div>
                <dt className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Abgeschlossen am</dt>
                <dd className="text-xs sm:text-sm text-slate-900">
                  {new Intl.DateTimeFormat('de-DE', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  }).format(new Date(assessment.completedAt))}
                </dd>
              </div>
              <div>
                <dt className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Assessment-Typ</dt>
                <dd className="text-xs sm:text-sm text-slate-900">{funnelTitle || canonicalSlug}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs sm:text-sm font-medium text-slate-600 mb-1">Status</dt>
                <dd>
                  <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                    ✓ Abgeschlossen
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Next Steps Info - More prominent */}
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="flex items-start gap-2 sm:gap-3">
              <span className="text-lg sm:text-xl flex-shrink-0">💡</span>
              <div className="flex-1">
                <h3 className="text-sm sm:text-base font-semibold text-blue-900 mb-2">Was passiert jetzt?</h3>
                <ul className="text-xs sm:text-sm text-blue-800 space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-sky-600 font-bold shrink-0">1.</span>
                    <span>Ihre Antworten werden sicher gespeichert und können von Ihrem Behandlungsteam eingesehen werden.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sky-600 font-bold shrink-0">2.</span>
                    <span>Bei Ihrem nächsten Termin können die Ergebnisse gemeinsam besprochen werden.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-sky-600 font-bold shrink-0">3.</span>
                    <span>Weitere Auswertungen und personalisierte Empfehlungen werden in Kürze verfügbar sein.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Content Page Links - Recommendations Section */}
          {showContentLinks && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4 mb-4 sm:mb-6">
              <div className="flex items-start gap-2 sm:gap-3">
                <span className="text-lg sm:text-xl flex-shrink-0">📚</span>
                <div className="flex-1">
                  <h3 className="text-sm sm:text-base font-semibold text-green-900 mb-2">
                    Empfohlene Ressourcen
                  </h3>
                  <p className="text-xs sm:text-sm text-green-800 mb-3 leading-relaxed">
                    Erfahren Sie mehr über Stress, Resilienz und praktische Strategien zur Selbstfürsorge:
                  </p>
                  <div className="space-y-2">
                    {resultPages.map((page) => (
                      <a
                        key={page.id}
                        href={`/patient/funnel/${canonicalSlug}/content/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs sm:text-sm text-green-700 hover:text-green-900 hover:underline font-medium p-2 hover:bg-green-100 rounded transition-colors"
                      >
                        📄 {page.title}
                      </a>
                    ))}
                    {infoPages.map((page) => (
                      <a
                        key={page.id}
                        href={`/patient/funnel/${canonicalSlug}/content/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-xs sm:text-sm text-green-700 hover:text-green-900 hover:underline font-medium p-2 hover:bg-green-100 rounded transition-colors"
                      >
                        📄 {page.title}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => router.push('/patient')}
              className="w-full sm:flex-1 px-5 sm:px-6 py-3 sm:py-4 bg-sky-600 text-white rounded-xl text-sm sm:text-base font-semibold hover:bg-sky-700 active:bg-sky-800 transition-colors shadow-md touch-manipulation"
              style={{ minHeight: '56px' }}
            >
              Zur Übersicht
            </button>
            <button
              onClick={() => router.push('/patient/history')}
              className="w-full sm:flex-1 px-5 sm:px-6 py-3 sm:py-4 bg-slate-200 text-slate-700 rounded-xl text-sm sm:text-base font-semibold hover:bg-slate-300 active:bg-slate-400 transition-colors touch-manipulation"
              style={{ minHeight: '56px' }}
            >
              Meine Assessments
            </button>
          </div>
        </div>

        {/* Privacy & Data Security Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-6">
          <div className="flex items-start gap-3">
            <span className="text-xl sm:text-2xl shrink-0">🔒</span>
            <div className="flex-1">
              <h2 className="text-base sm:text-lg font-bold text-slate-900 mb-2">Ihre Daten sind sicher</h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed mb-3">
                Alle Ihre Antworten wurden verschlüsselt gespeichert und unterliegen strengen Datenschutzrichtlinien. 
                Nur autorisiertes medizinisches Personal hat Zugriff auf Ihre Daten.
              </p>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Sie können jederzeit auf Ihre früheren Assessments in der Historie zugreifen oder 
                ein neues Assessment durchführen.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
