// app/api/patient-measures/history/route.ts
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY

const usedKeyName = process.env.SUPABASE_SERVICE_ROLE_KEY
  ? 'SUPABASE_SERVICE_ROLE_KEY'
  : process.env.SUPABASE_SERVICE_KEY
  ? 'SUPABASE_SERVICE_KEY'
  : 'none'
console.log('[patient-measures/history] using key var:', usedKeyName)
console.log('[patient-measures/history] supabaseUrl set?', !!(process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL))

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

    // NOTE: Select columns that actually exist in the DB schema.
    // patient_measures in your schema has report_id (FK), not assessment_id.
    const { data: measures, error: measuresError } = await supabase
      .from('patient_measures')
      .select(
        `
        id,
        patient_id,
        report_id,
        stress_score,
        sleep_score,
        risk_level,
        created_at
      `
      )
      .eq('patient_id', patientId)
      .order('created_at', { ascending: false })

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

    // Wenn patient_measures.report_id verwendet wird, hole die Reports über deren id
    const reportIds = measures.map((m: any) => m.report_id).filter(Boolean)
    let reports: any[] | undefined = undefined
    if (reportIds.length > 0) {
      const { data: reportsData, error: reportsError } = await supabase
        .from('reports')
        .select('*')
        .in('id', reportIds)

      if (reportsError) {
        console.error(
          '[patient-measures/history] Fehler beim Laden der Reports:',
          reportsError
        )
        // continue without reports
      } else {
        reports = reportsData || []
      }
    }

    // Combine measures with their reports (match by report_id -> reports.id)
    const measuresWithReports = measures.map((measure: any) => {
      const report = reports?.find((r: any) => r.id === measure.report_id) || null
      return {
        ...measure,
        report,
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