'use client'

import { useEffect, useMemo, useState } from 'react'
import { Badge, Button, Card, ErrorState, LoadingSpinner, PageHeader } from '@/lib/ui'
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
              <p className="text-sm text-slate-600">{filteredUsers.length} Benutzer gefunden</p>
            </div>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Suche nach E-Mail oder Rolle"
              className="w-full sm:w-80 rounded-md border border-slate-300 px-3 py-2 text-sm"
            />
          </div>

          <div className="overflow-x-auto rounded-md border border-slate-200">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    E-Mail
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Rolle
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Erstellt
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Letzter Login
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-600">
                    Aktion
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {filteredUsers.map((entry) => {
                  const pendingRole = pendingRoleByUserId[entry.id] ?? 'patient'
                  const hasRoleChange = pendingRole !== (entry.role ?? 'patient')
                  const isSaving = savingUserId === entry.id

                  return (
                    <tr key={entry.id}>
                      <td className="px-4 py-3 text-sm text-slate-800">{entry.email ?? '—'}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        <div className="flex items-center gap-2">
                          <Badge variant={getRoleBadge(entry.role)}>{entry.role ?? 'patient'}</Badge>
                          <select
                            value={pendingRole}
                            onChange={(event) =>
                              setPendingRoleByUserId((previous) => ({
                                ...previous,
                                [entry.id]: event.target.value as UserRole,
                              }))
                            }
                            className="rounded-md border border-slate-300 px-2 py-1 text-sm"
                            disabled={isSaving}
                          >
                            {ROLE_OPTIONS.map((roleOption) => (
                              <option key={roleOption} value={roleOption}>
                                {roleOption}
                              </option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{formatDateTime(entry.created_at)}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        {formatDateTime(entry.last_sign_in_at)}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        <Badge variant={entry.is_disabled ? 'danger' : 'success'}>
                          {entry.is_disabled ? 'Deaktiviert' : 'Aktiv'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={!hasRoleChange || isSaving}
                          onClick={() => updateRole(entry.id)}
                        >
                          {isSaving ? 'Speichert…' : 'Rolle speichern'}
                        </Button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </Card>
    </div>
  )
}