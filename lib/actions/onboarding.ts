/**
 * Onboarding Server Actions
 * 
 * Server-side handlers for patient onboarding flow.
 * Handles consent recording and baseline profile management with:
 * - Idempotent operations
 * - RLS enforcement
 * - Audit logging
 * 
 * @module lib/actions/onboarding
 */

'use server'

import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import {
  ConsentFormSchema,
  BaselineProfileSchema,
  type OnboardingStatus,
  type ConsentRecord,
  type PatientProfile,
  CURRENT_CONSENT_VERSION,
} from '@/lib/contracts/onboarding'
import { logAuditEvent } from '@/lib/audit'
import { env } from '@/lib/env'

// PostgreSQL error codes
const PG_ERROR_UNIQUE_VIOLATION = '23505'

// ============================================================
// Types
// ============================================================

type ActionResult<T> = {
  success: boolean
  data?: T
  error?: string
}

// ============================================================
// Helper: Get Authenticated Supabase Client
// ============================================================

async function getAuthenticatedClient() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return { supabase: null, user: null, error: 'Not authenticated' }
  }

  return { supabase, user, error: null }
}

// ============================================================
// Consent Actions
// ============================================================

/**
 * Records user consent to terms and conditions
 * Idempotent: Returns success if consent already recorded for this version
 * 
 * @param formData - Consent form data with agreedToTerms flag
 * @returns Result with consent record or error
 */
export async function recordConsent(formData: {
  consentVersion: string
  agreedToTerms: boolean
}): Promise<ActionResult<ConsentRecord>> {
  try {
    // Validate input
    const validationResult = ConsentFormSchema.safeParse(formData)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return {
        success: false,
        error: firstError?.message || 'Invalid consent data',
      }
    }

    // Get authenticated client
    const { supabase, user, error: authError } = await getAuthenticatedClient()
    if (authError || !supabase || !user) {
      return { success: false, error: authError || 'Authentication failed' }
    }

    // Check if consent already exists (idempotent check)
    // Use limit(1) instead of maybeSingle() to avoid hard failures if duplicates exist.
    const { data: existingConsents, error: existingConsentError } = await supabase
      .from('user_consents')
      .select('*')
      .eq('user_id', user.id)
      .eq('consent_version', formData.consentVersion)
      .order('consented_at', { ascending: false })
      .limit(1)

    if (existingConsentError) {
      console.error('[onboarding/recordConsent] Existing consent check error:', existingConsentError)
      return {
        success: false,
        error: 'Failed to check existing consent',
      }
    }

    const existingConsent = existingConsents?.[0]

    if (existingConsent) {
      // Already consented - idempotent success
      return {
        success: true,
        data: existingConsent as ConsentRecord,
      }
    }

    // Insert new consent record
    const { data, error } = await supabase
      .from('user_consents')
      .insert({
        user_id: user.id,
        consent_version: formData.consentVersion,
      })
      .select()
      .single()

    if (error) {
      // Idempotent under races: if another request inserted concurrently, treat as success.
      if ((error as { code?: string } | null)?.code === PG_ERROR_UNIQUE_VIOLATION) {
        const { data: retryData, error: retryError } = await supabase
          .from('user_consents')
          .select('*')
          .eq('user_id', user.id)
          .eq('consent_version', formData.consentVersion)
          .order('consented_at', { ascending: false })
          .limit(1)

        if (retryError) {
          console.error('[onboarding/recordConsent] Retry after conflict failed:', retryError)
          return { success: false, error: 'Failed to record consent' }
        }

        const retryConsent = retryData?.[0]
        if (retryConsent) {
          return { success: true, data: retryConsent as ConsentRecord }
        }
      }

      console.error('[onboarding/recordConsent] Database error:', error)
      return { success: false, error: 'Failed to record consent' }
    }

    // Log audit event
    await logAuditEvent({
      source: 'api',
      entity_type: 'consent',
      entity_id: data.id,
      action: 'create',
      actor_user_id: user.id,
      metadata: {
        consent_version: formData.consentVersion,
      },
    })

    return {
      success: true,
      data: data as ConsentRecord,
    }
  } catch (err) {
    console.error('[onboarding/recordConsent] Unexpected error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unexpected error',
    }
  }
}

/**
 * Checks if user has consented to current version
 * 
 * @returns Result with boolean indicating consent status
 */
export async function hasUserConsented(): Promise<ActionResult<boolean>> {
  try {
    const { supabase, user, error: authError } = await getAuthenticatedClient()
    if (authError || !supabase || !user) {
      return { success: false, error: authError || 'Authentication failed' }
    }

    const { data, error } = await supabase
      .from('user_consents')
      .select('id')
      .eq('user_id', user.id)
      .eq('consent_version', CURRENT_CONSENT_VERSION)
      .order('consented_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('[onboarding/hasUserConsented] Database error:', error)
      return { success: false, error: 'Failed to check consent status' }
    }

    return {
      success: true,
      data: (data?.length ?? 0) > 0,
    }
  } catch (err) {
    console.error('[onboarding/hasUserConsented] Unexpected error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unexpected error',
    }
  }
}

// ============================================================
// Baseline Profile Actions
// ============================================================

/**
 * Saves or updates patient baseline profile
 * Idempotent: Upserts profile data
 * 
 * @param profileData - Baseline profile data
 * @returns Result with patient profile or error
 */
export async function saveBaselineProfile(
  profileData: Partial<{
    full_name: string
    birth_year: number | null
    sex: string | null
  }>,
): Promise<ActionResult<PatientProfile>> {
  try {
    // Validate input
    const validationResult = BaselineProfileSchema.safeParse(profileData)
    if (!validationResult.success) {
      const firstError = validationResult.error.issues[0]
      return {
        success: false,
        error: firstError?.message || 'Invalid profile data',
      }
    }

    // Get authenticated client
    const { supabase, user, error: authError } = await getAuthenticatedClient()
    if (authError || !supabase || !user) {
      return { success: false, error: authError || 'Authentication failed' }
    }

    // Check if profile exists
    const { data: existingProfiles, error: existingProfileError } = await supabase
      .from('patient_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (existingProfileError) {
      console.error('[onboarding/saveBaselineProfile] Existing profile check error:', existingProfileError)
      return { success: false, error: 'Failed to check profile' }
    }

    const existingProfile = existingProfiles?.[0]

    let result: PatientProfile | null = null
    let isUpdate = false
   
    if (existingProfile) {
      // Update existing profile
      isUpdate = true
      const { data, error } = await supabase
        .from('patient_profiles')
        .update({
          full_name: validationResult.data.full_name,
          birth_year: validationResult.data.birth_year,
          sex: validationResult.data.sex,
        })
        .eq('id', (existingProfile as { id: string }).id)
        .select()
        .single()

      if (error) {
        console.error('[onboarding/saveBaselineProfile] Update error:', error)
        return { success: false, error: 'Failed to update profile' }
      }
      result = data as PatientProfile
    } else {
      // Insert new profile
      const { data, error } = await supabase
        .from('patient_profiles')
        .insert({
          user_id: user.id,
          full_name: validationResult.data.full_name,
          birth_year: validationResult.data.birth_year,
          sex: validationResult.data.sex,
        })
        .select()
        .single()

      if (error) {
        // Idempotent under races: if a concurrent request inserted a profile, update the latest.
        if ((error as { code?: string } | null)?.code === PG_ERROR_UNIQUE_VIOLATION) {
          const { data: retryProfiles, error: retryExistingError } = await supabase
            .from('patient_profiles')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false })
            .limit(1)

          if (retryExistingError) {
            console.error(
              '[onboarding/saveBaselineProfile] Retry fetch after conflict failed:',
              retryExistingError,
            )
            return { success: false, error: 'Failed to create profile' }
          }

          const retryExisting = retryProfiles?.[0]
          if (!retryExisting) {
            return { success: false, error: 'Failed to create profile' }
          }

          isUpdate = true
          const { data: retryUpdateData, error: retryUpdateError } = await supabase
            .from('patient_profiles')
            .update({
              full_name: validationResult.data.full_name,
              birth_year: validationResult.data.birth_year,
              sex: validationResult.data.sex,
            })
            .eq('id', (retryExisting as { id: string }).id)
            .select()
            .single()

          if (retryUpdateError) {
            console.error(
              '[onboarding/saveBaselineProfile] Retry update after conflict failed:',
              retryUpdateError,
            )
            return { success: false, error: 'Failed to update profile' }
          }

          result = retryUpdateData
        } else {
          console.error('[onboarding/saveBaselineProfile] Insert error:', error)
          return { success: false, error: 'Failed to create profile' }
        }
      }
      if (!result) {
        result = data as PatientProfile
      }
    }

    if (!result) {
      return { success: false, error: 'Failed to save profile' }
    }

    // Log audit event
    await logAuditEvent({
      source: 'api',
      entity_type: 'consent', // Using 'consent' as profile entity type not in registry
      entity_id: result.id,
      action: isUpdate ? 'update' : 'create',
      actor_user_id: user.id,
      metadata: {
        profile_updated: 'baseline',
      },
    })

    return {
      success: true,
      data: result,
    }
  } catch (err) {
    console.error('[onboarding/saveBaselineProfile] Unexpected error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unexpected error',
    }
  }
}

/**
 * Gets user's baseline profile
 * 
 * @returns Result with patient profile or null if not found
 */
export async function getBaselineProfile(): Promise<ActionResult<PatientProfile | null>> {
  try {
    const { supabase, user, error: authError } = await getAuthenticatedClient()
    if (authError || !supabase || !user) {
      return { success: false, error: authError || 'Authentication failed' }
    }

    const { data, error } = await supabase
      .from('patient_profiles')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (error) {
      console.error('[onboarding/getBaselineProfile] Database error:', error)
      return { success: false, error: 'Failed to fetch profile' }
    }

    return {
      success: true,
      data: (data?.[0] as PatientProfile | undefined) ?? null,
    }
  } catch (err) {
    console.error('[onboarding/getBaselineProfile] Unexpected error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unexpected error',
    }
  }
}

// ============================================================
// Onboarding Status
// ============================================================

/**
 * Gets overall onboarding status
 * Checks if user has completed consent and baseline profile
 * 
 * @returns Onboarding completion status
 */
export async function getOnboardingStatus(): Promise<ActionResult<OnboardingStatus>> {
  try {
    const { supabase, user, error: authError } = await getAuthenticatedClient()
    if (authError || !supabase || !user) {
      return { success: false, error: authError || 'Authentication failed' }
    }

    // Check consent
    const { data: consentData, error: consentError } = await supabase
      .from('user_consents')
      .select('id')
      .eq('user_id', user.id)
      .eq('consent_version', CURRENT_CONSENT_VERSION)
      .order('consented_at', { ascending: false })
      .limit(1)

    if (consentError) {
      console.error('[onboarding/getOnboardingStatus] Consent check error:', consentError)
      return { success: false, error: 'Failed to check onboarding status' }
    }

    const hasConsent = (consentData?.length ?? 0) > 0

    // Check profile (must have at least full_name)
    const { data: profileData, error: profileError } = await supabase
      .from('patient_profiles')
      .select('id, full_name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)

    if (profileError) {
      console.error('[onboarding/getOnboardingStatus] Profile check error:', profileError)
      return { success: false, error: 'Failed to check onboarding status' }
    }

    const firstProfile = profileData?.[0]
    const hasProfile = !!(firstProfile && (firstProfile as { full_name?: string | null }).full_name)

    return {
      success: true,
      data: {
        hasConsent,
        hasProfile,
        isComplete: hasConsent && hasProfile,
      },
    }
  } catch (err) {
    console.error('[onboarding/getOnboardingStatus] Unexpected error:', err)
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unexpected error',
    }
  }
}
