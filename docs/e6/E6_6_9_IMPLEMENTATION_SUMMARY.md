# E6.6.9 — Dev Harness: Deterministic Triage Test Inputs

**Epic:** E6.6.9  
**Status:** ✅ Complete  
**Date:** 2026-01-16

## Overview

This epic adds deterministic test inputs for the triage system, enabling reproducible testing of all router paths (INFO, ASSESSMENT, ESCALATE). It includes both documentation-based test inputs and an optional dev UI for quick-fill testing.

---

## Problem Statement

For reproducible tests, we needed deterministic inputs to test all router paths in the triage system. This enables:
- Automated testing with predictable outcomes
- Manual testing with consistent inputs
- Developer onboarding with clear examples
- Quality assurance with standard test cases

---

## Solution

### 1. Deterministic Test Input Catalog

**File:** `docs/dev/triage_test_inputs_v1.md`

Created a comprehensive catalog of 10 canned inputs covering all triage tiers:

#### INFO Tier (3 inputs) → `SHOW_CONTENT`
- Input 1: Basic info query (German)
- Input 2: Info query with "how does" pattern (English)
- Input 3: Learning request (German)

#### ASSESSMENT Tier (4 inputs) → `START_FUNNEL_A`
- Input 4: Stress concern (German)
- Input 5: Sleep problems (German)
- Input 6: Anxiety and worry (English)
- Input 7: Overwhelmed state (German)

#### ESCALATE Tier (3 inputs) → `SHOW_ESCALATION`
- Input 8: Suicidal ideation (German)
- Input 9: Chest pain emergency (German)
- Input 10: Severe breathing difficulty (English)

**Coverage:**
- All 3 triage tiers covered
- All 3 primary nextAction values covered (SHOW_CONTENT, START_FUNNEL_A, SHOW_ESCALATION)
- Both German and English examples
- Red flag and non-red flag examples

### 2. Automated Test Suite

**File:** `lib/triage/__tests__/cannedInputs.test.ts`

Created comprehensive test suite validating all 10 inputs:

```typescript
describe('Triage Test Inputs v1 - Deterministic Canned Examples', () => {
  // INFO Tier tests (3 tests)
  // ASSESSMENT Tier tests (4 tests)
  // ESCALATE Tier tests (3 tests)
  // Coverage verification tests (3 tests)
  // Determinism tests (3 tests)
})
```

**Test Results:** ✅ 16/16 tests passing

**Verification:**
- Each input produces expected `tier`
- Each input produces expected `nextAction`
- Red flag inputs correctly populate `redFlags` array
- Determinism verified (same input → same output)

### 3. Dev Harness UI (Optional)

**File:** `app/patient/dashboard/components/AMYComposer.tsx`

Added collapsible dev harness with quick-fill buttons for rapid testing:

**Features:**
- 3 quick-fill buttons (one per tier)
- Color-coded by severity:
  - 💬 Info (green) → INFO tier
  - 📋 Assessment (amber) → ASSESSMENT tier
  - 🚨 Escalate (red) → ESCALATE tier
- Collapsible UI (show/hide toggle)
- Clear dev-only labeling

**Environment Gating (AC2):**
The dev harness only appears when:
1. Hostname is `localhost` OR
2. Hostname is `127.0.0.1` OR
3. Hostname contains `preview` OR
4. Hostname contains `dev-` OR
5. localStorage override: `localStorage.setItem('devHarnessEnabled', 'true')`

**Production Safety:**
- Hidden by default in production
- No process.env access (avoids linting issues)
- Client-side only (no server-side rendering)
- Can be manually enabled for testing via localStorage

---

## Implementation Details

### Changes Made

#### 1. Documentation
- **docs/dev/triage_test_inputs_v1.md**: Comprehensive catalog of 10 test inputs
  - JSON format for each input
  - Expected outcomes documented
  - Usage examples for tests and dev UI
  - Coverage matrix
  - Maintenance guidelines

#### 2. Tests
- **lib/triage/__tests__/cannedInputs.test.ts**: Full test suite
  - 10 individual input tests
  - 3 coverage verification tests
  - 3 determinism tests
  - All assertions on tier, nextAction, redFlags, version

#### 3. UI Enhancement
- **app/patient/dashboard/components/AMYComposer.tsx**: Dev harness
  - `isDevHarnessEnabled()` function with hostname checks
  - `DEV_QUICK_FILLS` constant with 3 test inputs
  - `handleDevQuickFill()` handler
  - `showDevHarness` state for collapse/expand
  - Purple-themed dev UI section with clear labeling

### Code Quality

**Linting:** ✅ All files pass ESLint  
**Type Safety:** ✅ All files pass TypeScript strict checks  
**Tests:** ✅ 16/16 tests passing  
**Test Coverage:** ✅ All router paths covered

---

## Acceptance Criteria

### ✅ AC1: Each input produces expected nextAction in tests

Verified in `lib/triage/__tests__/cannedInputs.test.ts`:
- Input 1-3 → `SHOW_CONTENT` ✅
- Input 4-7 → `START_FUNNEL_A` ✅
- Input 8-10 → `SHOW_ESCALATION` ✅
- All assertions passing (16/16 tests)

### ✅ AC2: Dev UI only in non-prod

Implemented in `AMYComposer.tsx`:
- `isDevHarnessEnabled()` checks hostname
- Only shown on localhost, preview, or dev- hosts
- Hidden in production by default
- Can be manually enabled via localStorage override
- No process.env access (clean linting)

---

## Usage

### For Automated Testing

```typescript
import { runTriageEngine } from '@/lib/triage/engine'
import { TRIAGE_TIER, TRIAGE_NEXT_ACTION } from '@/lib/api/contracts/triage'

// Test INFO tier
const result = runTriageEngine({
  inputText: 'Was ist Stress und wie wirkt er sich auf meine Gesundheit aus?',
})
expect(result.tier).toBe(TRIAGE_TIER.INFO)
expect(result.nextAction).toBe(TRIAGE_NEXT_ACTION.SHOW_CONTENT)
```

### For Manual Testing (Dev UI)

1. Navigate to patient dashboard: `http://localhost:3000/patient/dashboard`
2. Look for purple "Dev Harness - Test Inputs" section
3. Click "Show" to expand
4. Click one of the quick-fill buttons:
   - 💬 Info - fills INFO tier example
   - 📋 Assessment - fills ASSESSMENT tier example
   - 🚨 Escalate - fills ESCALATE tier example
5. Submit to test triage routing

### For Manual Testing (Production)

To enable dev harness in deployed environment (for testing):

```javascript
// In browser console:
localStorage.setItem('devHarnessEnabled', 'true')
// Then reload the page
```

---

## Testing Strategy

### Unit Tests
- ✅ All 10 canned inputs tested individually
- ✅ Coverage verification (all tiers, all nextActions)
- ✅ Determinism verification (repeated inputs)

### Integration Testing
- Manual testing via dev UI
- Can use quick-fill buttons to test entire triage flow
- Verifies router navigation to correct destinations

### Regression Testing
- Deterministic inputs provide stable test baseline
- Can be run in CI/CD pipeline
- Detects changes to triage classification logic

---

## Files Changed

### Created
1. `docs/dev/triage_test_inputs_v1.md` (9,605 bytes)
2. `lib/triage/__tests__/cannedInputs.test.ts` (10,453 bytes)

### Modified
1. `app/patient/dashboard/components/AMYComposer.tsx` (+116 lines)

**Total Changes:** +20,174 bytes (2 new files, 1 modified)

---

## Dependencies

### Existing Systems
- Triage Engine v1 (`lib/triage/engine.ts`)
- Triage Router (`lib/triage/router.ts`)
- Triage Contracts (`lib/api/contracts/triage/index.ts`)
- Red Flag Catalog (`lib/triage/redFlagCatalog.ts`)

### No New Dependencies
- No npm packages added
- No external services required
- Uses existing UI components (Card, Button, etc.)

---

## Maintenance

### Adding New Test Inputs

To add a new test input to the catalog:

1. Add to documentation (`docs/dev/triage_test_inputs_v1.md`):
   ```json
   {
     "inputText": "Your test input text",
     "expectedTier": "INFO|ASSESSMENT|ESCALATE",
     "expectedNextAction": "SHOW_CONTENT|START_FUNNEL_A|SHOW_ESCALATION",
     "expectedRedFlags": [],
     "description": "Brief description"
   }
   ```

2. Add test case (`lib/triage/__tests__/cannedInputs.test.ts`):
   ```typescript
   it('Input N: Description → TIER tier', () => {
     const result = runTriageEngine({ inputText: '...' })
     expect(result.tier).toBe(TRIAGE_TIER.X)
     expect(result.nextAction).toBe(TRIAGE_NEXT_ACTION.Y)
   })
   ```

3. (Optional) Add to dev UI (`AMYComposer.tsx` DEV_QUICK_FILLS array)

4. Update coverage matrix in documentation

5. Increment version in documentation (patch: 1.0.0 → 1.0.1)

### Modifying Existing Inputs

When triage engine logic changes:
1. Review all 10 test inputs
2. Update expected outcomes if needed
3. Update tests to match new behavior
4. Document changes in `docs/dev/triage_test_inputs_v1.md`
5. Increment version appropriately

---

## Future Enhancements

### Potential Improvements
1. **Environment Variable Override**: Add `NEXT_PUBLIC_DEV_HARNESS_ENABLED` support
2. **Extended Input Set**: Add more edge cases (e.g., multilingual, boundary conditions)
3. **Export Feature**: Add ability to export test results as JSON
4. **A/B Testing**: Add support for comparing different engine versions
5. **Session Recording**: Add ability to record and replay triage sessions

### Not Implemented (Out of Scope)
- ❌ Persistence of test results
- ❌ Automated UI testing with Playwright
- ❌ Performance benchmarking
- ❌ i18n beyond German/English
- ❌ Admin dashboard for test management

---

## Security Considerations

### Dev Harness Security
- ✅ Only shown in development environments
- ✅ No sensitive data exposed
- ✅ No server-side secrets accessible
- ✅ No authentication bypass
- ✅ No database write access

### Test Input Security
- ✅ All inputs are public (no PHI)
- ✅ No credentials in test data
- ✅ Safe to commit to version control
- ✅ Safe for CI/CD logs

---

## Documentation References

- **Epic Documentation**: This file
- **Test Inputs Catalog**: `docs/dev/triage_test_inputs_v1.md`
- **Red Flag Catalog**: `docs/clinical/triage_red_flags_v1.md`
- **Triage Engine**: `lib/triage/engine.ts`
- **Triage Router**: `lib/triage/router.ts`

---

## Acceptance Criteria Verification

| Criterion | Status | Evidence |
|-----------|--------|----------|
| AC1: Each input produces expected nextAction | ✅ | 16/16 tests passing in `cannedInputs.test.ts` |
| AC2: Dev UI only in non-prod | ✅ | `isDevHarnessEnabled()` with hostname checks |

---

## Conclusion

E6.6.9 successfully delivers:
1. ✅ 10 deterministic test inputs with complete documentation
2. ✅ Comprehensive test suite (16 tests, all passing)
3. ✅ Optional dev UI for manual testing
4. ✅ Production-safe environment gating

The implementation provides a solid foundation for reproducible triage testing, developer onboarding, and quality assurance. All acceptance criteria met.

**Status:** ✅ Complete and Ready for Review
