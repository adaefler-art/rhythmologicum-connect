'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  Input,
  Label,
  LoadingSpinner,
  PageHeader,
  Select,
  Table,
  type TableColumn,
} from '@/lib/ui'
import { useActiveNavLabel } from '@/lib/contexts/NavigationContext'

type UserRole = 'patient' | 'clinician' | 'admin' | 'nurse'

type AdminUserSummary = {
  id: string
  email: string | null
  role: UserRole | null
  created_at: string | null
  last_sign_in_at: string | null
  is_disabled: boolean
}

type UsersResponse = {
  success: boolean
  data?: {
    currentUserId: string
    users: AdminUserSummary[]
    clinicians: AdminUserSummary[]
    assignmentsByPatientId: Record<string, string[]>
    assignableCliniciansByPatientId: Record<string, string[]>
  }
  error?: { message?: string }
}

const ROLE_OPTIONS: UserRole[] = ['patient', 'clinician', 'nurse', 'admin']

export const dynamic = 'force-dynamic'

export default function AdminUsersPage() {
  useActiveNavLabel('Benutzerverwaltung')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentUserId, setCurrentUserId] = useState<string>('')
  const [users, setUsers] = useState<AdminUserSummary[]>([])
  const [clinicians, setClinicians] = useState<AdminUserSummary[]>([])
  const [assignmentsByPatientId, setAssignmentsByPatientId] = useState<Record<string, string[]>>({})
  const [assignableCliniciansByPatientId, setAssignableCliniciansByPatientId] = useState<
    Record<string, string[]>
  >({})
  const [pendingAssignmentClinicianByPatientId, setPendingAssignmentClinicianByPatientId] = useState<
    Record<string, string>
  >({})
  const [search, setSearch] = useState('')
  const [pendingRoleByUserId, setPendingRoleByUserId] = useState<Record<string, UserRole>>({})
  const [savingUserId, setSavingUserId] = useState<string | null>(null)
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null)
  const [assigningPatientId, setAssigningPatientId] = useState<string | null>(null)
  const [removingAssignmentKey, setRemovingAssignmentKey] = useState<string | null>(null)
  const [isCreatingUser, setIsCreatingUser] = useState(false)
  const [newUserEmail, setNewUserEmail] = useState('')
  const [newUserPassword, setNewUserPassword] = useState('')
  const [newUserRole, setNewUserRole] = useState<UserRole>('patient')

  const loadUsers = async () => {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/admin/users', { cache: 'no-store' })
      const data = (await response.json()) as UsersResponse

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Benutzer konnten nicht geladen werden.')
      }

      const fetched = data.data?.users ?? []
      const fetchedClinicians = data.data?.clinicians ?? []
      const fetchedAssignments = data.data?.assignmentsByPatientId ?? {}
      const fetchedAssignableClinicians = data.data?.assignableCliniciansByPatientId ?? {}
      const fetchedCurrentUserId = data.data?.currentUserId ?? ''

      setCurrentUserId(fetchedCurrentUserId)
      setUsers(fetched)
      setClinicians(fetchedClinicians)
      setAssignmentsByPatientId(fetchedAssignments)
      setAssignableCliniciansByPatientId(fetchedAssignableClinicians)
      setPendingRoleByUserId(
        fetched.reduce<Record<string, UserRole>>((accumulator, entry) => {
          accumulator[entry.id] = entry.role ?? 'patient'
          return accumulator
        }, {}),
      )
      setPendingAssignmentClinicianByPatientId((previous) => {
        const patientIds = fetched
          .filter((entry) => (entry.role ?? 'patient') === 'patient')
          .map((entry) => entry.id)
        const next: Record<string, string> = {}

        for (const patientId of patientIds) {
          const compatibleClinicianIds = fetchedAssignableClinicians[patientId] ?? []
          const previousValue = previous[patientId]
          const isPreviousStillValid = compatibleClinicianIds.includes(previousValue)
          next[patientId] = isPreviousStillValid ? previousValue : (compatibleClinicianIds[0] ?? '')
        }

        return next
      })
    } catch (error) {
      console.error('Error loading users:', error)
      setError(error instanceof Error ? error.message : 'Fehler beim Laden der Benutzerverwaltung.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadUsers()
  }, [])

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase()
    if (!normalizedSearch) {
      return users
    }

    return users.filter((entry) => {
      const email = entry.email?.toLowerCase() ?? ''
      const role = entry.role?.toLowerCase() ?? ''
      return email.includes(normalizedSearch) || role.includes(normalizedSearch)
    })
  }, [users, search])

  const formatDateTime = (value: string | null) => {
    if (!value) return '—'
    try {
      return new Intl.DateTimeFormat('de-DE', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(new Date(value))
    } catch {
      return '—'
    }
  }

  const getRoleBadge = (role: UserRole | null) => {
    if (role === 'admin') return 'warning'
    if (role === 'clinician') return 'info'
    if (role === 'nurse') return 'secondary'
    return 'default'
  }

  const clinicianOptions = useMemo(
    () =>
      clinicians
        .filter((entry) => entry.email)
        .map((entry) => ({
          id: entry.id,
          label: entry.email!,
        })),
    [clinicians],
  )

  const clinicianEmailById = useMemo(
    () =>
      clinicians.reduce<Record<string, string>>((accumulator, entry) => {
        accumulator[entry.id] = entry.email ?? 'Unbekannter Arzt'
        return accumulator
      }, {}),
    [clinicians],
  )

  const updateRole = async (userId: string) => {
    const role = pendingRoleByUserId[userId]
    if (!role) return

    try {
      setSavingUserId(userId)
      setError(null)

      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, role }),
      })

      const data = (await response.json()) as {
        success: boolean
        data?: { user?: AdminUserSummary }
        error?: { message?: string }
      }

      if (!response.ok || !data.success || !data.data?.user) {
        throw new Error(data.error?.message || 'Rolle konnte nicht aktualisiert werden.')
      }

      await loadUsers()
    } catch (error) {
      console.error('Error updating role:', error)
      setError(error instanceof Error ? error.message : 'Rolle konnte nicht aktualisiert werden.')
    } finally {
      setSavingUserId(null)
    }
  }

  const createUser = async () => {
    try {
      setIsCreatingUser(true)
      setError(null)

      const response = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newUserEmail,
          password: newUserPassword,
          role: newUserRole,
        }),
      })

      const data = (await response.json()) as {
        success: boolean
        data?: { user?: AdminUserSummary }
        error?: { message?: string }
      }

      if (!response.ok || !data.success || !data.data?.user) {
        throw new Error(data.error?.message || 'Benutzer konnte nicht angelegt werden.')
      }

      await loadUsers()
      setNewUserEmail('')
      setNewUserPassword('')
      setNewUserRole('patient')
    } catch (caughtError) {
      console.error('Error creating user:', caughtError)
      setError(caughtError instanceof Error ? caughtError.message : 'Benutzer konnte nicht angelegt werden.')
    } finally {
      setIsCreatingUser(false)
    }
  }

  const deleteUser = async (userId: string) => {
    if (!userId || userId === currentUserId) {
      return
    }

    const targetUser = users.find((entry) => entry.id === userId)
    const targetLabel = targetUser?.email ?? 'diesen Benutzer'
    const confirmed = window.confirm(`Benutzer ${targetLabel} wirklich löschen?`)

    if (!confirmed) {
      return
    }

    try {
      setDeletingUserId(userId)
      setError(null)

      const response = await fetch(`/api/admin/users/${userId}`, {
        method: 'DELETE',
      })

      const data = (await response.json()) as {
        success: boolean
        error?: { message?: string }
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Benutzer konnte nicht gelöscht werden.')
      }

      await loadUsers()
    } catch (caughtError) {
      console.error('Error deleting user:', caughtError)
      setError(caughtError instanceof Error ? caughtError.message : 'Benutzer konnte nicht gelöscht werden.')
    } finally {
      setDeletingUserId(null)
    }
  }

  const assignClinician = async (patientUserId: string) => {
    const clinicianUserId = pendingAssignmentClinicianByPatientId[patientUserId]
    if (!clinicianUserId) {
      return
    }

    try {
      setAssigningPatientId(patientUserId)
      setError(null)

      const response = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientUserId, clinicianUserId }),
      })

      const data = (await response.json()) as {
        success: boolean
        error?: { message?: string }
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Arzt-Zuweisung konnte nicht gespeichert werden.')
      }

      setAssignmentsByPatientId((previous) => {
        const existing = previous[patientUserId] ?? []
        if (existing.includes(clinicianUserId)) {
          return previous
        }

        return {
          ...previous,
          [patientUserId]: [...existing, clinicianUserId],
        }
      })
    } catch (caughtError) {
      console.error('Error assigning clinician:', caughtError)
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Arzt-Zuweisung konnte nicht gespeichert werden.',
      )
    } finally {
      setAssigningPatientId(null)
    }
  }

  const removeClinicianAssignment = async (patientUserId: string, clinicianUserId: string) => {
    const removalKey = `${patientUserId}:${clinicianUserId}`

    try {
      setRemovingAssignmentKey(removalKey)
      setError(null)

      const response = await fetch('/api/admin/users', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patientUserId, clinicianUserId }),
      })

      const data = (await response.json()) as {
        success: boolean
        error?: { message?: string }
      }

      if (!response.ok || !data.success) {
        throw new Error(data.error?.message || 'Arzt-Zuweisung konnte nicht entfernt werden.')
      }

      setAssignmentsByPatientId((previous) => ({
        ...previous,
        [patientUserId]: (previous[patientUserId] ?? []).filter((entry) => entry !== clinicianUserId),
      }))
    } catch (caughtError) {
      console.error('Error removing clinician assignment:', caughtError)
      setError(
        caughtError instanceof Error
          ? caughtError.message
          : 'Arzt-Zuweisung konnte nicht entfernt werden.',
      )
    } finally {
      setRemovingAssignmentKey(null)
    }
  }

  const columns: TableColumn<AdminUserSummary>[] = [
      {
        header: 'E-Mail',
        accessor: (entry) => <span className="text-foreground">{entry.email ?? '—'}</span>,
      },
      {
        header: 'Rolle',
        accessor: (entry) => {
          const pendingRole = pendingRoleByUserId[entry.id] ?? 'patient'
          const isSaving = savingUserId === entry.id

          return (
            <div className="flex items-center gap-2">
              <Badge variant={getRoleBadge(entry.role)}>{entry.role ?? 'patient'}</Badge>
              <Select
                value={pendingRole}
                onChange={(event) =>
                  setPendingRoleByUserId((previous) => ({
                    ...previous,
                    [entry.id]: event.target.value as UserRole,
                  }))
                }
                selectSize="sm"
                disabled={isSaving}
                className="min-w-35"
              >
                {ROLE_OPTIONS.map((roleOption) => (
                  <option key={roleOption} value={roleOption}>
                    {roleOption}
                  </option>
                ))}
              </Select>
            </div>
          )
        },
      },
      {
        header: 'Erstellt',
        accessor: (entry) => <span className="text-muted-foreground">{formatDateTime(entry.created_at)}</span>,
      },
      {
        header: 'Letzter Login',
        accessor: (entry) => (
          <span className="text-muted-foreground">{formatDateTime(entry.last_sign_in_at)}</span>
        ),
      },
      {
        header: 'Status',
        accessor: (entry) => (
          <Badge variant={entry.is_disabled ? 'danger' : 'success'}>
            {entry.is_disabled ? 'Deaktiviert' : 'Aktiv'}
          </Badge>
        ),
      },
      {
        header: 'Arzt / Gruppe',
        accessor: (entry) => {
          const effectiveRole: UserRole = entry.role ?? 'patient'

          if (effectiveRole !== 'patient') {
            return <span className="text-muted-foreground">—</span>
          }

          const assignedClinicianIds = assignmentsByPatientId[entry.id] ?? []
          const compatibleClinicianIds = assignableCliniciansByPatientId[entry.id] ?? []
          const availableClinicianOptions = clinicianOptions.filter((option) =>
            compatibleClinicianIds.includes(option.id),
          )
          const selectedClinicianId = pendingAssignmentClinicianByPatientId[entry.id] ?? ''
          const isAssigning = assigningPatientId === entry.id

          return (
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                {assignedClinicianIds.length === 0 && (
                  <span className="text-xs text-muted-foreground">Kein Arzt zugewiesen</span>
                )}
                {assignedClinicianIds.map((clinicianUserId) => {
                  const removeKey = `${entry.id}:${clinicianUserId}`
                  const isRemoving = removingAssignmentKey === removeKey

                  return (
                    <div key={removeKey} className="flex items-center gap-1">
                      <Badge variant="info">{clinicianEmailById[clinicianUserId] ?? 'Arzt'}</Badge>
                      <Button
                        size="sm"
                        variant="ghost"
                        disabled={isRemoving}
                        onClick={() => removeClinicianAssignment(entry.id, clinicianUserId)}
                      >
                        {isRemoving ? 'Entfernt…' : 'Entfernen'}
                      </Button>
                    </div>
                  )
                })}
              </div>

              <div className="flex flex-col gap-2 xl:flex-row xl:items-center">
                <Select
                  value={selectedClinicianId}
                  onChange={(event) =>
                    setPendingAssignmentClinicianByPatientId((previous) => ({
                      ...previous,
                      [entry.id]: event.target.value,
                    }))
                  }
                  selectSize="sm"
                  className="min-w-44"
                  disabled={availableClinicianOptions.length === 0 || isAssigning}
                >
                  {availableClinicianOptions.length === 0 && (
                    <option value="">Keine kompatiblen Ärzte (Organisation)</option>
                  )}
                  {availableClinicianOptions.length > 0 && <option value="">Arzt auswählen…</option>}
                  {availableClinicianOptions.map((option) => (
                    <option
                      key={option.id}
                      value={option.id}
                      disabled={assignedClinicianIds.includes(option.id)}
                    >
                      {option.label}
                    </option>
                  ))}
                </Select>
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={
                    availableClinicianOptions.length === 0 ||
                    !selectedClinicianId ||
                    assignedClinicianIds.includes(selectedClinicianId) ||
                    isAssigning
                  }
                  onClick={() => assignClinician(entry.id)}
                >
                  {isAssigning ? 'Weist zu…' : 'Zuweisen'}
                </Button>
              </div>
            </div>
          )
        },
      },
      {
        header: 'Aktion',
        accessor: (entry) => {
          const pendingRole = pendingRoleByUserId[entry.id] ?? 'patient'
          const hasRoleChange = pendingRole !== (entry.role ?? 'patient')
          const isSaving = savingUserId === entry.id
          const isDeleting = deletingUserId === entry.id
          const isSelf = currentUserId === entry.id

          return (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={!hasRoleChange || isSaving || isDeleting}
                onClick={() => updateRole(entry.id)}
              >
                {isSaving ? 'Speichert…' : 'Rolle speichern'}
              </Button>
              <Button
                variant="danger"
                size="sm"
                disabled={isSelf || isDeleting || isSaving}
                onClick={() => deleteUser(entry.id)}
              >
                {isDeleting ? 'Löscht…' : 'Benutzer löschen'}
              </Button>
            </div>
          )
        },
      },
    ]

  if (loading) {
    return (
      <div className="flex items-start justify-start py-12">
        <LoadingSpinner size="lg" text="Lade Benutzerverwaltung…" centered />
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full space-y-6">
        <PageHeader
          title="Benutzerverwaltung"
          description="Rollen und Kontostatus für Studio-Benutzer verwalten"
        />

        <Card>
          <div className="p-6 sm:p-8">
            <div className="flex flex-col items-center gap-4 py-6 text-center">
              <svg
                className="h-14 w-14 text-red-500"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h2 className="text-xl font-semibold text-foreground">Benutzerverwaltung</h2>
              <p className="max-w-3xl text-sm text-muted-foreground sm:text-base">{error}</p>
              <Button variant="primary" onClick={loadUsers}>
                Erneut versuchen
              </Button>
            </div>
          </div>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Benutzerverwaltung"
        description="Rollen und Kontostatus für Studio-Benutzer verwalten"
      />

      <Card>
        <div className="p-4 sm:p-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">{filteredUsers.length} Benutzer gefunden</p>
            </div>
            <Input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Suche nach E-Mail oder Rolle"
              inputSize="sm"
              className="w-full sm:w-80"
            />
          </div>

          <div className="rounded-xl border border-border bg-card p-4">
            <p className="mb-3 text-sm font-medium text-foreground">Test-Benutzer anlegen</p>
            <div className="grid gap-4 md:grid-cols-4 md:items-end">
              <div className="space-y-2">
                <Label size="sm" htmlFor="new-user-email">
                  E-Mail
                </Label>
                <Input
                  id="new-user-email"
                  type="email"
                  value={newUserEmail}
                  onChange={(event) => setNewUserEmail(event.target.value)}
                  placeholder="E-Mail"
                  inputSize="sm"
                />
              </div>
              <div className="space-y-2">
                <Label size="sm" htmlFor="new-user-password">
                  Passwort
                </Label>
                <Input
                  id="new-user-password"
                  type="password"
                  value={newUserPassword}
                  onChange={(event) => setNewUserPassword(event.target.value)}
                  placeholder="Passwort (min. 8 Zeichen)"
                  inputSize="sm"
                />
              </div>
              <div className="space-y-2">
                <Label size="sm" htmlFor="new-user-role">
                  Rolle
                </Label>
                <Select
                  id="new-user-role"
                  value={newUserRole}
                  onChange={(event) => setNewUserRole(event.target.value as UserRole)}
                  selectSize="sm"
                >
                  {ROLE_OPTIONS.map((roleOption) => (
                    <option key={roleOption} value={roleOption}>
                      {roleOption}
                    </option>
                  ))}
                </Select>
              </div>
              <Button
                variant="secondary"
                disabled={
                  isCreatingUser ||
                  newUserEmail.trim().length === 0 ||
                  newUserPassword.trim().length < 8
                }
                onClick={createUser}
                className="h-11 md:self-end"
              >
                {isCreatingUser ? 'Legt an…' : 'Benutzer anlegen'}
              </Button>
            </div>
          </div>

          <Table
            columns={columns}
            data={filteredUsers}
            keyExtractor={(entry) => entry.id}
            striped
            emptyMessage="Keine Benutzer gefunden"
          />
        </div>
      </Card>
    </div>
  )
}