'use client'

/**
 * Escalation Dialog - V05-I08.4
 * 
 * Dialog for escalating a support case to a clinician
 */

import { useState } from 'react'
import { Button } from '@/lib/ui'
import { X, AlertTriangle } from 'lucide-react'
import type { SupportCase } from '@/lib/contracts/supportCase'

type Props = {
  supportCase: SupportCase
  onClose: () => void
  onEscalate: (data: {
    assigned_to_role: 'clinician' | 'admin'
    assigned_to_user_id?: string
    escalation_notes?: string
    task_due_at?: string
  }) => Promise<void>
}

export function EscalationDialog({ supportCase, onClose, onEscalate }: Props) {
  const [assignedToRole, setAssignedToRole] = useState<'clinician' | 'admin'>('clinician')
  const [escalationNotes, setEscalationNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      setSubmitting(true)
      setError(null)

      await onEscalate({
        assigned_to_role: assignedToRole,
        escalation_notes: escalationNotes.trim() || undefined,
      })
    } catch (err) {
      console.error('Error escalating:', err)
      setError(err instanceof Error ? err.message : 'Fehler beim Eskalieren')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
        <div className="border-b border-gray-200 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <AlertTriangle size={24} className="text-orange-600" />
            <h2 className="text-xl font-bold text-gray-900">Support-Fall eskalieren</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={submitting}
          >
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded text-red-800 text-sm">
              {error}
            </div>
          )}

          <div className="p-4 bg-blue-50 border border-blue-200 rounded">
            <p className="text-sm text-blue-900">
              <strong>Betreff:</strong> {supportCase.subject}
            </p>
            {supportCase.description && (
              <p className="text-sm text-blue-800 mt-2">
                <strong>Beschreibung:</strong> {supportCase.description}
              </p>
            )}
          </div>

          <div>
            <label htmlFor="assigned_to_role" className="block text-sm font-medium text-gray-700 mb-2">
              Rolle zuweisen
            </label>
            <select
              id="assigned_to_role"
              value={assignedToRole}
              onChange={(e) => setAssignedToRole(e.target.value as 'clinician' | 'admin')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={submitting}
            >
              <option value="clinician">Arzt/Ärztin</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <div>
            <label htmlFor="escalation_notes" className="block text-sm font-medium text-gray-700 mb-2">
              Eskalationsnotizen
            </label>
            <textarea
              id="escalation_notes"
              value={escalationNotes}
              onChange={(e) => setEscalationNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              placeholder="Grund für die Eskalation, wichtige Hinweise..."
              disabled={submitting}
            />
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="bg-gray-200 text-gray-700 hover:bg-gray-300"
            >
              Abbrechen
            </Button>
            <Button
              type="submit"
              disabled={submitting}
              className="bg-orange-600 hover:bg-orange-700"
            >
              {submitting ? 'Wird eskaliert...' : 'Eskalieren'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
