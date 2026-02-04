/**
 * E76.6: Patient Diagnosis Run Detail Page
 * 
 * Shows detailed view of a single diagnosis run with artifact JSON viewer.
 * Feature-gated behind DIAGNOSIS_PATIENT_ENABLED.
 */

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { isFeatureEnabled } from '@/lib/featureFlags'
import DiagnosisDetailClient from './client'

export const dynamic = 'force-dynamic'

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function PatientDiagnosisDetailPage({ params }: PageProps) {
  // Feature flag check
  const diagnosisPatientEnabled = isFeatureEnabled('DIAGNOSIS_PATIENT_ENABLED')
  if (!diagnosisPatientEnabled) {
    redirect('/patient/dashboard')
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

  const { id } = await params

  return <DiagnosisDetailClient runId={id} />
}
