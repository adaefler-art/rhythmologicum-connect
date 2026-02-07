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
import { flagEnabled } from '@/lib/env/flags'

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
const isCiRuntime = process.env.CI === 'true' || process.env.CI === '1'
const isTestRuntime = typeof process.env.JEST_WORKER_ID !== 'undefined'
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
  NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID: z.string().optional(),
  NEXT_PUBLIC_BUILD_TIME: z.string().optional(),
  STUDIO_BUILD_TIME: z.string().optional(),
  AUTH_CALLBACK_DEBUG: z.string().optional(),
  AUTH_CALLBACK_TIMEOUT_MS: z.string().optional(),

  // OPTIONAL: Review Queue Sampling
  REVIEW_SAMPLING_PERCENTAGE: z.string().optional(),
  REVIEW_SAMPLING_SALT: z.string().optional(),

  // OPTIONAL: Feature Flags
  NEXT_PUBLIC_FEATURE_AMY_ENABLED: z.string().optional(),
  NEXT_PUBLIC_FEATURE_AMY_CHAT_ENABLED: z.string().optional(),
  NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED: z.string().optional(),
  NEXT_PUBLIC_FEATURE_CHARTS_ENABLED: z.string().optional(),
  NEXT_PUBLIC_FEATURE_PROCESSING_RESULTS_ENABLED: z.string().optional(),
  NEXT_PUBLIC_FEATURE_MCP_ENABLED: z.string().optional(),
  NEXT_PUBLIC_FEATURE_ANAMNESIS_EXPORT_ENABLED: z.string().optional(),
  NEXT_PUBLIC_FEATURE_DIAGNOSIS_ENABLED: z.string().optional(),
  NEXT_PUBLIC_FEATURE_DIAGNOSIS_V1_ENABLED: z.string().optional(),
  NEXT_PUBLIC_FEATURE_DIAGNOSIS_DEDUPE_ENABLED: z.string().optional(),
  NEXT_PUBLIC_FEATURE_DIAGNOSIS_PROMPT_ENABLED: z.string().optional(),
  NEXT_PUBLIC_FEATURE_DIAGNOSIS_PATIENT_ENABLED: z.string().optional(),
  E73_4_RESULT_SSOT: z.string().optional(),

  // OPTIONAL: E6.4.1 Pilot Feature Flags
  NEXT_PUBLIC_PILOT_ENABLED: z.string().optional(),
  NEXT_PUBLIC_PILOT_ENV: z.string().optional(),

  // Node Environment
  NODE_ENV: z.enum(['development', 'production', 'test']).optional(),
  NEXT_PHASE: z.string().optional(),

  // Hosting provider (optional)
  VERCEL_ENV: z.string().optional(),
  VERCEL_URL: z.string().optional(),
  VERCEL_GIT_COMMIT_SHA: z.string().optional(),
  GIT_COMMIT_SHA: z.string().optional(),
  COMMIT_SHA: z.string().optional(),

  // OPTIONAL: Usage Telemetry Toggle
  USAGE_TELEMETRY_ENABLED: z.string().optional(),
})

const serverOnlyEnvSchema = baseEnvSchema.extend({
  // OPTIONAL: Dev/Admin tooling feature flags
  DEV_ENDPOINT_CATALOG: z.string().optional(),

  // OPTIONAL: UI split routing (Package 2)
  STUDIO_BASE_URL: z.preprocess(sanitizeEnvString, z.string().url().optional()),
  PATIENT_BASE_URL: z.preprocess(sanitizeEnvString, z.string().url().optional()),
  ENGINE_BASE_URL: z.preprocess(sanitizeEnvString, z.string().url().optional()),

  // OPTIONAL: E6.4.1 Pilot Allowlists (server-only)
  PILOT_ORG_ALLOWLIST: z.string().optional(),
  PILOT_USER_ALLOWLIST: z.string().optional(),

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

  // OPTIONAL: MCP Server configuration (server-only)
  MCP_SERVER_URL: z.preprocess(sanitizeEnvString, z.string().url().optional()),
  MCP_SERVER_HOST: z.preprocess(sanitizeEnvString, z.string().optional()),
  MCP_SERVER_PORT: z.preprocess(sanitizeEnvString, z.string().optional()),
  FEATURE_MCP_STUB: z.string().optional(),

  // OPTIONAL: E78.6 Triage SLA Configuration
  TRIAGE_SLA_DAYS_DEFAULT: z.string().optional(),
  TRIAGE_SCHEMA_GATE: z.string().optional(),
})

const patientEnvSchema = baseEnvSchema.extend({
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(
    sanitizeEnvString,
    z.string().url('NEXT_PUBLIC_SUPABASE_URL is required'),
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(
    sanitizeEnvString,
    z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  ),
  ENGINE_BASE_URL: z.preprocess(sanitizeEnvString, z.string().url('ENGINE_BASE_URL is required')),
})

const studioEnvSchema = baseEnvSchema.extend({
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(
    sanitizeEnvString,
    z.string().url('NEXT_PUBLIC_SUPABASE_URL is required'),
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(
    sanitizeEnvString,
    z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  ),
})

const engineEnvSchema = serverOnlyEnvSchema.extend({
  NEXT_PUBLIC_SUPABASE_URL: z.preprocess(
    sanitizeEnvString,
    z.string().url('NEXT_PUBLIC_SUPABASE_URL is required'),
  ),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.preprocess(
    sanitizeEnvString,
    z.string().min(1, 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required'),
  ),
})

export type PatientEnv = z.infer<typeof patientEnvSchema>
export type StudioEnv = z.infer<typeof studioEnvSchema>
export type BaseEnv = Partial<Env>
export type EngineEnv = z.infer<typeof engineEnvSchema>

function getRawClientEnv() {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID: process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID,
    NEXT_PUBLIC_BUILD_TIME: process.env.NEXT_PUBLIC_BUILD_TIME,
    STUDIO_BUILD_TIME: process.env.STUDIO_BUILD_TIME,
    AUTH_CALLBACK_DEBUG: process.env.AUTH_CALLBACK_DEBUG,
    AUTH_CALLBACK_TIMEOUT_MS: process.env.AUTH_CALLBACK_TIMEOUT_MS,
    VERCEL_URL: process.env.VERCEL_URL,
    REVIEW_SAMPLING_PERCENTAGE: process.env.REVIEW_SAMPLING_PERCENTAGE,
    REVIEW_SAMPLING_SALT: process.env.REVIEW_SAMPLING_SALT,
    NEXT_PUBLIC_FEATURE_AMY_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AMY_ENABLED,
    NEXT_PUBLIC_FEATURE_AMY_CHAT_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AMY_CHAT_ENABLED,
    NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED:
      process.env.NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED,
    NEXT_PUBLIC_FEATURE_CHARTS_ENABLED: process.env.NEXT_PUBLIC_FEATURE_CHARTS_ENABLED,
    NEXT_PUBLIC_FEATURE_PROCESSING_RESULTS_ENABLED:
      process.env.NEXT_PUBLIC_FEATURE_PROCESSING_RESULTS_ENABLED,
    NEXT_PUBLIC_FEATURE_MCP_ENABLED: process.env.NEXT_PUBLIC_FEATURE_MCP_ENABLED,
    NEXT_PUBLIC_FEATURE_ANAMNESIS_EXPORT_ENABLED:
      process.env.NEXT_PUBLIC_FEATURE_ANAMNESIS_EXPORT_ENABLED,
    NEXT_PUBLIC_FEATURE_DIAGNOSIS_ENABLED: process.env.NEXT_PUBLIC_FEATURE_DIAGNOSIS_ENABLED,
    NEXT_PUBLIC_FEATURE_DIAGNOSIS_V1_ENABLED:
      process.env.NEXT_PUBLIC_FEATURE_DIAGNOSIS_V1_ENABLED,
    NEXT_PUBLIC_FEATURE_DIAGNOSIS_DEDUPE_ENABLED:
      process.env.NEXT_PUBLIC_FEATURE_DIAGNOSIS_DEDUPE_ENABLED,
    NEXT_PUBLIC_FEATURE_DIAGNOSIS_PROMPT_ENABLED:
      process.env.NEXT_PUBLIC_FEATURE_DIAGNOSIS_PROMPT_ENABLED,
    E73_4_RESULT_SSOT: process.env.E73_4_RESULT_SSOT,
    NEXT_PUBLIC_PILOT_ENABLED: process.env.NEXT_PUBLIC_PILOT_ENABLED,
    NEXT_PUBLIC_PILOT_ENV: process.env.NEXT_PUBLIC_PILOT_ENV,
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PHASE: process.env.NEXT_PHASE,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA,
    GIT_COMMIT_SHA: process.env.GIT_COMMIT_SHA,
    COMMIT_SHA: process.env.COMMIT_SHA,
    USAGE_TELEMETRY_ENABLED: process.env.USAGE_TELEMETRY_ENABLED,
  }
}

function getRawServerEnv() {
  return {
    DEV_ENDPOINT_CATALOG: process.env.DEV_ENDPOINT_CATALOG,
    STUDIO_BASE_URL: process.env.STUDIO_BASE_URL,
    PATIENT_BASE_URL: process.env.PATIENT_BASE_URL,
    ENGINE_BASE_URL: process.env.ENGINE_BASE_URL,
    PILOT_ORG_ALLOWLIST: process.env.PILOT_ORG_ALLOWLIST,
    PILOT_USER_ALLOWLIST: process.env.PILOT_USER_ALLOWLIST,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY,
    ANTHROPIC_API_TOKEN: process.env.ANTHROPIC_API_TOKEN,
    ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
    MCP_SERVER_URL: process.env.MCP_SERVER_URL,
    MCP_SERVER_HOST: process.env.MCP_SERVER_HOST,
    MCP_SERVER_PORT: process.env.MCP_SERVER_PORT,
    FEATURE_MCP_STUB: process.env.FEATURE_MCP_STUB,
    TRIAGE_SLA_DAYS_DEFAULT: process.env.TRIAGE_SLA_DAYS_DEFAULT,
    TRIAGE_SCHEMA_GATE: process.env.TRIAGE_SCHEMA_GATE,
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
  NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID?: string
  NEXT_PUBLIC_BUILD_TIME?: string
  STUDIO_BUILD_TIME?: string
  AUTH_CALLBACK_DEBUG?: string
  AUTH_CALLBACK_TIMEOUT_MS?: string
  SUPABASE_SERVICE_ROLE_KEY: string
  ANTHROPIC_API_KEY?: string
  ANTHROPIC_API_TOKEN?: string
  ANTHROPIC_MODEL?: string
  REVIEW_SAMPLING_PERCENTAGE?: string
  REVIEW_SAMPLING_SALT?: string
  NEXT_PUBLIC_FEATURE_AMY_ENABLED?: string
  NEXT_PUBLIC_FEATURE_AMY_CHAT_ENABLED?: string
  NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED?: string
  NEXT_PUBLIC_FEATURE_CHARTS_ENABLED?: string
  NEXT_PUBLIC_FEATURE_PROCESSING_RESULTS_ENABLED?: string
  NEXT_PUBLIC_FEATURE_MCP_ENABLED?: string
  NEXT_PUBLIC_FEATURE_ANAMNESIS_EXPORT_ENABLED?: string
  NEXT_PUBLIC_FEATURE_DIAGNOSIS_ENABLED?: string
  NEXT_PUBLIC_FEATURE_DIAGNOSIS_V1_ENABLED?: string
  NEXT_PUBLIC_FEATURE_DIAGNOSIS_DEDUPE_ENABLED?: string
  NEXT_PUBLIC_FEATURE_DIAGNOSIS_PROMPT_ENABLED?: string
  NEXT_PUBLIC_FEATURE_DIAGNOSIS_PATIENT_ENABLED?: string
  E73_4_RESULT_SSOT?: string
  NEXT_PUBLIC_PILOT_ENABLED?: string
  NEXT_PUBLIC_PILOT_ENV?: string
  PILOT_ORG_ALLOWLIST?: string
  PILOT_USER_ALLOWLIST?: string
  SUPABASE_URL?: string
  SUPABASE_SERVICE_KEY?: string
  NODE_ENV?: 'development' | 'production' | 'test'
  NEXT_PHASE?: string
  VERCEL_ENV?: string
  VERCEL_URL?: string
  VERCEL_GIT_COMMIT_SHA?: string
  GIT_COMMIT_SHA?: string
  COMMIT_SHA?: string
  USAGE_TELEMETRY_ENABLED?: string

  // Dev/admin tooling
  DEV_ENDPOINT_CATALOG?: string
  STUDIO_BASE_URL?: string
  PATIENT_BASE_URL?: string
  ENGINE_BASE_URL?: string
  MCP_SERVER_URL?: string
  MCP_SERVER_HOST?: string
  MCP_SERVER_PORT?: string
  FEATURE_MCP_STUB?: string
  TRIAGE_SLA_DAYS_DEFAULT?: string
  TRIAGE_SCHEMA_GATE?: string
}

/**
 * Get default environment values for development/build time
 */
function getDefaultEnv(): Env {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID: process.env.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID,
    NEXT_PUBLIC_BUILD_TIME: process.env.NEXT_PUBLIC_BUILD_TIME,
    STUDIO_BUILD_TIME: process.env.STUDIO_BUILD_TIME,
    VERCEL_URL: process.env.VERCEL_URL,
    AUTH_CALLBACK_DEBUG: process.env.AUTH_CALLBACK_DEBUG,
    AUTH_CALLBACK_TIMEOUT_MS: process.env.AUTH_CALLBACK_TIMEOUT_MS,
    SUPABASE_SERVICE_ROLE_KEY:
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || '',
    ANTHROPIC_API_KEY: process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_TOKEN,
    ANTHROPIC_API_TOKEN: process.env.ANTHROPIC_API_TOKEN,
    ANTHROPIC_MODEL: process.env.ANTHROPIC_MODEL,
    REVIEW_SAMPLING_PERCENTAGE: process.env.REVIEW_SAMPLING_PERCENTAGE,
    REVIEW_SAMPLING_SALT: process.env.REVIEW_SAMPLING_SALT,
    NEXT_PUBLIC_FEATURE_AMY_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AMY_ENABLED,
    NEXT_PUBLIC_FEATURE_AMY_CHAT_ENABLED: process.env.NEXT_PUBLIC_FEATURE_AMY_CHAT_ENABLED,
    NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED: process.env.NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED,
    NEXT_PUBLIC_FEATURE_CHARTS_ENABLED: process.env.NEXT_PUBLIC_FEATURE_CHARTS_ENABLED,
    NEXT_PUBLIC_FEATURE_PROCESSING_RESULTS_ENABLED: process.env.NEXT_PUBLIC_FEATURE_PROCESSING_RESULTS_ENABLED,
    NEXT_PUBLIC_FEATURE_MCP_ENABLED: process.env.NEXT_PUBLIC_FEATURE_MCP_ENABLED,
    NEXT_PUBLIC_FEATURE_ANAMNESIS_EXPORT_ENABLED:
      process.env.NEXT_PUBLIC_FEATURE_ANAMNESIS_EXPORT_ENABLED,
    NEXT_PUBLIC_FEATURE_DIAGNOSIS_ENABLED: process.env.NEXT_PUBLIC_FEATURE_DIAGNOSIS_ENABLED,
    NEXT_PUBLIC_FEATURE_DIAGNOSIS_V1_ENABLED:
      process.env.NEXT_PUBLIC_FEATURE_DIAGNOSIS_V1_ENABLED,
    NEXT_PUBLIC_FEATURE_DIAGNOSIS_DEDUPE_ENABLED:
      process.env.NEXT_PUBLIC_FEATURE_DIAGNOSIS_DEDUPE_ENABLED,
    NEXT_PUBLIC_FEATURE_DIAGNOSIS_PROMPT_ENABLED:
      process.env.NEXT_PUBLIC_FEATURE_DIAGNOSIS_PROMPT_ENABLED,
    NEXT_PUBLIC_FEATURE_DIAGNOSIS_PATIENT_ENABLED:
      process.env.NEXT_PUBLIC_FEATURE_DIAGNOSIS_PATIENT_ENABLED,
    E73_4_RESULT_SSOT: process.env.E73_4_RESULT_SSOT,
    NEXT_PUBLIC_PILOT_ENABLED: process.env.NEXT_PUBLIC_PILOT_ENABLED,
    NEXT_PUBLIC_PILOT_ENV: process.env.NEXT_PUBLIC_PILOT_ENV,
    PILOT_ORG_ALLOWLIST: process.env.PILOT_ORG_ALLOWLIST,
    PILOT_USER_ALLOWLIST: process.env.PILOT_USER_ALLOWLIST,
    SUPABASE_URL: process.env.SUPABASE_URL,
    SUPABASE_SERVICE_KEY: process.env.SUPABASE_SERVICE_KEY,
    NODE_ENV: process.env.NODE_ENV as 'development' | 'production' | 'test' | undefined,
    NEXT_PHASE: process.env.NEXT_PHASE,
    VERCEL_ENV: process.env.VERCEL_ENV,
    VERCEL_GIT_COMMIT_SHA: process.env.VERCEL_GIT_COMMIT_SHA,
    GIT_COMMIT_SHA: process.env.GIT_COMMIT_SHA,
    COMMIT_SHA: process.env.COMMIT_SHA,
    USAGE_TELEMETRY_ENABLED: process.env.USAGE_TELEMETRY_ENABLED,
    DEV_ENDPOINT_CATALOG: process.env.DEV_ENDPOINT_CATALOG,
    STUDIO_BASE_URL: process.env.STUDIO_BASE_URL,
    PATIENT_BASE_URL: process.env.PATIENT_BASE_URL,
    ENGINE_BASE_URL: process.env.ENGINE_BASE_URL,
    MCP_SERVER_URL: process.env.MCP_SERVER_URL,
    MCP_SERVER_HOST: process.env.MCP_SERVER_HOST,
    MCP_SERVER_PORT: process.env.MCP_SERVER_PORT,
    FEATURE_MCP_STUB: process.env.FEATURE_MCP_STUB,
    TRIAGE_SCHEMA_GATE: process.env.TRIAGE_SCHEMA_GATE,
  }
}

function getMissingEnvKeys(issues: z.ZodIssue[]): string[] {
  const keys = new Set<string>()
  issues.forEach((issue) => {
    const pathKey = issue.path[0]
    if (typeof pathKey === 'string') {
      keys.add(pathKey)
    }
  })
  return Array.from(keys)
}

type ParseOptions = {
  strict?: boolean
  scope?: string
}

function parseScopedEnv<T extends z.ZodTypeAny>(schema: T, options: ParseOptions = {}): z.infer<T> {
  const rawEnv = isServerRuntime
    ? { ...getRawClientEnv(), ...getRawServerEnv() }
    : getRawClientEnv()

  try {
    const parsed = schema.parse(rawEnv) as Env
    return {
      NEXT_PUBLIC_SUPABASE_URL: parsed.NEXT_PUBLIC_SUPABASE_URL || parsed.SUPABASE_URL || '',
      NEXT_PUBLIC_SUPABASE_ANON_KEY: parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID: parsed.NEXT_PUBLIC_VERCEL_DEPLOYMENT_ID,
      NEXT_PUBLIC_BUILD_TIME: parsed.NEXT_PUBLIC_BUILD_TIME,
      AUTH_CALLBACK_DEBUG: parsed.AUTH_CALLBACK_DEBUG,
      AUTH_CALLBACK_TIMEOUT_MS: parsed.AUTH_CALLBACK_TIMEOUT_MS,
      SUPABASE_SERVICE_ROLE_KEY: parsed.SUPABASE_SERVICE_ROLE_KEY || parsed.SUPABASE_SERVICE_KEY || '',
      ANTHROPIC_API_KEY: parsed.ANTHROPIC_API_KEY || parsed.ANTHROPIC_API_TOKEN,
      ANTHROPIC_API_TOKEN: parsed.ANTHROPIC_API_TOKEN,
      ANTHROPIC_MODEL: parsed.ANTHROPIC_MODEL,
      REVIEW_SAMPLING_PERCENTAGE: parsed.REVIEW_SAMPLING_PERCENTAGE,
      REVIEW_SAMPLING_SALT: parsed.REVIEW_SAMPLING_SALT,
      NEXT_PUBLIC_FEATURE_AMY_ENABLED: parsed.NEXT_PUBLIC_FEATURE_AMY_ENABLED,
      NEXT_PUBLIC_FEATURE_AMY_CHAT_ENABLED: parsed.NEXT_PUBLIC_FEATURE_AMY_CHAT_ENABLED,
      NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED:
        parsed.NEXT_PUBLIC_FEATURE_CLINICIAN_DASHBOARD_ENABLED,
      NEXT_PUBLIC_FEATURE_CHARTS_ENABLED: parsed.NEXT_PUBLIC_FEATURE_CHARTS_ENABLED,
      NEXT_PUBLIC_FEATURE_PROCESSING_RESULTS_ENABLED: parsed.NEXT_PUBLIC_FEATURE_PROCESSING_RESULTS_ENABLED,
      NEXT_PUBLIC_FEATURE_MCP_ENABLED: parsed.NEXT_PUBLIC_FEATURE_MCP_ENABLED,
      NEXT_PUBLIC_FEATURE_ANAMNESIS_EXPORT_ENABLED:
        parsed.NEXT_PUBLIC_FEATURE_ANAMNESIS_EXPORT_ENABLED,
      NEXT_PUBLIC_FEATURE_DIAGNOSIS_ENABLED: parsed.NEXT_PUBLIC_FEATURE_DIAGNOSIS_ENABLED,
      NEXT_PUBLIC_FEATURE_DIAGNOSIS_V1_ENABLED:
        parsed.NEXT_PUBLIC_FEATURE_DIAGNOSIS_V1_ENABLED,
      NEXT_PUBLIC_FEATURE_DIAGNOSIS_DEDUPE_ENABLED:
        parsed.NEXT_PUBLIC_FEATURE_DIAGNOSIS_DEDUPE_ENABLED,
      NEXT_PUBLIC_FEATURE_DIAGNOSIS_PROMPT_ENABLED:
        parsed.NEXT_PUBLIC_FEATURE_DIAGNOSIS_PROMPT_ENABLED,
      NEXT_PUBLIC_FEATURE_DIAGNOSIS_PATIENT_ENABLED:
        parsed.NEXT_PUBLIC_FEATURE_DIAGNOSIS_PATIENT_ENABLED,
      E73_4_RESULT_SSOT: parsed.E73_4_RESULT_SSOT,
      NEXT_PUBLIC_PILOT_ENABLED: parsed.NEXT_PUBLIC_PILOT_ENABLED,
      NEXT_PUBLIC_PILOT_ENV: parsed.NEXT_PUBLIC_PILOT_ENV,
      PILOT_ORG_ALLOWLIST: parsed.PILOT_ORG_ALLOWLIST,
      PILOT_USER_ALLOWLIST: parsed.PILOT_USER_ALLOWLIST,
      SUPABASE_URL: parsed.SUPABASE_URL,
      SUPABASE_SERVICE_KEY: parsed.SUPABASE_SERVICE_KEY,
      NODE_ENV: parsed.NODE_ENV,
      NEXT_PHASE: parsed.NEXT_PHASE,
      VERCEL_ENV: parsed.VERCEL_ENV,
      VERCEL_GIT_COMMIT_SHA: parsed.VERCEL_GIT_COMMIT_SHA,
      GIT_COMMIT_SHA: parsed.GIT_COMMIT_SHA,
      COMMIT_SHA: parsed.COMMIT_SHA,
      USAGE_TELEMETRY_ENABLED: parsed.USAGE_TELEMETRY_ENABLED,
      DEV_ENDPOINT_CATALOG: parsed.DEV_ENDPOINT_CATALOG,
      STUDIO_BASE_URL: parsed.STUDIO_BASE_URL,
      PATIENT_BASE_URL: parsed.PATIENT_BASE_URL,
      ENGINE_BASE_URL: parsed.ENGINE_BASE_URL,
      MCP_SERVER_URL: parsed.MCP_SERVER_URL,
      MCP_SERVER_HOST: parsed.MCP_SERVER_HOST,
      MCP_SERVER_PORT: parsed.MCP_SERVER_PORT,
      FEATURE_MCP_STUB: parsed.FEATURE_MCP_STUB,
      TRIAGE_SLA_DAYS_DEFAULT: parsed.TRIAGE_SLA_DAYS_DEFAULT,
      TRIAGE_SCHEMA_GATE: parsed.TRIAGE_SCHEMA_GATE,
    } as z.infer<T>
  } catch (error) {
    if (error instanceof z.ZodError) {
      const missingKeys = getMissingEnvKeys(error.issues)
      const message = missingKeys.length
        ? `Missing env: ${missingKeys.join(', ')}`
        : 'Invalid environment variables'

      console.error('❌ Environment variable validation failed:')
      console.error(error.issues.map((e) => `  - ${e.path.join('.')}: ${e.message}`).join('\n'))

      // During build, allow with defaults
      if (isBuildTime) {
        console.warn('⚠️  Build time: Continuing with default values')
        return getDefaultEnv() as z.infer<T>
      }

      if (options.strict && isServerRuntime && (!isCiRuntime || isTestRuntime)) {
        throw new Error(message)
      }

      // In development or non-strict mode, warn but allow build to continue with default values
      console.warn(
        `⚠️  Continuing with default values for ${options.scope ?? 'base'} environment`,
      )
      return getDefaultEnv() as z.infer<T>
    }
    throw error
  }
}

/**
 * Parse and validate environment variables
 * This will not throw in base mode to avoid import-time crashes
 */
function parseEnv(): BaseEnv {
  const schema = isServerRuntime ? serverOnlyEnvSchema : baseEnvSchema
  return parseScopedEnv(schema, { strict: false, scope: 'base' }) as BaseEnv
}

/**
 * Validated and type-safe environment variables
 * Access all environment variables through this object
 */
let cachedEnv: BaseEnv | null = null

export function getEnv(): BaseEnv {
  if (!cachedEnv) {
    cachedEnv = parseEnv()
  }
  return cachedEnv
}

export function getPatientEnv(): PatientEnv {
  return parseScopedEnv(patientEnvSchema, { strict: true, scope: 'patient' })
}

export function getStudioEnv(): StudioEnv {
  return parseScopedEnv(studioEnvSchema, { strict: true, scope: 'studio' })
}

export function getEngineEnv(): EngineEnv {
  return parseScopedEnv(engineEnvSchema, { strict: true, scope: 'engine' })
}

export const env = new Proxy({} as BaseEnv, {
  get(_target, prop) {
    return getEnv()[prop as keyof Env]
  },
  set(_target, prop, value) {
    const current = getEnv()
    ;(current as Record<string, unknown>)[prop as string] = value
    return true
  },
})

/**
 * Server-runtime feature flags.
 *
 * Note: Jest runs API route unit tests in a jsdom environment (window defined),
 * but API routes are still server code. Do NOT rely on `env` for server-only
 * flags in those tests.
 */
export function isDevEndpointCatalogEnabled(): boolean {
  return flagEnabled(process.env.DEV_ENDPOINT_CATALOG)
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
