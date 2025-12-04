// app/api/amy/stress-report/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Anthropic from '@anthropic-ai/sdk';
import { getAmyFallbackText } from '@/lib/amyFallbacks';

// Supabase-ENV robust auslesen
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn(
    '[stress-report] Supabase-Env nicht gesetzt. Bitte NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY prüfen.'
  );
}

const supabase =
  supabaseUrl && supabaseServiceKey
    ? createClient(supabaseUrl, supabaseServiceKey, {
        auth: { persistSession: false },
      })
    : null;

const anthropicApiKey =
  process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_TOKEN;
const MODEL =
  process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5-20250929';

const anthropic = anthropicApiKey
  ? new Anthropic({ apiKey: anthropicApiKey })
  : null;

type RiskLevel = 'low' | 'moderate' | 'high';

type AnswerRow = {
  question_id: string | null;
  answer_value: number | null;
};

const STRESS_KEYS = ['stress_q1', 'stress_q2', 'stress_q3', 'stress_q4', 'stress_q5'];

const SLEEP_KEYS = ['sleep_q1', 'sleep_q2', 'sleep_q3'];

function average(values: number[]): number | null {
  if (!values.length) return null;
  const sum = values.reduce((a, b) => a + b, 0);
  return sum / values.length;
}

function computeScores(answers: AnswerRow[]) {
  const stressVals = answers
    .filter((a) => a.question_id && STRESS_KEYS.includes(a.question_id))
    .map((a) => a.answer_value)
    .filter((v): v is number => typeof v === 'number');

  const sleepVals = answers
    .filter((a) => a.question_id && SLEEP_KEYS.includes(a.question_id))
    .map((a) => a.answer_value)
    .filter((v): v is number => typeof v === 'number');

  const stressAvg = average(stressVals);
  const sleepAvg = average(sleepVals);

  const scaleTo100 = (avg: number | null): number | null => {
    if (avg == null) return null;
    const min = 1;
    const max = 5;
    const normalized = (avg - min) / (max - min);
    return Math.round(normalized * 100);
  };

  const stressScore = scaleTo100(stressAvg);
  const sleepScore = scaleTo100(sleepAvg);

  let riskLevel: RiskLevel | null = null;
  if (stressScore != null) {
    if (stressScore < 40) riskLevel = 'low';
    else if (stressScore < 70) riskLevel = 'moderate';
    else riskLevel = 'high';
  }

  return { stressScore, sleepScore, riskLevel };
}

async function createAmySummary(params: {
  stressScore: number | null;
  sleepScore: number | null;
  riskLevel: RiskLevel | null;
  answers: AnswerRow[];
}) {
  const { stressScore, sleepScore, riskLevel, answers } = params;

  // Kein Anthropic-Key → Fallback-Text
  if (!anthropic) {
    console.warn('[stress-report] Anthropic not configured, using fallback text');
    return getAmyFallbackText({ riskLevel, stressScore, sleepScore });
  }

  const answersJson = JSON.stringify(answers, null, 2);

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      temperature: 0.3,
      system:
        'Du bist "AMY", eine empathische, evidenzbasierte Assistenz für Stress, Resilienz und Schlaf. ' +
        'Du sprichst mit Patienten auf Augenhöhe, in klarer, kurzer Sprache (deutsch), ohne medizinische Diagnosen zu stellen. ' +
        'Fasse die Ergebnisse in einem kurzen, gut verständlichen Fließtext zusammen (max. ~200 Wörter). ' +
        'Keine Bulletpoints, keine Überschriften.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                `Hier sind die Ergebnisse eines kurzen Stress- und Schlaf-Checks.\n\n` +
                `Stress-Score (0–100): ${stressScore ?? 'nicht berechenbar'}\n` +
                `Sleep-Score (0–100): ${sleepScore ?? 'nicht berechenbar'}\n` +
                `Eingestuftes Stressniveau: ${riskLevel ?? 'nicht klassifiziert'}\n\n` +
                `Die einzelnen Antworten (JSON):\n${answersJson}\n\n` +
                `Bitte schreibe einen kurzen, motivierenden und realistischen Einordnungstext. ` +
                `Erkläre knapp, was der Wert bedeutet, und schlage 2–3 konkrete, alltagstaugliche nächste Schritte vor. ` +
                `Duzen ist erlaubt und erwünscht.`,
            },
          ],
        },
      ],
    });

    const textParts = response.content
      .filter((c) => c.type === 'text')
      .map((c) => ('text' in c ? c.text : ''));

    return textParts.join('\n').trim();
  } catch (error) {
    // LLM-Fehler → Fallback-Text verwenden
    console.error('[stress-report] LLM error, using fallback text:', error);
    return getAmyFallbackText({ riskLevel, stressScore, sleepScore });
  }
}

export async function POST(req: Request) {
  try {
    if (!supabase) {
      console.error(
        '[stress-report] Supabase nicht initialisiert – Env Variablen fehlen.'
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

    const { data: answers, error: answersError } = await supabase
      .from('assessment_answers')
      .select('question_id, answer_value')
      .eq('assessment_id', assessmentId);

    if (answersError) {
      console.error('[stress-report] Fehler beim Laden der Antworten:', answersError);
      return NextResponse.json(
        { error: 'Fehler beim Laden der Antworten aus der Datenbank.' },
        { status: 500 }
      );
    }

    const typedAnswers: AnswerRow[] = (answers ?? []) as AnswerRow[];

    const { stressScore, sleepScore, riskLevel } = computeScores(typedAnswers);

    const reportTextShort = await createAmySummary({
      stressScore,
      sleepScore,
      riskLevel,
      answers: typedAnswers,
    });

    const { data: existingReports, error: existingError } = await supabase
      .from('stress_reports')
      .select('*')
      .eq('assessment_id', assessmentId)
      .limit(1);

    if (existingError) {
      console.error('[stress-report] Fehler beim Laden des Reports:', existingError);
    }

    let reportRow;

    if (existingReports && existingReports.length > 0) {
      const existing = existingReports[0];
      const { data: updated, error: updateError } = await supabase
        .from('stress_reports')
        .update({
          score_numeric: stressScore ?? existing.score_numeric,
          risk_level: riskLevel ?? existing.risk_level,
          report_text_short: reportTextShort,
        })
        .eq('id', existing.id)
        .select()
        .single();

      if (updateError) {
        console.error(
          '[stress-report] Fehler beim Update des Reports:',
          updateError
        );
        return NextResponse.json(
          { error: 'Fehler beim Aktualisieren des Reports.' },
          { status: 500 }
        );
      }

      reportRow = updated;
    } else {
      const { data: inserted, error: insertError } = await supabase
        .from('stress_reports')
        .insert({
          assessment_id: assessmentId,
          score_numeric: stressScore ?? null,
          risk_level: riskLevel ?? null,
          report_text_short: reportTextShort,
        })
        .select()
        .single();

      if (insertError) {
        console.error('[stress-report] Fehler beim Insert des Reports:', insertError);
        return NextResponse.json(
          { error: 'Fehler beim Anlegen des Reports.' },
          { status: 500 }
        );
      }

      reportRow = inserted;
    }

    return NextResponse.json({
      report: reportRow,
      scores: {
        stressScore,
        sleepScore,
        riskLevel,
      },
    });
  } catch (err: unknown) {
    console.error('[stress-report] Unerwarteter Fehler:', err);
    const error = err as { message?: string };
    return NextResponse.json(
      {
        error: 'Interner Fehler bei der Erstellung des Reports.',
        message: error?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
