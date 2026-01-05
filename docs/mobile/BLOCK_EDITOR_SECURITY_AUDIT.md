# V05-I06.4 Visual Block Editor - Security Hardening Evidence

**Date**: 2026-01-05  
**Reviewer**: GitHub Copilot  
**Target**: Visual Block Editor Implementation

## Package 1 — Evidence & Risk Scan

### 1. RBAC Configuration

**GET /api/admin/funnel-versions/[id]/manifest**
- **Lines 54-69**: Auth gate → Authorization gate → Business logic
- **Allowed roles**: `clinician` OR `admin`
- **Auth check order**: ✅ CORRECT (auth before body parsing)
- **Fail-closed**: ✅ Returns 403 for unauthorized roles

**PUT /api/admin/funnel-versions/[id]/manifest**
- **Lines 171-186**: Auth gate → Authorization gate → Business logic
- **Allowed roles**: `clinician` OR `admin`
- **Auth check order**: ✅ CORRECT (auth before body parsing)
- **Fail-closed**: ✅ Returns 403 for unauthorized roles

**Issue**: Nurse role is not explicitly mentioned in requirements. Current implementation allows only `clinician` or `admin`.

### 2. Audit Logging Safety

**Current audit log (lines 268-278)**:
```typescript
metadata: {
  field: 'content_manifest',
  page_count: validatedManifest.pages.length,
}
```

**Analysis**:
- ❌ **ISSUE**: No manifest hash recorded
- ✅ **GOOD**: Raw manifest NOT logged in metadata
- ❌ **ISSUE**: Full manifest IS returned in success response (line 291-296), which could be logged elsewhere

**Risk**: If error logging captures response bodies, manifest content could leak into logs.

### 3. Payload Hardening

**Request size limits**:
- ❌ **MISSING**: No explicit payload size limit (HTTP 413)
- ❌ **MISSING**: No Content-Length header check

**Schema bounds** (from FunnelContentManifestSchema):
- ✅ Pages: max 50
- ✅ Sections per page: max 100
- ✅ Assets: max 200
- ✅ String fields: bounded (key: 200, url: 2048, title: 500, description: 2000)
- ✅ Strict mode enabled (no unknown keys)

**Risk**: Large payloads could cause memory/CPU DoS before schema validation.

### 4. Deterministic Ordering

**Current implementation**:
- Array order preserved in manifest storage
- `orderIndex` field supported but optional
- No explicit sorting in API layer

**Analysis**:
- ✅ **GOOD**: Array order preserved through JSON serialization
- ⚠️ **AMBIGUOUS**: No documented tie-breaker if `orderIndex` values collide
- ⚠️ **AMBIGUOUS**: Client-side reordering updates `orderIndex`, but no server-side enforcement

**Risk**: Low - array order is deterministic, but `orderIndex` behavior could be more explicit.

### 5. Link/Markdown Safety

**CTA Block (CTABlockRenderer.tsx)**:
- ✅ Uses `getSafeLinkProps()` utility (line 65)
- ✅ URL validation implemented
- ✅ External links get `rel="noopener noreferrer"`

**Markdown Block (MarkdownBlockRenderer.tsx)**:
- ✅ `skipHtml: true` - raw HTML disabled (line 71)
- ✅ Custom SafeLink component adds `rel="noopener noreferrer"` (lines 28-45)
- ✅ `target="_blank"` for external links

**Editor UI (editor/page.tsx)**:
- ❌ **ISSUE**: No client-side URL validation before save
- ❌ **ISSUE**: User can input `javascript:` URLs in CTA href field
- ⚠️ **PARTIAL**: Schema validation happens on server, but no schema-level URL validation

**Risk**: Medium - malicious URLs could be saved and only caught by renderer. Need schema-level URL validation.

### 6. Size Limits & DoS Protection

**Current state**:
- ✅ Schema enforces array/string bounds
- ❌ No request body size limit (could accept multi-MB payloads)
- ❌ No rate limiting

**Calculation**:
- Max pages: 50
- Max sections per page: 100
- Max content field size: ~2048 chars per URL field
- Theoretical max payload: ~10-50 MB (if all fields at max)

**Risk**: High - large payloads could cause memory exhaustion before schema validation.

## Package 2 — Required Fixes

### A. RBAC Correctness ✅
**Status**: CORRECT - auth happens before body parsing, fail-closed on unknown roles.

### B. Audit Logging Safety ❌
**Required**: Add manifest hash to audit log, remove manifest from success response metadata.

### C. Payload Hardening ❌
**Required**: 
1. Add request body size limit (10 MB max)
2. Add schema-level URL validation to reject `javascript:`, `data:`, `vbscript:` schemes

### D. Deterministic Ordering ⚠️
**Recommended**: Document ordering contract explicitly (array order is canonical).

### E. Link/Markdown Safety ❌
**Required**: Add Zod URL validator to schema for `href` and `url` fields.

### F. Tests ❌
**Required**:
1. Test for payload too large (413)
2. Test for javascript: URL rejection (422)
3. Test audit log doesn't contain manifest content

## Summary

**Critical Issues** (must fix):
1. No payload size limit → DoS risk
2. No schema-level URL validation → XSS risk via saved malicious URLs
3. Audit log missing manifest hash

**Recommended**:
1. Document deterministic ordering contract
2. Add rate limiting (future)

**Already Correct**:
1. RBAC with fail-closed
2. Auth before body parsing
3. Schema bounds enforced
4. Renderer has URL safety (but schema should too)
