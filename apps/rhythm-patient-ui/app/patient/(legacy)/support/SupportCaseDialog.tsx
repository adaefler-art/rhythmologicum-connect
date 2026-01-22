'use client'

/**
 * Support Case Dialog Component - V05-I08.4
 * 
 * Dialog for creating a new support case
 */

import { useState } from 'react'
import { Button } from '@/lib/ui'
import { X } from 'lucide-react'
import {
  type SupportCaseCategory,
  type SupportCasePriority,
  SUPPORT_CASE_CATEGORY,
  SUPPORT_CASE_PRIORITY,
  getSupportCaseCategoryLabel,
  getSupportCasePriorityLabel,
} from '@/lib/contracts/supportCase'

type Props = {
  onClose: () => void
  onCreate: (caseData: {
    subject: string
    description: string
    category: string
    priority: string
  }) => Promise<void>
}

export function SupportCaseDialog({ onClose, onCreate }: Props) {
  const [subject, setSubject] = useState('')
  const [description, setDescription] = useState('')
  const [category, setCategory] = useState<SupportCaseCategory>(SUPPORT_CASE_CATEGORY.GENERAL)
  const [priority, setPriority] = useState<SupportCasePriority>(SUPPORT_CASE_PRIORITY.MEDIUM)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()

    if (!subject.trim()) {
      setError('Bitte geben Sie einen Betreff ein')
      return
    }

    try {
      setSubmitting(true)
      setError(null)

      await onCreate({
        subject: subject.trim(),
        description: description.trim(),
        category,
        priority,
      })
    } catch (err) {
      console.error('Error creating support case:', err)
      setError(err instanceof Error ? err.message : 'Fehler beim Erstellen der Anfrage')
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-6 flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-900">Neue Support-Anfrage</h2>
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

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
              Betreff <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Kurze Zusammenfassung Ihrer Anfrage"
              maxLength={200}
              required
              disabled={submitting}
            />
            <p className="text-xs text-gray-500 mt-1">{subject.length}/200 Zeichen</p>
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Kategorie
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value as SupportCaseCategory)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={submitting}
            >
              {Object.values(SUPPORT_CASE_CATEGORY).map((cat) => (
                <option key={cat} value={cat}>
                  {getSupportCaseCategoryLabel(cat)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
              Dringlichkeit
            </label>
            <select
              id="priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value as SupportCasePriority)}
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
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Beschreibung
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 min-h-[120px]"
              placeholder="Detaillierte Beschreibung Ihrer Anfrage..."
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
              {submitting ? 'Wird erstellt...' : 'Anfrage erstellen'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
