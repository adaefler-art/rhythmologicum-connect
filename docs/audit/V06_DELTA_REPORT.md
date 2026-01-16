# V0.6 Delta Report

## Audit Metadata

| Field | Value |
|-------|-------|
| **Release** | v0.6 |
| **Baseline Tag** | v0.5.0 |
| **Baseline Commit** | v0.5.0 (published 2026-01-11T11:32:05Z) |
| **HEAD Commit** | c03163bcfe23cb41a0c15d6bfa3bd9e106379297 |
| **Report Generated** | 2026-01-16T21:30:00Z |
| **PRs in Scope** | 30 merged (51 total since v0.5.0) |

---

## PR Inventory (merged to main after v0.5.0)

### Summary by Category

| Category | PR Count | Risk Flags |
|----------|----------|------------|
| **API** | 8 | Auth behavior, endpoint wiring |
| **DB** | 2 | Schema change, migration |
| **Auth/RLS** | 3 | Auth ordering, pilot eligibility |
| **UI** | 6 | Server component, navigation |
| **Tooling** | 4 | Endpoint catalog, telemetry |
| **Guardrails** | 5 | Contract validation, tests |
| **Docs** | 2 | Runbooks, clinical docs |

---

## PR Details

### PR #630 — Add contract tests and governance validation for /api/patient/triage endpoint
| Field | Value |
|-------|-------|
| Merged At | 2026-01-16T21:01:10Z |
| Merge Commit | c03163bcfe23cb41a0c15d6bfa3bd9e106379297 |
| Categories | Guardrails, API |
| Risk Flags | None |
| Files Changed | E6_6_10_COMPLETE.md, E6_6_10_IMPLEMENTATION_SUMMARY.md, E6_6_10_VERIFICATION_GUIDE.md, lib/api/contracts/patient/__tests__/triage.test.ts |
| Summary | 37 contract tests for TriageRequestV1/TriageResultV1 schemas, endpoint catalog verification |

### PR #629 — E6.6.9 — Add deterministic triage test inputs with dev harness
| Field | Value |
|-------|-------|
| Merged At | 2026-01-16T20:44:10Z |
| Merge Commit | (via #630 sequence) |
| Categories | Tooling, Guardrails |
| Risk Flags | None |
| Files Changed | docs/dev/triage_test_inputs_v1.md, lib/triage/__tests__/cannedInputs.test.ts, app/patient/dashboard/components/AMYComposer.tsx |
| Summary | 10 deterministic test inputs for INFO/ASSESSMENT/ESCALATE paths, optional dev harness UI |

### PR #628 — E6.6.8 — Centralize safety disclaimers and emergency guidance
| Field | Value |
|-------|-------|
| Merged At | 2026-01-16T20:20:57Z |
| Categories | UI, Guardrails |
| Risk Flags | None |
| Files Changed | lib/safety/disclaimers.ts, lib/ui/components/EmergencyContactInfo.tsx |
| Summary | Centralized patient-facing safety copy with 3 urgency tiers (non-emergency, standard, red flag) |

### PR #627 — E6.6.7 — Red Flag Catalog v1 (Allowlist, patterns, docs + tests)
| Field | Value |
|-------|-------|
| Merged At | 2026-01-16T20:05:15Z |
| Categories | API, Guardrails |
| Risk Flags | ⚠️ Auth behavior (red flag detection changes triage routing) |
| Files Changed | lib/triage/redFlagCatalog.ts, lib/triage/__tests__/redFlagCatalog.test.ts, lib/triage/engine.ts, docs/clinical/triage_red_flags_v1.md |
| Summary | 8 clinical red flag types, 100+ bilingual patterns, replaces inline keywords in triage engine |

### PR #626 — E6.6.6: Add PHI-safe triage session persistence with SHA-256 hashing
| Field | Value |
|-------|-------|
| Merged At | 2026-01-16T16:47:27Z |
| Categories | DB, API, Auth/RLS |
| Risk Flags | ⚠️ DB schema change (triage_sessions table), ⚠️ RLS policy |
| Files Changed | supabase/migrations/..._triage_sessions.sql, lib/triage/sessionStorage.ts, app/api/patient/triage/route.ts |
| Summary | PHI-safe audit trail with input hash (not raw text), RLS for patient isolation |

### PR #625 — E6.6.5: Add triage router for nextAction → navigation mapping
| Field | Value |
|-------|-------|
| Merged At | 2026-01-16T16:02:30Z |
| Categories | API, UI |
| Risk Flags | None |
| Files Changed | lib/triage/router.ts, lib/triage/storage.ts, app/patient/dashboard/components/AMYComposer.tsx |
| Summary | Deterministic mapping of 5 nextActions to navigation routes |

### PR #624 — E6.6.4: Add POST /api/patient/triage endpoint with 401-first auth
| Field | Value |
|-------|-------|
| Merged At | 2026-01-16T15:45:23Z |
| Categories | API, Auth/RLS |
| Risk Flags | ⚠️ Auth behavior (401-first ordering), ⚠️ Breaking route (new endpoint) |
| Files Changed | app/api/patient/triage/route.ts, app/api/patient/triage/__tests__/route.test.ts, docs/api/endpoint-catalog.json |
| Summary | Governed patient triage endpoint with auth→eligibility→validate→triage flow |

### PR #623 — [WIP] Implement triage decision pipeline for v0.6
| Field | Value |
|-------|-------|
| Merged At | 2026-01-16T14:34:07Z |
| Categories | API |
| Risk Flags | None |
| Files Changed | lib/triage/engine.ts, lib/triage/__tests__/engine.test.ts |
| Summary | Deterministic rule-based triage engine v1 (48 tests), replaces AI-based approach |

### PR #622 — E6.6.2 — Define TriageResult v1 contract with runtime validation
| Field | Value |
|-------|-------|
| Merged At | 2026-01-16T11:46:27Z |
| Categories | API, Guardrails |
| Risk Flags | None |
| Files Changed | lib/api/contracts/triage/index.ts, lib/api/contracts/triage/__tests__/index.test.ts, app/api/amy/triage/route.ts |
| Summary | TriageRequestV1 + TriageResultV1 Zod schemas with bounded rationale, redFlags allowlist |

### PR #621 — E6.6.1: Add AMY Composer with bounded input and AI triage
| Field | Value |
|-------|-------|
| Merged At | 2026-01-16T11:12:26Z |
| Categories | UI, API |
| Risk Flags | ⚠️ Server component risk |
| Files Changed | app/patient/dashboard/components/AMYComposer.tsx, app/api/amy/triage/route.ts |
| Summary | Dashboard AMY input with 10-800 char bounds, non-emergency disclaimer, suggested chips |

### PR #620 — Add CI gate for dashboard contract schema validation
| Field | Value |
|-------|-------|
| Merged At | 2026-01-16T10:31:17Z |
| Categories | Guardrails, Tooling |
| Risk Flags | None |
| Files Changed | .github/workflows/dashboard-contract-gate.yml |
| Summary | CI workflow for 57 dashboard contract tests, blocks breaking schema changes |

### PR #619 — E6.5.9: Mobile-friendly dashboard refresh with stale-while-revalidate
| Field | Value |
|-------|-------|
| Merged At | 2026-01-16T10:12:50Z |
| Categories | UI |
| Risk Flags | None |
| Files Changed | lib/hooks/useAppFocus.ts, lib/hooks/useDashboardData.ts, app/patient/dashboard/client.tsx |
| Summary | SWR pattern for dashboard, auto-refresh on focus, retry UI for errors |

### PR #618 — Fix navigation 404s and enforce dashboard-first return policy
| Field | Value |
|-------|-------|
| Merged At | 2026-01-16T09:47:09Z |
| Categories | UI |
| Risk Flags | ⚠️ Breaking route (onboarding route creation) |
| Files Changed | app/patient/onboarding/page.tsx, app/patient/escalation/client.tsx, app/patient/history/PatientHistoryClient.tsx |
| Summary | Fixed missing /patient/onboarding route, enforced dashboard return from escalation/history |

### PR #617 — E6.5.7 — Content page rendering with XSS protection
| Field | Value |
|-------|-------|
| Merged At | 2026-01-16T09:24:07Z |
| Categories | UI |
| Risk Flags | None |
| Files Changed | app/patient/content/[slug]/page.tsx, app/patient/content/[slug]/client.tsx |
| Summary | /patient/content/[slug] route with ReactMarkdown, skipHtml=true for XSS protection |

### PR #616 — E6.5.6: Content Tiles MVP with deterministic ordering
| Field | Value |
|-------|-------|
| Merged At | 2026-01-16T09:05:11Z |
| Categories | API, UI |
| Risk Flags | None |
| Files Changed | lib/data/contentTiles.ts, lib/services/contentTiles.ts, app/api/patient/dashboard/route.ts |
| Summary | Static JSON content tiles, deterministic sort (rank ASC, slug ASC) |

### PR #615 — E6.5.5: Implement deterministic Next Step Resolver v1
| Field | Value |
|-------|-------|
| Merged At | 2026-01-16T08:43:04Z |
| Categories | API |
| Risk Flags | None |
| Files Changed | lib/nextStep/resolver.ts, lib/nextStep/__tests__/resolver.test.ts, app/api/patient/dashboard/route.ts |
| Summary | 6 priority-ordered rules for nextStep determination, versioned ruleset |

### PR #614 — E6.5.4: Implement patient dashboard layout components
| Field | Value |
|-------|-------|
| Merged At | 2026-01-16T06:29:24Z |
| Categories | UI |
| Risk Flags | None |
| Files Changed | app/patient/dashboard/components/*.tsx, app/patient/dashboard/client.tsx |
| Summary | DashboardHeader, AMYSlot, NextStepCard, ContentTilesGrid, ProgressSummary components |

### PR #613 — E6.5.3: Enforce pilot eligibility and bounded IO on dashboard API
| Field | Value |
|-------|-------|
| Merged At | 2026-01-16T06:04:36Z |
| Categories | API, Auth/RLS |
| Risk Flags | ⚠️ Auth behavior (mandatory pilot eligibility gate) |
| Files Changed | app/api/patient/dashboard/route.ts |
| Summary | requirePilotEligibility() replaces optional check, MAX_FUNNEL_SUMMARIES/MAX_CONTENT_TILES bounds |

### PR #612 — E6.5.2: Dashboard Data Contract v1 with Zod schemas
| Field | Value |
|-------|-------|
| Merged At | 2026-01-16T05:49:27Z |
| Categories | API, Guardrails |
| Risk Flags | None |
| Files Changed | lib/api/contracts/patient/dashboard.ts, app/api/patient/dashboard/route.ts |
| Summary | DashboardViewModelV1 Zod schema, version markers, E6.4.8 correlation ID alignment |

### PR #611 — E6.5.1 — Enforce dashboard-first entry policy for patient routes
| Field | Value |
|-------|-------|
| Merged At | 2026-01-16T05:31:29Z |
| Categories | UI, Auth/RLS |
| Risk Flags | ⚠️ Auth behavior (dashboard_visited cookie enforcement) |
| Files Changed | lib/utils/dashboardFirstPolicy.ts, 9 patient route pages |
| Summary | Server-side dashboard-first policy, cookie-based session tracking |

### PR #610 — E6.4.10 — Deterministic seed data for pilot deployment
| Field | Value |
|-------|-------|
| Merged At | 2026-01-15T21:35:55Z |
| Categories | DB, Tooling |
| Risk Flags | ⚠️ DB schema change (seed data) |
| Files Changed | supabase/seed.sql, verify-e6-4-10-seed.ps1, docs/runbooks/DB_SEED.md, package.json |
| Summary | Deterministic UUIDs for pilot org, 5 test users, 2 funnels, idempotent seed |

### PR #609 — E6.4.9: Add pilot KPIs endpoint and critical endpoint tracking
| Field | Value |
|-------|-------|
| Merged At | 2026-01-15T21:11:57Z |
| Categories | API, Tooling |
| Risk Flags | None |
| Files Changed | app/api/admin/pilot/kpis/route.ts, docs/pilot/CRITICAL_ENDPOINTS.md |
| Summary | /api/admin/pilot/kpis endpoint, 23 pilot-critical endpoints documented |

### PR #608 — E6.4.8: Minimal telemetry for pilot observability
| Field | Value |
|-------|-------|
| Merged At | 2026-01-15T20:42:31Z |
| Categories | DB, API, Tooling |
| Risk Flags | ⚠️ DB schema change (pilot_flow_events table) |
| Files Changed | supabase/migrations/..._pilot_flow_events.sql, lib/telemetry/*.ts, 9 API routes |
| Summary | Correlation ID propagation, 10 event types, PHI-safe payload allowlist |

### PR #607 — E6.4.8 — Audit and document data export endpoints
| Field | Value |
|-------|-------|
| Merged At | 2026-01-15T09:18:31Z |
| Categories | API, Docs |
| Risk Flags | None |
| Files Changed | app/api/patient-measures/export/route.ts, docs/pilot/EXPORTS.md |
| Summary | Content-Disposition header for export, PHI classification table, GDPR mapping |

### PR #606 — E6.4.7 — Operational Runbook + Smoke Tests for Pilot
| Field | Value |
|-------|-------|
| Merged At | 2026-01-15T09:02:40Z |
| Categories | Docs, Tooling |
| Risk Flags | None |
| Files Changed | docs/runbooks/PILOT_SMOKE_TESTS.md, verify-pilot-smoke.ps1 |
| Summary | 5 mandatory smoke tests with PowerShell automation |

### PR #605 — E6.4.6 — Red flag escalation stub
| Field | Value |
|-------|-------|
| Merged At | 2026-01-15T08:16:08Z |
| Categories | UI, API |
| Risk Flags | None |
| Files Changed | lib/escalation/*.ts, app/patient/funnel/[slug]/result/components/EscalationOfferCard.tsx, app/patient/escalation/page.tsx |
| Summary | Red flag detection triggers escalation UI, audit logging without PHI |

### PR #604 — E6.4.5: Implement deterministic workup data sufficiency check
| Field | Value |
|-------|-------|
| Merged At | 2026-01-15T07:06:28Z |
| Categories | API |
| Risk Flags | None |
| Files Changed | lib/workup/*.ts, app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts |
| Summary | Rule-based data sufficiency rules, SHA256 evidence hashing, follow-up generation |

### PR #603 — E6.4.4 — Replace report surface with workup status
| Field | Value |
|-------|-------|
| Merged At | 2026-01-15T06:31:13Z |
| Categories | DB, UI |
| Risk Flags | ⚠️ DB schema change (workup_status column) |
| Files Changed | supabase/migrations/..._workup_status.sql, app/patient/funnel/[slug]/result/*.tsx |
| Summary | workup_status enum (needs_more_data/ready_for_review), removes diagnostic content |

### PR #602 — E6.4.3 — Complete patient funnel flow wiring for pilot
| Field | Value |
|-------|-------|
| Merged At | 2026-01-15T04:57:06Z |
| Categories | UI |
| Risk Flags | None |
| Files Changed | app/patient/funnel/[slug]/result/client.tsx, docs/dev/E6_4_3_*.md |
| Summary | Dashboard navigation from result, explicit /patient/dashboard return |

### PR #601 — E6.4.2 — Persistent onboarding status with dashboard landing page
| Field | Value |
|-------|-------|
| Merged At | 2026-01-14T21:05:16Z |
| Categories | DB, UI, API |
| Risk Flags | ⚠️ DB schema change (onboarding_status column) |
| Files Changed | supabase/migrations/..._onboarding_status.sql, app/patient/dashboard/page.tsx, app/api/patient/onboarding-status/route.ts |
| Summary | onboarding_status enum, /patient/dashboard landing, server-side state check |

---

## Risk Summary

### High Risk (Requires Manual Verification)

| PR# | Risk Flag | Impact |
|-----|-----------|--------|
| #626 | DB schema change | New triage_sessions table with RLS |
| #624 | Auth behavior | New endpoint with 401-first ordering |
| #613 | Auth behavior | Mandatory pilot eligibility gate |
| #611 | Auth behavior | Dashboard-first cookie enforcement |
| #608 | DB schema change | pilot_flow_events table |
| #603 | DB schema change | workup_status column |
| #601 | DB schema change | onboarding_status column |

### Medium Risk (Automated Test Coverage)

| PR# | Risk Flag | Mitigation |
|-----|-----------|------------|
| #627 | Red flag detection | 41 tests, dominance verified |
| #621 | Server component | Bounded input, fallback handling |
| #618 | Breaking route | 404 fixes, dashboard return policy |

---

## Files Changed Summary (Top 20 by Frequency)

| File Path | PR Count | Categories |
|-----------|----------|------------|
| app/api/patient/dashboard/route.ts | 4 | API |
| app/patient/dashboard/client.tsx | 3 | UI |
| app/patient/dashboard/components/AMYComposer.tsx | 3 | UI |
| lib/triage/engine.ts | 3 | API |
| docs/api/endpoint-catalog.json | 3 | Tooling |
| package.json | 2 | Tooling |
| supabase/seed.sql | 1 | DB |
| lib/api/contracts/triage/index.ts | 2 | API |
| app/api/amy/triage/route.ts | 2 | API |
| lib/triage/redFlagCatalog.ts | 1 | API |

---

## Evidence Pack Location

All raw data for this report is stored in:
- `.audit/v06/evidence/pr-list.json` (PR metadata)
- `.audit/v06/evidence/baseline-head.json` (commit SHAs)
- `.audit/v06/evidence/package.json` (scripts snapshot)

---

## Verification Commands

```powershell
# Verify all tests pass
npm ci
npm test

# Verify build
npm run build

# Verify migrations
npm run db:verify

# Verify endpoint catalog
npm run api:catalog:verify
```

---

**Report Version:** 1.0.0  
**Generated By:** GitHub Copilot Audit Agent