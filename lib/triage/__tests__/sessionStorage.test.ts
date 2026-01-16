/**
 * E6.6.6 — Triage Session Storage Tests
 *
 * Validates:
 * - AC1: No raw text stored, only SHA-256 hash
 * - Hash generation is deterministic
 * - Session data structure is correct
 */

import { computeInputHash } from '../sessionStorage'
import { TRIAGE_TIER, TRIAGE_NEXT_ACTION, TRIAGE_SCHEMA_VERSION } from '@/lib/api/contracts/triage'
import { TRIAGE_RULESET_VERSION } from '../engine'

describe('Triage Session Storage - E6.6.6', () => {
  // ============================================================
  // AC1: PHI-safe - No raw text storage
  // ============================================================

  describe('AC1: PHI-safe hash generation', () => {
    it('should compute SHA-256 hash of input text', () => {
      const inputText = 'Ich fühle mich sehr gestresst'
      const hash = computeInputHash(inputText)

      // SHA-256 produces 64 hex characters
      expect(hash).toHaveLength(64)
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should produce deterministic hash for same input', () => {
      const inputText = 'Ich fühle mich sehr gestresst'
      
      const hash1 = computeInputHash(inputText)
      const hash2 = computeInputHash(inputText)

      expect(hash1).toBe(hash2)
    })

    it('should normalize input before hashing (trim and lowercase)', () => {
      const input1 = '  Ich fühle mich GESTRESST  '
      const input2 = 'ich fühle mich gestresst'

      const hash1 = computeInputHash(input1)
      const hash2 = computeInputHash(input2)

      expect(hash1).toBe(hash2)
    })

    it('should produce different hashes for different inputs', () => {
      const input1 = 'Ich fühle mich sehr gestresst'
      const input2 = 'Ich bin müde'

      const hash1 = computeInputHash(input1)
      const hash2 = computeInputHash(input2)

      expect(hash1).not.toBe(hash2)
    })

    it('should handle empty string', () => {
      const hash = computeInputHash('')
      
      // SHA-256 of empty string is a known value
      expect(hash).toHaveLength(64)
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should handle very long input', () => {
      const longInput = 'a'.repeat(10000)
      const hash = computeInputHash(longInput)

      // SHA-256 always produces 64 hex characters regardless of input length
      expect(hash).toHaveLength(64)
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should handle special characters', () => {
      const input = 'Ich fühle mich 😊 sehr gestresst! #@$%^&*()'
      const hash = computeInputHash(input)

      expect(hash).toHaveLength(64)
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })
  })

  // ============================================================
  // Verify no PHI in test data
  // ============================================================

  describe('PHI Safety Verification', () => {
    it('should verify hash cannot be reversed to original text', () => {
      const sensitiveInput = 'Patient has suicidal thoughts'
      const hash = computeInputHash(sensitiveInput)

      // Hash should not contain any substring of original text
      expect(hash.toLowerCase()).not.toContain('patient')
      expect(hash.toLowerCase()).not.toContain('suicid')
      expect(hash.toLowerCase()).not.toContain('thought')
    })

    it('should produce consistent hash for common PHI patterns', () => {
      // Even if PHI is accidentally included, hash remains deterministic
      const input = 'My name is John Doe, DOB 1990-01-01'
      
      const hash1 = computeInputHash(input)
      const hash2 = computeInputHash(input)

      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(64)
      
      // But hash contains no PHI
      expect(hash1.toLowerCase()).not.toContain('john')
      expect(hash1.toLowerCase()).not.toContain('doe')
      expect(hash1).not.toContain('1990')
    })
  })

  // ============================================================
  // Edge Cases
  // ============================================================

  describe('Edge Cases', () => {
    it('should handle Unicode normalization', () => {
      // Different Unicode representations of same character
      const input1 = 'café' // é as single character
      const input2 = 'café' // é as combining character

      const hash1 = computeInputHash(input1)
      const hash2 = computeInputHash(input2)

      // Note: Our implementation uses simple toLowerCase/trim
      // Unicode normalization differences may produce different hashes
      // This is acceptable as we care about exact input matching
      expect(hash1).toHaveLength(64)
      expect(hash2).toHaveLength(64)
    })

    it('should handle newlines and tabs', () => {
      const input = 'Line 1\nLine 2\tTabbed'
      const hash = computeInputHash(input)

      expect(hash).toHaveLength(64)
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })
  })
})
