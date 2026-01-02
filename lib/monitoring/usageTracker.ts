/**
 * TV05_01: Runtime Usage Telemetry (PHI-free)
 * 
 * Minimal, PHI-free usage tracker for API routes and operations.
 * Tracks usage metrics to help identify truly unused endpoints.
 * 
 * Storage: File-based aggregation (deterministic, low-risk)
 * No PHI: Only tracks routeKey, statusCodeBucket, env, count, lastSeenAt
 */

import fs from 'fs/promises'
import path from 'path'

import { env } from '@/lib/env'

export type StatusCodeBucket = '2xx' | '3xx' | '4xx' | '5xx'

export type UsageEvent = {
  routeKey: string
  statusCodeBucket: StatusCodeBucket
  env: string
  timestamp: string
}

export type AggregatedUsage = {
  routeKey: string
  count: number
  lastSeenAt: string
  statusBuckets: Record<StatusCodeBucket, number>
  env: string
}

const USAGE_DATA_DIR = path.join(process.cwd(), '.usage-telemetry')
const USAGE_DATA_FILE = path.join(USAGE_DATA_DIR, 'usage-data.json')

/**
 * Determines status code bucket from HTTP status code
 */
export function getStatusCodeBucket(statusCode: number): StatusCodeBucket {
  if (statusCode >= 200 && statusCode < 300) return '2xx'
  if (statusCode >= 300 && statusCode < 400) return '3xx'
  if (statusCode >= 400 && statusCode < 500) return '4xx'
  return '5xx'
}

/**
 * Get current environment (development, production, etc.)
 */
function getEnvironment(): string {
  return env.NODE_ENV || 'development'
}

/**
 * Ensure usage data directory exists
 */
async function ensureUsageDataDir(): Promise<void> {
  try {
    await fs.mkdir(USAGE_DATA_DIR, { recursive: true })
  } catch (error) {
    // Directory might already exist, ignore error
    console.warn('[usageTracker] Failed to create usage data directory:', error)
  }
}

/**
 * Load current usage data from file
 */
async function loadUsageData(): Promise<Map<string, AggregatedUsage>> {
  try {
    const data = await fs.readFile(USAGE_DATA_FILE, 'utf-8')
    const parsed = JSON.parse(data) as AggregatedUsage[]
    return new Map(parsed.map((item) => [item.routeKey, item]))
  } catch {
    // File doesn't exist yet or is corrupted, return empty map
    return new Map()
  }
}

/**
 * Save usage data to file
 */
async function saveUsageData(data: Map<string, AggregatedUsage>): Promise<void> {
  try {
    await ensureUsageDataDir()
    const array = Array.from(data.values())
    await fs.writeFile(USAGE_DATA_FILE, JSON.stringify(array, null, 2), 'utf-8')
  } catch (error) {
    console.error('[usageTracker] Failed to save usage data:', error)
  }
}

/**
 * Record a usage event for an API route
 * 
 * @param params - Usage event parameters
 * @param params.routeKey - Route identifier (e.g., 'POST /api/amy/stress-report')
 * @param params.statusCodeBucket - HTTP status code bucket ('2xx', '3xx', '4xx', '5xx')
 * @param params.env - Environment (optional, defaults to NODE_ENV)
 * 
 * @example
 * ```typescript
 * await recordUsage({
 *   routeKey: 'POST /api/amy/stress-report',
 *   statusCodeBucket: '2xx',
 *   env: 'production',
 * })
 * ```
 */
export async function recordUsage(params: {
  routeKey: string
  statusCodeBucket: StatusCodeBucket
  env?: string
}): Promise<void> {
  const env = params.env || getEnvironment()
  const timestamp = new Date().toISOString()

  try {
    const data = await loadUsageData()

    const existing = data.get(params.routeKey)

    if (existing) {
      // Update existing entry
      existing.count += 1
      existing.lastSeenAt = timestamp
      existing.statusBuckets[params.statusCodeBucket] =
        (existing.statusBuckets[params.statusCodeBucket] || 0) + 1
    } else {
      // Create new entry
      data.set(params.routeKey, {
        routeKey: params.routeKey,
        count: 1,
        lastSeenAt: timestamp,
        statusBuckets: {
          '2xx': params.statusCodeBucket === '2xx' ? 1 : 0,
          '3xx': params.statusCodeBucket === '3xx' ? 1 : 0,
          '4xx': params.statusCodeBucket === '4xx' ? 1 : 0,
          '5xx': params.statusCodeBucket === '5xx' ? 1 : 0,
        },
        env,
      })
    }

    await saveUsageData(data)
  } catch (error) {
    // Don't fail the request if telemetry fails
    console.error('[usageTracker] Failed to record usage:', error)
  }
}

/**
 * Get aggregated usage data for all tracked routes
 * 
 * @returns Array of aggregated usage data
 */
export async function getAggregatedUsage(): Promise<AggregatedUsage[]> {
  const data = await loadUsageData()
  return Array.from(data.values()).sort((a, b) => {
    // Sort by lastSeenAt descending (most recent first)
    return new Date(b.lastSeenAt).getTime() - new Date(a.lastSeenAt).getTime()
  })
}

/**
 * Clear all usage data (useful for testing)
 */
export async function clearUsageData(): Promise<void> {
  try {
    await fs.unlink(USAGE_DATA_FILE)
  } catch {
    // File might not exist, ignore error
  }
}
