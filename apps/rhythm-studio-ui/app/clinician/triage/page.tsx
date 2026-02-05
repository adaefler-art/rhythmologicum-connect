'use client'

import { useEffect, useState, useMemo, useCallback, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Badge, Card, Table, LoadingSpinner, ErrorState, Input, Button, Select } from '@/lib/ui'
import type { TableColumn } from '@/lib/ui/Table'
import {
  AlertTriangle,
  Search,
  MoreHorizontal,
  Flag,
  Clock as ClockIcon,
  CheckCircle,
  XCircle,
  FileText,
  Archive,
  Inbox,
  ArrowRight,
  StickyNote,
  RotateCcw,
} from 'lucide-react'

// Case state types from triage_cases_v1 view
type CaseState = 'needs_input' | 'in_progress' | 'ready_for_review' | 'resolved' | 'snoozed'

// Attention level types from triage_cases_v1 view
type AttentionLevel = 'critical' | 'warn' | 'info' | 'none'

// Next action types from triage_cases_v1 view
type NextAction =
  | 'clinician_review'
  | 'admin_investigate'
  | 'clinician_contact'
  | 'system_retry'
  | 'patient_provide_data'
  | 'patient_continue'
  | 'none'

// Triage case from API
type TriageCase = {
  case_id: string
  patient_id: string
  funnel_id: string
  funnel_slug: string
  first_name: string | null
  last_name: string | null
  preferred_name: string | null
  patient_display: string
  case_state: CaseState
  attention_items: string[] | null
  attention_level: AttentionLevel
  next_action: NextAction
  assigned_at: string
  last_activity_at: string
  updated_at: string
  completed_at: string | null
  is_active: boolean
  snoozed_until: string | null
  priority_score: number
}

export default function InboxPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [cases, setCases] = useState<TriageCase[]>([])
  
  // Filter states
  const [showActive, setShowActive] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchInput, setSearchInput] = useState('')
  const [statusFilter, setStatusFilter] = useState<CaseState | ''>('')
  const [attentionFilter, setAttentionFilter] = useState<AttentionLevel | ''>('')
  
  // Row action dropdown state
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // Load triage data from API
  const loadTriageData = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      // Build query parameters
      const params = new URLSearchParams()
      params.set('activeOnly', showActive.toString())
      
      if (searchQuery.trim()) {
        params.set('q', searchQuery.trim())
      }
      
      if (statusFilter) {
        params.set('status', statusFilter)
      }
      
      if (attentionFilter) {
        params.set('attention', attentionFilter)
      }

      const response = await fetch(`/api/clinician/triage?${params.toString()}`)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        throw new Error(errorData?.error?.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      
      if (!data.success) {
        throw new Error(data.error?.message || 'API returned error')
      }

      setCases(data.data?.cases || [])
    } catch (err) {
      console.error('Failed to load triage cases:', err)
      setError(err instanceof Error ? err.message : 'Fehler beim Laden der Inbox-Daten')
      setCases([])
    } finally {
      setLoading(false)
    }
  }, [showActive, searchQuery, statusFilter, attentionFilter])

  // Load data on mount and when filters change
  useEffect(() => {
    loadTriageData()
  }, [loadTriageData])

  // Handle search submit
  const handleSearch = useCallback(() => {
    setSearchQuery(searchInput)
  }, [searchInput])

  // Handle search key press
  const handleSearchKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter') {
        handleSearch()
      }
    },
    [handleSearch]
  )

  // Calculate statistics
  const stats = useMemo(() => {
    const critical = cases.filter((c) => c.attention_level === 'critical').length
    const warn = cases.filter((c) => c.attention_level === 'warn').length
    const readyForReview = cases.filter((c) => c.case_state === 'ready_for_review').length
    const needsInput = cases.filter((c) => c.case_state === 'needs_input').length

    return { critical, warn, readyForReview, needsInput, total: cases.length }
  }, [cases])

  // Get badge for case state
  const getCaseStateBadge = useCallback((state: CaseState) => {
    switch (state) {
      case 'needs_input':
        return { variant: 'secondary' as const, label: 'Eingabe erforderlich' }
      case 'in_progress':
        return { variant: 'info' as const, label: 'In Bearbeitung' }
      case 'ready_for_review':
        return { variant: 'default' as const, label: 'Bereit zur Prüfung' }
      case 'resolved':
        return { variant: 'success' as const, label: 'Abgeschlossen' }
      case 'snoozed':
        return { variant: 'secondary' as const, label: 'Zurückgestellt' }
    }
  }, [])

  // Get badge for attention level
  const getAttentionBadge = useCallback((level: AttentionLevel) => {
    switch (level) {
      case 'critical':
        return { variant: 'danger' as const, label: 'Kritisch', icon: AlertTriangle }
      case 'warn':
        return { variant: 'warning' as const, label: 'Warnung', icon: AlertTriangle }
      case 'info':
        return { variant: 'info' as const, label: 'Info', icon: FileText }
      case 'none':
        return null
    }
  }, [])

  // Get next action label
  const getNextActionLabel = useCallback((action: NextAction) => {
    switch (action) {
      case 'clinician_review':
        return 'Klinische Prüfung'
      case 'admin_investigate':
        return 'Admin-Untersuchung'
      case 'clinician_contact':
        return 'Patientenkontakt'
      case 'system_retry':
        return 'Systemwiederholung'
      case 'patient_provide_data':
        return 'Daten bereitstellen'
      case 'patient_continue':
        return 'Fortsetzen'
      case 'none':
        return 'Keine Aktion'
    }
  }, [])

  // Format datetime
  const formatDateTime = useCallback((isoString: string | null): string => {
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
  }, [])

  // Handle row click
  const handleRowClick = useCallback(
    (triageCase: TriageCase) => {
      router.push(`/clinician/patient/${triageCase.patient_id}`)
    },
    [router]
  )

  // Toggle dropdown
  const toggleDropdown = useCallback((caseId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    setOpenDropdownId((prev) => (prev === caseId ? null : caseId))
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdownId(null)
      }
    }

    if (openDropdownId) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [openDropdownId])

  // Row action handlers (placeholders for future backend implementation)
  const handleRowAction = useCallback(
    (action: string, triageCase: TriageCase, e: React.MouseEvent) => {
      e.stopPropagation()
      setOpenDropdownId(null)
      
      // TODO: Implement backend API calls for row actions
      console.log(`Action "${action}" triggered for case ${triageCase.case_id}`)
      alert(`Aktion "${action}" wird in einer zukünftigen Version implementiert.`)
    },
    []
  )

  // Define table columns
  const columns: TableColumn<TriageCase>[] = useMemo(
    () => [
      {
        header: 'Patient:in',
        accessor: (row) => (
          <span className="font-medium text-slate-900 dark:text-slate-50">
            {row.patient_display}
          </span>
        ),
        sortable: true,
      },
      {
        header: 'Funnel / Episode',
        accessor: (row) => (
          <span className="text-slate-700 dark:text-slate-300">
            {row.funnel_slug}
          </span>
        ),
        sortable: true,
      },
      {
        header: 'Status',
        accessor: (row) => {
          const stateBadge = getCaseStateBadge(row.case_state)
          return (
            <div className="flex flex-col gap-1">
              <Badge variant={stateBadge.variant}>{stateBadge.label}</Badge>
            </div>
          )
        },
        sortable: true,
      },
      {
        header: 'Gründe',
        accessor: (row) => {
          const attentionBadge = getAttentionBadge(row.attention_level)
          if (!attentionBadge) return <span className="text-slate-500 dark:text-slate-400">—</span>
          
          return (
            <div className="flex flex-wrap gap-1">
              <Badge variant={attentionBadge.variant} size="sm">
                {attentionBadge.label}
              </Badge>
              {row.attention_items && row.attention_items.length > 0 && (
                <span className="text-xs text-slate-500 dark:text-slate-400">
                  +{row.attention_items.length}
                </span>
              )}
            </div>
          )
        },
      },
      {
        header: 'Nächste Aktion',
        accessor: (row) => (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation()
              handleRowClick(row)
            }}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            {getNextActionLabel(row.next_action)}
          </Button>
        ),
      },
      {
        header: 'Letzte Aktivität',
        accessor: (row) => (
          <span className="text-slate-700 dark:text-slate-300 whitespace-nowrap">
            {formatDateTime(row.last_activity_at)}
          </span>
        ),
        sortable: true,
      },
      {
        header: 'Aktionen',
        accessor: (row) => (
          <div className="relative" ref={openDropdownId === row.case_id ? dropdownRef : null}>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => toggleDropdown(row.case_id, e)}
              icon={<MoreHorizontal className="w-4 h-4" />}
            >
            </Button>
            
            {openDropdownId === row.case_id && (
              <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-lg z-50">
                <div className="py-1">
                  <button
                    onClick={(e) => handleRowAction('flag', row, e)}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <Flag className="w-4 h-4" />
                    Markieren
                  </button>
                  <button
                    onClick={(e) => handleRowAction('snooze', row, e)}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <ClockIcon className="w-4 h-4" />
                    Zurückstellen
                  </button>
                  <button
                    onClick={(e) => handleRowAction('close', row, e)}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    Schließen
                  </button>
                  <button
                    onClick={(e) => handleRowAction('reopen', row, e)}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Wiedereröffnen
                  </button>
                  <button
                    onClick={(e) => handleRowAction('note', row, e)}
                    className="w-full px-4 py-2 text-left text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 flex items-center gap-2"
                  >
                    <StickyNote className="w-4 h-4" />
                    Notiz hinzufügen
                  </button>
                </div>
              </div>
            )}
          </div>
        ),
      },
    ],
    [getCaseStateBadge, getAttentionBadge, getNextActionLabel, formatDateTime, handleRowClick, toggleDropdown, openDropdownId, handleRowAction]
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <LoadingSpinner size="md" text="Inbox wird geladen…" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center py-12">
        <ErrorState
          title="Fehler beim Laden"
          message={error}
          onRetry={loadTriageData}
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
          Inbox
        </h1>
        <p className="text-slate-600 dark:text-slate-300">
          Handlungsbedarf und Aufmerksamkeitselemente
        </p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Critical Cases */}
        <Card
          padding="lg"
          shadow="md"
          radius="lg"
          className="hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Kritisch
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">
                {stats.critical}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sofortige Aufmerksamkeit
              </p>
            </div>
            <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
          </div>
        </Card>

        {/* Warning Cases */}
        <Card
          padding="lg"
          shadow="md"
          radius="lg"
          className="hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Warnungen
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">
                {stats.warn}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Aufmerksamkeit erforderlich</p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
          </div>
        </Card>

        {/* Ready for Review */}
        <Card
          padding="lg"
          shadow="md"
          radius="lg"
          className="hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Bereit zur Prüfung
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">
                {stats.readyForReview}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Wartend auf Freigabe
              </p>
            </div>
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <CheckCircle className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        {/* Needs Input */}
        <Card
          padding="lg"
          shadow="md"
          radius="lg"
          className="hover:shadow-lg transition-shadow"
        >
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mb-1">
                Eingabe erforderlich
              </p>
              <p className="text-3xl font-bold text-slate-900 dark:text-slate-50 mb-1">
                {stats.needsInput}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Wartet auf Daten
              </p>
            </div>
            <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-lg">
              <ClockIcon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
            </div>
          </div>
        </Card>
      </div>

      {/* Filters Section */}
      <Card padding="lg" shadow="md" radius="lg" className="mb-6">
        <div className="flex flex-col gap-4">
          {/* Active/Archive Toggle */}
          <div className="flex gap-2">
            <Button
              variant={showActive ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setShowActive(true)}
              icon={<Inbox className="w-4 h-4" />}
            >
              Aktiv
            </Button>
            <Button
              variant={!showActive ? 'primary' : 'outline'}
              size="sm"
              onClick={() => setShowActive(false)}
              icon={<Archive className="w-4 h-4" />}
            >
              Archiv
            </Button>
          </div>

          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="md:col-span-2">
              <div className="flex gap-2">
                <Input
                  type="text"
                  placeholder="Patient oder Funnel suchen…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
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
            </div>

            {/* Status Filter */}
            <div>
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as CaseState | '')}
                selectSize="sm"
              >
                <option value="">Alle Status</option>
                <option value="needs_input">Eingabe erforderlich</option>
                <option value="in_progress">In Bearbeitung</option>
                <option value="ready_for_review">Bereit zur Prüfung</option>
                <option value="resolved">Abgeschlossen</option>
                <option value="snoozed">Zurückgestellt</option>
              </Select>
            </div>

            {/* Attention Filter */}
            <div>
              <Select
                value={attentionFilter}
                onChange={(e) => setAttentionFilter(e.target.value as AttentionLevel | '')}
                selectSize="sm"
              >
                <option value="">Alle Prioritäten</option>
                <option value="critical">Kritisch</option>
                <option value="warn">Warnung</option>
                <option value="info">Info</option>
                <option value="none">Keine</option>
              </Select>
            </div>
          </div>

          {/* Active Filter Chips */}
          {(searchQuery || statusFilter || attentionFilter) && (
            <div className="flex gap-2 flex-wrap">
              {searchQuery && (
                <Badge
                  variant="secondary"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => {
                    setSearchQuery('')
                    setSearchInput('')
                  }}
                >
                  Suche: {searchQuery} ×
                </Badge>
              )}
              {statusFilter && (
                <Badge
                  variant="secondary"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => setStatusFilter('')}
                >
                  Status: {getCaseStateBadge(statusFilter).label} ×
                </Badge>
              )}
              {attentionFilter && (
                <Badge
                  variant="secondary"
                  size="sm"
                  className="cursor-pointer"
                  onClick={() => setAttentionFilter('')}
                >
                  Priorität: {getAttentionBadge(attentionFilter)?.label} ×
                </Badge>
              )}
            </div>
          )}
        </div>
      </Card>

      {/* Cases Table */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-slate-50">
              {showActive ? 'Aktive Fälle' : 'Archivierte Fälle'}
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-300 mt-1">
              {stats.total} Fälle insgesamt
            </p>
          </div>
        </div>
      </div>

      <Table
        columns={columns}
        data={cases}
        keyExtractor={(row) => row.case_id}
        hoverable
        bordered
        onRowClick={handleRowClick}
        emptyMessage="Keine Fälle gefunden"
      />
    </div>
  )
}
