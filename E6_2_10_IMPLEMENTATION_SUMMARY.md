# E6.2.10 Implementation Summary — Mobile Contract Export & CI Verification

## Overview

This implementation adds a deterministic mobile contract export system and CI verification to prevent drift between code and documentation/schemas, specifically for the iOS mobile application API surface.

## Problem Statement

**Goal:** Prevent drift between code and documentation/schemas.

**Requirements:**
- Script-Export: scripts/dev/mobile-contract/export.js → docs/dev/mobile-contracts.v1.json
- CI-Verify: scripts/ci/verify-mobile-contracts.ps1
- Deterministic Export
- CI-Fail contains regenerate command

## Implementation Details

### 1. Export Script (`scripts/dev/mobile-contract/export.js`)

**Location:** `/scripts/dev/mobile-contract/export.js`

**Functionality:**
- Exports mobile API contracts to deterministic JSON format
- Based on `docs/mobile/MOBILE_API_SURFACE.md` (manually synchronized)
- Includes 19 endpoints across 7 categories:
  - Authentication & Onboarding
  - Funnel Catalog
  - Assessment Lifecycle
  - Assessment Step Validation
  - Assessment Answers
  - Results & History
  - Patient Profile
- Outputs to `docs/dev/mobile-contracts.v1.json`

**Key Features:**
- ✅ **Deterministic sorting:** Uses simple ASCII sort (no localeCompare)
- ✅ **No timestamps:** Ensures identical output across runs
- ✅ **Sorted object keys:** Recursive key sorting for consistency
- ✅ **Statistics calculation:** Automatically counts endpoints by category

**Content Included:**
- Endpoint metadata (path, method, priority, auth requirements)
- Caching specifications (max-age, ETag, Cache-Control)
- Pagination details (cursor-based or limit-based)
- Rate limits
- Schema version fields
- Status code documentation
- Response format guarantees
- Error codes
- Versioning strategy

**Usage:**
```bash
# Generate export
node scripts/dev/mobile-contract/export.js

# Generate to specific output
node scripts/dev/mobile-contract/export.js --out docs/dev/mobile-contracts.v1.json

# Via npm script
npm run mobile:contracts
```

**Statistics:**
- Total Endpoints: 19
- MUST Support: 11
- NICE Support: 8
- Cacheable: 5
- Paginated: 2

### 2. CI Verification Script (`scripts/ci/verify-mobile-contracts.ps1`)

**Location:** `/scripts/ci/verify-mobile-contracts.ps1`

**Functionality:**
- Verifies mobile contracts are up-to-date in CI/CD pipeline
- Checks for deterministic output
- Compares generated vs. committed files
- Provides detailed failure messages with fix instructions

**Verification Steps:**
1. **Environment Diagnostics** - Git, Node.js, OS info
2. **Export to Temp** - Runs export to temporary directory
3. **Determinism Check** - Runs export twice and compares SHA256 hashes
4. **Drift Detection** - Compares temp export with committed file
5. **Success/Failure** - Exit code 0 (success), 2 (non-deterministic), 3 (drift)

**Failure Messages:**
- Shows hash comparison (committed vs. generated)
- Displays diff preview (first 20 lines)
- Shows contract statistics from both files
- **Clear regenerate command:**
  ```bash
  node scripts/dev/mobile-contract/export.js --out docs/dev/mobile-contracts.v1.json
  ```

**Usage:**
```bash
# Run verification
pwsh -File scripts/ci/verify-mobile-contracts.ps1

# Via npm script
npm run mobile:contracts:verify

# Skip git diff check
pwsh -File scripts/ci/verify-mobile-contracts.ps1 -SkipGitDiff
```

**Exit Codes:**
- `0` - Success (all checks passed)
- `2` - Non-deterministic output (export produces different results)
- `3` - Drift detected (committed file doesn't match generated)

### 3. NPM Scripts

Added to `package.json`:
```json
{
  "mobile:contracts": "node scripts/dev/mobile-contract/export.js --out docs/dev/mobile-contracts.v1.json",
  "mobile:contracts:verify": "pwsh -File scripts/ci/verify-mobile-contracts.ps1"
}
```

### 4. Output File (`docs/dev/mobile-contracts.v1.json`)

**Location:** `/docs/dev/mobile-contracts.v1.json`

**Format:** Deterministic JSON with sorted keys

**Size:** ~13 KB (381 lines)

**Structure:**
```json
{
  "categories": { ... },
  "guarantees": {
    "authentication": { ... },
    "responseFormat": { ... },
    "errorCodes": { ... },
    "versioning": { ... },
    "caching": { ... }
  },
  "lastUpdated": "2026-01",
  "source": "docs/mobile/MOBILE_API_SURFACE.md",
  "statistics": { ... },
  "version": "v0.7"
}
```

## Testing Performed

### Export Script Tests
- ✅ Export runs without errors
- ✅ Deterministic output (identical on consecutive runs)
- ✅ Correct statistics calculation
- ✅ Valid JSON output
- ✅ Sorted keys throughout

### CI Verification Tests
- ✅ Passes when file is up-to-date
- ✅ Fails with exit code 3 when file is outdated
- ✅ Fails with exit code 2 when non-deterministic
- ✅ Shows clear error messages
- ✅ Provides regenerate command
- ✅ Shows diff preview

### NPM Scripts Tests
- ✅ `npm run mobile:contracts` works correctly
- ✅ `npm run mobile:contracts:verify` works correctly

## Acceptance Criteria ✅

- ✅ **Deterministic Export:** Export produces identical output on consecutive runs (verified via SHA256 hash comparison)
- ✅ **CI-Fail Contains Regenerate Command:** Error message includes exact command to regenerate:
  ```bash
  node scripts/dev/mobile-contract/export.js --out docs/dev/mobile-contracts.v1.json
  ```
- ✅ **Script-Export Path:** Implemented at `scripts/dev/mobile-contract/export.js`
- ✅ **Output Path:** Exports to `docs/dev/mobile-contracts.v1.json`
- ✅ **CI-Verify Path:** Implemented at `scripts/ci/verify-mobile-contracts.ps1`

## Integration with Existing Patterns

This implementation follows the same pattern as the design tokens verification:

**Similar to Design Tokens:**
- Export script structure (`scripts/dev/*/export.js`)
- CI verification script structure (`scripts/ci/verify-*.ps1`)
- Deterministic output requirements
- NPM script naming convention
- Error message format
- Diagnostic output format

**Differences:**
- Contract data is hardcoded (not extracted from source files)
- Simpler data structure (no complex theme merging)
- Focused on API contracts rather than design tokens

## Future Improvements

1. **Automated Extraction:** Parse `MOBILE_API_SURFACE.md` directly instead of manual synchronization
2. **API Route Scanning:** Automatically extract contracts from route files
3. **TypeScript Types:** Generate TypeScript types from contracts
4. **Validation:** Add contract validation against actual API routes
5. **Diff Highlighting:** More detailed diff output in CI failures
6. **Integration:** Add to GitHub Actions CI workflow

## Maintenance Notes

**Manual Synchronization Required:**
The contract definitions in `export.js` are manually synchronized with `docs/mobile/MOBILE_API_SURFACE.md`. When updating the markdown documentation:

1. Update endpoint definitions in `export.js`
2. Run `npm run mobile:contracts` to regenerate JSON
3. Commit both the script changes and updated JSON file
4. CI will verify consistency on future commits

**Source of Truth:**
`docs/mobile/MOBILE_API_SURFACE.md` is the primary source of truth for mobile API contracts. The export script translates this into a machine-readable format.

## Security Review

✅ **CodeQL:** No security alerts found

**Review Notes:**
- No sensitive data in exports
- No code execution from external sources
- Input validation on command-line arguments
- File operations use safe paths
- No network requests
- Deterministic behavior prevents injection attacks

## Related Documents

- `docs/mobile/MOBILE_API_SURFACE.md` - Source of truth for mobile API contracts
- `docs/mobile/CACHING_PAGINATION.md` - Detailed caching and pagination implementation
- `scripts/ci/verify-design-tokens.ps1` - Similar pattern for design tokens
- `scripts/dev/design-tokens/export.js` - Similar export script pattern

## Summary

This implementation successfully adds a deterministic mobile contract export system with CI verification, preventing drift between code and documentation. The solution follows established patterns in the codebase and provides clear error messages with regenerate commands when drift is detected.
