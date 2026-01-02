import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'

export async function POST(req: NextRequest) {
  const supabase = await createServerSupabaseClient()
  const { event, session } = await req.json()

  if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
    if (session) await supabase.auth.setSession(session)
  }
  if (event === 'SIGNED_OUT') {
    await supabase.auth.signOut()
  }

  return NextResponse.json({ ok: true })
}
