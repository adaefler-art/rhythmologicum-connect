import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
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

  // Create Supabase server client
  const cookieStore = await cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    },
  )

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
