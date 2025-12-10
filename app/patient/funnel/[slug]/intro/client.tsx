'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ContentPage } from '@/lib/types/content'

type IntroPageClientProps = {
  funnelSlug: string
}

export default function IntroPageClient({ funnelSlug }: IntroPageClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [introPage, setIntroPage] = useState<ContentPage | null>(null)
  const [funnelTitle, setFunnelTitle] = useState<string>('')

  useEffect(() => {
    const loadIntroContent = async () => {
      try {
        setLoading(true)
        setError(null)

        // Load funnel definition to get title
        const funnelResponse = await fetch(`/api/funnels/${funnelSlug}/definition`)
        if (funnelResponse.ok) {
          const funnelData = await funnelResponse.json()
          setFunnelTitle(funnelData.title || 'Assessment')
        }

        // Load intro content page via Content Resolver
        const response = await fetch(
          `/api/content/resolve?funnel=${funnelSlug}&category=intro`,
        )

        if (!response.ok) {
          // No intro page found - redirect directly to assessment
          router.push(`/patient/funnel/${funnelSlug}`)
          return
        }

        const data = await response.json()

        if (!data.page) {
          // No intro page - redirect to assessment
          router.push(`/patient/funnel/${funnelSlug}`)
          return
        }

        setIntroPage(data.page)
      } catch (err) {
        console.error('Error loading intro page:', err)
        // On error, redirect to assessment
        router.push(`/patient/funnel/${funnelSlug}`)
      } finally {
        setLoading(false)
      }
    }

    loadIntroContent()
  }, [funnelSlug, router])

  const handleStartAssessment = () => {
    // Add skipIntro parameter to avoid redirect loop
    router.push(`/patient/funnel/${funnelSlug}?skipIntro=true`)
  }

  // Loading state
  if (loading) {
    return (
      <main className="flex items-center justify-center bg-slate-50 py-20">
        <p className="text-sm text-slate-600">Bitte warten…</p>
      </main>
    )
  }

  // Error state or no intro page
  if (error || !introPage) {
    return (
      <main className="flex items-center justify-center bg-slate-50 py-20 px-4">
        <div className="max-w-md bg-white border-2 border-slate-200 rounded-xl p-6">
          <p className="text-slate-700 mb-4">Intro-Seite konnte nicht geladen werden.</p>
          <button
            onClick={handleStartAssessment}
            className="px-6 py-3 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors font-medium"
          >
            Direkt zum Assessment
          </button>
        </div>
      </main>
    )
  }

  return (
    <main className="bg-slate-50 px-4 py-10">
      <div className="max-w-3xl mx-auto bg-white border border-slate-200 rounded-2xl shadow-sm p-6 md:p-8">
        {/* Header */}
        <header className="mb-6 border-b border-slate-200 pb-6">
          <p className="text-xs font-medium uppercase tracking-wide text-sky-600 mb-1">
            {funnelTitle}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
            {introPage.title}
          </h1>
          {introPage.excerpt && (
            <p className="text-sm md:text-base text-slate-600 leading-relaxed">
              {introPage.excerpt}
            </p>
          )}
        </header>

        {/* Content */}
        <article className="prose prose-slate max-w-none mb-8">
          <div
            className="markdown-content"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(introPage.body_markdown) }}
          />
        </article>

        {/* Action Button */}
        <div className="flex justify-center pt-6 border-t border-slate-200">
          <button
            onClick={handleStartAssessment}
            className="px-8 py-4 md:py-5 rounded-xl bg-sky-600 text-white text-base md:text-lg font-semibold shadow-md hover:bg-sky-700 transition-all"
            style={{ minHeight: '56px' }}
          >
            Assessment starten →
          </button>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <span className="text-xl flex-shrink-0">ℹ️</span>
            <div className="flex-1">
              <p className="text-sm text-blue-900 leading-relaxed">
                Nehmen Sie sich Zeit, um diese Informationen zu lesen. Wenn Sie bereit sind, klicken
                Sie auf &quot;Assessment starten&quot;, um fortzufahren.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}

// Simple markdown to HTML converter (basic implementation)
function renderMarkdown(markdown: string): string {
  let html = markdown
  
  // Headers
  html = html.replace(/^### (.*$)/gim, '<h3 class="text-xl font-semibold text-slate-900 mt-6 mb-3">$1</h3>')
  html = html.replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold text-slate-900 mt-8 mb-4">$1</h2>')
  html = html.replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-slate-900 mt-8 mb-4">$1</h1>')
  
  // Bold
  html = html.replace(/\*\*(.*?)\*\*/gim, '<strong class="font-semibold text-slate-900">$1</strong>')
  
  // Italic
  html = html.replace(/\*(.*?)\*/gim, '<em class="italic">$1</em>')
  
  // Links
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/gim, '<a href="$2" class="text-sky-600 hover:text-sky-700 underline" target="_blank" rel="noopener noreferrer">$1</a>')
  
  // Paragraphs
  html = html.replace(/\n\n/gim, '</p><p class="text-slate-700 leading-relaxed mb-4">')
  html = '<p class="text-slate-700 leading-relaxed mb-4">' + html + '</p>'
  
  // Line breaks
  html = html.replace(/\n/gim, '<br />')
  
  // Lists
  html = html.replace(/<p class="text-slate-700 leading-relaxed mb-4">- (.*?)<\/p>/gim, '<ul class="list-disc list-inside space-y-2 mb-4"><li class="text-slate-700">$1</li></ul>')
  
  return html
}
