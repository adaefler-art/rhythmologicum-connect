'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { ContentPage } from '@/lib/types/content'
import MobileWelcomeScreen from '@/app/components/MobileWelcomeScreen'

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
            Intro-Seite konnte nicht geladen werden.
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

  return (
    <MobileWelcomeScreen
      title={introPage.title}
      subtitle={funnelTitle}
      description={introPage.excerpt || undefined}
      bulletPoints={bulletPoints}
      ctaLabel="Assessment starten"
      onContinue={handleStartAssessment}
      isLoading={false}
    />
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
      'Bekommen Sie individuelle Empfehlungen',
    ]
  }
  
  return bulletPoints
}


