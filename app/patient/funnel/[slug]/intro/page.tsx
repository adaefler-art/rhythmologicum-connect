import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import IntroPageClient from './client'
import {
  loadFunnelVersionWithClient,
  FunnelNotFoundError,
  FunnelVersionNotFoundError,
  ManifestValidationError,
} from '@/lib/funnels/loadFunnelVersion'
import type {
  ContentPage as ManifestContentPage,
  FunnelContentManifest,
  QuestionnaireStep,
} from '@/lib/contracts/funnelManifest'

type ManifestData = {
  version: string
  funnelId: string
  algorithmVersion: string
  promptVersion: string
  steps: QuestionnaireStep[]
  contentPages: ManifestContentPage[]
  contentManifest: FunnelContentManifest
}

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function IntroPage({ params }: PageProps) {
  const { slug } = await params

  // Create Supabase server client (canonical)
  const supabase = await createServerSupabaseClient()

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/')
  }

  // Load funnel version manifest (server-side)
  // V05-I06.5: Fail-closed behavior for missing/invalid manifests
  let manifestData: ManifestData | null = null
  let manifestError: string | null = null

  try {
    const funnelVersion = await loadFunnelVersionWithClient(supabase, slug)

    manifestData = {
      version: funnelVersion.version,
      funnelId: funnelVersion.funnelId,
      algorithmVersion: funnelVersion.manifest.algorithm_bundle_version,
      promptVersion: funnelVersion.manifest.prompt_version,
      steps: funnelVersion.manifest.questionnaire_config.steps,
      contentPages: funnelVersion.manifest.content_manifest.pages,
      contentManifest: funnelVersion.manifest.content_manifest,
    }
  } catch (error) {
    if (error instanceof FunnelNotFoundError) {
      // 404: Funnel not found
      console.error(`[INTRO_PAGE] Funnel not found: ${slug}`)
      notFound()
    } else if (error instanceof FunnelVersionNotFoundError) {
      // No effective version resolved (empty-state)
      console.error(`[INTRO_PAGE] No effective funnel version resolved for ${slug} (falling back to legacy intro)`)
      manifestData = null
      manifestError = null
    } else if (error instanceof ManifestValidationError) {
      // Manifest invalid/missing: allow legacy intro fallback.
      // Intro content is optional and should not hard-block access.
      console.error(`[INTRO_PAGE] Manifest validation failed for ${slug} (falling back to legacy intro):`, error.message)
      manifestData = null
      manifestError = null
    } else {
      // 500: Unexpected error - re-throw to trigger error boundary
      console.error(`[INTRO_PAGE] Unexpected error loading funnel ${slug}:`, error)
      throw error
    }
  }

  return <IntroPageClient funnelSlug={slug} manifestData={manifestData} manifestError={manifestError} />
}
