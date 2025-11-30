// app/api/amy/stress-report/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabaseClient'
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { assessmentId } = body

    if (!assessmentId) {
      return NextResponse.json(
        { ok: false, error: 'assessmentId fehlt' },
        { status: 400 }
      )
    }

    // 1) Antworten zu diesem Assessment laden
    // Annahme: Tabelle "stress_answers" mit:
    // - assessment_id (uuid)
    // - question_key (text)
    // - answer_value (integer / numeric)
    const { data: answers, error: answersError } = await supabase
      .from('stress_answers')
      .select('question_key, answer_value')
      .eq('assessment_id', assessmentId)

    if (answersError) {
      console.error('Supabase Fehler (answers):', answersError)
      return NextResponse.json(
        { ok: false, error: 'Fehler beim Laden der Antworten' },
        { status: 500 }
      )
    }

    const safeAnswers = answers ?? []

    // 2) Score berechnen (sehr simpel: Summe)
    const score = safeAnswers.reduce((sum, a: any) => {
      const v = typeof a.answer_value === 'number' ? a.answer_value : 0
      return sum + v
    }, 0)

    // 3) Antworten für Prompt aufbereiten
    const answersForPrompt =
      safeAnswers.length === 0
        ? 'Keine Antworten gefunden.'
        : safeAnswers
            .map(
              (a: any) =>
                `Frage: ${a.question_key ?? 'ohne_key'} → Antwort: ${
                  a.answer_value ?? '-'
                }`
            )
            .join('\n')

    // 4) Claude (AMY) aufrufen
    const message = await anthropic.messages.create({
      model: 'claude-3-5-haiku-20241022', // eines deiner vorhandenen Modelle
      max_tokens: 600,
      temperature: 0.2,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                `Du bist eine ärztlich denkende KI-Assistentin namens AMY.\n` +
                `Du bekommst die Antworten eines Patienten auf einen Stress- & Resilienz-Fragebogen.\n\n` +
                `Bitte analysiere die Situation des Patienten knapp und laienverständlich:\n` +
                `1. Kurze Einordnung des Stressniveaus.\n` +
                `2. Wie belastbar / resilient ist die Person?\n` +
                `3. 3 konkrete, leicht umsetzbare Empfehlungen für die nächsten 1–2 Wochen.\n\n` +
                `Hier sind die Daten:\n\n` +
                `Gesamtscore: ${score}\n\n` +
                `Antworten:\n${answersForPrompt}`,
            },
          ],
        },
      ],
    })

    const first = message.content[0]
    const analysis =
      first && first.type === 'text' ? first.text : 'Keine Auswertung erhalten.'

    // 5) Risk-Level aus Score ableiten (primitive Logik als Platzhalter)
    let riskLevel: 'low' | 'moderate' | 'high' | null = null
    if (score <= 10) riskLevel = 'low'
    else if (score <= 20) riskLevel = 'moderate'
    else riskLevel = 'high'

    // 6) Report in Supabase ablegen
    const { error: insertError } = await supabase.from('reports').insert({
      assessment_id: assessmentId,
      score_numeric: score,
      risk_level: riskLevel,
      report_text_short: analysis,
    })

    if (insertError) {
      console.error('Supabase Fehler (insert report):', insertError)
      // wir brechen *nicht* ab, der Client bekommt trotzdem eine Antwort
    }

    // 7) Antwort an den Client (für Debug & Fallback)
    return NextResponse.json(
      {
        ok: true,
        assessmentId,
        score,
        answerCount: safeAnswers.length,
        analysis,
      },
      { status: 200 }
    )
  } catch (e: any) {
    console.error('AMY-Route Exception:', e)
    return NextResponse.json(
      {
        ok: false,
        error: 'Fehler beim Aufruf der Claude-API oder bei der Verarbeitung',
        details: e?.message ?? String(e),
      },
      { status: 500 }
    )
  }
}
