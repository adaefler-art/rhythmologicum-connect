/**
 * Required Funnel Definitions
 *
 * These slugs must exist in production with valid catalog and version data.
 * Keep this list minimal and aligned with patient-reachable funnels.
 */

import { FUNNEL_SLUG } from '@/lib/contracts/registry'

export const REQUIRED_FUNNEL_SLUGS = [
  FUNNEL_SLUG.STRESS_ASSESSMENT,
  FUNNEL_SLUG.CARDIOVASCULAR_AGE,
  FUNNEL_SLUG.SLEEP_QUALITY,
] as const

export type RequiredFunnelSlug = typeof REQUIRED_FUNNEL_SLUGS[number]
