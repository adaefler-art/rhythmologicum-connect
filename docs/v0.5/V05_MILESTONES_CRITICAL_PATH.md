# V05 Milestones & Critical Path

**Purpose:** Define milestones, dependencies, and critical path for open V05 issues  
**Status:** Planning Document  
**Last Updated:** 2026-01-02

---

## Executive Summary

This document organizes the remaining open V05 issues (I03.2 → I10.4) into milestones with explicit dependencies. It defines the **critical path** to complete the Walking Skeleton: "Patient completes assessment → processing → report → clinician sees triage."

### Assumptions & Constraints

**Time Estimates Basis:**
All time estimates in this document are **projections only**, based on:
- Historical velocity from completed V05 issues (I01.1-I03.1): ~9 hours per issue average (source: `docs/TV05_CLEANUP_AUDIT_ISSUE_MAP.md`, line 676)
- Issue count per milestone (8, 8, 15 issues)
- Assumption of sequential dependencies in critical path
- No evidence-based velocity for issues I03.2+ (not yet implemented)

**Critical Path Variants:**
Two options are presented:
- **Option A (Minimal):** Patient → Assessment → Basic Display (no report generation)
- **Option B (Full Walking Skeleton):** Patient → Assessment → Report → Clinician Triage (includes AI/AMY)

This document defaults to **Option B** as the target Walking Skeleton based on issue title reference to "Pillar 4 → Report → Clinician".

### Completed Issues (Baseline)

The following V05 issues are already implemented and serve as the foundation:

- ✅ **V05-I01.1** — Schema & Constraints (Epic I01: Foundation)
- ✅ **V05-I01.2** — RLS Policies (Epic I01: Foundation)
- ✅ **V05-I01.3** — Versioning Contract (Epic I01: Foundation)
- ✅ **V05-I01.4** — Audit Log Extensions (Epic I01: Foundation)
- ✅ **V05-I02.1** — Funnel Catalog (Epic I02: Funnel Set)
- ✅ **V05-I02.2** — Plugin Manifest Constraints (Epic I02: Funnel Set)
- ✅ **V05-I02.3** — Additional Funnels (Epic I02: Funnel Set)
- ✅ **V05-I03.1** — Onboarding/Consent + Baseline Profile (Epic I03: Patient Journey Core)

**Foundation Status:** Epic I01 (Foundation) and Epic I02 (Funnel Set) are 100% complete.

---

## Open Issues by Epic

### Epic I03: Patient Journey Core (Walking Skeleton Path)

- **I03.2** — Assessment Runtime & Step Navigation
- **I03.3** — Answer Persistence & Validation
- **I03.4** — Assessment Completion & State Management

### Epic I04: Report Generation (Critical Path)

- **I04.1** — Report Processing Engine
- **I04.2** — AI/AMY Integration for Report Generation
- **I04.3** — Report Storage & Versioning
- **I04.4** — Report Delivery & Notification

### Epic I05: Clinician Triage (Critical Path Endpoint)

- **I05.1** — Clinician Report Dashboard
- **I05.2** — Risk Level Filtering & Sorting
- **I05.3** — Patient Detail View with Report History
- **I05.4** — Triage Action Workflow

### Epic I06: Funnel Management (Clinician Tools)

- **I06.1** — Funnel Configuration UI
- **I06.2** — Question Bank Management
- **I06.3** — Content Page Editor Integration
- **I06.4** — Funnel Activation/Deactivation Controls

### Epic I07: Content Management (Editorial)

- **I07.1** — Content Page CRUD Operations
- **I07.2** — Content Versioning System
- **I07.3** — Media Library & Upload
- **I07.4** — Content Preview & Publishing Workflow

### Epic I08: Analytics & Monitoring

- **I08.1** — Assessment Metrics & Analytics
- **I08.2** — Report Generation Performance Monitoring
- **I08.3** — User Activity Tracking
- **I08.4** — Error Tracking & Alerting Integration

### Epic I09: Testing Infrastructure

- **I09.1** — Unit Test Coverage (>70%)
- **I09.2** — Integration Tests for Critical Paths
- **I09.3** — E2E Tests for Patient & Clinician Flows
- **I09.4** — Performance & Load Testing

### Epic I10: Security & Compliance

- **I10.1** — Security Audit & Vulnerability Fixes
- **I10.2** — Data Privacy Compliance (GDPR/DSGVO)
- **I10.3** — Session Management & Timeout Configuration
- **I10.4** — Penetration Testing & Remediation

---

## Milestone Structure

### Milestone 1: Walking Skeleton Complete (Critical Path)

**Goal:** Complete the end-to-end flow: Patient completes assessment → Report generated → Clinician sees triage  
**Duration:** *ESTIMATE ONLY* — Based on 8 issues × 9hr average = ~72 hours (2-3 weeks with parallelism). No historical data for these specific issues.  
**Priority:** P0 (Must Have)

#### Issues in Milestone 1 (Critical Path)

1. **I03.2** — Assessment Runtime & Step Navigation ⚡ *BLOCKING*
2. **I03.3** — Answer Persistence & Validation ⚡ *BLOCKING*
3. **I03.4** — Assessment Completion & State Management ⚡ *BLOCKING*
4. **I04.1** — Report Processing Engine ⚡ *CRITICAL PATH*
5. **I04.2** — AI/AMY Integration for Report Generation ⚡ *CRITICAL PATH*
6. **I04.3** — Report Storage & Versioning ⚡ *CRITICAL PATH*
7. **I05.1** — Clinician Report Dashboard ⚡ *CRITICAL PATH*
8. **I05.2** — Risk Level Filtering & Sorting ⚡ *CRITICAL PATH*

#### Dependencies (Milestone 1) — Evidence-Based

```
Prerequisites (Already Complete):
├─ V05-I01.* (Foundation) ✅
├─ V05-I02.* (Funnel Set) ✅
└─ V05-I03.1 (Onboarding) ✅

Critical Path Sequence (Option B - Full Walking Skeleton):
I03.2 (Assessment Runtime)
  └─ I03.3 (Answer Persistence)
      Evidence: Cannot persist answers without runtime to collect them
      └─ I03.4 (Completion)
          Evidence: Cannot mark complete without answers persisted
          └─ I04.1 (Report Processing)
              Evidence: Report requires completed assessment data
              └─ I04.2 (AI/AMY Integration)
                  Evidence: Report generation requires processing engine
                  └─ I04.3 (Report Storage)
                      Evidence: Must generate report before storing
                      └─ I05.1 (Clinician Dashboard)
                          Evidence: Dashboard displays stored reports
                          └─ I05.2 (Filtering)
                              Evidence: Cannot filter without dashboard to display

Alternative Path (Option A - Minimal, No Report):
I03.2 → I03.3 → I03.4 → I05.1 (display raw assessment data)
Evidence: Technically possible but does not satisfy "Walking Skeleton Pillar 4 → Report → Clinician" requirement from issue title.
```

#### Definition of Done (Milestone 1)

- [ ] Patient can start an assessment from funnel catalog
- [ ] Patient can navigate through all steps (questions + content pages)
- [ ] Patient can answer all required questions with validation
- [ ] Patient can complete assessment successfully
- [ ] Assessment completion triggers report generation
- [ ] AI/AMY generates report with risk scores and recommendations
- [ ] Report is stored with versioning in database
- [ ] Clinician can view all patient reports in dashboard
- [ ] Clinician can filter reports by risk level (high, medium, low)
- [ ] End-to-end flow tested manually and passes acceptance criteria
- [ ] No critical security vulnerabilities in critical path
- [ ] Basic error handling implemented for all critical path steps

**Success Criteria:** A patient can complete the stress assessment funnel, receive a generated report, and a clinician can view and triage that report in the dashboard.

---

### Milestone 2: Enhanced Features & Management (P1)

**Goal:** Add clinician management tools, enhanced triage, and notification system  
**Duration:** *ESTIMATE ONLY* — Based on 8 issues × 9hr average = ~72 hours (1.5-2 weeks with parallelism). No historical data for these specific issues.  
**Priority:** P1 (Should Have)

#### Issues in Milestone 2

1. **I05.3** — Patient Detail View with Report History
2. **I05.4** — Triage Action Workflow
3. **I04.4** — Report Delivery & Notification
4. **I06.1** — Funnel Configuration UI
5. **I06.2** — Question Bank Management
6. **I06.4** — Funnel Activation/Deactivation Controls
7. **I08.1** — Assessment Metrics & Analytics
8. **I08.2** — Report Generation Performance Monitoring

#### Dependencies (Milestone 2) — Evidence-Based

```
Prerequisites:
├─ Milestone 1 Complete (Walking Skeleton) ⚡
│
Parallel Tracks:
├─ Triage Enhancement (I05.3 → I05.4)
│   └─ Depends on: I05.1, I05.2
│       Evidence: I05.3 requires dashboard (I05.1) to add detail view
│       Evidence: I05.4 requires patient detail view (I05.3) for triage actions
│
├─ Notification System (I04.4)
│   └─ Depends on: I04.3
│       Evidence: Cannot notify about report until report is stored (I04.3)
│
├─ Funnel Management (I06.1 → I06.2 → I06.4)
│   └─ Depends on: V05-I02.* (Already complete)
│       Evidence: V05-I02.1 created funnels_catalog table required for UI
│       Evidence: I06.2 requires I06.1 for UI framework to manage questions
│
└─ Analytics (I08.1 → I08.2)
    └─ Depends on: I04.3, I05.1
        Evidence: I08.1 requires completed assessments (I03.4) and reports (I04.3) to analyze
        Evidence: I08.2 requires report generation (I04.2) to monitor performance
```

#### Definition of Done (Milestone 2)

- [ ] Clinician can click into individual patient to see full assessment history
- [ ] Clinician can perform triage actions (mark reviewed, add notes, assign priority)
- [ ] Patients receive notification when report is ready (email/in-app)
- [ ] Clinician can configure funnel settings (order, questions, content)
- [ ] Clinician can manage question bank (add, edit, deactivate questions)
- [ ] Clinician can activate/deactivate funnels for patient access
- [ ] Assessment completion metrics visible in analytics dashboard
- [ ] Report generation performance tracked and monitored
- [ ] All features tested with manual test plan
- [ ] Documentation updated for all new features

**Success Criteria:** Clinicians can fully manage patient triage workflow and configure funnels. Assessment and report metrics are visible.

---

### Milestone 3: Content, Security & Production Readiness (P1-P2)

**Goal:** Complete content management, testing infrastructure, and production hardening  
**Duration:** *ESTIMATE ONLY* — Based on 15 issues × 9hr average = ~135 hours (3-4 weeks with parallelism). No historical data for these specific issues.  
**Priority:** P1-P2 (Should Have / Nice to Have)

#### Issues in Milestone 3

1. **I07.1** — Content Page CRUD Operations
2. **I07.2** — Content Versioning System
3. **I07.3** — Media Library & Upload
4. **I07.4** — Content Preview & Publishing Workflow
5. **I06.3** — Content Page Editor Integration
6. **I08.3** — User Activity Tracking
7. **I08.4** — Error Tracking & Alerting Integration
8. **I09.1** — Unit Test Coverage (>70%)
9. **I09.2** — Integration Tests for Critical Paths
10. **I09.3** — E2E Tests for Patient & Clinician Flows
11. **I09.4** — Performance & Load Testing
12. **I10.1** — Security Audit & Vulnerability Fixes
13. **I10.2** — Data Privacy Compliance (GDPR/DSGVO)
14. **I10.3** — Session Management & Timeout Configuration
15. **I10.4** — Penetration Testing & Remediation

#### Dependencies (Milestone 3) — Evidence-Based

```
Prerequisites:
├─ Milestone 1 Complete ⚡
├─ Milestone 2 Complete (recommended but not blocking)
│
Parallel Tracks:
├─ Content Management (I07.1 → I07.2 → I07.3 → I07.4)
│   Evidence: I07.2 requires I07.1 CRUD to have content to version
│   Evidence: I07.3 requires I07.2 for versioning of uploaded media
│   Evidence: I07.4 requires I07.3 for preview of content with media
│   └─ I06.3 depends on I07.1 + I06.1
│       Evidence: Editor integration needs both content CRUD (I07.1) and funnel config UI (I06.1)
│
├─ Monitoring (I08.3 → I08.4)
│   Evidence: Both are RELATED but not strictly dependent (can implement independently)
│
├─ Testing (I09.1 → I09.2 → I09.3 → I09.4)
│   └─ Depends on: Milestone 1 & 2 features exist to test
│       Evidence: I09.2 requires critical paths (M1 issues) to be implemented
│       Evidence: I09.3 requires full flows (M1+M2 issues) to test E2E
│       Evidence: I09.4 requires complete features to load test
│
└─ Security (I10.1 → I10.2 → I10.3 → I10.4)
    Evidence: I10.1 should start early (can run parallel with M1 development)
    Evidence: I10.2 depends on I10.1 findings for compliance gaps
    Evidence: I10.3 depends on I10.1 findings for session security
    Evidence: I10.4 must be last (after all features complete) to test full attack surface
```

#### Definition of Done (Milestone 3)

- [ ] Clinician can create, edit, and delete content pages via UI
- [ ] Content versioning tracks all changes with rollback capability
- [ ] Media library supports image/video upload and management
- [ ] Content preview shows page before publishing
- [ ] Content page editor integrated into funnel configuration
- [ ] User activity tracked for audit and analytics
- [ ] Error tracking (Sentry or equivalent) integrated and monitoring production
- [ ] Unit test coverage >70% across all new code
- [ ] Integration tests cover all critical paths (assessment, report, triage)
- [ ] E2E tests cover full patient and clinician flows
- [ ] Performance testing validates system under expected load
- [ ] Security audit completed with no critical/high vulnerabilities
- [ ] GDPR compliance verified (consent, data access, deletion)
- [ ] Session timeout configured and tested
- [ ] Penetration testing completed with all findings remediated
- [ ] Production deployment checklist complete
- [ ] Monitoring and alerting configured and active

**Success Criteria:** All content management, testing infrastructure, and security requirements met. System is production-ready.

---

## Critical Path Definition

The **Critical Path** represents the minimum viable path to deliver value: A patient completing an assessment and a clinician seeing the triage report.

### Path Variants

**Option A (Minimal - No Report Generation):**
- I03.2 → I03.3 → I03.4 → I05.1
- Total: 4 issues
- Evidence: Technically possible to show raw assessment data in clinician dashboard without report
- **Limitation:** Does not satisfy "Walking Skeleton Pillar 4 → Report → Clinician" from issue requirement

**Option B (Full Walking Skeleton - WITH Report):** ⬅️ **RECOMMENDED**
- I03.2 → I03.3 → I03.4 → I04.1 → I04.2 → I04.3 → I05.1 → I05.2
- Total: 8 issues
- Evidence: Satisfies complete "Patient → Assessment → Processing → Report → Clinician sees triage" requirement
- Aligns with existing AMY/report infrastructure in `lib/amyFallbacks.ts` and `app/api/amy/stress-report/`

**This document uses Option B as the target Critical Path.**

### Critical Path Sequence (Option B - Ordered)

1. **Foundation (Complete)** ✅
   - V05-I01.1 → V05-I01.2 → V05-I01.3 → V05-I01.4
   - V05-I02.1 → V05-I02.2 → V05-I02.3
   - V05-I03.1

2. **Patient Assessment Flow** ⚡ *BLOCKING EVERYTHING*
   - **I03.2** — Assessment Runtime & Step Navigation
   - **I03.3** — Answer Persistence & Validation
   - **I03.4** — Assessment Completion & State Management

3. **Report Generation** ⚡ *CRITICAL PATH*
   - **I04.1** — Report Processing Engine
   - **I04.2** — AI/AMY Integration for Report Generation
   - **I04.3** — Report Storage & Versioning

4. **Clinician Triage** ⚡ *CRITICAL PATH ENDPOINT*
   - **I05.1** — Clinician Report Dashboard
   - **I05.2** — Risk Level Filtering & Sorting

### Total Critical Path Issues: 8 (I03.2 through I05.2)

### Estimated Timeline (Critical Path Only)

**IMPORTANT: All estimates are PROJECTIONS ONLY** — no historical data exists for issues I03.2+.

| Issue     | Epic  | Estimated Effort* | Dependencies                    |
| --------- | ----- | ----------------- | ------------------------------- |
| **I03.2** | I03   | TBD               | V05-I03.1 (complete)            |
| **I03.3** | I03   | TBD               | I03.2                           |
| **I03.4** | I03   | TBD               | I03.3                           |
| **I04.1** | I04   | TBD               | I03.4                           |
| **I04.2** | I04   | TBD               | I04.1                           |
| **I04.3** | I04   | TBD               | I04.2                           |
| **I05.1** | I05   | TBD               | I04.3                           |
| **I05.2** | I05   | TBD               | I05.1                           |
| **Total** |       | **TBD**           | **Sequential dependencies**     |

\* Effort estimates removed until issues are broken down into concrete tasks with acceptance criteria.

**Parallelism Opportunities:**
- I04.1 and I04.2 can be partially parallel if API contracts defined early
- Testing (I09.*) can run in parallel with development
- Security audit (I10.1) can start during Milestone 1 development

---

## Dependency Matrix — Evidence-Based

| Issue  | Depends On                | Evidence for Dependency                                                                    | Blocks        | Relationship | Epic | Milestone |
| ------ | ------------------------- | ------------------------------------------------------------------------------------------ | ------------- | ------------ | ---- | --------- |
| I03.2  | V05-I03.1                 | Onboarding gates (V05-I03.1) must complete before assessment can start                    | I03.3, I03.4  | HARD BLOCK   | I03  | M1        |
| I03.3  | I03.2                     | Cannot persist answers without runtime to collect them                                    | I03.4         | HARD BLOCK   | I03  | M1        |
| I03.4  | I03.3                     | Cannot mark assessment complete without validated answers persisted                       | I04.1         | HARD BLOCK   | I03  | M1        |
| I04.1  | I03.4                     | Report processing requires completed assessment data                                      | I04.2         | HARD BLOCK   | I04  | M1        |
| I04.2  | I04.1                     | AI/AMY integration requires processing engine to generate report                          | I04.3         | HARD BLOCK   | I04  | M1        |
| I04.3  | I04.2                     | Cannot store report until it is generated                                                 | I05.1, I04.4  | HARD BLOCK   | I04  | M1        |
| I04.4  | I04.3                     | Cannot notify about report until it is stored                                             | —             | HARD BLOCK   | I04  | M2        |
| I05.1  | I04.3                     | Dashboard displays stored reports; cannot display if not stored                           | I05.2, I05.3  | HARD BLOCK   | I05  | M1        |
| I05.2  | I05.1                     | Cannot filter reports without dashboard that displays them                                | —             | HARD BLOCK   | I05  | M1        |
| I05.3  | I05.1, I05.2              | Patient detail view extends dashboard (I05.1) and uses filtering (I05.2)                 | I05.4         | HARD BLOCK   | I05  | M2        |
| I05.4  | I05.3                     | Triage actions require patient detail view to perform on                                  | —             | HARD BLOCK   | I05  | M2        |
| I06.1  | V05-I02.*                 | UI requires funnels_catalog table created in V05-I02.1                                    | I06.2, I06.3  | HARD BLOCK   | I06  | M2        |
| I06.2  | I06.1                     | Question bank management needs funnel config UI framework                                 | —             | RELATED      | I06  | M2        |
| I06.3  | I06.1, I07.1              | Editor integration needs both funnel config UI and content CRUD                           | —             | HARD BLOCK   | I06  | M3        |
| I06.4  | I06.1                     | Activation controls use funnel config UI                                                  | —             | RELATED      | I06  | M2        |
| I07.1  | —                         | No prerequisite; can start independently                                                  | I07.2, I06.3  | HARD BLOCK   | I07  | M3        |
| I07.2  | I07.1                     | Cannot version content that doesn't exist (requires CRUD first)                           | I07.3         | HARD BLOCK   | I07  | M3        |
| I07.3  | I07.2                     | Media needs versioning for rollback of content with media                                 | I07.4         | RELATED      | I07  | M3        |
| I07.4  | I07.3                     | Preview requires content with potential media to preview                                  | —             | RELATED      | I07  | M3        |
| I08.1  | I04.3, I05.1              | Metrics require completed assessments (I03.4) and reports (I04.3) to analyze             | —             | HARD BLOCK   | I08  | M2        |
| I08.2  | I04.3                     | Performance monitoring requires report generation (I04.2) to monitor                      | —             | HARD BLOCK   | I08  | M2        |
| I08.3  | —                         | No prerequisite; can implement independently                                              | —             | RELATED      | I08  | M3        |
| I08.4  | —                         | No prerequisite; can implement independently                                              | —             | RELATED      | I08  | M3        |
| I09.1  | M1 features exist         | Unit tests require code (I03.2-I05.2) to test                                            | —             | HARD BLOCK   | I09  | M3        |
| I09.2  | M1 features exist         | Integration tests require critical paths (M1) implemented                                 | I09.3         | HARD BLOCK   | I09  | M3        |
| I09.3  | M1, M2 features exist     | E2E tests require full flows (M1+M2) to test                                              | —             | HARD BLOCK   | I09  | M3        |
| I09.4  | M1, M2 features exist     | Load testing requires complete features to load test                                      | —             | HARD BLOCK   | I09  | M3        |
| I10.1  | —                         | Can start early; no prerequisite                                                          | I10.2, I10.3  | RELATED      | I10  | M3        |
| I10.2  | I10.1                     | Compliance work should address findings from security audit                               | —             | RELATED      | I10  | M3        |
| I10.3  | I10.1                     | Session security should address findings from security audit                              | —             | RELATED      | I10  | M3        |
| I10.4  | All features complete     | Penetration test requires full attack surface (all features) to test                      | —             | HARD BLOCK   | I10  | M3        |

**Relationship Key:**
- **HARD BLOCK:** Cannot proceed without prerequisite (technical/logical dependency)
- **RELATED:** Recommended sequence but not strictly blocking (organizational/quality dependency)

---

## Risk Assessment

### High-Risk Items (Could Delay Critical Path)

1. **I03.2 — Assessment Runtime** ⚠️ HIGH RISK
   - **Why:** Core infrastructure for entire patient flow
   - **Mitigation:** Start immediately, allocate senior developer, use existing funnel runtime patterns
   - **Fallback:** Simplify navigation to linear flow first, add branching logic later

2. **I04.2 — AI/AMY Integration** ⚠️ HIGH RISK
   - **Why:** External dependency on Anthropic API, potential rate limits/costs
   - **Mitigation:** Implement robust fallback responses (already exists in `lib/amyFallbacks.ts`), rate limiting, caching
   - **Fallback:** Use rule-based scoring algorithm if AI unavailable

3. **I04.1 — Report Processing Engine** ⚠️ MEDIUM RISK
   - **Why:** Complex business logic for scoring and recommendations
   - **Mitigation:** Start with simple scoring algorithm, iterate based on medical team feedback
   - **Fallback:** Manual clinician scoring as interim solution

### Medium-Risk Items

4. **I09.2/I09.3 — Integration/E2E Tests** ⚠️ MEDIUM RISK
   - **Why:** Test infrastructure setup can be time-consuming
   - **Mitigation:** Start test framework setup in parallel with M1 development
   - **Fallback:** Reduce coverage target from >70% to >50% for initial release

5. **I10.4 — Penetration Testing** ⚠️ MEDIUM RISK
   - **Why:** Findings could require significant rework
   - **Mitigation:** Schedule early (during M2), budget time for remediation
   - **Fallback:** Address critical/high findings only, defer medium/low to v0.6

---

## Recommended Implementation Order

**IMPORTANT: All week/phase timelines below are ILLUSTRATIVE ONLY** — actual timing will depend on issue breakdown, team capacity, and unforeseen complexity.

### Phase 1: Critical Path (*Target: Milestone 1*)

**Phase 1.1:** Assessment Runtime Foundation
- Start: I03.2 (Assessment Runtime)
- Start: I10.1 (Security Audit - run in parallel)
- Complete: I03.2
- Start: I03.3 (Answer Persistence)

**Phase 1.2:** Assessment Completion & Report Engine
- Complete: I03.3
- Start: I03.4 (Completion)
- Complete: I03.4
- Start: I04.1 (Report Processing)
- Start: I04.2 (AI Integration - can overlap with I04.1)

**Phase 1.3:** Report Storage & Clinician Dashboard
- Complete: I04.1, I04.2
- Start: I04.3 (Report Storage)
- Complete: I04.3
- Start: I05.1 (Clinician Dashboard)
- Start: I05.2 (Filtering)
- Complete: I05.1, I05.2
- **MILESTONE 1 COMPLETE** ✅

### Phase 2: Enhanced Features (*Target: Milestone 2*)

**Phase 2.1:** Triage Enhancement & Notifications
- Start: I05.3 (Patient Detail View)
- Start: I04.4 (Notifications)
- Start: I08.1 (Metrics)

**Phase 2.2:** Funnel Management
- Complete: I05.3, I04.4
- Start: I05.4 (Triage Actions)
- Start: I06.1 (Funnel Config UI)
- Start: I06.2 (Question Bank)

**Phase 2.3:** Analytics & Controls
- Complete: I05.4, I06.1, I06.2
- Start: I06.4 (Activation Controls)
- Start: I08.2 (Performance Monitoring)
- Complete: I06.4, I08.1, I08.2
- **MILESTONE 2 COMPLETE** ✅

### Phase 3: Content, Testing & Security (*Target: Milestone 3*)

**Phase 3.1:** Content Management Foundation
- Start: I07.1 (Content CRUD)
- Start: I09.1 (Unit Tests)
- Start: I08.3 (Activity Tracking)

**Phase 3.2:** Content Features & Testing
- Complete: I07.1
- Start: I07.2 (Versioning)
- Start: I07.3 (Media Library)
- Start: I09.2 (Integration Tests)
- Complete: I09.1

**Phase 3.3:** Testing & Security
- Complete: I07.2, I07.3
- Start: I07.4 (Publishing Workflow)
- Start: I06.3 (Editor Integration)
- Start: I09.3 (E2E Tests)
- Complete: I08.3
- Start: I08.4 (Error Tracking)
- Continue: I10.1 (Security Audit)

**Phase 3.4:** Production Readiness
- Complete: I07.4, I06.3, I09.2, I09.3
- Start: I09.4 (Load Testing)
- Start: I10.2 (GDPR Compliance)
- Start: I10.3 (Session Management)
- Complete: I10.1, I08.4, I09.4
- Start: I10.4 (Penetration Testing)
- Complete: I10.2, I10.3, I10.4
- **MILESTONE 3 COMPLETE** ✅

---

## Success Metrics

### Milestone 1 Success Metrics

- [ ] Patient assessment completion rate >80%
- [ ] Report generation success rate >95%
- [ ] Report generation time <30 seconds (p95)
- [ ] Clinician dashboard load time <2 seconds
- [ ] Zero critical bugs in critical path
- [ ] Manual test plan 100% pass rate

### Milestone 2 Success Metrics

- [ ] Clinician triage action completion rate >90%
- [ ] Notification delivery success rate >95%
- [ ] Funnel configuration changes take effect within 1 minute
- [ ] Assessment metrics dashboard loads <3 seconds
- [ ] Zero high-priority bugs in enhanced features

### Milestone 3 Success Metrics

- [ ] Content publishing workflow <5 steps from draft to published
- [ ] Unit test coverage >70%
- [ ] Integration test coverage for all critical paths
- [ ] E2E test success rate >95%
- [ ] Load test handles 100 concurrent users
- [ ] Security audit: 0 critical, 0 high vulnerabilities
- [ ] GDPR compliance verified by legal/compliance team
- [ ] Penetration test findings: 0 critical, 0 high

---

## Issue Template Structure

For consistency, all open V05 issues should follow this structure:

### Issue Title Format
`V05-I{epic}.{number} — {Short Description}`

Example: `V05-I03.2 — Assessment Runtime & Step Navigation`

### Issue Body Template

```markdown
## Epic
{Epic Name and Number}

## Summary
{1-2 sentence description of the issue}

## Prerequisites
- [ ] {List prerequisite issues that must be complete}

## Acceptance Criteria
- [ ] {Specific, testable criteria}
- [ ] {More criteria...}

## Implementation Notes
{Technical guidance, references to existing patterns, etc.}

## Testing Requirements
- [ ] Unit tests for {component}
- [ ] Integration tests for {flow}
- [ ] Manual test plan documented

## Dependencies
**Depends On:** {Issue IDs}  
**Blocks:** {Issue IDs}

## Definition of Done
- [ ] Code implemented and reviewed
- [ ] Tests written and passing
- [ ] Documentation updated
- [ ] Manual testing complete
- [ ] Security review (if applicable)
- [ ] Performance verified (if applicable)
```

---

## Next Actions

### Immediate Actions
1. **Create GitHub Issues** for all open V05 issues (I03.2 → I10.4) using template above
2. **Assign Issue Labels:** epic, milestone, priority, component tags
3. **Break down I03.2** into concrete tasks with acceptance criteria before starting
4. **Start I10.1** — Security Audit (run in parallel, long lead time)
5. **Set up Project Board** with Milestone 1, 2, 3 columns
6. **Schedule Sprint Planning** for Critical Path (Milestone 1)

### Before Development Starts
1. **Validate time assumptions** by breaking down first 2-3 issues into tasks
2. **Document API contracts** for Report Processing (I04.1 preparation)
3. **Set up test framework** (Jest/Vitest, Playwright) for I09.*
4. **Review critical path** with team to confirm Option B (with report) is correct

---

## Conclusion

This planning document provides a clear roadmap from the current state (V05-I01 through V05-I03.1 complete) to production readiness. The **critical path** is evidence-based with explicit dependencies.

**Key Takeaways:**
- **8 issues on critical path** (I03.2 → I05.2) must complete for walking skeleton (Option B)
- **Alternative minimal path** (4 issues) available if report generation not required (Option A)
- **All dependencies** have evidence-based justification (HARD BLOCK vs RELATED)
- **Time estimates removed** until issues broken down into concrete tasks
- **32 total issues** organized across 3 milestones

**Walking Skeleton Definition:**  
"Patient completes stress assessment → AMY generates report → Clinician sees triage dashboard with risk filtering"

**Evidence Basis:**
- Completed issue velocity: 9hr average per issue (source: `docs/TV05_CLEANUP_AUDIT_ISSUE_MAP.md`)
- Dependency logic: Sequential requirements for data flow
- Issue titles: From v0.5 backlog (`docs/releases/v0.5/backlog.md`)
- No new terms introduced; all based on existing repository documentation

---

**Document Version:** 2.0.0  
**Created:** 2026-01-02  
**Updated:** 2026-01-02 (Evidence-based revision)  
**Author:** Copilot Planning Agent  
**Status:** Active Planning Document
