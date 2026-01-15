/**
 * E6.4.6: Red Flag Detection
 *
 * Deterministic rule-based detection of red flags requiring escalation.
 * NO DIAGNOSIS - this checks for safety/emergency indicators only.
 */

import { randomUUID } from 'crypto'
import type {
  RedFlag,
  EscalationCheckResult,
  RedFlagSeverity,
} from '@/lib/types/escalation'

/**
 * Input data for red flag detection
 */
export type RedFlagCheckInput = {
  assessmentId: string
  reportId?: string
  riskLevel?: 'low' | 'moderate' | 'high' | null
  workupStatus?: 'needs_more_data' | 'ready_for_review' | null
  missingDataFields?: string[]
}

/**
 * Check for red flags in assessment/report data
 *
 * Detection rules:
 * 1. Report risk_level = 'high' → CRITICAL red flag
 * 2. Future: specific answer patterns indicating crisis
 * 3. Future: workup flags for urgent follow-up
 *
 * @param input - Assessment and report data to check
 * @returns EscalationCheckResult with detected red flags
 */
export function detectRedFlags(input: RedFlagCheckInput): EscalationCheckResult {
  const redFlags: RedFlag[] = []
  const correlationId = generateCorrelationId()

  // Rule 1: High risk level from report
  if (input.riskLevel === 'high') {
    redFlags.push({
      severity: 'critical',
      source: 'report_risk_level',
      reason: 'Hohes Stressniveau erkannt – ärztliche Rücksprache empfohlen',
      triggeredBy: input.reportId ? [input.reportId] : undefined,
    })
  }

  // Rule 2: Future - Answer pattern detection
  // Example: Specific questions about suicidal ideation, severe symptoms
  // Not implemented in v0.6 stub

  // Rule 3: Future - Workup-based flags
  // Example: Critical data missing that indicates urgent care need
  // Not implemented in v0.6 stub

  return {
    shouldEscalate: redFlags.length > 0,
    redFlags,
    correlationId,
  }
}

/**
 * Generate a correlation ID for tracking escalation events
 * Uses crypto.randomUUID() for security
 */
function generateCorrelationId(): string {
  return `esc-${randomUUID()}`
}

/**
 * Get the highest severity from a list of red flags
 */
export function getHighestSeverity(redFlags: RedFlag[]): RedFlagSeverity | null {
  if (redFlags.length === 0) return null

  const hasCritical = redFlags.some((flag) => flag.severity === 'critical')
  return hasCritical ? 'critical' : 'high'
}

/**
 * Format red flags for display (German)
 */
export function formatRedFlagReasons(redFlags: RedFlag[]): string[] {
  return redFlags.map((flag) => flag.reason)
}
