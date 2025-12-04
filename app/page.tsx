'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/navigation'

type Mode = 'login' | 'signup'

interface VersionInfo {
  commitHash: string
  commitHashShort: string
  commitDate: string
  buildDate: string
}

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null) // neu: Erfolgsmeldungen
  const [versionInfo, setVersionInfo] = useState<VersionInfo | null>(null)

  // Fetch version info on component mount
  useEffect(() => {
    fetch('/version.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then((data) => {
        // Basic validation of the response structure
        if (data && typeof data.commitHashShort === 'string' && typeof data.commitDate === 'string') {
          setVersionInfo(data)
        }
      })
      .catch((err) => console.error('Failed to load version info:', err))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)

    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()

    if (!trimmedEmail || !trimmedPassword) {
      setError('Bitte E-Mail und Passwort eingeben.')
      return
    }

    setLoading(true)

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password: trimmedPassword,
        })

        if (signUpError) throw signUpError

        // Erfolgsmeldung für Signup
        setInfo(
          'Ihr Konto wurde angelegt. Bitte prüfen Sie Ihre E-Mails, um Ihre Adresse zu bestätigen.'
        )

        return // kein sofortiger Login → User soll Mail bestätigen
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password: trimmedPassword,
        })

        if (signInError) throw signInError
      }

      // aktuellen User holen
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!user) throw new Error('Kein Benutzerprofil gefunden.')

      // patient_profile sicherstellen
      const { error: profileError } = await supabase
        .from('patient_profiles')
        .upsert(
          {
            user_id: user.id,
            full_name: user.email ?? trimmedEmail,
          },
          { onConflict: 'user_id' }
        )

      if (profileError) throw profileError

      router.push('/patient/stress-check')
    } catch (err: any) {
      console.error(err)
      const message =
        err?.message ??
        err?.error_description ??
        'Es ist ein unerwarteter Fehler aufgetreten.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const canSubmit =
    email.trim() !== '' && password.trim() !== '' && !loading

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-50 px-4 py-10">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-8">
        
        {/* Branding */}
        <div className="text-center mb-8">
          <div className="mx-auto w-14 h-14 rounded-full bg-sky-100 flex items-center justify-center">
            <span className="text-sky-600 font-semibold text-xl">R</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900 mt-3">
            Rhythmologicum Connect
          </h1>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            Willkommen! Dieser Bereich dient dem sicheren Zugang zu Ihrem 
            persönlichen Stress- & Resilienz-Programm.
          </p>
        </div>

        {/* Tabs */}
        <div className="mb-6 grid grid-cols-2 rounded-full bg-slate-100 p-1 text-sm font-medium">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`rounded-full py-2 transition ${
              mode === 'login'
                ? 'bg-white shadow-sm text-slate-900'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Einloggen
          </button>
          <button
            type="button"
            onClick={() => setMode('signup')}
            className={`rounded-full py-2 transition ${
              mode === 'signup'
                ? 'bg-white shadow-sm text-slate-900'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            Registrieren
          </button>
        </div>

        {/* Formular */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* E-Mail */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              E-Mail
            </label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            />
          </div>

          {/* Passwort */}
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">
              Passwort
            </label>
            <input
              type="password"
              required
              minLength={6}
              autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white"
            />
            <p className="mt-1 text-xs text-slate-400">Mindestens 6 Zeichen.</p>
          </div>

          {/* Fehlermeldung */}
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Erfolgsmeldung (nur Signup) */}
          {info && (
            <p className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
              {info}
            </p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full py-2.5 rounded-lg bg-sky-600 text-white text-sm font-semibold shadow-sm hover:bg-sky-700 disabled:opacity-60 transition"
          >
            {loading
              ? 'Bitte warten…'
              : mode === 'signup'
              ? 'Konto anlegen'
              : 'Einloggen'}
          </button>
        </form>

        {/* Microcopy unten */}
        <p className="mt-6 text-center text-xs text-slate-400 leading-relaxed">
          Ihre Angaben werden vertraulich behandelt und ausschließlich zur 
          Durchführung Ihrer Stress- & Resilienz-Analyse genutzt.
        </p>

        {/* Version Info */}
        {versionInfo && (
          <div className="mt-4 pt-4 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Version: <span className="font-mono">{versionInfo.commitHashShort}</span>
            </p>
            <p className="text-xs text-slate-400">
              {new Date(versionInfo.commitDate).toLocaleString('de-DE', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        )}
      </div>
    </main>
  )
}
