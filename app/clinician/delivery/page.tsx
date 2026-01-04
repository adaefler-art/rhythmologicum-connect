'use client'

import { useEffect, useState, useMemo } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Badge, Button, Card, Table, LoadingSpinner, ErrorState } from '@/lib/ui'
import type { TableColumn } from '@/lib/ui/Table'
import { FileCheck, Download, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react'

type ProcessingJob = {
  id: string
  assessment_id: string
  status: string
  stage: string
  delivery_status: string
  delivery_timestamp: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

type JobRow = {
  id: string
  assessmentId: string
  status: string
  stage: string
  deliveryStatus: string
  deliveryTimestamp: string | null
  createdAt: string
  completedAt: string | null
  hasPdf: boolean // Indicates if PDF exists (not the path itself)
}

export default function DeliveryDashboardPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [jobs, setJobs] = useState<ProcessingJob[]>([])

  useEffect(() => {
    const loadJobs = async () => {
      try {
        setLoading(true)
        setError(null)

        const { data, error } = await supabase
          .from('processing_jobs')
          .select('id, assessment_id, status, stage, delivery_status, delivery_timestamp, created_at, updated_at, completed_at')
          .order('created_at', { ascending: false })
          .limit(100)

        if (error) throw error
        // Ensure delivery fields exist (may be missing in older job records)
        const jobsWithDefaults = (data ?? []).map((job: any) => ({
          ...job,
          delivery_status: job.delivery_status || 'NOT_READY',
          delivery_timestamp: job.delivery_timestamp || null,
        }))
        setJobs(jobsWithDefaults as ProcessingJob[])
      } catch (e: unknown) {
        console.error(e)
        const errorMessage =
          e instanceof Error ? e.message : 'Fehler beim Laden der Jobs.'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadJobs()
  }, [])

  // Transform jobs to row format
  const jobRows = useMemo<JobRow[]>(() => {
    return jobs.map((job) => ({
      id: job.id,
      assessmentId: job.assessment_id,
      status: job.status,
      stage: job.stage,
      deliveryStatus: job.delivery_status,
      deliveryTimestamp: job.delivery_timestamp,
      createdAt: job.created_at,
      completedAt: job.completed_at,
      hasPdf: job.delivery_status === 'DELIVERED' || job.delivery_status === 'READY',
    }))
  }, [jobs])

  // Helper functions
  const getDeliveryStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return (
          <Badge variant="success" size="sm">
            <CheckCircle className="w-3 h-3 mr-1" />
            Delivered
          </Badge>
        )
      case 'READY':
        return (
          <Badge variant="info" size="sm">
            <Clock className="w-3 h-3 mr-1" />
            Ready
          </Badge>
        )
      case 'FAILED':
        return (
          <Badge variant="danger" size="sm">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        )
      case 'NOT_READY':
      default:
        return (
          <Badge variant="secondary" size="sm">
            <AlertCircle className="w-3 h-3 mr-1" />
            Not Ready
          </Badge>
        )
    }
  }

  const getProcessingStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">Completed</Badge>
      case 'in_progress':
        return <Badge variant="info">In Progress</Badge>
      case 'failed':
        return <Badge variant="danger">Failed</Badge>
      case 'queued':
      default:
        return <Badge variant="secondary">Queued</Badge>
    }
  }

  const formatDateTime = (isoString: string | null): string => {
    if (!isoString) return '—'
    try {
      return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(isoString))
    } catch {
      return 'Datum unbekannt'
    }
  }

  const handleDownload = async (jobId: string) => {
    try {
      // Call API to get signed URL
      const response = await fetch(`/api/processing/jobs/${jobId}/download`)
      const data = await response.json()

      if (data.success && data.data.signedUrl) {
        window.open(data.data.signedUrl, '_blank')
      } else {
        alert('Download nicht verfügbar.')
      }
    } catch (err) {
      console.error('Download error:', err)
      alert('Fehler beim Download.')
    }
  }

  // Define table columns
  const columns: TableColumn<JobRow>[] = useMemo(
    () => [
      {
        header: 'Job ID',
        accessor: (row) => (
          <span className="font-mono text-xs text-slate-600 dark:text-slate-400">
            {row.id.slice(0, 8)}...
          </span>
        ),
      },
      {
        header: 'Processing Status',
        accessor: (row) => getProcessingStatusBadge(row.status),
        sortable: true,
      },
      {
        header: 'Stage',
        accessor: (row) => <span className="text-sm capitalize">{row.stage}</span>,
        sortable: true,
      },
      {
        header: 'Delivery Status',
        accessor: (row) => getDeliveryStatusBadge(row.deliveryStatus),
        sortable: true,
      },
      {
        header: 'Delivered At',
        accessor: (row) => (
          <span className="text-sm whitespace-nowrap">
            {formatDateTime(row.deliveryTimestamp)}
          </span>
        ),
        sortable: true,
      },
      {
        header: 'Created',
        accessor: (row) => (
          <span className="text-sm whitespace-nowrap">{formatDateTime(row.createdAt)}</span>
        ),
        sortable: true,
      },
      {
        header: 'Actions',
        accessor: (row) => (
          <div className="flex gap-2">
            {row.hasPdf && (
              <Button
                variant="secondary"
                size="sm"
                icon={<Download className="w-3 h-3" />}
                onClick={() => handleDownload(row.id)}
              >
                PDF
              </Button>
            )}
          </div>
        ),
      },
    ],
    []
  )

  // Calculate stats
  const stats = useMemo(() => {
    const totalJobs = jobs.length
    const delivered = jobs.filter((j) => j.delivery_status === 'DELIVERED').length
    const ready = jobs.filter((j) => j.delivery_status === 'READY').length
    const failed = jobs.filter((j) => j.delivery_status === 'FAILED').length

    return { totalJobs, delivered, ready, failed }
  }, [jobs])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" text="Lade Zustellungs-Dashboard…" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <ErrorState
          title="Fehler beim Laden"
          message={error}
          onRetry={() => window.location.reload()}
          retryText="Neu laden"
        />
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
          Delivery Dashboard
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Übersicht über Zustellungsstatus aller Processing Jobs
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Jobs */}
        <Card padding="lg" shadow="md" radius="lg" className="hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Total Jobs
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">
                {stats.totalJobs}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Alle Processing Jobs
              </p>
            </div>
            <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
              <FileCheck className="w-5 h-5 text-primary-600 dark:text-primary-400" />
            </div>
          </div>
        </Card>

        {/* Delivered */}
        <Card padding="lg" shadow="md" radius="lg" className="hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Delivered
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">
                {stats.delivered}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Erfolgreich zugestellt
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        {/* Ready */}
        <Card padding="lg" shadow="md" radius="lg" className="hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Ready
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">
                {stats.ready}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bereit zur Zustellung
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        {/* Failed */}
        <Card padding="lg" shadow="md" radius="lg" className="hover:shadow-lg transition-shadow">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Failed
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">
                {stats.failed}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Fehlgeschlagene Zustellungen
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Jobs Table */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              Processing Jobs
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              Alle Jobs mit Zustellungsstatus
            </p>
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        data={jobRows}
        keyExtractor={(row) => row.id}
        hoverable
        bordered
        emptyMessage="Noch keine Jobs vorhanden"
      />
    </div>
  )
}
