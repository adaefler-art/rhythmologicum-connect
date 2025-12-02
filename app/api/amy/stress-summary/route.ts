// app/api/amy/stress-summary/route.ts
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Edge Runtime für optimale Performance und globale Verfügbarkeit
export const runtime = 'edge';

const anthropicApiKey =
  process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_TOKEN;
const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5-20250929';

type RiskLevel = 'low' | 'moderate' | 'high';

interface StressSummaryInput {
  stressScore: number | null;
  sleepScore: number | null;
  riskLevel: RiskLevel | null;
}

function validateInput(
  body: unknown
): { valid: true; data: StressSummaryInput } | { valid: false; error: string } {
  if (!body || typeof body !== 'object') {
    return { valid: false, error: 'Request-Body fehlt oder ist ungültig.' };
  }

  const { stressScore, sleepScore, riskLevel } = body as Record<
    string,
    unknown
  >;

  // stressScore und sleepScore: number oder null erlaubt
  if (
    stressScore !== null &&
    (typeof stressScore !== 'number' || stressScore < 0 || stressScore > 100)
  ) {
    return {
      valid: false,
      error: 'stressScore muss eine Zahl zwischen 0 und 100 oder null sein.',
    };
  }

  if (
    sleepScore !== null &&
    (typeof sleepScore !== 'number' || sleepScore < 0 || sleepScore > 100)
  ) {
    return {
      valid: false,
      error: 'sleepScore muss eine Zahl zwischen 0 und 100 oder null sein.',
    };
  }

  // riskLevel: 'low', 'moderate', 'high' oder null erlaubt
  const validRiskLevels: Array<RiskLevel | null> = [
    'low',
    'moderate',
    'high',
    null,
  ];
  if (!validRiskLevels.includes(riskLevel as RiskLevel | null)) {
    return {
      valid: false,
      error:
        "riskLevel muss 'low', 'moderate', 'high' oder null sein.",
    };
  }

  return {
    valid: true,
    data: {
      stressScore: stressScore as number | null,
      sleepScore: sleepScore as number | null,
      riskLevel: riskLevel as RiskLevel | null,
    },
  };
}

function createFallbackSummary(input: StressSummaryInput): string {
  const { stressScore, sleepScore, riskLevel } = input;

  const riskLabels: Record<RiskLevel, string> = {
    low: 'niedrigen',
    moderate: 'mittleren',
    high: 'hohen',
  };

  let text = 'Vielen Dank, dass du dir die Zeit für diesen Check genommen hast. ';

  if (stressScore !== null) {
    text += `Dein aktueller Stress-Score liegt bei ${stressScore} von 100 Punkten. `;
    if (stressScore < 30) {
      text +=
        'Das deutet darauf hin, dass du momentan gut mit Belastungen umgehst – eine solide Basis. ';
    } else if (stressScore < 60) {
      text +=
        'Das zeigt ein moderates Stressniveau, das Aufmerksamkeit verdient. ';
    } else {
      text +=
        'Das weist auf ein erhöhtes Stressniveau hin, bei dem Unterstützung sinnvoll sein kann. ';
    }
  }

  if (sleepScore !== null) {
    text += `Dein Schlaf-Score beträgt ${sleepScore} von 100. `;
    if (sleepScore < 30) {
      text +=
        'Guter Schlaf ist ein wichtiger Schutzfaktor für deine Gesundheit. ';
    } else if (sleepScore < 60) {
      text +=
        'Es gibt Hinweise, dass dein Schlaf Verbesserungspotenzial hat. ';
    } else {
      text +=
        'Die Schlafqualität scheint beeinträchtigt zu sein, was Stress verstärken kann. ';
    }
  }

  if (riskLevel) {
    text += `Insgesamt entspricht das einem ${riskLabels[riskLevel]} Risiko für stressbedingte Beschwerden. `;
  }

  text +=
    'Regelmäßige Pausen, Bewegung und bewusste Entspannung können helfen, deine Resilienz zu stärken. ';
  text +=
    'Sprich bei anhaltenden Beschwerden gerne mit einer Fachperson – du bist nicht allein.';

  return text;
}

async function createAmySummary(input: StressSummaryInput): Promise<string> {
  const { stressScore, sleepScore, riskLevel } = input;

  // Kein Anthropic-Key verfügbar → Fallback-Text
  if (!anthropicApiKey) {
    return createFallbackSummary(input);
  }

  const anthropic = new Anthropic({ apiKey: anthropicApiKey });

  try {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 500,
      temperature: 0.3,
      system:
        'Du bist "AMY", eine empathische, evidenzbasierte Assistenz für Stress, Resilienz und Schlaf. ' +
        'Du sprichst mit Patienten auf Augenhöhe, in klarer, kurzer Sprache (deutsch), ohne medizinische Diagnosen zu stellen. ' +
        'Deine Antworten basieren auf aktuellen wissenschaftlichen Erkenntnissen zu Stress und Schlaf. ' +
        'Fasse die Ergebnisse in einem kurzen, gut verständlichen Fließtext zusammen (ca. 200 Wörter). ' +
        'Keine Bulletpoints, keine Überschriften. Duzen ist erlaubt und erwünscht.',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text:
                `Hier sind die Ergebnisse eines Stress- und Schlaf-Assessments.\n\n` +
                `Stress-Score (0–100, höher = mehr Stress): ${stressScore ?? 'nicht berechenbar'}\n` +
                `Schlaf-Score (0–100, höher = schlechterer Schlaf): ${sleepScore ?? 'nicht berechenbar'}\n` +
                `Eingestuftes Stressniveau: ${riskLevel ?? 'nicht klassifiziert'}\n\n` +
                `Bitte schreibe einen empathischen, motivierenden und realistischen Einordnungstext. ` +
                `Erkläre kurz und verständlich, was die Werte bedeuten, und ` +
                `gib 2–3 konkrete, alltagstaugliche und evidenzbasierte Empfehlungen.`,
            },
          ],
        },
      ],
    });

    const textParts = response.content
      .filter((c): c is Anthropic.TextBlock => c.type === 'text')
      .map((c) => c.text);

    return textParts.join('\n').trim();
  } catch (error) {
    // Anthropic-Fehler (z.B. Rate Limit, Netzwerk) → Fallback
    console.error('[stress-summary] Anthropic-Fehler:', error);
    return createFallbackSummary(input);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);

    const validation = validateInput(body);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    const summary = await createAmySummary(validation.data);

    return NextResponse.json({
      summary,
      input: validation.data,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error('[stress-summary] Unerwarteter Fehler:', err);
    return NextResponse.json(
      {
        error: 'Interner Fehler bei der Erstellung der Zusammenfassung.',
        message,
      },
      { status: 500 }
    );
  }
}
