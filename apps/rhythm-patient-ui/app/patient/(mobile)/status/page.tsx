import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { enforceDashboardFirst } from '@/lib/utils/dashboardFirstPolicy'
import PatientStatusClient from './client'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

export default async function PatientStatusPage() {
  const supabase = await createServerSupabaseClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  const redirectUrl = await enforceDashboardFirst('/patient/status')
  if (redirectUrl) {
    redirect(redirectUrl)
  }

  return <PatientStatusClient />
}