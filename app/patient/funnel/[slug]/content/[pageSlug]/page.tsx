import { redirect } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import ContentPageClient from './client'

type PageProps = {
  params: Promise<{ slug: string; pageSlug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function ContentPage({ params }: PageProps) {
  const { slug, pageSlug } = await params

  // Create Supabase server client (canonical)
  const supabase = await createServerSupabaseClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Render client component with slugs
  return <ContentPageClient funnelSlug={slug} pageSlug={pageSlug} />
}
