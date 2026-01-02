import { NextRequest } from 'next/server'
import {
  successResponse,
  unauthorizedResponse,
  forbiddenResponse,
  internalErrorResponse,
} from '@/lib/api/responses'
import { getCurrentUser, hasAdminOrClinicianRole } from '@/lib/db/supabase.server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { env } from '@/lib/env'

/**
 * TV05_03: Environment Self-Check Healthcheck Endpoint
 * GET /api/health/env
 *
 * Server-only, admin-gated endpoint that performs environment variable validation
 * and optional database connectivity checks.
 *
 * Authentication:
 * - unauth → 401
 * - non-admin → 403
 *
 * Response:
 * {
 *   "success": true,
 *   "data": {
 *     "healthcheckVersion": "1.0.0",
 *     "status": "GREEN" | "RED",
 *     "checks": [
 *       {
 *         "name": "NEXT_PUBLIC_SUPABASE_URL",
 *         "ok": true,
 *         "message": "Valid URL format",
 *         "hint": "..." // optional, provided on failure
 *       }
 *     ],
 *     "requestId": "uuid",
 *     "timestamp": "2026-01-02T19:00:00.000Z"
 *   }
 * }
 */

type HealthCheckResult = {
  name: string
  ok: boolean
  message: string
  hint?: string
}

type HealthCheckResponse = {
  healthcheckVersion: string
  status: 'GREEN' | 'YELLOW' | 'RED'
  checks: HealthCheckResult[]
  requestId: string
  timestamp: string
}

/**
 * Validates URL format without revealing the actual URL
 */
function isValidUrl(value: string | undefined): boolean {
  if (!value) return false
  try {
    new URL(value)
    return true
  } catch {
    return false
  }
}

/**
 * Checks if a string has leading/trailing whitespace
 */
function hasWhitespace(value: string | undefined): boolean {
  if (!value) return false
  return value !== value.trim()
}

/**
 * Checks if value appears to be a valid Supabase key format
 * (long alphanumeric string, typically starts with 'eyJ')
 */
function isValidSupabaseKeyFormat(value: string | undefined): boolean {
  if (!value) return false
  // Basic validation: should be reasonably long and alphanumeric
  // Most Supabase keys are JWT-like and start with 'eyJ'
  return value.length > 20 && /^[A-Za-z0-9._-]+$/.test(value)
}

/**
 * Performs environment variable checks
 */
function performEnvChecks(): HealthCheckResult[] {
  const checks: HealthCheckResult[] = []

  // Check NEXT_PUBLIC_SUPABASE_URL
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
  if (!supabaseUrl) {
    checks.push({
      name: 'NEXT_PUBLIC_SUPABASE_URL',
      ok: false,
      message: 'Missing required environment variable',
      hint: 'Set NEXT_PUBLIC_SUPABASE_URL in .env.local or environment',
    })
  } else if (hasWhitespace(supabaseUrl)) {
    checks.push({
      name: 'NEXT_PUBLIC_SUPABASE_URL',
      ok: false,
      message: 'Contains leading/trailing whitespace',
      hint: 'Remove spaces before/after the URL value',
    })
  } else if (!isValidUrl(supabaseUrl)) {
    checks.push({
      name: 'NEXT_PUBLIC_SUPABASE_URL',
      ok: false,
      message: 'Invalid URL format',
      hint: 'Expected format: https://your-project.supabase.co',
    })
  } else {
    checks.push({
      name: 'NEXT_PUBLIC_SUPABASE_URL',
      ok: true,
      message: 'Valid URL format',
    })
  }

  // Check NEXT_PUBLIC_SUPABASE_ANON_KEY
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!anonKey) {
    checks.push({
      name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      ok: false,
      message: 'Missing required environment variable',
      hint: 'Set NEXT_PUBLIC_SUPABASE_ANON_KEY from Supabase dashboard',
    })
  } else if (hasWhitespace(anonKey)) {
    checks.push({
      name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      ok: false,
      message: 'Contains leading/trailing whitespace',
      hint: 'Remove spaces before/after the key value',
    })
  } else if (!isValidSupabaseKeyFormat(anonKey)) {
    checks.push({
      name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      ok: false,
      message: 'Invalid key format',
      hint: 'Expected long alphanumeric string (JWT-like format)',
    })
  } else {
    checks.push({
      name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      ok: true,
      message: 'Valid key format',
    })
  }

  return checks
}

/**
 * Optional: Tests database connectivity via authenticated server client
 * Uses canonical v0.5.x schema tables (pillars or funnels_catalog) - no PHI
 */
async function performDatabaseConnectivityCheck(): Promise<HealthCheckResult> {
  try {
    const supabase = await createServerSupabaseClient()

    // Try pillars first (preferred canonical table)
    const { error } = await supabase.from('pillars').select('id').limit(1)

    if (error) {
      // Check error codes for specific failure types
      const errorCode = (error as any).code

      // 42P01 = relation does not exist (schema drift)
      if (errorCode === '42P01') {
        return {
          name: 'Database Connectivity',
          ok: false,
          message: 'Schema drift detected',
          hint: 'Table "pillars" does not exist - run migrations or verify schema',
        }
      }

      // 42501 = permission denied / invalid API key
      if (errorCode === '42501') {
        return {
          name: 'Database Connectivity',
          ok: false,
          message: 'Authentication/permission error',
          hint: 'Invalid API key or insufficient permissions - check credentials',
        }
      }

      // Other database errors
      return {
        name: 'Database Connectivity',
        ok: false,
        message: 'Database query failed',
        hint: error.message,
      }
    }

    return {
      name: 'Database Connectivity',
      ok: true,
      message: 'Successfully connected to database',
    }
  } catch (error) {
    // Handle connection errors (network, invalid URL, etc.)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'

    // Check for common error patterns
    if (errorMessage.includes('Supabase configuration missing')) {
      return {
        name: 'Database Connectivity',
        ok: false,
        message: 'Missing environment configuration',
        hint: 'Check NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY',
      }
    }

    return {
      name: 'Database Connectivity',
      ok: false,
      message: 'Connection error',
      hint: errorMessage,
    }
  }
}

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID()

  try {
    // Auth gate: must be authenticated
    const user = await getCurrentUser()

    if (!user) {
      return unauthorizedResponse()
    }

    // Authorization gate: must be admin or clinician
    const isAuthorized = await hasAdminOrClinicianRole()

    if (!isAuthorized) {
      return forbiddenResponse()
    }

    // Perform environment checks
    const envChecks = performEnvChecks()

    // Optional: perform database connectivity check
    const dbCheck = await performDatabaseConnectivityCheck()
    const allChecks = [...envChecks, dbCheck]

    // Determine overall status based on check results
    // GREEN: all checks ok
    // RED: any check failed
    // YELLOW: reserved for future use (warnings)
    const status = allChecks.every((check) => check.ok) ? 'GREEN' : 'RED'

    const response: HealthCheckResponse = {
      healthcheckVersion: '1.0.0',
      status,
      checks: allChecks,
      requestId,
      timestamp: new Date().toISOString(),
    }

    return successResponse(response)
  } catch (error) {
    // Unexpected errors should still return 200 with RED status
    // (not 500) to maintain fail-safe behavior
    console.error('[health/env] Unexpected error:', error)

    const response: HealthCheckResponse = {
      healthcheckVersion: '1.0.0',
      status: 'RED',
      checks: [
        {
          name: 'Health Check Execution',
          ok: false,
          message: 'Unexpected error during health check',
          hint: error instanceof Error ? error.message : 'Unknown error',
        },
      ],
      requestId,
      timestamp: new Date().toISOString(),
    }

    return successResponse(response)
  }
}
