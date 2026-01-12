/**
 * Environment Variables Schema and Validation
 * 
 * This file provides type-safe access to environment variables using Zod validation.
 * All environment variables MUST be accessed through this module to ensure:
 * 1. Type safety
 * 2. Runtime validation
 * 3. Clear documentation of required vs. optional variables
 * 4. Fail-fast behavior for missing required variables
 * 
 * **IMPORTANT**: This file is protected by CODEOWNERS. Any changes require review.
 * 
 * Usage:
 * ```typescript
 * import { env } from '@/lib/env'
 * 
 * const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
 * const apiKey = env.ANTHROPIC_API_KEY // Can be undefined
 * ```
 */

import { z } from 'zod'

// ============================================================
// Environment Schema Definition
// ============================================================

// IMPORTANT:
// - NEXT_PUBLIC_* vars can be read in both server + client bundles.
// - Server-only secrets (e.g. SUPABASE_SERVICE_ROLE_KEY) must never be
//   required/validated in the browser, otherwise production will crash.
const isServerRuntime = typeof window === 'undefined'
const isBuildTime = process.env.NEXT_PHASE === 'phase-production-build'
const isProdRuntime = process.env.NODE_ENV === 'production'
const requireServerSecrets = isServerRuntime && isProdRuntime && !isBuildTime

function sanitizeEnvString(value: unknown) {
  if (typeof value !== 'string') return value

  let v = value.trim()

  // Common deployment UI pitfall: values pasted with wrapping quotes/backticks.
  // Remove exactly one wrapping pair to avoid breaking legitimate inner quotes.
  const first = v[0]
  const last = v[v.length - 1]
  const isWrapped =
    (first === '"' && last === '"') ||
    (first === "'" && last === "'") ||
    (first === '`' && last === '`')

  if (isWrapped && v.length >= 2) {
    v = v.slice(1, -1).trim()
  }

  return v
}

const baseEnvSchema = z.object({
  // Client-safe vars (may be inlined at build time by Next.js)
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(sanitizeEnvString, z.string().url().optional()),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(sanitizeEnvString, z.string().optional()),

  // OPTIONAL: Review Queue Sampling
  REVIEW_SAMPLING_PERCENTAGE: z.string().optional(),
  REVIEW_SAMPLING_SALT: z.string().optional(),

  // OPTIONAL: Feature Flags
  NEXT_PUBLIC_FEATURE_AMY_ENABLED: z.string().optional(),
  NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED: z.string().optional(),
  NEXT_PUBLIC_FEATURE_CHARTS_ENABLED: z.string().optional(),

  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
  NEXT_PHASE: z.string().optional(),

  // Hosting provider (optional)
  VERCEL_ENV: z.string().optional(),

  // OPTIONAL: Usage Telemetry Toggle
  USAGE_TELEMETRY_ENABLED: z.string().optional(),
})

const serverOnlyEnvSchema = baseEnvSchema.extend({
  // OPTIONAL: Dev/Admin tooling feature flags
  DEV_ENDPOINT_CATALOG: z.string().optional(),

  // REQUIRED (server runtime only): Supabase Admin
  SUPABASE_SERVICE_ROLE_KEY: requireServerSecrets
    ? z.preprocess(
        sanitizeEnvString,
        z.string().min(1, 'SUPABASE_SERVICE_ROLE_KEY is required'),
      )
    : z.preprocess(sanitizeEnvString, z.string().optional()),

  // OPTIONAL: Anthropic AI Configuration
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_API_TOKEN: z.string().optional(), // Legacy support
  ANTHROPIC_MODEL: z.string().optional(),

  // OPTIONAL: Legacy/Alternative Variable Names
  SUPABASE_URL: z.preprocess(sanitizeEnvString, z.string().url().optional()), // Alternative to NEXT_PUBLIC_SUPABASE_URL
  SUPABASE_SERVICE_KEY: z.preprocess(sanitizeEnvString, z.string().optional()), // Alternative to SUPABASE_SERVICE_ROLE_KEY
})

function getRawClientEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    REVIEW_SAMPLING_PERCENTAGE: process.env.REVIEW_SAMPLING_PERCENTAGE,
    REVIEW_SAMPLING_SALT: process.env.REVIEW_SAMPLING_SALT,
    NEXT_PUBLIC_FEATURE_AMY_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AMY_ENABLED,
    NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED:
      process.env.NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED,
    NEXT_PUBLIC_FEATURE_CHARTS_ENABLED: process.env.NEXT_PUBLIC_FEATURE_CHARTS_ENABLED,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PHASE: process.env.NEXT_PHASE,
    VERCEL_ENV: process.env.VERCEL_ENV,
    USAGE_TELEMETRY_ENABLED: process.env.USAGE_TELEMETRY_ENABLED,
  }
}

// ============================================================
// Validated Environment Variables
// ============================================================

/**
 * Type of the validated environment object
 * Note: Required fields are guaranteed to be strings (never undefined)
 */
export type Env = {
  NEXT_PUBLIC_SUPABASE_URL: string
  NEXT_PUBLIC_SUPABASE_ANON_KEY: string
  SUPABASE_SERVICE_ROLE_KEY: string
  ANTHROPIC_API_KEY?: string
  ANTHROPIC_API_TOKEN?: string
  ANTHROPIC_MODEL?: string
  REVIEW_SAMPLING_PERCENTAGE?: string
  REVIEW_SAMPLING_SALT?: string
  NEXT_PUBLIC_FEATURE_AMY_ENABLED?: string
  NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED?: string
  NEXT_PUBLIC_FEATURE_CHARTS_ENABLED?: string
  SUPABASE_URL?: string
  SUPABASE_SERVICE_KEY?: string
  NODE_ENV?: 'development' | 'production' | 'test'
  NEXT_PHASE?: string
  VERCEL_ENV?: string
  USAGE_TELEMETRY_ENABLED?: string

  // Dev/admin tooling
  DEV_ENDPOINT_CATALOG?: string
}

/**
 * Get default environment values for development/build time
 */
function getDefaultEnv(): Env {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    SUPABASE_SERVICE_ROLE_KEY:
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_TOKEN,
    ANTHROPIC_API_TOKEN: process.env.ANTHROPIC_API_TOKEN,
    ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
    REVIEW_SAMPLING_PERCENTAGE: process.env.REVIEW_SAMPLING_PERCENTAGE,
    REVIEW_SAMPLING_SALT: process.env.REVIEW_SAMPLING_SALT,
    NEXT_PUBLIC_FEATURE_AMY_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AMY_ENABLED,
    NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED: process.env.NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED,
    NEXT_PUBLIC_FEATURE_CHARTS_ENABLED: process.env.NEXT_PUBLIC_FEATURE_CHARTS_ENABLED,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
    NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test' | undefined,
    NEXT_PHASE: process.env.NEXT_PHASE,
    VERCEL_ENV: process.env.VERCEL_ENV,
    USAGE_TELEMETRY_ENABLED: process.env.USAGE_TELEMETRY_ENABLED,
    DEV_ENDPOINT_CATALOG: process.env.DEV_ENDPOINT_CATALOG,
  }
}

/**
 * Parse and validate environment variables
 * This will throw an error if required variables are missing or invalid
 */
function parseEnv(): Env {
  try {
    if (isServerRuntime) {
      const parsed = serverOnlyEnvSchema.parse(process.env)
      return {
        NEXT_PUBLIC_SUPABASE_URL: parsed.NEXT_PUBLIC_SUPABASE_URL || parsed.SUPABASE_URL || '',
        NEXT_PUBLIC_SUPABASE_ANON_KEY: parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
        SUPABASE_SERVICE_ROLE_KEY: parsed.SUPABASE_SERVICE_ROLE_KEY || parsed.SUPABASE_SERVICE_KEY || '',
        ANTHROPIC_API_KEY: parsed.ANTHROPIC_API_KEY || parsed.ANTHROPIC_API_TOKEN,
        ANTHROPIC_API_TOKEN: parsed.ANTHROPIC_API_TOKEN,
        ANTHROPIC_MODEL: parsed.ANTHROPIC_MODEL,
        REVIEW_SAMPLING_PERCENTAGE: parsed.REVIEW_SAMPLING_PERCENTAGE,
        REVIEW_SAMPLING_SALT: parsed.REVIEW_SAMPLING_SALT,
        NEXT_PUBLIC_FEATURE_AMY_ENABLED: parsed.NEXT_PUBLIC_FEATURE_AMY_ENABLED,
        NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED:
          parsed.NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED,
        NEXT_PUBLIC_FEATURE_CHARTS_ENABLED: parsed.NEXT_PUBLIC_FEATURE_CHARTS_ENABLED,
        SUPABASE_URL: parsed.SUPABASE_URL,
        SUPABASE_SERVICE_KEY: parsed.SUPABASE_SERVICE_KEY,
        NODE_ENV: parsed.NODE_ENV,
        NEXT_PHASE: parsed.NEXT_PHASE,
        VERCEL_ENV: parsed.VERCEL_ENV,
        USAGE_TELEMETRY_ENABLED: parsed.USAGE_TELEMETRY_ENABLED,
        DEV_ENDPOINT_CATALOG: parsed.DEV_ENDPOINT_CATALOG,
      }
    }

    const parsed = baseEnvSchema.parse(getRawClientEnv())
    return {
      NEXT_PUBLIC_SUPABASE_URL: parsed.NEXT_PUBLIC_SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      SUPABASE_SERVICE_ROLE_KEY: '',
      ANTHROPIC_API_KEY: undefined,
      ANTHROPIC_API_TOKEN: undefined,
      ANTHROPIC_MODEL: undefined,
      REVIEW_SAMPLING_PERCENTAGE: parsed.REVIEW_SAMPLING_PERCENTAGE,
      REVIEW_SAMPLING_SALT: parsed.REVIEW_SAMPLING_SALT,
      NEXT_PUBLIC_FEATURE_AMY_ENABLED: parsed.NEXT_PUBLIC_FEATURE_AMY_ENABLED,
      NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED: parsed.NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED,
      NEXT_PUBLIC_FEATURE_CHARTS_ENABLED: parsed.NEXT_PUBLIC_FEATURE_CHARTS_ENABLED,
      SUPABASE_URL: undefined,
      SUPABASE_SERVICE_KEY: undefined,
      NODE_ENV: parsed.NODE_ENV,
      NEXT_PHASE: parsed.NEXT_PHASE,
      VERCEL_ENV: parsed.VERCEL_ENV,
      USAGE_TELEMETRY_ENABLED: parsed.USAGE_TELEMETRY_ENABLED,
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Environment variable validation failed:')
      console.error(error.issues.map((e) => `  - ${e.path.join('.')}: ${e.message}`).join('\n'))
      
      // During build, allow with defaults
      if (isBuildTime) {
        console.warn('⚠️  Build time: Continuing with default values')
        return getDefaultEnv()
      }

      // In production, fail fast only on the server.
      // In the browser we never throw (avoid hard-crashing the UI).
      if (process.env.NODE_ENV === 'production' && isServerRuntime) {
        throw new Error('Invalid environment variables')
      }
      
      // In development, warn but allow build to continue with default values
      console.warn('⚠️  Continuing with default values for development')
      return getDefaultEnv()
    }
    throw error
  }
}

/**
 * Validated and type-safe environment variables
 * Access all environment variables through this object
 */
export const env = parseEnv()

/**
 * Server-runtime feature flags.
 *
 * Note: Jest runs API route unit tests in a jsdom environment (window defined),
 * but API routes are still server code. Do NOT rely on `env` for server-only
 * flags in those tests.
 */
export function isDevEndpointCatalogEnabled(): boolean {
  return process.env.DEV_ENDPOINT_CATALOG === '1'
}

/**
 * Helper function to check if we're in production
 */
export function isProduction(): boolean {
  return env.NODE_ENV === 'production'
}

/**
 * Helper function to check if we're in development
 */
export function isDevelopment(): boolean {
  return env.NODE_ENV === 'development' || !env.NODE_ENV
}

/**
 * Helper function to check if we're in test mode
 */
export function isTest(): boolean {
  return env.NODE_ENV === 'test'
}
