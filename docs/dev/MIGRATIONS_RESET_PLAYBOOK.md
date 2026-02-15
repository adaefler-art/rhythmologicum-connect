# Clean Reset Playbook (Supabase)

This repo uses Supabase migrations (`supabase/migrations/*.sql`) as the source of truth.

If a hosted Supabase database has been modified manually (SQL editor) or migration history diverged, `supabase db push` can fail with errors like `already exists` / `duplicate key`.

## Recommended approach: new Supabase project (clean restart)

This is the safest way to get back to a deterministic, migration-first state.

1. **Create a new Supabase project** in the Supabase dashboard (e.g. `rhythmologicum-connect-reset`).
2. Collect values from the new project:
   - Project ref (dashboard URL: `.../project/<ref>`)
   - Database connection string (for `SUPABASE_DB_URL`)
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. **Update GitHub repo secrets**:
   - `SUPABASE_ACCESS_TOKEN`
   - `SUPABASE_PROJECT_ID` (or `SUPABASE_PROJECT_REF`)
   - `SUPABASE_DB_URL`
4. **Run the “Apply Supabase migrations” workflow** (manual dispatch or push to `main`).
   - Expect it to apply all migrations from `supabase/migrations/`.
5. **Verify migrations** in Supabase SQL editor:
   - `select version, name from supabase_migrations.schema_migrations order by version;`
6. **Point the app to the new project**:
   - Update deployment env vars (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and server-side secrets).
   - Redeploy.

### Notes

- **Auth users are not automatically migrated** between projects. Treat this as a true restart unless you explicitly export/import users.
- If you need to preserve production data, do not use this approach without a data migration plan.

## Alternative (dangerous): reset the existing project

Only do this if you explicitly accept full data loss.

- Take a backup first (Supabase dashboard backups / `pg_dump`).
- Use Supabase dashboard reset/restore features if available for your plan.
- Avoid dropping Supabase-managed schemas (`auth`, `storage`, etc.). If you must clean only app tables, drop objects in `public` carefully.

Because this is destructive and plan-dependent, prefer the “new project” approach.

## Stable migration process (after reset)

- **No manual SQL changes** in hosted DB. Every change is a new migration.
- Migrations are **append-only** (editing old migrations is blocked by CI).
- New migrations should be **rerunnable** (basic idempotency):
  - Prefer `CREATE ... IF NOT EXISTS` and `DROP ... IF EXISTS`.
  - For constraints/policies/types: use guarded `DO $$ ...` blocks (catalog checks).
- PR CI runs:
  - migration immutability check
  - idempotency lint for new migrations
  - local `supabase db reset`
  - schema drift check (`supabase db diff --local`)
  - typegen check (`supabase gen types ...`)
