'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, Button, Badge } from '@/lib/ui'
import { Plus, Play, Pause, CheckCircle, Archive, RefreshCw } from 'lucide-react'
import type { Database } from '@/lib/types/supabase'

type PatientFunnel = {
  id: string
  patient_id: string
  funnel_id: string
  active_version_id: string | null
  status: 'active' | 'paused' | 'completed' | 'archived'
  started_at: string
  completed_at: string | null
  created_at: string
  updated_at: string | null
  funnel?: {
    id: string
    slug: string
    title: string
    pillar_id: string | null
    is_active: boolean
  } | null
  version?: {
    id: string
    version: string
    status: Database['public']['Enums']['funnel_version_status']
    published_at: string | null
  } | null
}

type FunnelsSectionProps = {
  patientId: string
}

export function FunnelsSection({ patientId }: FunnelsSectionProps) {
  const [funnels, setFunnels] = useState<PatientFunnel[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const loadFunnels = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/clinician/patients/${patientId}/funnels`)
      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? 'Failed to load funnels')
      }

      setFunnels(result.data ?? [])
    } catch (err) {
      console.error('[FunnelsSection] Load error:', err)
      setError(err instanceof Error ? err.message : 'Failed to load funnels')
    } finally {
      setLoading(false)
    }
  }, [patientId])

  useEffect(() => {
    loadFunnels()
  }, [loadFunnels])

  const handleStatusChange = async (funnelId: string, newStatus: 'active' | 'paused' | 'completed') => {
    try {
      setActionLoading(funnelId)

      const response = await fetch(`/api/clinician/patient-funnels/${funnelId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })

      const result = await response.json()

      if (!response.ok || !result.success) {
        throw new Error(result.error?.message ?? 'Failed to update status')
      }

      // Refresh funnels list
      await loadFunnels()
    } catch (err) {
      console.error('[FunnelsSection] Update error:', err)
      alert(err instanceof Error ? err.message : 'Failed to update funnel status')
    } finally {
      setActionLoading(null)
    }
  }

  const getStatusBadgeVariant = (status: string): 'success' | 'warning' | 'secondary' => {
    switch (status) {
      case 'active':
        return 'success'
      case 'paused':
        return 'warning'
      case 'completed':
        return 'secondary'
      default:
        return 'secondary'
    }
  }

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'active':
        return 'Aktiv'
      case 'paused':
        return 'Pausiert'
      case 'completed':
        return 'Abgeschlossen'
      case 'archived':
        return 'Archiviert'
      default:
        return status
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <Play className="w-4 h-4" />
      case 'paused':
        return <Pause className="w-4 h-4" />
      case 'completed':
        return <CheckCircle className="w-4 h-4" />
      case 'archived':
        return <Archive className="w-4 h-4" />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <Card padding="lg" shadow="md">
        <div className="text-center py-8">
          <p className="text-slate-600 dark:text-slate-300">Funnels werden geladen…</p>
        </div>
      </Card>
    )
  }

  if (error) {
    return (
      <Card padding="lg" shadow="md">
        <div className="text-center py-8">
          <p className="text-red-500 mb-4">{error}</p>
          <Button variant="primary" onClick={loadFunnels}>
            Erneut versuchen
          </Button>
        </div>
      </Card>
    )
  }

  if (funnels.length === 0) {
    return (
      <Card padding="lg" shadow="md">
        <div className="text-center py-8">
          <p className="text-6xl mb-4" aria-label="Funnel Symbol">
            🎯
          </p>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50 mb-2">
            Noch keine Funnels zugewiesen
          </h2>
          <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed mb-4">
            Für diese:n Patient:in sind noch keine Funnels zugewiesen.
          </p>
          {/* TODO: Add "Assign Funnel" button */}
        </div>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {/* Header with Add Button */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-50">
          Zugewiesene Funnels
        </h2>
        {/* TODO: Add "Assign New Funnel" button */}
      </div>

      {/* Funnels List */}
      {funnels.map((funnel) => (
        <Card key={funnel.id} padding="lg" shadow="md">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h3 className="text-base font-semibold text-slate-900 dark:text-slate-50">
                  {funnel.funnel?.title ?? 'Unbekannter Funnel'}
                </h3>
                <Badge variant={getStatusBadgeVariant(funnel.status)} size="sm">
                  <span className="flex items-center gap-1">
                    {getStatusIcon(funnel.status)}
                    {getStatusLabel(funnel.status)}
                  </span>
                </Badge>
              </div>

              <div className="space-y-1 text-sm text-slate-600 dark:text-slate-300">
                <p>
                  <span className="font-medium">Pillar:</span>{' '}
                  {funnel.funnel?.pillar_id ?? 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Version:</span>{' '}
                  v{funnel.version?.version ?? 'N/A'}
                </p>
                <p>
                  <span className="font-medium">Gestartet:</span>{' '}
                  {new Date(funnel.started_at).toLocaleDateString('de-DE')}
                </p>
                {funnel.completed_at && (
                  <p>
                    <span className="font-medium">Abgeschlossen:</span>{' '}
                    {new Date(funnel.completed_at).toLocaleDateString('de-DE')}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-2">
              {funnel.status === 'active' && (
                <>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStatusChange(funnel.id, 'paused')}
                    disabled={actionLoading === funnel.id}
                  >
                    <Pause className="w-4 h-4 mr-1" />
                    Pausieren
                  </Button>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStatusChange(funnel.id, 'completed')}
                    disabled={actionLoading === funnel.id}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Abschließen
                  </Button>
                </>
              )}

              {funnel.status === 'paused' && (
                <>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={() => handleStatusChange(funnel.id, 'active')}
                    disabled={actionLoading === funnel.id}
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Fortsetzen
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleStatusChange(funnel.id, 'completed')}
                    disabled={actionLoading === funnel.id}
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Abschließen
                  </Button>
                </>
              )}

              {funnel.status === 'completed' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleStatusChange(funnel.id, 'active')}
                  disabled={actionLoading === funnel.id}
                >
                  <RefreshCw className="w-4 h-4 mr-1" />
                  Reaktivieren
                </Button>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  )
}
