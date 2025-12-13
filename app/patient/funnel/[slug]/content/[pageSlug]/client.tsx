'use client'

import { useEffect, useState, lazy, Suspense } from 'react'
import { useRouter } from 'next/navigation'
import { useIsMobile } from '@/lib/hooks/useIsMobile'
import { MobileContentPage } from '@/app/components/mobile'
import { spacing, typography } from '@/lib/design-tokens'
import type { ContentPageWithFunnel } from '@/lib/types/content'

// Lazy load MarkdownRenderer for better initial page load performance
const MarkdownRenderer = lazy(() => import('@/app/components/MarkdownRenderer'))

type ContentPageClientProps = {
  funnelSlug: string
  pageSlug: string
}

export default function ContentPageClient({ funnelSlug, pageSlug }: ContentPageClientProps) {
  const router = useRouter()
  const isMobile = useIsMobile()
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
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-t-transparent mb-4"
            style={{
              borderColor: 'var(--color-primary-500)',
              borderTopColor: 'transparent',
            }}
          ></div>
          <p style={{ color: 'var(--color-neutral-600)' }}>Seite wird geladen...</p>
        </div>
      </div>
    )
  }

  if (error || !contentPage) {
    return (
      <div className="min-h-screen bg-muted flex items-center justify-center p-4">
        <div className="rounded-2xl shadow-xl p-8 max-w-md w-full text-center"
          style={{ backgroundColor: 'var(--background)' }}
        >
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-3" style={{ color: 'var(--foreground)' }}>
            Fehler
          </h1>
          <p className="mb-6" style={{ color: 'var(--color-neutral-600)' }}>
            {error || 'Seite nicht gefunden'}
          </p>
          <button
            onClick={() => router.back()}
            className="text-white font-medium px-6 py-3 rounded-lg transition-opacity hover:opacity-90"
            style={{ backgroundColor: 'var(--color-primary-600)' }}
          >
            Zurück
          </button>
        </div>
      </div>
    )
  }

  const targetFunnelSlug = contentPage.funnel?.slug ?? funnelSlug

  // Mobile Layout - New v0.4 design system
  if (isMobile) {
    return (
      <MobileContentPage
        title={contentPage.title}
        subtitle={contentPage.funnel?.title}
        ctaLabel={contentPage.funnel ? 'Zurück zum Fragebogen' : 'Zurück'}
        onCtaClick={() => {
          if (contentPage.funnel) {
            router.push(`/patient/funnel/${targetFunnelSlug}`)
          } else {
            router.back()
          }
        }}
        secondaryLabel={contentPage.funnel ? 'Zurück' : undefined}
        onSecondaryClick={contentPage.funnel ? () => router.back() : undefined}
      >
        {/* Excerpt */}
        {contentPage.excerpt && (
          <div 
            className="border-b border-slate-200"
            style={{ 
              marginBottom: spacing.xl,
              paddingBottom: spacing.xl,
            }}
          >
            <p 
              className="text-slate-600 italic"
              style={{ 
                fontSize: typography.fontSize.lg,
                lineHeight: typography.lineHeight.relaxed,
              }}
            >
              {contentPage.excerpt}
            </p>
          </div>
        )}

        {/* Main Content */}
        <Suspense fallback={<div className="text-center py-8 text-slate-500">Inhalt wird geladen...</div>}>
          <MarkdownRenderer content={contentPage.body_markdown} />
        </Suspense>

        {/* Sections */}
        {contentPage.sections && contentPage.sections.length > 0 && (
          <div style={{ marginTop: spacing['2xl'] }}>
            {contentPage.sections.map((section, index) => (
              <div 
                key={section.id} 
                className="border-t border-slate-200"
                style={{ 
                  paddingTop: spacing['2xl'],
                  marginTop: index === 0 ? 0 : spacing['2xl'],
                }}
              >
                <h2 
                  className="font-bold text-slate-900"
                  style={{ 
                    fontSize: typography.fontSize['2xl'],
                    marginBottom: spacing.lg,
                  }}
                >
                  {section.title}
                </h2>
                <Suspense fallback={<div className="text-center py-4 text-slate-500">Abschnitt wird geladen...</div>}>
                  <MarkdownRenderer content={section.body_markdown} />
                </Suspense>
              </div>
            ))}
          </div>
        )}
      </MobileContentPage>
    )
  }

  // Desktop Layout - Original v0.3 layout (preserved for non-mobile)
  const layoutClass =
    contentPage.layout === 'wide'
      ? 'max-w-5xl'
      : contentPage.layout === 'hero'
        ? 'max-w-7xl'
        : 'max-w-3xl'

  return (
    <div className="min-h-screen bg-linear-to-br from-blue-50 to-indigo-50">
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
      <main className={`${layoutClass} mx-auto px-4 pt-8 sm:py-12`} style={{
        paddingBottom: 'max(6rem, calc(6rem + env(safe-area-inset-bottom)))',
      }}>
        <article className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Page Header */}
          <div className="bg-linear-to-r from-blue-600 to-indigo-600 px-6 sm:px-8 py-8 sm:py-12">
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-3">
              {contentPage.title}
            </h1>
            {contentPage.excerpt && (
              <p className="text-primary-100 text-lg leading-relaxed">{contentPage.excerpt}</p>
            )}
          </div>

          {/* Markdown Content */}
          <div className="px-6 sm:px-8 py-8 sm:py-12">
            <Suspense fallback={<div className="text-center py-8 text-slate-500">Inhalt wird geladen...</div>}>
              <MarkdownRenderer content={contentPage.body_markdown} />
            </Suspense>
          </div>

          {/* F3: Sections */}
          {contentPage.sections && contentPage.sections.length > 0 && (
            <div className="border-t border-slate-200">
              {contentPage.sections.map((section) => (
                <div key={section.id} className="px-6 sm:px-8 py-8 sm:py-12 border-b border-slate-100 last:border-b-0">
                  <h2 className="text-2xl font-bold text-slate-900 mb-4">{section.title}</h2>
                  <Suspense fallback={<div className="text-center py-4 text-slate-500">Abschnitt wird geladen...</div>}>
                    <MarkdownRenderer content={section.body_markdown} />
                  </Suspense>
                </div>
              ))}
            </div>
          )}
        </article>

        {/* Back to Funnel Button */}
        {contentPage.funnel && (
          <div className="mt-8 text-center">
            <button
              onClick={() => router.push(`/patient/funnel/${targetFunnelSlug}`)}
              className="inline-flex items-center gap-2 text-white font-medium px-6 py-3 rounded-lg transition-opacity hover:opacity-90 shadow-md"
              style={{ backgroundColor: 'var(--color-primary-600)' }}
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
