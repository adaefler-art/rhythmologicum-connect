import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
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

    const { data: latestIntake, error: latestError } = (await supabase
      .from('clinical_intakes' as any)
      .select('id, version_number, created_at, updated_at')
      .eq('user_id', user.id)
      .order('version_number', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()) as unknown as {
      data: { id: string; version_number: number; created_at: string; updated_at: string } | null
      error: { message: string } | null
    }

    if (latestError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Failed to fetch latest clinical intake',
          },
        },
        { status: 400 },
      )
    }

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
    const { count: recentCount, error: countError } = (await supabase
      .from('clinical_intakes' as any)
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .gte('created_at', cutoff)) as unknown as {
      count: number | null
      error: { message: string } | null
    }

    if (countError) {
      return NextResponse.json(
        {
          ok: false,
          error: {
            code: ErrorCode.DATABASE_ERROR,
            message: 'Failed to count recent clinical intakes',
          },
        },
        { status: 400 },
      )
    }

    return NextResponse.json({
      ok: true,
        latestIntakeId: latestIntake?.id ?? null,
        latestIntakeEntryId: latestIntake?.id ?? null,
      recentIntakeCount: recentCount || 0,
        latestVersionNumber: latestIntake?.version_number ?? null,
        latestVersionCount: latestIntake?.version_number ?? 0,
        latestUpdatedAt: latestIntake?.updated_at ?? null,
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
