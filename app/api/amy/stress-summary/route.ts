// app/api/amy/stress-summary/route.ts
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

// Anthropic API configuration
const anthropicApiKey =
  process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_TOKEN;
const MODEL = process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5-20250929';

const anthropic = anthropicApiKey
  ? new Anthropic({ apiKey: anthropicApiKey })
  : null;

// Types
type RiskLevel = 'low' | 'moderate' | 'high';

interface StressSummaryRequest {
  stressScore: number | null;
  sleepScore: number | null;
  riskLevel: RiskLevel | null;
}

interface StressSummaryResponse {
  report_text_short: string;
  risk_level: RiskLevel | null;
  recommendations?: string[];
}

interface ErrorResponse {
  error: string;
  errorType?: 'configuration' | 'validation' | 'api_error' | 'rate_limit' | 'parsing' | 'unknown';
  message?: string;
}

/**
 * Validates input scores and risk level
 */
function validateInput(body: unknown): {
  valid: boolean;
  error?: string;
  data?: StressSummaryRequest;
} {
  if (!body || typeof body !== 'object') {
    return {
      valid: false,
      error: 'Request body must be an object',
    };
  }

  const { stressScore, sleepScore, riskLevel } = body as Record<string, unknown>;

  // Validate score ranges if provided
  if (
    stressScore !== null &&
    stressScore !== undefined &&
    (typeof stressScore !== 'number' || stressScore < 0 || stressScore > 100)
  ) {
    return {
      valid: false,
      error: 'stressScore must be a number between 0 and 100 or null',
    };
  }

  if (
    sleepScore !== null &&
    sleepScore !== undefined &&
    (typeof sleepScore !== 'number' || sleepScore < 0 || sleepScore > 100)
  ) {
    return {
      valid: false,
      error: 'sleepScore must be a number between 0 and 100 or null',
    };
  }

  // Validate risk level if provided
  const validRiskLevels: RiskLevel[] = ['low', 'moderate', 'high'];
  if (
    riskLevel !== null &&
    riskLevel !== undefined &&
    !validRiskLevels.includes(riskLevel as RiskLevel)
  ) {
    return {
      valid: false,
      error: `riskLevel must be one of: ${validRiskLevels.join(', ')}, or null`,
    };
  }

  return {
    valid: true,
    data: {
      stressScore: stressScore ?? null,
      sleepScore: sleepScore ?? null,
      riskLevel: (riskLevel as RiskLevel) ?? null,
    },
  };
}

/**
 * Creates a short interpretation using Anthropic API
 */
async function generateSummary(
  params: StressSummaryRequest
): Promise<StressSummaryResponse> {
  const { stressScore, sleepScore, riskLevel } = params;

  // Fallback if Anthropic is not configured
  if (!anthropic) {
    const fallbackText =
      `Basierend auf den vorliegenden Daten ergibt sich ` +
      (stressScore != null
        ? `ein Stress-Score von ${stressScore} von 100`
        : 'kein berechenbarer Stress-Score') +
      (sleepScore != null
        ? ` und ein Schlaf-Score von ${sleepScore} von 100.`
        : '.') +
      (riskLevel
        ? ` Das entspricht einem ${
            riskLevel === 'high'
              ? 'hohen'
              : riskLevel === 'moderate'
              ? 'mittleren'
              : 'niedrigen'
          } Stressniveau.`
        : '');

    return {
      report_text_short: fallbackText,
      risk_level: riskLevel,
    };
  }

  const startTime = Date.now();

  try {
    // Build prompt for Anthropic
    const prompt =
      `Hier sind die Ergebnisse eines Stress- und Schlaf-Checks:\n\n` +
      `Stress-Score (0–100): ${stressScore ?? 'nicht berechenbar'}\n` +
      `Sleep-Score (0–100): ${sleepScore ?? 'nicht berechenbar'}\n` +
      `Eingestuftes Stressniveau: ${riskLevel ?? 'nicht klassifiziert'}\n\n` +
      `Bitte schreibe eine kurze, prägnante Kurzinterpretation (~200 Wörter) dieser Werte. ` +
      `Der Text soll:\n` +
      `1. Die Bedeutung der Scores in verständlicher Sprache erklären\n` +
      `2. Das Stressniveau einordnen\n` +
      `3. 2-3 konkrete, alltagstaugliche Empfehlungen geben\n\n` +
      `Schreibe in einem empathischen, motivierenden Ton auf Deutsch. ` +
      `Duzen ist erlaubt. Keine Überschriften oder Bulletpoints verwenden - nur Fließtext.`;

    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: 600,
      temperature: 0.3,
      system:
        'Du bist "AMY", eine empathische, evidenzbasierte Assistenz für Stress, Resilienz und Schlaf. ' +
        'Du sprichst mit Patienten auf Augenhöhe, in klarer, kurzer Sprache (deutsch), ohne medizinische Diagnosen zu stellen. ' +
        'Deine Antworten sind immer kurz, prägnant und hilfreich.',
      messages: [
        {
          role: 'user',
          content: [{ type: 'text', text: prompt }],
        },
      ],
    });

    const duration = Date.now() - startTime;
    console.log(`[stress-summary] LLM request completed in ${duration}ms`);

    // Extract text from response
    const textParts = response.content
      .filter((c) => c.type === 'text')
      .map((c) => ('text' in c ? c.text : ''));

    const reportTextShort = textParts.join('\n').trim();

    // Try to extract recommendations if present (optional)
    const recommendations = extractRecommendations(reportTextShort);

    return {
      report_text_short: reportTextShort,
      risk_level: riskLevel,
      ...(recommendations.length > 0 && { recommendations }),
    };
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(
      `[stress-summary] LLM request failed after ${duration}ms:`,
      error
    );

    // Re-throw with context
    throw error;
  }
}

/**
 * Attempts to extract numbered recommendations from the text (optional)
 */
function extractRecommendations(text: string): string[] {
  const recommendations: string[] = [];
  
  // Look for patterns like "1.", "2.", "3." or "Erstens", "Zweitens", etc.
  const lines = text.split('\n');
  const patterns = [
    /^\s*\d+\.\s+(.+)$/,
    /^\s*[-•]\s+(.+)$/,
  ];

  for (const line of lines) {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match && match[1]) {
        recommendations.push(match[1].trim());
      }
    }
  }

  return recommendations;
}

/**
 * POST /api/amy/stress-summary
 * 
 * Generates a short interpretation based on stress/sleep scores and risk level
 */
export async function POST(req: Request) {
  const requestStartTime = Date.now();

  try {
    // Check API configuration
    if (!anthropic) {
      console.warn(
        '[stress-summary] Anthropic API not configured. Set ANTHROPIC_API_KEY environment variable.'
      );
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Anthropic API nicht konfiguriert.',
          errorType: 'configuration',
          message: 'ANTHROPIC_API_KEY environment variable is missing',
        },
        { status: 500 }
      );
    }

    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch (parseError) {
      console.error('[stress-summary] Failed to parse request body:', parseError);
      return NextResponse.json<ErrorResponse>(
        {
          error: 'Ungültiger Request-Body.',
          errorType: 'parsing',
          message: 'Request body must be valid JSON',
        },
        { status: 400 }
      );
    }

    // Validate input
    const validation = validateInput(body);
    if (!validation.valid) {
      return NextResponse.json<ErrorResponse>(
        {
          error: validation.error || 'Validierungsfehler',
          errorType: 'validation',
        },
        { status: 400 }
      );
    }

    // Generate summary
    try {
      const summary = await generateSummary(validation.data!);
      
      const totalDuration = Date.now() - requestStartTime;
      console.log(
        `[stress-summary] Request completed successfully in ${totalDuration}ms`
      );

      return NextResponse.json<StressSummaryResponse>(summary);
    } catch (apiError) {
      // Handle specific API errors
      const duration = Date.now() - requestStartTime;
      const error = apiError as { status?: number; error?: { type?: string }; message?: string };
      
      // Check for rate limiting
      if (error?.status === 429 || error?.error?.type === 'rate_limit_error') {
        console.error(
          `[stress-summary] Rate limit exceeded after ${duration}ms:`,
          error
        );
        return NextResponse.json<ErrorResponse>(
          {
            error: 'Rate-Limit überschritten. Bitte versuchen Sie es später erneut.',
            errorType: 'rate_limit',
            message: error.message || 'Too many requests',
          },
          { status: 429 }
        );
      }

      // Check for API errors
      if (error?.status && error.status >= 500 || error?.error?.type === 'api_error') {
        console.error(
          `[stress-summary] API error after ${duration}ms:`,
          error
        );
        return NextResponse.json<ErrorResponse>(
          {
            error: 'Anthropic API ist derzeit nicht verfügbar.',
            errorType: 'api_error',
            message: error.message || 'API service unavailable',
          },
          { status: 503 }
        );
      }

      // Generic API error
      throw apiError;
    }
  } catch (err) {
    const duration = Date.now() - requestStartTime;
    const error = err as { message?: string };
    console.error(
      `[stress-summary] Unexpected error after ${duration}ms:`,
      err
    );

    return NextResponse.json<ErrorResponse>(
      {
        error: 'Interner Fehler bei der Erstellung der Kurzinterpretation.',
        errorType: 'unknown',
        message: error?.message ?? String(err),
      },
      { status: 500 }
    );
  }
}
