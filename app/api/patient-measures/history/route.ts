// app/api/patient-measures/history/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    '[patient-measures/history] Supabase-Env nicht gesetzt. Bitte NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY prüfen.'
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
        '[patient-measures/history] Supabase nicht initialisiert – Env Variablen fehlen.'
      )
      return NextResponse.json(
        { error: 'Server-Konfiguration unvollständig (Supabase).' },
        { status: 500 }
      )
    }

    // Get patientId from query params
    const url = new URL(req.url)
    const patientId = url.searchParams.get('patientId')

    if (!patientId) {
      return NextResponse.json(
        { error: 'patientId fehlt in den Query-Parametern.' },
        { status: 400 }
      )
    }

    // Fetch patient measures with related reports
    const { data: measures, error: measuresError } = await supabase
      .from('patient_measures')
      .select(
        `
        id,
        assessment_id,
        patient_id,
        measurement_type,
        completed_at,
        created_at
      `
      )
      .eq('patient_id', patientId)
      .order('completed_at', { ascending: false })

    if (measuresError) {
      console.error(
        '[patient-measures/history] Fehler beim Laden der Messungen:',
        measuresError
      )
      return NextResponse.json(
        { error: 'Fehler beim Laden der Messungen.' },
        { status: 500 }
      )
    }

    if (!measures || measures.length === 0) {
      return NextResponse.json({
        measures: [],
        message: 'Keine Messungen gefunden.',
      })
    }

    // Fetch reports for each assessment
    const assessmentIds = measures.map((m) => m.assessment_id)
    const { data: reports, error: reportsError } = await supabase
      .from('reports')
      .select('*')
      .in('assessment_id', assessmentIds)

    if (reportsError) {
      console.error(
        '[patient-measures/history] Fehler beim Laden der Reports:',
        reportsError
      )
      // Continue without reports rather than failing completely
    }

    // Combine measures with their reports
    const measuresWithReports = measures.map((measure) => {
      const report = reports?.find(
        (r) => r.assessment_id === measure.assessment_id
      )
      return {
        ...measure,
        report: report || null,
      }
    })

    return NextResponse.json({
      measures: measuresWithReports,
      message: 'Messungen erfolgreich geladen.',
    })
  } catch (err: unknown) {
    console.error('[patient-measures/history] Unerwarteter Fehler:', err)
    const error = err as { message?: string }
    return NextResponse.json(
      {
        error: 'Interner Fehler beim Laden der Messungen.',
        message: error?.message ?? String(err),
      },
      { status: 500 }
    )
  }
}
