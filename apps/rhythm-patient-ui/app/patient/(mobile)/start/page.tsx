'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button } from '@/lib/ui/mobile-v2'
import {
  MessageCircle,
  Shield,
  Clock,
  Heart,
  ChevronRight,
  ChevronLeft,
} from '@/lib/ui/mobile-v2/icons'
import { DashboardCards } from '@/components/patient/DashboardCards'

const CONTENT_SLIDER_FALLBACK_TEASER_IMAGE_SRC = '/mobile-v2/Dashboard.png'

const CONTENT_SLIDER_TEASER_BY_SLUG: Record<string, string> = {
  'stress-verstehen': '/mobile-v2/Assessment.png',
  'resilienz-im-alltag': '/mobile-v2/PersonalScreen.png',
  'schlaf-besser-werden': '/mobile-v2/Dialog.png',
  'atemuebung-60-sekunden': '/mobile-v2/Assessment_Select.png',
}

function extractContentSlug(actionTarget: string | null): string | null {
  if (!actionTarget) return null
  const match = actionTarget.match(/^\/patient\/content\/([^/?#]+)/)
  return match?.[1] ?? null
}

function getTeaserImageForActionTarget(actionTarget: string | null): string {
  const slug = extractContentSlug(actionTarget)

  if (slug && CONTENT_SLIDER_TEASER_BY_SLUG[slug]) {
    return CONTENT_SLIDER_TEASER_BY_SLUG[slug]
  }

  if (!slug) {
    return CONTENT_SLIDER_FALLBACK_TEASER_IMAGE_SRC
  }

  const fallbackImages = [
    '/mobile-v2/Dashboard.png',
    '/mobile-v2/Assessment.png',
    '/mobile-v2/Assessment_Select.png',
    '/mobile-v2/Dialog.png',
    '/mobile-v2/PersonalScreen.png',
  ]

  const hash = slug.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
  return fallbackImages[hash % fallbackImages.length] ?? CONTENT_SLIDER_FALLBACK_TEASER_IMAGE_SRC
}

const NEXT_IMAGE_PROXY_PATH = '/_next/image'

function isNextImageProxyUrl(value: string): boolean {
  try {
    if (value.startsWith('/')) {
      const parsedRelative = new URL(value, 'https://local.invalid')
      return parsedRelative.pathname === NEXT_IMAGE_PROXY_PATH
    }

    if (value.startsWith('http://') || value.startsWith('https://')) {
      const parsedAbsolute = new URL(value)
      return parsedAbsolute.pathname === NEXT_IMAGE_PROXY_PATH
    }
  } catch {
    return false
  }

  return false
}

function unwrapNextImageProxyUrl(value: string): string {
  let candidate = value.trim()

  for (let depth = 0; depth < 3; depth += 1) {
    if (!isNextImageProxyUrl(candidate)) {
      break
    }

    try {
      const parsed = candidate.startsWith('/')
        ? new URL(candidate, 'https://local.invalid')
        : new URL(candidate)

      const nested = parsed.searchParams.get('url')?.trim()
      if (!nested) {
        break
      }

      const decoded = decodeURIComponent(nested)
      if (!decoded || decoded === candidate) {
        break
      }

      candidate = decoded
    } catch {
      break
    }
  }

  return candidate
}

function resolveTeaserImage(actionTarget: string | null, teaserImageUrl?: string | null): string {
  const trimmedTeaser = teaserImageUrl?.trim()
  if (trimmedTeaser) {
    let normalizedTeaser = unwrapNextImageProxyUrl(trimmedTeaser)

    if (/^!\[[^\]]*\]\(([^)]+)\)$/u.test(normalizedTeaser)) {
      normalizedTeaser = normalizedTeaser.replace(/^!\[[^\]]*\]\(([^)]+)\)$/u, '$1').trim()
    }

    normalizedTeaser = unwrapNextImageProxyUrl(normalizedTeaser)

    if (isNextImageProxyUrl(normalizedTeaser)) {
      return getTeaserImageForActionTarget(actionTarget)
    }

    if (normalizedTeaser.startsWith('http://') || normalizedTeaser.startsWith('https://')) {
      return encodeURI(normalizedTeaser)
    }

    if (normalizedTeaser.startsWith('/')) {
      return encodeURI(normalizedTeaser)
    }

    if (normalizedTeaser.startsWith('images/')) {
      return encodeURI(`/${normalizedTeaser}`)
    }

    return encodeURI(normalizedTeaser)
  }

  return getTeaserImageForActionTarget(actionTarget)
}

export default function PatientEntryScreen() {
  const router = useRouter()
  const [sliderItems, setSliderItems] = useState<Array<{
    id: string
    title: string
    excerpt: string
    teaserImageUrl?: string | null
    actionTarget: string
    priority: number
  }>>([])
  const [sliderLoading, setSliderLoading] = useState(true)
  const [activeContentIndex, setActiveContentIndex] = useState(0)
  const [failedImageSources, setFailedImageSources] = useState<Record<string, true>>({})

  const contentTiles = useMemo(() => {
    return [...sliderItems].sort((first, second) => second.priority - first.priority)
  }, [sliderItems])

  useEffect(() => {
    let active = true

    const loadSliderItems = async () => {
      try {
        setSliderLoading(true)
        const response = await fetch('/api/patient/content-slider', {
          method: 'GET',
          credentials: 'include',
          cache: 'no-store',
        })

        if (!response.ok) {
          setSliderItems([])
          return
        }

        const payload = (await response.json()) as {
          success?: boolean
          data?: {
            items?: Array<{
              id: string
              title: string
              excerpt: string
              teaserImageUrl?: string | null
              actionTarget: string
              priority: number
            }>
          }
        }

        if (!active) return

        if (!payload.success || !Array.isArray(payload.data?.items)) {
          setSliderItems([])
          return
        }

        setSliderItems(payload.data.items)
      } catch {
        if (!active) return
        setSliderItems([])
      } finally {
        if (!active) return
        setSliderLoading(false)
      }
    }

    loadSliderItems()

    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    setActiveContentIndex(0)
  }, [contentTiles.length])

  const activeContentTile = contentTiles[activeContentIndex] ?? null
  const resolvedActiveContentTeaserImageSrc = resolveTeaserImage(
    activeContentTile?.actionTarget ?? null,
    activeContentTile?.teaserImageUrl,
  )
  const activeContentTeaserImageSrc =
    activeContentTile && failedImageSources[resolvedActiveContentTeaserImageSrc]
      ? getTeaserImageForActionTarget(activeContentTile.actionTarget)
      : resolvedActiveContentTeaserImageSrc

  const openActiveContent = () => {
    if (!activeContentTile?.actionTarget) return
    router.push(activeContentTile.actionTarget)
  }

  const goToPreviousContent = () => {
    if (contentTiles.length <= 1) return
    setActiveContentIndex((current) => (current === 0 ? contentTiles.length - 1 : current - 1))
  }

  const goToNextContent = () => {
    if (contentTiles.length <= 1) return
    setActiveContentIndex((current) => (current === contentTiles.length - 1 ? 0 : current + 1))
  }

  return (
    <div className="w-full overflow-x-hidden bg-slate-50">
      <div className="flex min-h-[calc(100dvh-56px)] flex-col px-4 pb-[calc(24px+env(safe-area-inset-bottom,0px))] pt-5">
        <div className="flex-1 space-y-6">
          <header className="space-y-2">
            <h1 className="text-2xl font-semibold text-slate-900">Willkommen</h1>
            <p className="text-sm text-slate-600">
              Schoen, dass Sie da sind. Nehmen Sie sich einen Moment Zeit.
            </p>
          </header>

          <Card className="border border-sky-200 bg-sky-50" padding="lg" shadow="sm">
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">Erstaufnahme: Soziologische Anamnese</p>
                  <p className="text-sm text-slate-700">
                    Bitte starten Sie zuerst die Erstaufnahme. Ihre Angaben helfen PAT und der
                    weiteren Anamnese.
                  </p>
                </div>
              </div>

              <Button
                variant="primary"
                size="md"
                fullWidth
                icon={<ChevronRight className="h-4 w-4" />}
                iconPosition="right"
                onClick={() => router.push('/patient/assess/first-intake-sociological-anamnesis/flow')}
              >
                Erstaufnahme starten
              </Button>
            </div>
          </Card>

          <Card className="border border-slate-200" padding="lg" shadow="sm">
            {activeContentTile ? (
              <div className="space-y-3">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={openActiveContent}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      openActiveContent()
                    }
                  }}
                  className="relative cursor-pointer overflow-hidden rounded-xl border border-slate-200"
                >
                  <img
                    src={activeContentTeaserImageSrc}
                    alt={`Teaserbild: ${activeContentTile.title}`}
                    className="h-56 w-full object-contain bg-slate-100"
                    onError={() => {
                      setFailedImageSources((current) => ({ ...current, [resolvedActiveContentTeaserImageSrc]: true }))
                    }}
                    loading="lazy"
                    decoding="async"
                  />
                  <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                  <div className="pointer-events-none absolute bottom-0 left-0 right-0 p-4">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold text-white">{activeContentTile.title}</p>
                      {activeContentTile.excerpt && (
                        <p className="text-sm text-white/90">{activeContentTile.excerpt}</p>
                      )}
                    </div>
                  </div>

                  {contentTiles.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={goToPreviousContent}
                        aria-label="Vorheriger Inhalt"
                        className="absolute left-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white"
                      >
                        <ChevronLeft className="h-5 w-5" />
                      </button>
                      <button
                        type="button"
                        onClick={goToNextContent}
                        aria-label="Nächster Inhalt"
                        className="absolute right-3 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full bg-black/35 text-white"
                      >
                        <ChevronRight className="h-5 w-5" />
                      </button>
                    </>
                  )}
                </div>

                {contentTiles.length > 1 && (
                  <div className="flex items-center justify-center gap-2">
                    {contentTiles.map((tile, index) => (
                      <button
                        key={tile.id}
                        type="button"
                        aria-label={`Inhalt ${index + 1} anzeigen`}
                        onClick={() => setActiveContentIndex(index)}
                        className={
                          index === activeContentIndex
                            ? 'h-2 w-6 rounded-md bg-slate-900'
                            : 'h-2 w-2 rounded-md bg-slate-300'
                        }
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sky-100 text-sky-700">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">Empfohlene Inhalte</p>
                  <p className="text-sm text-slate-600">
                    {sliderLoading
                      ? 'Inhalte werden geladen.'
                      : 'Keine Inhalte mit Tag "start-slider" gefunden.'}
                  </p>
                </div>
              </div>
            )}
          </Card>

          <Card className="border border-slate-200" padding="lg" shadow="sm">
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-700">
                  <Clock className="h-5 w-5" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-slate-900">Wartezimmer-Fastpass</p>
                  <p className="text-sm text-slate-600">
                    Kurze Formular-Erfassung mit grossen Buttons (ohne Spracheingabe).
                  </p>
                </div>
              </div>

              <Button
                variant="secondary"
                size="lg"
                fullWidth
                icon={<ChevronRight className="h-4 w-4" />}
                iconPosition="right"
                onClick={() => router.push('/patient/fastpass')}
              >
                Fastpass starten
              </Button>
            </div>
          </Card>

          <Card className="border border-slate-200" padding="lg" shadow="sm">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <MessageCircle className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">Hier koennen Sie sprechen</p>
                  <p className="text-xs text-slate-500">Ihr persoenlicher Dialog mit PAT</p>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <Shield className="h-4 w-4 text-slate-500" />
                  <span>Vertraulich</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <Clock className="h-4 w-4 text-slate-500" />
                  <span>Jederzeit</span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-700">
                  <Heart className="h-4 w-4 text-slate-500" />
                  <span>Unterstuetzend</span>
                </div>
              </div>
            </div>
          </Card>

          <Button
            variant="primary"
            size="lg"
            fullWidth
            icon={<ChevronRight className="h-5 w-5" />}
            iconPosition="right"
            onClick={() => router.push('/patient/dialog')}
          >
            Gespraech beginnen
          </Button>

          <p className="text-xs text-slate-500 text-center">
            Sie koennen jederzeit pausieren oder das Gespraech beenden
          </p>

          <section className="space-y-3 pt-2">
            <h2 className="text-lg font-semibold text-slate-900">Ihr Status</h2>
            <DashboardCards />
          </section>
        </div>
      </div>
    </div>
  )
}
