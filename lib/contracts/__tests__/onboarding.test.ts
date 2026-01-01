/**
 * Tests for Onboarding Contracts
 */

import {
  ConsentFormSchema,
  BaselineProfileSchema,
  OnboardingStatusSchema,
  CURRENT_CONSENT_VERSION,
} from '../onboarding'
import { PATIENT_SEX } from '../registry'

describe('Onboarding Contracts', () => {
  describe('ConsentFormSchema', () => {
    it('should validate valid consent data', () => {
      const validData = {
        consentVersion: '1.0.0',
        agreedToTerms: true,
      }
      const result = ConsentFormSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject when agreedToTerms is false', () => {
      const invalidData = {
        consentVersion: '1.0.0',
        agreedToTerms: false,
      }
      const result = ConsentFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject when consentVersion is empty', () => {
      const invalidData = {
        consentVersion: '',
        agreedToTerms: true,
      }
      const result = ConsentFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject when agreedToTerms is missing', () => {
      const invalidData = {
        consentVersion: '1.0.0',
      }
      const result = ConsentFormSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('BaselineProfileSchema', () => {
    it('should validate valid profile with all fields', () => {
      const validData = {
        full_name: 'John Doe',
        birth_year: 1990,
        sex: PATIENT_SEX.MALE,
      }
      const result = BaselineProfileSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate profile with only required fields', () => {
      const validData = {
        full_name: 'Jane Smith',
        birth_year: null,
        sex: null,
      }
      const result = BaselineProfileSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject empty name', () => {
      const invalidData = {
        full_name: '',
        birth_year: 1990,
        sex: PATIENT_SEX.FEMALE,
      }
      const result = BaselineProfileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject name longer than 200 characters', () => {
      const invalidData = {
        full_name: 'a'.repeat(201),
        birth_year: 1990,
        sex: PATIENT_SEX.FEMALE,
      }
      const result = BaselineProfileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should trim whitespace from name', () => {
      const validData = {
        full_name: '  John Doe  ',
        birth_year: 1990,
        sex: PATIENT_SEX.MALE,
      }
      const result = BaselineProfileSchema.safeParse(validData)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.full_name).toBe('John Doe')
      }
    })

    it('should reject birth year before 1900', () => {
      const invalidData = {
        full_name: 'John Doe',
        birth_year: 1899,
        sex: PATIENT_SEX.MALE,
      }
      const result = BaselineProfileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should reject birth year in the future', () => {
      const futureYear = new Date().getFullYear() + 1
      const invalidData = {
        full_name: 'John Doe',
        birth_year: futureYear,
        sex: PATIENT_SEX.MALE,
      }
      const result = BaselineProfileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept current year as birth year', () => {
      const currentYear = new Date().getFullYear()
      const validData = {
        full_name: 'Baby Doe',
        birth_year: currentYear,
        sex: PATIENT_SEX.OTHER,
      }
      const result = BaselineProfileSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate all sex enum values', () => {
      const sexValues = [
        PATIENT_SEX.MALE,
        PATIENT_SEX.FEMALE,
        PATIENT_SEX.OTHER,
        PATIENT_SEX.PREFER_NOT_TO_SAY,
      ]
      
      sexValues.forEach((sex) => {
        const validData = {
          full_name: 'Test User',
          birth_year: 1990,
          sex,
        }
        const result = BaselineProfileSchema.safeParse(validData)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid sex value', () => {
      const invalidData = {
        full_name: 'John Doe',
        birth_year: 1990,
        sex: 'invalid',
      }
      const result = BaselineProfileSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })

    it('should accept null for optional birth_year', () => {
      const validData = {
        full_name: 'John Doe',
        birth_year: null,
        sex: PATIENT_SEX.MALE,
      }
      const result = BaselineProfileSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should accept null for optional sex', () => {
      const validData = {
        full_name: 'John Doe',
        birth_year: 1990,
        sex: null,
      }
      const result = BaselineProfileSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })
  })

  describe('OnboardingStatusSchema', () => {
    it('should validate complete onboarding status', () => {
      const validData = {
        hasConsent: true,
        hasProfile: true,
        isComplete: true,
      }
      const result = OnboardingStatusSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should validate incomplete onboarding status', () => {
      const validData = {
        hasConsent: false,
        hasProfile: false,
        isComplete: false,
      }
      const result = OnboardingStatusSchema.safeParse(validData)
      expect(result.success).toBe(true)
    })

    it('should reject missing fields', () => {
      const invalidData = {
        hasConsent: true,
        hasProfile: true,
      }
      const result = OnboardingStatusSchema.safeParse(invalidData)
      expect(result.success).toBe(false)
    })
  })

  describe('CURRENT_CONSENT_VERSION', () => {
    it('should be a valid version string', () => {
      expect(typeof CURRENT_CONSENT_VERSION).toBe('string')
      expect(CURRENT_CONSENT_VERSION).toMatch(/^\d+\.\d+\.\d+$/)
    })

    it('should be 1.0.0', () => {
      expect(CURRENT_CONSENT_VERSION).toBe('1.0.0')
    })
  })
})
