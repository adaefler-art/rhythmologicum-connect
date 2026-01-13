/**
 * Tests for HTTP Caching and Pagination Utilities
 * E6.2.7: Mobile-friendly caching and pagination
 */

import {
  generateETag,
  generateLastModified,
  generateCacheControl,
  checkETagMatch,
  checkNotModifiedSince,
  encodeCursor,
  decodeCursor,
  createPaginationMetadata,
  findMostRecentTimestamp,
  type PaginationCursor,
} from '../caching'

describe('generateETag', () => {
  it('generates ETag with resource, version, and timestamp', () => {
    const etag = generateETag('funnels', '1', '2026-01-13T14:24:29Z')
    expect(etag).toBe('"funnels:v1:2026-01-13T14:24:29Z"')
  })

  it('handles Date objects', () => {
    const date = new Date('2026-01-13T14:24:29Z')
    const etag = generateETag('funnels', '1', date)
    expect(etag).toBe('"funnels:v1:2026-01-13T14:24:29.000Z"')
  })

  it('includes quotes around ETag value', () => {
    const etag = generateETag('test', '2', '2026-01-13T00:00:00Z')
    expect(etag.startsWith('"')).toBe(true)
    expect(etag.endsWith('"')).toBe(true)
  })
})

describe('generateLastModified', () => {
  it('generates HTTP date format from ISO string', () => {
    const lastModified = generateLastModified('2026-01-13T14:24:29Z')
    expect(lastModified).toMatch(/^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2} \d{4}/)
  })

  it('handles Date objects', () => {
    const date = new Date('2026-01-13T14:24:29Z')
    const lastModified = generateLastModified(date)
    expect(lastModified).toBe('Tue, 13 Jan 2026 14:24:29 GMT')
  })
})

describe('generateCacheControl', () => {
  it('generates public cache control with max-age and must-revalidate', () => {
    const cacheControl = generateCacheControl(300, true, true)
    expect(cacheControl).toBe('public, max-age=300, must-revalidate')
  })

  it('generates private cache control', () => {
    const cacheControl = generateCacheControl(60, false, true)
    expect(cacheControl).toBe('private, max-age=60, must-revalidate')
  })

  it('omits must-revalidate when false', () => {
    const cacheControl = generateCacheControl(300, true, false)
    expect(cacheControl).toBe('public, max-age=300')
  })

  it('handles zero max-age', () => {
    const cacheControl = generateCacheControl(0, true, false)
    expect(cacheControl).toBe('public, max-age=0')
  })
})

describe('checkETagMatch', () => {
  it('returns true when If-None-Match matches ETag', () => {
    const request = new Request('https://example.com', {
      headers: { 'If-None-Match': '"funnels:v1:2026-01-13T14:24:29Z"' },
    })
    const match = checkETagMatch(request, '"funnels:v1:2026-01-13T14:24:29Z"')
    expect(match).toBe(true)
  })

  it('returns false when If-None-Match does not match', () => {
    const request = new Request('https://example.com', {
      headers: { 'If-None-Match': '"funnels:v1:old-timestamp"' },
    })
    const match = checkETagMatch(request, '"funnels:v1:new-timestamp"')
    expect(match).toBe(false)
  })

  it('returns false when If-None-Match header missing', () => {
    const request = new Request('https://example.com')
    const match = checkETagMatch(request, '"funnels:v1:2026-01-13T14:24:29Z"')
    expect(match).toBe(false)
  })
})

describe('checkNotModifiedSince', () => {
  it('returns true when resource not modified since client timestamp', () => {
    const lastModified = new Date('2026-01-13T14:24:29Z')
    const request = new Request('https://example.com', {
      headers: { 'If-Modified-Since': 'Mon, 13 Jan 2026 14:24:29 GMT' },
    })
    const notModified = checkNotModifiedSince(request, lastModified)
    expect(notModified).toBe(true)
  })

  it('returns false when resource modified after client timestamp', () => {
    const lastModified = new Date('2026-01-13T15:00:00Z')
    const request = new Request('https://example.com', {
      headers: { 'If-Modified-Since': 'Mon, 13 Jan 2026 14:24:29 GMT' },
    })
    const notModified = checkNotModifiedSince(request, lastModified)
    expect(notModified).toBe(false)
  })

  it('returns false when If-Modified-Since header missing', () => {
    const lastModified = new Date('2026-01-13T14:24:29Z')
    const request = new Request('https://example.com')
    const notModified = checkNotModifiedSince(request, lastModified)
    expect(notModified).toBe(false)
  })

  it('returns false when If-Modified-Since header is invalid', () => {
    const lastModified = new Date('2026-01-13T14:24:29Z')
    const request = new Request('https://example.com', {
      headers: { 'If-Modified-Since': 'invalid-date' },
    })
    const notModified = checkNotModifiedSince(request, lastModified)
    expect(notModified).toBe(false)
  })

  it('ignores milliseconds when comparing timestamps', () => {
    const lastModified = new Date('2026-01-13T14:24:29.999Z')
    const request = new Request('https://example.com', {
      headers: { 'If-Modified-Since': 'Mon, 13 Jan 2026 14:24:29 GMT' },
    })
    const notModified = checkNotModifiedSince(request, lastModified)
    expect(notModified).toBe(true)
  })
})

describe('encodeCursor / decodeCursor', () => {
  it('encodes and decodes cursor correctly', () => {
    const cursor: PaginationCursor = { title: 'Stress Assessment', slug: 'stress' }
    const encoded = encodeCursor(cursor)
    const decoded = decodeCursor(encoded)
    expect(decoded).toEqual(cursor)
  })

  it('encodes to base64 string', () => {
    const cursor: PaginationCursor = { title: 'Test', slug: 'test' }
    const encoded = encodeCursor(cursor)
    expect(encoded).toMatch(/^[A-Za-z0-9+/=]+$/)
  })

  it('returns null for invalid base64', () => {
    const decoded = decodeCursor('invalid!!!base64')
    expect(decoded).toBeNull()
  })

  it('returns null for malformed JSON', () => {
    const invalidJson = Buffer.from('{invalid json}', 'utf-8').toString('base64')
    const decoded = decodeCursor(invalidJson)
    expect(decoded).toBeNull()
  })

  it('returns null when cursor missing required fields', () => {
    const incomplete = Buffer.from(JSON.stringify({ title: 'Test' }), 'utf-8').toString('base64')
    const decoded = decodeCursor(incomplete)
    expect(decoded).toBeNull()
  })

  it('handles special characters in title/slug', () => {
    const cursor: PaginationCursor = {
      title: 'Special: Ümläüt & Spëcial',
      slug: 'special-umlaut-special',
    }
    const encoded = encodeCursor(cursor)
    const decoded = decodeCursor(encoded)
    expect(decoded).toEqual(cursor)
  })
})

describe('createPaginationMetadata', () => {
  type TestItem = { id: string; title: string; slug: string }

  it('creates metadata with hasMore true when more items available', () => {
    const items: TestItem[] = [
      { id: '1', title: 'A', slug: 'a' },
      { id: '2', title: 'B', slug: 'b' },
    ]
    const metadata = createPaginationMetadata(
      items,
      2,
      3, // totalFetched > limit
      (item) => ({ title: item.title, slug: item.slug }),
    )

    expect(metadata.limit).toBe(2)
    expect(metadata.hasMore).toBe(true)
    expect(metadata.nextCursor).toBeTruthy()
  })

  it('creates metadata with hasMore false when no more items', () => {
    const items: TestItem[] = [{ id: '1', title: 'A', slug: 'a' }]
    const metadata = createPaginationMetadata(
      items,
      2,
      1, // totalFetched <= limit
      (item) => ({ title: item.title, slug: item.slug }),
    )

    expect(metadata.limit).toBe(2)
    expect(metadata.hasMore).toBe(false)
    expect(metadata.nextCursor).toBeNull()
  })

  it('generates nextCursor from last item', () => {
    const items: TestItem[] = [
      { id: '1', title: 'A', slug: 'a' },
      { id: '2', title: 'B', slug: 'b' },
    ]
    const metadata = createPaginationMetadata(
      items,
      2,
      3,
      (item) => ({ title: item.title, slug: item.slug }),
    )

    expect(metadata.nextCursor).toBeTruthy()
    const decoded = decodeCursor(metadata.nextCursor!)
    expect(decoded).toEqual({ title: 'B', slug: 'b' })
  })

  it('returns null cursor for empty items', () => {
    const items: TestItem[] = []
    const metadata = createPaginationMetadata(items, 10, 0, (item) => ({
      title: item.title,
      slug: item.slug,
    }))

    expect(metadata.hasMore).toBe(false)
    expect(metadata.nextCursor).toBeNull()
  })
})

describe('findMostRecentTimestamp', () => {
  it('finds most recent timestamp from array', () => {
    const timestamps = [
      '2026-01-13T14:00:00Z',
      '2026-01-13T15:00:00Z',
      '2026-01-13T14:30:00Z',
    ]
    const mostRecent = findMostRecentTimestamp(timestamps)
    expect(mostRecent.toISOString()).toBe('2026-01-13T15:00:00.000Z')
  })

  it('handles Date objects', () => {
    const timestamps = [
      new Date('2026-01-13T14:00:00Z'),
      new Date('2026-01-13T15:00:00Z'),
      new Date('2026-01-13T14:30:00Z'),
    ]
    const mostRecent = findMostRecentTimestamp(timestamps)
    expect(mostRecent.toISOString()).toBe('2026-01-13T15:00:00.000Z')
  })

  it('handles mixed Date objects and strings', () => {
    const timestamps = [
      '2026-01-13T14:00:00Z',
      new Date('2026-01-13T15:00:00Z'),
      '2026-01-13T14:30:00Z',
    ]
    const mostRecent = findMostRecentTimestamp(timestamps)
    expect(mostRecent.toISOString()).toBe('2026-01-13T15:00:00.000Z')
  })

  it('filters out null values', () => {
    const timestamps = ['2026-01-13T14:00:00Z', null, '2026-01-13T15:00:00Z', null]
    const mostRecent = findMostRecentTimestamp(timestamps)
    expect(mostRecent.toISOString()).toBe('2026-01-13T15:00:00.000Z')
  })

  it('returns current date for empty array', () => {
    const mostRecent = findMostRecentTimestamp([])
    const now = new Date()
    // Allow 1 second difference for test execution time
    expect(Math.abs(mostRecent.getTime() - now.getTime())).toBeLessThan(1000)
  })

  it('returns current date for all null array', () => {
    const mostRecent = findMostRecentTimestamp([null, null, null])
    const now = new Date()
    expect(Math.abs(mostRecent.getTime() - now.getTime())).toBeLessThan(1000)
  })

  it('handles invalid date strings', () => {
    const timestamps = ['2026-01-13T14:00:00Z', 'invalid-date', '2026-01-13T15:00:00Z']
    const mostRecent = findMostRecentTimestamp(timestamps)
    expect(mostRecent.toISOString()).toBe('2026-01-13T15:00:00.000Z')
  })
})
