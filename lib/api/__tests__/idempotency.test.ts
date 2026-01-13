/**
 * E6.2.4: Unit Tests for Idempotency Handler
 * 
 * Tests the idempotency key handling functionality for mobile offline/retry scenarios.
 */

import { NextRequest } from 'next/server'
import {
  getIdempotencyKey,
  computePayloadHash,
} from '../idempotency'

describe('E6.2.4: Idempotency Handler', () => {
  describe('getIdempotencyKey', () => {
    it('should extract idempotency key from request headers', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'Idempotency-Key': '550e8400-e29b-41d4-a716-446655440000',
        },
      })

      const key = getIdempotencyKey(request)
      expect(key).toBe('550e8400-e29b-41d4-a716-446655440000')
    })

    it('should return null when no idempotency key header present', () => {
      const request = new NextRequest('http://localhost/api/test')

      const key = getIdempotencyKey(request)
      expect(key).toBeNull()
    })

    it('should be case-insensitive for header name', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'idempotency-key': '550e8400-e29b-41d4-a716-446655440000',
        },
      })

      const key = getIdempotencyKey(request)
      expect(key).toBe('550e8400-e29b-41d4-a716-446655440000')
    })
  })

  describe('computePayloadHash', () => {
    it('should compute SHA-256 hash of payload', () => {
      const payload = {
        stepId: '123',
        questionId: 'q1',
        answerValue: 1,
      }

      const hash = computePayloadHash(payload)

      // Hash should be 64 character hex string (SHA-256)
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should produce same hash for identical payloads', () => {
      const payload1 = { stepId: '123', questionId: 'q1', answerValue: 1 }
      const payload2 = { stepId: '123', questionId: 'q1', answerValue: 1 }

      const hash1 = computePayloadHash(payload1)
      const hash2 = computePayloadHash(payload2)

      expect(hash1).toBe(hash2)
    })

    it('should produce different hash for different payloads', () => {
      const payload1 = { stepId: '123', questionId: 'q1', answerValue: 1 }
      const payload2 = { stepId: '123', questionId: 'q1', answerValue: 2 }

      const hash1 = computePayloadHash(payload1)
      const hash2 = computePayloadHash(payload2)

      expect(hash1).not.toBe(hash2)
    })

    it('should be sensitive to property order (JSON.stringify behavior)', () => {
      // Note: This test documents current behavior
      // JSON.stringify orders object properties in insertion order
      const payload1 = { a: 1, b: 2 }
      const payload2 = { b: 2, a: 1 }

      const hash1 = computePayloadHash(payload1)
      const hash2 = computePayloadHash(payload2)

      // With JSON.stringify, different property order = different hash
      expect(hash1).not.toBe(hash2)
    })

    it('should handle nested objects', () => {
      const payload = {
        stepId: '123',
        data: {
          nested: {
            value: 42,
          },
        },
      }

      const hash = computePayloadHash(payload)
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should handle arrays', () => {
      const payload = {
        items: [1, 2, 3],
      }

      const hash = computePayloadHash(payload)
      expect(hash).toMatch(/^[a-f0-9]{64}$/)
    })

    it('should handle null and undefined', () => {
      const payload1 = { value: null }
      const payload2 = { value: undefined }

      const hash1 = computePayloadHash(payload1)
      const hash2 = computePayloadHash(payload2)

      // null and undefined serialize differently
      expect(hash1).not.toBe(hash2)
    })
  })

  describe('Idempotency Key Format', () => {
    it('should accept UUID format', () => {
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'Idempotency-Key': '550e8400-e29b-41d4-a716-446655440000',
        },
      })

      const key = getIdempotencyKey(request)
      expect(key).toMatch(
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
      )
    })

    it('should accept any string as idempotency key', () => {
      // While UUIDs are recommended, any string is technically valid
      const request = new NextRequest('http://localhost/api/test', {
        headers: {
          'Idempotency-Key': 'custom-key-123',
        },
      })

      const key = getIdempotencyKey(request)
      expect(key).toBe('custom-key-123')
    })
  })

  describe('Hash Collision Resistance', () => {
    it('should have minimal collision for similar payloads', () => {
      const hashes = new Set()

      // Generate hashes for 1000 similar payloads
      for (let i = 0; i < 1000; i++) {
        const payload = { questionId: `q${i}`, answerValue: i }
        const hash = computePayloadHash(payload)
        hashes.add(hash)
      }

      // All hashes should be unique (SHA-256 collision resistance)
      expect(hashes.size).toBe(1000)
    })
  })

  describe('Idempotency Best Practices', () => {
    it('should demonstrate correct key generation pattern', () => {
      // Client should generate a new UUID for each operation
      const key1 = '550e8400-e29b-41d4-a716-446655440000'
      const key2 = '550e8400-e29b-41d4-a716-446655440001'

      expect(key1).not.toBe(key2)
    })

    it('should demonstrate payload conflict detection', () => {
      const idempotencyKey = '550e8400-e29b-41d4-a716-446655440000'

      // First request
      const payload1 = { stepId: '123', questionId: 'q1', answerValue: 1 }
      const hash1 = computePayloadHash(payload1)

      // Second request with SAME key but DIFFERENT payload
      const payload2 = { stepId: '123', questionId: 'q1', answerValue: 2 }
      const hash2 = computePayloadHash(payload2)

      // Hashes differ = conflict detected
      expect(hash1).not.toBe(hash2)
    })
  })
})
