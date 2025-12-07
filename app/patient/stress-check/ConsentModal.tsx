'use client'

import { useState } from 'react'
import { CONSENT_TEXT, CONSENT_VERSION } from '@/lib/consentConfig'
import { supabase } from '@/lib/supabaseClient'

interface ConsentModalProps {
  userId: string
  onConsent: () => void
  onDecline: () => void
}

export default function ConsentModal({ userId, onConsent, onDecline }: ConsentModalProps) {
  const [accepted, setAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleAccept = async () => {
    if (!accepted) {
      setError('Bitte bestätigen Sie die Nutzungsbedingungen.')
      return
    }

    setSubmitting(true)
    setError(null)

    try {
      // Store consent in database
      const { error: consentError } = await supabase.from('user_consents').insert({
        user_id: userId,
        consent_version: CONSENT_VERSION,
        user_agent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
      })

      if (consentError) {
        throw consentError
      }

      // Call success callback
      onConsent()
    } catch (err) {
      console.error('Error storing consent:', err)
      const errorMessage =
        err instanceof Error ? err.message : 'Fehler beim Speichern der Zustimmung.'
      setError(errorMessage)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="max-w-2xl w-full max-h-[90vh] bg-white rounded-2xl shadow-xl flex flex-col">
        {/* Header */}
        <div className="px-6 py-5 border-b border-slate-200">
          <h2 className="text-xl font-semibold text-slate-900">{CONSENT_TEXT.title}</h2>
          <p className="text-xs text-slate-500 mt-1">Version {CONSENT_VERSION}</p>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-5">
            {CONSENT_TEXT.sections.map((section, index) => (
              <div key={index}>
                <h3 className="text-sm font-semibold text-slate-900 mb-2">
                  {section.heading}
                </h3>
                <p className="text-sm text-slate-600 leading-relaxed">{section.content}</p>
              </div>
            ))}
          </div>

          {/* Acceptance Checkbox */}
          <div className="mt-6 p-4 bg-slate-50 border border-slate-200 rounded-lg">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="mt-0.5 h-5 w-5 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
              />
              <span className="text-sm text-slate-700 leading-relaxed">
                {CONSENT_TEXT.checkboxText}
              </span>
            </label>
          </div>

          {error && (
            <p className="mt-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
          <button
            type="button"
            onClick={onDecline}
            disabled={submitting}
            className="px-4 py-2.5 rounded-lg border border-slate-300 text-slate-700 text-sm font-medium hover:bg-slate-50 disabled:opacity-60 transition"
          >
            {CONSENT_TEXT.buttons.decline}
          </button>
          <button
            type="button"
            onClick={handleAccept}
            disabled={!accepted || submitting}
            className="px-4 py-2.5 rounded-lg bg-sky-600 text-white text-sm font-semibold shadow-sm hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed transition"
          >
            {submitting ? 'Bitte warten…' : CONSENT_TEXT.buttons.accept}
          </button>
        </div>
      </div>
    </div>
  )
}
