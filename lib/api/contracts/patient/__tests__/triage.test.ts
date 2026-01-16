/**
 * Tests for Patient Triage Contracts (E6.6.10)
 * 
 * E6.6.10 AC1: Contract tests ensure /api/patient/triage follows patient API envelope
 * E6.6.10 AC2: Jest contract tests pass
 * E6.6.10 AC3: No unhandled errors / consistent envelope
 */

import {
  TRIAGE_SCHEMA_VERSION,
  TRIAGE_TIER,
  TRIAGE_NEXT_ACTION,
  TRIAGE_INPUT_MIN_LENGTH,
  TRIAGE_INPUT_MAX_LENGTH,
  TRIAGE_RATIONALE_MAX_LENGTH,
  RED_FLAG_ALLOWLIST,
  TriageRequestV1Schema,
  TriageResultV1Schema,
  validateTriageRequest,
  safeValidateTriageRequest,
  validateTriageResult,
  safeValidateTriageResult,
} from '@/lib/api/contracts/triage'

describe('E6.6.10: Patient Triage Contracts', () => {
  // ============================================================
  // Contract Envelope Tests
  // ============================================================

  describe('Request Contract', () => {
    it('should validate minimal valid triage request', () => {
      const validRequest = {
        inputText: 'I am feeling stressed and anxious',
      }

      const result = TriageRequestV1Schema.safeParse(validRequest)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.inputText).toBe('I am feeling stressed and anxious')
      }
    })

    it('should validate request with optional locale', () => {
      const validRequest = {
        inputText: 'Ich fühle mich gestresst',
        locale: 'de-DE',
      }

      const result = TriageRequestV1Schema.safeParse(validRequest)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.locale).toBe('de-DE')
      }
    })

    it('should validate request with patient context', () => {
      const validRequest = {
        inputText: 'I am experiencing stress',
        patientContext: {
          ageRange: 'AGE_31_50',
        },
      }

      const result = TriageRequestV1Schema.safeParse(validRequest)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.patientContext?.ageRange).toBe('AGE_31_50')
      }
    })

    it('should reject request below minimum length', () => {
      const invalidRequest = {
        inputText: 'short',
      }

      const result = TriageRequestV1Schema.safeParse(invalidRequest)
      expect(result.success).toBe(false)
    })

    it('should reject request above maximum length', () => {
      const invalidRequest = {
        inputText: 'x'.repeat(TRIAGE_INPUT_MAX_LENGTH + 1),
      }

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

  describe('Response Contract', () => {
    it('should validate complete triage result', () => {
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
        correlationId: 'test-correlation-id',
      }

      const result = TriageResultV1Schema.safeParse(validResult)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.tier).toBe(TRIAGE_TIER.ASSESSMENT)
        expect(result.data.nextAction).toBe(TRIAGE_NEXT_ACTION.START_FUNNEL_A)
        expect(result.data.version).toBe(TRIAGE_SCHEMA_VERSION)
      }
    })

    it('should validate minimal triage result', () => {
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

    it('should validate all tier values', () => {
      const tiers = [TRIAGE_TIER.INFO, TRIAGE_TIER.ASSESSMENT, TRIAGE_TIER.ESCALATE]
      
      tiers.forEach((tier) => {
        const result = TriageResultV1Schema.safeParse({
          tier,
          nextAction: TRIAGE_NEXT_ACTION.SHOW_CONTENT,
          redFlags: [],
          rationale: 'Test rationale',
          version: TRIAGE_SCHEMA_VERSION,
        })
        expect(result.success).toBe(true)
      })
    })

    it('should validate all nextAction values', () => {
      const nextActions = [
        TRIAGE_NEXT_ACTION.SHOW_CONTENT,
        TRIAGE_NEXT_ACTION.START_FUNNEL_A,
        TRIAGE_NEXT_ACTION.START_FUNNEL_B,
        TRIAGE_NEXT_ACTION.RESUME_FUNNEL,
        TRIAGE_NEXT_ACTION.SHOW_ESCALATION,
      ]
      
      nextActions.forEach((nextAction) => {
        const result = TriageResultV1Schema.safeParse({
          tier: TRIAGE_TIER.ASSESSMENT,
          nextAction,
          redFlags: [],
          rationale: 'Test rationale',
          version: TRIAGE_SCHEMA_VERSION,
        })
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid tier', () => {
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

    it('should reject invalid nextAction', () => {
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

    it('should reject wrong version', () => {
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
  })

  // ============================================================
  // Bounded Output Tests
  // ============================================================

  describe('Rationale Bounds', () => {
    it('should accept rationale at max length', () => {
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

    it('should reject rationale exceeding max length', () => {
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

    it('should accept valid bullet list rationale', () => {
      const validResult = {
        tier: TRIAGE_TIER.ASSESSMENT,
        nextAction: TRIAGE_NEXT_ACTION.START_FUNNEL_A,
        redFlags: [],
        rationale: `- Bullet point one
- Bullet point two
- Bullet point three`,
        version: TRIAGE_SCHEMA_VERSION,
      }

      const result = TriageResultV1Schema.safeParse(validResult)
      expect(result.success).toBe(true)
    })

    it('should reject bullet list exceeding max bullets', () => {
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
  })

  describe('RedFlags Allowlist', () => {
    it('should accept valid red flags from allowlist', () => {
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

    it('should reject red flags not in allowlist', () => {
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

    it('should accept all allowlisted red flags', () => {
      RED_FLAG_ALLOWLIST.forEach((flag) => {
        const result = TriageResultV1Schema.safeParse({
          tier: TRIAGE_TIER.ESCALATE,
          nextAction: TRIAGE_NEXT_ACTION.SHOW_ESCALATION,
          redFlags: [flag],
          rationale: 'Test rationale',
          version: TRIAGE_SCHEMA_VERSION,
        })
        expect(result.success).toBe(true)
      })
    })

    it('should accept empty red flags array', () => {
      const validResult = {
        tier: TRIAGE_TIER.INFO,
        nextAction: TRIAGE_NEXT_ACTION.SHOW_CONTENT,
        redFlags: [],
        rationale: 'No red flags detected.',
        version: TRIAGE_SCHEMA_VERSION,
      }

      const result = TriageResultV1Schema.safeParse(validResult)
      expect(result.success).toBe(true)
    })
  })

  // ============================================================
  // Helper Function Tests
  // ============================================================

  describe('validateTriageRequest', () => {
    it('should return validated data for valid request', () => {
      const validRequest = {
        inputText: 'I am feeling stressed',
      }

      const result = validateTriageRequest(validRequest)
      expect(result.inputText).toBe('I am feeling stressed')
    })

    it('should throw error for invalid request', () => {
      expect(() => validateTriageRequest({})).toThrow()
    })
  })

  describe('safeValidateTriageRequest', () => {
    it('should return data for valid request', () => {
      const validRequest = {
        inputText: 'I am feeling stressed',
      }

      const result = safeValidateTriageRequest(validRequest)
      expect(result).not.toBeNull()
      expect(result?.inputText).toBe('I am feeling stressed')
    })

    it('should return null for invalid request', () => {
      const result = safeValidateTriageRequest({})
      expect(result).toBeNull()
    })
  })

  describe('validateTriageResult', () => {
    it('should return validated data for valid result', () => {
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

    it('should throw error for invalid result', () => {
      expect(() => validateTriageResult({})).toThrow()
    })
  })

  describe('safeValidateTriageResult', () => {
    it('should return data for valid result', () => {
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

    it('should return null for invalid result', () => {
      const result = safeValidateTriageResult({})
      expect(result).toBeNull()
    })
  })

  // ============================================================
  // Edge Cases
  // ============================================================

  describe('Edge Cases', () => {
    it('should handle Unicode characters in input', () => {
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

    it('should handle empty locale string', () => {
      const request = {
        inputText: 'I am feeling stressed',
        locale: '',
      }

      const result = TriageRequestV1Schema.safeParse(request)
      expect(result.success).toBe(true)
    })

    it('should handle undefined optional fields', () => {
      const request = {
        inputText: 'I am feeling stressed',
        locale: undefined,
        patientContext: undefined,
      }

      const result = TriageRequestV1Schema.safeParse(request)
      expect(result.success).toBe(true)
    })
  })

  // ============================================================
  // Envelope Consistency Tests (E6.6.10 AC3)
  // ============================================================

  describe('Response Envelope Consistency', () => {
    it('should enforce consistent version marker', () => {
      const result = TriageResultV1Schema.safeParse({
        tier: TRIAGE_TIER.INFO,
        nextAction: TRIAGE_NEXT_ACTION.SHOW_CONTENT,
        redFlags: [],
        rationale: 'Test',
        version: TRIAGE_SCHEMA_VERSION,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.version).toBe('v1')
      }
    })

    it('should require all mandatory fields', () => {
      const missingTier = {
        nextAction: TRIAGE_NEXT_ACTION.SHOW_CONTENT,
        redFlags: [],
        rationale: 'Test',
        version: TRIAGE_SCHEMA_VERSION,
      }

      const result1 = TriageResultV1Schema.safeParse(missingTier)
      expect(result1.success).toBe(false)

      const missingNextAction = {
        tier: TRIAGE_TIER.INFO,
        redFlags: [],
        rationale: 'Test',
        version: TRIAGE_SCHEMA_VERSION,
      }

      const result2 = TriageResultV1Schema.safeParse(missingNextAction)
      expect(result2.success).toBe(false)

      const missingRationale = {
        tier: TRIAGE_TIER.INFO,
        nextAction: TRIAGE_NEXT_ACTION.SHOW_CONTENT,
        redFlags: [],
        version: TRIAGE_SCHEMA_VERSION,
      }

      const result3 = TriageResultV1Schema.safeParse(missingRationale)
      expect(result3.success).toBe(false)
    })

    it('should allow optional correlationId', () => {
      const withCorrelationId = {
        tier: TRIAGE_TIER.INFO,
        nextAction: TRIAGE_NEXT_ACTION.SHOW_CONTENT,
        redFlags: [],
        rationale: 'Test',
        version: TRIAGE_SCHEMA_VERSION,
        correlationId: 'test-id-123',
      }

      const result1 = TriageResultV1Schema.safeParse(withCorrelationId)
      expect(result1.success).toBe(true)

      const withoutCorrelationId = {
        tier: TRIAGE_TIER.INFO,
        nextAction: TRIAGE_NEXT_ACTION.SHOW_CONTENT,
        redFlags: [],
        rationale: 'Test',
        version: TRIAGE_SCHEMA_VERSION,
      }

      const result2 = TriageResultV1Schema.safeParse(withoutCorrelationId)
      expect(result2.success).toBe(true)
    })
  })
})
