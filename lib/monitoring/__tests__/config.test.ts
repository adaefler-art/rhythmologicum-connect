/**
 * Tests for usage telemetry configuration
 * TV05_02: Verify toggle behavior (dev ON, prod OFF, override)
 */

import { isUsageTelemetryEnabled } from '../config'
import { env } from '@/lib/env'

describe('usageTracker config', () => {
  const originalNodeEnv = env.NODE_ENV
  const originalTelemetrySetting = env.USAGE_TELEMETRY_ENABLED

  afterEach(() => {
    // Restore original values
    env.NODE_ENV = originalNodeEnv
    env.USAGE_TELEMETRY_ENABLED = originalTelemetrySetting
  })

  describe('isUsageTelemetryEnabled', () => {
    describe('default behavior (no explicit override)', () => {
      beforeEach(() => {
        env.USAGE_TELEMETRY_ENABLED = undefined
      })

      it('returns true in development environment', () => {
        env.NODE_ENV = 'development'
        expect(isUsageTelemetryEnabled()).toBe(true)
      })

      it('returns false in production environment', () => {
        env.NODE_ENV = 'production'
        expect(isUsageTelemetryEnabled()).toBe(false)
      })

      it('returns false in test environment', () => {
        env.NODE_ENV = 'test'
        expect(isUsageTelemetryEnabled()).toBe(false)
      })

      it('defaults to development (true) when NODE_ENV is undefined', () => {
        env.NODE_ENV = undefined
        expect(isUsageTelemetryEnabled()).toBe(true)
      })
    })

    describe('explicit override with USAGE_TELEMETRY_ENABLED', () => {
      it('returns true when explicitly set to "true"', () => {
        env.USAGE_TELEMETRY_ENABLED = 'true'
        env.NODE_ENV = 'production'
        expect(isUsageTelemetryEnabled()).toBe(true)
      })

      it('returns true when explicitly set to "1"', () => {
        env.USAGE_TELEMETRY_ENABLED = '1'
        env.NODE_ENV = 'production'
        expect(isUsageTelemetryEnabled()).toBe(true)
      })

      it('returns true when explicitly set to "yes"', () => {
        env.USAGE_TELEMETRY_ENABLED = 'yes'
        env.NODE_ENV = 'production'
        expect(isUsageTelemetryEnabled()).toBe(true)
      })

      it('returns true when set to "TRUE" (case-insensitive)', () => {
        env.USAGE_TELEMETRY_ENABLED = 'TRUE'
        env.NODE_ENV = 'production'
        expect(isUsageTelemetryEnabled()).toBe(true)
      })

      it('returns true when set to "Yes" (case-insensitive)', () => {
        env.USAGE_TELEMETRY_ENABLED = 'Yes'
        env.NODE_ENV = 'production'
        expect(isUsageTelemetryEnabled()).toBe(true)
      })

      it('returns false when explicitly set to "false"', () => {
        env.USAGE_TELEMETRY_ENABLED = 'false'
        env.NODE_ENV = 'development'
        expect(isUsageTelemetryEnabled()).toBe(false)
      })

      it('returns false when explicitly set to "0"', () => {
        env.USAGE_TELEMETRY_ENABLED = '0'
        env.NODE_ENV = 'development'
        expect(isUsageTelemetryEnabled()).toBe(false)
      })

      it('returns false when explicitly set to "no"', () => {
        env.USAGE_TELEMETRY_ENABLED = 'no'
        env.NODE_ENV = 'development'
        expect(isUsageTelemetryEnabled()).toBe(false)
      })

      it('returns false when set to "FALSE" (case-insensitive)', () => {
        env.USAGE_TELEMETRY_ENABLED = 'FALSE'
        env.NODE_ENV = 'development'
        expect(isUsageTelemetryEnabled()).toBe(false)
      })

      it('handles whitespace in override value', () => {
        env.USAGE_TELEMETRY_ENABLED = '  true  '
        env.NODE_ENV = 'production'
        expect(isUsageTelemetryEnabled()).toBe(true)

        env.USAGE_TELEMETRY_ENABLED = '  false  '
        env.NODE_ENV = 'development'
        expect(isUsageTelemetryEnabled()).toBe(false)
      })

      it('treats invalid values as false', () => {
        env.USAGE_TELEMETRY_ENABLED = 'invalid'
        env.NODE_ENV = 'development'
        expect(isUsageTelemetryEnabled()).toBe(false)
      })

      it('treats empty string as using default', () => {
        env.USAGE_TELEMETRY_ENABLED = ''
        env.NODE_ENV = 'development'
        expect(isUsageTelemetryEnabled()).toBe(true)

        env.USAGE_TELEMETRY_ENABLED = ''
        env.NODE_ENV = 'production'
        expect(isUsageTelemetryEnabled()).toBe(false)
      })
    })

    describe('explicit override takes precedence over environment', () => {
      it('enables telemetry in production when explicitly set to true', () => {
        env.USAGE_TELEMETRY_ENABLED = 'true'
        env.NODE_ENV = 'production'
        expect(isUsageTelemetryEnabled()).toBe(true)
      })

      it('disables telemetry in development when explicitly set to false', () => {
        env.USAGE_TELEMETRY_ENABLED = 'false'
        env.NODE_ENV = 'development'
        expect(isUsageTelemetryEnabled()).toBe(false)
      })
    })
  })
})
