# DB Determinism CI Flow

## Overview

This document visualizes the DB determinism enforcement flow in CI.

## CI Workflow Triggers

```
┌─────────────────────────────────────────┐
│  Developer Makes DB Schema Change       │
│  - Adds new migration                   │
│  - Modifies lib/types/supabase.ts       │
│  - Changes schema/**                    │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  Creates Pull Request                   │
└────────────────┬────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────┐
│  GitHub Actions Workflow Triggered      │
│  .github/workflows/db-determinism.yml   │
└────────────────┬────────────────────────┘
                 │
                 ▼
```

## Check 1: Migration Immutability

```
┌─────────────────────────────────────────┐
│  Check Migration Immutability           │
│  npm run lint:migrations                │
└────────────┬──────────────┬─────────────┘
             │              │
        ✅ PASS        ❌ FAIL
             │              │
             │              ▼
             │         ┌─────────────────────┐
             │         │ Error: Existing     │
             │         │ migration edited    │
             │         │ CI FAILS ❌         │
             │         └─────────────────────┘
             ▼
```

## Check 2: Migration Application

```
┌─────────────────────────────────────────┐
│  Start Supabase & Apply Migrations      │
│  supabase start                         │
│  supabase db reset                      │
└────────────┬──────────────┬─────────────┘
             │              │
        ✅ PASS        ❌ FAIL
             │              │
             │              ▼
             │         ┌─────────────────────┐
             │         │ Error: Migration    │
             │         │ syntax error or     │
             │         │ constraint violation│
             │         │ CI FAILS ❌         │
             │         └─────────────────────┘
             ▼
```

## Check 3: Schema Drift Detection

```
┌─────────────────────────────────────────┐
│  Check for Schema Drift                 │
│  supabase db diff --exit-code           │
│                                         │
│  Compares:                              │
│  - Schema from migrations               │
│  - Actual database schema               │
└────────────┬──────────────┬─────────────┘
             │              │
        ✅ PASS        ❌ FAIL
   (No drift)         (Drift detected)
             │              │
             │              ▼
             │         ┌─────────────────────┐
             │         │ Error: Manual       │
             │         │ schema changes      │
             │         │ detected            │
             │         │                     │
             │         │ Action: Create      │
             │         │ migration to        │
             │         │ capture changes     │
             │         │ CI FAILS ❌         │
             │         └─────────────────────┘
             ▼
```

## Check 4: Type Generation & Sync

```
┌─────────────────────────────────────────┐
│  Generate TypeScript Types              │
│  npm run db:typegen                     │
│  (supabase gen types typescript)        │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  Compare Generated vs Committed         │
│  git diff --exit-code                   │
│  lib/types/supabase.ts                  │
└────────────┬──────────────┬─────────────┘
             │              │
        ✅ PASS        ❌ FAIL
   (Types match)      (Types differ)
             │              │
             │              ▼
             │         ┌─────────────────────┐
             │         │ Error: Generated    │
             │         │ types differ from   │
             │         │ committed version   │
             │         │                     │
             │         │ Action: Run         │
             │         │ npm run db:typegen  │
             │         │ and commit          │
             │         │ CI FAILS ❌         │
             │         └─────────────────────┘
             ▼
```

## Success Path

```
┌─────────────────────────────────────────┐
│  All Checks Passed ✅                   │
│                                         │
│  ✓ Migrations are new (not edited)     │
│  ✓ Migrations apply cleanly            │
│  ✓ No schema drift                     │
│  ✓ Types are synchronized              │
└────────────┬────────────────────────────┘
             │
             ▼
┌─────────────────────────────────────────┐
│  CI Success ✅                          │
│  PR can be merged                       │
└─────────────────────────────────────────┘
```

## Failure Scenarios & Fixes

### Scenario 1: Existing Migration Edited

**Detection:** `npm run lint:migrations` fails

**Error Message:**
```
ERROR: Existing migration files were modified:
  - supabase/migrations/20241203110000_init.sql

Create a new timestamped migration instead of editing old ones.
```

**Fix:**
1. Revert changes to existing migration
2. Create new migration with your changes
3. Commit both the revert and new migration

---

### Scenario 2: Schema Drift Detected

**Detection:** `supabase db diff --exit-code` fails

**Error Message:**
```
❌ Schema drift detected!
This means there are database changes not captured in migrations.
Please create a new migration to capture these changes.
```

**Fix:**
1. Identify the manual changes (use `supabase db diff` to see them)
2. Create a new migration with these changes
3. Run `supabase db reset` to verify
4. Commit the migration

---

### Scenario 3: Types Out of Date

**Detection:** `git diff --exit-code lib/types/supabase.ts` fails

**Error Message:**
```
❌ Generated types differ from committed version!
The database schema changed but types weren't regenerated.

To fix this:
  1. Run: npm run db:typegen
  2. Commit the updated lib/types/supabase.ts file
```

**Fix:**
```bash
npm run db:typegen
git add lib/types/supabase.ts
git commit -m "chore: update generated types"
```

---

## Developer Best Practices

### Before Creating PR

```bash
# 1. Reset database
supabase db reset

# 2. Generate types
npm run db:typegen

# 3. Run full verification
npm run db:verify

# 4. Commit everything
git add supabase/migrations/*.sql lib/types/supabase.ts
git commit -m "feat: add new feature with migration"
```

### PowerShell (Windows)

```powershell
# Run comprehensive check
function Test-DbDeterminism {
    supabase db reset
    if ($LASTEXITCODE -ne 0) { return $false }
    
    supabase db diff
    if ($LASTEXITCODE -ne 0) { return $false }
    
    npm run db:typegen
    if ($LASTEXITCODE -ne 0) { return $false }
    
    git diff --exit-code lib\types\supabase.ts
    if ($LASTEXITCODE -ne 0) { return $false }
    
    Write-Host "✓ All checks passed!" -ForegroundColor Green
    return $true
}

Test-DbDeterminism
```

---

## Workflow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    DB Determinism Stack                     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Supabase CLI                                               │
│  ├── Migration Management (db reset, db push)              │
│  ├── Drift Detection (db diff)                             │
│  └── Type Generation (gen types typescript)                │
│                                                             │
│  Git Version Control                                        │
│  ├── Migrations (supabase/migrations/*.sql)                │
│  └── Types (lib/types/supabase.ts)                         │
│                                                             │
│  CI/CD Enforcement                                          │
│  ├── GitHub Actions (.github/workflows/db-determinism.yml) │
│  ├── Pre-commit Scripts (scripts/verify-db-determinism.sh) │
│  └── NPM Scripts (db:typegen, db:verify)                   │
│                                                             │
│  Code Protection                                            │
│  └── CODEOWNERS (.github/CODEOWNERS)                       │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Files Involved

| File | Purpose | Owner |
|------|---------|-------|
| `supabase/migrations/*.sql` | Database schema changes | Reviewed (@*) |
| `lib/types/supabase.ts` | Generated TypeScript types | Reviewed (@*) |
| `.github/workflows/db-determinism.yml` | CI enforcement workflow | Protected |
| `scripts/verify-db-determinism.sh` | Local verification | Tool |
| `docs/canon/DB_MIGRATIONS.md` | Canonical documentation | Reviewed (@*) |

---

## Summary

The DB determinism framework ensures:
1. **No silent changes** - All schema changes go through migrations
2. **No drift** - Database state matches migration definitions
3. **Type safety** - TypeScript types always reflect current schema
4. **Reviewable** - All changes are code-reviewed before merge
5. **Reproducible** - Anyone can rebuild exact schema from migrations

This creates a deterministic, auditable, and type-safe database workflow.
