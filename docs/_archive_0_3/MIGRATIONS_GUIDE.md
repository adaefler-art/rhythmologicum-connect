# Supabase Migration Guide

This project treats `supabase/migrations` as an append-only log. Never rewrite an existing SQL file after it has been shared. Use this guide to add features safely.

## 1. Workflow overview

1. **Start from the template** in `tools/migration-template.sql`. Copy it, rename the file to `supabase/migrations/<YYYYMMDDHHMMSS>_<description>.sql`, and fill in the sections.
2. **Keep migrations idempotent**. Wrap foreign keys, policies, and grants in `DO $$ IF NOT EXISTS` blocks so that re-running a migration is safe on CI and developer machines.
3. **Update the canonical schema** with `./scripts/generate-schema.sh` after running the new migration locally. Commit the resulting `schema/schema.sql` diff alongside the migration.
4. **Run the guard** to ensure no legacy files were touched: `npm run lint:migrations`. The script fails if a staged migration is modified instead of added.
5. **Open a PR** only after Supabase CLI applies the migration cleanly (`supabase db reset` or `./scripts/apply-migrations.sh`).

## 2. Local guard & Git hook

- Run `npm run lint:migrations` before committing. It inspects the staged SQL files under `supabase/migrations`. Any status other than `A` (added) causes the command to fail.
- If you want the check to run automatically, add the following to `.git/hooks/pre-commit`:
  ```bash
  #!/usr/bin/env bash
  npm run lint:migrations
  ```
- In exceptional situations (e.g., hotfixing a migration before it lands on main) set `ALLOW_MIGRATION_EDITS=1` when running the command.

## 3. Template usage

`tools/migration-template.sql` contains guarded examples for:
- creating tables with `IF NOT EXISTS`
- adding foreign keys only when the referenced schema/table is present
- enabling RLS and policies with `CREATE POLICY IF NOT EXISTS` semantics via guards

Always replace the placeholder comments with the actual business context and keep statements ordered: tables → constraints → indexes → RLS/policies.

## 4. Continuous integration

- `npm run lint:migrations -- --base-ref origin/main` is executed in CI to guarantee that PRs only add migrations.
- `db-migrations-check.yml` runs the guard before applying migrations.
- `verify-supabase-schema.yml` compares the deployed database against the committed `schema/schema.sql`.

Following these steps keeps the Supabase history linear and reproducible for every environment.