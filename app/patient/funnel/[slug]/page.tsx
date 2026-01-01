import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import FunnelClient from './client'
import { getContentPage } from '@/lib/utils/contentResolver'

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function FunnelPage({ params, searchParams }: PageProps) {
  const { slug } = await params
  const search = await searchParams
  const skipIntro = search.skipIntro === 'true'

  // Create Supabase server client (canonical)
  const supabase = await createServerSupabaseClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Check for intro page (F6 - Intro-Page Integration)
  // Only redirect to intro if:
  // 1. skipIntro is not set
  // 2. An intro page exists for this funnel
  if (!skipIntro) {
    try {
      const introResult = await getContentPage({
        funnel: slug,
        category: 'intro',
        includeDrafts: false,
      })

      if (introResult.page) {
        // Intro page exists, redirect to intro route
        redirect(`/patient/funnel/${slug}/intro`)
      }
    } catch (error) {
      // If intro check fails, continue to assessment
      console.warn('Failed to check for intro page:', error)
    }
  }

  // Render client component with slug
  return <FunnelClient slug={slug} />
}
