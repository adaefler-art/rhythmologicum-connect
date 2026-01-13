# Mobile Caching & Pagination Contract

**Version:** 1.0.0  
**Date:** 2026-01-13  
**Status:** ✅ Active

---

## Overview

This document defines the caching and pagination contract for mobile-friendly catalog and list endpoints in Rhythmologicum Connect. It provides iOS developers with clear guidance on:

- Which endpoints support caching and how to implement it
- Pagination shape and parameters for catalog endpoints
- Cache invalidation strategies
- Deterministic response guarantees

**Purpose:**
- Enable efficient offline-first mobile experiences
- Reduce network bandwidth and API load
- Provide predictable, stable sort orders for pagination
- Support incremental data loading

**Audience:** iOS developers, backend API maintainers, QA engineers

---

## Caching Strategy

### Overview

Caching is implemented using standard HTTP headers that iOS URLCache can automatically handle:

- **`Cache-Control`** — Controls cache behavior and expiration
- **`ETag`** — Entity tag for cache validation
- **`Last-Modified`** — Timestamp of last data modification

### Cacheable Endpoints

| Endpoint | Cache Duration | Cache Headers | Revalidation |
|----------|----------------|---------------|--------------|
| `GET /api/funnels/catalog` | 5 minutes | `Cache-Control`, `ETag`, `Last-Modified` | Supported |
| `GET /api/funnels/catalog/[slug]` | 5 minutes | `Cache-Control`, `ETag`, `Last-Modified` | Supported |
| `GET /api/funnels/[slug]/definition` | 10 minutes | `Cache-Control`, `ETag` | Supported |

**Note:** All other assessment lifecycle endpoints (POST, status checks) are NOT cacheable.

---

## HTTP Cache Headers

### Cache-Control Header

The `Cache-Control` header specifies caching directives:

```http
Cache-Control: public, max-age=300, must-revalidate
```

**Directives:**
- `public` — Response can be cached by any cache (client, CDN)
- `max-age=300` — Cache is fresh for 300 seconds (5 minutes)
- `must-revalidate` — Must check with server before using stale cache

**Example Response:**
```http
HTTP/1.1 200 OK
Cache-Control: public, max-age=300, must-revalidate
ETag: "abc123def456"
Last-Modified: Mon, 13 Jan 2026 14:24:29 GMT
Content-Type: application/json

{
  "success": true,
  "data": { ... }
}
```

### ETag Header

The `ETag` (entity tag) is a unique identifier for the resource version:

```http
ETag: "funnels:v1:2026-01-13T14:24:29Z"
```

**How it works:**
1. Client receives ETag on first request
2. Client stores ETag with cached response
3. On subsequent requests, client sends `If-None-Match: "funnels:v1:2026-01-13T14:24:29Z"`
4. Server returns:
   - `304 Not Modified` if content unchanged (use cache)
   - `200 OK` with new ETag if content changed

**ETag Format:**
```
"<resource>:v<version>:<timestamp>"
```

**Examples:**
- Funnels catalog: `"funnels:v1:2026-01-13T14:24:29Z"`
- Specific funnel: `"funnel:stress:v2:2026-01-13T15:00:00Z"`

### Last-Modified Header

The `Last-Modified` header indicates when the resource was last changed:

```http
Last-Modified: Mon, 13 Jan 2026 14:24:29 GMT
```

**How it works:**
1. Client receives Last-Modified timestamp
2. Client stores timestamp with cached response
3. On subsequent requests, client sends `If-Modified-Since: Mon, 13 Jan 2026 14:24:29 GMT`
4. Server returns:
   - `304 Not Modified` if not modified since timestamp (use cache)
   - `200 OK` with new Last-Modified if changed

---

## iOS URLCache Integration

### Automatic Caching

iOS URLCache automatically handles HTTP cache headers:

```swift
// URLSession configuration with cache
let configuration = URLSessionConfiguration.default
configuration.requestCachePolicy = .useProtocolCachePolicy
configuration.urlCache = URLCache.shared

let session = URLSession(configuration: configuration)
```

### Manual Cache Validation

For explicit cache control:

```swift
// Create request with cache validation
var request = URLRequest(url: catalogURL)
request.cachePolicy = .reloadRevalidatingCacheData

// Check cached response
if let cachedResponse = URLCache.shared.cachedResponse(for: request) {
    // Use cached data if fresh
    if isCacheFresh(cachedResponse) {
        return cachedResponse.data
    }
}

// Fetch new data
let (data, response) = try await session.data(for: request)
```

### Cache Invalidation

Clear cache when:
- User logs out
- User explicitly refreshes
- 401/403 error received (session expired)

```swift
// Clear all cache
URLCache.shared.removeAllCachedResponses()

// Clear specific URL
URLCache.shared.removeCachedResponse(for: request)
```

---

## Pagination Contract

### Overview

Pagination is implemented for catalog endpoints to support:
- Incremental loading of large funnel lists
- Reduced initial load time
- Better memory management on mobile

### Pagination Shape

**Query Parameters:**
- `limit` (optional) — Number of items per page (default: 50, max: 100)
- `cursor` (optional) — Opaque cursor for next page

**Response Format:**
```typescript
{
  "success": true,
  "data": {
    "pillars": [...],          // Current page items
    "uncategorized_funnels": [...],
    "pagination": {
      "limit": 50,             // Items per page
      "hasMore": true,         // More pages available
      "nextCursor": "eyJ0aXRsZSI6IlN0cmVzcyBBc3Nlc3NtZW50Iiwic2x1ZyI6InN0cmVzcyJ9"
    }
  }
}
```

### Cursor-Based Pagination

We use **cursor-based pagination** instead of offset-based for:
- Deterministic results (no skipped/duplicate items)
- Efficient database queries
- Safe for concurrent updates

**Cursor Format:**
```
base64(JSON({ title: "Last Item Title", slug: "last-item-slug" }))
```

**Example:**
```json
{
  "title": "Stress Assessment",
  "slug": "stress"
}
```
Encoded: `eyJ0aXRsZSI6IlN0cmVzcyBBc3Nlc3NtZW50Iiwic2x1ZyI6InN0cmVzcyJ9`

### Pagination Examples

**First Page Request:**
```http
GET /api/funnels/catalog?limit=20
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pillars": [
      {
        "pillar": { "id": "1", "title": "Stress & Resilience" },
        "funnels": [
          { "id": "a1", "slug": "burnout", "title": "Burnout Assessment" },
          { "id": "a2", "slug": "stress", "title": "Stress Assessment" }
        ]
      }
    ],
    "uncategorized_funnels": [],
    "pagination": {
      "limit": 20,
      "hasMore": true,
      "nextCursor": "eyJ0aXRsZSI6IlN0cmVzcyBBc3Nlc3NtZW50Iiwic2x1ZyI6InN0cmVzcyJ9"
    }
  }
}
```

**Next Page Request:**
```http
GET /api/funnels/catalog?limit=20&cursor=eyJ0aXRsZSI6IlN0cmVzcyBBc3Nlc3NtZW50Iiwic2x1ZyI6InN0cmVzcyJ9
```

**Response:**
```json
{
  "success": true,
  "data": {
    "pillars": [...],
    "uncategorized_funnels": [],
    "pagination": {
      "limit": 20,
      "hasMore": false,
      "nextCursor": null
    }
  }
}
```

---

## Stable Sort Order Guarantee

### Deterministic Sorting

All catalog endpoints guarantee **stable, deterministic sort order**:

1. **Primary Sort:** `title` (ascending, case-insensitive)
2. **Secondary Sort:** `slug` (ascending, lexicographic)

This ensures:
- Same query always returns items in same order
- Pagination cursors remain valid
- No duplicate or skipped items across pages

**SQL Example:**
```sql
SELECT * FROM funnels_catalog
WHERE is_active = true
ORDER BY title ASC, slug ASC;
```

### Cursor Stability

**Cursor remains valid when:**
- New funnels added (appear in correct sorted position)
- Existing funnels updated (title/slug unchanged)
- Cache headers unchanged

**Cursor invalidated when:**
- Funnel title/slug changes (affects sort order)
- Funnel deleted (cursor points to non-existent item)

**Handling Invalid Cursors:**
Server returns:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CURSOR",
    "message": "Pagination cursor is invalid or expired. Please start from the first page."
  }
}
```

Client should:
1. Clear cached pages
2. Restart from first page (`cursor=null`)

---

## iOS Client Implementation

### Pagination Client

```swift
class FunnelCatalogClient {
    struct Page {
        let pillars: [PillarWithFunnels]
        let uncategorized: [CatalogFunnel]
        let hasMore: Bool
        let nextCursor: String?
    }
    
    func fetchPage(cursor: String? = nil, limit: Int = 50) async throws -> Page {
        var components = URLComponents(string: "\(baseURL)/api/funnels/catalog")!
        components.queryItems = [
            URLQueryItem(name: "limit", value: "\(limit)")
        ]
        if let cursor = cursor {
            components.queryItems?.append(URLQueryItem(name: "cursor", value: cursor))
        }
        
        let (data, response) = try await session.data(from: components.url!)
        
        // Check cache headers
        if let httpResponse = response as? HTTPURLResponse {
            if let etag = httpResponse.value(forHTTPHeaderField: "ETag") {
                // Store ETag for future validation
                cacheManager.storeETag(etag, for: components.url!)
            }
        }
        
        let decoded = try JSONDecoder().decode(CatalogResponse.self, from: data)
        
        return Page(
            pillars: decoded.data.pillars,
            uncategorized: decoded.data.uncategorized_funnels ?? [],
            hasMore: decoded.data.pagination?.hasMore ?? false,
            nextCursor: decoded.data.pagination?.nextCursor
        )
    }
    
    func fetchAllPages() async throws -> [PillarWithFunnels] {
        var allPillars: [PillarWithFunnels] = []
        var cursor: String? = nil
        
        repeat {
            let page = try await fetchPage(cursor: cursor)
            allPillars.append(contentsOf: page.pillars)
            cursor = page.nextCursor
        } while cursor != nil
        
        return allPillars
    }
}
```

### Cache-Aware Client

```swift
class CachedFunnelCatalogClient {
    func fetchCatalog() async throws -> CatalogResponse {
        let url = URL(string: "\(baseURL)/api/funnels/catalog")!
        var request = URLRequest(url: url)
        
        // Add conditional request headers
        if let etag = cacheManager.getETag(for: url) {
            request.setValue(etag, forHTTPHeaderField: "If-None-Match")
        }
        
        if let lastModified = cacheManager.getLastModified(for: url) {
            request.setValue(lastModified, forHTTPHeaderField: "If-Modified-Since")
        }
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.invalidResponse
        }
        
        // Handle 304 Not Modified
        if httpResponse.statusCode == 304 {
            if let cachedData = cacheManager.getCachedData(for: url) {
                return try JSONDecoder().decode(CatalogResponse.self, from: cachedData)
            }
            throw APIError.cacheError
        }
        
        // Store new cache headers
        if let etag = httpResponse.value(forHTTPHeaderField: "ETag") {
            cacheManager.storeETag(etag, for: url)
        }
        
        if let lastModified = httpResponse.value(forHTTPHeaderField: "Last-Modified") {
            cacheManager.storeLastModified(lastModified, for: url)
        }
        
        // Cache response data
        cacheManager.storeCachedData(data, for: url)
        
        return try JSONDecoder().decode(CatalogResponse.self, from: data)
    }
}
```

---

## Cache Invalidation Strategy

### Automatic Invalidation

Cache is automatically invalidated when:

1. **Time-based expiration** (max-age reached)
2. **Session changes** (user login/logout)
3. **Authentication errors** (401, 403)

### Manual Invalidation

Client should invalidate cache when:

1. **User pull-to-refresh**
   ```swift
   URLCache.shared.removeCachedResponse(for: request)
   ```

2. **User logs out**
   ```swift
   URLCache.shared.removeAllCachedResponses()
   ```

3. **App settings change** (e.g., tier filter)
   ```swift
   cacheManager.clearCatalogCache()
   ```

### Server-Side Invalidation

Server invalidates cache by:
- Updating `ETag` when data changes
- Updating `Last-Modified` timestamp
- Changing `Cache-Control` for urgent updates

**Example: Urgent invalidation**
```http
Cache-Control: no-cache, must-revalidate
```

---

## Error Handling

### Invalid Pagination Cursor

**Request:**
```http
GET /api/funnels/catalog?cursor=invalid_cursor
```

**Response (400):**
```json
{
  "success": false,
  "error": {
    "code": "INVALID_CURSOR",
    "message": "Pagination cursor is invalid or expired. Please restart from the first page.",
    "details": {
      "cursor": "invalid_cursor"
    }
  }
}
```

**Client Action:**
- Clear all cached pages
- Restart pagination from first page
- Optionally show user notification

### Stale Cache

**Request with If-None-Match:**
```http
GET /api/funnels/catalog
If-None-Match: "funnels:v1:2026-01-13T14:00:00Z"
```

**Response (304):**
```http
HTTP/1.1 304 Not Modified
ETag: "funnels:v1:2026-01-13T14:00:00Z"
Cache-Control: public, max-age=300, must-revalidate
```

**Client Action:**
- Use cached response
- Update cache timestamp

### Cache Miss

**Request with If-None-Match (ETag changed):**
```http
GET /api/funnels/catalog
If-None-Match: "funnels:v1:2026-01-13T14:00:00Z"
```

**Response (200):**
```http
HTTP/1.1 200 OK
ETag: "funnels:v2:2026-01-13T15:00:00Z"
Cache-Control: public, max-age=300, must-revalidate

{
  "success": true,
  "data": { ... }
}
```

**Client Action:**
- Replace cached data
- Update ETag in cache metadata

---

## Testing Guide

### Backend Tests

**Test: Cache headers present**
```typescript
it('returns Cache-Control, ETag, and Last-Modified headers', async () => {
  const response = await GET(mockRequest)
  
  expect(response.headers.get('Cache-Control')).toBe('public, max-age=300, must-revalidate')
  expect(response.headers.get('ETag')).toMatch(/^"funnels:v\d+:/)
  expect(response.headers.get('Last-Modified')).toMatch(/^[A-Z][a-z]{2}, \d{2} [A-Z][a-z]{2}/)
})
```

**Test: Pagination returns stable order**
```typescript
it('returns same order for repeated requests', async () => {
  const response1 = await GET(mockRequest)
  const data1 = await response1.json()
  
  const response2 = await GET(mockRequest)
  const data2 = await response2.json()
  
  expect(data1.data.pillars).toEqual(data2.data.pillars)
})
```

**Test: Cursor pagination works**
```typescript
it('supports cursor-based pagination', async () => {
  const page1 = await GET(mockRequest('?limit=2'))
  const data1 = await page1.json()
  
  expect(data1.data.pagination.hasMore).toBe(true)
  expect(data1.data.pagination.nextCursor).toBeTruthy()
  
  const page2 = await GET(mockRequest(`?limit=2&cursor=${data1.data.pagination.nextCursor}`))
  const data2 = await page2.json()
  
  expect(data2.data.pillars).not.toEqual(data1.data.pillars)
})
```

### iOS Tests

**Test: URLCache integration**
```swift
func testURLCacheStoresCatalogResponse() async throws {
    let url = URL(string: "\(baseURL)/api/funnels/catalog")!
    let request = URLRequest(url: url)
    
    // First request
    let _ = try await session.data(for: request)
    
    // Check cache
    let cachedResponse = URLCache.shared.cachedResponse(for: request)
    XCTAssertNotNil(cachedResponse)
}
```

**Test: ETag validation**
```swift
func testETagRevalidation() async throws {
    let client = CachedFunnelCatalogClient()
    
    // First fetch
    let catalog1 = try await client.fetchCatalog()
    
    // Second fetch (should use cache)
    let catalog2 = try await client.fetchCatalog()
    
    XCTAssertEqual(catalog1.data.pillars.count, catalog2.data.pillars.count)
}
```

---

## Performance Considerations

### Cache Hit Rate

**Target metrics:**
- Cache hit rate: >80% for catalog endpoints
- Average response time: <100ms for cache hits
- Bandwidth savings: ~90% for cached responses

**Monitoring:**
```swift
struct CacheMetrics {
    var hits: Int = 0
    var misses: Int = 0
    var hitRate: Double { Double(hits) / Double(hits + misses) }
}
```

### Pagination Performance

**Recommendations:**
- Default page size: 50 items (balances load time and API calls)
- Max page size: 100 items (prevents excessive memory usage)
- Prefetch next page when 80% scrolled

**Example: Prefetch logic**
```swift
func shouldPrefetchNextPage(scrollProgress: Double) -> Bool {
    return scrollProgress > 0.8 && hasMore && !isPrefetching
}
```

---

## Migration Guide

### For Existing iOS Clients

**Step 1: Enable URLCache**
```swift
// Configure URLSession with cache
let configuration = URLSessionConfiguration.default
configuration.urlCache = URLCache.shared
configuration.requestCachePolicy = .useProtocolCachePolicy
```

**Step 2: Update Catalog Fetch**
```swift
// Old: No caching
func fetchCatalog() async throws -> CatalogResponse {
    let url = URL(string: "\(baseURL)/api/funnels/catalog")!
    let (data, _) = try await session.data(from: url)
    return try JSONDecoder().decode(CatalogResponse.self, from: data)
}

// New: With cache validation
func fetchCatalog() async throws -> CatalogResponse {
    var request = URLRequest(url: catalogURL)
    request.cachePolicy = .useProtocolCachePolicy  // Respect server cache headers
    
    let (data, response) = try await session.data(for: request)
    return try JSONDecoder().decode(CatalogResponse.self, from: data)
}
```

**Step 3: Add Pagination Support (Optional)**
```swift
// Update model to include pagination
struct CatalogResponse: Codable {
    let success: Bool
    let data: CatalogData
    
    struct CatalogData: Codable {
        let pillars: [PillarWithFunnels]
        let uncategorized_funnels: [CatalogFunnel]?
        let pagination: Pagination?  // NEW
    }
    
    struct Pagination: Codable {
        let limit: Int
        let hasMore: Bool
        let nextCursor: String?
    }
}
```

**Step 4: Implement Cache Invalidation**
```swift
// On logout
func logout() {
    authManager.clearSession()
    URLCache.shared.removeAllCachedResponses()
    coordinator.showLogin()
}
```

---

## Appendix: Technical Details

### ETag Generation Algorithm

```typescript
function generateETag(data: CatalogData, version: string): string {
  const timestamp = getLastModifiedTimestamp(data)
  return `"funnels:v${version}:${timestamp}"`
}

function getLastModifiedTimestamp(data: CatalogData): string {
  // Find most recent update across all funnels
  const timestamps = data.pillars.flatMap(p => 
    p.funnels.map(f => f.updated_at)
  )
  return new Date(Math.max(...timestamps.map(t => new Date(t).getTime())))
    .toISOString()
}
```

### Cursor Encoding/Decoding

```typescript
// Encode cursor
function encodeCursor(lastItem: { title: string; slug: string }): string {
  return Buffer.from(JSON.stringify(lastItem)).toString('base64')
}

// Decode cursor
function decodeCursor(cursor: string): { title: string; slug: string } | null {
  try {
    const decoded = Buffer.from(cursor, 'base64').toString('utf-8')
    return JSON.parse(decoded)
  } catch {
    return null
  }
}
```

### Cache Control Values

| Endpoint | Cache-Control | Reasoning |
|----------|---------------|-----------|
| Catalog | `public, max-age=300, must-revalidate` | Public data, 5 min cache, validate before use |
| Definition | `public, max-age=600, must-revalidate` | Rarely changes, 10 min cache |
| Assessment Status | `no-store` | Dynamic state, never cache |

---

## Document Metadata

**Version:** 1.0.0  
**Last Updated:** 2026-01-13  
**Authors:** Backend API Team  
**Reviewers:** Mobile Team, QA Team  
**Status:** ✅ Active

**Related Documents:**
- `docs/mobile/MOBILE_API_SURFACE.md` — Complete API surface for iOS
- `docs/PATIENT_API_CONTRACTS.md` — Patient endpoint contracts
- `docs/API_ROUTE_OWNERSHIP.md` — API route ownership

**Change Log:**
- 2026-01-13: Initial version (1.0.0) for E6.2.7
