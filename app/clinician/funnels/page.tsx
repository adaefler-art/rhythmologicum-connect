'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button, Card, Badge } from '@/lib/ui'

export const dynamic = 'force-dynamic'

type Funnel = {
  id: string
  slug: string
  title: string
  subtitle: string | null
  description: string | null
  is_active: boolean
  created_at: string
  updated_at: string
}

export default function FunnelListPage() {
  const [funnels, setFunnels] = useState<Funnel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadFunnels()
  }, [])

  const loadFunnels = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/funnels')
      
      if (!response.ok) {
        throw new Error('Failed to load funnels')
      }

      const data = await response.json()
      setFunnels(data.funnels || [])
    } catch (err) {
      console.error('Error loading funnels:', err)
      setError('Fehler beim Laden der Funnels')
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-600 dark:text-slate-300">Lade Funnels…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto">
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <p className="text-red-800 dark:text-red-300">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
          Funnel Verwaltung
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Übersicht und Verwaltung aller Funnel-Definitionen
        </p>
      </div>

      {/* Back to Dashboard */}
      <div className="mb-6">
        <Link
          href="/clinician"
          className="inline-flex items-center text-sm text-sky-600 dark:text-sky-400 hover:text-sky-700 dark:hover:text-sky-300 font-medium"
        >
          ← Zurück zum Dashboard
        </Link>
      </div>

      {/* Funnel List */}
      {funnels.length === 0 ? (
        <Card padding="lg">
          <p className="text-slate-600 dark:text-slate-300 text-center">Keine Funnels gefunden.</p>
        </Card>
      ) : (
        <div className="space-y-4">
          {funnels.map((funnel) => (
            <Card key={funnel.id} padding="lg" interactive>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-50 truncate">
                      {funnel.title}
                    </h3>
                    <Badge variant={funnel.is_active ? 'success' : 'secondary'} size="sm">
                      {funnel.is_active ? 'Aktiv' : 'Inaktiv'}
                    </Badge>
                  </div>

                  {funnel.subtitle && (
                    <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">{funnel.subtitle}</p>
                  )}

                  {funnel.description && (
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">{funnel.description}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-400 dark:text-slate-500">
                    <span>ID: {funnel.slug}</span>
                    <span>•</span>
                    <span>
                      Erstellt: {new Date(funnel.created_at).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                </div>

                <Link href={`/clinician/funnels/${funnel.id}`}>
                  <Button variant="primary" size="sm">
                    Details
                  </Button>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
