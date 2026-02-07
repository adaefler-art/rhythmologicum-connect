import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/lib/types/supabase'
import { isValidUUID } from '@/lib/validators/uuid'

export type PatientIdResolution = {
  patientProfileId: string | null
  patientUserId: string | null
  source: 'profile_id' | 'user_id' | 'lookup_failed'
}

export async function resolvePatientIds(
  supabase: SupabaseClient<Database>,
  patientIdParam: string,
): Promise<PatientIdResolution> {
  if (!isValidUUID(patientIdParam)) {
    return {
      patientProfileId: null,
      patientUserId: null,
      source: 'lookup_failed',
    }
  }

  const { data: profileById, error: profileError } = await supabase
    .from('patient_profiles')
    .select('id, user_id')
    .eq('id', patientIdParam)
    .maybeSingle()

  if (profileError) {
    console.error('[resolvePatientIds] Failed to lookup patient profile by id:', profileError)
  }

  if (profileById?.id && profileById.user_id) {
    return {
      patientProfileId: profileById.id,
      patientUserId: profileById.user_id,
      source: 'profile_id',
    }
  }

  const { data: profileByUserId, error: userIdError } = await supabase
    .from('patient_profiles')
    .select('id, user_id')
    .eq('user_id', patientIdParam)
    .maybeSingle()

  if (userIdError) {
    console.error('[resolvePatientIds] Failed to lookup patient profile by user_id:', userIdError)
  }

  if (profileByUserId?.id && profileByUserId.user_id) {
    return {
      patientProfileId: profileByUserId.id,
      patientUserId: profileByUserId.user_id,
      source: 'user_id',
    }
  }

  return {
    patientProfileId: null,
    patientUserId: null,
    source: 'lookup_failed',
  }
}
