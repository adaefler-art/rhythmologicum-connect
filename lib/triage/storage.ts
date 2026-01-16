/**
 * E6.6.5 — Triage Storage Helper
 *
 * Utility for storing and retrieving triage results from sessionStorage.
 * Supports retry/rationale display and debugging.
 *
 * @module lib/triage/storage
 */

import { safeValidateTriageResult, type TriageResultV1 } from '@/lib/api/contracts/triage'

/**
 * Storage key for last triage result
 */
const STORAGE_KEY = 'lastTriageResult'

/**
 * Stores a triage result in sessionStorage
 * E6.6.5: Store last result for rationale/retry
 *
 * @param result - The triage result to store
 * @returns true if stored successfully, false otherwise
 */
export function storeTriageResult(result: TriageResultV1): boolean {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    console.warn('[TriageStorage] sessionStorage not available')
    return false
  }

  try {
    const serialized = JSON.stringify(result)
    window.sessionStorage.setItem(STORAGE_KEY, serialized)
    return true
  } catch (error) {
    console.error('[TriageStorage] Failed to store triage result', error)
    return false
  }
}

/**
 * Retrieves the last triage result from sessionStorage
 *
 * @returns The last triage result, or null if not found or invalid
 */
export function getLastTriageResult(): TriageResultV1 | null {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return null
  }

  try {
    const serialized = window.sessionStorage.getItem(STORAGE_KEY)
    
    if (!serialized) {
      return null
    }

    const parsed = JSON.parse(serialized)
    
    // Validate that it's a proper TriageResultV1
    const validated = safeValidateTriageResult(parsed)
    
    if (!validated) {
      console.warn('[TriageStorage] Stored result failed validation, clearing')
      clearTriageResult()
      return null
    }

    return validated
  } catch (error) {
    console.error('[TriageStorage] Failed to retrieve triage result', error)
    clearTriageResult()
    return null
  }
}

/**
 * Clears the stored triage result
 * 
 * @returns void
 */
export function clearTriageResult(): void {
  if (typeof window === 'undefined' || !window.sessionStorage) {
    return
  }

  try {
    window.sessionStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('[TriageStorage] Failed to clear triage result', error)
  }
}

/**
 * Checks if a triage result is stored
 *
 * @returns true if a valid triage result is stored
 */
export function hasStoredTriageResult(): boolean {
  return getLastTriageResult() !== null
}
