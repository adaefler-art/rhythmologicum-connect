# Database Types

This directory contains auto-generated TypeScript types from the Supabase database schema.

## Important Notes

- **DO NOT EDIT** `supabase.ts` manually
- This file is generated automatically from the database schema
- Run `npm run db:typegen` to regenerate types after schema changes
- CI will fail if types are out of sync with the database schema

## Regenerating Types

```bash
# Local development (requires Supabase running)
npm run db:typegen

# Or manually
supabase gen types typescript --local > lib/types/supabase.ts
```

## CI Enforcement

The CI workflow (`db-determinism.yml`) enforces that:
1. Types are always up to date with the schema
2. No manual edits were made to generated files
3. Database changes follow migration-first discipline

## Usage

```typescript
import { Database } from '@/lib/types/supabase'

// Use the generated types
type Assessment = Database['public']['Tables']['assessments']['Row']
type AssessmentInsert = Database['public']['Tables']['assessments']['Insert']
```

## Troubleshooting

If CI fails with "types are out of date":
1. Make sure Supabase is running locally: `supabase start`
2. Apply migrations: `supabase db reset`
3. Regenerate types: `npm run db:typegen`
4. Commit the updated `supabase.ts` file
