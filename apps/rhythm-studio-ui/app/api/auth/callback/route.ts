import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isSessionExpired } from '@/lib/api/authHelpers'
import { createRouteSupabaseClient } from '@/lib/db/supabase.server'

const DEBUG = process.env.AUTH_CALLBACK_DEBUG === '1'
const TIMEOUT_MS = Number(process.env.AUTH_CALLBACK_TIMEOUT_MS ?? '10000')

function rid() {
  return Math.random().toString(16).slice(2) + '-' + Date.now().toString(16)
}

async function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
  let t: NodeJS.Timeout | undefined
  const timeout = new Promise<never>((_, reject) => {
    t = setTimeout(() => reject(new Error(`TIMEOUT:${label}:${ms}ms`)), ms)
  })
  try {
    return await Promise.race([p, timeout])
  } finally {
    if (t) clearTimeout(t)
  }
}

/**
 * Auth callback endpoint for handling session events from client
 */
export async function POST(req: NextRequest) {
  const requestId = rid()
  const started = Date.now()

  // Helps to see in DevTools whether you hit THIS route at all
  const mkRes = (body: unknown, init?: Parameters<typeof NextResponse.json>[1]) => {
    const res = NextResponse.json(body, init)
    if (DEBUG) {
      res.headers.set('x-auth-callback', '1')
      res.headers.set('x-auth-request-id', requestId)
    }
    return res
  }

  try {
    if (DEBUG) {
      console.log(`[auth-callback:${requestId}] start ${req.method} ${req.nextUrl.pathname}`)
    }

    const { supabase, applyCookies } = createRouteSupabaseClient(req)

    let body: any
    try {
      body = await req.json()
    } catch (e) {
      console.error(`[auth-callback:${requestId}] req.json() failed`, e)
      return mkRes(
        { ok: false, error: { code: 'BAD_JSON', message: 'Invalid JSON body' } },
        { status: 400 },
      )
    }

    const { event, session } = body
    if (DEBUG) {
      console.log(
        `[auth-callback:${requestId}] parsed body event=${event} hasSession=${!!session}`,
      )
    }

    let payload: { ok: true } | { ok: false; error: { code: string; message: string } } = {
      ok: true,
    }
    let status = 200

    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      if (session) {
        const t0 = Date.now()
        if (DEBUG) console.log(`[auth-callback:${requestId}] setSession:begin`)
        let error: any = null

        try {
          const r = await withTimeout(supabase.auth.setSession(session), TIMEOUT_MS, 'setSession')
          error = (r as any)?.error ?? null
        } catch (e) {
          console.error(`[auth-callback:${requestId}] setSession:exception`, e)
          payload = {
            ok: false,
            error: {
              code: 'SESSION_SET_TIMEOUT',
              message: 'Timeout/Fehler beim Setzen der Sitzung.',
            },
          }
          status = 504
        }

        if (DEBUG) {
          console.log(
            `[auth-callback:${requestId}] setSession:end dt=${Date.now() - t0}ms error=${
              error ? 'yes' : 'no'
            }`,
          )
        }

        if (error) {
          if (isSessionExpired(error)) {
            payload = {
              ok: false,
              error: {
                code: 'SESSION_EXPIRED',
                message: 'Die bereitgestellte Sitzung ist bereits abgelaufen.',
              },
            }
            status = 401
          } else if (status === 200) {
            payload = {
              ok: false,
              error: {
                code: 'SESSION_SET_FAILED',
                message: 'Fehler beim Setzen der Sitzung.',
              },
            }
            status = 400
          }
        }
      }
    }

    if (event === 'SIGNED_OUT') {
      const t0 = Date.now()
      if (DEBUG) console.log(`[auth-callback:${requestId}] signOut:begin`)
      try {
        await withTimeout(supabase.auth.signOut(), TIMEOUT_MS, 'signOut')
      } catch (e) {
        console.error(`[auth-callback:${requestId}] signOut:exception`, e)
        // Do not fail hard, but return useful info
        payload = {
          ok: false,
          error: { code: 'SIGNOUT_TIMEOUT', message: 'Timeout/Fehler beim SignOut.' },
        }
        status = 504
      }
      if (DEBUG) console.log(`[auth-callback:${requestId}] signOut:end dt=${Date.now() - t0}ms`)
    }

    const response = applyCookies(
      NextResponse.json(payload, { status }),
    )

    if (DEBUG) {
      response.headers.set('x-auth-status', String(status))
      response.headers.set('x-auth-dt', String(Date.now() - started))
      response.headers.set('x-auth-event', String(event ?? ''))
      console.log(
        `[auth-callback:${requestId}] return status=${status} dt=${Date.now() - started}ms`,
      )
    }

    return response
  } catch (error) {
    console.error(`[auth-callback:${requestId}] unhandled`, error)

    if (error instanceof Error && error.message.includes('Supabase configuration missing')) {
      return mkRes(
        {
          ok: false,
          error: {
            code: 'CONFIG',
            message:
              'Supabase ist nicht konfiguriert. Bitte NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY setzen.',
          },
        },
        { status: 500 },
      )
    }

    return mkRes(
      {
        ok: false,
        error: {
          code: 'CALLBACK_ERROR',
          message: 'Fehler bei der Verarbeitung des Auth-Callbacks.',
        },
      },
      { status: 500 },
    )
  }
}
