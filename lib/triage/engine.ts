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
  Uc1SafetyRoute,
} from '@/lib/api/contracts/triage'
import {
  TRIAGE_TIER,
  TRIAGE_NEXT_ACTION,
  TRIAGE_SCHEMA_VERSION,
  UC1_SAFETY_ROUTE,
} from '@/lib/api/contracts/triage'
import {
  CLINICAL_RED_FLAG,
  hasAnyRedFlag,
  detectClinicalRedFlags,
  type ClinicalRedFlag,
} from './redFlagCatalog'

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
  /** I72.6: Assessment summary for handoff routing */
  assessmentSummary?: {
    status: string
    funnelSlug: string | null
  } | null
}

/**
 * Red flag detection now uses the clinical red flag catalog (E6.6.7)
 * See: lib/triage/redFlagCatalog.ts and docs/clinical/triage_red_flags_v1.md
 *
 * This ensures:
 * - Allowlist-only red flags (no ad-hoc additions)
 * - Conservative patterns (better false positives than false negatives)
 * - Versioned catalog for governance
 */

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
 * Urgent (but not emergency) markers for physician appointment routing
 */
const URGENT_APPOINTMENT_KEYWORDS = [
  'dringend',
  'heute noch',
  'sofort termin',
  'schnell termin',
  'zeitnah',
  'akut',
  'stark verschlechtert',
  'rasch schlechter',
  'urgent',
  'same day',
  'asap',
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
 * Uses the clinical red flag catalog (E6.6.7) for allowlist-based detection.
 *
 * @returns Array of detected red flag types
 */
export function detectRedFlagsInInput(normalizedInput: string): RedFlagType[] {
  // Check if any clinical red flag is present
  if (hasAnyRedFlag(normalizedInput)) {
    // Return 'answer_pattern' as the red flag type for triage contract compatibility
    return ['answer_pattern']
  }

  return []
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
 * Determine next action based on tier and assessment state (I72.6)
 * Mapping:
 * - INFO → SHOW_CONTENT
 * - ASSESSMENT → START_FUNNEL_A (or continue if in-progress)
 * - ESCALATE → SHOW_ESCALATION
 *
 * I72.6 Enhancement:
 * - If assessment is in_progress → suggest continue
 * - If assessment is completed → can trigger insights/content
 * - If no assessment → suggest start assessment
 */
export function determineNextAction(
  tier: TriageTier,
  assessmentSummary?: { status: string; funnelSlug: string | null } | null,
): TriageNextAction {
  // Red flags always escalate regardless of assessment state
  if (tier === TRIAGE_TIER.ESCALATE) {
    return TRIAGE_NEXT_ACTION.SHOW_ESCALATION
  }

  // I72.6: Check assessment state for routing
  if (assessmentSummary) {
    const status = assessmentSummary.status

    // If in progress, suggest continue (still routes to assessment start)
    if (status === 'in_progress') {
      // Note: We still return START_FUNNEL_A as the action
      // The frontend will detect in-progress state and show "Continue" instead of "Start"
      return TRIAGE_NEXT_ACTION.START_FUNNEL_A
    }

    // If completed, can show insights or content
    if (status === 'completed') {
      // For now, show content - in future this could trigger insights
      return TRIAGE_NEXT_ACTION.SHOW_CONTENT
    }
  }

  // Default routing based on tier (only INFO or ASSESSMENT at this point)
  if (tier === TRIAGE_TIER.INFO) {
    return TRIAGE_NEXT_ACTION.SHOW_CONTENT
  }
  
  // ASSESSMENT tier or default
  return TRIAGE_NEXT_ACTION.START_FUNNEL_A
}

function hasAnyUrgentAppointmentKeyword(normalizedInput: string): boolean {
  return URGENT_APPOINTMENT_KEYWORDS.some((keyword) => normalizedInput.includes(keyword))
}

/**
 * Determine PAT-v2 UC1 safety route
 *
 * Priority:
 * 1) Critical emergency flags -> NOTRUF
 * 2) Other escalations -> NOTAUFNAHME
 * 3) Urgent non-emergency markers -> DRINGENDER_TERMIN
 * 4) Default -> STANDARD_INTAKE
 */
export function determineSafetyRoute(
  tier: TriageTier,
  normalizedInput: string,
  clinicalRedFlags: ClinicalRedFlag[],
): Uc1SafetyRoute {
  if (tier === TRIAGE_TIER.ESCALATE) {
    const criticalNotrufFlags = new Set<ClinicalRedFlag>([
      CLINICAL_RED_FLAG.SUICIDAL_IDEATION,
      CLINICAL_RED_FLAG.ACUTE_NEUROLOGICAL,
      CLINICAL_RED_FLAG.SEVERE_DYSPNEA,
      CLINICAL_RED_FLAG.SEVERE_UNCONTROLLED_SYMPTOMS,
    ])

    const hasCriticalNotrufFlag = clinicalRedFlags.some((flag) => criticalNotrufFlags.has(flag))

    if (hasCriticalNotrufFlag) {
      return UC1_SAFETY_ROUTE.NOTRUF
    }

    return UC1_SAFETY_ROUTE.NOTAUFNAHME
  }

  if (hasAnyUrgentAppointmentKeyword(normalizedInput)) {
    return UC1_SAFETY_ROUTE.DRINGENDER_TERMIN
  }

  return UC1_SAFETY_ROUTE.STANDARD_INTAKE
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
 * 4. Determine next action based on tier and assessment state (I72.6)
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
  const clinicalRedFlags = detectClinicalRedFlags(normalizedInput)

  // Step 3: Determine tier
  let tier: TriageTier
  if (redFlags.length > 0) {
    // Red flags always dominate → ESCALATE
    tier = TRIAGE_TIER.ESCALATE
  } else {
    // No red flags → classify normally
    tier = classifyTier(normalizedInput)
  }

  // Step 4: Determine next action (I72.6: considers assessment state)
  const nextAction = determineNextAction(tier, input.assessmentSummary)

  const safetyRoute = determineSafetyRoute(tier, normalizedInput, clinicalRedFlags)

  // Step 5: Generate rationale
  const rationale = generateRationale(tier, redFlags)

  // Return compliant v1 result
  return {
    tier,
    nextAction,
    redFlags,
    rationale,
    safetyRoute,
    version: TRIAGE_SCHEMA_VERSION,
    correlationId: input.correlationId,
  }
}
