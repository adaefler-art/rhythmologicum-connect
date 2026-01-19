import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'

export async function GET(req: NextRequest) {
  const host = req.headers.get('host') ?? ''
  const cookieHeader = req.headers.get('cookie')
  const cookieNames = cookieHeader
    ? cookieHeader
        .split(';')
        .map((part) => part.trim().split('=')[0])
        .filter(Boolean)
    : []

  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const resolvedRole = user?.app_metadata?.role ?? user?.user_metadata?.role ?? null

  return NextResponse.json({
    host,
    hasCookieHeader: Boolean(cookieHeader),
    cookieNames,
    resolvedRole,
  })
}
