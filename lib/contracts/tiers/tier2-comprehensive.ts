/**
 * Tier 2 Comprehensive Program Configuration (Placeholder)
 * 
 * This is the full program with intensive support across multiple pillars.
 * 
 * **Patient Journey** (Future V05):
 * - Comprehensive multi-pillar assessment
 * - Frequent clinician and nurse touchpoints
 * - Personalized care plans
 * - Progress monitoring across all active pillars
 * 
 * **Active Pillars** (Planned):
 * - All 7 pillars available based on patient needs
 * - Adaptive activation based on triage and clinician judgment
 * 
 * **Future Extensions** (V05):
 * - Clinician review workflow
 * - Multi-pillar care coordination
 * - Advanced scheduling and touchpoint management
 * - Personalized intervention pathways
 */

import { PROGRAM_TIER, PILLAR_KEY, FUNNEL_SLUG } from '../registry'
import type { ProgramTierContract } from '../programTier'

/**
 * Tier 2 Comprehensive Contract (Placeholder)
 * 
 * Focus: Comprehensive care with intensive clinical support
 * Status: Placeholder for future V05 implementation
 */
export const TIER_2_COMPREHENSIVE: ProgramTierContract = {
  tier: PROGRAM_TIER.TIER_2_COMPREHENSIVE,
  version: '0.1.0', // Placeholder version
  name: 'Comprehensive',
  description: 'Full program with intensive support across multiple health pillars',
  
  pillars: [
    {
      key: PILLAR_KEY.NUTRITION,
      active: true,
      priority: 1,
    },
    {
      key: PILLAR_KEY.MOVEMENT,
      active: true,
      priority: 2,
    },
    {
      key: PILLAR_KEY.SLEEP,
      active: true,
      priority: 3,
    },
    {
      key: PILLAR_KEY.MENTAL_HEALTH,
      active: true,
      priority: 4,
    },
    {
      key: PILLAR_KEY.SOCIAL,
      active: true,
      priority: 5,
    },
    {
      key: PILLAR_KEY.MEANING,
      active: true,
      priority: 6,
    },
    {
      key: PILLAR_KEY.PREVENTION,
      active: true,
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
    {
      slug: FUNNEL_SLUG.CARDIOVASCULAR_AGE,
      version: '>=1.0.0',
      recommended: true,
      priority: 3,
    },
    {
      slug: FUNNEL_SLUG.HEART_HEALTH_NUTRITION,
      version: '>=1.0.0',
      recommended: true,
      priority: 4,
    },
  ],
  
  schedule: [
    {
      type: 'self_assessment' as const,
      label: 'Initial Comprehensive Assessment',
      dayOffset: 0,
      metadata: {
        description: 'Multi-pillar baseline assessment',
      },
    },
    {
      type: 'clinician_review' as const,
      label: 'Clinician Initial Review',
      dayOffset: 1,
      metadata: {
        description: 'Review all assessments, create care plan',
      },
    },
    {
      type: 'nurse_visit' as const,
      label: 'Nurse Orientation',
      dayOffset: 3,
      metadata: {
        description: 'Explain care plan, set goals',
      },
    },
    {
      type: 'call' as const,
      label: 'Week 1 Check-in Call',
      dayOffset: 7,
      metadata: {
        description: 'Progress check, answer questions',
      },
    },
    {
      type: 'self_assessment' as const,
      label: 'Week 2 Progress Assessment',
      dayOffset: 14,
      metadata: {
        description: 'Track progress across pillars',
      },
    },
    {
      type: 'nurse_visit' as const,
      label: 'Week 2 Nurse Visit',
      dayOffset: 15,
      metadata: {
        description: 'Review progress, adjust interventions',
      },
    },
    {
      type: 'clinician_review' as const,
      label: 'Week 3 Clinician Review',
      dayOffset: 21,
      metadata: {
        description: 'Comprehensive progress review',
      },
    },
    {
      type: 'call' as const,
      label: 'Week 4 Check-in Call',
      dayOffset: 28,
      metadata: {
        description: 'Ongoing support and monitoring',
      },
    },
  ],
  
  metadata: {
    targetDuration: '8-12 weeks',
    estimatedTimeMinutes: 60,
    supportLevel: 'Intensive clinical support',
    notes: 'Placeholder for V05 implementation - requires full clinician workflow, scheduling, and care coordination',
  },
}
