'use client'

/**
 * Support Cases Management Page - V05-I08.4
 * 
 * Clinician/Staff interface for managing support cases
 * - View all support cases
 * - Filter by status, priority, category
 * - Escalate cases to clinicians (creates task + audit)
 * - Update case status and resolution notes
 */

import { useEffect, useState } from 'react'
import { Button, Card, Badge, LoadingSpinner, ErrorState } from '@/lib/ui'
import { AlertCircle, Filter } from 'lucide-react'
import {
  type SupportCase,
  SUPPORT_CASE_STATUS,
  SUPPORT_CASE_PRIORITY,
  getSupportCaseStatusLabel,
  getSupportCaseStatusColor,
  getSupportCasePriorityLabel,
  getSupportCasePriorityColor,
  getSupportCaseCategoryLabel,
  canEscalateSupportCase,
} from '@/lib/contracts/supportCase'
import { EscalationDialog } from './EscalationDialog'
import { UpdateCaseDialog } from './UpdateCaseDialog'

type SupportCaseWithPatient = SupportCase & {
  patient_profiles?: {
    id: string
    full_name: string | null
  } | null
}

export default function SupportCasesPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [supportCases, setSupportCases] = useState<SupportCaseWithPatient[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [priorityFilter, setPriorityFilter] = useState<string>('all')
  const [selectedCase, setSelectedCase] = useState<SupportCaseWithPatient | null>(null)
  const [showEscalationDialog, setShowEscalationDialog] = useState(false)
  const [showUpdateDialog, setShowUpdateDialog] = useState(false)

  useEffect(() => {
    loadSupportCases()
  }, [statusFilter, priorityFilter])

  async function loadSupportCases() {
    try {
      setLoading(true)
      setError(null)

      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.append('status', statusFilter)
      if (priorityFilter !== 'all') params.append('priority', priorityFilter)

      const response = await fetch(`/api/support-cases?${params.toString()}`)
      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to load support cases')
      }

      setSupportCases(data.data || [])
    } catch (err) {
      console.error('Error loading support cases:', err)
      setError(err instanceof Error ? err.message : 'Failed to load support cases')
    } finally {
      setLoading(false)
    }
  }

  async function handleEscalate(
    caseId: string,
    escalationData: {
      assigned_to_role: 'clinician' | 'admin'
      assigned_to_user_id?: string
      escalation_notes?: string
      task_due_at?: string
    },
  ) {
    try {
      const response = await fetch(`/api/support-cases/${caseId}/escalate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(escalationData),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to escalate support case')
      }

      await loadSupportCases()
      setShowEscalationDialog(false)
      setSelectedCase(null)
    } catch (err) {
      console.error('Error escalating support case:', err)
      throw err
    }
  }

  async function handleUpdate(
    caseId: string,
    updateData: {
      status?: string
      priority?: string
      notes?: string
      resolution_notes?: string
    },
  ) {
    try {
      const response = await fetch(`/api/support-cases/${caseId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to update support case')
      }

      await loadSupportCases()
      setShowUpdateDialog(false)
      setSelectedCase(null)
    } catch (err) {
      console.error('Error updating support case:', err)
      throw err
    }
  }

  if (loading) {
    return <LoadingSpinner message="Lade Support-Fälle..." />
  }

  if (error) {
    return <ErrorState message={error} onRetry={loadSupportCases} />
  }

  const filteredCases = supportCases

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support-Fälle</h1>
          <p className="text-gray-600 mt-1">Übersicht und Verwaltung aller Support-Anfragen</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-4">
          <Filter size={20} className="text-gray-500" />
          <div className="flex gap-4 flex-1">
            <div>
              <label htmlFor="status-filter" className="text-sm font-medium text-gray-700 mr-2">
                Status:
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Alle</option>
                {Object.values(SUPPORT_CASE_STATUS).map((status) => (
                  <option key={status} value={status}>
                    {getSupportCaseStatusLabel(status)}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="priority-filter" className="text-sm font-medium text-gray-700 mr-2">
                Priorität:
              </label>
              <select
                id="priority-filter"
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">Alle</option>
                {Object.values(SUPPORT_CASE_PRIORITY).map((priority) => (
                  <option key={priority} value={priority}>
                    {getSupportCasePriorityLabel(priority)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="text-sm text-gray-600">
            {filteredCases.length} {filteredCases.length === 1 ? 'Fall' : 'Fälle'}
          </div>
        </div>
      </Card>

      {/* Support Cases List */}
      <div className="space-y-4">
        {filteredCases.length === 0 ? (
          <Card className="p-8 text-center">
            <AlertCircle size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-600">Keine Support-Fälle gefunden.</p>
          </Card>
        ) : (
          filteredCases.map((supportCase) => (
            <Card key={supportCase.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{supportCase.subject}</h3>
                    <Badge className={getSupportCaseStatusColor(supportCase.status)}>
                      {getSupportCaseStatusLabel(supportCase.status)}
                    </Badge>
                    <Badge className={getSupportCasePriorityColor(supportCase.priority)}>
                      {getSupportCasePriorityLabel(supportCase.priority)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                    <span>{getSupportCaseCategoryLabel(supportCase.category)}</span>
                    <span>•</span>
                    <span>Patient: {supportCase.patient_profiles?.full_name || 'Unbekannt'}</span>
                    <span>•</span>
                    <span>{new Date(supportCase.created_at).toLocaleDateString('de-DE')}</span>
                    {supportCase.escalated_at && (
                      <>
                        <span>•</span>
                        <span className="text-orange-600">
                          Eskaliert am{' '}
                          {new Date(supportCase.escalated_at).toLocaleDateString('de-DE')}
                        </span>
                      </>
                    )}
                  </div>
                  {supportCase.description && (
                    <p className="text-gray-700 text-sm mb-3">{supportCase.description}</p>
                  )}
                  {supportCase.notes && (
                    <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded">
                      <p className="text-sm font-medium text-blue-800 mb-1">Interne Notizen:</p>
                      <p className="text-sm text-blue-700">{supportCase.notes}</p>
                    </div>
                  )}
                  {supportCase.resolution_notes && (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded">
                      <p className="text-sm font-medium text-green-800 mb-1">Lösung:</p>
                      <p className="text-sm text-green-700">{supportCase.resolution_notes}</p>
                    </div>
                  )}
                </div>
                <div className="flex gap-2 ml-4">
                  {canEscalateSupportCase(supportCase) && (
                    <Button
                      onClick={() => {
                        setSelectedCase(supportCase)
                        setShowEscalationDialog(true)
                      }}
                      className="bg-orange-600 hover:bg-orange-700 text-white text-sm px-3 py-1"
                    >
                      Eskalieren
                    </Button>
                  )}
                  <Button
                    onClick={() => {
                      setSelectedCase(supportCase)
                      setShowUpdateDialog(true)
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-sm px-3 py-1"
                  >
                    Bearbeiten
                  </Button>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Dialogs */}
      {showEscalationDialog && selectedCase && (
        <EscalationDialog
          supportCase={selectedCase}
          onClose={() => {
            setShowEscalationDialog(false)
            setSelectedCase(null)
          }}
          onEscalate={(data) => handleEscalate(selectedCase.id, data)}
        />
      )}

      {showUpdateDialog && selectedCase && (
        <UpdateCaseDialog
          supportCase={selectedCase}
          onClose={() => {
            setShowUpdateDialog(false)
            setSelectedCase(null)
          }}
          onUpdate={(data) => handleUpdate(selectedCase.id, data)}
        />
      )}
    </div>
  )
}
