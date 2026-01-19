import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { isSessionExpired } from '@/lib/api/authHelpers'

/**
 * Auth callback endpoint for handling session events from client
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient()
    const body = await req.json()
    const { event, session } = body

    if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
      if (session) {
        const { error } = await supabase.auth.setSession(session)

        if (error) {
          if (isSessionExpired(error)) {
            return NextResponse.json(
              {
                ok: false,
                error: {
                  code: 'SESSION_EXPIRED',
                  message: 'Die bereitgestellte Sitzung ist bereits abgelaufen.',
                },
              },
              { status: 401 },
            )
          }

          return NextResponse.json(
            {
              ok: false,
              error: {
                code: 'SESSION_SET_FAILED',
                message: 'Fehler beim Setzen der Sitzung.',
              },
            },
            { status: 400 },
          )
        }
      }
    }

    if (event === 'SIGNED_OUT') {
      await supabase.auth.signOut()
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error('Error in auth callback:', error)
    return NextResponse.json(
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
