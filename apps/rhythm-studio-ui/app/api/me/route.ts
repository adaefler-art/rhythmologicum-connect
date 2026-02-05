import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'

export async function GET() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    return NextResponse.json({ error: 'AUTHENTICATION_REQUIRED' }, { status: 401 })
  }

  return NextResponse.json({ userId: user.id, email: user.email ?? null }, { status: 200 })
}
