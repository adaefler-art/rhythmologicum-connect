// app/api/patient-measures/export/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    '[patient-measures/export] Supabase-Env nicht gesetzt. Bitte NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY prüfen.'
  )
}

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null

export async function GET(req: Request) {
  try {
    if (!supabase) {
      console.error(
        '[patient-measures/export] Supabase nicht initialisiert – Env Variablen fehlen.'
      )
      return NextResponse.json(
        { error: 'Server-Konfiguration unvollständig (Supabase).' },
        { status: 500 }
      )
    }

    // 1. Get authenticated user from request
    const authHeader = req.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Nicht authentifiziert. Bitte melden Sie sich an.' },
        { status: 401 }
      )
    }

    // Verify the user with the token
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''))

    if (authError || !user) {
      console.error('[patient-measures/export] Auth-Fehler:', authError)
      return NextResponse.json(
        { error: 'Nicht authentifiziert. Bitte melden Sie sich an.' },
        { status: 401 }
      )
    }

    // 2. Get patient profile for the authenticated user
    const { data: profileData, error: profileError } = await supabase
      .from('patient_profiles')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (profileError || !profileData) {
      console.error(
        '[patient-measures/export] Fehler beim Laden des Patientenprofils:',
        profileError
      )
      return NextResponse.json(
        { error: 'Ihr Profil konnte nicht geladen werden.' },
        { status: 403 }
      )
    }

    const patientId = profileData.id

    // 3. Fetch patient measures with related reports
    const { data: measures, error: measuresError } = await supabase
      .from('patient_measures')
      .select(
        `
        id,
        assessment_id,
        patient_id,
        measurement_type,
        status,
        completed_at,
        created_at,
        updated_at
      `
      )
      .eq('patient_id', patientId)
      .order('completed_at', { ascending: false })

    if (measuresError) {
      console.error(
        '[patient-measures/export] Fehler beim Laden der Messungen:',
        measuresError
      )
      return NextResponse.json(
        { error: 'Fehler beim Laden der Messungen.' },
        { status: 500 }
      )
    }

    if (!measures || measures.length === 0) {
      return NextResponse.json({
        export_date: new Date().toISOString(),
        patient_id: patientId,
        measures: [],
        total_count: 0,
        message: 'Keine Messungen gefunden.',
      })
    }

    // 4. Fetch reports for each assessment
    const assessmentIds = measures.map((m) => m.assessment_id)
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .in('assessment_id', assessmentIds)

    if (reportsError) {
      console.error(
        '[patient-measures/export] Fehler beim Laden der Reports:',
        reportsError
      )
      // Continue without reports rather than failing completely
    }

    // 5. Combine measures with their reports and prepare export data
    const exportData = measures.map((measure) => {
      const report = reports?.find(
        (r) => r.assessment_id === measure.assessment_id
      )
      return {
        measure_id: measure.id,
        assessment_id: measure.assessment_id,
        measurement_type: measure.measurement_type,
        status: measure.status,
        completed_at: measure.completed_at,
        created_at: measure.created_at,
        updated_at: measure.updated_at,
        scores: {
          stress_score: report?.score_numeric ?? null,
          sleep_score: report?.sleep_score ?? null,
        },
        risk_level: report?.risk_level ?? null,
        amy_interpretation: report?.report_text_short ?? null,
        report_created_at: report?.created_at ?? null,
      }
    })

    // 6. Return the complete export
    return NextResponse.json({
      export_date: new Date().toISOString(),
      patient_id: patientId,
      measures: exportData,
      total_count: exportData.length,
    })
  } catch (err: unknown) {
    console.error('[patient-measures/export] Unerwarteter Fehler:', err)
    const error = err as { message?: string }
    return NextResponse.json(
      {
        error: 'Interner Fehler beim Exportieren der Messungen.',
        message: error?.message ?? String(err),
      },
      { status: 500 }
    )
  }
}
