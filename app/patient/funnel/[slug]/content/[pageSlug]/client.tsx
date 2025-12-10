'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MarkdownRenderer from '@/app/components/MarkdownRenderer'
import type { ContentPageWithFunnel } from '@/lib/types/content'

type ContentPageClientProps = {
  funnelSlug: string
  pageSlug: string
}

export default function ContentPageClient({ funnelSlug, pageSlug }: ContentPageClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contentPage, setContentPage] = useState<ContentPageWithFunnel | null>(null)

  useEffect(() => {
    const loadContentPage = async () => {
      try {
        setLoading(true)
        setError(null)

        const response = await fetch(`/api/content-pages/${pageSlug}`)
        if (!response.ok) {
          if (response.status === 404) {
            setError('Diese Seite wurde nicht gefunden.')
          } else {
            setError('Fehler beim Laden der Seite.')
          }
          setLoading(false)
          return
        }

        const data: ContentPageWithFunnel = await response.json()
        setContentPage(data)
        setLoading(false)
      } catch (err) {
        console.error('Error loading content page:', err)
        setError('Fehler beim Laden der Seite. Bitte versuchen Sie es erneut.')
        setLoading(false)
      }
    }

    loadContentPage()
  }, [pageSlug])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mb-4"></div>
          <p className="text-slate-600">Seite wird geladen...</p>
        </div>
      </div>
    )
  }

  if (error || !contentPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Fehler</h1>
          <p className="text-slate-600 mb-6">{error || 'Seite nicht gefunden'}</p>
          <button
            onClick={() => router.back()}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Zurück
          </button>
        </div>
      </div>
    )
  }

  // Determine layout width based on layout setting
  const layoutClass =
    contentPage.layout === 'wide'
      ? 'max-w-5xl'
      : contentPage.layout === 'hero'
        ? 'max-w-7xl'
        : 'max-w-3xl'

  const targetFunnelSlug = contentPage.funnel?.slug ?? funnelSlug

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            aria-label="Zurück"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
            <span className="hidden sm:inline font-medium">Zurück</span>
          </button>
          {contentPage.funnel && (
            <div className="flex-1 text-sm text-slate-500">
              <span className="hidden sm:inline">{contentPage.funnel.title}</span>
            </div>
          )}
        </div>
      </header>

      {/* Content */}
      <main className={`${layoutClass} mx-auto px-4 py-8 sm:py-12`}>
        <article className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Page Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 sm:px-8 py-8 sm:py-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              {contentPage.title}
            </h1>
            {contentPage.excerpt && (
              <p className="text-blue-100 text-lg leading-relaxed">{contentPage.excerpt}</p>
            )}
          </div>

          {/* Markdown Content */}
          <div className="px-6 sm:px-8 py-8 sm:py-12">
            <MarkdownRenderer content={contentPage.body_markdown} />
          </div>
        </article>

        {/* Back to Funnel Button */}
        {contentPage.funnel && (
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push(`/patient/funnel/${targetFunnelSlug}`)}
              className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors shadow-md"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Zurück zum Fragebogen
            </button>
          </div>
        )}
      </main>
    </div>
  )
}
