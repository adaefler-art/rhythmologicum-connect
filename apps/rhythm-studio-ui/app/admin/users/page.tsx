'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  Badge,
  Button,
  Card,
  ErrorState,
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
  data?: { users: AdminUserSummary[] }
  error?: { message?: string }
}

const ROLE_OPTIONS: UserRole[] = ['patient', 'clinician', 'nurse', 'admin']

export const dynamic = 'force-dynamic'

export default function AdminUsersPage() {
  const navLabel = useActiveNavLabel('Benutzerverwaltung')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [users, setUsers] = useState<AdminUserSummary[]>([])
  const [search, setSearch] = useState('')
  const [pendingRoleByUserId, setPendingRoleByUserId] = useState<Record<string, UserRole>>({})
  const [savingUserId, setSavingUserId] = useState<string | null>(null)
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
      setUsers(fetched)
      setPendingRoleByUserId(
        fetched.reduce<Record<string, UserRole>>((accumulator, entry) => {
          accumulator[entry.id] = entry.role ?? 'patient'
          return accumulator
        }, {}),
      )
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

      setUsers((previous) =>
        previous.map((entry) => (entry.id === data.data?.user?.id ? data.data.user! : entry)),
      )
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

      setUsers((previous) => [data.data!.user!, ...previous])
      setPendingRoleByUserId((previous) => ({
        ...previous,
        [data.data!.user!.id]: data.data!.user!.role ?? 'patient',
      }))
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

  const columns = useMemo<TableColumn<AdminUserSummary>[]>(
    () => [
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
        header: 'Aktion',
        accessor: (entry) => {
          const pendingRole = pendingRoleByUserId[entry.id] ?? 'patient'
          const hasRoleChange = pendingRole !== (entry.role ?? 'patient')
          const isSaving = savingUserId === entry.id

          return (
            <Button
              variant="secondary"
              size="sm"
              disabled={!hasRoleChange || isSaving}
              onClick={() => updateRole(entry.id)}
            >
              {isSaving ? 'Speichert…' : 'Rolle speichern'}
            </Button>
          )
        },
      },
    ],
    [pendingRoleByUserId, savingUserId],
  )

  if (loading) {
    return (
      <div className="flex items-start justify-start py-12">
        <LoadingSpinner size="lg" text="Lade Benutzerverwaltung…" centered />
      </div>
    )
  }

  if (error) {
    return <ErrorState title="Benutzerverwaltung" message={error} onRetry={loadUsers} />
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