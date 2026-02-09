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
          success: false,
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
          success: false,
          error: {
            code: ErrorCode.NOT_FOUND,
            message: 'Patient profile not found',
          },
        },
        { status: 404 },
      )
    }

    const { data: latestEntry, error: latestError } = await supabase
      .from('anamnesis_entries')
      .select('id, entry_type, created_at')
      .eq('patient_id', patientId)
      .in('entry_type', ['intake', 'funnel_summary'])
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (latestError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Failed to fetch latest anamnesis entry',
          },
        },
        { status: 500 },
      )
    }

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: recentCount, error: countError } = await supabase
      .from('anamnesis_entries')
      .select('*', { count: 'exact', head: true })
      .eq('patient_id', patientId)
      .gte('created_at', cutoff)

    if (countError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Failed to count recent anamnesis entries',
          },
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      data: {
        lastAnamnesisEntryId: latestEntry?.id ?? null,
        lastAnamnesisEntryType: latestEntry?.entry_type ?? null,
        countRecentEntries: recentCount || 0,
      },
    })
  } catch (err) {
    console.error('[patient/_meta/intake-write-check] Unexpected error:', err)
    return NextResponse.json(
      {
        success: false,
        error: {
          code: ErrorCode.INTERNAL_ERROR,
          message: 'An unexpected error occurred',
        },
      },
      { status: 500 },
    )
  }
}
