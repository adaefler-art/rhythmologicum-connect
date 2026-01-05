import { redirect, notFound } from 'next/navigation'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import ContentPageClient from './client'
import { loadFunnelVersion, FunnelNotFoundError, ManifestValidationError } from '@/lib/funnels/loadFunnelVersion'

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

  // V05-I06.5: Load funnel version manifest (server-side)
  // Fail-closed behavior for missing/invalid manifests
  try {
    const funnelVersion = await loadFunnelVersion(slug)
    
    // Check if requested page exists in manifest
    const requestedPage = funnelVersion.manifest.content_manifest.pages.find(
      (p) => p.slug === pageSlug
    )

    if (!requestedPage) {
      // 404: Page not found in manifest
      console.error(`[CONTENT_PAGE] Page ${pageSlug} not found in funnel ${slug} manifest`)
      notFound()
    }

    // Render client component with slug and manifest
    return (
      <ContentPageClient 
        funnelSlug={slug} 
        pageSlug={pageSlug}
        contentManifest={funnelVersion.manifest.content_manifest}
        manifestError={null}
      />
    )
  } catch (error) {
    if (error instanceof FunnelNotFoundError) {
      // 404: Funnel not found
      console.error(`[CONTENT_PAGE] Funnel not found: ${slug}`)
      notFound()
    } else if (error instanceof ManifestValidationError) {
      // 422: Invalid manifest
      console.error(`[CONTENT_PAGE] Manifest validation failed for ${slug}:`, error.message)
      return (
        <ContentPageClient 
          funnelSlug={slug} 
          pageSlug={pageSlug}
          contentManifest={null}
          manifestError="Manifest-Validierung fehlgeschlagen: Ungültige Konfiguration"
        />
      )
    } else {
      // 500: Unexpected error - re-throw to trigger error boundary
      console.error(`[CONTENT_PAGE] Unexpected error loading funnel ${slug}:`, error)
      throw error
    }
  }
}
