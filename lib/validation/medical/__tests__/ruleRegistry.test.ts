/**
 * Medical Validation Rule Registry Tests - V05-I05.5
 */

import {
  VALIDATION_RULE_REGISTRY,
  getRule,
  getLatestRule,
  listRules,
  listActiveRules,
  listRulesBySection,
  hasRule,
  listRuleIds,
  getRuleMetadata,
  getRegistryVersion,
  getRulesetHash,
} from '@/lib/validation/medical/ruleRegistry'
import {
  VALIDATION_SEVERITY,
  VALIDATION_FLAG_TYPE,
} from '@/lib/contracts/medicalValidation'

describe('Medical Validation Rule Registry', () => {
  describe('Registry Structure', () => {
    it('should have rules defined', () => {
      expect(Object.keys(VALIDATION_RULE_REGISTRY).length).toBeGreaterThan(0)
    })

    it('should have valid rule keys (format: ruleId-version)', () => {
      Object.keys(VALIDATION_RULE_REGISTRY).forEach(key => {
        expect(key).toMatch(/^[\w-]+-v\d+\.\d+\.\d+$/)
      })
    })

    it('should have all rules with immutable flag set to true', () => {
      Object.values(VALIDATION_RULE_REGISTRY).forEach(rule => {
        expect(rule.metadata.immutable).toBe(true)
      })
    })

    it('should have all rules with valid severity', () => {
      Object.values(VALIDATION_RULE_REGISTRY).forEach(rule => {
        expect(Object.values(VALIDATION_SEVERITY)).toContain(rule.metadata.severity)
      })
    })

    it('should have all rules with valid flag type', () => {
      Object.values(VALIDATION_RULE_REGISTRY).forEach(rule => {
        expect(Object.values(VALIDATION_FLAG_TYPE)).toContain(rule.metadata.flagType)
      })
    })
  })

  describe('getRule', () => {
    it('should get rule by ID and version', () => {
      const rule = getRule('contraindication-high-stress-vigorous-exercise', 'v1.0.0')
      expect(rule).toBeDefined()
      expect(rule?.metadata.ruleId).toBe('contraindication-high-stress-vigorous-exercise')
      expect(rule?.metadata.version).toBe('v1.0.0')
    })

    it('should return null for nonexistent rule', () => {
      const rule = getRule('nonexistent-rule', 'v1.0.0')
      expect(rule).toBeNull()
    })

    it('should return null for nonexistent version', () => {
      const rule = getRule('contraindication-high-stress-vigorous-exercise', 'v99.0.0')
      expect(rule).toBeNull()
    })
  })

  describe('getLatestRule', () => {
    it('should get latest version of a rule', () => {
      const rule = getLatestRule('contraindication-high-stress-vigorous-exercise')
      expect(rule).toBeDefined()
      expect(rule?.metadata.ruleId).toBe('contraindication-high-stress-vigorous-exercise')
      expect(rule?.metadata.version).toBe('v1.0.0')
    })

    it('should return null for nonexistent rule', () => {
      const rule = getLatestRule('nonexistent-rule')
      expect(rule).toBeNull()
    })
  })

  describe('listRules', () => {
    it('should list all rules', () => {
      const rules = listRules()
      expect(rules.length).toBeGreaterThan(0)
      expect(rules.length).toBe(Object.keys(VALIDATION_RULE_REGISTRY).length)
    })

    it('should return array of validation rules', () => {
      const rules = listRules()
      rules.forEach(rule => {
        expect(rule).toHaveProperty('metadata')
        expect(rule).toHaveProperty('logic')
      })
    })
  })

  describe('listActiveRules', () => {
    it('should list only active rules', () => {
      const rules = listActiveRules()
      rules.forEach(rule => {
        expect(rule.metadata.isActive).toBe(true)
      })
    })

    it('should return at least some active rules', () => {
      const rules = listActiveRules()
      expect(rules.length).toBeGreaterThan(0)
    })
  })

  describe('listRulesBySection', () => {
    it('should list rules for specific section', () => {
      const rules = listRulesBySection('recommendations')
      expect(rules.length).toBeGreaterThan(0)
      rules.forEach(rule => {
        expect(
          rule.metadata.sectionKey === 'recommendations' || 
          rule.metadata.sectionKey === 'all'
        ).toBe(true)
      })
    })

    it('should include global rules (sectionKey: all)', () => {
      const rules = listRulesBySection('overview')
      const globalRules = rules.filter(r => r.metadata.sectionKey === 'all')
      expect(globalRules.length).toBeGreaterThan(0)
    })

    it('should only return active rules', () => {
      const rules = listRulesBySection('recommendations')
      rules.forEach(rule => {
        expect(rule.metadata.isActive).toBe(true)
      })
    })
  })

  describe('hasRule', () => {
    it('should return true for existing rule', () => {
      expect(hasRule('contraindication-high-stress-vigorous-exercise', 'v1.0.0')).toBe(true)
    })

    it('should return false for nonexistent rule', () => {
      expect(hasRule('nonexistent-rule', 'v1.0.0')).toBe(false)
    })

    it('should return false for nonexistent version', () => {
      expect(hasRule('contraindication-high-stress-vigorous-exercise', 'v99.0.0')).toBe(false)
    })
  })

  describe('listRuleIds', () => {
    it('should list unique rule IDs', () => {
      const ids = listRuleIds()
      expect(ids.length).toBeGreaterThan(0)
      
      // Check uniqueness
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(ids.length)
    })

    it('should include known rule IDs', () => {
      const ids = listRuleIds()
      expect(ids).toContain('contraindication-high-stress-vigorous-exercise')
      expect(ids).toContain('plausibility-contradictory-risk-level')
    })
  })

  describe('getRuleMetadata', () => {
    it('should get metadata without logic', () => {
      const metadata = getRuleMetadata('contraindication-high-stress-vigorous-exercise', 'v1.0.0')
      expect(metadata).toBeDefined()
      expect(metadata?.ruleId).toBe('contraindication-high-stress-vigorous-exercise')
      expect(metadata).not.toHaveProperty('logic')
    })

    it('should return null for nonexistent rule', () => {
      const metadata = getRuleMetadata('nonexistent-rule', 'v1.0.0')
      expect(metadata).toBeNull()
    })
  })

  describe('getRegistryVersion', () => {
    it('should return a version string', () => {
      const version = getRegistryVersion()
      expect(version).toMatch(/^v\d+\.\d+\.\d+$/)
    })

    it('should return consistent version', () => {
      const version1 = getRegistryVersion()
      const version2 = getRegistryVersion()
      expect(version1).toBe(version2)
    })
  })

  describe('Rule Logic Types', () => {
    it('should have contraindication rules', () => {
      const rules = listActiveRules().filter(
        r => r.logic.type === 'contraindication'
      )
      expect(rules.length).toBeGreaterThan(0)
    })

    it('should have pattern rules', () => {
      const rules = listActiveRules().filter(
        r => r.logic.type === 'pattern'
      )
      expect(rules.length).toBeGreaterThan(0)
    })

    it('should have keyword rules', () => {
      const rules = listActiveRules().filter(
        r => r.logic.type === 'keyword'
      )
      expect(rules.length).toBeGreaterThan(0)
    })

    it('should have out_of_bounds rules', () => {
      const rules = listActiveRules().filter(
        r => r.logic.type === 'out_of_bounds'
      )
      expect(rules.length).toBeGreaterThan(0)
    })
  })

  describe('Specific Rule Tests', () => {
    it('should have contraindication rule for high stress and exercise', () => {
      const rule = getRule('contraindication-high-stress-vigorous-exercise', 'v1.0.0')
      expect(rule).toBeDefined()
      expect(rule?.metadata.flagType).toBe(VALIDATION_FLAG_TYPE.CONTRAINDICATION)
      expect(rule?.metadata.severity).toBe(VALIDATION_SEVERITY.WARNING)
      expect(rule?.logic.type).toBe('contraindication')
      
      if (rule && rule.logic.type === 'contraindication') {
        expect(rule.logic.riskSignals).toContain('critical')
        expect(rule.logic.conflictingPatterns.length).toBeGreaterThan(0)
      }
    })

    it('should have plausibility rule for contradictory risk levels', () => {
      const rule = getRule('plausibility-contradictory-risk-level', 'v1.0.0')
      expect(rule).toBeDefined()
      expect(rule?.metadata.flagType).toBe(VALIDATION_FLAG_TYPE.PLAUSIBILITY)
      expect(rule?.metadata.severity).toBe(VALIDATION_SEVERITY.CRITICAL)
      expect(rule?.logic.type).toBe('pattern')
    })

    it('should have safety rule preventing diagnosis claims', () => {
      const rule = getRule('safety-no-diagnosis-claims', 'v1.0.0')
      expect(rule).toBeDefined()
      expect(rule?.metadata.flagType).toBe(VALIDATION_FLAG_TYPE.PLAUSIBILITY)
      expect(rule?.metadata.severity).toBe(VALIDATION_SEVERITY.CRITICAL)
      expect(rule?.logic.type).toBe('keyword')
      
      if (rule && rule.logic.type === 'keyword') {
        expect(rule.logic.presenceIsViolation).toBe(true)
        expect(rule.logic.keywords.length).toBeGreaterThan(0)
      }
    })

    it('should have out-of-bounds rule for risk scores', () => {
      const rule = getRule('out-of-bounds-risk-score', 'v1.0.0')
      expect(rule).toBeDefined()
      expect(rule?.metadata.flagType).toBe(VALIDATION_FLAG_TYPE.OUT_OF_BOUNDS)
      expect(rule?.logic.type).toBe('out_of_bounds')
      
      if (rule && rule.logic.type === 'out_of_bounds') {
        expect(rule.logic.minValue).toBe(0)
        expect(rule.logic.maxValue).toBe(100)
      }
    })
  })

  describe('Determinism', () => {
    it('should return rules in stable order from listActiveRules', () => {
      const rules1 = listActiveRules()
      const rules2 = listActiveRules()
      
      const ruleIds1 = rules1.map(r => r.metadata.ruleId)
      const ruleIds2 = rules2.map(r => r.metadata.ruleId)
      
      expect(ruleIds1).toEqual(ruleIds2)
      
      // Verify sorted order
      const sorted = [...ruleIds1].sort()
      expect(ruleIds1).toEqual(sorted)
    })

    it('should return rules in stable order from listRulesBySection', () => {
      const rules1 = listRulesBySection('recommendations')
      const rules2 = listRulesBySection('recommendations')
      
      const ruleIds1 = rules1.map(r => r.metadata.ruleId)
      const ruleIds2 = rules2.map(r => r.metadata.ruleId)
      
      expect(ruleIds1).toEqual(ruleIds2)
      
      // Verify sorted order
      const sorted = [...ruleIds1].sort()
      expect(ruleIds1).toEqual(sorted)
    })
  })

  describe('getRulesetHash', () => {
    it('should return deterministic hash', () => {
      const hash1 = getRulesetHash()
      const hash2 = getRulesetHash()
      
      expect(hash1).toBe(hash2)
    })

    it('should return 32 character hex string', () => {
      const hash = getRulesetHash()
      
      expect(hash).toMatch(/^[0-9a-f]{32}$/)
      expect(hash.length).toBe(32)
    })

    it('should be stable across multiple calls', () => {
      const hashes = Array(10).fill(null).map(() => getRulesetHash())
      const uniqueHashes = new Set(hashes)
      
      expect(uniqueHashes.size).toBe(1)
    })
  })

  describe('Fail-Closed Behavior', () => {
    it('should return null for unknown rules (fail-closed)', () => {
      const unknownRule = getRule('unknown-rule-id', 'v1.0.0')
      expect(unknownRule).toBeNull()
    })

    it('should not throw on missing rules', () => {
      expect(() => getRule('missing', 'v1.0.0')).not.toThrow()
      expect(() => getLatestRule('missing')).not.toThrow()
    })
  })
})
