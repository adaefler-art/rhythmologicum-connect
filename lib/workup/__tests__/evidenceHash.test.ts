/**
 * Tests for Evidence Pack Hash Generation (E6.4.5 - AC4)
 *
 * Verifies that hash generation is stable and deterministic.
 */

import { generateEvidencePackHash, verifyEvidencePackHash } from '../evidenceHash'
import type { EvidencePack } from '@/lib/types/workup'

describe('Evidence Pack Hash', () => {
  describe('generateEvidencePackHash', () => {
    it('should generate a stable hash for the same evidence pack', () => {
      const evidencePack: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {
          stress_q1: 3,
          stress_q2: 2,
          sleep_q1: 4,
        },
      }

      const hash1 = generateEvidencePackHash(evidencePack)
      const hash2 = generateEvidencePackHash(evidencePack)

      expect(hash1).toBe(hash2)
      expect(hash1).toHaveLength(64) // SHA256 produces 64 hex characters
    })

    it('should generate the same hash regardless of answer key order', () => {
      const evidencePack1: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {
          stress_q1: 3,
          sleep_q1: 4,
          stress_q2: 2,
        },
      }

      const evidencePack2: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {
          sleep_q1: 4,
          stress_q2: 2,
          stress_q1: 3,
        },
      }

      const hash1 = generateEvidencePackHash(evidencePack1)
      const hash2 = generateEvidencePackHash(evidencePack2)

      expect(hash1).toBe(hash2)
    })

    it('should generate different hashes for different answers', () => {
      const evidencePack1: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {
          stress_q1: 3,
        },
      }

      const evidencePack2: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {
          stress_q1: 4, // Different answer
        },
      }

      const hash1 = generateEvidencePackHash(evidencePack1)
      const hash2 = generateEvidencePackHash(evidencePack2)

      expect(hash1).not.toBe(hash2)
    })

    it('should generate different hashes for different assessment IDs', () => {
      const evidencePack1: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {
          stress_q1: 3,
        },
      }

      const evidencePack2: EvidencePack = {
        assessmentId: '223e4567-e89b-12d3-a456-426614174001',
        funnelSlug: 'stress-assessment',
        answers: {
          stress_q1: 3,
        },
      }

      const hash1 = generateEvidencePackHash(evidencePack1)
      const hash2 = generateEvidencePackHash(evidencePack2)

      expect(hash1).not.toBe(hash2)
    })

    it('should include optional flags in hash', () => {
      const evidencePack1: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {},
        hasUploadedDocuments: false,
      }

      const evidencePack2: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {},
        hasUploadedDocuments: true,
      }

      const hash1 = generateEvidencePackHash(evidencePack1)
      const hash2 = generateEvidencePackHash(evidencePack2)

      expect(hash1).not.toBe(hash2)
    })

    it('should treat undefined optional flags as false', () => {
      const evidencePack1: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {},
      }

      const evidencePack2: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {},
        hasUploadedDocuments: false,
        hasWearableData: false,
      }

      const hash1 = generateEvidencePackHash(evidencePack1)
      const hash2 = generateEvidencePackHash(evidencePack2)

      expect(hash1).toBe(hash2)
    })
  })

  describe('verifyEvidencePackHash', () => {
    it('should verify matching hash', () => {
      const evidencePack: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {
          stress_q1: 3,
        },
      }

      const hash = generateEvidencePackHash(evidencePack)
      const isValid = verifyEvidencePackHash(evidencePack, hash)

      expect(isValid).toBe(true)
    })

    it('should reject non-matching hash', () => {
      const evidencePack: EvidencePack = {
        assessmentId: '123e4567-e89b-12d3-a456-426614174000',
        funnelSlug: 'stress-assessment',
        answers: {
          stress_q1: 3,
        },
      }

      const wrongHash = 'abc123'
      const isValid = verifyEvidencePackHash(evidencePack, wrongHash)

      expect(isValid).toBe(false)
    })
  })
})
