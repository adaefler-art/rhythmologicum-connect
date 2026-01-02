# V05 Milestones & Critical Path

**Purpose:** Define milestones, dependencies, and critical path for open V05 issues  
**Status:** Planning Document  
**Last Updated:** 2026-01-02

---

## Executive Summary

This document organizes the remaining open V05 issues (I03.2 → I10.4) into milestones with explicit dependencies. It defines the **critical path** to complete the Walking Skeleton: "Patient completes assessment → processing → report → clinician sees triage."

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
**Duration:** 3-4 weeks  
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

#### Dependencies (Milestone 1)

```
Prerequisites (Already Complete):
├─ V05-I01.* (Foundation) ✅
├─ V05-I02.* (Funnel Set) ✅
└─ V05-I03.1 (Onboarding) ✅

Critical Path Sequence:
I03.2 (Assessment Runtime)
  └─ I03.3 (Answer Persistence)
      └─ I03.4 (Completion)
          └─ I04.1 (Report Processing)
              └─ I04.2 (AI Integration)
                  └─ I04.3 (Report Storage)
                      └─ I05.1 (Clinician Dashboard)
                          └─ I05.2 (Filtering)
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
**Duration:** 2-3 weeks  
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

#### Dependencies (Milestone 2)

```
Prerequisites:
├─ Milestone 1 Complete (Walking Skeleton) ⚡
│
Parallel Tracks:
├─ Triage Enhancement (I05.3 → I05.4)
│   └─ Depends on: I05.1, I05.2
│
├─ Notification System (I04.4)
│   └─ Depends on: I04.3
│
├─ Funnel Management (I06.1 → I06.2 → I06.4)
│   └─ Depends on: V05-I02.* (Already complete)
│
└─ Analytics (I08.1 → I08.2)
    └─ Depends on: I04.3, I05.1
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
**Duration:** 3-4 weeks  
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

#### Dependencies (Milestone 3)

```
Prerequisites:
├─ Milestone 1 Complete ⚡
├─ Milestone 2 Complete (recommended but not blocking)
│
Parallel Tracks:
├─ Content Management (I07.1 → I07.2 → I07.3 → I07.4)
│   └─ I06.3 depends on I07.1 + I06.1
│
├─ Monitoring (I08.3 → I08.4)
│   └─ Independent, can start anytime
│
├─ Testing (I09.1 → I09.2 → I09.3 → I09.4)
│   └─ Depends on: Milestone 1 & 2 features exist to test
│
└─ Security (I10.1 → I10.2 → I10.3 → I10.4)
    └─ I10.1 should start early
    └─ I10.4 must be last (after all features complete)
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

### Critical Path Sequence (Ordered)

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

| Issue     | Epic  | Estimated Effort | Dependencies                    |
| --------- | ----- | ---------------- | ------------------------------- |
| **I03.2** | I03   | 5-7 days         | V05-I03.1 (complete)            |
| **I03.3** | I03   | 3-5 days         | I03.2                           |
| **I03.4** | I03   | 2-3 days         | I03.3                           |
| **I04.1** | I04   | 5-7 days         | I03.4                           |
| **I04.2** | I04   | 5-7 days         | I04.1                           |
| **I04.3** | I04   | 3-5 days         | I04.2                           |
| **I05.1** | I05   | 5-7 days         | I04.3                           |
| **I05.2** | I05   | 2-3 days         | I05.1                           |
| **Total** |       | **30-44 days**   | **6-9 weeks (with parallelism)**|

**Parallelism Opportunities:**
- I04.1 and I04.2 can be partially parallel if interfaces are defined early
- Testing (I09.*) can run in parallel with development
- Security audit (I10.1) can start during Milestone 1 development

**With Optimal Parallelism:** ~4-6 weeks for critical path

---

## Dependency Matrix

| Issue  | Depends On                | Blocks                    | Epic | Milestone |
| ------ | ------------------------- | ------------------------- | ---- | --------- |
| I03.2  | V05-I03.1                 | I03.3, I03.4              | I03  | M1        |
| I03.3  | I03.2                     | I03.4                     | I03  | M1        |
| I03.4  | I03.3                     | I04.1                     | I03  | M1        |
| I04.1  | I03.4                     | I04.2                     | I04  | M1        |
| I04.2  | I04.1                     | I04.3                     | I04  | M1        |
| I04.3  | I04.2                     | I05.1, I04.4              | I04  | M1        |
| I04.4  | I04.3                     | —                         | I04  | M2        |
| I05.1  | I04.3                     | I05.2, I05.3              | I05  | M1        |
| I05.2  | I05.1                     | —                         | I05  | M1        |
| I05.3  | I05.1, I05.2              | I05.4                     | I05  | M2        |
| I05.4  | I05.3                     | —                         | I05  | M2        |
| I06.1  | V05-I02.*                 | I06.2, I06.3              | I06  | M2        |
| I06.2  | I06.1                     | —                         | I06  | M2        |
| I06.3  | I06.1, I07.1              | —                         | I06  | M3        |
| I06.4  | I06.1                     | —                         | I06  | M2        |
| I07.1  | —                         | I07.2, I06.3              | I07  | M3        |
| I07.2  | I07.1                     | I07.3                     | I07  | M3        |
| I07.3  | I07.2                     | I07.4                     | I07  | M3        |
| I07.4  | I07.3                     | —                         | I07  | M3        |
| I08.1  | I04.3, I05.1              | —                         | I08  | M2        |
| I08.2  | I04.3                     | —                         | I08  | M2        |
| I08.3  | —                         | —                         | I08  | M3        |
| I08.4  | —                         | —                         | I08  | M3        |
| I09.1  | M1 features exist         | —                         | I09  | M3        |
| I09.2  | M1 features exist         | I09.3                     | I09  | M3        |
| I09.3  | M1, M2 features exist     | —                         | I09  | M3        |
| I09.4  | M1, M2 features exist     | —                         | I09  | M3        |
| I10.1  | —                         | I10.2, I10.3, I10.4       | I10  | M3        |
| I10.2  | I10.1                     | —                         | I10  | M3        |
| I10.3  | I10.1                     | —                         | I10  | M3        |
| I10.4  | All features complete     | —                         | I10  | M3        |

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

### Phase 1: Critical Path (Weeks 1-6)

**Week 1-2:** Assessment Runtime Foundation
- Start: I03.2 (Assessment Runtime)
- Start: I10.1 (Security Audit - run in parallel)
- Complete: I03.2
- Start: I03.3 (Answer Persistence)

**Week 3-4:** Assessment Completion & Report Engine
- Complete: I03.3
- Start: I03.4 (Completion)
- Complete: I03.4
- Start: I04.1 (Report Processing)
- Start: I04.2 (AI Integration - can overlap with I04.1)

**Week 5-6:** Report Storage & Clinician Dashboard
- Complete: I04.1, I04.2
- Start: I04.3 (Report Storage)
- Complete: I04.3
- Start: I05.1 (Clinician Dashboard)
- Start: I05.2 (Filtering)
- Complete: I05.1, I05.2
- **MILESTONE 1 COMPLETE** ✅

### Phase 2: Enhanced Features (Weeks 7-9)

**Week 7:** Triage Enhancement & Notifications
- Start: I05.3 (Patient Detail View)
- Start: I04.4 (Notifications)
- Start: I08.1 (Metrics)

**Week 8:** Funnel Management
- Complete: I05.3, I04.4
- Start: I05.4 (Triage Actions)
- Start: I06.1 (Funnel Config UI)
- Start: I06.2 (Question Bank)

**Week 9:** Analytics & Controls
- Complete: I05.4, I06.1, I06.2
- Start: I06.4 (Activation Controls)
- Start: I08.2 (Performance Monitoring)
- Complete: I06.4, I08.1, I08.2
- **MILESTONE 2 COMPLETE** ✅

### Phase 3: Content, Testing & Security (Weeks 10-13)

**Week 10:** Content Management Foundation
- Start: I07.1 (Content CRUD)
- Start: I09.1 (Unit Tests)
- Start: I08.3 (Activity Tracking)

**Week 11:** Content Features & Testing
- Complete: I07.1
- Start: I07.2 (Versioning)
- Start: I07.3 (Media Library)
- Start: I09.2 (Integration Tests)
- Complete: I09.1

**Week 12:** Testing & Security
- Complete: I07.2, I07.3
- Start: I07.4 (Publishing Workflow)
- Start: I06.3 (Editor Integration)
- Start: I09.3 (E2E Tests)
- Complete: I08.3
- Start: I08.4 (Error Tracking)
- Continue: I10.1 (Security Audit)

**Week 13:** Production Readiness
- Complete: I07.4, I06.3, I09.2, I09.3
- Start: I09.4 (Load Testing)
- Start: I10.2 (GDPR Compliance)
- Start: I10.3 (Session Management)
- Complete: I10.1, I08.4, I09.4
- Start: I10.4 (Penetration Testing)
- Complete: I10.2, I10.3, I10.4
- **MILESTONE 3 COMPLETE** ✅

**Total Timeline: 13 weeks (~3 months) for all milestones**

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

### Immediate (Week 1)
1. **Create GitHub Issues** for all open V05 issues (I03.2 → I10.4) using template above
2. **Assign Issue Labels:** epic, milestone, priority, component tags
3. **Start I03.2** — Assessment Runtime & Step Navigation (critical path blocker)
4. **Start I10.1** — Security Audit (run in parallel, long lead time)
5. **Set up Project Board** with Milestone 1, 2, 3 columns
6. **Schedule Sprint Planning** for Critical Path (Milestone 1)

### Week 2
1. **Complete I03.2** and start I03.3
2. **Complete Security Audit I10.1** initial scan
3. **Set up test framework** (Jest/Vitest, Playwright) for I09.*
4. **Document API contracts** for Report Processing (I04.1 preparation)

### Week 3-4
1. **Complete I03.3, I03.4** (Assessment flow complete)
2. **Start I04.1, I04.2** (Report generation)
3. **Begin Integration Tests** for assessment flow
4. **Weekly Demo** to stakeholders showing progress

---

## Conclusion

This planning document provides a clear roadmap from the current state (V05-I01 through V05-I03.1 complete) to production readiness. The **critical path** is well-defined, dependencies are explicit, and success criteria are measurable.

**Key Takeaways:**
- **8 issues on critical path** (I03.2 → I05.2) must complete for walking skeleton
- **Milestone 1** (4-6 weeks) delivers end-to-end value
- **Milestones 2 & 3** add essential features and production hardening
- **Total timeline: ~13 weeks** for all three milestones
- **Parallelism** can reduce timeline with adequate resources

**Walking Skeleton Definition:**  
"Patient completes stress assessment → AMY generates report → Clinician sees triage dashboard with risk filtering"

**This is achievable in 4-6 weeks with focused execution on Milestone 1.**

---

**Document Version:** 1.0.0  
**Created:** 2026-01-02  
**Author:** Copilot Planning Agent  
**Status:** Active Planning Document
