// lib/versioning/constants.ts
// V05-I01.3: Versioning Contract Constants

/**
 * Current version identifiers for the processing pipeline
 * These should be updated whenever the corresponding component changes
 */

/**
 * Algorithm bundle version for stress/resilience scoring
 * Format: vMAJOR.MINOR.PATCH
 * Update when scoring logic changes
 */
export const CURRENT_ALGORITHM_VERSION = 'v1.0.0'

/**
 * AI prompt version for report generation
 * Format: MAJOR.MINOR
 * Update when assistant prompts change (see /lib/llm/prompts.ts and /lib/config/assistant.ts)
 */
export const CURRENT_PROMPT_VERSION = '1.0'

/**
 * Default funnel version when not explicitly specified
 * This is used as a fallback
 */
export const DEFAULT_FUNNEL_VERSION = '1.0.0'

/**
 * Generate a deterministic report version from component versions and inputs hash
 * Pattern: {funnelVersion}-{algorithmVersion}-{promptVersion}-{inputsHashPrefix}
 * The inputs hash ensures uniqueness while remaining deterministic for the same inputs
 */
export function generateReportVersion(params: {
  funnelVersion?: string
  algorithmVersion?: string
  promptVersion?: string
  inputsHashPrefix: string
}): string {
  const {
    funnelVersion = DEFAULT_FUNNEL_VERSION,
    algorithmVersion = CURRENT_ALGORITHM_VERSION,
    promptVersion = CURRENT_PROMPT_VERSION,
    inputsHashPrefix,
  } = params

  return `${funnelVersion}-${algorithmVersion}-${promptVersion}-${inputsHashPrefix}`
}

/**
 * Compute SHA256 hash of inputs for detecting equivalent runs
 * Normalizes inputs to canonical JSON form before hashing
 * 
 * Input should include: assessment_id, funnel_version_id, algorithm_version, 
 * prompt_version, and any confirmed data/document IDs
 */
export async function computeInputsHash(inputs: unknown): Promise<string> {
  // Normalize to canonical JSON (sorted keys)
  const canonical = JSON.stringify(inputs, Object.keys(inputs as object).sort())
  
  // Use Web Crypto API for SHA-256
  const encoder = new TextEncoder()
  const data = encoder.encode(canonical)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  
  // Convert to hex string
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  
  return hashHex
}

/**
 * Get a short prefix from a hash (first 8 characters)
 * Useful for creating human-readable version identifiers
 */
export function getHashPrefix(hash: string, length: number = 8): string {
  return hash.substring(0, length)
}
