'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import type { Session } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

async function syncServerSession(session: Session | null) {
  if (!session) return
  await fetch('/api/auth/callback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'SIGNED_IN', session }),
  })
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

      if (session) {
        const response = await fetch('/api/auth/callback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'SIGNED_IN', session }),
        })

        if (response.ok) {
          router.replace('/admin')
        }
      }
    }

    checkSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') return
      await syncServerSession(session ?? null)
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
      await syncServerSession(session ?? null)

      router.replace('/admin')
    } catch {
      setError('Login fehlgeschlagen. Bitte versuchen Sie es erneut.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl items-center justify-between gap-12 px-6 py-16">
        <section className="max-w-xl space-y-4">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-sky-300">
            Rhythmologicum Connect
          </p>
          <h1 className="text-4xl font-semibold">Studio Login</h1>
          <p className="text-base text-slate-300">
            Melden Sie sich an, um das Clinician/Admin Studio zu verwalten.
          </p>
        </section>

        <section className="w-full max-w-sm rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl">
          <h2 className="text-lg font-semibold">Anmelden</h2>
          <p className="mt-1 text-sm text-slate-400">Bitte Zugangsdaten eingeben.</p>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <label className="block text-sm text-slate-300">
              E-Mail
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                placeholder="name@domain.de"
              />
            </label>

            <label className="block text-sm text-slate-300">
              Passwort
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-sky-400 focus:outline-none"
                placeholder="••••••••"
              />
            </label>

            {error ? <p className="text-sm text-rose-300">{error}</p> : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-slate-950 transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Anmelden…' : 'Einloggen'}
            </button>
          </form>
        </section>
      </div>
    </main>
  )
}
