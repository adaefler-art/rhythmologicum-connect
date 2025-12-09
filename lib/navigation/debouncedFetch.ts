/**
 * B3: Request Debouncing for Navigation
 * 
 * Prevents race conditions from rapid navigation requests (e.g., fast swipes).
 * Ensures only the most recent navigation intent is processed.
 */

type PendingRequest = {
  timestamp: number
  controller: AbortController
}

// Store pending requests by key (e.g., assessmentId)
const pendingRequests = new Map<string, PendingRequest>()

/**
 * Debounced fetch for navigation requests.
 * Cancels previous pending requests for the same key.
 * 
 * @param key - Unique identifier for the request (e.g., assessmentId)
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param debounceMs - Debounce delay in milliseconds (default: 100ms)
 * @returns Promise that resolves with the fetch response
 */
export async function debouncedNavigationFetch(
  key: string,
  url: string,
  options?: RequestInit,
  debounceMs: number = 100,
): Promise<Response> {
  // Cancel any pending request for this key
  const pending = pendingRequests.get(key)
  if (pending) {
    pending.controller.abort()
    pendingRequests.delete(key)
  }

  // Create new abort controller for this request
  const controller = new AbortController()
  pendingRequests.set(key, {
    timestamp: Date.now(),
    controller,
  })

  // Wait for debounce period
  await new Promise((resolve) => setTimeout(resolve, debounceMs))

  // Check if this request is still the latest
  const current = pendingRequests.get(key)
  if (current?.controller !== controller) {
    // A newer request has superseded this one
    throw new Error('Request superseded by newer request')
  }

  try {
    // Perform the actual fetch with abort signal
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })

    // Clean up after successful fetch
    pendingRequests.delete(key)
    return response
  } catch (error) {
    // Clean up after error (but not if aborted by us)
    if (error instanceof Error && error.name !== 'AbortError') {
      pendingRequests.delete(key)
    }
    throw error
  }
}

/**
 * Throttled fetch for navigation requests.
 * Ensures minimum time between requests.
 * 
 * @param key - Unique identifier for the request
 * @param url - URL to fetch
 * @param options - Fetch options
 * @param throttleMs - Minimum time between requests (default: 150ms)
 * @returns Promise that resolves with the fetch response or null if throttled
 */
export async function throttledNavigationFetch(
  key: string,
  url: string,
  options?: RequestInit,
  throttleMs: number = 150,
): Promise<Response | null> {
  const pending = pendingRequests.get(key)
  
  if (pending) {
    const elapsed = Date.now() - pending.timestamp
    if (elapsed < throttleMs) {
      // Too soon - reject this request
      return null
    }
  }

  // Update timestamp
  const controller = new AbortController()
  pendingRequests.set(key, {
    timestamp: Date.now(),
    controller,
  })

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    })
    return response
  } catch (error) {
    throw error
  }
}

/**
 * Clear all pending navigation requests.
 * Useful for cleanup on component unmount.
 */
export function clearPendingNavigationRequests(): void {
  pendingRequests.forEach((pending) => {
    pending.controller.abort()
  })
  pendingRequests.clear()
}

/**
 * Clear pending requests for a specific key.
 * 
 * @param key - Request key to clear
 */
export function clearPendingRequest(key: string): void {
  const pending = pendingRequests.get(key)
  if (pending) {
    pending.controller.abort()
    pendingRequests.delete(key)
  }
}
