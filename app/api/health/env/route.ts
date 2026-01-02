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
 *     "checks": [
 *       {
 *         "name": "NEXT_PUBLIC_SUPABASE_URL",
 *         "pass": true,
 *         "message": "Valid URL format"
 *       },
 *       // ... more checks
 *     ],
 *     "overallStatus": "pass" | "fail",
 *     "timestamp": "2026-01-02T18:43:14.296Z"
 *   }
 * }
 */

type HealthCheckResult = {
  name: string
  pass: boolean
  message: string
}

type HealthCheckResponse = {
  checks: HealthCheckResult[]
  overallStatus: 'pass' | 'fail'
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
      pass: false,
      message: 'Missing required environment variable',
    })
  } else if (hasWhitespace(supabaseUrl)) {
    checks.push({
      name: 'NEXT_PUBLIC_SUPABASE_URL',
      pass: false,
      message: 'Contains leading/trailing whitespace',
    })
  } else if (!isValidUrl(supabaseUrl)) {
    checks.push({
      name: 'NEXT_PUBLIC_SUPABASE_URL',
      pass: false,
      message: 'Invalid URL format',
    })
  } else {
    checks.push({
      name: 'NEXT_PUBLIC_SUPABASE_URL',
      pass: true,
      message: 'Valid URL format',
    })
  }

  // Check NEXT_PUBLIC_SUPABASE_ANON_KEY
  const anonKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!anonKey) {
    checks.push({
      name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      pass: false,
      message: 'Missing required environment variable',
    })
  } else if (hasWhitespace(anonKey)) {
    checks.push({
      name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      pass: false,
      message: 'Contains leading/trailing whitespace',
    })
  } else if (!isValidSupabaseKeyFormat(anonKey)) {
    checks.push({
      name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      pass: false,
      message: 'Invalid key format (expected long alphanumeric string)',
    })
  } else {
    checks.push({
      name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      pass: true,
      message: 'Valid key format',
    })
  }

  // Check SUPABASE_SERVICE_ROLE_KEY
  const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceRoleKey) {
    checks.push({
      name: 'SUPABASE_SERVICE_ROLE_KEY',
      pass: false,
      message: 'Missing service role key (required for admin operations)',
    })
  } else if (hasWhitespace(serviceRoleKey)) {
    checks.push({
      name: 'SUPABASE_SERVICE_ROLE_KEY',
      pass: false,
      message: 'Contains leading/trailing whitespace',
    })
  } else if (!isValidSupabaseKeyFormat(serviceRoleKey)) {
    checks.push({
      name: 'SUPABASE_SERVICE_ROLE_KEY',
      pass: false,
      message: 'Invalid key format (expected long alphanumeric string)',
    })
  } else {
    checks.push({
      name: 'SUPABASE_SERVICE_ROLE_KEY',
      pass: true,
      message: 'Valid key format',
    })
  }

  return checks
}

/**
 * Optional: Tests database connectivity via authenticated server client
 * Uses a simple existence check on funnels table (no PHI)
 */
async function performDatabaseConnectivityCheck(): Promise<HealthCheckResult> {
  try {
    const supabase = await createServerSupabaseClient()

    // Simple query to check connectivity - just count funnels (no PHI)
    const { error } = await supabase.from('funnels').select('id', { count: 'exact', head: true })

    if (error) {
      return {
        name: 'Database Connectivity',
        pass: false,
        message: `Database query failed: ${error.message}`,
      }
    }

    return {
      name: 'Database Connectivity',
      pass: true,
      message: 'Successfully connected to database',
    }
  } catch (error) {
    return {
      name: 'Database Connectivity',
      pass: false,
      message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}`,
    }
  }
}

export async function GET(request: NextRequest) {
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

    // Determine overall status
    const overallStatus = allChecks.every((check) => check.pass) ? 'pass' : 'fail'

    const response: HealthCheckResponse = {
      checks: allChecks,
      overallStatus,
      timestamp: new Date().toISOString(),
    }

    return successResponse(response)
  } catch (error) {
    console.error('[health/env] Error performing health check:', error)
    return internalErrorResponse('Health check failed')
  }
}
