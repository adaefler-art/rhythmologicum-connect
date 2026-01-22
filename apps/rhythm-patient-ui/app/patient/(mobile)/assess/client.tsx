'use client'

import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Button, Chip, LoadingSkeleton, EmptyState, ErrorState } from '@/lib/ui/mobile-v2'
import type { CatalogFunnel, FunnelCatalogResponse } from '@/lib/types/catalog'

type LoadState = 'live' | 'loading' | 'error' | 'empty'

type Props = {
  initialState?: LoadState
}

type ApiResponse = {
  success: boolean
  data?: FunnelCatalogResponse
  error?: { code?: string; message?: string }
}

function flattenFunnels(data: FunnelCatalogResponse | null): CatalogFunnel[] {
  if (!data) return []
  const pillarFunnels = data.pillars.flatMap((pillar) => pillar.funnels)
  return [...pillarFunnels, ...data.uncategorized_funnels]
}

function isUnavailable(funnel: CatalogFunnel): boolean {
  if (funnel.availability) {
    return funnel.availability !== 'available'
  }
  return !funnel.is_active
}

export default function AssessmentsListClient({ initialState = 'live' }: Props) {
  const router = useRouter()
  const [state, setState] = useState<LoadState>(initialState === 'live' ? 'loading' : initialState)
  const [funnels, setFunnels] = useState<CatalogFunnel[]>([])
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [reloadKey, setReloadKey] = useState(0)

  useEffect(() => {
    if (initialState !== 'live') return

    let isMounted = true
    const load = async () => {
      setState('loading')
      setErrorMessage(null)
      try {
        const res = await fetch('/api/funnels/catalog', { method: 'GET' })
        const json = (await res.json()) as ApiResponse

        if (!res.ok || !json.success) {
          const message = json.error?.message ?? 'Katalog konnte nicht geladen werden.'
          throw new Error(message)
        }

        const list = flattenFunnels(json.data ?? null)
        if (!isMounted) return

        if (list.length === 0) {
          setFunnels([])
          setState('empty')
        } else {
          setFunnels(list)
          setState('live')
        }
      } catch (err) {
        if (!isMounted) return
        setErrorMessage(err instanceof Error ? err.message : 'Unbekannter Fehler')
        setState('error')
      }
    }

    load()
    return () => {
      isMounted = false
    }
  }, [initialState, reloadKey])

  const sortedFunnels = useMemo(() => {
    return [...funnels].sort((a, b) => a.title.localeCompare(b.title))
  }, [funnels])

  if (state === 'loading') {
    return (
      <div className="min-h-screen bg-[#f5f7fa] px-4 py-6">
        <div className="w-full space-y-6">
          <div className="flex items-center justify-between">
            <div className="h-7 w-40 rounded bg-[#f3f4f6] animate-pulse" />
            <Chip variant="neutral" size="sm">
              Lädt…
            </Chip>
          </div>
          <LoadingSkeleton variant="card" count={4} />
        </div>
      </div>
    )
  }

  if (state === 'error') {
    return (
      <div className="min-h-screen bg-[#f5f7fa] px-4 py-6">
        <ErrorState
          title="Assessments konnten nicht geladen werden"
          message={errorMessage ?? 'Bitte versuchen Sie es erneut.'}
          onRetry={() => {
            setState('loading')
            setReloadKey((prev) => prev + 1)
          }}
        />
      </div>
    )
  }

  if (state === 'empty') {
    return (
      <div className="min-h-screen bg-[#f5f7fa] px-4 py-6">
        <EmptyState
          iconVariant="question"
          title="Keine Assessments verfügbar"
          message="Aktuell stehen keine Assessments bereit. Bitte später erneut prüfen."
        />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#f5f7fa] px-4 py-6">
      <div className="w-full space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold text-[#1f2937]">Assessments</h1>
          <Chip variant="neutral" size="sm">
            Katalog
          </Chip>
        </div>

        <div className="space-y-4">
          {sortedFunnels.map((funnel) => {
            const disabled = isUnavailable(funnel)
            return (
              <Card key={funnel.id} padding="lg" shadow="sm">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <h2 className="text-lg font-semibold text-[#1f2937]">
                        {funnel.title}
                      </h2>
                      {funnel.subtitle && (
                        <p className="text-sm text-[#6b7280]">{funnel.subtitle}</p>
                      )}
                    </div>
                    <Chip variant={disabled ? 'neutral' : 'primary'} size="sm">
                      {disabled ? 'Bald verfügbar' : 'Verfügbar'}
                    </Chip>
                  </div>

                  {funnel.description && (
                    <p className="text-sm text-[#6b7280]">{funnel.description}</p>
                  )}

                  <Button
                    variant={disabled ? 'secondary' : 'primary'}
                    size="md"
                    fullWidth
                    disabled={disabled}
                    onClick={() => {
                      if (disabled) return
                      router.push(`/patient/assess/${funnel.slug}/flow`)
                    }}
                  >
                    {disabled ? 'Nicht verfügbar' : 'Assessment starten'}
                  </Button>
                </div>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
