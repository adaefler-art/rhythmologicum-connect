/**
 * E6.4.6: Red Flag Detection Tests
 */

import { detectRedFlags, getHighestSeverity, formatRedFlagReasons } from '../detectRedFlags'
import type { RedFlagCheckInput } from '../detectRedFlags'

describe('detectRedFlags', () => {
  describe('High risk level detection', () => {
    it('should detect red flag for high risk level', () => {
      const input: RedFlagCheckInput = {
        assessmentId: 'test-assessment-1',
        reportId: 'test-report-1',
        riskLevel: 'high',
      }

      const result = detectRedFlags(input)

      expect(result.shouldEscalate).toBe(true)
      expect(result.redFlags).toHaveLength(1)
      expect(result.redFlags[0].severity).toBe('critical')
      expect(result.redFlags[0].source).toBe('report_risk_level')
      expect(result.redFlags[0].reason).toContain('Hohes Stressniveau')
      expect(result.correlationId).toMatch(/^esc-/)
    })

    it('should not detect red flag for moderate risk level', () => {
      const input: RedFlagCheckInput = {
        assessmentId: 'test-assessment-1',
        riskLevel: 'moderate',
      }

      const result = detectRedFlags(input)

      expect(result.shouldEscalate).toBe(false)
      expect(result.redFlags).toHaveLength(0)
    })

    it('should not detect red flag for low risk level', () => {
      const input: RedFlagCheckInput = {
        assessmentId: 'test-assessment-1',
        riskLevel: 'low',
      }

      const result = detectRedFlags(input)

      expect(result.shouldEscalate).toBe(false)
      expect(result.redFlags).toHaveLength(0)
    })

    it('should not detect red flag for null risk level', () => {
      const input: RedFlagCheckInput = {
        assessmentId: 'test-assessment-1',
        riskLevel: null,
      }

      const result = detectRedFlags(input)

      expect(result.shouldEscalate).toBe(false)
      expect(result.redFlags).toHaveLength(0)
    })
  })

  describe('Correlation ID generation', () => {
    it('should generate unique correlation IDs', () => {
      const input: RedFlagCheckInput = {
        assessmentId: 'test-assessment-1',
        riskLevel: 'high',
      }

      const result1 = detectRedFlags(input)
      const result2 = detectRedFlags(input)

      expect(result1.correlationId).not.toBe(result2.correlationId)
      expect(result1.correlationId).toMatch(/^esc-[a-f0-9-]{36}$/)
      expect(result2.correlationId).toMatch(/^esc-[a-f0-9-]{36}$/)
    })
  })

  describe('Deterministic behavior', () => {
    it('should always return same result for same input (except correlation ID)', () => {
      const input: RedFlagCheckInput = {
        assessmentId: 'test-assessment-1',
        reportId: 'test-report-1',
        riskLevel: 'high',
      }

      const result1 = detectRedFlags(input)
      const result2 = detectRedFlags(input)

      expect(result1.shouldEscalate).toBe(result2.shouldEscalate)
      expect(result1.redFlags.length).toBe(result2.redFlags.length)
      expect(result1.redFlags[0].severity).toBe(result2.redFlags[0].severity)
      expect(result1.redFlags[0].source).toBe(result2.redFlags[0].source)
      expect(result1.redFlags[0].reason).toBe(result2.redFlags[0].reason)
    })
  })
})

describe('getHighestSeverity', () => {
  it('should return null for empty array', () => {
    expect(getHighestSeverity([])).toBeNull()
  })

  it('should return critical when critical flag present', () => {
    const flags = [
      {
        severity: 'critical' as const,
        source: 'report_risk_level' as const,
        reason: 'Test',
      },
      {
        severity: 'high' as const,
        source: 'workup_check' as const,
        reason: 'Test',
      },
    ]

    expect(getHighestSeverity(flags)).toBe('critical')
  })

  it('should return high when only high flags present', () => {
    const flags = [
      {
        severity: 'high' as const,
        source: 'answer_pattern' as const,
        reason: 'Test',
      },
    ]

    expect(getHighestSeverity(flags)).toBe('high')
  })
})

describe('formatRedFlagReasons', () => {
  it('should extract all reasons from red flags', () => {
    const flags = [
      {
        severity: 'critical' as const,
        source: 'report_risk_level' as const,
        reason: 'Reason 1',
      },
      {
        severity: 'high' as const,
        source: 'workup_check' as const,
        reason: 'Reason 2',
      },
    ]

    const reasons = formatRedFlagReasons(flags)

    expect(reasons).toEqual(['Reason 1', 'Reason 2'])
  })

  it('should return empty array for no flags', () => {
    expect(formatRedFlagReasons([])).toEqual([])
  })
})
