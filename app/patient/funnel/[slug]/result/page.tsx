import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import ResultClient from './client'

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ assessmentId?: string }>
}

export default async function FunnelResultPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const search = await searchParams
  const assessmentId = search.assessmentId

  // Validate assessmentId parameter
  if (!assessmentId) {
    redirect(`/patient/funnel/${slug}?error=missing_assessment_id`)
  }

  // Create Supabase server client (canonical)
  const supabase = await createServerSupabaseClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Verify assessment ownership
  const { data: patientProfile } = await supabase
    .from('patient_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!patientProfile) {
    redirect('/login')
  }

  const { data: assessment } = await supabase
    .from('assessments')
    .select('id, patient_id, funnel, status, completed_at')
    .eq('id', assessmentId)
    .eq('funnel', slug)
    .single()

  if (!assessment || assessment.patient_id !== patientProfile.id) {
    redirect(`/patient/funnel/${slug}?error=invalid_assessment`)
  }

  // If assessment is not completed, redirect back to funnel
  if (assessment.status !== 'completed') {
    redirect(`/patient/funnel/${slug}`)
  }

  // Render result client
  return <ResultClient slug={slug} assessmentId={assessmentId} />
}
