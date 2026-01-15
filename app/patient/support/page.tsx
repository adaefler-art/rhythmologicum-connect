/**
 * Patient Support Page - V05-I08.4, E6.5.1
 * 
 * Allows patients to view their support cases and create new ones
 * Enforces dashboard-first policy
 */

import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { enforceDashboardFirst } from '@/lib/utils/dashboardFirstPolicy'
import { SupportCaseList } from './SupportCaseList'

export const dynamic = 'force-dynamic'

export default async function PatientSupportPage() {
  const supabase = await createServerSupabaseClient()

  // E6.5.1 AC3: Check authentication FIRST (401-first, no DB calls before auth)
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    redirect('/?error=authentication_required')
  }

  // E6.5.1 AC2: Enforce dashboard-first policy
  const redirectUrl = await enforceDashboardFirst('/patient/support')
  
  if (redirectUrl) {
    redirect(redirectUrl)
  }

  // Get patient profile (after auth and policy checks)
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
