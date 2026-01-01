import { redirect } from 'next/navigation'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import IntroPageClient from './client'
import { loadFunnelVersion, FunnelNotFoundError, ManifestValidationError } from '@/lib/funnels/loadFunnelVersion'

type PageProps = {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}

export default async function IntroPage({ params }: PageProps) {
  const { slug } = await params

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

  // Load funnel version manifest (server-side)
  let manifestData = null
  let manifestError = null

  try {
    const funnelVersion = await loadFunnelVersion(slug)
    manifestData = {
      version: funnelVersion.version,
      funnelId: funnelVersion.funnelId,
      algorithmVersion: funnelVersion.manifest.algorithm_bundle_version,
      promptVersion: funnelVersion.manifest.prompt_version,
      steps: funnelVersion.manifest.questionnaire_config.steps,
      contentPages: funnelVersion.manifest.content_manifest.pages,
    }
  } catch (error) {
    if (error instanceof FunnelNotFoundError) {
      manifestError = `Funnel nicht gefunden: ${slug}`
    } else if (error instanceof ManifestValidationError) {
      manifestError = 'Manifest-Validierung fehlgeschlagen: Ungültige Konfiguration'
      console.error('Manifest validation failed:', error.message)
    } else {
      manifestError = 'Fehler beim Laden der Funnel-Konfiguration'
      console.error('Error loading funnel version:', error)
    }
  }

  // Render client component with slug and manifest data
  return <IntroPageClient funnelSlug={slug} manifestData={manifestData} manifestError={manifestError} />
}
