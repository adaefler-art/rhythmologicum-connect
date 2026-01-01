'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { saveBaselineProfile, getBaselineProfile, hasUserConsented } from '@/lib/actions/onboarding'

export function ProfileClient() {
  const router = useRouter()
  const [fullName, setFullName] = useState('')
  const [birthYear, setBirthYear] = useState<string>('')
  const [sex, setSex] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function checkConsentAndLoadProfile() {
      // Check if user has consented
      const consentResult = await hasUserConsented()
      if (!consentResult.success || !consentResult.data) {
        // Redirect to consent if not consented
        router.push('/patient/onboarding/consent')
        return
      }

      // Load existing profile if any
      const profileResult = await getBaselineProfile()
      if (profileResult.success && profileResult.data) {
        const profile = profileResult.data
        setFullName(profile.full_name || '')
        setBirthYear(profile.birth_year ? String(profile.birth_year) : '')
        setSex(profile.sex || '')
      }
      
      setIsLoading(false)
    }

    checkConsentAndLoadProfile()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!fullName.trim()) {
      setError('Bitte geben Sie Ihren Namen ein.')
      return
    }

    setIsSubmitting(true)
    setError(null)

    try {
      const result = await saveBaselineProfile({
        full_name: fullName.trim(),
        birth_year: birthYear ? parseInt(birthYear, 10) : null,
        sex: sex || null,
      })

      if (result.success) {
        // Navigate to assessment page
        router.push('/patient/assessment')
      } else {
        setError(result.error || 'Fehler beim Speichern des Profils')
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten')
      console.error('Profile submission error:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
        <div className="text-slate-600 dark:text-slate-400">Lädt...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-2">
            Basisprofil erstellen
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-6">
            Bitte geben Sie einige grundlegende Informationen an. Diese Daten helfen uns, 
            Ihre Assessments besser zu verstehen.
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                id="fullName"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="Ihr vollständiger Name"
                disabled={isSubmitting}
                required
                maxLength={200}
              />
            </div>

            <div>
              <label htmlFor="birthYear" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Geburtsjahr (optional)
              </label>
              <input
                type="number"
                id="birthYear"
                value={birthYear}
                onChange={(e) => setBirthYear(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                placeholder="z.B. 1990"
                disabled={isSubmitting}
                min={1900}
                max={new Date().getFullYear()}
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                Diese Information ist optional und wird nur für statistische Zwecke verwendet.
              </p>
            </div>

            <div>
              <label htmlFor="sex" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Geschlecht (optional)
              </label>
              <select
                id="sex"
                value={sex}
                onChange={(e) => setSex(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-sky-500 focus:border-sky-500"
                disabled={isSubmitting}
              >
                <option value="">Bitte wählen</option>
                <option value="male">Männlich</option>
                <option value="female">Weiblich</option>
                <option value="other">Divers</option>
                <option value="prefer_not_to_say">Keine Angabe</option>
              </select>
            </div>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            )}

            <div className="flex gap-3 pt-2">
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-sky-600 hover:bg-sky-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors duration-200"
              >
                {isSubmitting ? 'Wird gespeichert...' : 'Profil speichern'}
              </button>
            </div>
          </form>

          <p className="mt-6 text-xs text-slate-500 dark:text-slate-400">
            <span className="text-red-500">*</span> Pflichtfeld
          </p>
        </div>
      </div>
    </div>
  )
}
