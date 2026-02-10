import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { getPatientProfileId } from '@/lib/api/anamnesis/helpers'
import { ErrorCode } from '@/lib/api/responseTypes'

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
          ok: false,
          error: {
            code: ErrorCode.UNAUTHORIZED,
            message: 'Authentication required',
          },
        },
        { status: 401 },
      )
    }

    const patientId = await getPatientProfileId(supabase, user.id)

    if (!patientId) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: 'PATIENT_PROFILE_NOT_FOUND',
            message: 'Patient profile not found',
          },
        },
        { status: 403 },
      )
    }

    const { data: latestEntry, error: latestError } = await supabase
      .from('anamnesis_entries')
      .select('id, entry_type, created_at, updated_at')
      .eq('patient_id', patientId)
      .eq('entry_type', 'intake')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Failed to fetch latest anamnesis entry',
          },
        },
        { status: 400 },
      )
    }

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: recentCount, error: countError } = await supabase
      .from('anamnesis_entries')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId)
      .eq('entry_type', 'intake')
      .gte('created_at', cutoff)

    if (countError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Failed to count recent anamnesis entries',
          },
        },
        { status: 400 },
      )
    }

    const { count: latestVersionCount, error: versionCountError } = latestEntry?.id
      ? await supabase
          .from('anamnesis_entry_versions')
          .select('*', { count: 'exact', head: true })
          .eq('entry_id', latestEntry.id)
      : { count: 0, error: null }

    if (versionCountError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Failed to count intake entry versions',
          },
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      ok: true,
      latestIntakeEntryId: latestEntry?.id ?? null,
      recentIntakeCount: recentCount || 0,
      latestVersionCount: latestVersionCount || 0,
      latestUpdatedAt: latestEntry?.updated_at ?? null,
    })
  } catch (err) {
    console.error('[patient/_meta/intake-write-check] Unexpected error:', err)
    return NextResponse.json(
      {
        ok: false,
        error: {
          code: ErrorCode.DATABASE_ERROR,
          message: 'An unexpected error occurred',
        },
      },
      { status: 400 },
    )
  }
}
