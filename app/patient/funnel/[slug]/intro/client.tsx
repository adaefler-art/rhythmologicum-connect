'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ContentPage } from '@/lib/types/content'
import type { QuestionnaireStep, ContentPage as ManifestContentPage } from '@/lib/contracts/funnelManifest'
import MobileWelcomeScreen from '@/app/components/MobileWelcomeScreen'

type ManifestData = {
  version: string
  funnelId: string
  algorithmVersion: string
  promptVersion: string
  steps: QuestionnaireStep[]
  contentPages: ManifestContentPage[]
}

type IntroPageClientProps = {
  funnelSlug: string
  manifestData: ManifestData | null
  manifestError: string | null
}

export default function IntroPageClient({ funnelSlug, manifestData, manifestError }: IntroPageClientProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [introPage, setIntroPage] = useState<ContentPage | null>(null)
  const [funnelTitle, setFunnelTitle] = useState<string>('')
  const [isMissingContent, setIsMissingContent] = useState(false)

  useEffect(() => {
    const loadIntroContent = async () => {
      try {
        setLoading(true)
        setError(null)
        setIsMissingContent(false)

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
          // Missing content is optional: show a friendly state instead of error/redirect loops.
          setIsMissingContent(true)
          setIntroPage(null)
          return
        }

        const data = await response.json()

        if (data?.status === 'missing_content' || !data.page) {
          setIsMissingContent(true)
          setIntroPage(null)
          return
        }

        setIntroPage(data.page)
      } catch (err) {
        console.error('[INTRO_PAGE_LOAD_FAILED]')
        setError('Intro-Inhalt konnte nicht geladen werden.')
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
      <main className="flex items-center justify-center bg-muted py-20">
        <p className="text-sm" style={{ color: 'var(--color-neutral-600)' }}>Bitte warten…</p>
      </main>
    )
  }

  // Error state or no intro page
  if (error || !introPage) {
    return (
      <main className="flex items-center justify-center bg-muted py-20 px-4">
        <div className="max-w-md border-2 rounded-xl p-6"
          style={{
            backgroundColor: 'var(--background)',
            borderColor: 'var(--color-neutral-200)',
          }}
        >
          <p className="mb-4" style={{ color: 'var(--color-neutral-700)' }}>
            {isMissingContent
              ? 'Inhalt ist noch nicht verfügbar.'
              : error || 'Intro-Seite konnte nicht geladen werden.'}
          </p>
          <button
            onClick={handleStartAssessment}
            className="px-6 py-3 text-white rounded-lg hover:opacity-90 transition-opacity font-medium"
            style={{ backgroundColor: 'var(--color-primary-600)' }}
          >
            Direkt zum Assessment
          </button>
        </div>
      </main>
    )
  }

  // Extract bullet points from markdown content if available
  const bulletPoints = extractBulletPoints(introPage.body_markdown)

  // If manifest data is available, add manifest info to bullet points
  const enhancedBulletPoints = manifestData 
    ? [
        ...bulletPoints.slice(0, 3), // Keep first 3 original points
        `${manifestData.steps.length} Schritte im Assessment`,
      ]
    : bulletPoints

  return (
    <>
      <MobileWelcomeScreen
        title={introPage.title}
        subtitle={funnelTitle}
        description={introPage.excerpt || undefined}
        bulletPoints={enhancedBulletPoints}
        ctaLabel="Assessment starten"
        onContinue={handleStartAssessment}
        isLoading={false}
      />
      
      {/* Manifest Info Display - Only visible if manifest loaded successfully */}
      {manifestData && (
        <div className="bg-slate-50 px-4 py-6">
          <div className="max-w-2xl mx-auto">
            <div className="bg-white border border-slate-200 rounded-lg p-4 shadow-sm">
              <h3 className="text-sm font-semibold text-slate-900 mb-3">
                📋 Funnel-Konfiguration (Version {manifestData.version})
              </h3>
              
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Assessment-Schritte:</span>
                  <span className="font-medium text-slate-900">{manifestData.steps.length}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-600">Algorithmus-Version:</span>
                  <span className="font-mono text-xs text-slate-900">{manifestData.algorithmVersion}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-slate-600">Prompt-Version:</span>
                  <span className="font-mono text-xs text-slate-900">{manifestData.promptVersion}</span>
                </div>
              </div>
              
              {/* Step List */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900">
                  Schritte anzeigen ({manifestData.steps.length})
                </summary>
                <ul className="mt-2 space-y-1 pl-4">
                  {manifestData.steps.map((step, index) => (
                    <li key={step.id} className="text-sm text-slate-600">
                      {index + 1}. {step.title}
                      {step.questions && (
                        <span className="text-xs text-slate-500 ml-2">
                          ({step.questions.length} Fragen)
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </details>

              {/* Content Pages from Manifest */}
              {manifestData.contentPages && manifestData.contentPages.length > 0 && (
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm font-medium text-slate-700 hover:text-slate-900">
                    Content Pages ({manifestData.contentPages.length})
                  </summary>
                  <ul className="mt-2 space-y-1 pl-4">
                    {manifestData.contentPages.map((page) => (
                      <li key={page.slug} className="text-sm text-slate-600">
                        📄 {page.title}
                        <span className="text-xs text-slate-500 ml-2">({page.slug})</span>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Manifest Error Display */}
      {manifestError && (
        <div className="bg-red-50 px-4 py-4">
          <div className="max-w-2xl mx-auto">
            <div className="bg-red-100 border border-red-300 rounded-lg p-4">
              <p className="text-sm font-medium text-red-900">
                ⚠️ Manifest-Fehler
              </p>
              <p className="text-sm text-red-700 mt-1">
                {manifestError}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Extract bullet points from markdown content
 * Looks for lines starting with "- " or "* "
 */
function extractBulletPoints(markdown: string): string[] {
  if (!markdown) return []
  
  const lines = markdown.split('\n')
  const bulletPoints: string[] = []
  
  for (const line of lines) {
    const trimmed = line.trim()
    // Match lines starting with - or * followed by space
    if (trimmed.match(/^[-*]\s+(.+)$/)) {
      const content = trimmed.replace(/^[-*]\s+/, '').trim()
      if (content) {
        bulletPoints.push(content)
      }
    }
  }
  
  // If no bullet points found, provide default ones
  if (bulletPoints.length === 0) {
    return [
      'Beantworten Sie Fragen zu Ihrem aktuellen Stresslevel',
      'Erhalten Sie eine persönliche Auswertung',
      'Entdecken Sie Ihre Resilienzfaktoren',
    ]
  }
  
  return bulletPoints
}


