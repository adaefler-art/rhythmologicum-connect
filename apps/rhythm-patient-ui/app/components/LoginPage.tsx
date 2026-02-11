'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import { Button, Card, mobileTypography } from '@/lib/ui/mobile-v2'
import { Input } from '@/src/vendor/rhythm_mobile_v2/components/ui/Input'
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
  const [info, setInfo] = useState<string | null>(null)
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
    } catch {
      setError('Ein unerwarteter Fehler ist aufgetreten.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen w-full bg-slate-50 text-slate-900">
      <div className="mx-auto flex min-h-screen w-full max-w-none flex-col gap-10 px-6 py-10 sm:px-8 lg:max-w-5xl lg:flex-row lg:items-center lg:justify-between">
        <section className="w-full max-w-none min-w-0 space-y-4 lg:max-w-xl">
          <div className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-500">
            Rhythmologicum Connect
          </div>
          <h1
            className="font-semibold text-slate-900"
            style={{
              fontSize: mobileTypography.fontSize['3xl'],
              lineHeight: mobileTypography.lineHeight.tight,
            }}
          >
            Willkommen zurück
          </h1>
          <p className="text-base text-slate-600">
            Melden Sie sich an, um Ihre Assessments zu starten und Ihre Ergebnisse einzusehen.
          </p>

          {versionInfo && (
            <div className="pt-4 text-xs text-slate-400">
              <div>Commit: {versionInfo.commitHashShort}</div>
              <div>Build: {new Date(versionInfo.buildDate).toLocaleString('de-DE')}</div>
            </div>
          )}
        </section>

        <Card
          className="w-full max-w-none self-stretch min-w-[280px] sm:max-w-xl lg:mx-0 lg:max-w-lg lg:min-w-[380px]"
          padding="lg"
          shadow="md"
        >
          <h2 className="text-xl font-semibold text-slate-900">
            {mode === 'login' ? 'Login' : 'Registrieren'}
          </h2>

          <form className="mt-6 flex w-full flex-col space-y-4" onSubmit={handleAuth}>
            <Input
              type="email"
              label="E-Mail"
              placeholder="name@domain.de"
              value={email}
              onChange={setEmail}
              className="min-w-0"
            />

            <Input
              type="password"
              label="Passwort"
              placeholder="••••••••"
              value={password}
              onChange={setPassword}
              className="min-w-0"
            />

            {error && <p className="text-sm text-rose-600">{error}</p>}
            {info && <p className="text-sm text-emerald-600">{info}</p>}

            <Button type="submit" fullWidth disabled={loading} size="md">
              {loading ? 'Bitte warten…' : mode === 'login' ? 'Anmelden' : 'Registrieren'}
            </Button>
          </form>

          <div className="mt-6 text-sm text-slate-500">
            {mode === 'login' ? 'Noch kein Konto?' : 'Schon registriert?'}{' '}
            <button
              type="button"
              onClick={() => {
                setMode(mode === 'login' ? 'signup' : 'login')
                setError(null)
                setInfo(null)
              }}
              className="font-semibold text-sky-600 hover:text-sky-500"
            >
              {mode === 'login' ? 'Jetzt registrieren' : 'Zum Login wechseln'}
            </button>
          </div>
        </Card>
      </div>
    </main>
  )
}
