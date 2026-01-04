/**
 * URL Security Validation (V05-I06.2 Hardening)
 * 
 * Validates URLs to prevent XSS and other security issues
 * Denies javascript:, data:, vbscript:, and other dangerous protocols
 */

/**
 * Allowed URL protocols for content blocks
 */
const ALLOWED_PROTOCOLS = ['http:', 'https:', 'mailto:', 'tel:']

/**
 * Maximum URL length to prevent buffer overflow attacks
 */
const MAX_URL_LENGTH = 2048

/**
 * Validates a URL for security
 * 
 * Rejects:
 * - javascript: URLs (XSS)
 * - data: URLs (unless explicitly allowed)
 * - vbscript: URLs (XSS)
 * - file: URLs (local file access)
 * - Overly long URLs (DoS)
 * 
 * @param url - URL to validate
 * @param allowDataUrls - Whether to allow data: URLs (default: false)
 * @returns true if URL is safe, false otherwise
 */
export function isValidUrl(url: string | undefined, allowDataUrls = false): boolean {
  if (!url || typeof url !== 'string') {
    return false
  }

  // Check length
  if (url.length > MAX_URL_LENGTH) {
    return false
  }

  // Trim and normalize
  const trimmed = url.trim().toLowerCase()

  // Empty after trim
  if (trimmed.length === 0) {
    return false
  }

  // Check for dangerous protocols (always forbidden)
  const dangerousProtocols = ['javascript:', 'vbscript:', 'file:', 'about:']
  
  for (const protocol of dangerousProtocols) {
    if (trimmed.startsWith(protocol)) {
      return false
    }
  }

  // Handle data: URLs separately
  if (trimmed.startsWith('data:')) {
    return allowDataUrls
  }

  // Relative URLs are OK (start with /, ./, ../)
  if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
    return true
  }

  // Check for allowed protocols
  try {
    const parsed = new URL(url)
    return ALLOWED_PROTOCOLS.includes(parsed.protocol)
  } catch {
    // If URL parsing fails, allow relative URLs that don't look suspicious
    // This handles cases like "page.html" or "#anchor"
    return !trimmed.includes(':')
  }
}

/**
 * Sanitizes a URL by returning it only if valid, otherwise returns fallback
 * 
 * @param url - URL to sanitize
 * @param fallback - Fallback URL if invalid (default: '#')
 * @param allowDataUrls - Whether to allow data: URLs (default: false)
 * @returns Sanitized URL or fallback
 */
export function sanitizeUrl(
  url: string | undefined,
  fallback = '#',
  allowDataUrls = false,
): string {
  return isValidUrl(url, allowDataUrls) ? url! : fallback
}

/**
 * Gets safe link props for external links
 * Adds rel="noopener noreferrer" for external links
 * 
 * @param href - Link href
 * @returns Object with href and optional rel/target
 */
export function getSafeLinkProps(href: string): {
  href: string
  rel?: string
  target?: string
} {
  const sanitized = sanitizeUrl(href)

  // Check if external link (starts with http:// or https://)
  const isExternal =
    sanitized.startsWith('http://') || sanitized.startsWith('https://')

  if (isExternal) {
    return {
      href: sanitized,
      rel: 'noopener noreferrer',
      target: '_blank',
    }
  }

  return { href: sanitized }
}
