/**
 * E75.2: Anamnesis Entry Helper Functions
 * 
 * Common database operations for anamnesis entries
 */

import { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/supabase'

type SupabaseClientType = SupabaseClient<Database>

/**
 * Gets patient profile ID from user ID
 * 
 * @param supabase - Supabase client
 * @param userId - User ID
 * @returns Patient profile ID or null
 */
export async function getPatientProfileId(
  supabase: SupabaseClientType,
  userId: string
): Promise<string | null> {
  const { data: profile, error } = await supabase
    .from('patient_profiles')
    .select('id')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) {
    console.error('[anamnesis-helpers] Error fetching patient profile:', error)
    return null
  }

  return profile?.id || null
}

/**
 * Gets organization ID for a patient
 * 
 * @param supabase - Supabase client
 * @param patientId - Patient profile ID
 * @returns Organization ID or null
 */
export async function getPatientOrganizationId(
  supabase: SupabaseClientType,
  patientId: string
): Promise<string | null> {
  const { data: profile, error } = await supabase
    .from('patient_profiles')
    .select('organization_id')
    .eq('id', patientId)
    .maybeSingle()

  if (error) {
    console.error('[anamnesis-helpers] Error fetching patient organization:', error)
    return null
  }

  return profile?.organization_id || null
}

/**
 * Checks if an anamnesis entry exists and is accessible to the user
 * 
 * @param supabase - Supabase client
 * @param entryId - Entry ID
 * @returns Entry data or null
 */
export async function getAnamnesisEntry(supabase: SupabaseClientType, entryId: string) {
  const { data: entry, error } = await supabase
    .from('anamnesis_entries')
    .select('*')
    .eq('id', entryId)
    .maybeSingle()

  if (error) {
    console.error('[anamnesis-helpers] Error fetching entry:', error)
    return null
  }

  return entry
}

/**
 * Gets all versions for an anamnesis entry
 * 
 * @param supabase - Supabase client
 * @param entryId - Entry ID
 * @returns Array of versions (latest first)
 */
export async function getEntryVersions(supabase: SupabaseClientType, entryId: string) {
  const { data: versions, error } = await supabase
    .from('anamnesis_entry_versions')
    .select('*')
    .eq('entry_id', entryId)
    .order('version_number', { ascending: false })

  if (error) {
    console.error('[anamnesis-helpers] Error fetching versions:', error)
    return []
  }

  return versions || []
}

/**
 * Checks if a clinician has access to a patient
 * 
 * @param supabase - Supabase client
 * @param clinicianUserId - Clinician user ID
 * @param patientProfileId - Patient profile ID
 * @returns true if clinician has access
 */
export async function hasClinicianAccessToPatient(
  supabase: SupabaseClientType,
  clinicianUserId: string,
  patientProfileId: string
): Promise<boolean> {
  const { data: assignment, error } = await supabase
    .from('clinician_patient_assignments')
    .select('id')
    .eq('clinician_user_id', clinicianUserId)
    .eq('patient_user_id', patientProfileId)
    .maybeSingle()

  if (error) {
    console.error('[anamnesis-helpers] Error checking clinician access:', error)
    return false
  }

  return !!assignment
}
