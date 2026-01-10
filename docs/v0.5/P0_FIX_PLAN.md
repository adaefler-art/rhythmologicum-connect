# P0 Fix Plan (v0.5) — Minimal-Diff, Issue-Shaped

This file distills systemic P0 findings from:
- [docs/v0.5/FUNNEL_WIRING_ANALYSIS.md](FUNNEL_WIRING_ANALYSIS.md)
- [docs/v0.5/STATUS_QUO_AND_DELTA.md](STATUS_QUO_AND_DELTA.md)

The intent is to create **2–4 concrete fix issues** with acceptance criteria and a test plan.

---

## P0-1) Canonicalize slug consistently across assessment runtime endpoints

**Problem**
- `/api/funnels/[slug]/definition` and legacy content resolution canonicalize slugs.
- Assessment runtime endpoints under `/api/funnels/[slug]/assessments/*` can still use the raw route slug.

**User risk**
- Alias slugs can load definition/intro but fail to start/resume/continue assessments.

**Scope (expected files)**
- `app/api/funnels/[slug]/assessments/route.ts`
- `app/api/funnels/[slug]/assessments/[assessmentId]/route.ts`
- `app/api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts`
- `app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts`
- `app/api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts`
- `app/api/funnels/[slug]/assessments/[assessmentId]/result/route.ts`

**Acceptance criteria**
- Given a known alias slug, all of the following succeed and operate on the canonical funnel:
  - Start assessment (`POST /assessments`)
  - Resume assessment (`GET /assessments/{id}`)
  - Validate step (`POST /steps/{stepId}/validate`)
  - Save answers (`POST /answers/save`)
  - Complete (`POST /complete`)
- No endpoint uses the raw slug for DB funnel lookup.

**Test plan**
- Add a route-level test that starts an assessment via an alias slug and verifies:
  - the created assessment references the canonical funnel
  - subsequent reads/step validation work with the alias slug

---

## P0-2) Align manifest strictness contract across intro vs content pages

**Problem**
- Patient intro currently tolerates invalid/missing manifest (legacy fallback).
- Patient content pages can fail-closed when the manifest is invalid, even if the DB runtime is otherwise usable.

**User risk**
- Inconsistent experience: the same funnel may appear available on intro but be blocked in content pages.

**Decision needed (choose one)**
- **Fail-closed everywhere**: require a valid manifest for any funnel exposing content routes.
- **Fail-open consistently**: introduce a deterministic fallback for content pages when manifest is invalid/missing.

**Acceptance criteria**
- The chosen contract is implemented consistently across patient intro and patient content pages.
- The user-facing error state is explicit (not a blank page, not a 500).

**Test plan**
- Add/update tests that simulate an invalid manifest and assert:
  - intro behavior matches the agreed contract
  - content pages behavior matches the agreed contract

---

## P0-3) Standardize “missing content” behavior (no 500s, stable layout)

**Problem**
- Missing/unknown content can result in:
  - `status: missing_content` from resolver
  - layout shrink in intro (already fixed)
  - API 500s from content-pages lookup failures (already hardened)

**User risk**
- Broken funnel entry and brittle UX around content configuration drift.

**Acceptance criteria**
- Known funnels never 500 due to missing content lookups.
- For `status: missing_content`, patient UI renders a stable, non-shrunk fallback card.
- Logging remains PHI-free.

**Test plan**
- Add/extend a UI test verifying the intro fallback renders at normal width.
- Add/extend an API test verifying `/api/funnels/{slug}/content-pages` returns `200 []` on lookup failures.

---

## Suggested verification commands
```powershell
npm test
if (Test-Path .next) { Remove-Item -Recurse -Force .next }
npm run build
```

---

## Seed + Invariant Gate (DB/Code Drift)
- CI runs `supabase db reset`, then applies a small deterministic seed for minimal funnel data.
- After seeding, a PowerShell invariant gate asserts required funnel runtime JSON is present.
- This prevents data/seed drift incidents where `funnel_versions.questionnaire_config.steps` is missing or empty.
- Optional: if `STAGING_DB_URL` GitHub Secret is set, CI checks remote staging schema drift (read-only).
