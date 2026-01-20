# E6.4.2 — Patient Onboarding Happy Path

## Overview

This document describes the stable "happy path" for patient onboarding in the Rhythmologicum Connect pilot.

## Flow Diagram

```
┌─────────────────┐
│  Patient Login  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      No      ┌──────────────────┐
│  Has Consent?   │─────────────>│  Consent Page    │
└────────┬────────┘              └────────┬─────────┘
         │ Yes                            │
         │                                │ Submit
         │                                ▼
         │                    ┌──────────────────────┐
         │                    │ Save consent record  │
         │                    │ (user_consents)      │
         │                    └──────────┬───────────┘
         │                               │
         ▼                               ▼
┌─────────────────┐      No      ┌──────────────────┐
│  Has Profile?   │─────────────>│  Profile Page    │
└────────┬────────┘              └────────┬─────────┘
         │ Yes                            │
         │                                │ Submit
         │                                ▼
         │                    ┌──────────────────────────┐
         │                    │ Save profile             │
         │                    │ Set onboarding_status=   │
         │                    │ 'completed'              │
         │                    └──────────┬───────────────┘
         │                               │
         ▼                               ▼
┌─────────────────────────────────────────┐
│          Patient Dashboard              │
│                                         │
│  ┌───────────────────────────────────┐  │
│  │  Next Step (AC3)                  │  │
│  │                                   │  │
│  │  IF in-progress assessment:       │  │
│  │    → "Continue Assessment"        │  │
│  │                                   │  │
│  │  ELSE:                            │  │
│  │    → "Start Assessment"           │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Quick Actions:                         │
│  - All Assessments (→ /patient/funnels) │
│  - History (→ /patient/history)         │
└─────────────────────────────────────────┘
```

## Acceptance Criteria

### AC1: Onboarding Status Persistence ✓

After completing the onboarding profile step, the `onboarding_status` field in `patient_profiles` is set to `'completed'`.

**Implementation:**
- Migration: `20260114103400_e6_4_2_add_onboarding_status.sql`
- Action: `lib/actions/onboarding.ts` → `saveBaselineProfile()`
- Database: `patient_profiles.onboarding_status` enum (`not_started`, `in_progress`, `completed`)

**Verification:**
```sql
SELECT user_id, full_name, onboarding_status 
FROM patient_profiles 
WHERE user_id = '<user_id>';
```

### AC2: Dashboard as Landing Page ✓

After completing onboarding, patients are redirected to `/patient/dashboard` (not `/patient/funnels`).

**Implementation:**
- Route: `/app/patient/page.tsx` redirects to `/patient/dashboard`
- Profile page: `/app/patient/onboarding/profile/client.tsx` redirects to `/patient/dashboard`

**Verification:**
1. Complete onboarding as a test patient
2. Observe redirect to `/patient/dashboard`
3. Navigate to `/patient` and verify redirect to `/patient/dashboard`

### AC3: Dashboard Shows Next Step ✓

Dashboard displays context-aware CTA based on assessment state:

- **Has in-progress assessment:** "Continue Assessment" button
- **No in-progress assessment:** "Start Assessment" button

**Implementation:**
- Component: `/app/patient/dashboard/client.tsx`
- API: `/api/assessments/in-progress` (checks for `completed_at IS NULL`)

**Verification:**
```powershell
# Check for in-progress assessments
iwr http://localhost:3000/api/assessments/in-progress `
  -Headers @{ Cookie = $cookie } `
  -SkipHttpErrorCheck
```

### AC4: Deterministic States ✓

All states are deterministic and free from race conditions:

- Onboarding status is persisted to database immediately
- No client-side state used as source of truth
- API endpoints check database state directly
- Idempotent operations prevent duplicate records

**Implementation:**
- Idempotent consent recording (checks for existing consent)
- Idempotent profile creation (handles unique constraint violations)
- Server-side status checks (no client-side state)

## Key Files

### Database
- `supabase/migrations/20260114103400_e6_4_2_add_onboarding_status.sql`

### Backend
- `lib/contracts/onboarding.ts` - Types and schemas
- `lib/actions/onboarding.ts` - Server actions
- `app/api/patient/onboarding-status/route.ts` - Status endpoint
- `app/api/assessments/in-progress/route.ts` - In-progress assessments

### Frontend
- `app/patient/page.tsx` - Patient index (redirects)
- `app/patient/dashboard/page.tsx` - Dashboard page
- `app/patient/dashboard/client.tsx` - Dashboard UI
- `app/patient/onboarding/consent/client.tsx` - Consent page
- `app/patient/onboarding/profile/client.tsx` - Profile page

### Tests
- `app/api/patient/onboarding-status/__tests__/route.test.ts`
- `app/api/assessments/in-progress/__tests__/route.test.ts`
- `lib/actions/__tests__/onboarding.test.ts`
- `lib/contracts/__tests__/onboarding.test.ts`

## Manual Verification

### Setup
1. Start local development server: `npm run dev`
2. Create test patient account
3. Obtain session cookie

### Happy Path Test
1. **Login** as test patient
2. **Consent Page** - Accept terms
3. **Profile Page** - Enter name (required), optional: birth year, sex
4. **Submit** profile
5. **Verify Redirect** to `/patient/dashboard`
6. **Verify CTA** shows "Start Assessment" (if no assessments)
7. **Start an Assessment** (navigate to funnels, start one)
8. **Return to Dashboard** (navigate to `/patient`)
9. **Verify CTA** now shows "Continue Assessment"

### PowerShell Verification
```powershell
# Run verification script
.\scripts\verify\verify-e6-4-2-onboarding.ps1 `
  -BaseUrl "http://localhost:3000" `
  -Cookie "sb-access-token=<your-token>"
```

## API Endpoints

### GET `/api/patient/onboarding-status`
Returns onboarding status for authenticated user.

**Response:**
```json
{
  "success": true,
  "data": {
    "needsConsent": false,
    "needsProfile": false,
    "completed": true,
    "status": "completed"
  }
}
```

### GET `/api/assessments/in-progress`
Returns most recent in-progress assessment (if any).

**Response (in-progress found):**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "funnel": "stress-assessment",
    "funnel_id": "uuid",
    "started_at": "2026-01-14T10:00:00Z",
    "completed_at": null
  }
}
```

**Response (none found):**
```json
{
  "success": false,
  "error": {
    "code": "NO_IN_PROGRESS",
    "message": "No in-progress assessments found"
  }
}
```

## Database Schema Changes

### `patient_profiles` table
```sql
-- New column (E6.4.2)
onboarding_status onboarding_status_enum NOT NULL DEFAULT 'not_started'

-- Enum definition
CREATE TYPE onboarding_status_enum AS ENUM (
  'not_started',
  'in_progress',
  'completed'
);
```

## Notes

- **Migration Safe:** Existing profiles with `full_name` are automatically updated to `completed` status
- **Backward Compatible:** Status field is optional in API responses for clients not yet updated
- **Future-Proof:** `in_progress` status reserved for multi-step onboarding flows
- **Deterministic:** All state checks happen server-side against database

## Related Issues

- E6.4.1 — Patient Dashboard API (pilot eligibility)
- E6.4.10 — Seed: Testpatient + onboarding defaults
- E6.1.7 — Mobile Shell (UI stability)
