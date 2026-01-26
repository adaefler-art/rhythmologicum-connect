'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { ThemeToggle, Input } from '@/lib/ui'
import type { ResolvedUserRole } from '@/lib/utils/roleLanding'
import { getPostLoginRedirect } from '@/lib/utils/authRedirect'

async function syncServerSession() {
  const { data } = await supabase.auth.getSession()
  const session = data.session
  if (!session) return

  await fetch('/api/auth/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'SIGNED_IN', session }),
  })
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
    const res = await fetch('/api/auth/resolve-role', { method: 'GET' })
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

    // If the API returns an unexpected role, don't block UX.
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
    const res = await fetch('/api/patient/onboarding-status', { method: 'GET', cache: 'no-store' })
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

async function resolvePostLoginRedirect(role: ResolvedUserRole): Promise<string | null> {
  if (role === 'patient') {
    const onboarding = await getPatientRedirectFromOnboardingStatus()
    if (onboarding.kind === 'unauthenticated') return null
    if (onboarding.kind === 'ok') {
      return getPostLoginRedirect({ role, patientOnboardingPath: onboarding.path })
    }
  }

  return getPostLoginRedirect({ role })
}


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

  // Check if user is already authenticated and redirect to appropriate landing page
  useEffect(() => {
    const checkAuthAndRedirect = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      if (user) {
        await syncServerSession()

        const resolved = await resolveRole()

        if (resolved.kind === 'unauthenticated') {
          return
        }

        const role = resolved.kind === 'fallback_patient' ? 'patient' : resolved.value.role

        const target = await resolvePostLoginRedirect(role)
        if (target) {
          router.replace(target)
        }
      }
    }

    checkAuthAndRedirect()
  }, [router])

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      // Don't sync SIGNED_OUT events - they're handled by the signout endpoint
      // This prevents auto-relogin after explicit logout
      if (event === 'SIGNED_OUT') {
        return
      }
      
      await fetch('/api/auth/callback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event, session }),
      })
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const loadVersionInfo = async () => {
      try {
        const res = await fetch('/version.json', { cache: 'no-store' })
        if (!res.ok) return
        const info = (await res.json()) as VersionInfo
        setVersionInfo(info)
      } catch {
        // ignore
      }
    }

    loadVersionInfo()
  }, [])

  const handleAuth = async (event: React.FormEvent) => {
    event.preventDefault()

    if (!email || !password) {
      setError('Bitte geben Sie eine E-Mail und ein Passwort ein.')
      return
    }

    setLoading(true)
    setError(null)
    setInfo(null)

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })

        if (error) {
          setError('Login fehlgeschlagen. Bitte prüfen Sie Ihre Daten.')
        }
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
        })

        if (error) {
          setError('Registrierung fehlgeschlagen. Bitte prüfen Sie Ihre Daten.')
        } else {
          setInfo('Registrierung erfolgreich. Bitte prüfen Sie Ihre E-Mails zur Bestätigung.')
        }
      }
    } catch (err) {
      setError('Ein unerwarteter Fehler ist aufgetreten.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col items-start justify-between gap-12 px-8 py-16 lg:flex-row lg:items-center">
        <div className="max-w-xl">
          <div className="flex items-center gap-3 text-sm font-semibold uppercase tracking-widest text-sky-400">
            <span>Rhythmologicum</span>
            <span className="opacity-50">|</span>
            <span>Connect</span>
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-white sm:text-5xl">
            Willkommen zurück
          </h1>
          <p className="mt-4 text-base text-slate-300">
            Melden Sie sich an, um Ihre Assessments zu starten und Ihre Ergebnisse einzusehen.
          </p>

          <div className="mt-8 flex items-center gap-4">
            <ThemeToggle />
            <span className="text-sm text-slate-400">Dark Mode ist aktiv</span>
          </div>

          {versionInfo && (
            <div className="mt-8 text-xs text-slate-400">
              <div>Commit: {versionInfo.commitHashShort}</div>
              <div>Build: {new Date(versionInfo.buildDate).toLocaleString('de-DE')}</div>
            </div>
          )}
        </div>

        <div className="mx-auto w-full max-w-[420px] rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-lg lg:mx-0">
          <h2 className="text-2xl font-semibold text-white">
            {mode === 'login' ? 'Login' : 'Registrieren'}
          </h2>

          <form className="mt-6 w-full space-y-4" onSubmit={handleAuth}>
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="E-Mail"
              inputSize="lg"
              className="min-w-0"
            />
            <Input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Passwort"
              inputSize="lg"
              className="min-w-0"
            />

            {error && <p className="text-sm text-red-400">{error}</p>}
            {info && <p className="text-sm text-emerald-400">{info}</p>}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-sky-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:opacity-60"
            >
              {loading ? 'Bitte warten…' : mode === 'login' ? 'Anmelden' : 'Registrieren'}
            </button>
          </form>

          <div className="mt-6 text-sm text-slate-400">
            {mode === 'login' ? 'Noch kein Konto?' : 'Schon registriert?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setError(null)
                setInfo(null)
              }}
              className="font-semibold text-sky-400 hover:text-sky-300"
            >
              {mode === 'login' ? 'Jetzt registrieren' : 'Zum Login wechseln'}
            </button>
          </div>
        </div>
      </div>
    </main>
  )
}
