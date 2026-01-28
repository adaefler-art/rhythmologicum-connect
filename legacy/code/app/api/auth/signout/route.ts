import { NextResponse, type NextRequest } from 'next/server'
import { env } from '@/lib/env'
import { createRouteSupabaseClient } from '@/lib/db/supabase.server'

const BASE_COOKIE_NAMES = ['sb-access-token', 'sb-refresh-token', 'sb-auth-token', 'sb-localhost-auth-token']

function getSupabaseAuthCookieName() {
  const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  if (!baseUrl) return null
  try {
    const hostname = new URL(baseUrl).hostname
    const projectRef = hostname.split('.')[0]
    if (!projectRef) return null
    return `sb-${projectRef}-auth-token`
  } catch {
    return null
  }
}

async function buildSignoutResponse(req: NextRequest) {
  console.log('[AUTH_SIGNOUT] Clearing server session and cookies')

  // Create supabase client to clear server session
  const { supabase, applyCookies } = createRouteSupabaseClient(req)
  
  // Sign out from Supabase (invalidates refresh token on server)
  await supabase.auth.signOut()

  const response = NextResponse.json({ success: true }, { status: 200 })
  const authCookie = getSupabaseAuthCookieName()
  const cookieNames = new Set(BASE_COOKIE_NAMES)
  if (authCookie) cookieNames.add(authCookie)

  // Clear all auth cookies
  cookieNames.forEach((name) => {
    response.cookies.set({
      name,
      value: '',
      maxAge: 0,
      expires: new Date(0),
      path: '/',
      sameSite: 'lax',
    })
  })

  return applyCookies(response)
}

export async function POST(req: NextRequest) {
  return buildSignoutResponse(req)
}

export async function GET(req: NextRequest) {
  return buildSignoutResponse(req)
}