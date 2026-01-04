/**
 * Canonical Hashing Utility - V05-I05.8
 * 
 * Provides deterministic hashing for idempotency checks.
 * Uses stable JSON stringification with sorted keys.
 * 
 * @module lib/pdf/canonicalHash
 */

import { createHash } from 'crypto'

/**
 * Canonical JSON stringify
 * Ensures stable string representation regardless of key order
 * 
 * @param obj - Object to stringify
 * @returns Canonical JSON string
 */
function canonicalStringify(obj: any): string {
  if (obj === null) return 'null'
  if (obj === undefined) return 'undefined'
  if (typeof obj !== 'object') return JSON.stringify(obj)
  
  if (Array.isArray(obj)) {
    return '[' + obj.map(canonicalStringify).join(',') + ']'
  }
  
  // Sort keys for deterministic output
  const keys = Object.keys(obj).sort()
  const pairs = keys.map(key => {
    const value = canonicalStringify(obj[key])
    return `${JSON.stringify(key)}:${value}`
  })
  
  return '{' + pairs.join(',') + '}'
}

/**
 * Compute canonical hash for PDF idempotency
 * Hashes: template version + sections version + sections content
 * 
 * @param input - Input data for hashing
 * @returns SHA-256 hash (64 hex chars)
 */
export function computeCanonicalPdfHash(input: {
  pdfTemplateVersion: string
  sectionsVersion: string
  sectionsData: any
}): string {
  // Create canonical input object
  const canonicalInput = {
    pdfTemplateVersion: input.pdfTemplateVersion,
    sectionsVersion: input.sectionsVersion,
    sectionsData: input.sectionsData,
  }
  
  // Stringify with sorted keys
  const canonicalJson = canonicalStringify(canonicalInput)
  
  // Compute SHA-256 hash
  return createHash('sha256').update(canonicalJson).digest('hex')
}
