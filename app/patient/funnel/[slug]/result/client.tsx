'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import type { ContentPage } from '@/lib/types/content'
import { getResultPages, getInfoPages } from '@/lib/utils/contentPageHelpers'

type ResultClientProps = {
  slug: string
  assessmentId: string
}

type AssessmentResult = {
  id: string
  funnel: string
  completed_at: string
  status: string
}

export default function ResultClient({ slug, assessmentId }: ResultClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [assessment, setAssessment] = useState<AssessmentResult | null>(null)
  const [funnelTitle, setFunnelTitle] = useState<string>('')
  const [contentPages, setContentPages] = useState<ContentPage[]>([])

  useEffect(() => {
    const loadResultData = async () => {
      try {
        // Load assessment
        const { data: assessmentData, error: assessmentError } = await supabase
          .from('assessments')
          .select('id, funnel, completed_at, status')
          .eq('id', assessmentId)
          .single()

        if (assessmentError || !assessmentData) {
          throw new Error('Assessment konnte nicht geladen werden.')
        }

        setAssessment(assessmentData)

        // Load funnel info
        const { data: funnelData } = await supabase
          .from('funnels')
          .select('title')
          .eq('slug', slug)
          .single()

        if (funnelData) {
          setFunnelTitle(funnelData.title)
        }

        // Load content pages
        try {
          const response = await fetch(`/api/funnels/${slug}/content-pages`)
          if (response.ok) {
            const pages: ContentPage[] = await response.json()
            setContentPages(pages)
          }
        } catch (err) {
          console.error('Error loading content pages:', err)
          // Non-critical error
        }

        setLoading(false)
      } catch (err) {
        console.error('Error loading result:', err)
        setError(err instanceof Error ? err.message : 'Fehler beim Laden der Ergebnisse.')
        setLoading(false)
      }
    }
    loadResultData()
  }, [assessmentId, slug])

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
    <main className="bg-slate-50 px-4 py-10">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8 mb-6">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
              <span className="text-3xl">✓</span>
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              Assessment abgeschlossen!
            </h1>
            <p className="text-slate-600">
              {funnelTitle || 'Ihr Assessment'} wurde erfolgreich gespeichert.
            </p>
          </div>

          {/* Assessment Info */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 mb-6">
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-slate-600">Assessment-ID</dt>
                <dd className="text-sm font-mono text-slate-900 break-all">{assessment.id}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-600">Abgeschlossen am</dt>
                <dd className="text-sm text-slate-900">
                  {new Date(assessment.completed_at).toLocaleString('de-DE', {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                  })}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-600">Funnel</dt>
                <dd className="text-sm text-slate-900">{funnelTitle || slug}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-slate-600">Status</dt>
                <dd>
                  <span className="inline-block px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800">
                    Abgeschlossen
                  </span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Next Steps Info */}
          <div className="bg-sky-50 border border-sky-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <span className="text-xl flex-shrink-0">ℹ️</span>
              <div>
                <h3 className="text-sm font-semibold text-blue-900 mb-1">Nächste Schritte</h3>
                <p className="text-sm text-blue-800">
                  Ihre Antworten wurden gespeichert und können von Ihrem Arzt eingesehen werden.
                  Weitere Auswertungen und Berichte werden in Kürze verfügbar sein.
                </p>
              </div>
            </div>
          </div>

          {/* Content Page Links */}
          {showContentLinks && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-xl flex-shrink-0">📚</span>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-green-900 mb-2">
                    Mehr erfahren
                  </h3>
                  <p className="text-sm text-green-800 mb-3">
                    Lesen Sie mehr über Stress, Resilienz und wie Sie Ihre Ergebnisse interpretieren können:
                  </p>
                  <div className="space-y-2">
                    {resultPages.map((page) => (
                      <a
                        key={page.id}
                        href={`/patient/funnel/${slug}/content/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-green-700 hover:text-green-900 hover:underline font-medium"
                      >
                        📄 {page.title}
                      </a>
                    ))}
                    {infoPages.map((page) => (
                      <a
                        key={page.id}
                        href={`/patient/funnel/${slug}/content/${page.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-sm text-green-700 hover:text-green-900 hover:underline font-medium"
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
              className="flex-1 px-6 py-3 bg-sky-600 text-white rounded-lg font-semibold hover:bg-sky-700 transition-colors"
            >
              Zur Übersicht
            </button>
            <button
              onClick={() => router.push('/patient/history')}
              className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 rounded-lg font-semibold hover:bg-slate-300 transition-colors"
            >
              Meine Assessments
            </button>
          </div>
        </div>

        {/* Additional Info Card */}
        <div className="bg-white border border-slate-200 rounded-xl p-6">
          <h2 className="text-lg font-bold text-slate-900 mb-3">Ihre Daten</h2>
          <p className="text-sm text-slate-600 leading-relaxed">
            Alle Ihre Antworten wurden sicher gespeichert. Sie können jederzeit auf Ihre früheren
            Assessments in der Historie zugreifen.
          </p>
        </div>
      </div>
    </main>
  )
}
