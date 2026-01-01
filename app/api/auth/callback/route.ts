import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import type { NextRequest } from 'next/server'

export async function POST(req: NextRequest) {
    const supabase = await createServerSupabaseClient() })
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
