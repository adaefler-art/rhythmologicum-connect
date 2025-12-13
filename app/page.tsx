'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { featureFlags } from '@/lib/featureFlags'
import { ThemeToggle } from '@/lib/ui'
import { getRoleLandingPage, getUserRole } from '@/lib/utils/roleBasedRouting'

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

      // Get user role and determine landing page
      const role = getUserRole(user)
      
      // For patients: ensure patient_profile exists
      if (role === 'patient') {
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
      }

      // Redirect based on role
      if (role === 'clinician' && !featureFlags.CLINICIAN_DASHBOARD_ENABLED) {
        // If clinician dashboard is disabled, redirect clinicians to patient flow
        router.replace('/patient')
      } else {
        // Use role-based landing page
        const landingPage = getRoleLandingPage(user)
        router.replace(landingPage)
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
    <main className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4 py-10 transition-colors duration-150 relative">
      {/* Theme Toggle - Top Right */}
      <div className="absolute top-4 right-4">
        <ThemeToggle size="md" />
      </div>
      
      <div className="w-full max-w-5xl flex flex-col md:flex-row items-stretch gap-8">
        {/* Left column: brand + copy */}
        <div className="w-full md:w-[420px] rounded-3xl bg-white/80 dark:bg-slate-800/80 backdrop-blur p-8 shadow-lg transition-colors duration-150">
          <div className="space-y-4">
            <div>
              <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-sky-600 dark:text-sky-400">RHYTHM</h1>
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight text-slate-900 dark:text-slate-100">
                Rhythmologicum Connect
              </h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Willkommen! Dieser Bereich dient dem sicheren Zugang zu Ihrem persönlichen
              Stress- & Resilienz-Programm.
            </p>
            <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Ihre Angaben werden vertraulich behandelt und ausschließlich zur Durchführung Ihrer
              Stress- & Resilienz-Analyse genutzt.
            </p>
            <a
              href="/datenschutz"
              className="inline-flex text-sm font-medium text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300"
            >
              Datenschutz & Datennutzung
            </a>
          </div>
          {versionInfo && (
            <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-700 text-sm text-slate-500 dark:text-slate-400 space-y-1">
              <p>
                Version: <span className="font-mono">{versionInfo.commitHashShort}</span>
              </p>
              <p>
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

        {/* Right column: auth form */}
        <div className="flex-1 rounded-3xl bg-white dark:bg-slate-800 p-8 shadow-lg transition-colors duration-150">
          {/* Tabs */}
          <div className="mb-6 grid grid-cols-2 rounded-full bg-slate-100 dark:bg-slate-700 p-1 text-sm font-medium">
            <button
              type="button"
              onClick={() => setMode('login')}
              className={`rounded-full py-2 transition ${
                mode === 'login'
                  ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-slate-100'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Einloggen
            </button>
            <button
              type="button"
              onClick={() => setMode('signup')}
              className={`rounded-full py-2 transition ${
                mode === 'signup'
                  ? 'bg-white dark:bg-slate-600 shadow-sm text-slate-900 dark:text-slate-100'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              Registrieren
            </button>
          </div>

          {/* Formular */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* E-Mail */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">E-Mail</label>
              <input
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg px-3 py-2 border bg-slate-50 dark:bg-slate-700 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
              />
            </div>

            {/* Passwort */}
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Passwort</label>
              <input
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg px-3 py-2 border bg-slate-50 dark:bg-slate-700 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-sky-500 text-slate-900 dark:text-slate-100 border-slate-300 dark:border-slate-600"
              />
              <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Mindestens 6 Zeichen.</p>
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
              className="w-full rounded-xl bg-sky-600 dark:bg-sky-500 text-white px-4 py-2 font-semibold shadow-sm hover:bg-sky-700 dark:hover:bg-sky-600 disabled:opacity-60 transition"
            >
              {loading
                ? 'Bitte warten…'
                : mode === 'signup'
                ? 'Konto anlegen'
                : 'Einloggen'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
