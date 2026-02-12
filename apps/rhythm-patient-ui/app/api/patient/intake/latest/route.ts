import { NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { ErrorCode } from '@/lib/api/responseTypes'

type IntakeRecord = {
  id: string
  status: string
  version_number: number
  clinical_summary: string | null
  structured_data: Record<string, unknown>
  trigger_reason: string | null
  created_at: string
  updated_at: string
}

const mapIntake = (intake: IntakeRecord | null) =>
  intake
    ? {
        uuid: intake.id,
        id: intake.id,
        status: intake.status,
        version_number: intake.version_number,
        clinical_summary: intake.clinical_summary,
        structured_data: intake.structured_data,
        trigger_reason: intake.trigger_reason,
        created_at: intake.created_at,
        updated_at: intake.updated_at,
      }
    : null

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

    const { data, error } = await supabase
      .from('clinical_intakes')
      .select(
        'id, status, version_number, clinical_summary, structured_data, trigger_reason, created_at, updated_at',
      )
      .eq('user_id', user.id)
      .order('version_number', { ascending: false })
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (error) {
      console.error('[patient/intake/latest] Query error', error)
      return NextResponse.json(
        {
          success: false,
          error: { code: ErrorCode.DATABASE_ERROR, message: 'Failed to fetch intake' },
        },
        { status: 500 },
      )
    }

    return NextResponse.json({
      success: true,
      intake: mapIntake((data ?? null) as IntakeRecord | null),
    })
  } catch (err) {
    console.error('[patient/intake/latest] Unexpected error', err)
    return NextResponse.json(
      {
        success: false,
        error: { code: ErrorCode.INTERNAL_ERROR, message: 'An unexpected error occurred' },
      },
      { status: 500 },
    )
  }
}
