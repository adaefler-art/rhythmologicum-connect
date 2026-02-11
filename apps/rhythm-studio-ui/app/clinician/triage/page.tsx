"use client"

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Card, Table, LoadingSpinner, ErrorState, Input, Button, Badge } from '@/lib/ui'
import { useActiveNavLabel } from '@/lib/contexts/NavigationContext'
import type { TableColumn } from '@/lib/ui/Table'
import { getClinicianInbox, type ClinicianInboxPatient } from '@/lib/fetchClinician'
import { Search, Inbox } from 'lucide-react'
import { env } from '@/lib/env'

const formatDateTime = (isoString: string | null | undefined): string => {
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

const formatPatientMeta = (patient: ClinicianInboxPatient) => {
  const parts: string[] = []
  if (typeof patient.age === 'number') {
    parts.push(`${patient.age} J.`)
  }
  if (patient.sex) {
    parts.push(patient.sex)
  }
  return parts.length > 0 ? parts.join(' · ') : '—'
}

export default function InboxPage() {
  const router = useRouter()
  const navLabel = useActiveNavLabel('Inbox')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [patients, setPatients] = useState<ClinicianInboxPatient[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')

  const loadInbox = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error } = await getClinicianInbox()
      if (error) {
        throw new Error(error.message || 'Fehler beim Laden der Inbox')
      }
      setPatients(data?.patients || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Inbox')
      setPatients([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadInbox()
  }, [loadInbox])

  const handleSearch = useCallback(() => {
    setSearchQuery(searchInput)
  }, [searchInput])

  const handleSearchKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        handleSearch()
      }
    },
    [handleSearch],
  )

  const filteredPatients = useMemo(() => {
    const trimmed = searchQuery.trim().toLowerCase()
    if (!trimmed) return patients

    return patients.filter((patient) => {
      const name = patient.name?.toLowerCase() || ''
      const id = patient.patientId?.toLowerCase() || ''
      return name.includes(trimmed) || id.includes(trimmed)
    })
  }, [patients, searchQuery])

  const columns: TableColumn<ClinicianInboxPatient>[] = useMemo(
    () => [
      {
        header: 'Patient:in',
        accessor: (row) => (
          <div className="flex flex-col gap-1">
            <span className="font-medium text-slate-900 dark:text-slate-50">{row.name}</span>
            {row.patientId && (
              <span className="text-xs text-slate-500 dark:text-slate-400">
                ID: {row.patientId.slice(0, 8)}
              </span>
            )}
          </div>
        ),
      },
      {
        header: 'Details',
        accessor: (row) => (
          <span className="text-slate-700 dark:text-slate-300">{formatPatientMeta(row)}</span>
        ),
      },
      {
        header: 'Letzter Intake',
        accessor: (row) => (
          <span className="text-slate-700 dark:text-slate-300 whitespace-nowrap">
            {formatDateTime(row.lastIntakeAt)}
          </span>
        ),
      },
      {
        header: 'Aktionen',
        accessor: (row) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => row.patientId && router.push(`/clinician/patient/${row.patientId}`)}
            icon={<Inbox className="w-4 h-4" />}
          >
            Oeffnen
          </Button>
        ),
      },
    ],
    [router],
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" text={`${navLabel ?? 'Inbox'} wird geladen…`} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <ErrorState
          title="Fehler beim Laden"
          message={error}
          onRetry={loadInbox}
          retryText="Neu laden"
        />
      </div>
    )
  }

  return (
    <div className="w-full">
      <div className="mb-8 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            {navLabel ?? 'Inbox'}
          </h1>
          <p className="text-slate-600 dark:text-slate-300">
            Zugewiesene Patient:innen
          </p>
        </div>
        <Badge variant="secondary" size="sm">
          {filteredPatients.length} Patient:innen
        </Badge>
      </div>

      <Card padding="lg" shadow="md" radius="lg" className="mb-6">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <Input
              type="text"
              placeholder="Patient:in suchen…"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              inputSize="sm"
            />
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSearch}
              icon={<Search className="w-4 h-4" />}
            >
              Suchen
            </Button>
          </div>
          {searchQuery && (
            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-full font-medium whitespace-nowrap bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 px-2 py-0.5 text-xs"
                onClick={() => {
                  setSearchQuery('')
                  setSearchInput('')
                }}
              >
                Suche: {searchQuery} ×
              </button>
            </div>
          )}
        </div>
      </Card>

      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              Zugewiesene Patient:innen
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {filteredPatients.length} Patient:innen insgesamt
            </p>
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        data={filteredPatients}
        keyExtractor={(row) => row.patientId}
        hoverable
        emptyMessage="Noch keine Patient:innen zugewiesen."
      />

      {filteredPatients.length === 0 && env.NODE_ENV !== 'production' && (
        <Card padding="md" shadow="sm" radius="lg" className="mt-6">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Hinweis (Dev): Assign via clinician_patient_assignments.
          </p>
        </Card>
      )}
    </div>
  )
}
