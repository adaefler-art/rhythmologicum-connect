'use client'

/**
 * Support Case List Component - V05-I08.4
 * 
 * Client component for displaying and creating support cases
 */

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Card, Button, Badge } from '@/lib/ui'
import { Plus, AlertCircle } from 'lucide-react'
import {
  type SupportCase,
  SUPPORT_CASE_STATUS,
  SUPPORT_CASE_CATEGORY,
  SUPPORT_CASE_PRIORITY,
  getSupportCaseStatusLabel,
  getSupportCaseStatusColor,
  getSupportCasePriorityLabel,
  getSupportCasePriorityColor,
  getSupportCaseCategoryLabel,
} from '@/lib/contracts/supportCase'
import { SupportCaseDialog } from './SupportCaseDialog'

type Props = {
  patientId: string
  patientName: string | null
}

export function SupportCaseList({ patientId, patientName }: Props) {
  const [supportCases, setSupportCases] = useState<SupportCase[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showDialog, setShowDialog] = useState(false)

  useEffect(() => {
    loadSupportCases()
  }, [patientId])

  async function loadSupportCases() {
    try {
      setLoading(true)
      setError(null)

      const response = await fetch(`/api/support-cases?patient_id=${patientId}`)
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

  async function handleCreateCase(caseData: {
    subject: string
    description: string
    category: string
    priority: string
  }) {
    try {
      const response = await fetch('/api/support-cases', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patient_id: patientId,
          subject: caseData.subject,
          description: caseData.description,
          category: caseData.category,
          priority: caseData.priority,
        }),
      })

      const data = await response.json()

      if (!data.success) {
        throw new Error(data.error?.message || 'Failed to create support case')
      }

      // Reload support cases
      await loadSupportCases()
      setShowDialog(false)
    } catch (err) {
      console.error('Error creating support case:', err)
      throw err
    }
  }

  if (loading) {
    return (
      <div className="w-full p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Support</h1>
          <p className="text-gray-600 mt-1">
            {patientName ? `Hallo ${patientName}` : 'Hallo'}, hier können Sie Support-Anfragen
            erstellen und verfolgen.
          </p>
        </div>
        <Button onClick={() => setShowDialog(true)} className="flex items-center gap-2">
          <Plus size={20} />
          Neue Anfrage
        </Button>
      </div>

      {error && (
        <Card className="p-4 border-red-200 bg-red-50">
          <div className="flex items-center gap-2 text-red-800">
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {supportCases.length === 0 ? (
          <Card className="p-8 text-center">
            <p className="text-gray-600">Noch keine Support-Anfragen vorhanden.</p>
            <p className="text-sm text-gray-500 mt-2">
              Klicken Sie auf &quot;Neue Anfrage&quot;, um eine Support-Anfrage zu erstellen.
            </p>
          </Card>
        ) : (
          supportCases.map((supportCase) => (
            <Card key={supportCase.id} className="p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900">{supportCase.subject}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge className={getSupportCaseStatusColor(supportCase.status)}>
                      {getSupportCaseStatusLabel(supportCase.status)}
                    </Badge>
                    <Badge className={getSupportCasePriorityColor(supportCase.priority)}>
                      {getSupportCasePriorityLabel(supportCase.priority)}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {getSupportCaseCategoryLabel(supportCase.category)}
                    </span>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    {new Date(supportCase.created_at).toLocaleDateString('de-DE')}
                  </p>
                  {supportCase.escalated_at && (
                    <p className="text-xs text-orange-600 mt-1">
                      Eskaliert am{' '}
                      {new Date(supportCase.escalated_at).toLocaleDateString('de-DE')}
                    </p>
                  )}
                </div>
              </div>
              {supportCase.description && (
                <p className="text-gray-700 text-sm mt-2">{supportCase.description}</p>
              )}
              {supportCase.resolution_notes && supportCase.status === SUPPORT_CASE_STATUS.RESOLVED && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded">
                  <p className="text-sm font-medium text-green-800 mb-1">Lösung:</p>
                  <p className="text-sm text-green-700">{supportCase.resolution_notes}</p>
                </div>
              )}
            </Card>
          ))
        )}
      </div>

      {showDialog && (
        <SupportCaseDialog
          onClose={() => setShowDialog(false)}
          onCreate={handleCreateCase}
        />
      )}
    </div>
  )
}
