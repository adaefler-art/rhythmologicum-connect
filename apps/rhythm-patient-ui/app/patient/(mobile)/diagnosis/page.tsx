/**
 * E76.6: Patient Diagnosis Runs List Page
 * 
 * Shows all diagnosis runs for the patient with status and timestamps.
 * Feature-gated behind DIAGNOSIS_PATIENT_ENABLED.
 */

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { isFeatureEnabled } from '@/lib/featureFlags'
import DiagnosisListClient from './client'

export const dynamic = 'force-dynamic'

export default async function PatientDiagnosisPage() {
  // Feature flag check
  const diagnosisPatientEnabled = isFeatureEnabled('DIAGNOSIS_PATIENT_ENABLED')
  if (!diagnosisPatientEnabled) {
    redirect('/patient/start')
  }

  // Check authentication
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/')
  }

  return <DiagnosisListClient />
}
