/**
 * Feature Flags Configuration
 * 
 * Centralized feature flag management for the application.
 * Flags can be controlled via environment variables (NEXT_PUBLIC_FEATURE_*).
 * 
 * Environment variables:
 * - NEXT_PUBLIC_FEATURE_AMY_ENABLED: Enable/disable AI assistant (default: true)
 * - NEXT_PUBLIC_FEATURE_AMY_CHAT_ENABLED: Enable/disable AI assistant chat widget (E73.8) (default: false)
 * - NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED: Enable/disable clinician dashboard (default: true)
 * - NEXT_PUBLIC_FEATURE_CHARTS_ENABLED: Enable/disable charts in clinician views (default: true)
 * - NEXT_PUBLIC_FEATURE_PROCESSING_RESULTS_ENABLED: Enable/disable processing results endpoint (default: false)
 * - NEXT_PUBLIC_FEATURE_MCP_ENABLED: Enable/disable MCP server integration (E76.1) (default: false)
 * - NEXT_PUBLIC_FEATURE_ANAMNESIS_EXPORT_ENABLED: Enable/disable anamnesis export endpoints (E75.6) (default: false)
 * - NEXT_PUBLIC_FEATURE_DIAGNOSIS_ENABLED: Enable/disable diagnosis execution worker (E76.4) (default: false)
 * - NEXT_PUBLIC_FEATURE_DIAGNOSIS_V1_ENABLED: Enable/disable diagnosis MCP flow (E76.x) (default: false)
 * - NEXT_PUBLIC_FEATURE_DIAGNOSIS_PROMPT_ENABLED: Enable/disable diagnosis prompt API (E76.5) (default: false)
 * - NEXT_PUBLIC_FEATURE_DIAGNOSIS_PATIENT_ENABLED: Enable/disable diagnosis patient UI (E76.6) (default: false)
 * 
 * Note: Variable names retain "AMY" prefix for backward compatibility with existing environments.
 * The actual assistant identity is configured in /lib/config/assistant.ts
 */

import { env } from '@/lib/env'
import { flagEnabled } from '@/lib/env/flags'

export type FeatureFlags = {
  AMY_ENABLED: boolean
  AMY_CHAT_ENABLED: boolean
  CLINICIAN_DASHBOARD_ENABLED: boolean
  CHARTS_ENABLED: boolean
  PROCESSING_RESULTS_ENABLED: boolean
  MCP_ENABLED: boolean
  ANAMNESIS_EXPORT_ENABLED: boolean
  DIAGNOSIS_ENABLED: boolean
  DIAGNOSIS_V1_ENABLED: boolean
  DIAGNOSIS_PROMPT_ENABLED: boolean
  DIAGNOSIS_PATIENT_ENABLED: boolean
}

function resolveFlag(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value.trim() === '') {
    return defaultValue
  }
  return flagEnabled(value)
}

/**
 * Feature flags configuration
 * All flags default to true to maintain backward compatibility
 */
export const featureFlags: FeatureFlags = {
  AMY_ENABLED: resolveFlag(env.NEXT_PUBLIC_FEATURE_AMY_ENABLED, true),
  AMY_CHAT_ENABLED: resolveFlag(env.NEXT_PUBLIC_FEATURE_AMY_CHAT_ENABLED, false),
  CLINICIAN_DASHBOARD_ENABLED: resolveFlag(
    env.NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED,
    true,
  ),
  CHARTS_ENABLED: resolveFlag(env.NEXT_PUBLIC_FEATURE_CHARTS_ENABLED, true),
  PROCESSING_RESULTS_ENABLED: resolveFlag(
    env.NEXT_PUBLIC_FEATURE_PROCESSING_RESULTS_ENABLED,
    false,
  ),
  MCP_ENABLED: resolveFlag(env.NEXT_PUBLIC_FEATURE_MCP_ENABLED, false),
  ANAMNESIS_EXPORT_ENABLED: resolveFlag(
    env.NEXT_PUBLIC_FEATURE_ANAMNESIS_EXPORT_ENABLED,
    false,
  ),
  DIAGNOSIS_ENABLED: resolveFlag(env.NEXT_PUBLIC_FEATURE_DIAGNOSIS_ENABLED, false),
  DIAGNOSIS_V1_ENABLED: resolveFlag(env.NEXT_PUBLIC_FEATURE_DIAGNOSIS_V1_ENABLED, false),
  DIAGNOSIS_PROMPT_ENABLED: resolveFlag(
    env.NEXT_PUBLIC_FEATURE_DIAGNOSIS_PROMPT_ENABLED,
    false,
  ),
  DIAGNOSIS_PATIENT_ENABLED: resolveFlag(
    env.NEXT_PUBLIC_FEATURE_DIAGNOSIS_PATIENT_ENABLED,
    false,
  ),
}

/**
 * Check if a specific feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return featureFlags[feature]
}

/**
 * Get all feature flags as an object (useful for debugging)
 */
export function getAllFeatureFlags(): FeatureFlags {
  return { ...featureFlags }
}
