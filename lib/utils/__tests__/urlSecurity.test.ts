/**
 * URL Security Tests (V05-I06.2 Hardening)
 * 
 * Tests for URL validation and sanitization
 */

import {
  isValidUrl,
  sanitizeUrl,
  getSafeLinkProps,
} from '../urlSecurity'

describe('URL Security', () => {
  describe('isValidUrl', () => {
    it('should accept valid HTTP URLs', () => {
      expect(isValidUrl('http://example.com')).toBe(true)
      expect(isValidUrl('https://example.com')).toBe(true)
      expect(isValidUrl('https://example.com/path')).toBe(true)
      expect(isValidUrl('https://example.com/path?query=value')).toBe(true)
    })

    it('should accept valid relative URLs', () => {
      expect(isValidUrl('/path/to/page')).toBe(true)
      expect(isValidUrl('./relative/path')).toBe(true)
      expect(isValidUrl('../parent/path')).toBe(true)
      expect(isValidUrl('page.html')).toBe(true)
      expect(isValidUrl('#anchor')).toBe(true)
    })

    it('should accept mailto and tel URLs', () => {
      expect(isValidUrl('mailto:test@example.com')).toBe(true)
      expect(isValidUrl('tel:+1234567890')).toBe(true)
    })

    it('should reject javascript: URLs (XSS)', () => {
      expect(isValidUrl('javascript:alert(1)')).toBe(false)
      expect(isValidUrl('JavaScript:alert(1)')).toBe(false)
      expect(isValidUrl('JAVASCRIPT:alert(1)')).toBe(false)
      expect(isValidUrl(' javascript:alert(1)')).toBe(false)
    })

    it('should reject data: URLs by default (XSS)', () => {
      expect(isValidUrl('data:text/html,<script>alert(1)</script>')).toBe(false)
      expect(isValidUrl('data:image/png;base64,iVBORw0KG...')).toBe(false)
    })

    it('should allow data: URLs when explicitly enabled', () => {
      expect(isValidUrl('data:image/png;base64,iVBORw0KG...', true)).toBe(true)
      expect(isValidUrl('data:text/html,<script>alert(1)</script>', true)).toBe(true)
    })

    it('should reject vbscript: URLs (XSS)', () => {
      expect(isValidUrl('vbscript:msgbox(1)')).toBe(false)
      expect(isValidUrl('VBScript:msgbox(1)')).toBe(false)
    })

    it('should reject file: URLs (local file access)', () => {
      expect(isValidUrl('file:///etc/passwd')).toBe(false)
      expect(isValidUrl('file://C:/Windows/System32')).toBe(false)
    })

    it('should reject overly long URLs (DoS)', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(3000)
      expect(isValidUrl(longUrl)).toBe(false)
    })

    it('should reject null/undefined/empty', () => {
      expect(isValidUrl(undefined)).toBe(false)
      expect(isValidUrl(null as any)).toBe(false)
      expect(isValidUrl('')).toBe(false)
      expect(isValidUrl('   ')).toBe(false)
    })

    it('should reject non-string values', () => {
      expect(isValidUrl(123 as any)).toBe(false)
      expect(isValidUrl({} as any)).toBe(false)
      expect(isValidUrl([] as any)).toBe(false)
    })
  })

  describe('sanitizeUrl', () => {
    it('should return valid URLs unchanged', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com')
      expect(sanitizeUrl('/path/to/page')).toBe('/path/to/page')
    })

    it('should return fallback for invalid URLs', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBe('#')
      expect(sanitizeUrl('javascript:alert(1)', '/fallback')).toBe('/fallback')
    })

    it('should return fallback for data: URLs when not allowed', () => {
      expect(sanitizeUrl('data:image/png;base64,...')).toBe('#')
    })

    it('should return data: URLs when explicitly allowed', () => {
      const dataUrl = 'data:image/png;base64,...'
      expect(sanitizeUrl(dataUrl, '#', true)).toBe(dataUrl)
    })
  })

  describe('getSafeLinkProps', () => {
    it('should return href for internal links', () => {
      const props = getSafeLinkProps('/internal/page')
      expect(props.href).toBe('/internal/page')
      expect(props.rel).toBeUndefined()
      expect(props.target).toBeUndefined()
    })

    it('should add security attributes for external HTTP links', () => {
      const props = getSafeLinkProps('http://example.com')
      expect(props.href).toBe('http://example.com')
      expect(props.rel).toBe('noopener noreferrer')
      expect(props.target).toBe('_blank')
    })

    it('should add security attributes for external HTTPS links', () => {
      const props = getSafeLinkProps('https://example.com')
      expect(props.href).toBe('https://example.com')
      expect(props.rel).toBe('noopener noreferrer')
      expect(props.target).toBe('_blank')
    })

    it('should sanitize dangerous URLs to fallback', () => {
      const props = getSafeLinkProps('javascript:alert(1)')
      expect(props.href).toBe('#')
      expect(props.rel).toBeUndefined()
    })

    it('should handle relative URLs', () => {
      const props = getSafeLinkProps('../page')
      expect(props.href).toBe('../page')
      expect(props.rel).toBeUndefined()
    })
  })
})
