/**
 * Feature Flags Configuration
 * 
 * Centralized feature flag management for the application.
 * Flags can be controlled via environment variables (NEXT_PUBLIC_FEATURE_*).
 * 
 * Environment variables:
 * - NEXT_PUBLIC_FEATURE_AMY_ENABLED: Enable/disable AMY AI assistant (default: true)
 * - NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED: Enable/disable clinician dashboard (default: true)
 * - NEXT_PUBLIC_FEATURE_CHARTS_ENABLED: Enable/disable charts in clinician views (default: true)
 */

export type FeatureFlags = {
  AMY_ENABLED: boolean
  CLINICIAN_DASHBOARD_ENABLED: boolean
  CHARTS_ENABLED: boolean
}

/**
 * Parse environment variable to boolean
 * Supports: 'true', '1', 'yes' (case-insensitive) = true
 * Everything else or undefined = uses default value
 */
function parseEnvBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined) {
    return defaultValue
  }
  const normalized = value.toLowerCase().trim()
  return normalized === 'true' || normalized === '1' || normalized === 'yes'
}

/**
 * Feature flags configuration
 * All flags default to true to maintain backward compatibility
 */
export const featureFlags: FeatureFlags = {
  AMY_ENABLED: parseEnvBoolean(
    process.env.NEXT_PUBLIC_FEATURE_AMY_ENABLED,
    true
  ),
  CLINICIAN_DASHBOARD_ENABLED: parseEnvBoolean(
    process.env.NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED,
    true
  ),
  CHARTS_ENABLED: parseEnvBoolean(
    process.env.NEXT_PUBLIC_FEATURE_CHARTS_ENABLED,
    true
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
