/**
 * PDF Storage Tests - V05-I05.8
 * 
 * Tests for PDF storage helpers, focusing on:
 * - PHI-free storage path generation
 * - Deterministic path generation
 * - Hash computation
 */

import { generatePdfStoragePath, computePdfHash } from '../storage'

describe('PDF Storage Helpers', () => {
  describe('generatePdfStoragePath', () => {
    it('should generate PHI-free storage path', () => {
      const jobId = '550e8400-e29b-41d4-a716-446655440000'
      const timestamp = 1704369600000 // Fixed timestamp

      const path = generatePdfStoragePath(jobId, timestamp)

      // Path should not contain raw job ID
      expect(path).not.toContain(jobId)

      // Path should follow format: {hash}/{timestamp}_{hash}.pdf
      expect(path).toMatch(/^[0-9a-f]{16}\/\d+_[0-9a-f]{8}\.pdf$/)

      // Path should contain timestamp
      expect(path).toContain(timestamp.toString())
    })

    it('should generate deterministic path for same inputs', () => {
      const jobId = '550e8400-e29b-41d4-a716-446655440000'
      const timestamp = 1704369600000

      const path1 = generatePdfStoragePath(jobId, timestamp)
      const path2 = generatePdfStoragePath(jobId, timestamp)

      expect(path1).toBe(path2)
    })

    it('should generate different paths for different job IDs', () => {
      const jobId1 = '550e8400-e29b-41d4-a716-446655440000'
      const jobId2 = '660e8400-e29b-41d4-a716-446655440000'
      const timestamp = 1704369600000

      const path1 = generatePdfStoragePath(jobId1, timestamp)
      const path2 = generatePdfStoragePath(jobId2, timestamp)

      expect(path1).not.toBe(path2)
    })

    it('should generate different paths for different timestamps', () => {
      const jobId = '550e8400-e29b-41d4-a716-446655440000'
      const timestamp1 = 1704369600000
      const timestamp2 = 1704369700000

      const path1 = generatePdfStoragePath(jobId, timestamp1)
      const path2 = generatePdfStoragePath(jobId, timestamp2)

      expect(path1).not.toBe(path2)
    })

    it('should not contain any obvious PHI indicators', () => {
      const jobId = '550e8400-e29b-41d4-a716-446655440000'
      const timestamp = Date.now()

      const path = generatePdfStoragePath(jobId, timestamp)

      // Should not contain common PHI patterns
      expect(path).not.toMatch(/patient/i)
      expect(path).not.toMatch(/name/i)
      expect(path).not.toMatch(/email/i)
      expect(path).not.toMatch(/phone/i)
      expect(path).not.toMatch(/address/i)

      // Should not contain raw UUID
      expect(path).not.toContain(jobId)
    })

    it('should use current timestamp when not provided', () => {
      const jobId = '550e8400-e29b-41d4-a716-446655440000'
      const beforeTimestamp = Date.now()

      const path = generatePdfStoragePath(jobId)

      const afterTimestamp = Date.now()

      // Extract timestamp from path (format: hash/TIMESTAMP_hash.pdf)
      const match = path.match(/\/(\d+)_/)
      expect(match).not.toBeNull()

      const extractedTimestamp = parseInt(match![1], 10)
      expect(extractedTimestamp).toBeGreaterThanOrEqual(beforeTimestamp)
      expect(extractedTimestamp).toBeLessThanOrEqual(afterTimestamp)
    })
  })

  describe('computePdfHash', () => {
    it('should compute SHA-256 hash of buffer', () => {
      const buffer = Buffer.from('test pdf content')
      const hash = computePdfHash(buffer)

      // SHA-256 produces 64 hex characters
      expect(hash).toHaveLength(64)
      expect(hash).toMatch(/^[0-9a-f]{64}$/)
    })

    it('should compute deterministic hash', () => {
      const buffer = Buffer.from('test pdf content')
      const hash1 = computePdfHash(buffer)
      const hash2 = computePdfHash(buffer)

      expect(hash1).toBe(hash2)
    })

    it('should compute different hashes for different content', () => {
      const buffer1 = Buffer.from('test pdf content 1')
      const buffer2 = Buffer.from('test pdf content 2')

      const hash1 = computePdfHash(buffer1)
      const hash2 = computePdfHash(buffer2)

      expect(hash1).not.toBe(hash2)
    })

    it('should handle empty buffer', () => {
      const buffer = Buffer.from('')
      const hash = computePdfHash(buffer)

      expect(hash).toHaveLength(64)
      expect(hash).toMatch(/^[0-9a-f]{64}$/)
    })

    it('should handle large buffer', () => {
      const buffer = Buffer.alloc(1024 * 1024, 'a') // 1MB of 'a'
      const hash = computePdfHash(buffer)

      expect(hash).toHaveLength(64)
      expect(hash).toMatch(/^[0-9a-f]{64}$/)
    })
  })

  describe('PHI-Free Path Policy', () => {
    it('should never expose patient identifiable information in paths', () => {
      const testCases = [
        {
          jobId: '550e8400-e29b-41d4-a716-446655440000',
          description: 'Standard UUID',
        },
        {
          jobId: 'aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee',
          description: 'Pattern UUID',
        },
        {
          jobId: '00000000-0000-0000-0000-000000000000',
          description: 'Zero UUID',
        },
      ]

      testCases.forEach(({ jobId, description }) => {
        const path = generatePdfStoragePath(jobId)

        // Should not contain raw job ID
        expect(path).not.toContain(jobId)

        // Should only contain hash, timestamp, and file extension
        const parts = path.split('/')
        expect(parts).toHaveLength(2)

        const [dirHash, filename] = parts
        expect(dirHash).toMatch(/^[0-9a-f]{16}$/)
        expect(filename).toMatch(/^\d+_[0-9a-f]{8}\.pdf$/)
      })
    })

    it('should be opaque to prevent enumeration attacks', () => {
      // Generate paths for sequential job IDs
      const paths = []
      for (let i = 0; i < 10; i++) {
        const jobId = `550e8400-e29b-41d4-a716-44665544000${i}`
        paths.push(generatePdfStoragePath(jobId, 1704369600000))
      }

      // Paths should not be sequential or predictable
      // Extract directory hashes
      const dirHashes = paths.map((p) => p.split('/')[0])

      // Hashes should not be sequential
      for (let i = 1; i < dirHashes.length; i++) {
        // Convert to numbers and check they're not sequential
        const num1 = parseInt(dirHashes[i - 1].substring(0, 8), 16)
        const num2 = parseInt(dirHashes[i].substring(0, 8), 16)
        const diff = Math.abs(num2 - num1)

        // Difference should be large (not sequential)
        expect(diff).toBeGreaterThan(1000000)
      }
    })
  })
})
