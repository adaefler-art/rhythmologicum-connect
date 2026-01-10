# Funnel Wiring Analysis (v0.5)

## Executive Summary
The current funnel stack is **hybrid**:

1) **DB-driven Funnel Runtime (B1/B3/B5/B8)**
- Uses relational tables (`funnels`, `funnel_steps`, `funnel_step_questions`, `questions`, `assessments`, `assessment_answers`).
- This is the authoritative source for the *actual assessment flow* (step navigation, validation, step-skipping prevention).

2) **Manifest-based Funnel Versioning (V05-I02.2 + V05-I06.4)**
- Uses `funnel_versions` JSONB fields (`questionnaire_config`, `content_manifest`) validated by Zod schemas.
- Currently used primarily for **manifest content pages** (and partially for intro UI metadata).

3) **Legacy Content Resolver (F5/F6)**
- Uses `content_pages` + category fallback logic via `/api/content/resolve`.
- Intro routing still depends on this (with graceful fallback when missing content).

This hybrid state is workable, but it introduces **wiring drift risk**, especially around **slug canonicalization** and around which “source of truth” is used for which UI.

---

## Systems & Contracts (What is the source of truth?)

### A) Assessment Runtime (DB-driven)
**Key endpoints** (see Endpoint Inventory):
- `POST /api/funnels/[slug]/assessments` starts an assessment: [app/api/funnels/[slug]/assessments/route.ts](../app/api/funnels/[slug]/assessments/route.ts)
- `GET /api/funnels/[slug]/assessments/[assessmentId]` restores status + current step: [app/api/funnels/[slug]/assessments/[assessmentId]/route.ts](../app/api/funnels/[slug]/assessments/[assessmentId]/route.ts)
- `POST /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/validate` enforces required validation + step-skipping prevention: [app/api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts](../app/api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts)

**Frontend callsite**:
- Patient runtime client uses `/api/funnels/${slug}/definition` + `/api/funnels/${slug}/assessments/...`: [app/patient/funnel/[slug]/client.tsx](../app/patient/funnel/[slug]/client.tsx)

**Definition builder**:
- `GET /api/funnels/[slug]/definition` composes a `FunnelDefinition` from DB tables: [app/api/funnels/[slug]/definition/route.ts](../app/api/funnels/[slug]/definition/route.ts)

**Important observation**:
- The runtime endpoints do NOT currently canonicalize the slug in several places (see “Slug Canonicalization Drift” below).

---

### B) Manifest-based Funnel Versioning (Plugin Manifest)
**Loader**:
- Server-only loader reads `funnels_catalog` + `funnel_versions`, validates Zod schemas, returns `LoadedFunnelVersion`: [lib/funnels/loadFunnelVersion.ts](../lib/funnels/loadFunnelVersion.ts)

**Schema contract**:
- Questionnaire config requires `steps: QuestionnaireStep[]` and content manifest requires `pages: ContentPage[]`: [lib/contracts/funnelManifest.ts](../lib/contracts/funnelManifest.ts)

**Current usage**:
- Patient intro page loads manifest, but explicitly allows legacy fallback on manifest validation error: [app/patient/funnel/[slug]/intro/page.tsx](../app/patient/funnel/[slug]/intro/page.tsx)
- Patient content pages are manifest-only and fail-closed if the manifest is invalid: [app/patient/funnel/[slug]/content/[pageSlug]/page.tsx](../app/patient/funnel/[slug]/content/[pageSlug]/page.tsx)
- Clinician manifest editor is a client page that loads/saves via admin endpoints (manifest CRUD): [app/clinician/funnels/[identifier]/editor/page.tsx](../app/clinician/funnels/[identifier]/editor/page.tsx)

---

### C) Legacy Content Resolver (optional intro/info/result pages)
**Endpoint**:
- `GET /api/content/resolve?funnel=...&category=intro|info|result`: [app/api/content/resolve/route.ts](../app/api/content/resolve/route.ts)

**Core logic**:
- Canonicalizes slug and supports aliases; can treat registry-only funnels as “known but missing content”: [lib/utils/contentResolver.ts](../lib/utils/contentResolver.ts)

**Patient entrypoint behavior**:
- Patient “start funnel” page checks if an intro content page exists (via `getContentPage`) and redirects to `/intro` if it does: [app/patient/funnel/[slug]/page.tsx](../app/patient/funnel/[slug]/page.tsx)

---

## Slug Canonicalization Drift (Likely root cause of some wiring bugs)
There is an important inconsistency:

- `GET /api/funnels/[slug]/definition` **does canonicalize** using `getCanonicalFunnelSlug(slug)` before querying `funnels`: [app/api/funnels/[slug]/definition/route.ts](../app/api/funnels/[slug]/definition/route.ts)
- Content resolver (`getContentPage`) **does canonicalize** and even checks aliases + catalog: [lib/utils/contentResolver.ts](../lib/utils/contentResolver.ts)
- BUT assessment runtime endpoints like `POST /api/funnels/[slug]/assessments` currently query `.eq('slug', slug)` without canonicalization: [app/api/funnels/[slug]/assessments/route.ts](../app/api/funnels/[slug]/assessments/route.ts)
- Patient runtime client uses the URL slug directly for assessment endpoints (`/api/funnels/${slug}/assessments/...`): [app/patient/funnel/[slug]/client.tsx](../app/patient/funnel/[slug]/client.tsx)

**Impact**:
- If a URL uses a legacy alias slug, the app can still successfully:
  - load funnel definition (canonicalized)
  - resolve intro pages (canonicalized)

  …but fail to:
  - start/resume an assessment (not canonicalized)

This mismatch can present as “runtime can’t find steps/current step” or generic “assessment could not be loaded” errors depending on which endpoint fails.

---

## “Steps Undefined” — Most plausible failure modes
I didn’t find a literal `steps undefined` string in the repo, but based on the wiring, the common practical causes are:

1) **Slug mismatch across endpoints** (definition/content succeed, assessment runtime fails): see above.
2) **Funnel exists but has zero `funnel_steps`** → navigation can’t determine `currentStep` (server returns internal error).
3) **Manifest-only pages expect manifest steps** (content page is strict), but manifest invalidation throws `ManifestValidationError` and patient content route fails-closed.

If you can paste the exact error stack/log line you saw (“steps undefined” context), I can pinpoint which of the above it maps to.

---

## Recommended next actions (minimal, evidence-driven)
1) Decide a single rule: **always canonicalize slugs at the API boundary** (recommended).
2) Apply that rule consistently for runtime endpoints under `/api/funnels/[slug]/assessments/*`.
3) Add a tiny test to lock the behavior (alias slug should still start/resume assessments).

(If you want, I can implement (2)+(3) as a minimal patch.)
