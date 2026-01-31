'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'
import { Button, Card, Input, Label } from '@/lib/ui'

type ResolvedRoleResponse =
  | { success: true; data?: { role?: string } }
  | { success: false; error?: { code?: string; message?: string } }

async function syncServerSession(event: string, session: Session | null) {
  if (!session) return
  await fetch('/api/auth/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({ event, session }),
  })
}

async function resolveStudioRedirect(): Promise<string | null> {
  try {
    const response = await fetch('/api/auth/resolve-role', { credentials: 'include' })
    const payload = (await response.json()) as ResolvedRoleResponse
    if (!response.ok || !payload.success) return null

    const role = payload.data?.role
    if (role === 'admin') return '/admin'
    if (role === 'clinician' || role === 'nurse') return '/clinician'
    return null
  } catch {
    return null
  }
}

export default function StudioLoginClient() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) return

      await syncServerSession('SIGNED_IN', session)
      const target = await resolveStudioRedirect()
      if (target) {
        router.replace(target)
      }
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') return
      await syncServerSession(event, session ?? null)
    })

    return () => subscription.unsubscribe()
  }, [router])

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault()
    setError(null)

    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()

    if (!trimmedEmail || !trimmedPassword) {
      setError('Bitte E-Mail und Passwort eingeben.')
      return
    }

    setLoading(true)
    try {
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password: trimmedPassword,
      })

      if (signInError) {
        setError(signInError.message)
        return
      }

      const {
        data: { session },
      } = await supabase.auth.getSession()
      await syncServerSession('SIGNED_IN', session ?? null)

      const target = await resolveStudioRedirect()
      router.replace(target ?? '/clinician')
    } catch {
      setError('Login fehlgeschlagen. Bitte versuchen Sie es erneut.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl flex-col justify-center px-6 py-12">
        <section className="mb-8 text-center space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">
            Rhythmologicum Connect
          </p>
          <h1 className="text-4xl sm:text-5xl font-semibold">Studio Login</h1>
          <p className="text-base sm:text-lg text-slate-300">
            Melden Sie sich an, um das Clinician/Admin Studio zu verwalten.
          </p>
        </section>

        <section className="mx-auto w-full max-w-md sm:min-w-90">
          <Card className="border-slate-800 bg-slate-900/70" shadow="lg">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-semibold">Anmelden</h2>
                <p className="mt-1 text-sm text-slate-400">Bitte Zugangsdaten eingeben.</p>
              </div>

              <form className="w-full flex flex-col gap-3" onSubmit={handleSubmit}>
                <div className="w-full">
                  <Label htmlFor="studio-email">E-Mail</Label>
                  <Input
                    id="studio-email"
                    type="email"
                    autoComplete="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@domain.de"
                    inputSize="md"
                    className="w-full"
                  />
                </div>

                <div className="w-full">
                  <Label htmlFor="studio-password">Passwort</Label>
                  <Input
                    id="studio-password"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    inputSize="md"
                    className="w-full"
                  />
                </div>

                {error ? <p className="text-sm text-rose-300">{error}</p> : null}

                <Button type="submit" variant="primary" size="md" fullWidth disabled={loading}>
                  {loading ? 'Anmelden…' : 'Einloggen'}
                </Button>
              </form>
            </div>
          </Card>
        </section>
      </div>
    </main>
  )
}
