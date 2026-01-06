'use client'

/**
 * Update Case Dialog - V05-I08.4
 * 
 * Dialog for updating support case status and notes
 */

import { useState } from 'react'
import { Button } from '@/lib/ui'
import { X, Edit } from 'lucide-react'
import {
  type SupportCase,
  SUPPORT_CASE_STATUS,
  SUPPORT_CASE_PRIORITY,
  getSupportCaseStatusLabel,
  getSupportCasePriorityLabel,
  getValidSupportCaseStatusTransitions,
} from '@/lib/contracts/supportCase'

type Props = {
  supportCase: SupportCase
  onClose: () => void
  onUpdate: (data: {
    status?: string
    priority?: string
    notes?: string
    resolution_notes?: string
  }) => Promise<void>
}

export function UpdateCaseDialog({ supportCase, onClose, onUpdate }: Props) {
  const [status, setStatus] = useState(supportCase.status)
  const [priority, setPriority] = useState(supportCase.priority)
  const [notes, setNotes] = useState(supportCase.notes || '')
  const [resolutionNotes, setResolutionNotes] = useState(supportCase.resolution_notes || '')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validStatusTransitions = getValidSupportCaseStatusTransitions(supportCase.status)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    try {
      setSubmitting(true)
      setError(null)

      const updateData: Record<string, unknown> = {}
      if (status !== supportCase.status) updateData.status = status
      if (priority !== supportCase.priority) updateData.priority = priority
      if (notes !== (supportCase.notes || '')) updateData.notes = notes.trim() || null
      if (resolutionNotes !== (supportCase.resolution_notes || ''))
        updateData.resolution_notes = resolutionNotes.trim() || null

      await onUpdate(updateData)
    } catch (err) {
      console.error('Error updating:', err)
      setError(err instanceof Error ? err.message : 'Fehler beim Aktualisieren')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Edit size={24} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Support-Fall bearbeiten</h2>
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

          <div className="p-4 bg-gray-50 border border-gray-200 rounded">
            <p className="text-sm text-gray-900">
              <strong>Betreff:</strong> {supportCase.subject}
            </p>
          </div>

          <div>
            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={submitting}
            >
              <option value={supportCase.status}>
                {getSupportCaseStatusLabel(supportCase.status)} (Aktuell)
              </option>
              {validStatusTransitions
                .filter((s) => s !== supportCase.status)
                .map((s) => (
                  <option key={s} value={s}>
                    {getSupportCaseStatusLabel(s)}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Priorität
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={submitting}
            >
              {Object.values(SUPPORT_CASE_PRIORITY).map((prio) => (
                <option key={prio} value={prio}>
                  {getSupportCasePriorityLabel(prio)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
              Interne Notizen
            </label>
            <textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              placeholder="Interne Notizen (nicht für Patient sichtbar)..."
              disabled={submitting}
            />
          </div>

          <div>
            <label htmlFor="resolution_notes" className="block text-sm font-medium text-gray-700 mb-2">
              Lösungsnotizen
            </label>
            <textarea
              id="resolution_notes"
              value={resolutionNotes}
              onChange={(e) => setResolutionNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[100px]"
              placeholder="Wie wurde der Fall gelöst? (für Patient sichtbar)..."
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
            <Button type="submit" disabled={submitting}>
              {submitting ? 'Wird gespeichert...' : 'Speichern'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
