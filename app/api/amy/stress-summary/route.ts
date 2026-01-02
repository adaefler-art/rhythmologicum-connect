// app/api/amy/stress-summary/route.ts
import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { getAmyFallbackText, type RiskLevel } from '@/lib/amyFallbacks';
import { trackUsage } from '@/lib/monitoring/usageTrackingWrapper';
import { env } from '@/lib/env';

// Anthropic API configuration
const anthropicApiKey = env.ANTHROPIC_API_KEY || env.ANTHROPIC_API_TOKEN;
const MODEL = env.ANTHROPIC_MODEL ?? 'claude-sonnet-4-5-20250929';

const anthropic = anthropicApiKey
  ? new Anthropic({ apiKey: anthropicApiKey })
  : null;

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
    console.warn('[stress-summary] Anthropic not configured, using fallback text');
    // Return fallback response with same structure as LLM response
    return {
      report_text_short: getAmyFallbackText({ riskLevel, stressScore, sleepScore }),
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
    
    // Determine error type for better diagnostics
    let errorType = 'unknown';
    let errorMessage = String(error);
    
    if (error && typeof error === 'object') {
      const err = error as { status?: number; type?: string; message?: string };
      
      if (err.status === 429) {
        errorType = 'rate_limit';
      } else if (err.status === 408 || errorMessage.includes('timeout')) {
        errorType = 'timeout';
      } else if (err.type === 'invalid_request_error' || errorMessage.includes('JSON')) {
        errorType = 'json_parsing';
      } else if (err.status && err.status >= 500) {
        errorType = 'api_error';
      }
      
      if (err.message) {
        errorMessage = err.message;
      }
    }

    console.error('[stress-summary] LLM request failed', {
      duration: `${duration}ms`,
      errorType,
      errorMessage,
      model: MODEL,
    });

    // LLM-Fehler → Fallback-Text verwenden
    return {
      report_text_short: getAmyFallbackText({ riskLevel, stressScore, sleepScore }),
      risk_level: riskLevel,
    };
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
  console.log('[stress-summary] POST request received');

  try {
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
    const summary = await generateSummary(validation.data!);
    
    const totalDuration = Date.now() - requestStartTime;
    console.log('[stress-summary] Request completed successfully', {
      duration: `${totalDuration}ms`,
      stressScore: validation.data?.stressScore,
      sleepScore: validation.data?.sleepScore,
      riskLevel: validation.data?.riskLevel,
      responseLength: summary.report_text_short.length,
    });

    const response = NextResponse.json<StressSummaryResponse>(summary);
    
    // Track usage (fire and forget)
    trackUsage('POST /api/amy/stress-summary', response);
    
    return response;
  } catch (err) {
    const duration = Date.now() - requestStartTime;
    const error = err as { message?: string };
    console.error('[stress-summary] Unexpected error', {
      duration: `${duration}ms`,
      error: error?.message ?? String(err),
    });

    const response = NextResponse.json<ErrorResponse>(
      {
        error: 'Interner Fehler bei der Erstellung der Kurzinterpretation.',
        errorType: 'unknown',
        message: error?.message ?? String(err),
      },
      { status: 500 }
    );
    
    // Track usage (fire and forget)
    trackUsage('POST /api/amy/stress-summary', response);
    
    return response;
  }
}
