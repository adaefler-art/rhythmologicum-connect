# DB Access Guardrails

**Status**: Active (CI-enforced)  
**Effective**: 2026-01-01  
**Related**: `DB_ACCESS_DECISION.md`

## Overview

This document describes the automated guardrails that enforce canonical database access patterns in the Rhythmologicum Connect repository.

## Enforcement Layers

### Layer 1: ESLint Rules (Pre-commit)

**Location**: `eslint.config.mjs`

#### Rule 1: No Direct createClient Imports

```javascript
"no-restricted-imports": [
  "error",
  {
    paths: [
      {
        name: "@supabase/supabase-js",
        importNames: ["createClient"],
        message: "Use canonical factories from @/lib/db/supabase.* instead."
      }
    ]
  }
]
```

**Blocked**:
```typescript
// ❌ BLOCKED
import { createClient } from '@supabase/supabase-js'
```

**Allowed**:
```typescript
// ✅ ALLOWED
import { createPublicClient } from '@/lib/db/supabase.public'
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
```

**Exceptions**: `lib/db/supabase.*.ts` (canonical factories themselves)

---

#### Rule 2: No Direct createServerClient Imports

```javascript
{
  name: "@supabase/ssr",
  importNames: ["createServerClient"],
  message: "Use createServerSupabaseClient from @/lib/db/supabase.server instead."
}
```

**Blocked**:
```typescript
// ❌ BLOCKED
import { createServerClient } from '@supabase/ssr'
```

**Allowed**:
```typescript
// ✅ ALLOWED
import { createServerSupabaseClient } from '@/lib/db/supabase.server'
```

**Exceptions**: `lib/db/supabase.server.ts`

---

#### Rule 3: Restricted Admin Client Usage

```javascript
{
  name: "@/lib/db/supabase.admin",
  message: "Admin client restricted to API routes and documented lib modules."
}
```

**Blocked**:
```typescript
// ❌ BLOCKED (in client component)
'use client'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
```

**Allowed**:
```typescript
// ✅ ALLOWED (in API route)
// app/api/admin/funnels/route.ts
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
```

**Exceptions**: 
- `app/api/**/*.ts` (API routes)
- Documented lib modules (audit, content resolver)

---

#### Rule 4: No Direct process.env Access

**Existing rule from E50** - ensures all env access goes through `@/lib/env`

---

### Layer 2: CI Verification (Pre-merge)

**Workflow**: `.github/workflows/db-access-verification.yml`

**Triggers**:
- Pull requests to `main` or `develop`
- Pushes to `main`
- Changes to `.ts`, `.tsx`, `lib/db/`, or ESLint config

**Steps**:

1. **ESLint check** (`npm run lint`)
   - Enforces all import restrictions
   - Fails PR if violations found

2. **Pattern verification** (`npm run db:access-verify`)
   - Scans codebase for direct client usage
   - Checks service role key access
   - Validates admin client scope
   - Fails PR if violations found

3. **Audit report** (on failure)
   - Generates detailed violation report
   - Includes file-by-file matrix
   - Posted to PR for review

---

### Layer 3: Runtime Guards (Production)

#### Server-Only Guard

**Implementation**: `lib/db/supabase.admin.ts`

```typescript
import 'server-only' // Throws build error if imported in browser
```

**Effect**:
- Admin client CANNOT be imported in client components
- Build fails immediately if attempted
- Prevents accidental service key exposure

#### Environment Validation

**Implementation**: `lib/env.ts`

- Validates required env vars at startup
- Throws clear errors if misconfigured
- Prevents runtime failures in production

---

## Verification Commands

### Local Development

```bash
# Run ESLint
npm run lint

# Verify DB access patterns
npm run db:access-verify

# Generate audit report
npm run db:access-audit
```

### CI Pipeline

```bash
# Full verification (as run in CI)
npm ci
npm run lint
npm run db:access-verify
npm run build
```

---

## Violation Response

### When ESLint Flags a Violation

1. **Read the error message** - it includes guidance
2. **Check `DB_ACCESS_DECISION.md`** for correct pattern
3. **Refactor to use canonical factory**
4. **Run `npm run lint` to verify fix**

### When CI Fails

1. **Review the audit report** in workflow output
2. **Identify violating files** in the matrix
3. **Refactor each file** to use canonical factories
4. **Commit and push** - CI will re-run automatically

### When Build Fails (server-only)

```
Error: "server-only" module imported in client code
  at lib/db/supabase.admin.ts
```

**Fix**:
- Remove admin client import from client component
- Use server client instead, or
- Move operation to API route

---

## Approved Exceptions

### Current Legacy Files (To Be Refactored)

1. **`lib/audit/log.ts`**
   - Uses service role for audit logging
   - Justification: Audit logs must persist regardless of user permissions
   - TODO: Migrate to use `createAdminSupabaseClient`

2. **`lib/utils/contentResolver.ts`**
   - Uses service role for published content
   - Justification: Content is public metadata
   - TODO: Migrate to use `adminOperations.getPublishedContentPages`

3. **`lib/funnels/loadFunnelVersion.ts`**
   - Uses direct createClient
   - Justification: Legacy code
   - TODO: Refactor to use canonical factories

### Adding New Exceptions

**Process**:

1. **Document justification** in code comments
2. **Add to allowed list** in `scripts/db/verify-db-access.js`
3. **Add to exceptions list** in `eslint.config.mjs`
4. **Update this document** with rationale
5. **Get approval** from platform team

**Template**:
```typescript
/**
 * Admin client usage - DOCUMENTED EXCEPTION
 * 
 * Justification: [Why RLS bypass is necessary]
 * Scope: [Which tables/operations]
 * Mitigation: [How we protect against misuse]
 * TODO: [Refactor plan if temporary]
 */
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'
```

---

## Monitoring

### Metrics Tracked

- Number of direct client usages (target: 0 except exceptions)
- Admin client usage locations (reviewed quarterly)
- Service role key access points (audited)

### Review Schedule

- **Weekly**: CI failure trends
- **Monthly**: Exception list review
- **Quarterly**: Full audit + refactor planning

### Audit Trail

All violations are logged:
- CI workflow runs
- ESLint output
- Audit reports (timestamped)

---

## Enforcement Philosophy

### Why Hard Guardrails?

1. **Security**: Prevents accidental service key exposure
2. **Consistency**: One way to do things = less confusion
3. **Maintainability**: Centralized patterns are easier to update
4. **Debugging**: Consistent errors are easier to diagnose

### When to Bypass (Rarely!)

**Never bypass for**:
- Convenience
- "Quick prototypes" (they become permanent)
- Lack of understanding (ask for help instead)

**Only bypass when**:
- Documented technical limitation
- Temporary bridge during migration
- Approved exception process followed

---

## Related Documents

- `DB_ACCESS_DECISION.md` - Canonical pattern definition
- `DB_ACCESS_PATTERNS.md` - Current state audit
- `DB_ACCESS_MATRIX.md` - File-by-file breakdown

## Changelog

- **2026-01-01**: Initial guardrails implementation
  - ESLint rules active
  - CI verification enabled
  - Server-only guard in place
