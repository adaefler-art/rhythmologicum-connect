import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { enforceDashboardFirst } from '@/lib/utils/dashboardFirstPolicy'
import AnamneseDetailClient from './client'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

/**
 * E75.3: Patient Record Entry Detail Page
 * 
 * Patient can view entry details, version history, edit, and archive.
 * Enforces dashboard-first policy.
 * 
 * Route: /patient/anamnese-timeline/[entryId]/detail
 */
export default async function AnamneseDetailPage({
  params,
}: {
  params: Promise<{ entryId: string }>
}) {
  const { entryId } = await params
  
  // Create Supabase server client
  const supabase = await createServerSupabaseClient()

  // Check authentication FIRST
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Enforce dashboard-first policy
  const redirectUrl = await enforceDashboardFirst(`/patient/anamnese-timeline/${entryId}/detail`)
  
  if (redirectUrl) {
    redirect(redirectUrl)
  }

  return <AnamneseDetailClient entryId={entryId} />
}
