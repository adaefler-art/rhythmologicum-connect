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

**Integration:**
- Should be run as part of PR validation
- Can be integrated into CI/CD pipeline
- Recommended: Run before committing schema changes

## Related Documentation

- [DB Migrations Guide](../../docs/canon/DB_MIGRATIONS.md) - Migration workflow and standards
- [DB Schema Manifest](../../docs/canon/DB_SCHEMA_MANIFEST.json) - Canonical schema allowlist
- [Review Checklist](../../docs/canon/REVIEW_CHECKLIST.md) - PR review standards
