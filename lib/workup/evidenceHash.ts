/**
 * E6.4.5: Evidence Pack Hash Generator
 *
 * Generates stable, deterministic hashes from evidence packs.
 * Same inputs always produce the same hash.
 */

import { createHash } from 'crypto'
import type { EvidencePack } from '@/lib/types/workup'

/**
 * Generate a stable hash from an evidence pack
 *
 * The hash is deterministic - same inputs always produce the same hash.
 * This allows us to detect when evidence has changed.
 *
 * @param evidencePack - The evidence pack to hash
 * @returns SHA256 hash string (hex format)
 */
export function generateEvidencePackHash(evidencePack: EvidencePack): string {
  // Create a canonical representation by sorting keys
  const canonical = {
    assessmentId: evidencePack.assessmentId,
    funnelSlug: evidencePack.funnelSlug,
    // Sort answer keys for deterministic ordering
    answers: Object.keys(evidencePack.answers)
      .sort()
      .reduce(
        (sorted, key) => {
          sorted[key] = evidencePack.answers[key]
          return sorted
        },
        {} as Record<string, number | string | boolean>,
      ),
    hasUploadedDocuments: evidencePack.hasUploadedDocuments ?? false,
    hasWearableData: evidencePack.hasWearableData ?? false,
  }

  // Convert to stable JSON string
  const jsonString = JSON.stringify(canonical)

  // Generate SHA256 hash
  const hash = createHash('sha256').update(jsonString).digest('hex')

  return hash
}

/**
 * Verify if an evidence pack matches a given hash
 *
 * @param evidencePack - The evidence pack to verify
 * @param expectedHash - The expected hash value
 * @returns True if the hash matches
 */
export function verifyEvidencePackHash(evidencePack: EvidencePack, expectedHash: string): boolean {
  const actualHash = generateEvidencePackHash(evidencePack)
  return actualHash === expectedHash
}
