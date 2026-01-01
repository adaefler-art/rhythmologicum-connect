'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { recordConsent } from '@/lib/actions/onboarding'
import { CURRENT_CONSENT_VERSION } from '@/lib/contracts/onboarding'

export function ConsentClient() {
  const router = useRouter()
  const [agreed, setAgreed] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!agreed) {
      setError('Sie müssen den Nutzungsbedingungen zustimmen, um fortzufahren.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await recordConsent({
        consentVersion: CURRENT_CONSENT_VERSION,
        agreedToTerms: agreed,
      })

      if (result.success) {
        // Navigate to profile setup
        router.push('/patient/onboarding/profile')
      } else {
        setError(result.error || 'Fehler beim Speichern der Zustimmung')
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten')
      console.error('Consent submission error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
            Willkommen bei Rhythmologicum Connect
          </h1>
          
          <div className="prose prose-slate dark:prose-invert max-w-none mb-6">
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-3">
              Nutzungsbedingungen
            </h2>
            
            <div className="bg-slate-50 dark:bg-slate-900 rounded-md p-4 mb-4 max-h-96 overflow-y-auto border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                1. Zweck der Anwendung
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Rhythmologicum Connect ist eine frühe Testversion einer digitalen Gesundheitsanwendung 
                zur Erfassung und Bewertung von Stress und Resilienz. Die Anwendung ist nicht für den 
                klinischen Einsatz bestimmt.
              </p>

              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                2. Datenschutz
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Ihre Daten werden sicher gespeichert und nur für die Zwecke dieser Testversion verwendet. 
                Weitere Informationen finden Sie in unserer Datenschutzerklärung.
              </p>

              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                3. Einwilligung
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
                Durch die Zustimmung zu diesen Nutzungsbedingungen erklären Sie sich damit einverstanden, 
                dass Ihre Angaben gespeichert und ausgewertet werden. Sie können Ihre Einwilligung jederzeit 
                widerrufen.
              </p>

              <h3 className="text-lg font-medium text-slate-700 dark:text-slate-300 mb-2">
                4. Haftungsausschluss
              </h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">
                Die Anwendung dient ausschließlich zu Forschungs- und Testzwecken. Sie ersetzt keine 
                medizinische Diagnose oder Behandlung. Bei gesundheitlichen Beschwerden wenden Sie sich 
                bitte an einen Arzt.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={agreed}
                  onChange={(e) => setAgreed(e.target.checked)}
                  className="mt-1 h-4 w-4 rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                  disabled={isSubmitting}
                />
                <span className="text-sm text-slate-700 dark:text-slate-300">
                  Ich habe die Nutzungsbedingungen gelesen und stimme zu.
                </span>
              </label>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <div className="flex gap-3">
              <button
                type="submit"
                disabled={!agreed || isSubmitting}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors duration-200"
              >
                {isSubmitting ? 'Wird gespeichert...' : 'Zustimmen und fortfahren'}
              </button>
            </div>
          </form>

          <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">
            Version {CURRENT_CONSENT_VERSION}
          </p>
        </div>
      </div>
    </div>
  )
}
