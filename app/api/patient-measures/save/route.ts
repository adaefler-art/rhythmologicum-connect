// app/api/patient-measures/save/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase-ENV robust auslesen
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    '[patient-measures/save] Supabase-Env nicht gesetzt. Bitte NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY prüfen.'
  );
}

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null;

export async function POST(req: Request) {
  try {
    if (!supabase) {
      console.error(
        '[patient-measures/save] Supabase nicht initialisiert – Env Variablen fehlen.'
      );
      return NextResponse.json(
        { error: 'Server-Konfiguration unvollständig (Supabase).' },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => null);
    const assessmentId = body?.assessmentId as string | undefined;

    if (!assessmentId) {
      return NextResponse.json(
        { error: 'assessmentId fehlt im Request-Body.' },
        { status: 400 }
      );
    }

    // 1. Prüfen ob bereits ein patient_measures Eintrag existiert (Idempotenz)
    const { data: existingMeasure, error: checkError } = await supabase
      .from('patient_measures')
      .select('*')
      .eq('assessment_id', assessmentId)
      .maybeSingle();

    if (checkError) {
      console.error(
        '[patient-measures/save] Fehler beim Prüfen auf existierenden Eintrag:',
        checkError
      );
      return NextResponse.json(
        { error: 'Fehler beim Prüfen der Messung.' },
        { status: 500 }
      );
    }

    // Wenn bereits vorhanden, direkt zurückgeben (Idempotenz)
    if (existingMeasure) {
      console.log(
        '[patient-measures/save] Messung bereits vorhanden für assessment_id:',
        assessmentId
      );
      return NextResponse.json({
        measure: existingMeasure,
        message: 'Messung war bereits gespeichert.',
        isNew: false,
      });
    }

    // 2. Assessment-Daten laden um patient_id zu erhalten
    const { data: assessmentData, error: assessmentError } = await supabase
      .from('assessments')
      .select('id, patient_id, funnel')
      .eq('id', assessmentId)
      .single();

    if (assessmentError) {
      console.error(
        '[patient-measures/save] Fehler beim Laden des Assessments:',
        assessmentError
      );
      return NextResponse.json(
        { error: 'Assessment nicht gefunden.' },
        { status: 404 }
      );
    }

    if (!assessmentData) {
      console.error(
        '[patient-measures/save] Assessment nicht gefunden für ID:',
        assessmentId
      );
      return NextResponse.json(
        { error: 'Assessment nicht gefunden.' },
        { status: 404 }
      );
    }

    // 3. Neuen patient_measures Eintrag erstellen
    const { data: newMeasure, error: insertError } = await supabase
      .from('patient_measures')
      .insert({
        assessment_id: assessmentId,
        patient_id: assessmentData.patient_id,
        measurement_type: assessmentData.funnel || 'stress',
        status: 'completed',
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (insertError) {
      // Prüfen ob Unique Constraint Violation (duplicate key)
      // PostgreSQL error code 23505
      if (insertError.code === '23505') {
        console.warn(
          '[patient-measures/save] Duplicate key - Messung wurde parallel erstellt:',
          assessmentId
        );
        
        // Nochmal laden und zurückgeben (Race Condition)
        const { data: refetchedMeasure } = await supabase
          .from('patient_measures')
          .select('*')
          .eq('assessment_id', assessmentId)
          .single();

        return NextResponse.json({
          measure: refetchedMeasure,
          message: 'Messung war bereits gespeichert.',
          isNew: false,
        });
      }

      console.error(
        '[patient-measures/save] Fehler beim Erstellen der Messung:',
        insertError
      );
      return NextResponse.json(
        { error: 'Fehler beim Speichern der Messung.' },
        { status: 500 }
      );
    }

    console.log(
      '[patient-measures/save] Neue Messung erfolgreich erstellt:',
      newMeasure?.id
    );

    return NextResponse.json({
      measure: newMeasure,
      message: 'Messung erfolgreich gespeichert.',
      isNew: true,
    });
  } catch (err: unknown) {
    console.error('[patient-measures/save] Unerwarteter Fehler:', err);
    const error = err as { message?: string };
    return NextResponse.json(
      {
        error: 'Interner Fehler beim Speichern der Messung.',
        message: error?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
