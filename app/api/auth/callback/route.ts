import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'
import type { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
  const cookieStore = await cookies()
  const supabase = createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value
        },
        set(name, value, options) {
          try {
            cookieStore.set({ name, value, ...(options ?? {}) })
          } catch {
            // cookies() is immutable in some runtimes (e.g. middleware)
          }
        },
        remove(name, options) {
          try {
            cookieStore.delete({ name, ...(options ?? {}) })
          } catch {
            // Same limitation as above; safe to ignore
          }
        },
      },
    }
  )
  const { event, session } = await req.json()

  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    if (session) await supabase.auth.setSession(session)
  }
  if (event === 'SIGNED_OUT') {
    await supabase.auth.signOut()
  }

  return NextResponse.json({ ok: true })
}
