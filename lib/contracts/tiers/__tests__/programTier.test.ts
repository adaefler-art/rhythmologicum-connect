/**
 * Tests for Program Tier Contract types and validation
 */

import {
  validateProgramTierContract,
  parseProgramTierContract,
  safeParseProgramTierContract,
  getActivePillars,
  getRecommendedFunnels,
  getAllowedFunnels,
  isFunnelAllowedInTier,
  isPillarActiveInTier,
  PROGRAM_TIER,
  TOUCHPOINT_TYPE,
} from '../../programTier'
import { PILLAR_KEY, FUNNEL_SLUG } from '../../registry'
import { TIER_1_ESSENTIAL, TIER_2_5_ENHANCED, TIER_2_COMPREHENSIVE } from '../index'

describe('Program Tier Contract Validation', () => {
  describe('validateProgramTierContract', () => {
    it('validates a correct tier contract', () => {
      expect(validateProgramTierContract(TIER_1_ESSENTIAL)).toBe(true)
    })

    it('rejects invalid tier contracts', () => {
      expect(validateProgramTierContract({})).toBe(false)
      expect(validateProgramTierContract(null)).toBe(false)
      expect(validateProgramTierContract('invalid')).toBe(false)
    })

    it('rejects contracts with invalid tier level', () => {
      const invalid = {
        ...TIER_1_ESSENTIAL,
        tier: 'invalid-tier',
      }
      expect(validateProgramTierContract(invalid)).toBe(false)
    })

    it('rejects contracts with invalid pillar keys', () => {
      const invalid = {
        ...TIER_1_ESSENTIAL,
        pillars: [{ key: 'invalid-pillar', active: true }],
      }
      expect(validateProgramTierContract(invalid)).toBe(false)
    })
  })

  describe('parseProgramTierContract', () => {
    it('parses valid tier contract', () => {
      const parsed = parseProgramTierContract(TIER_1_ESSENTIAL)
      expect(parsed).toEqual(TIER_1_ESSENTIAL)
    })

    it('throws on invalid contract', () => {
      expect(() => parseProgramTierContract({})).toThrow()
    })
  })

  describe('safeParseProgramTierContract', () => {
    it('returns parsed contract for valid input', () => {
      const parsed = safeParseProgramTierContract(TIER_1_ESSENTIAL)
      expect(parsed).toEqual(TIER_1_ESSENTIAL)
    })

    it('returns null for invalid input', () => {
      expect(safeParseProgramTierContract({})).toBeNull()
      expect(safeParseProgramTierContract(null)).toBeNull()
    })
  })
})

describe('Tier Contract Helper Functions', () => {
  describe('getActivePillars', () => {
    it('returns only active pillars from Tier 1', () => {
      const pillars = getActivePillars(TIER_1_ESSENTIAL)
      expect(pillars).toEqual([PILLAR_KEY.MENTAL_HEALTH])
    })

    it('returns multiple active pillars from Tier 2.5', () => {
      const pillars = getActivePillars(TIER_2_5_ENHANCED)
      expect(pillars).toContain(PILLAR_KEY.MENTAL_HEALTH)
      expect(pillars).toContain(PILLAR_KEY.SLEEP)
    })

    it('returns pillars sorted by priority', () => {
      const pillars = getActivePillars(TIER_2_COMPREHENSIVE)
      // All pillars should be active in Tier 2
      expect(pillars.length).toBe(Object.keys(PILLAR_KEY).length)
      // First pillar should be nutrition (priority 1)
      expect(pillars[0]).toBe(PILLAR_KEY.NUTRITION)
    })
  })

  describe('getRecommendedFunnels', () => {
    it('returns only recommended funnels', () => {
      const funnels = getRecommendedFunnels(TIER_1_ESSENTIAL)
      expect(funnels).toEqual([FUNNEL_SLUG.STRESS_ASSESSMENT])
    })

    it('returns multiple recommended funnels for Tier 2', () => {
      const funnels = getRecommendedFunnels(TIER_2_COMPREHENSIVE)
      expect(funnels.length).toBeGreaterThan(1)
      expect(funnels).toContain(FUNNEL_SLUG.STRESS_ASSESSMENT)
    })

    it('returns funnels sorted by priority', () => {
      const funnels = getRecommendedFunnels(TIER_2_COMPREHENSIVE)
      // Stress assessment should be first (priority 1)
      expect(funnels[0]).toBe(FUNNEL_SLUG.STRESS_ASSESSMENT)
    })
  })

  describe('getAllowedFunnels', () => {
    it('returns all funnels (recommended and non-recommended)', () => {
      const funnels = getAllowedFunnels(TIER_1_ESSENTIAL)
      expect(funnels).toContain(FUNNEL_SLUG.STRESS_ASSESSMENT)
    })

    it('returns all funnels for comprehensive tier', () => {
      const funnels = getAllowedFunnels(TIER_2_COMPREHENSIVE)
      expect(funnels.length).toBe(TIER_2_COMPREHENSIVE.funnels.length)
    })
  })

  describe('isFunnelAllowedInTier', () => {
    it('returns true for allowed funnel', () => {
      expect(isFunnelAllowedInTier(TIER_1_ESSENTIAL, FUNNEL_SLUG.STRESS_ASSESSMENT)).toBe(true)
    })

    it('returns false for non-allowed funnel', () => {
      expect(isFunnelAllowedInTier(TIER_1_ESSENTIAL, FUNNEL_SLUG.CARDIOVASCULAR_AGE)).toBe(false)
    })

    it('returns true for all funnels in comprehensive tier', () => {
      expect(isFunnelAllowedInTier(TIER_2_COMPREHENSIVE, FUNNEL_SLUG.STRESS_ASSESSMENT)).toBe(true)
      expect(isFunnelAllowedInTier(TIER_2_COMPREHENSIVE, FUNNEL_SLUG.SLEEP_QUALITY)).toBe(true)
      expect(isFunnelAllowedInTier(TIER_2_COMPREHENSIVE, FUNNEL_SLUG.CARDIOVASCULAR_AGE)).toBe(true)
    })
  })

  describe('isPillarActiveInTier', () => {
    it('returns true for active pillar', () => {
      expect(isPillarActiveInTier(TIER_1_ESSENTIAL, PILLAR_KEY.MENTAL_HEALTH)).toBe(true)
    })

    it('returns false for inactive pillar', () => {
      expect(isPillarActiveInTier(TIER_1_ESSENTIAL, PILLAR_KEY.NUTRITION)).toBe(false)
    })

    it('returns true for all pillars in comprehensive tier', () => {
      expect(isPillarActiveInTier(TIER_2_COMPREHENSIVE, PILLAR_KEY.NUTRITION)).toBe(true)
      expect(isPillarActiveInTier(TIER_2_COMPREHENSIVE, PILLAR_KEY.MOVEMENT)).toBe(true)
      expect(isPillarActiveInTier(TIER_2_COMPREHENSIVE, PILLAR_KEY.SLEEP)).toBe(true)
      expect(isPillarActiveInTier(TIER_2_COMPREHENSIVE, PILLAR_KEY.MENTAL_HEALTH)).toBe(true)
    })
  })
})

describe('Tier Contract Configurations', () => {
  describe('TIER_1_ESSENTIAL', () => {
    it('has correct tier level', () => {
      expect(TIER_1_ESSENTIAL.tier).toBe(PROGRAM_TIER.TIER_1_ESSENTIAL)
    })

    it('has only mental health pillar active', () => {
      const activePillars = TIER_1_ESSENTIAL.pillars.filter((p) => p.active)
      expect(activePillars.length).toBe(1)
      expect(activePillars[0].key).toBe(PILLAR_KEY.MENTAL_HEALTH)
    })

    it('includes stress assessment funnel', () => {
      expect(TIER_1_ESSENTIAL.funnels[0].slug).toBe(FUNNEL_SLUG.STRESS_ASSESSMENT)
      expect(TIER_1_ESSENTIAL.funnels[0].recommended).toBe(true)
    })

    it('has minimal schedule', () => {
      expect(TIER_1_ESSENTIAL.schedule).toBeDefined()
      expect(TIER_1_ESSENTIAL.schedule!.length).toBe(1)
      expect(TIER_1_ESSENTIAL.schedule![0].type).toBe(TOUCHPOINT_TYPE.SELF_ASSESSMENT)
    })

    it('validates successfully', () => {
      expect(validateProgramTierContract(TIER_1_ESSENTIAL)).toBe(true)
    })

    it('contains no PHI/PII', () => {
      const contract = JSON.stringify(TIER_1_ESSENTIAL)
      expect(contract).not.toMatch(/@/i) // No email addresses
      expect(contract).not.toMatch(/patient.*name/i)
      expect(contract).not.toMatch(/\d{3}-\d{2}-\d{4}/) // No SSN patterns
    })
  })

  describe('TIER_2_5_ENHANCED', () => {
    it('has correct tier level', () => {
      expect(TIER_2_5_ENHANCED.tier).toBe(PROGRAM_TIER.TIER_2_5_ENHANCED)
    })

    it('has mental health and sleep pillars active', () => {
      const activePillars = TIER_2_5_ENHANCED.pillars.filter((p) => p.active)
      expect(activePillars.length).toBe(2)
      const activeKeys = activePillars.map((p) => p.key)
      expect(activeKeys).toContain(PILLAR_KEY.MENTAL_HEALTH)
      expect(activeKeys).toContain(PILLAR_KEY.SLEEP)
    })

    it('includes nurse touchpoints in schedule', () => {
      expect(TIER_2_5_ENHANCED.schedule).toBeDefined()
      const nurseTouchpoints = TIER_2_5_ENHANCED.schedule!.filter(
        (t) => t.type === TOUCHPOINT_TYPE.NURSE_VISIT,
      )
      expect(nurseTouchpoints.length).toBeGreaterThan(0)
    })

    it('validates successfully', () => {
      expect(validateProgramTierContract(TIER_2_5_ENHANCED)).toBe(true)
    })
  })

  describe('TIER_2_COMPREHENSIVE', () => {
    it('has correct tier level', () => {
      expect(TIER_2_COMPREHENSIVE.tier).toBe(PROGRAM_TIER.TIER_2_COMPREHENSIVE)
    })

    it('has all pillars active', () => {
      const activePillars = TIER_2_COMPREHENSIVE.pillars.filter((p) => p.active)
      expect(activePillars.length).toBe(Object.keys(PILLAR_KEY).length)
    })

    it('includes multiple recommended funnels', () => {
      const recommendedFunnels = TIER_2_COMPREHENSIVE.funnels.filter((f) => f.recommended)
      expect(recommendedFunnels.length).toBeGreaterThan(1)
    })

    it('includes clinician touchpoints in schedule', () => {
      expect(TIER_2_COMPREHENSIVE.schedule).toBeDefined()
      const clinicianTouchpoints = TIER_2_COMPREHENSIVE.schedule!.filter(
        (t) => t.type === TOUCHPOINT_TYPE.CLINICIAN_REVIEW,
      )
      expect(clinicianTouchpoints.length).toBeGreaterThan(0)
    })

    it('validates successfully', () => {
      expect(validateProgramTierContract(TIER_2_COMPREHENSIVE)).toBe(true)
    })
  })
})

describe('Contract Schema Validation', () => {
  it('requires tier field', () => {
    const invalid = { ...TIER_1_ESSENTIAL }
    delete (invalid as any).tier
    expect(validateProgramTierContract(invalid)).toBe(false)
  })

  it('requires version field', () => {
    const invalid = { ...TIER_1_ESSENTIAL }
    delete (invalid as any).version
    expect(validateProgramTierContract(invalid)).toBe(false)
  })

  it('requires name field', () => {
    const invalid = { ...TIER_1_ESSENTIAL }
    delete (invalid as any).name
    expect(validateProgramTierContract(invalid)).toBe(false)
  })

  it('requires pillars array', () => {
    const invalid = { ...TIER_1_ESSENTIAL }
    delete (invalid as any).pillars
    expect(validateProgramTierContract(invalid)).toBe(false)
  })

  it('requires funnels array', () => {
    const invalid = { ...TIER_1_ESSENTIAL }
    delete (invalid as any).funnels
    expect(validateProgramTierContract(invalid)).toBe(false)
  })

  it('allows optional schedule', () => {
    const valid = { ...TIER_1_ESSENTIAL }
    delete (valid as any).schedule
    expect(validateProgramTierContract(valid)).toBe(true)
  })

  it('allows optional metadata', () => {
    const valid = { ...TIER_1_ESSENTIAL }
    delete (valid as any).metadata
    expect(validateProgramTierContract(valid)).toBe(true)
  })
})
