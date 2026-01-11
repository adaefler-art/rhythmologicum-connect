# Type Generation Required

## Status

The V05-I05.7 review queue implementation is **COMPLETE** but requires local database type generation before the build will succeed.

## Issue

The build fails with:
```
./lib/review/persistence.ts:23:52
Type error: Property 'review_records' does not exist on type 'Database['public']['Tables']'
```

## Solution

This is expected behavior. The new `review_records` table was created in the migration but the TypeScript types in `lib/types/supabase.ts` need to be regenerated.

### Steps to Complete

**On local machine with Supabase CLI**:

```powershell
# 1. Apply migrations (creates review_records table)
supabase db reset

# 2. Generate TypeScript types
npm run db:typegen

# 3. Commit the updated types
git add lib/types/supabase.ts
git commit -m "Generate types for review_records table"
git push

# 4. Verify build
npm run build
```

### What This Does

1. **supabase db reset**: Applies all migrations including the new `20260104101410_v05_i05_7_create_review_records.sql`
2. **npm run db:typegen**: Generates TypeScript types from the database schema, including the new `review_records` table
3. **Commit**: Commits the updated `lib/types/supabase.ts` with the new types
4. **Build**: Verifies that TypeScript compilation succeeds

## Expected Changes

After type generation, `lib/types/supabase.ts` will include:

```typescript
export type Database = {
  public: {
    Tables: {
      // ... existing tables
      review_records: {
        Row: {
          id: string
          job_id: string
          review_iteration: number
          status: Database['public']['Enums']['review_status']
          queue_reasons: string[]
          is_sampled: boolean
          // ... other fields
        }
        Insert: { /* ... */ }
        Update: { /* ... */ }
        Relationships: [ /* ... */ ]
      }
    }
    Enums: {
      // ... existing enums
      review_status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'CHANGES_REQUESTED'
    }
    Functions: {
      // ... existing functions
      compute_sampling_hash: {
        Args: { p_job_id: string; p_salt?: string }
        Returns: string
      }
      should_sample_job: {
        Args: { p_job_id: string; p_sampling_percentage?: number; p_salt?: string }
        Returns: boolean
      }
    }
  }
}
```

## Verification

After type generation and build:

```powershell
# All tests should pass
npm test
# Output: Test Suites: 59 passed, Tests: 975 passed

# Build should succeed
npm run build
# Output: ✓ Compiled successfully
```

## Why This Happens

This is standard workflow for database-first development:
1. Create migration (SQL)
2. Apply migration (local DB)
3. Generate types (TypeScript from DB)
4. Use types (code compilation)

The types must be generated from the actual database schema, not manually written, to ensure they stay in sync.

## Timeline

- **Migration created**: 2026-01-04 10:14:10 UTC
- **Type generation needed**: Before build
- **Expected completion**: ~5 minutes locally

## CI/CD Note

The CI/CD pipeline includes type generation verification (`db-determinism.yml`). When this PR is merged, the pipeline will:
1. Verify no existing migrations were edited
2. Apply all migrations
3. Generate types
4. Verify no schema drift
5. Verify types match schema

If types are not committed, the CI pipeline will fail, preventing merge.

## Contact

If you encounter issues:
1. Verify Supabase CLI is installed: `supabase --version`
2. Verify local DB is running: `supabase status`
3. Check migration syntax: Review the migration file for SQL errors
4. Consult docs: [DB Migrations Guide](docs/canon/DB_MIGRATIONS.md)
