import { redirect } from 'next/navigation'

/**
 * Redirect /patient/funnels/{slug} → /patient/funnel/{slug}/intro
 *
 * This catch-all handles the common mistake of adding an 's' to the funnel path.
 * The correct paths are:
 * - /patient/funnels → Funnel catalog
 * - /patient/funnel/{slug} → Individual funnel runner
 */
export default async function FunnelSlugRedirect({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  redirect(`/patient/funnel/${slug}/intro`)
}
