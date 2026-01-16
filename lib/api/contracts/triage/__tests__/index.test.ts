/**
 * Tests for Triage API Contracts (E6.6.2)
 *
 * Validates:
 * - AC1: Zod schema validation for request+result
 * - AC2: Invalid request returns 400; oversize returns 413 or 400
 * - AC3: rationale hard-bounded; redFlags from allowlist only
 */

import {
  TRIAGE_SCHEMA_VERSION,
  TRIAGE_TIER,
  TRIAGE_NEXT_ACTION,
  RED_FLAG_ALLOWLIST,
  AGE_RANGE_BUCKET,
  TRIAGE_INPUT_MIN_LENGTH,
  TRIAGE_INPUT_MAX_LENGTH,
  TRIAGE_RATIONALE_MAX_LENGTH,
  TRIAGE_RATIONALE_MAX_BULLETS,
  TriageRequestV1Schema,
  TriageResultV1Schema,
  PatientContextLiteSchema,
  validateTriageRequest,
  safeValidateTriageRequest,
  validateTriageResult,
  safeValidateTriageResult,
  sanitizeRedFlags,
  getOversizeErrorStatus,
  boundRationale,
} from '../index'

describe('Triage Contracts - E6.6.2', () => {
  // ============================================================
  // AC1: Schema Validation Tests
  // ============================================================

  describe('TriageRequestV1Schema', () => {
    it('should validate a minimal valid request', () => {
      const validRequest = {
        inputText: 'I am feeling stressed',
      }

      const result = TriageRequestV1Schema.safeParse(validRequest)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.inputText).toBe('I am feeling stressed')
      }
    })

    it('should validate request with all optional fields', () => {
      const validRequest = {
        inputText: 'I am feeling very stressed and anxious',
        locale: 'de-DE',
        patientContext: {
          ageRange: AGE_RANGE_BUCKET.AGE_31_50,
        },
      }

      const result = TriageRequestV1Schema.safeParse(validRequest)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.locale).toBe('de-DE')
        expect(result.data.patientContext?.ageRange).toBe(AGE_RANGE_BUCKET.AGE_31_50)
      }
    })

    it('should reject request with inputText below minimum length', () => {
      const invalidRequest = {
        inputText: 'short',
      }

      const result = TriageRequestV1Schema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('at least')
      }
    })

    it('should reject request with inputText exceeding maximum length', () => {
      const invalidRequest = {
        inputText: 'x'.repeat(TRIAGE_INPUT_MAX_LENGTH + 1),
      }

      const result = TriageRequestV1Schema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toContain('must not exceed')
      }
    })

    it('should reject request without inputText', () => {
      const invalidRequest = {}

      const result = TriageRequestV1Schema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should accept request at exactly minimum length', () => {
      const validRequest = {
        inputText: 'x'.repeat(TRIAGE_INPUT_MIN_LENGTH),
      }

      const result = TriageRequestV1Schema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })

    it('should accept request at exactly maximum length', () => {
      const validRequest = {
        inputText: 'x'.repeat(TRIAGE_INPUT_MAX_LENGTH),
      }

      const result = TriageRequestV1Schema.safeParse(validRequest)
      expect(result.success).toBe(true)
    })
  })

  describe('PatientContextLiteSchema', () => {
    it('should validate valid age range', () => {
      const validContext = {
        ageRange: AGE_RANGE_BUCKET.AGE_18_30,
      }

      const result = PatientContextLiteSchema.safeParse(validContext)
      expect(result.success).toBe(true)
    })

    it('should validate empty context', () => {
      const emptyContext = {}

      const result = PatientContextLiteSchema.safeParse(emptyContext)
      expect(result.success).toBe(true)
    })

    it('should validate undefined context', () => {
      const result = PatientContextLiteSchema.safeParse(undefined)
      expect(result.success).toBe(true)
    })
  })

  describe('TriageResultV1Schema', () => {
    it('should validate a valid result with all fields', () => {
      const validResult = {
        tier: TRIAGE_TIER.ASSESSMENT,
        nextAction: TRIAGE_NEXT_ACTION.START_FUNNEL_A,
        redFlags: ['report_risk_level'],
        rationale: 'Patient reports moderate stress levels. Assessment recommended.',
        confidenceBand: {
          value: 0.85,
          label: 'high',
        },
        version: TRIAGE_SCHEMA_VERSION,
        correlationId: 'corr-123',
      }

      const result = TriageResultV1Schema.safeParse(validResult)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.tier).toBe(TRIAGE_TIER.ASSESSMENT)
        expect(result.data.nextAction).toBe(TRIAGE_NEXT_ACTION.START_FUNNEL_A)
      }
    })

    it('should validate result with minimal required fields', () => {
      const validResult = {
        tier: TRIAGE_TIER.INFO,
        nextAction: TRIAGE_NEXT_ACTION.SHOW_CONTENT,
        redFlags: [],
        rationale: 'Informational content is sufficient.',
        version: TRIAGE_SCHEMA_VERSION,
      }

      const result = TriageResultV1Schema.safeParse(validResult)
      expect(result.success).toBe(true)
    })

    it('should validate result with empty redFlags', () => {
      const validResult = {
        tier: TRIAGE_TIER.INFO,
        nextAction: TRIAGE_NEXT_ACTION.SHOW_CONTENT,
        redFlags: [],
        rationale: 'No red flags detected.',
        version: TRIAGE_SCHEMA_VERSION,
      }

      const result = TriageResultV1Schema.safeParse(validResult)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.redFlags).toEqual([])
      }
    })

    it('should reject result with invalid tier', () => {
      const invalidResult = {
        tier: 'INVALID_TIER',
        nextAction: TRIAGE_NEXT_ACTION.SHOW_CONTENT,
        redFlags: [],
        rationale: 'Test',
        version: TRIAGE_SCHEMA_VERSION,
      }

      const result = TriageResultV1Schema.safeParse(invalidResult)
      expect(result.success).toBe(false)
    })

    it('should reject result with invalid nextAction', () => {
      const invalidResult = {
        tier: TRIAGE_TIER.INFO,
        nextAction: 'INVALID_ACTION',
        redFlags: [],
        rationale: 'Test',
        version: TRIAGE_SCHEMA_VERSION,
      }

      const result = TriageResultV1Schema.safeParse(invalidResult)
      expect(result.success).toBe(false)
    })

    it('should reject result with wrong version', () => {
      const invalidResult = {
        tier: TRIAGE_TIER.INFO,
        nextAction: TRIAGE_NEXT_ACTION.SHOW_CONTENT,
        redFlags: [],
        rationale: 'Test',
        version: 'v2',
      }

      const result = TriageResultV1Schema.safeParse(invalidResult)
      expect(result.success).toBe(false)
    })

    it('should accept result with redFlag from allowlist', () => {
      const validResult = {
        tier: TRIAGE_TIER.ESCALATE,
        nextAction: TRIAGE_NEXT_ACTION.SHOW_ESCALATION,
        redFlags: ['report_risk_level', 'workup_check'],
        rationale: 'High risk detected.',
        version: TRIAGE_SCHEMA_VERSION,
      }

      const result = TriageResultV1Schema.safeParse(validResult)
      expect(result.success).toBe(true)
    })

    it('should reject result with redFlag not in allowlist', () => {
      const invalidResult = {
        tier: TRIAGE_TIER.ESCALATE,
        nextAction: TRIAGE_NEXT_ACTION.SHOW_ESCALATION,
        redFlags: ['unknown_red_flag'],
        rationale: 'High risk detected.',
        version: TRIAGE_SCHEMA_VERSION,
      }

      const result = TriageResultV1Schema.safeParse(invalidResult)
      expect(result.success).toBe(false)
    })
  })

  // ============================================================
  // AC3: Rationale Validation Tests
  // ============================================================

  describe('Rationale Validation', () => {
    it('should accept rationale at exactly max length', () => {
      const validResult = {
        tier: TRIAGE_TIER.INFO,
        nextAction: TRIAGE_NEXT_ACTION.SHOW_CONTENT,
        redFlags: [],
        rationale: 'x'.repeat(TRIAGE_RATIONALE_MAX_LENGTH),
        version: TRIAGE_SCHEMA_VERSION,
      }

      const result = TriageResultV1Schema.safeParse(validResult)
      expect(result.success).toBe(true)
    })

    it('should accept rationale below max length', () => {
      const validResult = {
        tier: TRIAGE_TIER.INFO,
        nextAction: TRIAGE_NEXT_ACTION.SHOW_CONTENT,
        redFlags: [],
        rationale: 'Short rationale',
        version: TRIAGE_SCHEMA_VERSION,
      }

      const result = TriageResultV1Schema.safeParse(validResult)
      expect(result.success).toBe(true)
    })

    it('should accept valid bullet list with max bullets', () => {
      const validResult = {
        tier: TRIAGE_TIER.ASSESSMENT,
        nextAction: TRIAGE_NEXT_ACTION.START_FUNNEL_A,
        redFlags: [],
        rationale: `- Bullet point one with some detail
- Bullet point two with some detail
- Bullet point three with some detail`,
        version: TRIAGE_SCHEMA_VERSION,
      }

      const result = TriageResultV1Schema.safeParse(validResult)
      expect(result.success).toBe(true)
    })

    it('should accept valid bullet list with fewer than max bullets', () => {
      const validResult = {
        tier: TRIAGE_TIER.ASSESSMENT,
        nextAction: TRIAGE_NEXT_ACTION.START_FUNNEL_A,
        redFlags: [],
        rationale: `- Bullet point one
- Bullet point two`,
        version: TRIAGE_SCHEMA_VERSION,
      }

      const result = TriageResultV1Schema.safeParse(validResult)
      expect(result.success).toBe(true)
    })

    it('should reject bullet list with more than max bullets', () => {
      const invalidResult = {
        tier: TRIAGE_TIER.ASSESSMENT,
        nextAction: TRIAGE_NEXT_ACTION.START_FUNNEL_A,
        redFlags: [],
        rationale: `- Bullet one
- Bullet two
- Bullet three
- Bullet four`,
        version: TRIAGE_SCHEMA_VERSION,
      }

      const result = TriageResultV1Schema.safeParse(invalidResult)
      expect(result.success).toBe(false)
    })

    it('should reject rationale exceeding max length (not bullet list)', () => {
      const invalidResult = {
        tier: TRIAGE_TIER.INFO,
        nextAction: TRIAGE_NEXT_ACTION.SHOW_CONTENT,
        redFlags: [],
        rationale: 'x'.repeat(TRIAGE_RATIONALE_MAX_LENGTH + 1),
        version: TRIAGE_SCHEMA_VERSION,
      }

      const result = TriageResultV1Schema.safeParse(invalidResult)
      expect(result.success).toBe(false)
    })

    it('should accept bullet list with asterisk bullets', () => {
      const validResult = {
        tier: TRIAGE_TIER.ASSESSMENT,
        nextAction: TRIAGE_NEXT_ACTION.START_FUNNEL_A,
        redFlags: [],
        rationale: `* First point
* Second point
* Third point`,
        version: TRIAGE_SCHEMA_VERSION,
      }

      const result = TriageResultV1Schema.safeParse(validResult)
      expect(result.success).toBe(true)
    })
  })

  // ============================================================
  // AC2: Oversize Error Status Tests
  // ============================================================

  describe('getOversizeErrorStatus', () => {
    it('should return null for valid length', () => {
      const input = 'x'.repeat(TRIAGE_INPUT_MAX_LENGTH)
      const status = getOversizeErrorStatus(input)
      expect(status).toBeNull()
    })

    it('should return 400 for moderately oversized input', () => {
      const input = 'x'.repeat(TRIAGE_INPUT_MAX_LENGTH + 100)
      const status = getOversizeErrorStatus(input)
      expect(status).toBe(400)
    })

    it('should return 413 for very large input', () => {
      const input = 'x'.repeat(TRIAGE_INPUT_MAX_LENGTH * 2 + 1)
      const status = getOversizeErrorStatus(input)
      expect(status).toBe(413)
    })

    it('should return null for input below max', () => {
      const input = 'x'.repeat(100)
      const status = getOversizeErrorStatus(input)
      expect(status).toBeNull()
    })
  })

  // ============================================================
  // AC3: RedFlags Sanitization Tests
  // ============================================================

  describe('sanitizeRedFlags', () => {
    it('should keep valid red flags from allowlist', () => {
      const flags = ['report_risk_level', 'workup_check']
      const sanitized = sanitizeRedFlags(flags)
      expect(sanitized).toEqual(['report_risk_level', 'workup_check'])
    })

    it('should filter out unknown red flags', () => {
      const flags = ['report_risk_level', 'unknown_flag', 'workup_check', 'another_unknown']
      const sanitized = sanitizeRedFlags(flags)
      expect(sanitized).toEqual(['report_risk_level', 'workup_check'])
    })

    it('should return empty array when all flags are unknown', () => {
      const flags = ['unknown_flag_1', 'unknown_flag_2']
      const sanitized = sanitizeRedFlags(flags)
      expect(sanitized).toEqual([])
    })

    it('should return empty array for empty input', () => {
      const flags: string[] = []
      const sanitized = sanitizeRedFlags(flags)
      expect(sanitized).toEqual([])
    })

    it('should keep all flags if all are in allowlist', () => {
      const flags = ['report_risk_level', 'workup_check', 'answer_pattern']
      const sanitized = sanitizeRedFlags(flags)
      expect(sanitized).toEqual(['report_risk_level', 'workup_check', 'answer_pattern'])
    })
  })

  // ============================================================
  // Helper Functions Tests
  // ============================================================

  describe('validateTriageRequest', () => {
    it('should validate and return typed data', () => {
      const validRequest = {
        inputText: 'I am feeling stressed',
      }

      const result = validateTriageRequest(validRequest)
      expect(result.inputText).toBe('I am feeling stressed')
    })

    it('should throw on invalid data', () => {
      expect(() => validateTriageRequest({})).toThrow()
    })
  })

  describe('safeValidateTriageRequest', () => {
    it('should return null on invalid data', () => {
      const result = safeValidateTriageRequest({})
      expect(result).toBeNull()
    })

    it('should return data on valid input', () => {
      const validRequest = {
        inputText: 'I am feeling stressed',
      }

      const result = safeValidateTriageRequest(validRequest)
      expect(result).not.toBeNull()
      expect(result?.inputText).toBe('I am feeling stressed')
    })
  })

  describe('validateTriageResult', () => {
    it('should validate and return typed data', () => {
      const validResult = {
        tier: TRIAGE_TIER.INFO,
        nextAction: TRIAGE_NEXT_ACTION.SHOW_CONTENT,
        redFlags: [],
        rationale: 'Test rationale',
        version: TRIAGE_SCHEMA_VERSION,
      }

      const result = validateTriageResult(validResult)
      expect(result.tier).toBe(TRIAGE_TIER.INFO)
    })

    it('should throw on invalid data', () => {
      expect(() => validateTriageResult({})).toThrow()
    })
  })

  describe('safeValidateTriageResult', () => {
    it('should return null on invalid data', () => {
      const result = safeValidateTriageResult({})
      expect(result).toBeNull()
    })

    it('should return data on valid input', () => {
      const validResult = {
        tier: TRIAGE_TIER.INFO,
        nextAction: TRIAGE_NEXT_ACTION.SHOW_CONTENT,
        redFlags: [],
        rationale: 'Test rationale',
        version: TRIAGE_SCHEMA_VERSION,
      }

      const result = safeValidateTriageResult(validResult)
      expect(result).not.toBeNull()
      expect(result?.tier).toBe(TRIAGE_TIER.INFO)
    })
  })

  describe('boundRationale', () => {
    it('should return rationale unchanged if already valid', () => {
      const rationale = 'This is a valid short rationale'
      const bounded = boundRationale(rationale)
      expect(bounded).toBe(rationale)
    })

    it('should truncate rationale exceeding max length', () => {
      const rationale = 'x'.repeat(TRIAGE_RATIONALE_MAX_LENGTH + 100)
      const bounded = boundRationale(rationale)
      expect(bounded.length).toBeLessThanOrEqual(TRIAGE_RATIONALE_MAX_LENGTH)
      expect(bounded).toContain('...')
    })

    it('should limit bullet list to max bullets', () => {
      const rationale = `- Bullet one
- Bullet two
- Bullet three
- Bullet four
- Bullet five`
      const bounded = boundRationale(rationale)
      const bulletCount = bounded.split('\n').filter(line => line.trim().startsWith('-')).length
      expect(bulletCount).toBeLessThanOrEqual(TRIAGE_RATIONALE_MAX_BULLETS)
    })

    it('should handle valid bullet list with max bullets', () => {
      const rationale = `- Bullet one
- Bullet two
- Bullet three`
      const bounded = boundRationale(rationale)
      expect(bounded).toBe(rationale)
    })
  })

  // ============================================================
  // Integration Tests
  // ============================================================

  describe('Integration: Request to Result Flow', () => {
    it('should validate complete triage flow', () => {
      // Valid request
      const request = {
        inputText: 'I have been experiencing sleep problems and stress',
        locale: 'de-DE',
        patientContext: {
          ageRange: AGE_RANGE_BUCKET.AGE_31_50,
        },
      }

      const requestResult = TriageRequestV1Schema.safeParse(request)
      expect(requestResult.success).toBe(true)

      // Valid result
      const result = {
        tier: TRIAGE_TIER.ASSESSMENT,
        nextAction: TRIAGE_NEXT_ACTION.START_FUNNEL_A,
        redFlags: [],
        rationale: 'Patient reports sleep problems and stress. Stress assessment recommended.',
        version: TRIAGE_SCHEMA_VERSION,
        correlationId: 'corr-test-123',
      }

      const resultValidation = TriageResultV1Schema.safeParse(result)
      expect(resultValidation.success).toBe(true)
    })
  })

  // ============================================================
  // Edge Cases
  // ============================================================

  describe('Edge Cases', () => {
    it('should handle Unicode characters in inputText', () => {
      const request = {
        inputText: 'Ich fühle mich gestresst und ängstlich 😰',
      }

      const result = TriageRequestV1Schema.safeParse(request)
      expect(result.success).toBe(true)
    })

    it('should handle special characters in rationale', () => {
      const triageResult = {
        tier: TRIAGE_TIER.INFO,
        nextAction: TRIAGE_NEXT_ACTION.SHOW_CONTENT,
        redFlags: [],
        rationale: 'Patient shows signs of stress (elevated cortisol) & anxiety.',
        version: TRIAGE_SCHEMA_VERSION,
      }

      const result = TriageResultV1Schema.safeParse(triageResult)
      expect(result.success).toBe(true)
    })

    it('should handle empty string locale', () => {
      const request = {
        inputText: 'I am feeling stressed',
        locale: '',
      }

      const result = TriageRequestV1Schema.safeParse(request)
      expect(result.success).toBe(true)
    })
  })
})
