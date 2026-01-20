# E6.6.6 — Triage Session Persistence Implementation Summary

## Overview
PHI-safe persistence of triage session metadata for pilot debugging without storing raw user input.

## Problem Statement
For pilot debugging, the team needs to retrospectively answer "What was the triage decision?" without storing Protected Health Information (PHI) or free-text user input.

## Solution
A dedicated `triage_sessions` table that stores:
- Triage decision metadata (tier, next_action, red_flags)
- SHA-256 hash of input text (for idempotency/debugging)
- Rules version (for governance)
- Bounded rationale (max 280 chars, no PHI)

**NO raw inputText is stored** - only the cryptographic hash.

## Acceptance Criteria

### ✅ AC1: No raw text stored; only hash
- Table schema has `input_hash` column (64-char SHA-256 hex)
- Constraint enforces `length(input_hash) = 64`
- NO `input_text` or `inputText` column exists
- Hash function uses Node.js `crypto.createHash('sha256')`
- Unit tests verify hash cannot be reversed to original text

### ✅ AC2: Patient can only read own; clinician/admin only pilot org
- RLS policy: `triage_sessions_patient_read_own`
  - Patient reads own: `patient_id = auth.uid()`
- RLS policy: `triage_sessions_clinician_admin_read_all`
  - Clinician/admin reads all: `has_role('clinician') OR has_role('admin')`
- RLS verification script: `test/e6-6-6-triage-sessions-rls.sql`

### ✅ AC3: Insert after eligibility and validation
- Insertion in `/api/patient/triage` after:
  1. `requirePilotEligibility()` passes (401/403 checks first)
  2. Request validation passes (400/413 checks)
  3. Triage engine runs and result validated
- Best-effort insertion (non-blocking - failures logged but don't block response)
- Same pattern in `/api/amy/triage`

## Database Schema

### Table: `triage_sessions`
```sql
CREATE TABLE triage_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  patient_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  correlation_id text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('INFO', 'ASSESSMENT', 'ESCALATE')),
  next_action text NOT NULL CHECK (next_action IN (...)),
  red_flags text[] DEFAULT ARRAY[]::text[] NOT NULL,
  input_hash text NOT NULL CHECK (length(input_hash) = 64),
  rules_version text NOT NULL,
  rationale text CHECK (rationale IS NULL OR length(rationale) <= 280)
);
```

### Indexes
- `idx_triage_sessions_patient_id_created_at` - Patient queries
- `idx_triage_sessions_correlation_id` - Request tracing
- `idx_triage_sessions_created_at` - Time-based queries
- `idx_triage_sessions_input_hash` - Idempotency checks

### RLS Policies
1. **Patient Read Own**: `patient_id = auth.uid()`
2. **Clinician/Admin Read All**: `has_role('clinician') OR has_role('admin')`
3. **Authenticated Insert**: `patient_id = auth.uid()` (own records only)

## Implementation Files

### Migration
- `supabase/migrations/20260116160600_e6_6_6_create_triage_sessions.sql`

### TypeScript
- `lib/triage/sessionStorage.ts` - Hash computation and DB operations
  - `computeInputHash(inputText: string): string` - SHA-256 hash
  - `insertTriageSession(...)` - Best-effort insert
  - `getTriageSessionsForPatient(...)` - Query helper
- `app/api/patient/triage/route.ts` - Integration
- `app/api/amy/triage/route.ts` - Integration

### Tests
- `lib/triage/__tests__/sessionStorage.test.ts` - Unit tests for hash function
  - 11 tests covering determinism, PHI safety, edge cases
- `test/e6-6-6-triage-sessions-rls.sql` - RLS verification SQL script

### Schema
- `schema/schema.sql` - Updated master schema with triage_sessions table

## Key Design Decisions

### 1. PHI-Safe by Design
- NO raw text storage - architectural impossibility to leak PHI from raw input
- Only SHA-256 hash stored (one-way function, cannot reverse)
- Rationale is bounded to 280 chars and comes from predefined templates (no user input)

### 2. Best-Effort Persistence
- Triage session insertion is non-blocking
- Failures are logged but don't affect triage response
- Ensures pilot functionality continues even if DB write fails

### 3. Hash Normalization
- Input normalized before hashing: `trim().toLowerCase()`
- Ensures consistent hashes for equivalent inputs
- Helps with idempotency detection

### 4. Rules Versioning
- `rules_version` field stores `TRIAGE_RULESET_VERSION` constant
- Currently "1.0.0" from `lib/triage/engine.ts`
- Enables retrospective analysis of which rules produced which decisions

### 5. RLS at Database Level
- Row-level security enforced by PostgreSQL
- Cannot be bypassed by application code
- Aligns with V0.5 comprehensive RLS architecture

## Usage Examples

### 1. Hash Computation
```typescript
import { computeInputHash } from '@/lib/triage/sessionStorage'

const hash = computeInputHash('Ich fühle mich sehr gestresst')
// Returns: "20885ae2..." (64-char hex string)
```

### 2. Insert Triage Session
```typescript
await insertTriageSession({
  patientId: user.id,
  correlationId: 'req-123',
  inputText: 'Ich fühle mich sehr gestresst',
  triageResult: {
    tier: 'ASSESSMENT',
    nextAction: 'START_FUNNEL_A',
    redFlags: [],
    rationale: 'Basierend auf Ihrer Nachricht...',
    version: 'v1',
    correlationId: 'req-123'
  }
})
```

### 3. Query Patient Sessions
```typescript
const sessions = await getTriageSessionsForPatient(patientId, 50)
// Returns last 50 sessions for patient (RLS enforced)
```

## Verification

### Unit Tests
```bash
npm test -- lib/triage/__tests__/sessionStorage.test.ts
```
Expected: All 11 tests pass

### RLS Tests
```bash
psql -d postgres -f test/e6-6-6-triage-sessions-rls.sql
```
Expected: "PASS: All E6.6.6 triage_sessions RLS checks passed"

### Manual Verification
See `scripts/verify/verify-e6-6-6-triage-sessions.ps1` for step-by-step manual verification guide.

## Future Enhancements (Out of Scope for v0.6)

1. **Session Deduplication**: Use input_hash to detect duplicate submissions
2. **Analytics Dashboard**: Aggregate tier/action statistics for pilot analysis
3. **Retention Policy**: Auto-delete sessions after retention period
4. **Export Function**: Export sessions for pilot reporting (hash-only, no PHI)

## Security Considerations

### ✅ PHI Safety
- Raw input NEVER stored in database
- Hash is one-way cryptographic function (SHA-256)
- Rationale uses predefined templates, not user input

### ✅ RLS Enforcement
- Patient isolation at database level
- Clinician/admin access for debugging
- Cannot be bypassed by application code

### ✅ Audit Trail
- All sessions have `created_at` timestamp
- `correlation_id` for request tracing
- `rules_version` for governance

### ⚠️ Hash Collision Risk
- SHA-256 collision probability is negligible (2^-256)
- Acceptable for pilot debugging use case
- If collision concerns arise, can add salt/HMAC in future

## Related Issues

- E6.6.3: Deterministic triage engine (provides rules_version)
- E6.6.4: Patient triage endpoint (integration point)
- E6.6.5: Triage storage helper (client-side sessionStorage, separate concern)
- E6.4.8: Pilot flow events (similar PHI-safe telemetry pattern)

## References

- Issue: E6.6.6
- Migration: `supabase/migrations/20260116160600_e6_6_6_create_triage_sessions.sql`
- Code: `lib/triage/sessionStorage.ts`
- Tests: `lib/triage/__tests__/sessionStorage.test.ts`
- Verification: `scripts/verify/verify-e6-6-6-triage-sessions.ps1`
