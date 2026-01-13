import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createHash } from 'crypto'
import { errorResponse, ErrorCode } from './responses'

/**
 * E6.2.4: Idempotency Key Handler
 * 
 * Provides idempotency for write operations to support mobile offline/retry scenarios.
 * 
 * Usage:
 * 1. Client sends Idempotency-Key header (UUID recommended)
 * 2. Server checks if key exists for this user/endpoint
 * 3. If exists: return cached response
 * 4. If conflict (same key, different payload): return 409
 * 5. If new: process request and cache response
 */

const IDEMPOTENCY_KEY_HEADER = 'idempotency-key'
const IDEMPOTENCY_KEY_TTL_HOURS = 24

export type IdempotencyConfig = {
  /**
   * Endpoint path for scoping (e.g., '/api/funnels/stress/assessments')
   * Should be normalized to avoid key collisions
   */
  endpointPath: string

  /**
   * Whether to check request payload for conflicts
   * If true, same key with different payload returns 409
   */
  checkPayloadConflict?: boolean

  /**
   * Custom TTL in hours (default: 24)
   */
  ttlHours?: number
}

/**
 * Extract idempotency key from request headers
 */
export function getIdempotencyKey(request: NextRequest): string | null {
  return request.headers.get(IDEMPOTENCY_KEY_HEADER)
}

/**
 * Compute SHA-256 hash of request payload for conflict detection
 */
export function computePayloadHash(payload: unknown): string {
  const payloadString = JSON.stringify(payload)
  return createHash('sha256').update(payloadString).digest('hex')
}

/**
 * Check if an idempotency key has been used before
 * Returns cached response if found, null if not found, or conflict error if payload differs
 */
export async function checkIdempotencyKey(
  request: NextRequest,
  config: IdempotencyConfig,
  requestPayload?: unknown,
): Promise<NextResponse | null> {
  const idempotencyKey = getIdempotencyKey(request)

  // If no idempotency key provided, continue with normal processing
  if (!idempotencyKey) {
    return null
  }

  const supabase = await createServerSupabaseClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    // If not authenticated, can't check idempotency (no user to scope keys to)
    // This is acceptable because:
    // 1. All write endpoints we protect require authentication
    // 2. Unauthenticated requests will be rejected by the endpoint handler
    // 3. Idempotency is a convenience feature, not a security feature
    return null
  }

  // Look up existing idempotency key
  // TODO(E6.2.4): Remove type assertion after regenerating Supabase types with `npm run db:typegen`
  // Type assertion needed until Supabase types are regenerated
  const { data: existingKey, error } = await (supabase as any)
    .from('idempotency_keys')
    .select('*')
    .eq('user_id', user.id)
    .eq('endpoint_path', config.endpointPath)
    .eq('idempotency_key', idempotencyKey)
    .maybeSingle()

  if (error) {
    console.error('[idempotency] Error checking idempotency key:', error)
    // On error, continue with normal processing
    return null
  }

  // If no existing key, this is a new request
  if (!existingKey) {
    return null
  }

  // If key exists, check for payload conflict
  if (config.checkPayloadConflict && requestPayload) {
    const currentHash = computePayloadHash(requestPayload)

    if (existingKey.request_hash && existingKey.request_hash !== currentHash) {
      // Same idempotency key but different payload = conflict
      return errorResponse(
        ErrorCode.DUPLICATE_OPERATION,
        'Idempotency-Key wurde bereits mit unterschiedlichen Daten verwendet.',
        409,
        {
          idempotencyKey,
          conflictType: 'payload_mismatch',
        },
      )
    }
  }

  // Return cached response
  console.log('[idempotency] Returning cached response for key:', idempotencyKey)

  return NextResponse.json(existingKey.response_body, {
    status: existingKey.response_status,
    headers: {
      'X-Idempotency-Cached': 'true',
    },
  })
}

/**
 * Store idempotency key and response for future duplicate requests
 */
export async function storeIdempotencyKey(
  request: NextRequest,
  config: IdempotencyConfig,
  response: NextResponse,
  requestPayload?: unknown,
): Promise<void> {
  const idempotencyKey = getIdempotencyKey(request)

  // If no idempotency key provided, skip storage
  if (!idempotencyKey) {
    return
  }

  const supabase = await createServerSupabaseClient()

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    console.warn('[idempotency] Cannot store key without authenticated user')
    return
  }

  // Clone response to read body without consuming it
  const responseClone = response.clone()
  let responseBody: unknown

  try {
    // Try to parse as JSON
    responseBody = await responseClone.json()
  } catch (error) {
    // If not JSON, store the response without caching (non-JSON responses aren't idempotent)
    console.warn('[idempotency] Response is not JSON, skipping cache:', error)
    return
  }

  const responseStatus = response.status

  // Compute request hash if payload provided
  const requestHash = requestPayload ? computePayloadHash(requestPayload) : null

  // Calculate expiration
  const ttlHours = config.ttlHours ?? IDEMPOTENCY_KEY_TTL_HOURS
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000).toISOString()

  // Store idempotency key
  // TODO(E6.2.4): Remove type assertion after regenerating Supabase types with `npm run db:typegen`
  // Type assertion needed until Supabase types are regenerated
  const { error } = await (supabase as any).from('idempotency_keys').insert({
    idempotency_key: idempotencyKey,
    user_id: user.id,
    endpoint_path: config.endpointPath,
    http_method: request.method,
    response_status: responseStatus,
    response_body: responseBody,
    request_hash: requestHash,
    expires_at: expiresAt,
  })

  if (error) {
    // If error is duplicate key, that's fine (race condition)
    if (error.code === '23505') {
      console.log('[idempotency] Key already stored (race condition):', idempotencyKey)
      return
    }

    console.error('[idempotency] Error storing idempotency key:', error)
  } else {
    console.log('[idempotency] Stored idempotency key:', idempotencyKey)
  }
}

/**
 * Wrapper function to handle idempotency for an endpoint
 * 
 * Usage:
 * ```ts
 * export async function POST(request: NextRequest) {
 *   return withIdempotency(request, { endpointPath: '/api/example' }, async () => {
 *     // Your normal request handler
 *     const body = await request.json()
 *     // ... process request
 *     return NextResponse.json({ success: true })
 *   })
 * }
 * ```
 */
export async function withIdempotency<T extends NextResponse>(
  request: NextRequest,
  config: IdempotencyConfig,
  handler: () => Promise<T>,
  requestPayload?: unknown,
): Promise<T> {
  // Check for existing idempotency key
  const cachedResponse = await checkIdempotencyKey(request, config, requestPayload)

  if (cachedResponse) {
    return cachedResponse as T
  }

  // Execute handler
  const response = await handler()

  // Store idempotency key for successful requests and conflict errors
  // Cache 2xx success and 409 conflicts (which are deterministic)
  // Don't cache other 4xx (could be temporary validation errors)
  // Don't cache 5xx (server errors should be retryable)
  const shouldCache = 
    (response.status >= 200 && response.status < 300) || // 2xx success
    response.status === 409 // 409 conflict is deterministic

  if (shouldCache) {
    await storeIdempotencyKey(request, config, response, requestPayload)
  }

  return response
}
