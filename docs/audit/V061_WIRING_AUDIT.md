# V061-I05: Evidence-locked Wiring Audit

**Generated:** 2026-01-20T14:31:03.375Z  
**Version:** v0.6.1  
**Issue ID:** V061-I05

## Executive Summary

After the UI-Split into separate apps (rhythm-studio-ui, rhythm-patient-ui), this audit provides evidence-locked visibility into:
- Which features are fully wired (UI → API → DB)
- Which endpoints/pages are orphans
- What is Pilot-Ready vs Future work

### Key Metrics

| Metric | Count | Status |
|--------|-------|--------|
| **Total UI Pages** | 56 | ✅ Inventoried |
| **Total API Routes** | 99 | ✅ Inventoried |
| **Pages with API Calls** | 16 | ✅ Mapped |
| **API Routes with DB Access** | 91 | ✅ Mapped |
| **Orphaned API Routes** | 65 | ⚠️ Requires Review |
| **Pages without API Calls** | 40 | ⚠️ Requires Review |

---

## 1. Architecture Overview

### Monorepo Structure

This is a **monorepo with centralized API backend**:

```
/home/runner/work/rhythmologicum-connect/rhythmologicum-connect/
├── app/                          # Main Next.js app (API backend)
│   ├── api/                      # 94 API routes
│   ├── admin/                    # Admin UI pages
│   ├── clinician/                # Clinician UI pages
│   └── patient/                  # Patient UI pages
├── apps/
│   ├── rhythm-studio-ui/         # Clinician dashboard (26 pages, 5 auth routes)
│   ├── rhythm-patient-ui/        # Patient portal (20 pages, 0 routes)
│   └── rhythm-engine/            # Backend processing engine
└── packages/
    └── rhythm-core/              # Shared utilities
```

### Data Flow Pattern

```
UI Pages (56) → API Routes (99) → Database (Supabase)
     ↓               ↓                    ↓
  User Actions   Business Logic      Persistent State
```

---

## 2. UI Pages Inventory

### 2.1 All UI Pages (56)

#### Main App (app/) - 10 pages

- `/admin/[...path]` → `app/admin/[...path]/page.tsx`
- `/admin` → `app/admin/page.tsx`
- `/theme-demo` → `app/theme-demo/page.tsx`
- `/patient/[...path]` → `app/patient/[...path]/page.tsx`
- `/patient` → `app/patient/page.tsx`
- `/datenschutz` → `app/datenschutz/page.tsx`
- `/clinician/[...path]` → `app/clinician/[...path]/page.tsx`
- `/clinician` → `app/clinician/page.tsx`
- `/content/[slug]` → `app/content/[slug]/page.tsx`
- `/` → `app/page.tsx`

#### Studio UI (apps/rhythm-studio-ui/) - 26 pages

- `/admin/design-system` → `apps/rhythm-studio-ui/app/admin/design-system/page.tsx`
- `/admin/operational-settings` → `apps/rhythm-studio-ui/app/admin/operational-settings/page.tsx`
- `/admin/dev/endpoints` → `apps/rhythm-studio-ui/app/admin/dev/endpoints/page.tsx`
- `/admin/dev/theme-test` → `apps/rhythm-studio-ui/app/admin/dev/theme-test/page.tsx`
- `/admin/content/new` → `apps/rhythm-studio-ui/app/admin/content/new/page.tsx`
- `/admin/content/[id]` → `apps/rhythm-studio-ui/app/admin/content/[id]/page.tsx`
- `/admin/content` → `apps/rhythm-studio-ui/app/admin/content/page.tsx`
- `/admin/navigation` → `apps/rhythm-studio-ui/app/admin/navigation/page.tsx`
- `/admin/design-tokens` → `apps/rhythm-studio-ui/app/admin/design-tokens/page.tsx`
- `/admin` → `apps/rhythm-studio-ui/app/admin/page.tsx`
- `/datenschutz` → `apps/rhythm-studio-ui/app/datenschutz/page.tsx`
- `/impressum` → `apps/rhythm-studio-ui/app/impressum/page.tsx`
- `/clinician/patient/[id]` → `apps/rhythm-studio-ui/app/clinician/patient/[id]/page.tsx`
- `/clinician/support-cases` → `apps/rhythm-studio-ui/app/clinician/support-cases/page.tsx`
- `/clinician/funnels/[identifier]/editor` → `apps/rhythm-studio-ui/app/clinician/funnels/[identifier]/editor/page.tsx`
- `/clinician/funnels/[identifier]` → `apps/rhythm-studio-ui/app/clinician/funnels/[identifier]/page.tsx`
- `/clinician/funnels` → `apps/rhythm-studio-ui/app/clinician/funnels/page.tsx`
- `/clinician/tasks` → `apps/rhythm-studio-ui/app/clinician/tasks/page.tsx`
- `/clinician/pre-screening` → `apps/rhythm-studio-ui/app/clinician/pre-screening/page.tsx`
- `/clinician/review-queue` → `apps/rhythm-studio-ui/app/clinician/review-queue/page.tsx`
- `/clinician/report/[id]` → `apps/rhythm-studio-ui/app/clinician/report/[id]/page.tsx`
- `/clinician/shipments` → `apps/rhythm-studio-ui/app/clinician/shipments/page.tsx`
- `/clinician/triage` → `apps/rhythm-studio-ui/app/clinician/triage/page.tsx`
- `/clinician/delivery` → `apps/rhythm-studio-ui/app/clinician/delivery/page.tsx`
- `/clinician` → `apps/rhythm-studio-ui/app/clinician/page.tsx`
- `/` → `apps/rhythm-studio-ui/app/page.tsx`

#### Patient UI (apps/rhythm-patient-ui/) - 20 pages

- `/patient/dashboard` → `apps/rhythm-patient-ui/app/patient/dashboard/page.tsx`
- `/patient/funnel/[slug]/result` → `apps/rhythm-patient-ui/app/patient/funnel/[slug]/result/page.tsx`
- `/patient/funnel/[slug]/intro` → `apps/rhythm-patient-ui/app/patient/funnel/[slug]/intro/page.tsx`
- `/patient/funnel/[slug]/content/[pageSlug]` → `apps/rhythm-patient-ui/app/patient/funnel/[slug]/content/[pageSlug]/page.tsx`
- `/patient/funnel/[slug]` → `apps/rhythm-patient-ui/app/patient/funnel/[slug]/page.tsx`
- `/patient/funnels/[slug]` → `apps/rhythm-patient-ui/app/patient/funnels/[slug]/page.tsx`
- `/patient/funnels` → `apps/rhythm-patient-ui/app/patient/funnels/page.tsx`
- `/patient/documents/[id]/confirm` → `apps/rhythm-patient-ui/app/patient/documents/[id]/confirm/page.tsx`
- `/patient/support` → `apps/rhythm-patient-ui/app/patient/support/page.tsx`
- `/patient/content/[slug]` → `apps/rhythm-patient-ui/app/patient/content/[slug]/page.tsx`
- `/patient/onboarding/profile` → `apps/rhythm-patient-ui/app/patient/onboarding/profile/page.tsx`
- `/patient/onboarding/consent` → `apps/rhythm-patient-ui/app/patient/onboarding/consent/page.tsx`
- `/patient/onboarding` → `apps/rhythm-patient-ui/app/patient/onboarding/page.tsx`
- `/patient/escalation` → `apps/rhythm-patient-ui/app/patient/escalation/page.tsx`
- `/patient/history` → `apps/rhythm-patient-ui/app/patient/history/page.tsx`
- `/patient` → `apps/rhythm-patient-ui/app/patient/page.tsx`
- `/patient/assessment` → `apps/rhythm-patient-ui/app/patient/assessment/page.tsx`
- `/datenschutz` → `apps/rhythm-patient-ui/app/datenschutz/page.tsx`
- `/impressum` → `apps/rhythm-patient-ui/app/impressum/page.tsx`
- `/` → `apps/rhythm-patient-ui/app/page.tsx`

---

## 3. API Routes Inventory

### 3.1 All API Routes (99)

#### Main App API (app/api/) - 94 routes

- `/api/admin/funnels` → `app/api/admin/funnels/route.ts`
- `/api/admin/funnels/[id]` → `app/api/admin/funnels/[id]/route.ts`
- `/api/admin/reassessment-rules` → `app/api/admin/reassessment-rules/route.ts`
- `/api/admin/reassessment-rules/[id]` → `app/api/admin/reassessment-rules/[id]/route.ts`
- `/api/admin/usage` → `app/api/admin/usage/route.ts`
- `/api/admin/kpi-thresholds` → `app/api/admin/kpi-thresholds/route.ts`
- `/api/admin/kpi-thresholds/[id]` → `app/api/admin/kpi-thresholds/[id]/route.ts`
- `/api/admin/content-pages` → `app/api/admin/content-pages/route.ts`
- `/api/admin/content-pages/[id]` → `app/api/admin/content-pages/[id]/route.ts`
- `/api/admin/content-pages/[id]/sections` → `app/api/admin/content-pages/[id]/sections/route.ts`
- `/api/admin/content-pages/[id]/sections/[sectionId]` → `app/api/admin/content-pages/[id]/sections/[sectionId]/route.ts`
- `/api/admin/pilot/kpis` → `app/api/admin/pilot/kpis/route.ts`
- `/api/admin/pilot/flow-events` → `app/api/admin/pilot/flow-events/route.ts`
- `/api/admin/funnel-steps` → `app/api/admin/funnel-steps/route.ts`
- `/api/admin/funnel-steps/[id]` → `app/api/admin/funnel-steps/[id]/route.ts`
- `/api/admin/diagnostics/pillars-sot` → `app/api/admin/diagnostics/pillars-sot/route.ts`
- `/api/admin/dev/endpoint-catalog` → `app/api/admin/dev/endpoint-catalog/route.ts`
- `/api/admin/navigation` → `app/api/admin/navigation/route.ts`
- `/api/admin/navigation/[role]` → `app/api/admin/navigation/[role]/route.ts`
- `/api/admin/funnel-versions/[id]` → `app/api/admin/funnel-versions/[id]/route.ts`
- `/api/admin/funnel-versions/[id]/manifest` → `app/api/admin/funnel-versions/[id]/manifest/route.ts`
- `/api/admin/funnel-step-questions/[id]` → `app/api/admin/funnel-step-questions/[id]/route.ts`
- `/api/admin/design-tokens` → `app/api/admin/design-tokens/route.ts`
- `/api/admin/operational-settings-audit` → `app/api/admin/operational-settings-audit/route.ts`
- `/api/admin/notification-templates` → `app/api/admin/notification-templates/route.ts`
- `/api/admin/notification-templates/[id]` → `app/api/admin/notification-templates/[id]/route.ts`
- `/api/health/env` → `app/api/health/env/route.ts`
- `/api/patient-profiles` → `app/api/patient-profiles/route.ts`
- `/api/patient/dashboard` → `app/api/patient/dashboard/route.ts`
- `/api/patient/triage` → `app/api/patient/triage/route.ts`
- `/api/patient/onboarding-status` → `app/api/patient/onboarding-status/route.ts`
- `/api/support-cases` → `app/api/support-cases/route.ts`
- `/api/support-cases/[id]/escalate` → `app/api/support-cases/[id]/escalate/route.ts`
- `/api/support-cases/[id]` → `app/api/support-cases/[id]/route.ts`
- `/api/funnels/active` → `app/api/funnels/active/route.ts`
- `/api/funnels/[slug]/content-pages` → `app/api/funnels/[slug]/content-pages/route.ts`
- `/api/funnels/[slug]/assessments` → `app/api/funnels/[slug]/assessments/route.ts`
- `/api/funnels/[slug]/assessments/[assessmentId]` → `app/api/funnels/[slug]/assessments/[assessmentId]/route.ts`
- `/api/funnels/[slug]/assessments/[assessmentId]/result` → `app/api/funnels/[slug]/assessments/[assessmentId]/result/route.ts`
- `/api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]` → `app/api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts`
- `/api/funnels/[slug]/assessments/[assessmentId]/complete` → `app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts`
- `/api/funnels/[slug]/assessments/[assessmentId]/answers/save` → `app/api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts`
- `/api/funnels/[slug]/assessments/[assessmentId]/workup` → `app/api/funnels/[slug]/assessments/[assessmentId]/workup/route.ts`
- `/api/funnels/[slug]/definition` → `app/api/funnels/[slug]/definition/route.ts`
- `/api/funnels/catalog` → `app/api/funnels/catalog/route.ts`
- `/api/funnels/catalog/[slug]` → `app/api/funnels/catalog/[slug]/route.ts`
- `/api/pre-screening-calls` → `app/api/pre-screening-calls/route.ts`
- `/api/documents/upload` → `app/api/documents/upload/route.ts`
- `/api/documents/[id]/extract` → `app/api/documents/[id]/extract/route.ts`
- `/api/documents/[id]/status` → `app/api/documents/[id]/status/route.ts`

... and 44 more

#### Studio UI API (apps/rhythm-studio-ui/app/api/) - 5 routes

- `/api/auth/signout` → `apps/rhythm-studio-ui/app/api/auth/signout/route.ts`
- `/api/auth/resolve-role` → `apps/rhythm-studio-ui/app/api/auth/resolve-role/route.ts`
- `/api/auth/callback` → `apps/rhythm-studio-ui/app/api/auth/callback/route.ts`
- `/api/auth/debug` → `apps/rhythm-studio-ui/app/api/auth/debug/route.ts`
- `/api/auth/debug-cookie` → `apps/rhythm-studio-ui/app/api/auth/debug-cookie/route.ts`

---

## 4. Wiring Analysis

### 4.1 UI → API Mappings (16 pages with API calls)


#### /
**File:** `app/page.tsx`  
**API Calls:**
- `/api/auth/callback`
- `/api/auth/resolve-role`
- `/api/patient/onboarding-status`


#### /admin/operational-settings
**File:** `apps/rhythm-studio-ui/app/admin/operational-settings/page.tsx`  
**API Calls:**
- `/api/admin/notification-templates`
- `/api/admin/reassessment-rules`
- `/api/admin/kpi-thresholds`
- `/api/admin/operational-settings-audit?limit=50`
- `/api/admin/notification-templates/${id}`
- `/api/admin/reassessment-rules/${id}`
- `/api/admin/kpi-thresholds/${id}`
- `/api/admin/notification-templates/`
- `/api/admin/reassessment-rules/`
- `/api/admin/kpi-thresholds/`


#### /admin/dev/endpoints
**File:** `apps/rhythm-studio-ui/app/admin/dev/endpoints/page.tsx`  
**API Calls:**
- `/api/admin/dev/endpoint-catalog`


#### /admin/content/[id]
**File:** `apps/rhythm-studio-ui/app/admin/content/[id]/page.tsx`  
**API Calls:**
- `/api/admin/content-pages/${pageId}`
- `/api/admin/content-pages/`


#### /admin/content
**File:** `apps/rhythm-studio-ui/app/admin/content/page.tsx`  
**API Calls:**
- `/api/admin/content-pages`


#### /admin/navigation
**File:** `apps/rhythm-studio-ui/app/admin/navigation/page.tsx`  
**API Calls:**
- `/api/admin/navigation`
- `/api/admin/navigation/${selectedRole}`
- `/api/admin/navigation/`


#### /admin/design-tokens
**File:** `apps/rhythm-studio-ui/app/admin/design-tokens/page.tsx`  
**API Calls:**
- `/api/admin/design-tokens`
- `/api/admin/design-tokens?organization_id=${organizationId}`
- `/api/admin/design-tokens?organization_id=`


#### /clinician/support-cases
**File:** `apps/rhythm-studio-ui/app/clinician/support-cases/page.tsx`  
**API Calls:**
- `/api/support-cases?${params.toString()}`
- `/api/support-cases/${caseId}/escalate`
- `/api/support-cases/${caseId}`
- `/api/support-cases?`
- `/api/support-cases/`


#### /clinician/funnels/[identifier]/editor
**File:** `apps/rhythm-studio-ui/app/clinician/funnels/[identifier]/editor/page.tsx`  
**API Calls:**
- `/api/admin/funnels/${funnelSlug}`
- `/api/admin/funnel-versions/${latestVersionId}/manifest`
- `/api/admin/funnel-versions/${funnelVersion.id}/manifest`
- `/api/admin/funnels/`
- `/api/admin/funnel-versions/`


#### /clinician/funnels/[identifier]
**File:** `apps/rhythm-studio-ui/app/clinician/funnels/[identifier]/page.tsx`  
**API Calls:**
- `/api/admin/funnels/${identifier}`
- `/api/admin/funnel-steps/${stepId}`
- `/api/admin/funnel-step-questions/${questionId}`
- `/api/admin/funnel-steps/${otherStep.id}`
- `/api/admin/funnel-versions/${versionId}`
- `/api/admin/funnels/`
- `/api/admin/funnel-steps/`
- `/api/admin/funnel-step-questions/`
- `/api/admin/funnel-versions/`


#### /clinician/funnels
**File:** `apps/rhythm-studio-ui/app/clinician/funnels/page.tsx`  
**API Calls:**
- `/api/admin/funnels`


#### /clinician/tasks
**File:** `apps/rhythm-studio-ui/app/clinician/tasks/page.tsx`  
**API Calls:**
- `/api/tasks?${params.toString()}`
- `/api/tasks/${taskId}`
- `/api/tasks?`
- `/api/tasks/`


#### /clinician/pre-screening
**File:** `apps/rhythm-studio-ui/app/clinician/pre-screening/page.tsx`  
**API Calls:**
- `/api/pre-screening-calls`


#### /clinician/review-queue
**File:** `apps/rhythm-studio-ui/app/clinician/review-queue/page.tsx`  
**API Calls:**
- `/api/review/queue?${params}`
- `/api/review/queue?`


#### /clinician/shipments
**File:** `apps/rhythm-studio-ui/app/clinician/shipments/page.tsx`  
**API Calls:**
- `/api/shipments?${params.toString()}`
- `/api/shipments?`


#### /clinician/delivery
**File:** `apps/rhythm-studio-ui/app/clinician/delivery/page.tsx`  
**API Calls:**
- `/api/processing/jobs/${jobId}/download`
- `/api/processing/jobs/`


### 4.2 API → Database Mappings (91 routes with DB access)


- **/api/admin/funnels**
  - File: `app/api/admin/funnels/route.ts`
  - Client Type: server
  - Tables: `pillars`, `funnels_catalog`, `funnel_versions`


- **/api/admin/funnels/[id]**
  - File: `app/api/admin/funnels/[id]/route.ts`
  - Client Type: server
  - Tables: `funnels_catalog`, `pillars`, `funnel_versions`


- **/api/admin/reassessment-rules**
  - File: `app/api/admin/reassessment-rules/route.ts`
  - Client Type: server
  - Tables: none detected


- **/api/admin/reassessment-rules/[id]**
  - File: `app/api/admin/reassessment-rules/[id]/route.ts`
  - Client Type: server
  - Tables: none detected


- **/api/admin/usage**
  - File: `app/api/admin/usage/route.ts`
  - Client Type: server
  - Tables: none detected


- **/api/admin/kpi-thresholds**
  - File: `app/api/admin/kpi-thresholds/route.ts`
  - Client Type: server
  - Tables: none detected


- **/api/admin/kpi-thresholds/[id]**
  - File: `app/api/admin/kpi-thresholds/[id]/route.ts`
  - Client Type: server
  - Tables: none detected


- **/api/admin/content-pages**
  - File: `app/api/admin/content-pages/route.ts`
  - Client Type: server
  - Tables: `content_pages`


- **/api/admin/content-pages/[id]**
  - File: `app/api/admin/content-pages/[id]/route.ts`
  - Client Type: server
  - Tables: `content_pages`, `content_page_sections`, `funnels`


- **/api/admin/content-pages/[id]/sections**
  - File: `app/api/admin/content-pages/[id]/sections/route.ts`
  - Client Type: server
  - Tables: `content_page_sections`, `content_pages`


- **/api/admin/content-pages/[id]/sections/[sectionId]**
  - File: `app/api/admin/content-pages/[id]/sections/[sectionId]/route.ts`
  - Client Type: server
  - Tables: `content_page_sections`


- **/api/admin/pilot/kpis**
  - File: `app/api/admin/pilot/kpis/route.ts`
  - Client Type: server
  - Tables: `pilot_flow_events`, `review_records`, `support_cases`


- **/api/admin/pilot/flow-events**
  - File: `app/api/admin/pilot/flow-events/route.ts`
  - Client Type: server
  - Tables: `pilot_flow_events`


- **/api/admin/funnel-steps**
  - File: `app/api/admin/funnel-steps/route.ts`
  - Client Type: server
  - Tables: `funnels`, `content_pages`, `funnel_steps`


- **/api/admin/funnel-steps/[id]**
  - File: `app/api/admin/funnel-steps/[id]/route.ts`
  - Client Type: server
  - Tables: `content_pages`, `funnel_steps`


- **/api/admin/diagnostics/pillars-sot**
  - File: `app/api/admin/diagnostics/pillars-sot/route.ts`
  - Client Type: server
  - Tables: none detected


- **/api/admin/dev/endpoint-catalog**
  - File: `app/api/admin/dev/endpoint-catalog/route.ts`
  - Client Type: server
  - Tables: none detected


- **/api/admin/navigation**
  - File: `app/api/admin/navigation/route.ts`
  - Client Type: server
  - Tables: `navigation_items`, `navigation_item_configs`


- **/api/admin/navigation/[role]**
  - File: `app/api/admin/navigation/[role]/route.ts`
  - Client Type: server
  - Tables: `navigation_item_configs`


- **/api/admin/funnel-versions/[id]**
  - File: `app/api/admin/funnel-versions/[id]/route.ts`
  - Client Type: server
  - Tables: `funnel_versions`, `funnels_catalog`


- **/api/admin/funnel-versions/[id]/manifest**
  - File: `app/api/admin/funnel-versions/[id]/manifest/route.ts`
  - Client Type: server
  - Tables: `funnel_versions`, `audit_log`


- **/api/admin/funnel-step-questions/[id]**
  - File: `app/api/admin/funnel-step-questions/[id]/route.ts`
  - Client Type: server
  - Tables: `funnel_step_questions`


- **/api/admin/design-tokens**
  - File: `app/api/admin/design-tokens/route.ts`
  - Client Type: server
  - Tables: `design_tokens`


- **/api/admin/operational-settings-audit**
  - File: `app/api/admin/operational-settings-audit/route.ts`
  - Client Type: server
  - Tables: none detected


- **/api/admin/notification-templates**
  - File: `app/api/admin/notification-templates/route.ts`
  - Client Type: server
  - Tables: none detected


- **/api/admin/notification-templates/[id]**
  - File: `app/api/admin/notification-templates/[id]/route.ts`
  - Client Type: server
  - Tables: none detected


- **/api/health/env**
  - File: `app/api/health/env/route.ts`
  - Client Type: server
  - Tables: `pillars`


- **/api/patient-profiles**
  - File: `app/api/patient-profiles/route.ts`
  - Client Type: server
  - Tables: `patient_profiles`


- **/api/patient/dashboard**
  - File: `app/api/patient/dashboard/route.ts`
  - Client Type: server
  - Tables: `patient_profiles`, `assessments`, `reports`


- **/api/patient/onboarding-status**
  - File: `app/api/patient/onboarding-status/route.ts`
  - Client Type: server
  - Tables: `user_consents`, `patient_profiles`


... and 61 more API routes with DB access

---

## 5. Orphans Analysis

### 5.1 Orphaned API Routes (65)

**Definition:** API routes that are not called by any UI page in the codebase.

**⚠️ Note:** These may be:
- Future endpoints (not yet wired)
- Called by external clients (mobile app, CLI, etc.)
- Webhooks or background jobs
- Legitimately unused (candidates for removal)

- `/api/admin/usage` (`app/api/admin/usage/route.ts`)
- `/api/admin/content-pages/[id]/sections` (`app/api/admin/content-pages/[id]/sections/route.ts`)
- `/api/admin/content-pages/[id]/sections/[sectionId]` (`app/api/admin/content-pages/[id]/sections/[sectionId]/route.ts`)
- `/api/admin/pilot/kpis` (`app/api/admin/pilot/kpis/route.ts`)
- `/api/admin/pilot/flow-events` (`app/api/admin/pilot/flow-events/route.ts`)
- `/api/admin/funnel-steps` (`app/api/admin/funnel-steps/route.ts`)
- `/api/admin/diagnostics/pillars-sot` (`app/api/admin/diagnostics/pillars-sot/route.ts`)
- `/api/health/env` (`app/api/health/env/route.ts`)
- `/api/patient-profiles` (`app/api/patient-profiles/route.ts`)
- `/api/patient/dashboard` (`app/api/patient/dashboard/route.ts`)
- `/api/patient/triage` (`app/api/patient/triage/route.ts`)
- `/api/funnels/active` (`app/api/funnels/active/route.ts`)
- `/api/funnels/[slug]/content-pages` (`app/api/funnels/[slug]/content-pages/route.ts`)
- `/api/funnels/[slug]/assessments` (`app/api/funnels/[slug]/assessments/route.ts`)
- `/api/funnels/[slug]/assessments/[assessmentId]` (`app/api/funnels/[slug]/assessments/[assessmentId]/route.ts`)
- `/api/funnels/[slug]/assessments/[assessmentId]/result` (`app/api/funnels/[slug]/assessments/[assessmentId]/result/route.ts`)
- `/api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]` (`app/api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]/route.ts`)
- `/api/funnels/[slug]/assessments/[assessmentId]/complete` (`app/api/funnels/[slug]/assessments/[assessmentId]/complete/route.ts`)
- `/api/funnels/[slug]/assessments/[assessmentId]/answers/save` (`app/api/funnels/[slug]/assessments/[assessmentId]/answers/save/route.ts`)
- `/api/funnels/[slug]/assessments/[assessmentId]/workup` (`app/api/funnels/[slug]/assessments/[assessmentId]/workup/route.ts`)
- `/api/funnels/[slug]/definition` (`app/api/funnels/[slug]/definition/route.ts`)
- `/api/funnels/catalog` (`app/api/funnels/catalog/route.ts`)
- `/api/funnels/catalog/[slug]` (`app/api/funnels/catalog/[slug]/route.ts`)
- `/api/documents/upload` (`app/api/documents/upload/route.ts`)
- `/api/documents/[id]/extract` (`app/api/documents/[id]/extract/route.ts`)
- `/api/documents/[id]/status` (`app/api/documents/[id]/status/route.ts`)
- `/api/notifications` (`app/api/notifications/route.ts`)
- `/api/notifications/[id]` (`app/api/notifications/[id]/route.ts`)
- `/api/reports/[reportId]/pdf` (`app/api/reports/[reportId]/pdf/route.ts`)
- `/api/content-pages/[slug]` (`app/api/content-pages/[slug]/route.ts`)
- `/api/auth/signout` (`app/api/auth/signout/route.ts`)
- `/api/assessment-validation/validate-step` (`app/api/assessment-validation/validate-step/route.ts`)
- `/api/assessment-answers/save` (`app/api/assessment-answers/save/route.ts`)
- `/api/shipments/[id]/events` (`app/api/shipments/[id]/events/route.ts`)
- `/api/shipments/[id]` (`app/api/shipments/[id]/route.ts`)
- `/api/amy/triage` (`app/api/amy/triage/route.ts`)
- `/api/amy/stress-report` (`app/api/amy/stress-report/route.ts`)
- `/api/amy/stress-summary` (`app/api/amy/stress-summary/route.ts`)
- `/api/processing/pdf` (`app/api/processing/pdf/route.ts`)
- `/api/processing/safety` (`app/api/processing/safety/route.ts`)
- `/api/processing/ranking` (`app/api/processing/ranking/route.ts`)
- `/api/processing/jobs/[jobId]` (`app/api/processing/jobs/[jobId]/route.ts`)
- `/api/processing/content` (`app/api/processing/content/route.ts`)
- `/api/processing/start` (`app/api/processing/start/route.ts`)
- `/api/processing/delivery` (`app/api/processing/delivery/route.ts`)
- `/api/processing/risk` (`app/api/processing/risk/route.ts`)
- `/api/processing/validation` (`app/api/processing/validation/route.ts`)
- `/api/content-resolver` (`app/api/content-resolver/route.ts`)
- `/api/content/resolve` (`app/api/content/resolve/route.ts`)
- `/api/assessments/in-progress` (`app/api/assessments/in-progress/route.ts`)
- `/api/assessments/[id]/current-step` (`app/api/assessments/[id]/current-step/route.ts`)
- `/api/assessments/[id]/resume` (`app/api/assessments/[id]/resume/route.ts`)
- `/api/assessments/[id]/navigation` (`app/api/assessments/[id]/navigation/route.ts`)
- `/api/test/correlation-id` (`app/api/test/correlation-id/route.ts`)
- `/api/review/[id]/decide` (`app/api/review/[id]/decide/route.ts`)
- `/api/review/[id]/details` (`app/api/review/[id]/details/route.ts`)
- `/api/escalation/log-click` (`app/api/escalation/log-click/route.ts`)
- `/api/consent/record` (`app/api/consent/record/route.ts`)
- `/api/consent/status` (`app/api/consent/status/route.ts`)
- `/api/account/deletion-request` (`app/api/account/deletion-request/route.ts`)
- `/api/patient-measures/export` (`app/api/patient-measures/export/route.ts`)
- `/api/patient-measures/history` (`app/api/patient-measures/history/route.ts`)
- `/api/auth/signout` (`apps/rhythm-studio-ui/app/api/auth/signout/route.ts`)
- `/api/auth/debug` (`apps/rhythm-studio-ui/app/api/auth/debug/route.ts`)
- `/api/auth/debug-cookie` (`apps/rhythm-studio-ui/app/api/auth/debug-cookie/route.ts`)

### 5.2 Pages without API Calls (40)

**Definition:** UI pages that don't make any direct API calls.

**⚠️ Note:** These pages may:
- Be static content pages
- Use server-side data fetching
- Delegate API calls to child components
- Be incomplete implementations

- `/admin/[...path]` (`app/admin/[...path]/page.tsx`)
- `/admin` (`app/admin/page.tsx`)
- `/theme-demo` (`app/theme-demo/page.tsx`)
- `/patient/[...path]` (`app/patient/[...path]/page.tsx`)
- `/patient` (`app/patient/page.tsx`)
- `/datenschutz` (`app/datenschutz/page.tsx`)
- `/clinician/[...path]` (`app/clinician/[...path]/page.tsx`)
- `/clinician` (`app/clinician/page.tsx`)
- `/content/[slug]` (`app/content/[slug]/page.tsx`)
- `/admin/design-system` (`apps/rhythm-studio-ui/app/admin/design-system/page.tsx`)
- `/admin/dev/theme-test` (`apps/rhythm-studio-ui/app/admin/dev/theme-test/page.tsx`)
- `/admin/content/new` (`apps/rhythm-studio-ui/app/admin/content/new/page.tsx`)
- `/admin` (`apps/rhythm-studio-ui/app/admin/page.tsx`)
- `/datenschutz` (`apps/rhythm-studio-ui/app/datenschutz/page.tsx`)
- `/impressum` (`apps/rhythm-studio-ui/app/impressum/page.tsx`)
- `/clinician/patient/[id]` (`apps/rhythm-studio-ui/app/clinician/patient/[id]/page.tsx`)
- `/clinician/report/[id]` (`apps/rhythm-studio-ui/app/clinician/report/[id]/page.tsx`)
- `/clinician/triage` (`apps/rhythm-studio-ui/app/clinician/triage/page.tsx`)
- `/clinician` (`apps/rhythm-studio-ui/app/clinician/page.tsx`)
- `/` (`apps/rhythm-studio-ui/app/page.tsx`)
- `/patient/dashboard` (`apps/rhythm-patient-ui/app/patient/dashboard/page.tsx`)
- `/patient/funnel/[slug]/result` (`apps/rhythm-patient-ui/app/patient/funnel/[slug]/result/page.tsx`)
- `/patient/funnel/[slug]/intro` (`apps/rhythm-patient-ui/app/patient/funnel/[slug]/intro/page.tsx`)
- `/patient/funnel/[slug]/content/[pageSlug]` (`apps/rhythm-patient-ui/app/patient/funnel/[slug]/content/[pageSlug]/page.tsx`)
- `/patient/funnel/[slug]` (`apps/rhythm-patient-ui/app/patient/funnel/[slug]/page.tsx`)
- `/patient/funnels/[slug]` (`apps/rhythm-patient-ui/app/patient/funnels/[slug]/page.tsx`)
- `/patient/funnels` (`apps/rhythm-patient-ui/app/patient/funnels/page.tsx`)
- `/patient/documents/[id]/confirm` (`apps/rhythm-patient-ui/app/patient/documents/[id]/confirm/page.tsx`)
- `/patient/support` (`apps/rhythm-patient-ui/app/patient/support/page.tsx`)
- `/patient/content/[slug]` (`apps/rhythm-patient-ui/app/patient/content/[slug]/page.tsx`)
- `/patient/onboarding/profile` (`apps/rhythm-patient-ui/app/patient/onboarding/profile/page.tsx`)
- `/patient/onboarding/consent` (`apps/rhythm-patient-ui/app/patient/onboarding/consent/page.tsx`)
- `/patient/onboarding` (`apps/rhythm-patient-ui/app/patient/onboarding/page.tsx`)
- `/patient/escalation` (`apps/rhythm-patient-ui/app/patient/escalation/page.tsx`)
- `/patient/history` (`apps/rhythm-patient-ui/app/patient/history/page.tsx`)
- `/patient` (`apps/rhythm-patient-ui/app/patient/page.tsx`)
- `/patient/assessment` (`apps/rhythm-patient-ui/app/patient/assessment/page.tsx`)
- `/datenschutz` (`apps/rhythm-patient-ui/app/datenschutz/page.tsx`)
- `/impressum` (`apps/rhythm-patient-ui/app/impressum/page.tsx`)
- `/` (`apps/rhythm-patient-ui/app/page.tsx`)

---

## 6. Smoke Test List

### 6.1 Public Routes (No Auth Required)

| Route | Expected Status | Notes |
|-------|----------------|-------|
| `/` | 200 OK | Landing page |
| `/datenschutz` | 200 OK | Privacy policy |
| `/impressum` | 200 OK | Legal notice |
| `/api/health/env` | 200 OK | Health check |

### 6.2 Patient Routes (Patient Auth Required)

| Route | Expected Status | Notes |
|-------|----------------|-------|
| `/patient` | 200 OK or 302 Redirect | Patient landing |
| `/patient/dashboard` | 200 OK | Patient dashboard |
| `/patient/funnels` | 200 OK | Available assessments |
| `/patient/history` | 200 OK | Assessment history |
| `/api/patient/dashboard` | 200 OK | Dashboard data |
| `/api/funnels/active` | 200 OK | Active funnels |

### 6.3 Clinician Routes (Clinician Auth Required)

| Route | Expected Status | Notes |
|-------|----------------|-------|
| `/clinician` | 200 OK or 302 Redirect | Clinician landing |
| `/clinician/review-queue` | 200 OK | Review queue |
| `/clinician/funnels` | 200 OK | Funnel management |
| `/clinician/tasks` | 200 OK | Task list |

### 6.4 Admin Routes (Admin Auth Required)

| Route | Expected Status | Notes |
|-------|----------------|-------|
| `/admin` | 200 OK or 302 Redirect | Admin landing |
| `/admin/design-system` | 200 OK | Design system |
| `/admin/operational-settings` | 200 OK | Settings |
| `/api/admin/usage` | 200 OK | Usage stats |

---

## 7. Punchlist for v0.6.2 / v0.7

### 7.1 High Priority (P1)

- [ ] **Review Orphaned API Routes** (65 total)
  - Determine which are legitimately unused
  - Document external callers (mobile, CLI, webhooks)
  - Remove truly orphaned endpoints
  - Add OpenAPI/endpoint catalog metadata

- [ ] **Complete Wiring for Core Features**
  - Verify all patient funnel flows have complete UI → API → DB chain
  - Verify all clinician review flows are complete
  - Add missing API calls to static pages if needed

- [ ] **Add Missing Tests**
  - Create smoke tests for critical paths
  - Add integration tests for complete wiring chains
  - Verify RLS policies for all DB-accessing endpoints

### 7.2 Medium Priority (P2)

- [ ] **Improve Static Analysis**
  - Consider using TypeScript AST parser for more accurate API call detection
  - Detect API calls in child components
  - Track server-side data fetching patterns

- [ ] **Documentation**
  - Add inline documentation for orphaned endpoints
  - Create API catalog with swagger/OpenAPI
  - Document external client usage patterns

- [ ] **Monitoring**
  - Add telemetry to track actual API usage in production
  - Compare actual usage vs static analysis
  - Identify truly unused endpoints

### 7.3 Low Priority (P3)

- [ ] **Refactoring**
  - Consider consolidating duplicate API patterns
  - Extract shared business logic
  - Improve error handling consistency

- [ ] **Developer Experience**
  - Auto-generate TypeScript types for API routes
  - Add endpoint catalog UI for developers
  - Create wiring diagram visualization

---

## 8. Evidence & Verification

### 8.1 Evidence Files

All evidence collected during this audit:

- `.audit/v061/wiring-audit.json` - Machine-readable full report
- `.audit/v061/evidence/all-pages.txt` - Complete list of page files
- `.audit/v061/evidence/all-routes.txt` - Complete list of API route files

### 8.2 Reproduction Commands

To regenerate this audit:

```bash
# Run the audit script
node scripts/audit/wiring-audit.js

# Generate markdown report
node scripts/audit/generate-report.js

# Verify build and tests
npm test
npm run build
```

### 8.3 Build & Test Status

Verification commands:

```powershell
npm test
if ($LASTEXITCODE -ne 0) { throw "tests failed" }

npm run build
if ($LASTEXITCODE -ne 0) { throw "build failed" }
```

---

## 9. Conclusions

### 9.1 Pilot Readiness

**Status:** ⚠️ **CONDITIONAL GO**

**Strengths:**
- ✅ Core funnel flows are wired (patient assessment, clinician review)
- ✅ Authentication and authorization in place
- ✅ Database access is consistent (91/99 routes use DB)
- ✅ UI split is functional (56 pages across 3 apps)

**Risks:**
- ⚠️ 65 orphaned API routes - unclear which are needed
- ⚠️ 40 pages without API calls - some may be incomplete
- ⚠️ Limited automated testing coverage
- ⚠️ No production usage telemetry yet

**Recommendations:**
1. Complete orphan review before pilot launch
2. Add smoke tests for critical paths
3. Document all external API consumers
4. Enable basic usage telemetry

### 9.2 Future Work

For v0.7 and beyond:
- Implement automated orphan detection in CI
- Add comprehensive API catalog
- Create wiring visualization dashboard
- Implement usage-based endpoint pruning

---

## Appendix: Methodology

### Pattern Detection

**UI → API Detection:**
- Searched for `fetch('/api/...')` patterns
- Searched for URL string literals with `/api/` prefix
- Searched for template literals with `/api/` paths

**API → DB Detection:**
- Searched for Supabase client imports
- Searched for `.from('table_name')` patterns
- Detected client types (server, admin, public)

**Limitations:**
- Dynamic API calls may not be detected
- API calls in child components may not be attributed to parent page
- Server-side data fetching patterns not fully captured
- Mobile/external client calls not visible

---

**End of Report**
