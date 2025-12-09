'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

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
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-600">Lade Funnels…</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
          Funnel Verwaltung
        </h1>
        <p className="text-slate-600">
          Übersicht und Verwaltung aller Funnel-Definitionen
        </p>
      </div>

      {/* Back to Dashboard */}
      <div className="mb-6">
        <Link
          href="/clinician"
          className="inline-flex items-center text-sm text-sky-600 hover:text-sky-700 font-medium"
        >
          ← Zurück zum Dashboard
        </Link>
      </div>

      {/* Funnel List */}
      {funnels.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <p className="text-slate-600">Keine Funnels gefunden.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-lg divide-y divide-slate-200">
          {funnels.map((funnel) => (
            <div
              key={funnel.id}
              className="p-6 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-slate-900 truncate">
                      {funnel.title}
                    </h3>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        funnel.is_active
                          ? 'bg-green-100 text-green-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {funnel.is_active ? 'Aktiv' : 'Inaktiv'}
                    </span>
                  </div>

                  {funnel.subtitle && (
                    <p className="text-sm text-slate-600 mb-2">{funnel.subtitle}</p>
                  )}

                  <div className="flex items-center gap-4 text-xs text-slate-500">
                    <span>Slug: {funnel.slug}</span>
                    <span>
                      Erstellt: {new Date(funnel.created_at).toLocaleDateString('de-DE')}
                    </span>
                  </div>
                </div>

                <Link
                  href={`/clinician/funnels/${funnel.id}`}
                  className="px-4 py-2 text-sm font-medium text-white bg-sky-600 hover:bg-sky-700 rounded-md transition-colors"
                >
                  Details
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
