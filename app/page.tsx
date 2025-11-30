'use client'

import { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useRouter } from 'next/navigation'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'signup'>('signup')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      if (mode === 'signup') {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        })
        if (signUpError) throw signUpError
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (signInError) throw signInError
      }

      // aktuellen User holen
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (userError) throw userError
      if (!user) throw new Error('Kein User nach Login gefunden')

      // patient_profile sicherstellen (upsert = Insert oder Update)
      const { error: profileError } = await supabase
        .from('patient_profiles')
        .upsert(
          {
            user_id: user.id,
            full_name: user.email, // Platzhalter, kann später geändert werden
          },
          {
            onConflict: 'user_id',
          },
        )

      if (profileError) throw profileError

      // weiter zur Stress-Check-Seite
      router.push('/patient/stress-check')
    } catch (err: any) {
      console.error(err)
      setError(err.message ?? 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md border rounded-xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-4 text-center">
          Rhythm – {mode === 'signup' ? 'Registrierung' : 'Login'}
        </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm mb-1">E-Mail</label>
            <input
              type="email"
              className="w-full border rounded px-3 py-2"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div>
            <label className="block text-sm mb-1">Passwort</label>
            <input
              type="password"
              className="w-full border rounded px-3 py-2"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && <p className="text-sm text-red-500">{error}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 rounded bg-black text-white font-semibold disabled:opacity-60"
          >
            {loading
              ? 'Bitte warten...'
              : mode === 'signup'
              ? 'Konto anlegen'
              : 'Einloggen'}
          </button>
        </form>

        <div className="mt-4 text-center text-sm">
          {mode === 'signup' ? (
            <button
              className="underline"
              onClick={() => setMode('login')}
            >
              Ich habe schon ein Konto – zum Login
            </button>
          ) : (
            <button
              className="underline"
              onClick={() => setMode('signup')}
            >
              Ich brauche ein Konto – registrieren
            </button>
          )}
        </div>
      </div>
    </main>
  )
}
