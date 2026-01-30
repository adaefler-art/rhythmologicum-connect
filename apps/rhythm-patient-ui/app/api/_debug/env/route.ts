import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export const runtime = 'nodejs'

export async function GET() {
  const commitSha =
    env.VERCEL_GIT_COMMIT_SHA || env.GIT_COMMIT_SHA || env.COMMIT_SHA || null

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL
  let supabaseHost: string | null = null
  let supabaseProjectRef: string | null = null

  if (supabaseUrl) {
    try {
      const url = new URL(supabaseUrl)
      supabaseHost = url.host
      supabaseProjectRef = url.host.split('.')[0] ?? null
    } catch {
      supabaseHost = null
      supabaseProjectRef = null
    }
  }

  return NextResponse.json({
    hasServiceRoleKey: Boolean(env.SUPABASE_SERVICE_ROLE_KEY),
    hasServiceKey: Boolean(env.SUPABASE_SERVICE_KEY),
    hasUrl: Boolean(env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL),
    supabaseHost,
    supabaseProjectRef,
    vercelEnv: env.VERCEL_ENV ?? null,
    commitSha,
  })
}
