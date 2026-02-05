# DB Access Decision: Canonical Patterns

**Status**: Canonical (Enforced by CI/Lint)  
**Effective**: 2026-01-01  
**Owners**: Platform Team  

## Executive Summary

This document defines the **single source of truth** for how database access is implemented in the Rhythmologicum Connect codebase. All Supabase clients MUST be created through one of three canonical factory functions, each designed for a specific context and security level.

### The Three Clients

1. **`lib/db/supabase.public.ts`** → Browser/Public (anon key, client-side safe)
2. **`lib/db/supabase.server.ts`** → SSR Server (cookie-based user session)
3. **`lib/db/supabase.admin.ts`** → Admin/Service Role (server-only, RLS bypass)

## Problem Statement

### Current Issues (Pre-Standardization)

Based on our audit (see `DB_ACCESS_PATTERNS.md`), we discovered:

- **64 direct client creations** across 306 files
- **Mixed patterns**: Some routes use `createClient`, others `createServerClient`
- **Inconsistent service role usage**: 71 instances of service role key access, not all properly scoped
- **37 files with direct `process.env` access** (violating env module pattern)
- **Ad-hoc error handling**: No consistent error classification or request ID propagation

### Consequences

- **Production failures**: Admin pages work, but funnel/clinician pages fail with RLS/auth errors
- **Security risks**: Service role client potentially accessible in browser bundles
- **Debugging difficulty**: Inconsistent request tracking and error messages
- **Maintenance burden**: Each route implements its own client creation logic

## Canonical Solution

### Principle: Single Responsibility per Client Type

Each client factory has ONE job:

| Factory | Purpose | Keys Used | RLS | Where | Bundle |
|---------|---------|-----------|-----|-------|--------|
| `supabase.public.ts` | Client-side queries (rare) | Anon key | Active | Browser | ✓ Safe |
| `supabase.server.ts` | SSR with user context | Anon key | Active | Server | ✗ Server |
| `supabase.admin.ts` | Metadata/admin ops | Service key | **Bypassed** | Server | ✗ Server |

### Client 1: Public (Browser-Safe)

**File**: `lib/db/supabase.public.ts`

```typescript
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

/**
 * Public Supabase client for browser use
 * - Uses anon key (safe for client bundles)
 * - RLS policies active
 * - NO service role access
 */
export function createPublicClient() {
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}

// Singleton instance for client-side use
export const supabasePublic = createPublicClient()
```

**When to use**:
- Client components that need direct DB access
- Real-time subscriptions
- Public data queries (no auth required)

**Rule**: If it runs in the browser, use this. Period.

---

### Client 2: Server (SSR with User Session)

**File**: `lib/db/supabase.server.ts`

```typescript
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'

/**
 * Server-side Supabase client with user session
 * - Uses anon key + cookie-based auth
 * - RLS policies active (user context)
 * - Server-only (never bundled to browser)
 */
export async function createServerSupabaseClient() {
  const cookieStore = await cookies()
  
  return createServerClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore errors from Server Components
          }
        },
      },
    }
  )
}

/**
 * Get current authenticated user
 */
export async function getCurrentUser() {
  const supabase = await createServerSupabaseClient()
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

/**
 * Check if user has clinician role
 */
export async function hasClinicianRole(): Promise<boolean> {
  const user = await getCurrentUser()
  if (!user) return false
  const role = user.app_metadata?.role || user.user_metadata?.role
  return role === 'clinician' || role === 'admin'
}
```

**When to use**:
- API routes (`/api/**`)
- Server components
- Server actions
- Middleware
- Any code that needs user-scoped access

**Rule**: Default choice for server-side code. Uses RLS properly.

---

### Client 3: Admin (Service Role - Use Sparingly!)

**File**: `lib/db/supabase.admin.ts`

```typescript
import 'server-only' // Ensures this CANNOT be imported in browser
import { createClient } from '@supabase/supabase-js'
import { env } from '@/lib/env'

/**
 * Admin Supabase client with service role
 * - BYPASSES RLS (full database access)
 * - Server-only (enforced by 'server-only' import)
 * - Use ONLY when necessary (metadata, audit logs, cross-user queries)
 * 
 * @WARNING This client has unrestricted access. Use with extreme caution.
 */
export function createAdminSupabaseClient() {
  if (!env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(
      'SUPABASE_SERVICE_ROLE_KEY is not configured. Admin client unavailable.'
    )
  }
  
  return createClient(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: { persistSession: false },
    }
  )
}

/**
 * Scoped admin operations - Document each use case!
 */
export const adminOperations = {
  /**
   * Get content pages for any funnel (admin management)
   * Bypasses RLS to allow clinicians to manage all content
   */
  async getContentPages(funnelId: string) {
    const supabase = createAdminSupabaseClient()
    // Implementation...
  },
  
  /**
   * Write audit logs (must bypass user RLS)
   */
  async logAuditEvent(event: AuditEvent) {
    const supabase = createAdminSupabaseClient()
    // Implementation...
  },
}
```

**When to use** (Exceptions Only):
- Audit logging (user-agnostic)
- Cross-user admin queries (e.g., clinician viewing all patients)
- Metadata operations (funnel catalogs, content pages)
- System-level tasks (migrations, background jobs)

**Rule**: Justify every use. Document scope. Prefer server client when possible.

---

## Usage Decision Tree

```
┌─────────────────────────────────────┐
│ Where does this code run?          │
└────────────┬────────────────────────┘
             │
     ┌───────┴───────┐
     │               │
  Browser        Server
     │               │
     │               │
     ▼               ▼
 supabase.     Need user context?
  public          │
                  ├─── YES → supabase.server
                  │           (default for API/SSR)
                  │
                  └─── NO → Need RLS bypass?
                            │
                            ├─── YES → supabase.admin
                            │           (document why!)
                            │
                            └─── NO → supabase.server
                                      (safest option)
```

## Migration Strategy

### Phase 1: Existing Helpers → Canonical Factories

**Current helpers** (`lib/supabaseServer.ts`, `lib/supabaseClient.ts`):
- Keep for backward compatibility initially
- Update to use canonical factories internally
- Deprecate over time

**Example migration**:

```typescript
// OLD (lib/supabaseServer.ts)
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env } from '@/lib/env'

export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(/* ... */)
}

// NEW (same file, but re-export from canonical)
export { createServerSupabaseClient as createClient } from '@/lib/db/supabase.server'
export { getCurrentUser, hasClinicianRole } from '@/lib/db/supabase.server'
```

### Phase 2: API Routes Refactor

**Before**:
```typescript
// app/api/admin/funnels/route.ts
import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function GET() {
  const cookieStore = await cookies()
  const authClient = createServerClient(/* ... */)
  const { user } = await authClient.auth.getUser()
  
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const readClient = createClient(url, serviceKey, /* ... */)
  // ...
}
```

**After**:
```typescript
// app/api/admin/funnels/route.ts
import { createServerSupabaseClient, hasClinicianRole } from '@/lib/db/supabase.server'
import { createAdminSupabaseClient } from '@/lib/db/supabase.admin'

export async function GET() {
  // Auth check with server client
  if (!(await hasClinicianRole())) {
    return forbiddenResponse()
  }
  
  // Data access with admin client (documented: catalog metadata)
  const admin = createAdminSupabaseClient()
  const { data: funnels } = await admin.from('funnels_catalog').select('*')
  // ...
}
```

### Phase 3: Remove Direct Imports

Once all code migrated:
- Delete inline `createClient` calls
- Remove `import { createClient } from '@supabase/*'` outside factories
- ESLint will enforce this

## Error Handling Pattern

### Shared Helper: `lib/db/errors.ts`

```typescript
export type DbErrorKind =
  | 'SCHEMA_NOT_READY'
  | 'AUTH_OR_RLS'
  | 'CONFIGURATION_ERROR'
  | 'INTERNAL_ERROR'

export function classifySupabaseError(error: unknown): { kind: DbErrorKind } {
  // Unified classification logic
}

export function withRequestId<T extends Response>(
  response: T,
  requestId: string
): T {
  response.headers.set('x-request-id', requestId)
  return response
}
```

Use in all API routes for consistency.

## Audit & Service Role Justifications

### Justified Service Role Uses

1. **Audit Logging** (`lib/audit/log.ts`)
   - **Why**: Audit logs must persist regardless of user permissions
   - **Scope**: `audit_log` table only
   - **Mitigation**: PHI redaction before logging

2. **Content Resolution** (`lib/utils/contentResolver.ts`)
   - **Why**: Funnels need to load published content for all users
   - **Scope**: `content_pages` (published only), `funnels` (metadata)
   - **Mitigation**: Status filter (`published`), no PHI in these tables

3. **Admin Catalog APIs** (`app/api/admin/funnels/route.ts`)
   - **Why**: Clinicians manage all funnels, not just their own
   - **Scope**: `funnels_catalog`, `funnel_versions`, `pillars` (metadata)
   - **Mitigation**: Auth check required, no patient data in these tables

4. **Funnel Catalog** (`app/api/funnels/catalog/route.ts`)
   - **Why**: Users browse all available funnels
   - **Scope**: `funnels_catalog`, `pillars` (public metadata)
   - **Mitigation**: Auth required, only active funnels shown

5. **Shipment Reminder Service** (`lib/shipment/reminderService.server.ts`)
  - **Why**: Runs as a scheduled/background job (no end-user cookies), needs to query/update shipments and emit reminders across users
  - **Scope**: `device_shipments`, `shipment_events`, RPC `increment_reminder_count_atomic` (shipment reminder tracking)
  - **Mitigation**: Server-only module, selects minimal fields, atomic cooldown enforcement via RPC to prevent duplicate reminders; notification metadata is PHI-free

6. **MCP Context Pack API** (`apps/rhythm-studio-ui/app/api/mcp/context-pack/route.ts`)
  - **Why**: Clinician/admin endpoint aggregates cross-patient context for diagnosis tooling; requires RLS bypass
  - **Scope**: `anamnesis_entries`, `assessments`, `assessment_answers`, `calculated_results`, `patient_measures`, `patient_profiles`, `questions`
  - **Mitigation**: Server-only API route, explicit RBAC gate (clinician/admin only), minimal field selection

7. **Diagnosis Execute API** (`apps/rhythm-studio-ui/app/api/studio/diagnosis/execute/route.ts`)
  - **Why**: Executes system-owned diagnosis runs and writes artifacts; requires RLS bypass
  - **Scope**: `diagnosis_runs`, `diagnosis_artifacts`
  - **Mitigation**: Server-only API route, explicit RBAC gate (clinician/admin only), no client exposure

8. **Diagnosis Queue API** (`apps/rhythm-studio-ui/app/api/studio/diagnosis/queue/route.ts`)
  - **Why**: Queues diagnosis runs and persists inputs metadata; requires RLS bypass for system insert
  - **Scope**: `diagnosis_runs`
  - **Mitigation**: Server-only API route, explicit RBAC gate (clinician/admin only), no client exposure

9. **Triage Fix Membership API** (`apps/rhythm-studio-ui/app/api/triage/fix-membership/route.ts`)
  - **Why**: Repairs staff/patient organization membership links across users; requires RLS bypass
  - **Scope**: `assessments`, `patient_profiles`, `user_org_membership`
  - **Mitigation**: Server-only API route, authenticated staff only, minimal fields selected

10. **Triage Health API** (`apps/rhythm-studio-ui/app/api/triage/health/route.ts`)
  - **Why**: System-level triage metrics (global assessment count) require RLS bypass
  - **Scope**: `assessments` (count only)
  - **Mitigation**: Server-only API route, authenticated users only, read-only aggregate

### Unjustified Uses (To Be Refactored)

Any service role usage NOT listed above should be reviewed and likely replaced with server client + proper RLS policies.

## Enforcement (Guardrails)

See separate document: `DB_ACCESS_GUARDRAILS.md`

**Preview**:
- ESLint rules blocking direct imports
- CI step verifying no stray clients
- CODEOWNERS for canonical files
- PR template checklist

## FAQ

**Q: Can I create a client inline for a quick prototype?**  
A: No. Use `createServerSupabaseClient()` from the start. It's one line.

**Q: Why not use service role everywhere? It's easier.**  
A: Security. RLS protects against bugs. Service role = root access.

**Q: What if I need both user context AND cross-user access?**  
A: Two queries: server client for user data, admin client for metadata. Keep separate.

**Q: How do I test with these clients?**  
A: Mock the factories in tests. Example in `lib/db/__tests__/`.

**Q: Can I use supabase.admin in a React component?**  
A: **NO.** The `server-only` import will throw a build error. Use server client.

## Related Documents

- `DB_ACCESS_PATTERNS.md` - Audit results (current state)
- `DB_ACCESS_MATRIX.md` - File-by-file surface mapping
- `DB_ACCESS_GUARDRAILS.md` - CI/Lint enforcement rules
- `DB_ACCESS_MIGRATION_EVIDENCE.md` - Post-refactor verification

## Changelog

- **2026-01-01**: Initial canonical decision document
