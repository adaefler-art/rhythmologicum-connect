'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import MarkdownRenderer from '@/app/components/MarkdownRenderer'
import type { ContentPageWithFunnel } from '@/lib/types/content'

type ContentPageClientProps = {
  slug: string
}

/**
 * F7: Client component for rendering content pages at /content/[slug]
 * Handles loading, error states, and 404s
 */
export default function ContentPageClient({ slug }: ContentPageClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [contentPage, setContentPage] = useState<ContentPageWithFunnel | null>(null)

  useEffect(() => {
    const loadContentPage = async () => {
      try {
        setLoading(true)
        setError(null)

        // Encode slug for URL safety
        const response = await fetch(`/api/content-pages/${encodeURIComponent(slug)}`)
        
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
  }, [slug])

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
          <h1 className="text-2xl font-bold text-slate-900 mb-3">Seite nicht gefunden</h1>
          <p className="text-slate-600 mb-6">
            {error || 'Die angeforderte Seite konnte nicht gefunden werden.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-3 rounded-lg transition-colors"
          >
            Zur Startseite
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
          <div className="flex-1 text-sm text-slate-500">
            <span className="hidden sm:inline">Rhythmologicum Connect</span>
          </div>
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

          {/* Sections */}
          {contentPage.sections && contentPage.sections.length > 0 && (
            <div className="border-t border-slate-200">
              {contentPage.sections.map((section) => (
                <div
                  key={section.id}
                  className="px-6 sm:px-8 py-8 sm:py-12 border-b border-slate-100 last:border-b-0"
                >
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">{section.title}</h2>
                  <MarkdownRenderer content={section.body_markdown} />
                </div>
              ))}
            </div>
          )}
        </article>

        {/* Back to Home Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => router.push('/')}
            className="inline-flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium px-6 py-3 rounded-lg transition-colors"
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
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
              />
            </svg>
            Zur Startseite
          </button>
        </div>
      </main>
    </div>
  )
}
