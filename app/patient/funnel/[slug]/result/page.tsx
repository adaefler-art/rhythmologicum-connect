import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { FUNNEL_SLUG_ALIASES, getCanonicalFunnelSlug } from '@/lib/contracts/registry'
import {
  getReportsForAssessment,
  getKeyOutcomesForAssessment,
} from '@/lib/db/queries/reports'
import ResultClient from './client'

function getFunnelSlugCandidates(slug: string): string[] {
  const normalized = slug.toLowerCase().trim()
  const canonical = getCanonicalFunnelSlug(normalized)
  const legacySlugsForCanonical = Object.entries(FUNNEL_SLUG_ALIASES)
    .filter(([, canonicalSlug]) => canonicalSlug === canonical)
    .map(([legacySlug]) => legacySlug)

  return Array.from(new Set([normalized, canonical, ...legacySlugsForCanonical]))
}

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
    redirect('/')
  }

  // Verify assessment ownership
  const { data: patientProfile } = await supabase
    .from('patient_profiles')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!patientProfile) {
    redirect('/')
  }

  const funnelCandidates = getFunnelSlugCandidates(slug)

  const { data: assessment } = await supabase
    .from('assessments')
    .select('id, patient_id, funnel, status, completed_at')
    .eq('id', assessmentId)
    .in('funnel', funnelCandidates)
    .single()

  if (!assessment || assessment.patient_id !== patientProfile.id) {
    redirect(`/patient/funnel/${slug}?error=invalid_assessment`)
  }

  // If assessment is not completed, redirect back to funnel
  if (assessment.status !== 'completed') {
    redirect(`/patient/funnel/${slug}`)
  }

  // Fetch reports and key outcomes for this assessment
  const { data: reports } = await getReportsForAssessment(assessmentId)
  const { data: keyOutcomes } = await getKeyOutcomesForAssessment(assessmentId)

  // Render result client with reports data
  return (
    <ResultClient
      slug={slug}
      assessmentId={assessmentId}
      reports={reports || []}
      keyOutcomes={keyOutcomes}
    />
  )
}
