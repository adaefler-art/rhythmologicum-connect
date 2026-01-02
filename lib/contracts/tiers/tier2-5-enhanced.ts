/**
 * Tier 2.5 Enhanced Program Configuration (Placeholder)
 * 
 * This tier adds nurse touchpoints and regular check-ins beyond the basic assessment.
 * 
 * **Patient Journey** (Future V05):
 * - Extended stress/resilience monitoring
 * - Regular nurse check-ins
 * - Progress tracking
 * - Additional pillar assessments as needed
 * 
 * **Active Pillars** (Planned):
 * - Mental Health & Stress Management
 * - Sleep (if indicated)
 * - Additional pillars based on triage
 * 
 * **Future Extensions** (V05):
 * - Nurse scheduling integration
 * - Progress monitoring dashboard
 * - Adaptive pillar activation based on triage
 */

import { PROGRAM_TIER, PILLAR_KEY, FUNNEL_SLUG } from '../registry'
import type { ProgramTierContract } from '../programTier'

/**
 * Tier 2.5 Enhanced Contract (Placeholder)
 * 
 * Focus: Regular monitoring with nurse touchpoints
 * Status: Placeholder for future V05 implementation
 */
export const TIER_2_5_ENHANCED: ProgramTierContract = {
  tier: PROGRAM_TIER.TIER_2_5_ENHANCED,
  version: '0.1.0', // Placeholder version
  name: 'Enhanced',
  description: 'Extended monitoring with regular nurse touchpoints and progress tracking',
  
  pillars: [
    {
      key: PILLAR_KEY.NUTRITION,
      active: false, // To be activated based on triage
      priority: 1,
    },
    {
      key: PILLAR_KEY.MOVEMENT,
      active: false, // To be activated based on triage
      priority: 2,
    },
    {
      key: PILLAR_KEY.SLEEP,
      active: true, // Often co-occurs with stress issues
      priority: 3,
    },
    {
      key: PILLAR_KEY.MENTAL_HEALTH,
      active: true, // Core pillar
      priority: 4,
    },
    {
      key: PILLAR_KEY.SOCIAL,
      active: false, // To be activated based on triage
      priority: 5,
    },
    {
      key: PILLAR_KEY.MEANING,
      active: false, // To be activated based on triage
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
      version: '>=1.0.0',
      recommended: true,
      priority: 1,
    },
    {
      slug: FUNNEL_SLUG.SLEEP_QUALITY,
      version: '>=1.0.0',
      recommended: true,
      priority: 2,
    },
  ],
  
  schedule: [
    {
      type: 'self_assessment' as const,
      label: 'Initial Stress Assessment',
      dayOffset: 0,
      metadata: {
        funnelSlug: FUNNEL_SLUG.STRESS_ASSESSMENT,
      },
    },
    {
      type: 'nurse_visit' as const,
      label: 'Nurse Check-in Week 1',
      dayOffset: 7,
      metadata: {
        description: 'Review initial assessment, discuss findings',
      },
    },
    {
      type: 'self_assessment' as const,
      label: 'Follow-up Assessment',
      dayOffset: 14,
      metadata: {
        description: 'Progress tracking',
      },
    },
    {
      type: 'nurse_visit' as const,
      label: 'Nurse Check-in Week 3',
      dayOffset: 21,
      metadata: {
        description: 'Review progress, adjust care plan',
      },
    },
  ],
  
  metadata: {
    targetDuration: '4-6 weeks',
    estimatedTimeMinutes: 30,
    supportLevel: 'Nurse-supported',
    notes: 'Placeholder for V05 implementation - requires nurse scheduling and triage workflow',
  },
}
