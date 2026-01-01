# Database Scripts

This directory contains PowerShell scripts for database validation and linting.

## Scripts

### `lint-migrations.ps1`

**Purpose:** Hard guardrail to prevent non-canonical DB objects from being introduced in migrations.

**Usage:**
```powershell
# Run from project root
.\scripts\db\lint-migrations.ps1

# With verbose output
.\scripts\db\lint-migrations.ps1 -Verbose

# Test specific file or directory
.\scripts\db\lint-migrations.ps1 -Path scripts/db/fixtures/allowed.sql

# Or use npm script
npm run lint:schema
```

**What it does:**
- Scans all SQL files in `supabase/migrations/`
- Extracts `CREATE TABLE` and `CREATE TYPE` identifiers
- Extracts `ALTER TABLE` statements and validates table names
- Validates against canonical manifest (`docs/canon/DB_SCHEMA_MANIFEST.json`)
- Reports non-canonical or deprecated objects with file + line numbers

**Exit codes:**
- `0` = All checks passed
- `1` = Non-canonical objects detected (blocks PR)
- `2` = Script execution error

**Output format:**
```
❌ ERRORS (2 non-canonical objects detected):

  File: 20251231999999_bad_migration.sql:5
  Type: TABLE
  Name: non_canonical_table
  Issue: Not in canonical manifest
```

### `test-linter.ps1`

**Purpose:** Deterministic test suite for the migration linter using fixtures.

**Usage:**
```powershell
# Run from project root
.\scripts\db\test-linter.ps1

# With verbose output
.\scripts\db\test-linter.ps1 -Verbose
```

**What it does:**
- Tests linter with `fixtures/allowed.sql` (canonical objects, should pass)
- Tests linter with `fixtures/forbidden.sql` (non-canonical objects, should fail)
- Validates exit codes and error output format
- Reports test results (passed/failed)

**Exit codes:**
- `0` = All tests passed
- `1` = Test failures detected

**Integration:**
- Runs automatically in CI (GitHub Actions)
- Should be run before committing schema changes to linter

## Test Fixtures

### `fixtures/allowed.sql`

Contains only canonical schema operations (CREATE TABLE, CREATE TYPE, ALTER TABLE on canonical objects).
Expected behavior: Linter passes (exit code 0).

### `fixtures/forbidden.sql`

Contains non-canonical schema operations (fantasy tables, fake enums, ALTER TABLE on non-existent tables).
Expected behavior: Linter fails (exit code 1) with specific violations reported.

## Integration

**CI/CD Pipeline:**
- Linter tests run automatically on every PR affecting migrations
- Blocks PRs with non-canonical objects
- Ensures linter itself is working correctly via fixture tests

**Local Development:**
- Run `npm run lint:schema` before committing schema changes
- Run `.\scripts\db\test-linter.ps1` to verify linter functionality

## Related Documentation

- [DB Migrations Guide](../../docs/canon/DB_MIGRATIONS.md) - Migration workflow and standards
- [DB Schema Manifest](../../docs/canon/DB_SCHEMA_MANIFEST.json) - Canonical schema allowlist
- [Review Checklist](../../docs/canon/REVIEW_CHECKLIST.md) - PR review standards
