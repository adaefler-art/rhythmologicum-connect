'use client'

/**
 * Tasks Management Page - V05-I07.4
 * 
 * Clinician interface for managing tasks
 * - Create tasks (LDL measurement, video call, device shipment)
 * - View task list with filters
 * - Update task status
 */

import { useEffect, useState, useCallback, useMemo } from 'react'
import { Button, Card, Table, LoadingSpinner, ErrorState, Badge } from '@/lib/ui'
import type { TableColumn } from '@/lib/ui/Table'
import {
  ClipboardList,
  Plus,
  CheckCircle,
  Clock,
  PlayCircle,
  XCircle,
  Filter,
  User,
} from 'lucide-react'
import { 
  Task, 
  TASK_STATUS,
  TaskStatus,
  UserRole,
  USER_ROLE,
  getTaskTypeLabel,
  getTaskStatusLabel,
  getUserRoleLabel,
} from '@/lib/contracts/task'
import { supabase } from '@/lib/supabaseClient'
import { getUserRole } from '@/lib/utils/roleBasedRouting'
import TaskCreateDialog from './TaskCreateDialog'

type TaskWithPatient = Task & {
  patient_profiles: {
    id: string
    full_name: string | null
    user_id: string
  } | null
}

export default function TasksPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tasks, setTasks] = useState<TaskWithPatient[]>([])
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [statusFilter, setStatusFilter] = useState<TaskStatus | 'all'>('all')
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all')
  // currentUserRole can be 'patient' but layout ensures only clinician/nurse/admin access this page
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null)

  // Get current user's role on mount
  useEffect(() => {
    const fetchUserRole = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        const role = getUserRole(user)
        setCurrentUserRole(role)
      }
    }
    fetchUserRole()
  }, [])

  const loadTasks = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      // Build query params
      const params = new URLSearchParams()
      if (statusFilter !== 'all') {
        params.append('status', statusFilter)
      }
      if (roleFilter !== 'all') {
        params.append('assigned_to_role', roleFilter)
      }

      const response = await fetch(`/api/tasks?${params.toString()}`)
      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error?.message || 'Fehler beim Laden der Aufgaben')
      }

      setTasks(result.data ?? [])
    } catch (e: unknown) {
      console.error('Failed to load tasks:', e)
      const errorMessage = e instanceof Error ? e.message : 'Fehler beim Laden der Aufgaben.'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }, [statusFilter, roleFilter])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  const handleTaskCreated = useCallback(() => {
    setShowCreateDialog(false)
    loadTasks()
  }, [loadTasks])

  const handleUpdateStatus = useCallback(
    async (taskId: string, newStatus: TaskStatus) => {
      try {
        const response = await fetch(`/api/tasks/${taskId}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status: newStatus }),
        })

        const result = await response.json()

        if (!response.ok) {
          throw new Error(result.error?.message || 'Fehler beim Aktualisieren der Aufgabe')
        }

        // Reload tasks to show updated status
        loadTasks()
      } catch (e: unknown) {
        console.error('Failed to update task status:', e)
        const errorMessage = e instanceof Error ? e.message : 'Fehler beim Aktualisieren der Aufgabe.'
        setError(errorMessage)
      }
    },
    [loadTasks]
  )

  const getStatusBadgeVariant = useCallback((
    status: TaskStatus
  ): 'default' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' => {
    switch (status) {
      case TASK_STATUS.PENDING:
        return 'warning'
      case TASK_STATUS.IN_PROGRESS:
        return 'info'
      case TASK_STATUS.COMPLETED:
        return 'success'
      case TASK_STATUS.CANCELLED:
        return 'secondary'
      default:
        return 'default'
    }
  }, [])

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
      return 'Datum unbekannt'
    }
  }, [])

  // Calculate statistics
  const stats = useMemo(() => {
    const total = tasks.length
    const pending = tasks.filter((t) => t.status === TASK_STATUS.PENDING).length
    const inProgress = tasks.filter((t) => t.status === TASK_STATUS.IN_PROGRESS).length
    const completed = tasks.filter((t) => t.status === TASK_STATUS.COMPLETED).length

    return { total, pending, inProgress, completed }
  }, [tasks])

  // Define table columns
  const columns: TableColumn<TaskWithPatient>[] = useMemo(
    () => [
      {
        header: 'Patient:in',
        accessor: (row) => (
          <span className="font-medium text-slate-900 dark:text-slate-50">
            {row.patient_profiles?.full_name ?? 'Unbekannt'}
          </span>
        ),
        sortable: true,
      },
      {
        header: 'Aufgabe',
        accessor: (row) => (
          <span className="text-slate-900 dark:text-slate-50">{getTaskTypeLabel(row.task_type)}</span>
        ),
        sortable: true,
      },
      {
        header: 'Zugewiesen an',
        accessor: (row) => (
          <span className="text-slate-700 dark:text-slate-300">
            {getUserRoleLabel(row.assigned_to_role)}
          </span>
        ),
        sortable: true,
      },
      {
        header: 'Status',
        accessor: (row) => (
          <Badge variant={getStatusBadgeVariant(row.status)}>
            {getTaskStatusLabel(row.status)}
          </Badge>
        ),
        sortable: true,
      },
      {
        header: 'Fällig am',
        accessor: (row) =>
          row.due_at ? (
            <span className="text-slate-700 dark:text-slate-300 whitespace-nowrap">
              {formatDateTime(row.due_at)}
            </span>
          ) : (
            <span className="text-slate-400 dark:text-slate-500">—</span>
          ),
        sortable: true,
      },
      {
        header: 'Erstellt',
        accessor: (row) => (
          <span className="text-slate-600 dark:text-slate-400 text-sm whitespace-nowrap">
            {formatDateTime(row.created_at)}
          </span>
        ),
        sortable: true,
      },
      {
        header: 'Aktionen',
        accessor: (row) => (
          <div className="flex gap-2">
            {row.status === TASK_STATUS.PENDING && (
              <Button
                variant="secondary"
                size="sm"
                icon={<PlayCircle className="w-3 h-3" />}
                onClick={() => handleUpdateStatus(row.id, TASK_STATUS.IN_PROGRESS)}
              >
                Starten
              </Button>
            )}
            {row.status === TASK_STATUS.IN_PROGRESS && (
              <Button
                variant="primary"
                size="sm"
                icon={<CheckCircle className="w-3 h-3" />}
                onClick={() => handleUpdateStatus(row.id, TASK_STATUS.COMPLETED)}
              >
                Erledigt
              </Button>
            )}
            {(row.status === TASK_STATUS.PENDING || row.status === TASK_STATUS.IN_PROGRESS) && (
              <Button
                variant="danger"
                size="sm"
                icon={<XCircle className="w-3 h-3" />}
                onClick={() => handleUpdateStatus(row.id, TASK_STATUS.CANCELLED)}
              >
                Abbrechen
              </Button>
            )}
          </div>
        ),
      },
    ],
    [getStatusBadgeVariant, formatDateTime, handleUpdateStatus]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" text="Aufgaben werden geladen…" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <ErrorState
          title="Fehler beim Laden"
          message={error}
          onRetry={loadTasks}
          retryText="Neu laden"
        />
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Aufgaben
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Verwalten Sie Aufgaben für Patienten
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          icon={<Plus className="w-4 h-4" />}
          onClick={() => setShowCreateDialog(true)}
        >
          Neue Aufgabe
        </Button>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card padding="lg" shadow="md" radius="lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Gesamt
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{stats.total}</p>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <ClipboardList className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
          </div>
        </Card>

        <Card padding="lg" shadow="md" radius="lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Ausstehend
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">{stats.pending}</p>
            </div>
            <div className="p-3 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
              <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
          </div>
        </Card>

        <Card padding="lg" shadow="md" radius="lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                In Bearbeitung
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                {stats.inProgress}
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <PlayCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card padding="lg" shadow="md" radius="lg">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Abgeschlossen
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50">
                {stats.completed}
              </p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters */}
      <div className="mb-6 space-y-4">
        {/* Status Filter */}
        <Card padding="md">
          <div className="flex items-center gap-4">
            <Filter className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Status:</span>
            <div className="flex gap-2">
              <Button
                variant={statusFilter === 'all' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                Alle
              </Button>
              <Button
                variant={statusFilter === TASK_STATUS.PENDING ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setStatusFilter(TASK_STATUS.PENDING)}
              >
                Ausstehend
              </Button>
              <Button
                variant={statusFilter === TASK_STATUS.IN_PROGRESS ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setStatusFilter(TASK_STATUS.IN_PROGRESS)}
              >
                In Bearbeitung
              </Button>
              <Button
                variant={statusFilter === TASK_STATUS.COMPLETED ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setStatusFilter(TASK_STATUS.COMPLETED)}
              >
                Abgeschlossen
              </Button>
            </div>
          </div>
        </Card>

        {/* Role Filter */}
        <Card padding="md">
          <div className="flex items-center gap-4">
            <User className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Zugewiesen an:
            </span>
            <div className="flex gap-2">
              <Button
                variant={roleFilter === 'all' ? 'primary' : 'secondary'}
                size="sm"
                onClick={() => setRoleFilter('all')}
              >
                Alle
              </Button>
              {currentUserRole === 'nurse' && (
                <Button
                  variant={roleFilter === USER_ROLE.NURSE ? 'primary' : 'secondary'}
                  size="sm"
                  onClick={() => setRoleFilter(USER_ROLE.NURSE)}
                  icon={<User className="w-3 h-3" />}
                >
                  Meine Aufgaben
                </Button>
              )}
              {(currentUserRole === 'clinician' || currentUserRole === 'admin') && (
                <>
                  <Button
                    variant={roleFilter === USER_ROLE.CLINICIAN ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setRoleFilter(USER_ROLE.CLINICIAN)}
                  >
                    Clinician
                  </Button>
                  <Button
                    variant={roleFilter === USER_ROLE.NURSE ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setRoleFilter(USER_ROLE.NURSE)}
                  >
                    Nurse
                  </Button>
                  <Button
                    variant={roleFilter === USER_ROLE.ADMIN ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => setRoleFilter(USER_ROLE.ADMIN)}
                  >
                    Admin
                  </Button>
                </>
              )}
            </div>
          </div>
        </Card>
      </div>

      {/* Tasks Table */}
      <Table
        columns={columns}
        data={tasks}
        keyExtractor={(row) => row.id}
        hoverable
        bordered
        emptyMessage="Noch keine Aufgaben vorhanden"
      />

      {/* Create Task Dialog */}
      {showCreateDialog && (
        <TaskCreateDialog
          onClose={() => setShowCreateDialog(false)}
          onTaskCreated={handleTaskCreated}
        />
      )}
    </div>
  )
}
