// lib/versioning/__tests__/constants.test.ts
import {
  CURRENT_ALGORITHM_VERSION,
  CURRENT_PROMPT_VERSION,
  DEFAULT_FUNNEL_VERSION,
  generateReportVersion,
  computeInputsHash,
  getHashPrefix,
} from '../constants'

describe('Versioning Constants', () => {
  describe('version constants', () => {
    it('should have defined algorithm version', () => {
      expect(CURRENT_ALGORITHM_VERSION).toBeDefined()
      expect(CURRENT_ALGORITHM_VERSION).toMatch(/^v\d+\.\d+\.\d+$/)
    })

    it('should have defined prompt version', () => {
      expect(CURRENT_PROMPT_VERSION).toBeDefined()
      expect(CURRENT_PROMPT_VERSION).toMatch(/^\d+\.\d+$/)
    })

    it('should have defined default funnel version', () => {
      expect(DEFAULT_FUNNEL_VERSION).toBeDefined()
      expect(DEFAULT_FUNNEL_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
    })
  })

  describe('generateReportVersion', () => {
    it('should generate version with all components and hash prefix', () => {
      const version = generateReportVersion({
        funnelVersion: '1.0.0',
        algorithmVersion: 'v1.0.0',
        promptVersion: '1.0',
        inputsHashPrefix: 'abc12345',
      })

      expect(version).toBe('1.0.0-v1.0.0-1.0-abc12345')
    })

    it('should use defaults when components not provided', () => {
      const version = generateReportVersion({
        inputsHashPrefix: 'def67890',
      })

      expect(version).toContain(DEFAULT_FUNNEL_VERSION)
      expect(version).toContain(CURRENT_ALGORITHM_VERSION)
      expect(version).toContain(CURRENT_PROMPT_VERSION)
      expect(version).toContain('def67890')
    })

    it('should include hash prefix for deterministic uniqueness', () => {
      const version = generateReportVersion({
        inputsHashPrefix: 'test1234',
      })
      
      expect(version).toMatch(/-test1234$/)
    })

    it('should generate same version with same inputs including hash', () => {
      const version1 = generateReportVersion({
        funnelVersion: '2.0.0',
        algorithmVersion: 'v2.1.0',
        promptVersion: '2.5',
        inputsHashPrefix: 'xyz98765',
      })
      const version2 = generateReportVersion({
        funnelVersion: '2.0.0',
        algorithmVersion: 'v2.1.0',
        promptVersion: '2.5',
        inputsHashPrefix: 'xyz98765',
      })

      expect(version1).toBe(version2)
    })

    it('should generate different versions with different hash prefixes', () => {
      const version1 = generateReportVersion({
        funnelVersion: '2.0.0',
        algorithmVersion: 'v2.1.0',
        promptVersion: '2.5',
        inputsHashPrefix: 'aaa11111',
      })
      const version2 = generateReportVersion({
        funnelVersion: '2.0.0',
        algorithmVersion: 'v2.1.0',
        promptVersion: '2.5',
        inputsHashPrefix: 'bbb22222',
      })

      expect(version1).not.toBe(version2)
    })
  })

  describe('computeInputsHash', () => {
    it('should compute hash for object inputs', async () => {
      const inputs = { a: 1, b: 2, c: 3 }
      const hash = await computeInputsHash(inputs)

      expect(hash).toBeDefined()
      expect(hash).toHaveLength(64) // SHA256 hex = 64 chars
      expect(hash).toMatch(/^[0-9a-f]{64}$/)
    })

    it('should compute same hash for same inputs', async () => {
      const inputs = { stress_q1: 3, stress_q2: 4 }
      const hash1 = await computeInputsHash(inputs)
      const hash2 = await computeInputsHash(inputs)

      expect(hash1).toBe(hash2)
    })

    it('should compute different hash for different inputs', async () => {
      const inputs1 = { stress_q1: 3, stress_q2: 4 }
      const inputs2 = { stress_q1: 3, stress_q2: 5 }
      const hash1 = await computeInputsHash(inputs1)
      const hash2 = await computeInputsHash(inputs2)

      expect(hash1).not.toBe(hash2)
    })

    it('should compute same hash regardless of key order', async () => {
      const inputs1 = { a: 1, b: 2, c: 3 }
      const inputs2 = { c: 3, a: 1, b: 2 }
      const hash1 = await computeInputsHash(inputs1)
      const hash2 = await computeInputsHash(inputs2)

      expect(hash1).toBe(hash2)
    })

    it('should handle array inputs', async () => {
      const inputs = [1, 2, 3, 4, 5]
      const hash = await computeInputsHash(inputs)

      expect(hash).toBeDefined()
      expect(hash).toHaveLength(64)
    })
  })

  describe('getHashPrefix', () => {
    it('should return first 8 characters by default', () => {
      const hash = 'abcdef1234567890abcdef1234567890'
      const prefix = getHashPrefix(hash)

      expect(prefix).toBe('abcdef12')
      expect(prefix).toHaveLength(8)
    })

    it('should return custom length when specified', () => {
      const hash = 'abcdef1234567890abcdef1234567890'
      const prefix = getHashPrefix(hash, 12)

      expect(prefix).toBe('abcdef123456')
      expect(prefix).toHaveLength(12)
    })

    it('should handle short hashes gracefully', () => {
      const hash = 'abc'
      const prefix = getHashPrefix(hash, 8)

      expect(prefix).toBe('abc')
    })
  })
})
