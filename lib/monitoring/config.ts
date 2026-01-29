/**
 * TV05_02: Usage Telemetry Configuration
 * 
 * Provides configuration for runtime usage telemetry with environment-based defaults.
 * 
 * Default Behavior:
 * - Development: Telemetry ON (helps identify unused endpoints)
 * - Production/Preview: Telemetry OFF (avoids misleading data from ephemeral storage)
 * 
 * Override:
 * - Set USAGE_TELEMETRY_ENABLED=true to force enable
 * - Set USAGE_TELEMETRY_ENABLED=false to force disable
 */

import { env } from '@/lib/env'
import { flagEnabled } from '@/lib/env/flags'

/**
 * Determines if usage telemetry is enabled based on environment and explicit overrides.
 * 
 * Logic:
 * 1. If USAGE_TELEMETRY_ENABLED is explicitly set, use that value
 * 2. Otherwise, default to ON in development, OFF in production/preview
 * 
 * @returns true if telemetry should be enabled, false otherwise
 */
export function isUsageTelemetryEnabled(): boolean {
  const explicitSetting = env.USAGE_TELEMETRY_ENABLED

  // Explicit override takes precedence
  if (explicitSetting !== undefined && explicitSetting !== '') {
    return flagEnabled(explicitSetting)
  }

  // Default: ON in development, OFF in production/preview
  const nodeEnv = env.NODE_ENV || 'development'
  return nodeEnv === 'development'
}
