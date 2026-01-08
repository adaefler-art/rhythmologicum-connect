'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Badge, Button, Card, Table, LoadingSpinner, ErrorState } from '@/lib/ui'
import type { TableColumn } from '@/lib/ui/Table'
import {
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter,
  RefreshCw,
  TrendingUp,
} from 'lucide-react'
import {
  REVIEW_STATUS,
  QUEUE_REASON,
  getStatusLabel,
  getQueueReasonLabel,
  type QueueItem,
} from '@/lib/contracts/reviewRecord'

type PriorityLevel = 'P0' | 'P1' | 'P2' | 'P3'

type QueueStats = {
  total: number
  pending: number
  approved: number
  rejected: number
  changesRequested: number
  p0Count: number
  p1Count: number
  p2Count: number
  p3Count: number
  overdueCount: number
}

/**
 * Determine priority level based on queue reasons
 */
function getPriority(reasons: string[]): PriorityLevel {
  // P0: SAFETY_BLOCK, VALIDATION_FAIL
  if (
    reasons.includes(QUEUE_REASON.SAFETY_BLOCK) ||
    reasons.includes(QUEUE_REASON.VALIDATION_FAIL)
  ) {
    return 'P0'
  }
  
  // P1: SAFETY_FLAG, SAFETY_UNKNOWN
  if (
    reasons.includes(QUEUE_REASON.SAFETY_FLAG) ||
    reasons.includes(QUEUE_REASON.SAFETY_UNKNOWN)
  ) {
    return 'P1'
  }
  
  // P2: VALIDATION_FLAG, MANUAL_REVIEW
  if (
    reasons.includes(QUEUE_REASON.VALIDATION_FLAG) ||
    reasons.includes(QUEUE_REASON.MANUAL_REVIEW)
  ) {
    return 'P2'
  }
  
  // P3: SAMPLED
  return 'P3'
}

/**
 * Get SLA target in hours based on priority
 */
function getSLATarget(priority: PriorityLevel): number {
  switch (priority) {
    case 'P0':
      return 2
    case 'P1':
      return 8
    case 'P2':
      return 24
    case 'P3':
      return 72
    default:
      return 24
  }
}

/**
 * Check if item is overdue based on priority
 */
function isOverdue(createdAt: string, priority: PriorityLevel): boolean {
  const now = new Date()
  const created = new Date(createdAt)
  const ageHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
  const target = getSLATarget(priority)
  return ageHours > target
}

/**
 * Check if item is approaching SLA (>75% of target)
 */
function isApproachingSLA(createdAt: string, priority: PriorityLevel): boolean {
  const now = new Date()
  const created = new Date(createdAt)
  const ageHours = (now.getTime() - created.getTime()) / (1000 * 60 * 60)
  const target = getSLATarget(priority)
  return ageHours > target * 0.75 && ageHours <= target
}

export default function ReviewQueuePage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [items, setItems] = useState<QueueItem[]>([])
  const [stats, setStats] = useState<QueueStats | null>(null)
  const [statusFilter, setStatusFilter] = useState<string>('PENDING')
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | 'ALL'>('ALL')

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams({
        status: statusFilter,
        counts: 'true',
        limit: '100',
      })

      const response = await fetch(`/api/review/queue?${params}`)
      const result = await response.json()

      if (!result.success) {
        throw new Error(result.error?.message || 'Failed to load queue')
      }

      setItems(result.data.items || [])
      
      // Build stats from counts
      if (result.data.counts) {
        const counts = result.data.counts
        const allItems = result.data.items || []
        
        // Calculate priority counts
        const p0Items = allItems.filter((item: QueueItem) => getPriority(item.queueReasons) === 'P0')
        const p1Items = allItems.filter((item: QueueItem) => getPriority(item.queueReasons) === 'P1')
        const p2Items = allItems.filter((item: QueueItem) => getPriority(item.queueReasons) === 'P2')
        const p3Items = allItems.filter((item: QueueItem) => getPriority(item.queueReasons) === 'P3')
        
        // Calculate overdue count
        const overdueItems = allItems.filter((item: QueueItem) => {
          const priority = getPriority(item.queueReasons)
          return isOverdue(item.createdAt, priority)
        })
        
        setStats({
          total: Object.values(counts).reduce((sum, count) => sum + (count || 0), 0),
          pending: counts.PENDING || 0,
          approved: counts.APPROVED || 0,
          rejected: counts.REJECTED || 0,
          changesRequested: counts.CHANGES_REQUESTED || 0,
          p0Count: p0Items.length,
          p1Count: p1Items.length,
          p2Count: p2Items.length,
          p3Count: p3Items.length,
          overdueCount: overdueItems.length,
        })
      }
    } catch (e: unknown) {
      console.error('Error loading queue:', e)
      const errorMessage = e instanceof Error ? e.message : 'Failed to load review queue'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [statusFilter])

  useEffect(() => {
    loadQueue()
  }, [loadQueue])

  // Filter items by priority
  const filteredItems = useMemo(() => {
    if (priorityFilter === 'ALL') return items
    return items.filter(item => getPriority(item.queueReasons) === priorityFilter)
  }, [items, priorityFilter])

  // Sort by priority then age
  const sortedItems = useMemo(() => {
    return [...filteredItems].sort((a, b) => {
      const aPriority = getPriority(a.queueReasons)
      const bPriority = getPriority(b.queueReasons)
      
      // Sort by priority first
      const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 }
      if (priorityOrder[aPriority] !== priorityOrder[bPriority]) {
        return priorityOrder[aPriority] - priorityOrder[bPriority]
      }
      
      // Then by age (oldest first)
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    })
  }, [filteredItems])

  const formatDateTime = useCallback((isoString: string): string => {
    try {
      return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(isoString))
    } catch {
      return 'Unknown'
    }
  }, [])

  const formatAge = useCallback((isoString: string): string => {
    try {
      const now = new Date()
      const created = new Date(isoString)
      const ageMs = now.getTime() - created.getTime()
      const ageHours = Math.floor(ageMs / (1000 * 60 * 60))
      const ageMinutes = Math.floor((ageMs % (1000 * 60 * 60)) / (1000 * 60))
      
      if (ageHours > 0) {
        return `${ageHours}h ${ageMinutes}m`
      }
      return `${ageMinutes}m`
    } catch {
      return 'Unknown'
    }
  }, [])

  const getPriorityBadgeVariant = useCallback((priority: PriorityLevel) => {
    switch (priority) {
      case 'P0':
        return 'danger' as const
      case 'P1':
        return 'warning' as const
      case 'P2':
        return 'info' as const
      case 'P3':
        return 'secondary' as const
    }
  }, [])

  const getAgeBadge = useCallback((createdAt: string, priority: PriorityLevel) => {
    if (isOverdue(createdAt, priority)) {
      return { variant: 'danger' as const, label: 'Overdue' }
    }
    if (isApproachingSLA(createdAt, priority)) {
      return { variant: 'warning' as const, label: 'Due Soon' }
    }
    return { variant: 'success' as const, label: 'On Track' }
  }, [])

  const handleRowClick = useCallback((item: QueueItem) => {
    if (item.assessmentId) {
      router.push(`/clinician/patient/${item.assessmentId}`)
    }
  }, [router])

  const columns: TableColumn<QueueItem>[] = useMemo(
    () => [
      {
        header: 'Priority',
        accessor: (row) => {
          const priority = getPriority(row.queueReasons)
          return (
            <Badge variant={getPriorityBadgeVariant(priority)} size="sm">
              {priority}
            </Badge>
          )
        },
        sortable: true,
      },
      {
        header: 'Reason',
        accessor: (row) => (
          <div className="flex flex-wrap gap-1">
            {row.queueReasons.slice(0, 2).map((reason) => (
              <Badge key={reason} variant="secondary" size="sm">
                {getQueueReasonLabel(reason)}
              </Badge>
            ))}
            {row.queueReasons.length > 2 && (
              <Badge variant="secondary" size="sm">
                +{row.queueReasons.length - 2}
              </Badge>
            )}
          </div>
        ),
      },
      {
        header: 'Age',
        accessor: (row) => (
          <div className="space-y-1">
            <span className="text-sm text-slate-900 dark:text-slate-50 font-medium">
              {formatAge(row.createdAt)}
            </span>
            <div>
              {(() => {
                const priority = getPriority(row.queueReasons)
                const badge = getAgeBadge(row.createdAt, priority)
                return (
                  <Badge variant={badge.variant} size="sm">
                    {badge.label}
                  </Badge>
                )
              })()}
            </div>
          </div>
        ),
        sortable: true,
      },
      {
        header: 'Validation',
        accessor: (row) =>
          row.validationSummary ? (
            <div className="text-sm">
              <span className="text-slate-900 dark:text-slate-50">
                {row.validationSummary.overallStatus}
              </span>
              {row.validationSummary.criticalFlagsCount > 0 && (
                <Badge variant="danger" size="sm" className="ml-2">
                  {row.validationSummary.criticalFlagsCount} critical
                </Badge>
              )}
            </div>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">—</span>
          ),
      },
      {
        header: 'Safety',
        accessor: (row) =>
          row.safetySummary ? (
            <div className="space-y-1">
              <span className="text-sm text-slate-900 dark:text-slate-50">
                {row.safetySummary.recommendedAction}
              </span>
              <div className="text-xs text-slate-600 dark:text-slate-400">
                Score: {row.safetySummary.safetyScore}/100
              </div>
            </div>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">—</span>
          ),
      },
      {
        header: 'Created',
        accessor: (row) => (
          <span className="text-sm text-slate-700 dark:text-slate-300 whitespace-nowrap">
            {formatDateTime(row.createdAt)}
          </span>
        ),
        sortable: true,
      },
    ],
    [getPriorityBadgeVariant, formatAge, getAgeBadge, formatDateTime]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" text="Loading review queue…" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <ErrorState
          title="Error Loading Queue"
          message={error}
          onRetry={loadQueue}
          retryText="Retry"
        />
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <Shield className="w-8 h-8 text-emerald-600 dark:text-emerald-400" />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50">Review Queue</h1>
          </div>
          <p className="text-slate-600 dark:text-slate-300">
            Content safety operations - flagged reports & quality sampling
          </p>
        </div>
        <Button
          variant="secondary"
          size="md"
          icon={<RefreshCw className="w-4 h-4" />}
          onClick={loadQueue}
        >
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Pending */}
          <Card padding="lg" shadow="md" radius="lg" className="hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Pending Reviews
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">
                  {stats.pending}
                </p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {stats.total} total items
                </p>
              </div>
              <div className="p-3 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                <Clock className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
            </div>
          </Card>

          {/* Overdue Items */}
          <Card padding="lg" shadow="md" radius="lg" className="hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Overdue (SLA)
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">
                  {stats.overdueCount}
                </p>
                {stats.overdueCount > 0 && (
                  <Badge variant="danger" size="sm" className="mt-1">
                    Action Required
                  </Badge>
                )}
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
            </div>
          </Card>

          {/* P0/P1 Count */}
          <Card padding="lg" shadow="md" radius="lg" className="hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                  High Priority (P0/P1)
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">
                  {stats.p0Count + stats.p1Count}
                </p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="danger" size="sm">
                    P0: {stats.p0Count}
                  </Badge>
                  <Badge variant="warning" size="sm">
                    P1: {stats.p1Count}
                  </Badge>
                </div>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                <TrendingUp className="w-5 h-5 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </Card>

          {/* Completed */}
          <Card padding="lg" shadow="md" radius="lg" className="hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Completed
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">
                  {stats.approved + stats.rejected}
                </p>
                <div className="flex gap-2 mt-1">
                  <Badge variant="success" size="sm">
                    ✓ {stats.approved}
                  </Badge>
                  <Badge variant="danger" size="sm">
                    ✗ {stats.rejected}
                  </Badge>
                </div>
              </div>
              <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card padding="md" shadow="sm" className="mb-6">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Filters:</span>
          </div>
          
          {/* Status Filter */}
          <div className="flex gap-2">
            {[
              REVIEW_STATUS.PENDING,
              REVIEW_STATUS.APPROVED,
              REVIEW_STATUS.REJECTED,
              REVIEW_STATUS.CHANGES_REQUESTED,
            ].map((status) => (
              <Button
                key={status}
                variant={statusFilter === status ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setStatusFilter(status)}
              >
                {getStatusLabel(status)}
              </Button>
            ))}
          </div>

          {/* Priority Filter */}
          <div className="flex gap-2">
            {(['ALL', 'P0', 'P1', 'P2', 'P3'] as const).map((priority) => (
              <Button
                key={priority}
                variant={priorityFilter === priority ? 'primary' : 'ghost'}
                size="sm"
                onClick={() => setPriorityFilter(priority)}
              >
                {priority}
              </Button>
            ))}
          </div>
        </div>
      </Card>

      {/* Queue Table */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              Queue Items
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {sortedItems.length} items ({statusFilter.toLowerCase()})
            </p>
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        data={sortedItems}
        keyExtractor={(row) => row.reviewId}
        hoverable
        bordered
        onRowClick={handleRowClick}
        emptyMessage="No review items in queue"
      />
    </div>
  )
}
