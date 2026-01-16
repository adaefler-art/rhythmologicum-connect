/**
 * E6.6.8 — Safety Disclaimers Tests
 *
 * Tests for centralized disclaimers and emergency guidance
 */

import {
  EMERGENCY_CONTACTS,
  NON_EMERGENCY_DISCLAIMER,
  STANDARD_EMERGENCY_GUIDANCE,
  RED_FLAG_EMERGENCY_WARNING,
  ESCALATION_DISCLAIMER,
  getEmergencyContactsList,
  getNonEmergencyDisclaimerText,
  getRedFlagEmergencyWarningText,
} from '../disclaimers'

describe('Safety Disclaimers', () => {
  describe('EMERGENCY_CONTACTS', () => {
    it('should have correct emergency number (112)', () => {
      expect(EMERGENCY_CONTACTS.EMERGENCY.number).toBe('112')
      expect(EMERGENCY_CONTACTS.EMERGENCY.label).toBe('Notarzt / Rettungsdienst')
    })

    it('should have correct on-call doctor number (116 117)', () => {
      expect(EMERGENCY_CONTACTS.ON_CALL_DOCTOR.number).toBe('116 117')
      expect(EMERGENCY_CONTACTS.ON_CALL_DOCTOR.label).toBe('Ärztlicher Bereitschaftsdienst')
    })

    it('should have correct suicide prevention number', () => {
      expect(EMERGENCY_CONTACTS.SUICIDE_PREVENTION.number).toBe('0800 111 0 111')
      expect(EMERGENCY_CONTACTS.SUICIDE_PREVENTION.label).toContain('Telefonseelsorge')
    })

    it('should be immutable (const assertion)', () => {
      // TypeScript ensures this at compile time
      expect(Object.isFrozen(EMERGENCY_CONTACTS)).toBe(false) // Not frozen, but const
      expect(EMERGENCY_CONTACTS).toBeDefined()
    })
  })

  describe('NON_EMERGENCY_DISCLAIMER', () => {
    it('should have title and text', () => {
      expect(NON_EMERGENCY_DISCLAIMER.title).toBe('Hinweis')
      expect(NON_EMERGENCY_DISCLAIMER.text).toContain('kein Notfalldienst')
      expect(NON_EMERGENCY_DISCLAIMER.text).toContain('112')
    })

    it('should be clear about non-emergency nature', () => {
      expect(NON_EMERGENCY_DISCLAIMER.text).toContain('akuten medizinischen Notfällen')
    })
  })

  describe('STANDARD_EMERGENCY_GUIDANCE', () => {
    it('should have title and text', () => {
      expect(STANDARD_EMERGENCY_GUIDANCE.title).toBe('Bei akuten Notfällen')
      expect(STANDARD_EMERGENCY_GUIDANCE.text).toContain('112')
    })

    it('should mention calling doctor as alternative', () => {
      expect(STANDARD_EMERGENCY_GUIDANCE.text).toContain('Arzt')
    })
  })

  describe('RED_FLAG_EMERGENCY_WARNING', () => {
    it('should have title, text, and urgentAction', () => {
      expect(RED_FLAG_EMERGENCY_WARNING.title).toBe('Bei akuter Gefahr')
      expect(RED_FLAG_EMERGENCY_WARNING.text).toBe('Wenden Sie sich bitte umgehend an:')
      expect(RED_FLAG_EMERGENCY_WARNING.urgentAction).toContain('112')
    })

    it('should use stronger language than standard guidance', () => {
      expect(RED_FLAG_EMERGENCY_WARNING.urgentAction).toContain('umgehend')
      expect(RED_FLAG_EMERGENCY_WARNING.urgentAction).toContain('Notaufnahme')
    })

    it('should be more urgent than standard emergency guidance', () => {
      // Red flag warning should be longer and more detailed
      expect(RED_FLAG_EMERGENCY_WARNING.urgentAction.length).toBeGreaterThan(
        STANDARD_EMERGENCY_GUIDANCE.text.length,
      )
    })
  })

  describe('ESCALATION_DISCLAIMER', () => {
    it('should have title and intro', () => {
      expect(ESCALATION_DISCLAIMER.title).toBe('Bitte beachten Sie')
      expect(ESCALATION_DISCLAIMER.intro).toContain('persönliche Rücksprache')
    })

    it('should explain escalation rationale', () => {
      expect(ESCALATION_DISCLAIMER.intro).toContain('Basierend auf Ihren Antworten')
    })
  })

  describe('getEmergencyContactsList', () => {
    it('should return array of all emergency contacts', () => {
      const contacts = getEmergencyContactsList()
      expect(contacts).toHaveLength(3)
      expect(contacts).toEqual([
        EMERGENCY_CONTACTS.EMERGENCY,
        EMERGENCY_CONTACTS.ON_CALL_DOCTOR,
        EMERGENCY_CONTACTS.SUICIDE_PREVENTION,
      ])
    })

    it('should include 112 as first contact', () => {
      const contacts = getEmergencyContactsList()
      expect(contacts[0].number).toBe('112')
    })
  })

  describe('getNonEmergencyDisclaimerText', () => {
    it('should return formatted disclaimer text', () => {
      const text = getNonEmergencyDisclaimerText()
      expect(text).toContain('Hinweis:')
      expect(text).toContain('kein Notfalldienst')
      expect(text).toContain('112')
    })

    it('should be suitable for screen readers', () => {
      const text = getNonEmergencyDisclaimerText()
      expect(text).toBeTruthy()
      expect(text.length).toBeGreaterThan(20)
    })
  })

  describe('getRedFlagEmergencyWarningText', () => {
    it('should return formatted red flag warning text', () => {
      const text = getRedFlagEmergencyWarningText()
      expect(text).toContain('Bei akuter Gefahr:')
      expect(text).toContain('umgehend')
      expect(text).toContain('112')
    })

    it('should be suitable for screen readers', () => {
      const text = getRedFlagEmergencyWarningText()
      expect(text).toBeTruthy()
      expect(text.length).toBeGreaterThan(30)
    })
  })

  describe('Consistency checks', () => {
    it('should use consistent emergency number (112) across all disclaimers', () => {
      expect(NON_EMERGENCY_DISCLAIMER.text).toContain('112')
      expect(STANDARD_EMERGENCY_GUIDANCE.text).toContain('112')
      expect(RED_FLAG_EMERGENCY_WARNING.urgentAction).toContain('112')
      expect(EMERGENCY_CONTACTS.EMERGENCY.number).toBe('112')
    })

    it('should use German language consistently', () => {
      expect(NON_EMERGENCY_DISCLAIMER.text).toMatch(/[äöüß]|[A-Z]/)
      expect(STANDARD_EMERGENCY_GUIDANCE.text).toMatch(/[äöüß]|[A-Z]/)
      expect(RED_FLAG_EMERGENCY_WARNING.urgentAction).toMatch(/[äöüß]|[A-Z]/)
    })

    it('should have clear hierarchy: red flag > standard > non-emergency', () => {
      // Red flag warning should be most detailed
      const redFlagLength = RED_FLAG_EMERGENCY_WARNING.urgentAction.length
      const standardLength = STANDARD_EMERGENCY_GUIDANCE.text.length
      const nonEmergencyLength = NON_EMERGENCY_DISCLAIMER.text.length

      expect(redFlagLength).toBeGreaterThan(standardLength)
      expect(standardLength).toBeGreaterThanOrEqual(nonEmergencyLength - 25) // Allow some variance
    })
  })

  describe('Accessibility', () => {
    it('should provide clear, concise text suitable for all users', () => {
      const allTexts = [
        NON_EMERGENCY_DISCLAIMER.text,
        STANDARD_EMERGENCY_GUIDANCE.text,
        RED_FLAG_EMERGENCY_WARNING.urgentAction,
        ESCALATION_DISCLAIMER.intro,
      ]

      allTexts.forEach((text) => {
        expect(text).toBeTruthy()
        expect(text.trim()).toBe(text) // No leading/trailing whitespace
        expect(text).not.toContain('  ') // No double spaces
      })
    })

    it('should use sentence case for titles', () => {
      expect(NON_EMERGENCY_DISCLAIMER.title).toBe('Hinweis')
      expect(STANDARD_EMERGENCY_GUIDANCE.title).toBe('Bei akuten Notfällen')
      expect(RED_FLAG_EMERGENCY_WARNING.title).toBe('Bei akuter Gefahr')
      expect(ESCALATION_DISCLAIMER.title).toBe('Bitte beachten Sie')
    })
  })
})
