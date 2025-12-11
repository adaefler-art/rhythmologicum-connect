'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { featureFlags } from '@/lib/featureFlags'

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

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      await fetch('/api/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, session }),
      })
    })

    return () => subscription.unsubscribe()
  }, [])

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

  // Check for error/message query parameters from middleware redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorParam = params.get('error')
    const messageParam = params.get('message')
    
    if (errorParam && messageParam) {
      setError(messageParam)
      // Clean up URL
      window.history.replaceState({}, '', '/')
    }
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

      // Check user role to determine redirect
      const role = user.app_metadata?.role || user.user_metadata?.role

      if (role === 'clinician') {
        // Check if clinician dashboard is enabled
        if (featureFlags.CLINICIAN_DASHBOARD_ENABLED) {
          router.push('/clinician')
        } else {
          // If clinician dashboard is disabled, redirect to patient flow immediately
          router.push('/patient/funnel/stress-assessment')
        }
      } else {
        // For patients: ensure patient_profile exists
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

        router.push('/patient/funnel/stress-assessment')
      }
    } catch (err: unknown) {
      console.error(err)
      const error = err as { message?: string; error_description?: string }
      const message =
        error?.message ??
        error?.error_description ??
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
          <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-sky-600 mb-3">
            RHYTHM
          </h1>
          <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900">
            Rhythmologicum Connect
          </h2>
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
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-slate-900"
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
              className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 bg-white text-slate-900"
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

        {/* Datenschutz Link */}
        <div className="mt-3 text-center">
          <a
            href="/datenschutz"
            className="text-xs text-sky-600 hover:text-sky-700 font-medium"
          >
            Datenschutz & Datennutzung
          </a>
        </div>

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
