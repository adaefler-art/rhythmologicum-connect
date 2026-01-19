import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

const BASE_COOKIE_NAMES = ['sb-access-token', 'sb-refresh-token', 'sb-auth-token', 'sb-localhost-auth-token']

function getProjectCookieNames() {
  const baseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  if (!baseUrl) return [] as string[]
  try {
    const hostname = new URL(baseUrl).hostname
    const projectRef = hostname.split('.')[0]
    if (!projectRef) return []
    return [
      `sb-${projectRef}-auth-token`,
      `sb-${projectRef}-access-token`,
      `sb-${projectRef}-refresh-token`,
    ]
  } catch {
    return []
  }
}

function buildSignoutResponse() {
  console.log('[AUTH_SIGNOUT]')

  const response = NextResponse.json({ success: true }, { status: 200 })
  const cookieNames = new Set(BASE_COOKIE_NAMES)
  getProjectCookieNames().forEach((name) => cookieNames.add(name))

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

  return response
}

export async function POST() {
  return buildSignoutResponse()
}

export async function GET() {
  return buildSignoutResponse()
}
