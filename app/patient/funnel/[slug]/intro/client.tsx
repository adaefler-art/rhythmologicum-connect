'use client'

import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button, LoadingSpinner, Card } from '@/lib/ui'
import type { ContentPage } from '@/lib/types/content'
import type { QuestionnaireStep, ContentPage as ManifestContentPage, FunnelContentManifest } from '@/lib/contracts/funnelManifest'
import MobileWelcomeScreen from '@/app/components/MobileWelcomeScreen'
import { ContentBlockRenderer } from '@/lib/components/content'
import StandardContentContainer from '@/app/components/StandardContentContainer'
import ContentContainer from '@/app/components/layout/ContentContainer'

type ManifestData = {
  version: string
  funnelId: string
  algorithmVersion: string
  promptVersion: string
  steps: QuestionnaireStep[]
  contentPages: ManifestContentPage[]
  contentManifest: FunnelContentManifest
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
  const [funnelMeta, setFunnelMeta] = useState<{
    title: string
    subtitle: string | null
    description: string | null
  } | null>(null)
  const [isMissingContent, setIsMissingContent] = useState(false)
  const [useManifestRenderer, setUseManifestRenderer] = useState(false)

  useEffect(() => {
    if (manifestError) {
      return
    }

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
          setFunnelMeta({
            title: funnelData.title || 'Assessment',
            subtitle: funnelData.subtitle ?? null,
            description: funnelData.description ?? null,
          })
        }

        // V05-I06.5: Check if manifest has intro page content
        if (manifestData?.contentManifest) {
          const introPageInManifest = manifestData.contentManifest.pages.find(
            (p) => p.slug === 'intro'
          )
          
          if (introPageInManifest && introPageInManifest.sections.length > 0) {
            // Use manifest-driven renderer
            setUseManifestRenderer(true)
            setLoading(false)
            return
          }
        }

        // Fallback: Load intro content page via Content Resolver (legacy path)
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
  }, [funnelSlug, router, manifestData, manifestError])

  const handleStartAssessment = () => {
    // Add skipIntro parameter to avoid redirect loop
    router.push(`/patient/funnel/${funnelSlug}?skipIntro=true`)
  }

  // V05-I06.5: Handle manifest error (422 - invalid manifest)
  if (manifestError) {
    return (
      <main className="flex items-center justify-center bg-muted py-20 px-4">
        <Card padding="lg" radius="xl" className="w-full max-w-md" border={true}>
          <div className="text-4xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold mb-2 text-red-700">
            Konfigurationsfehler
          </h2>
          <p className="mb-4 text-neutral-700">
            {manifestError}
          </p>
          <Button variant="primary" fullWidth onClick={() => router.push('/patient/funnels')}>
            Zurück zur Übersicht
          </Button>
        </Card>
      </main>
    )
  }

  // Loading state
  if (loading) {
    return <LoadingSpinner size="lg" text="Bitte warten…" centered />
  }

  // V05-I06.5: Render manifest-driven content if available
  if (useManifestRenderer && manifestData?.contentManifest) {
    const handleBlockTypeError = (blockType: string, sectionKey: string) => {
      console.error(`[INTRO_PAGE] Unsupported block type: ${blockType} in section ${sectionKey}`)
      // PHI-free logging only - don't expose to user
    }

    return (
      <main className="min-h-screen bg-muted">
        {/* V05-I06.5: Manifest-driven content renderer */}
        <StandardContentContainer className="py-8">
          <ContentBlockRenderer
            manifest={manifestData.contentManifest}
            pageSlug="intro"
            onBlockTypeError={handleBlockTypeError}
          />
        </StandardContentContainer>
        
        {/* CTA Button */}
        <div className="bg-white border-t border-slate-200">
          <StandardContentContainer className="py-6">
            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleStartAssessment}
            >
              Assessment starten
            </Button>
          </StandardContentContainer>
        </div>

        {/* Manifest Info Display - Only visible if manifest loaded successfully */}
        {manifestData && (
          <div className="bg-slate-50 px-4 py-6">
            <StandardContentContainer>
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
            </StandardContentContainer>
          </div>
        )}
      </main>
    )
  }

  // Error state or no intro page
  if (isMissingContent && !introPage) {
    const title = funnelMeta?.title || funnelTitle || 'Assessment'
    const subtitle = funnelMeta?.subtitle
    const description = funnelMeta?.description

    return (
      <main className="min-h-screen bg-muted">
        <ContentContainer className="px-4 py-10">
          <Card
            data-testid="intro-missing-content-fallback"
            padding="lg"
            radius="xl"
            className="w-full min-w-[320px]"
          >
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">
              {title}
            </h1>
            {subtitle && (
              <p className="mt-2 text-base sm:text-lg text-neutral-700">
                {subtitle}
              </p>
            )}
            {description && (
              <div className="prose max-w-none mt-4 text-neutral-700">
                <p>{description}</p>
              </div>
            )}

            {!description && (
              <p className="mt-4 text-base text-neutral-700">
                Inhalt ist noch nicht verfügbar.
              </p>
            )}

            <Button
              variant="primary"
              size="lg"
              fullWidth
              onClick={handleStartAssessment}
              className="mt-6"
            >
              Direkt zum Assessment
            </Button>
          </Card>
        </ContentContainer>
      </main>
    )
  }

  if (error || !introPage) {
    return (
      <main className="flex items-center justify-center bg-muted py-20 px-4">
        <Card padding="lg" radius="xl" className="w-full max-w-md">
          <p className="mb-4 text-neutral-700">
            {error || 'Intro-Seite konnte nicht geladen werden.'}
          </p>
          <Button variant="primary" fullWidth onClick={handleStartAssessment}>
            Direkt zum Assessment
          </Button>
        </Card>
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
        <div className="bg-slate-50 py-6">
          <StandardContentContainer>
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
          </StandardContentContainer>
        </div>
      )}

      {/* Manifest Error Display */}
      {manifestError && (
        <div className="bg-red-50 py-4">
          <StandardContentContainer>
            <div className="bg-red-100 border border-red-300 rounded-lg p-4">
              <p className="text-sm font-medium text-red-900">⚠️ Manifest-Fehler</p>
              <p className="text-sm text-red-700 mt-1">{manifestError}</p>
            </div>
          </StandardContentContainer>
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


