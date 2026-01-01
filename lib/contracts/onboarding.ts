/**
 * Onboarding Contracts
 * 
 * Zod schemas and types for patient onboarding flow:
 * - Consent management
 * - Baseline profile collection
 * 
 * @module lib/contracts/onboarding
 */

import { z } from 'zod'

// ============================================================
// Consent Contracts
// ============================================================

/**
 * Current consent version
 * Must match the version stored in database
 */
export const CURRENT_CONSENT_VERSION = '1.0.0'

/**
 * Consent form schema
 */
export const ConsentFormSchema = z.object({
  consentVersion: z.string().min(1, 'Consent version is required'),
  agreedToTerms: z.boolean().refine(val => val === true, {
    message: 'You must agree to the terms to continue',
  }),
})

export type ConsentFormData = z.infer<typeof ConsentFormSchema>

/**
 * Consent record from database
 */
export const ConsentRecordSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  consent_version: z.string(),
  consented_at: z.string().datetime(),
  ip_address: z.string().nullable(),
  user_agent: z.string().nullable(),
})

export type ConsentRecord = z.infer<typeof ConsentRecordSchema>

// ============================================================
// Baseline Profile Contracts
// ============================================================

/**
 * Baseline profile form schema
 * Minimal set of patient demographic data required before assessments
 */
export const BaselineProfileSchema = z.object({
  full_name: z
    .string()
    .min(1, 'Name is required')
    .max(200, 'Name must be less than 200 characters')
    .trim(),
  birth_year: z
    .number()
    .int('Birth year must be a whole number')
    .min(1900, 'Birth year must be 1900 or later')
    .max(new Date().getFullYear(), 'Birth year cannot be in the future')
    .optional()
    .nullable(),
  sex: z
    .enum(['male', 'female', 'other', 'prefer_not_to_say'], {
      message: 'Please select a valid option',
    })
    .optional()
    .nullable(),
})

export type BaselineProfileData = z.infer<typeof BaselineProfileSchema>

/**
 * Patient profile record from database
 */
export const PatientProfileSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  created_at: z.string().datetime(),
  full_name: z.string().nullable(),
  birth_year: z.number().nullable(),
  sex: z.string().nullable(),
})

export type PatientProfile = z.infer<typeof PatientProfileSchema>

// ============================================================
// Onboarding Status
// ============================================================

/**
 * Onboarding completion status
 */
export const OnboardingStatusSchema = z.object({
  hasConsent: z.boolean(),
  hasProfile: z.boolean(),
  isComplete: z.boolean(),
})

export type OnboardingStatus = z.infer<typeof OnboardingStatusSchema>
