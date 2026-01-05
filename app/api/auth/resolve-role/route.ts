import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import type { Database } from '@/lib/types/supabase'

export type ResolvedUserRole = Database['public']['Enums']['user_role']

type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: { code: string; message: string }
}

function ok<T>(data: T) {
  return NextResponse.json({ success: true, data } satisfies ApiResponse<T>)
}

function fail(code: string, message: string, status = 403) {
  return NextResponse.json(
    { success: false, error: { code, message } } satisfies ApiResponse<never>,
    { status },
  )
}

async function resolveRoleFromMembership(): Promise<ResolvedUserRole | null> {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const precedence: ResolvedUserRole[] = ['admin', 'clinician', 'nurse', 'patient']

  for (const role of precedence) {
    const { data, error } = await supabase.rpc('has_any_role', { check_role: role })
    if (error) {
      // Fail-closed: if membership role lookup fails, don't fall through to app_metadata here.
      return null
    }
    if (data) return role
  }

  return null
}

export async function GET() {
  const role = await resolveRoleFromMembership()

  if (!role) {
    return fail('ROLE_NOT_FOUND', 'Keine gültige Rolle gefunden.', 403)
  }

  return ok({ role })
}
