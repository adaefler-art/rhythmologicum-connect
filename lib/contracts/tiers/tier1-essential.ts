/**
 * Tier 1 Essential Program Configuration
 * 
 * This is the baseline tier focusing on initial stress and resilience assessment.
 * Aligned with v0.5 stress/resilience flows.
 * 
 * **Patient Journey**:
 * - Initial stress assessment (stress-assessment funnel v1.0.0)
 * - Baseline data collection
 * - Limited touchpoints (self-assessment focused)
 * 
 * **Active Pillars**:
 * - Mental Health & Stress Management (primary focus)
 * 
 * **Future Extensions** (V05):
 * - Triage workflow integration
 * - Nurse touchpoint scheduling
 * - Patient settings/preferences
 */

import { PROGRAM_TIER, PILLAR_KEY, FUNNEL_SLUG } from '../registry'
import type { ProgramTierContract } from '../programTier'

/**
 * Tier 1 Essential Contract
 * 
 * Focus: Basic stress/resilience assessment with minimal touchpoints
 */
export const TIER_1_ESSENTIAL: ProgramTierContract = {
  tier: PROGRAM_TIER.TIER_1_ESSENTIAL,
  version: '1.0.0',
  name: 'Essential',
  description: 'Baseline stress and resilience assessment with self-service focus',
  
  pillars: [
    {
      key: PILLAR_KEY.NUTRITION,
      active: false,
      priority: 1,
    },
    {
      key: PILLAR_KEY.MOVEMENT,
      active: false,
      priority: 2,
    },
    {
      key: PILLAR_KEY.SLEEP,
      active: false,
      priority: 3,
    },
    {
      key: PILLAR_KEY.MENTAL_HEALTH,
      active: true, // Primary focus for Tier 1
      priority: 4,
    },
    {
      key: PILLAR_KEY.SOCIAL,
      active: false,
      priority: 5,
    },
    {
      key: PILLAR_KEY.MEANING,
      active: false,
      priority: 6,
    },
    {
      key: PILLAR_KEY.PREVENTION,
      active: false,
      priority: 7,
    },
  ],
  
  funnels: [
    {
      slug: FUNNEL_SLUG.STRESS_ASSESSMENT,
      version: '1.0.0', // v0.5 stress funnel
      recommended: true,
      priority: 1,
    },
  ],
  
  schedule: [
    {
      type: 'self_assessment' as const,
      label: 'Initial Stress Assessment',
      dayOffset: 0,
      metadata: {
        funnelSlug: FUNNEL_SLUG.STRESS_ASSESSMENT,
        description: 'Baseline stress and resilience assessment',
      },
    },
  ],
  
  metadata: {
    targetDuration: 'Single session',
    estimatedTimeMinutes: 10,
    supportLevel: 'Self-service',
    notes: 'Tier 1 focuses on initial data collection with minimal clinical touchpoints',
  },
}
