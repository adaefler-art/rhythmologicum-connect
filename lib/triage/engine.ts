/**
 * E6.6.3 — Triage Engine v1 (Rule/Template-first, deterministic, pilot-safe)
 *
 * Deterministic classification + Red Flag detection + routing decision.
 * NO LLM - pure rule-based logic for pilot safety and governance.
 *
 * Key Principles:
 * - Same input → same output (determinism)
 * - Red flags always dominate (ESCALATE priority)
 * - Fixed rule ordering (no randomness)
 * - Versioned ruleset for governance
 */

import type {
  TriageResultV1,
  TriageTier,
  TriageNextAction,
  RedFlagType,
} from '@/lib/api/contracts/triage'
import { TRIAGE_TIER, TRIAGE_NEXT_ACTION, TRIAGE_SCHEMA_VERSION } from '@/lib/api/contracts/triage'

/**
 * Ruleset version for governance and auditing
 */
export const TRIAGE_RULESET_VERSION = '1.0.0' as const

/**
 * Input for triage engine
 */
export type TriageEngineInput = {
  /** User input text (already validated for length) */
  inputText: string
  /** Optional correlation ID for tracking */
  correlationId?: string
}

/**
 * Red flag keyword patterns (case-insensitive allowlist)
 * These keywords trigger immediate escalation
 */
const RED_FLAG_KEYWORDS = [
  // German emergency/crisis keywords
  'suizid',
  'selbstmord',
  'umbringen',
  'sterben will',
  'nicht mehr leben',
  'selbstverletzung',
  'verletze mich',
  'selbstschädigung',
  'notfall',
  'akute gefahr',
  'panikattacke',
  'herzinfarkt',
  'atemnot',
  // English emergency/crisis keywords
  'suicide',
  'kill myself',
  'end my life',
  'self-harm',
  'self harm',
  'hurt myself',
  'emergency',
  'panic attack',
  'heart attack',
  'cant breathe',
  'cannot breathe',
] as const

/**
 * Assessment keywords - indicate need for structured assessment
 * (German and English)
 */
const ASSESSMENT_KEYWORDS = [
  // German
  'stress',
  'erschöpfung',
  'burnout',
  'schlafprobleme',
  'schlafstörung',
  'einschlafen',
  'durchschlafen',
  'angst',
  'sorgen',
  'niedergeschlagen',
  'depressiv',
  'müde',
  'erschöpft',
  'überlastet',
  'überfordert',
  // English
  'exhaustion',
  'sleep problems',
  'insomnia',
  'anxiety',
  'worried',
  'depressed',
  'tired',
  'overwhelmed',
] as const

/**
 * Info keywords - indicate informational queries
 */
const INFO_KEYWORDS = [
  // German
  'was ist',
  'wie funktioniert',
  'erklären sie',
  'information über',
  'kann ich erfahren',
  'mehr wissen',
  // English
  'what is',
  'how does',
  'can you explain',
  'information about',
  'tell me about',
] as const

/**
 * Normalize input text for consistent processing
 * - Lowercase
 * - Trim whitespace
 * - Collapse multiple spaces
 */
export function normalizeInput(inputText: string): string {
  return inputText
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
}

/**
 * Detect red flags in normalized input
 * Rule: Any red flag keyword triggers ESCALATE tier
 *
 * @returns Array of detected red flag types
 */
export function detectRedFlagsInInput(normalizedInput: string): RedFlagType[] {
  const detectedFlags: RedFlagType[] = []

  // Check each red flag keyword
  for (const keyword of RED_FLAG_KEYWORDS) {
    if (normalizedInput.includes(keyword)) {
      // Use 'answer_pattern' as the red flag type for keyword matches
      if (!detectedFlags.includes('answer_pattern')) {
        detectedFlags.push('answer_pattern')
      }
      break // One red flag is enough to trigger escalation
    }
  }

  return detectedFlags
}

/**
 * Classify input to INFO vs ASSESSMENT tier
 * Rule ordering (checked in sequence):
 * 1. Info keywords → INFO
 * 2. Assessment keywords → ASSESSMENT
 * 3. Default → ASSESSMENT (conservative approach)
 *
 * @param normalizedInput - Normalized input text
 * @returns Tier classification (INFO or ASSESSMENT)
 */
export function classifyTier(normalizedInput: string): TriageTier {
  // Rule 1: Check for info keywords (highest priority for non-emergency)
  for (const keyword of INFO_KEYWORDS) {
    if (normalizedInput.includes(keyword)) {
      return TRIAGE_TIER.INFO
    }
  }

  // Rule 2: Check for assessment keywords
  for (const keyword of ASSESSMENT_KEYWORDS) {
    if (normalizedInput.includes(keyword)) {
      return TRIAGE_TIER.ASSESSMENT
    }
  }

  // Rule 3: Default to ASSESSMENT (conservative: when in doubt, assess)
  return TRIAGE_TIER.ASSESSMENT
}

/**
 * Determine next action based on tier
 * Mapping:
 * - INFO → SHOW_CONTENT
 * - ASSESSMENT → START_FUNNEL_A
 * - ESCALATE → SHOW_ESCALATION
 */
export function determineNextAction(tier: TriageTier): TriageNextAction {
  switch (tier) {
    case TRIAGE_TIER.INFO:
      return TRIAGE_NEXT_ACTION.SHOW_CONTENT
    case TRIAGE_TIER.ASSESSMENT:
      return TRIAGE_NEXT_ACTION.START_FUNNEL_A
    case TRIAGE_TIER.ESCALATE:
      return TRIAGE_NEXT_ACTION.SHOW_ESCALATION
    default:
      // Should never happen, but TypeScript doesn't know that
      return TRIAGE_NEXT_ACTION.START_FUNNEL_A
  }
}

/**
 * Generate deterministic rationale based on tier and flags
 * This is generic routing rationale, NOT medical diagnosis
 */
export function generateRationale(
  tier: TriageTier,
  redFlags: RedFlagType[],
): string {
  if (redFlags.length > 0) {
    return 'Ihre Nachricht enthält Hinweise auf eine Notfallsituation. Bitte wenden Sie sich umgehend an professionelle Hilfe.'
  }

  switch (tier) {
    case TRIAGE_TIER.INFO:
      return 'Ihre Anfrage scheint informativ zu sein. Wir zeigen Ihnen passende Inhalte.'
    case TRIAGE_TIER.ASSESSMENT:
      return 'Basierend auf Ihrer Nachricht empfehlen wir eine strukturierte Einschätzung. Bitte füllen Sie den Fragebogen aus.'
    case TRIAGE_TIER.ESCALATE:
      return 'Ihre Nachricht deutet auf eine dringende Situation hin. Wir empfehlen eine sofortige Kontaktaufnahme mit einem Arzt.'
    default:
      return 'Bitte füllen Sie den Fragebogen für eine genaue Einschätzung aus.'
  }
}

/**
 * Main triage decision pipeline
 *
 * Process:
 * 1. Normalize input
 * 2. Detect red flags → if found, ESCALATE (dominates all other rules)
 * 3. Otherwise, classify to INFO vs ASSESSMENT
 * 4. Determine next action based on tier
 * 5. Generate routing rationale
 *
 * @param input - Triage engine input
 * @returns TriageResultV1 compliant result
 */
export function runTriageEngine(input: TriageEngineInput): TriageResultV1 {
  // Step 1: Normalize input
  const normalizedInput = normalizeInput(input.inputText)

  // Step 2: Detect red flags (highest priority)
  const redFlags = detectRedFlagsInInput(normalizedInput)

  // Step 3: Determine tier
  let tier: TriageTier
  if (redFlags.length > 0) {
    // Red flags always dominate → ESCALATE
    tier = TRIAGE_TIER.ESCALATE
  } else {
    // No red flags → classify normally
    tier = classifyTier(normalizedInput)
  }

  // Step 4: Determine next action
  const nextAction = determineNextAction(tier)

  // Step 5: Generate rationale
  const rationale = generateRationale(tier, redFlags)

  // Return compliant v1 result
  return {
    tier,
    nextAction,
    redFlags,
    rationale,
    version: TRIAGE_SCHEMA_VERSION,
    correlationId: input.correlationId,
  }
}
