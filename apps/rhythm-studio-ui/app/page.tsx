'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ThemeToggle, Input } from '@/lib/ui'
import { env } from '@/lib/env'
import type { ResolvedUserRole } from '@/lib/utils/roleLanding'
import { getPostLoginRedirect } from '@/lib/utils/authRedirect'

const DEFAULT_CLINICIAN_LANDING = '/clinician/triage'

type SyncSessionResult = { ok: true } | { ok: false; message: string }

async function syncServerSession(event: 'SIGNED_IN' | 'TOKEN_REFRESHED' = 'SIGNED_IN')
  : Promise<SyncSessionResult> {
  const { data } = await supabase.auth.getSession()
  const session = data.session
  if (!session) {
    return { ok: false, message: 'Keine gültige Sitzung gefunden.' }
  }

  const response = await fetch('/api/auth/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ event, session }),
  })

  let payload: { ok?: boolean; error?: { message?: string } } | null = null
  try {
    payload = (await response.json()) as { ok?: boolean; error?: { message?: string } }
  } catch {
    payload = null
  }

  if (!response.ok || payload?.ok === false) {
    return {
      ok: false,
      message: payload?.error?.message || 'Sitzung konnte nicht synchronisiert werden.',
    }
  }

  return { ok: true }
}

type ResolveRoleResult = {
  role: ResolvedUserRole
  requiresOnboarding: boolean
  reason?: string
}

type ResolveRoleOutcome =
  | { kind: 'ok'; value: ResolveRoleResult }
  | { kind: 'unauthenticated' }
  | { kind: 'fallback_patient' }

async function resolveRole(): Promise<ResolveRoleOutcome> {
  try {
    const res = await fetch('/api/auth/resolve-role', { method: 'GET', credentials: 'include' })
    if (res.status === 401) return { kind: 'unauthenticated' }
    if (!res.ok) return { kind: 'fallback_patient' }
    const json: unknown = await res.json()
    if (!json || typeof json !== 'object') return { kind: 'fallback_patient' }
    const data = (json as { data?: unknown }).data
    if (!data || typeof data !== 'object') return { kind: 'fallback_patient' }

    const role = (data as { role?: string }).role
    const requiresOnboarding = (data as { requiresOnboarding?: boolean }).requiresOnboarding
    const reason = (data as { reason?: string }).reason
    if (role === 'patient' || role === 'clinician' || role === 'admin' || role === 'nurse') {
      return { kind: 'ok', value: { role, requiresOnboarding: requiresOnboarding === true, reason } }
    }

    return { kind: 'fallback_patient' }
  } catch {
    return { kind: 'fallback_patient' }
  }
}

type OnboardingStatusResponse =
  | {
      success: true
      data: { needsConsent: boolean; needsProfile: boolean; completed: boolean }
    }
  | { success: false; error: { code: string; message: string } }

async function getPatientRedirectFromOnboardingStatus(): Promise<
  | { kind: 'ok'; path: string }
  | { kind: 'unauthenticated' }
  | { kind: 'fallback' }
> {
  try {
    const res = await fetch('/api/patient/onboarding-status', {
      method: 'GET',
      cache: 'no-store',
      credentials: 'include',
    })
    if (res.status === 401) return { kind: 'unauthenticated' }
    if (!res.ok) return { kind: 'fallback' }

    const json: unknown = await res.json()
    if (!json || typeof json !== 'object') return { kind: 'fallback' }
    const parsed = json as OnboardingStatusResponse
    if (!('success' in parsed) || parsed.success !== true) return { kind: 'fallback' }

    if (parsed.data.needsConsent) return { kind: 'ok', path: '/patient/onboarding/consent' }
    if (parsed.data.needsProfile) return { kind: 'ok', path: '/patient/onboarding/profile' }
    return { kind: 'fallback' }
  } catch {
    return { kind: 'fallback' }
  }
}

function getSafeRedirectTarget(raw: string | null): string | null {
  if (!raw) return null
  let decoded = raw
  try {
    decoded = decodeURIComponent(raw)
  } catch {
    decoded = raw
  }

  if (!decoded.startsWith('/') || decoded.startsWith('//')) return null
  return decoded
}

async function resolvePostLoginRedirect(
  role: ResolvedUserRole,
  explicitRedirect: string | null,
): Promise<string | null> {
  if (role === 'patient') {
    const onboarding = await getPatientRedirectFromOnboardingStatus()
    if (onboarding.kind === 'unauthenticated') return null
    if (onboarding.kind === 'ok') {
      return getPostLoginRedirect({ role, patientOnboardingPath: onboarding.path })
    }
  }

  if (explicitRedirect) return explicitRedirect

  if (role === 'clinician' || role === 'admin' || role === 'nurse') {
    return DEFAULT_CLINICIAN_LANDING
  }

  return getPostLoginRedirect({ role })
}

type Mode = 'login' | 'signup'

interface VersionInfo {
  deployId: string
  buildTime: string
}

function formatUtc(value?: string | null) {
  if (!value || value === 'n/a') return 'n/a'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return `${date.toISOString().slice(0, 16).replace('T', ' ')} UTC`
}

export default function LoginPage() {
  const router = useRouter()
  const [explicitRedirect, setExplicitRedirect] = useState<string | null>(null)
  const fallbackDeployId = env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID || 'n/a'
  const fallbackBuildTime = env.NEXT_PUBLIC_BUILD_TIME || 'n/a'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<Mode>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [versionInfo, setVersionInfo] = useState<VersionInfo>({
    deployId: fallbackDeployId,
    buildTime: fallbackBuildTime,
  })

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const redirectParam =
      params.get('redirectTo') || params.get('redirect') || params.get('next')
    setExplicitRedirect(getSafeRedirectTarget(redirectParam))
  }, [])

  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        const syncResult = await syncServerSession('SIGNED_IN')
        if (!syncResult.ok) {
          setError(syncResult.message)
          return
        }

        const resolved = await resolveRole()

        if (resolved.kind === 'unauthenticated') {
          return
        }

        const role = resolved.kind === 'fallback_patient' ? 'patient' : resolved.value.role

        const target = await resolvePostLoginRedirect(role, explicitRedirect)
        if (target) {
          router.replace(target)
        }
      }
    }

    checkAuthAndRedirect()
  }, [explicitRedirect, router])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        return
      }

      if (!session) {
        setError('Keine gültige Sitzung gefunden.')
        return
      }

      const response = await fetch('/api/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ event, session }),
      })

      if (!response.ok) {
        setError('Sitzung konnte nicht synchronisiert werden.')
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  useEffect(() => {
    fetch('/version.json')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`)
        }
        return res.json()
      })
      .then((data) => {
        if (data && typeof data.commitHashShort === 'string') {
          setVersionInfo({
            deployId: data.commitHashShort ?? fallbackDeployId,
            buildTime: data.buildDate ?? data.generatedAt ?? data.commitDate ?? fallbackBuildTime,
          })
        }
      })
      .catch(() => {
        setVersionInfo({ deployId: fallbackDeployId, buildTime: fallbackBuildTime })
      })
  }, [fallbackDeployId, fallbackBuildTime])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const errorParam = params.get('error')
    const messageParam = params.get('message')

    if (errorParam && messageParam) {
      setError(messageParam)
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

        setInfo('Ihr Konto wurde angelegt. Bitte prüfen Sie Ihre E-Mails, um Ihre Adresse zu bestätigen.')

        return
      }

      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      })

      if (signInError) throw signInError

      const syncResult = await syncServerSession('SIGNED_IN')
      if (!syncResult.ok) {
        setError(syncResult.message)
        return
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!user) throw new Error('Kein Benutzerprofil gefunden.')

      const resolved = await resolveRole()
      if (resolved.kind === 'unauthenticated') {
        setError('Bitte einloggen.')
        return
      }

      const role = resolved.kind === 'fallback_patient' ? 'patient' : resolved.value.role

      const target = await resolvePostLoginRedirect(role, explicitRedirect)
      if (!target) {
        setError('Bitte einloggen.')
        return
      }

      router.replace(target)
    } catch (err: unknown) {
      const thrown = err as { message?: string; error_description?: string }
      const message =
        thrown?.message ??
        thrown?.error_description ??
        'Es ist ein unerwarteter Fehler aufgetreten.'
      setError(message)
    } finally {
      setLoading(false)
    }
  }

  const canSubmit = email.trim() !== '' && password.trim() !== '' && !loading

  return (
    <main className="min-h-screen flex items-center justify-center bg-slate-100 dark:bg-slate-900 px-4 py-10 transition-colors duration-150 relative">
      <div className="absolute top-4 right-4">
        <ThemeToggle size="md" />
      </div>

      <div className="w-full max-w-5xl flex flex-col md:flex-row items-stretch gap-8">
        <div className="w-full md:w-105 rounded-3xl bg-white/80 dark:bg-slate-800/80 backdrop-blur p-8 shadow-lg transition-colors duration-150">
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
        </div>

        <div className="flex-1 rounded-3xl bg-white dark:bg-slate-800 p-8 shadow-lg transition-colors duration-150">
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

          <form onSubmit={handleSubmit} className="w-full space-y-4">
            <div className="w-full">
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                E-Mail
              </label>
              <Input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                inputSize="md"
              />
            </div>

            <div className="w-full">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Passwort
              </label>
              <Input
                id="password"
                type="password"
                required
                minLength={6}
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                inputSize="md"
                helperText="Mindestens 6 Zeichen."
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            {info && (
              <p className="text-sm text-green-600 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
                {info}
              </p>
            )}

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

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 text-sm">
              <button
                type="button"
                onClick={() => setMode(mode === 'login' ? 'signup' : 'login')}
                className="text-sky-700 dark:text-sky-400 hover:text-sky-800 dark:hover:text-sky-300 text-left"
              >
                {mode === 'login' ? 'Registrieren' : 'Zurück zum Login'}
              </button>
              {/* TODO: verify /forgot-password route for Studio app */}
              <a
                href="/forgot-password"
                className="text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white"
              >
                Passwort vergessen?
              </a>
            </div>
          </form>

          <div className="mt-6 pt-4 border-t border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400 space-y-1">
            <p>
              Deploy: <span className="font-mono">{versionInfo.deployId}</span>
            </p>
            <p>Build: {formatUtc(versionInfo.buildTime)}</p>
          </div>
        </div>
      </div>
    </main>
  )
}
