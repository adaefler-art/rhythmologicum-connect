# v0.5 Release Checklist - Evidence-Based

**Generated:** 2026-01-08  
**Base Commit:** `5d3c3cb82c147fb34790e69a705e310866faed61`  
**Verification Method:** Code search + manual inspection

---

## 0. GO/NO-GO Gates (Run These Commands)

**GO** if all commands below complete with exit code `0`.

**NO-GO** if any command fails; capture the terminal output as evidence.

```powershell
# Unit tests (verify via exit code + output)
npm test

# Production build (verify via exit code + output)
npm run build

# Reset local DB + apply all migrations (CAUTION: deletes local data)
npx supabase db reset

# Regenerate Supabase types (verify that lib/types/supabase.ts changes only when schema/RPCs change)
npm run db:typegen
```

## 1. Framework & Dependency Verification

### ✅ Verified Versions

**Source:** `package.json` (BlobSha: 4c17649d8f4e4bed3e9f3a3dab73a116aefbf340)

| Package | Version | Verification |
|---------|---------|--------------|
| **Next.js** | 16.0.7 | ✅ package.json:34 |
| **React** | 19.2.1 | ✅ package.json:36 |
| **React DOM** | 19.2.1 | ✅ package.json:37 |
| **@supabase/supabase-js** | 2.86.0 | ✅ package.json:30 |
| **@supabase/ssr** | 0.8.0 | ✅ package.json:29 |
| **TypeScript** | 5.9.3 | ✅ package.json:63 |
| **Zod** | 4.2.1 | ✅ package.json:40 |

**Verification Command:**
```powershell
npm ls next react @supabase/supabase-js typescript --depth=0
```

**Expected Output:**
```
rhythmologicum-connect@0.4.0
├── next@16.0.7
├── react@19.2.1
├── @supabase/supabase-js@2.86.0
└── typescript@5.9.3
```

---

## 2. API Endpoint Inventory (Complete Evidence)

**Search Method:**
```powershell
rg "export async function (GET|POST|PUT|PATCH|DELETE)" app/api --type typescript -n
```

**Note:** Search results limited to 10 per query. [View all routes](https://github.com/adaefler-art/rhythmologicum-connect/search?q=path%3Aapp%2Fapi+%22export+async+function%22)

### ✅ Core Endpoints (Verified)

#### Auth & Session

| Endpoint | Method | File:Line | Caller | Evidence |
|----------|--------|-----------|--------|----------|
| `/api/auth/callback` | POST | `app/api/auth/callback/route.ts:5` | `app/page.tsx:15` | ✅ |

**Caller Evidence:**
```typescript
// app/page.tsx:15
await fetch('/api/auth/callback', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ event: 'SIGNED_IN', session }),
})
```

#### Admin & Telemetry

| Endpoint | Method | File:Line | Caller | Evidence |
|----------|--------|-----------|--------|----------|
| `/api/admin/usage` | GET | `app/api/admin/usage/route.ts:42` | ❌ No caller found (searched app/**) | Admin dashboard not indexed |
| `/api/admin/kpi-thresholds` | GET, POST | `app/api/admin/kpi-thresholds/route.ts:16,55` | ❌ No caller found (searched app/**) | Admin UI |
| `/api/admin/notification-templates` | GET, POST | `app/api/admin/notification-templates/route.ts:25,67` | ❌ No caller found (searched app/**) | Admin UI |
| `/api/admin/navigation/[role]` | PUT | `app/api/admin/navigation/[role]/route.ts:42` | ❌ No caller found (searched app/**) | V05-I09.1 |
| `/api/admin/reassessment-rules/[id]` | PUT, DELETE | `app/api/admin/reassessment-rules/[id]/route.ts:13,73` | ❌ No caller found (searched app/**) | Admin UI |

#### Content & Resolver

| Endpoint | Method | File:Line | Caller | Evidence |
|----------|--------|-----------|--------|----------|
| `/api/content-resolver` | GET | `app/api/content-resolver/route.ts:15` | ❌ No caller found (searched app/**) | Not used in search scope |

**Note:** `app/patient/funnel/[slug]/client.tsx:250` calls `/api/funnels/${slug}/content-pages`, which is a **different endpoint** not found in route files.

#### Notifications

| Endpoint | Method | File:Line | Caller | Evidence |
|----------|--------|-----------|--------|----------|
| `/api/notifications` | GET | `app/api/notifications/route.ts:38` | ❌ No caller found (searched app/**) | Notification UI |
| `/api/notifications/[id]` | PATCH | `app/api/notifications/[id]/route.ts:29` | ❌ No caller found (searched app/**) | Notification UI |

#### V0.5 Features

| Endpoint | Method | File:Line | Caller | Evidence |
|----------|--------|-----------|--------|----------|
| `/api/review/queue` | GET | `app/api/review/queue/route.ts:16` | `app/clinician/review-queue/page.tsx:120` | ✅ V05-I10.4 |
| `/api/processing/jobs/[jobId]` | GET | `app/api/processing/jobs/[jobId]/route.ts:41` | ❌ No caller found (searched app/**) | Backend polling |

**Caller Evidence:**
```typescript
// app/clinician/review-queue/page.tsx:120
const response = await fetch(`/api/review/queue?${params}`)
```

**Search Limitation:** Searches limited to 10 results. Additional endpoints exist but not shown. Admin UI callers (`app/admin/*`) not in search scope.

---

## 3. Database Migrations (V0.5)

**Discovery Command:**
```powershell
Get-ChildItem -Path supabase/migrations -Filter *.sql | Select-Object Name
```

**V0.5-Specific Migrations (Verified):**

| Migration | Tables/Enums | RLS | Status |
|-----------|--------------|-----|--------|
| `20260103150000_v05_i05_1_create_processing_jobs.sql` | `processing_jobs`, `processing_stage` enum, `processing_status` enum | ❌ Not verified | ✅ I05.1 |
| `20260107083000_v05_i09_2_create_design_tokens.sql` | `design_tokens` | ✅ Lines 38-85 | ✅ I09.2 |
| `20260107110000_v05_i09_4_create_operational_settings.sql` | `notification_templates`, `reassessment_rules` | ❌ Not verified | ✅ I09.4 |

**Evidence - RLS for design_tokens:**
```sql
-- 20260107083000_v05_i09_2_create_design_tokens.sql:41
CREATE POLICY design_tokens_select_authenticated ON public.design_tokens
    FOR SELECT TO authenticated
    USING (is_active = true);

-- 20260107083000_v05_i09_2_create_design_tokens.sql:48
CREATE POLICY design_tokens_admin_insert ON public.design_tokens
    FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND (raw_app_meta_data->>'role' = 'admin' OR raw_app_meta_data->>'role' = 'clinician')
        )
    );
```

**Migration Verification Command:**
```powershell
# Reset local DB (CAUTION: Deletes all data)
npx supabase db reset

# Expected output:
# Applying migration 20260103150000_v05_i05_1_create_processing_jobs.sql...
# Applying migration 20260107083000_v05_i09_2_create_design_tokens.sql...
# ✅ All migrations applied
```

---

## 4. Test Coverage (Evidence-Based)

**Discovery Command:**
```powershell
Get-ChildItem -Path . -Include *.test.ts,*.spec.ts,*.test.tsx,*.spec.tsx -Recurse | 
  Where-Object { $_.FullName -notmatch "node_modules" } | 
  Select-Object FullName
```

**Alternative (folder-based):**
```powershell
Get-ChildItem -Path . -Directory -Filter __tests__ -Recurse | 
  Where-Object { $_.FullName -notmatch "node_modules" } | 
  ForEach-Object { Get-ChildItem $_.FullName -File }
```

### ✅ Existing Test Files (Verified Paths)

| File Path | Feature Tested | Lines | Status |
|-----------|----------------|-------|--------|
| `lib/__tests__/env.test.ts` | Environment variables | 85 | ✅ |
| `lib/__tests__/funnelHelpers.test.ts` | Funnel helpers | 81 | ✅ |
| `lib/api/__tests__/authHelpers.test.ts` | Role-based auth | 88 | ✅ |
| `lib/pdf/__tests__/storage.test.ts` | PDF storage (V05-I05.8) | 84 | ✅ |
| `lib/types/__tests__/funnel.test.ts` | Funnel type guards | 109 | ✅ |
| `lib/types/__tests__/catalog.test.ts` | Catalog availability | 118 | ✅ |
| `lib/ranking/__tests__/ranker.test.ts` | Priority ranking (V05-I05.3) | 91 | ✅ |
| `lib/audit/__tests__/registry.test.ts` | Audit constants | 75 | ✅ |
| `lib/components/content/__tests__/ContentBlockRenderer.test.tsx` | Content rendering (V05-I06.2) | 95 | ✅ |
| `app/clinician/patient/[id]/__tests__/sections.test.tsx` | Patient detail sections (V05-I07.2) | 75 | ✅ |

**V0.5 Feature Coverage:**
- ✅ **PDF Storage** (V05-I05.8): lib/pdf/__tests__/storage.test.ts
- ✅ **Priority Ranking** (V05-I05.3): lib/ranking/__tests__/ranker.test.ts
- ✅ **Content Rendering** (V05-I06.2): lib/components/content/__tests__/ContentBlockRenderer.test.tsx
- ✅ **Patient Detail Sections** (V05-I07.2): app/clinician/patient/[id]/__tests__/sections.test.tsx

### ❌ Missing Test Coverage

**V0.5 Features Without Tests:**
- ❌ **Support Cases** (V05-I08.4): No tests found
- ❌ **Navigation Config** (V05-I09.1): No tests found
- ❌ **Design Tokens** (V05-I09.2): No tests found
- ❌ **Operational Settings** (V05-I09.4): No tests found
- ❌ **Processing Pipeline** (V05-I05.1): No tests found
- ❌ **Review Queue** (V05-I10.4): No tests found

**Run Tests:**
```powershell
npm test

# Expected: All existing tests pass
# Missing tests tracked in v0.6 backlog
```

---

## 5. V0.5 Feature Verification

### Design Tokens (V05-I09.2)

**Database Migration:** ✅ `20260107083000_v05_i09_2_create_design_tokens.sql`  
**API Endpoint:** ❌ **NOT FOUND**  
**UI Component:** ❌ **NOT FOUND**

**Status:** 🚧 **Migration exists, but NO API or UI implementation**

**Manual Test (DB-only):**
```powershell
# Connect to database
npx supabase db connect psql

# Check table exists
\d design_tokens

# Insert test token
INSERT INTO design_tokens (organization_id, token_category, token_key, token_value, is_active)
VALUES (NULL, 'colors', 'primary', '{"500": "#ff0000"}'::jsonb, true)
RETURNING id;
```

**Pass Criteria (DB-only):**
- [ ] Table `design_tokens` exists
- [ ] INSERT succeeds as admin
- [ ] SELECT works for authenticated users
- [ ] RLS enforced

---

### Review Queue Dashboard (V05-I10.4)

**Database:** Uses existing `review_records` table (V05-I05.7)  
**API Endpoint:** ✅ `GET /api/review/queue` → `app/api/review/queue/route.ts:16`  
**UI Component:** ✅ `app/clinician/review-queue/page.tsx` (586 lines)

**Caller Evidence:**
```typescript
// app/clinician/review-queue/page.tsx:120
const response = await fetch(`/api/review/queue?${params}`)
```

**Manual Test:**
```powershell
# 1. Login as clinician
# 2. Navigate to /clinician/review-queue
# Expected: Dashboard displays stats cards, queue table, filters
```

**Pass Criteria:**
- [ ] Dashboard loads without errors
- [ ] Stats cards show correct counts
- [ ] Filters work (status, priority)
- [ ] SLA badges display correctly
- [ ] Row click navigates to patient page

---

## 6. Build & Migration Verification

### Build Verification

```powershell
# Clean build
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
npm run build

# Expected output:
#   ✓ Compiled successfully
#   Route (pages)               Size     First Load JS
#   ○ /                         X kB           Y kB
#   Exit code: 0
```

**Pass Criteria:**
- [ ] Exit code 0
- [ ] No TypeScript errors
- [ ] No fatal errors

---

### Migration Verification

```powershell
# CAUTION: This deletes all local data
npx supabase db reset

# Verify tables
npx supabase db connect psql
\dt public.*

# Expected v0.5 tables: 
# processing_jobs, design_tokens, notification_templates, reassessment_rules
```

**Pass Criteria:**
- [ ] All migrations apply without errors
- [ ] V0.5 tables exist
- [ ] RLS enabled on all tables

---

## 7. Rollback Procedure (Forward-Only DB)

### ⚠️ NO DESTRUCTIVE ROLLBACK

**Strategy:** Code rollback + forward-only database migrations

**If Deployment Fails:**

#### Step 1: Rollback Code (Vercel)

```powershell
# Vercel Dashboard → Deployments → Previous → "Promote to Production"

# Or via CLI:
vercel rollback
```

#### Step 2: Assess Database State

**DO NOT** run `DROP TABLE` commands. Database changes are forward-only.

**Check migration status:**
```powershell
npx supabase db connect psql --project-ref <prod-ref>

SELECT * FROM supabase_migrations.schema_migrations 
ORDER BY version DESC 
LIMIT 5;
```

#### Step 3: Emergency Hotfix Migration (If Needed)

Create forward-only migration: `supabase/migrations/20260108_hotfix_disable_feature.sql`

```sql
-- Emergency hotfix: Disable feature via config flag
UPDATE operational_config 
SET is_enabled = false 
WHERE feature_key = 'design_tokens';
```

**Deploy hotfix:**
```powershell
npx supabase db push --project-ref <prod-ref>
```

---

## 8. Go/No-Go Criteria

### ✅ GO Criteria (All Must Pass)

- [ ] **Build:** `npm run build` exits 0, no errors
- [ ] **Migrations:** All v0.5 migrations apply cleanly
- [ ] **Types:** `npm run db:typegen` succeeds
- [ ] **RLS:** Comprehensive RLS enabled
- [ ] **Tests:** Existing tests pass (`npm test`)

### ❌ NO-GO Criteria (Any Fails → Abort)

- [ ] **Critical Bug:** 500 errors on any P0 user path
- [ ] **Data Loss:** Assessment answers not persisting
- [ ] **RLS Bypass:** Patients can see other patients' data
- [ ] **Migration Failure:** Any migration fails to apply

---

**Checklist Owner:** Release Manager  
**Last Updated:** 2026-01-08  
**Status:** ✅ Ready for Execution