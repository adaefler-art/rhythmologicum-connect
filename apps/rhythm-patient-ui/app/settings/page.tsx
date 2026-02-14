'use client'

import { useEffect, useState } from 'react'

type ProfileResponse = {
  success: boolean
  profile?: {
    name: {
      first_name: string | null
      last_name: string | null
      full_name: string | null
    }
    birth_date: string | null
    contact: {
      email: string | null
      phone: string | null
    }
    preferred_language: string
    consent: {
      data_processing: boolean
      contact_for_followup: boolean
    }
    communication_preference: 'email' | 'sms'
  }
  error?: {
    message?: string
  }
}

type FormState = {
  first_name: string
  last_name: string
  birth_date: string
  contact_email: string
  contact_phone: string
  preferred_language: string
  consent_data_processing: boolean
  consent_contact_for_followup: boolean
  communication_preference: 'email' | 'sms'
}

const INITIAL_FORM: FormState = {
  first_name: '',
  last_name: '',
  birth_date: '',
  contact_email: '',
  contact_phone: '',
  preferred_language: 'de',
  consent_data_processing: false,
  consent_contact_for_followup: false,
  communication_preference: 'email',
}

export default function SettingsPage() {
  const [form, setForm] = useState<FormState>(INITIAL_FORM)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let active = true

    const load = async () => {
      try {
        setLoading(true)
        setError(null)
        setMessage(null)

        const response = await fetch('/api/patient/profile', { cache: 'no-store' })
        const json = (await response.json()) as ProfileResponse

        if (!active) return

        if (!response.ok || !json.success || !json.profile) {
          throw new Error(json.error?.message ?? 'Profil konnte nicht geladen werden.')
        }

        setForm({
          first_name: json.profile.name.first_name ?? '',
          last_name: json.profile.name.last_name ?? '',
          birth_date: json.profile.birth_date ?? '',
          contact_email: json.profile.contact.email ?? '',
          contact_phone: json.profile.contact.phone ?? '',
          preferred_language: json.profile.preferred_language ?? 'de',
          consent_data_processing: Boolean(json.profile.consent.data_processing),
          consent_contact_for_followup: Boolean(json.profile.consent.contact_for_followup),
          communication_preference:
            json.profile.communication_preference === 'sms' ? 'sms' : 'email',
        })
      } catch (err) {
        if (!active) return
        setError(err instanceof Error ? err.message : 'Profil konnte nicht geladen werden.')
      } finally {
        if (active) setLoading(false)
      }
    }

    load()

    return () => {
      active = false
    }
  }, [])

  const handleChange = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)
      setMessage(null)

      const response = await fetch('/api/patient/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })

      const json = (await response.json()) as ProfileResponse

      if (!response.ok || !json.success || !json.profile) {
        throw new Error(json.error?.message ?? 'Speichern fehlgeschlagen.')
      }

      setForm({
        first_name: json.profile.name.first_name ?? '',
        last_name: json.profile.name.last_name ?? '',
        birth_date: json.profile.birth_date ?? '',
        contact_email: json.profile.contact.email ?? '',
        contact_phone: json.profile.contact.phone ?? '',
        preferred_language: json.profile.preferred_language ?? 'de',
        consent_data_processing: Boolean(json.profile.consent.data_processing),
        consent_contact_for_followup: Boolean(json.profile.consent.contact_for_followup),
        communication_preference:
          json.profile.communication_preference === 'sms' ? 'sms' : 'email',
      })

      setMessage('Einstellungen wurden gespeichert.')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Speichern fehlgeschlagen.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="min-h-screen bg-linear-to-b from-sky-50 via-slate-50 to-slate-100 px-4 py-6">
      <div className="mx-auto w-full max-w-3xl space-y-4">
        <h1 className="text-2xl font-semibold text-slate-900">Einstellungen</h1>

        {loading && (
          <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
            Profil wird geladen…
          </div>
        )}

        {error && <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</div>}
        {message && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-700">
            {message}
          </div>
        )}

        {!loading && (
          <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-slate-900">Profil & Konto</h2>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-slate-700">Vorname</span>
                <input
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.first_name}
                  onChange={(event) => handleChange('first_name', event.target.value)}
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-slate-700">Nachname</span>
                <input
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.last_name}
                  onChange={(event) => handleChange('last_name', event.target.value)}
                />
              </label>
            </div>

            <label className="space-y-1 text-sm">
              <span className="text-slate-700">Geburtsdatum (optional)</span>
              <input
                type="date"
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                value={form.birth_date}
                onChange={(event) => handleChange('birth_date', event.target.value)}
              />
            </label>

            <div className="grid gap-3 sm:grid-cols-2">
              <label className="space-y-1 text-sm">
                <span className="text-slate-700">E-Mail</span>
                <input
                  type="email"
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.contact_email}
                  onChange={(event) => handleChange('contact_email', event.target.value)}
                />
              </label>

              <label className="space-y-1 text-sm">
                <span className="text-slate-700">Telefon</span>
                <input
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  value={form.contact_phone}
                  onChange={(event) => handleChange('contact_phone', event.target.value)}
                />
              </label>
            </div>

            <label className="space-y-1 text-sm">
              <span className="text-slate-700">Bevorzugte Sprache</span>
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                value={form.preferred_language}
                onChange={(event) => handleChange('preferred_language', event.target.value)}
              >
                <option value="de">Deutsch</option>
                <option value="en">English</option>
              </select>
            </label>

            <div className="space-y-2 rounded-md border border-slate-200 p-3">
              <h3 className="font-medium text-slate-900">Einwilligungen</h3>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.consent_data_processing}
                  onChange={(event) => handleChange('consent_data_processing', event.target.checked)}
                />
                Datenverarbeitung
              </label>

              <label className="flex items-center gap-2 text-sm text-slate-700">
                <input
                  type="checkbox"
                  checked={form.consent_contact_for_followup}
                  onChange={(event) => handleChange('consent_contact_for_followup', event.target.checked)}
                />
                Kontakt für Follow-up
              </label>
            </div>

            <label className="space-y-1 text-sm">
              <span className="text-slate-700">Kommunikationspräferenz</span>
              <select
                className="w-full rounded-md border border-slate-300 px-3 py-2"
                value={form.communication_preference}
                onChange={(event) =>
                  handleChange(
                    'communication_preference',
                    event.target.value === 'sms' ? 'sms' : 'email',
                  )
                }
              >
                <option value="email">E-Mail</option>
                <option value="sms">SMS</option>
              </select>
            </label>

            <div className="pt-2">
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-sky-600 px-4 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving ? 'Speichert…' : 'Speichern'}
              </button>
            </div>
          </section>
        )}
      </div>
    </main>
  )
}
