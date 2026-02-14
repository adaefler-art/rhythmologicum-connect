import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { ErrorCode } from '@/lib/api/responseTypes'

type ProfileRow = {
  id: string
  user_id: string
  first_name: string | null
  last_name: string | null
  full_name: string | null
  birth_date: string | null
  contact_email: string | null
  contact_phone: string | null
  preferred_language: string | null
  consent_data_processing: boolean
  consent_contact_for_followup: boolean
  communication_preference: 'email' | 'sms' | null
  updated_at?: string
  created_at?: string
}

type PatchPayload = {
  first_name?: unknown
  last_name?: unknown
  birth_date?: unknown
  contact_email?: unknown
  contact_phone?: unknown
  preferred_language?: unknown
  consent_data_processing?: unknown
  consent_contact_for_followup?: unknown
  communication_preference?: unknown
}

const normalizeText = (value: unknown) => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

const normalizeBirthDate = (value: unknown) => {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  if (!trimmed) return null
  if (!/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) return null
  return trimmed
}

const normalizeCommPreference = (value: unknown): 'email' | 'sms' | null => {
  if (value === 'email' || value === 'sms') return value
  return null
}

const mapProfile = (profile: ProfileRow | null, userEmail: string | null) => ({
  name: {
    first_name: profile?.first_name ?? null,
    last_name: profile?.last_name ?? null,
    full_name: profile?.full_name ?? null,
  },
  birth_date: profile?.birth_date ?? null,
  contact: {
    email: profile?.contact_email ?? userEmail,
    phone: profile?.contact_phone ?? null,
  },
  preferred_language: profile?.preferred_language ?? 'de',
  consent: {
    data_processing: profile?.consent_data_processing ?? false,
    contact_for_followup: profile?.consent_contact_for_followup ?? false,
  },
  communication_preference: profile?.communication_preference ?? 'email',
})

const fetchOwnProfile = async (supabase: Awaited<ReturnType<typeof createServerSupabaseClient>>, userId: string) =>
  (await supabase
    .from('patient_profiles' as any)
    .select(
      'id, user_id, first_name, last_name, full_name, birth_date, contact_email, contact_phone, preferred_language, consent_data_processing, consent_contact_for_followup, communication_preference',
    )
    .eq('user_id', userId)
    .maybeSingle()) as unknown as {
    data: ProfileRow | null
    error: { message: string } | null
  }

export async function GET() {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.UNAUTHORIZED, message: 'Authentication required' },
        },
        { status: 401 },
      )
    }

    const { data: profile, error } = await fetchOwnProfile(supabase, user.id)

    if (error) {
      console.error('[patient/profile][GET] query error', error)
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to load profile' },
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      profile: mapProfile(profile, user.email ?? null),
    })
  } catch (err) {
    console.error('[patient/profile][GET] unexpected error', err)
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCode.INTERNAL_ERROR, message: 'An unexpected error occurred' },
      },
      { status: 500 },
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const supabase = await createServerSupabaseClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.UNAUTHORIZED, message: 'Authentication required' },
        },
        { status: 401 },
      )
    }

    const body = (await request.json()) as PatchPayload

    const firstName = normalizeText(body.first_name)
    const lastName = normalizeText(body.last_name)
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim() || null

    const updateInput = {
      user_id: user.id,
      first_name: firstName,
      last_name: lastName,
      full_name: fullName,
      birth_date: normalizeBirthDate(body.birth_date),
      contact_email: normalizeText(body.contact_email),
      contact_phone: normalizeText(body.contact_phone),
      preferred_language: normalizeText(body.preferred_language) ?? 'de',
      consent_data_processing: Boolean(body.consent_data_processing),
      consent_contact_for_followup: Boolean(body.consent_contact_for_followup),
      communication_preference: normalizeCommPreference(body.communication_preference) ?? 'email',
    }

    const { error: upsertError } = await supabase.from('patient_profiles' as any).upsert(updateInput, {
      onConflict: 'user_id',
    })

    if (upsertError) {
      console.error('[patient/profile][PATCH] upsert error', upsertError)
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to save profile' },
        },
        { status: 500 },
      )
    }

    const { data: savedProfile, error: fetchError } = await fetchOwnProfile(supabase, user.id)

    if (fetchError) {
      console.error('[patient/profile][PATCH] fetch after save error', fetchError)
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Profile saved but reload failed' },
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      profile: mapProfile(savedProfile, user.email ?? null),
    })
  } catch (err) {
    console.error('[patient/profile][PATCH] unexpected error', err)
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCode.INTERNAL_ERROR, message: 'An unexpected error occurred' },
      },
      { status: 500 },
    )
  }
}
