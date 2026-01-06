/**
 * Patient Support Page - V05-I08.4
 * 
 * Allows patients to view their support cases and create new ones
 */

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { SupportCaseList } from './SupportCaseList'

export default async function PatientSupportPage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/?error=authentication_required')
  }

  // Get patient profile
  const { data: profile } = await supabase
    .from('patient_profiles')
    .select('id, full_name')
    .eq('user_id', user.id)
    .single()

  if (!profile) {
    redirect('/?error=no_profile')
  }

  return <SupportCaseList patientId={profile.id} patientName={profile.full_name} />
}
