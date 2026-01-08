# Content Safety Operations - Standard Operating Procedure (SOP)

**Rhythmologicum Connect - V05-I10.4**  
**Version:** 1.0.0  
**Date:** 2026-01-08  
**Status:** Active  
**Target Audience:** Clinicians, QA Team, Administrators

---

## Table of Contents

1. [Overview](#overview)
2. [Review Queue System](#review-queue-system)
3. [Sampling Rules](#sampling-rules)
4. [SLA Targets](#sla-targets)
5. [Workflow Procedures](#workflow-procedures)
6. [Operational Checklist](#operational-checklist)
7. [Escalation Procedures](#escalation-procedures)
8. [Reporting & Metrics](#reporting--metrics)

---

## 1. Overview

### Purpose

This SOP defines the operational procedures for managing the Content Safety Review Queue, including:
- Processing flagged reports (validation failures, safety blocks)
- Quality assurance sampling
- Service Level Agreement (SLA) compliance
- Escalation protocols

### Scope

This SOP applies to all **medical content review operations** within Rhythmologicum Connect, specifically:
- AI-generated assessment reports (AMY reports)
- Medical validation results (Layer 1: rules-based)
- Safety check results (Layer 2: AI-based)
- Quality assurance sampling

### Responsibilities

| Role | Responsibilities |
|------|-----------------|
| **Clinician** | Review flagged items, make approve/reject decisions, document rationale |
| **QA Lead** | Monitor SLA compliance, escalate overdue items, manage sampling configuration |
| **Administrator** | System configuration, user access management, audit compliance |

---

## 2. Review Queue System

### Queue Entry Criteria

Jobs enter the review queue automatically based on the following triggers:

#### 2.1 Validation Failures (Layer 1)
- **VALIDATION_FAIL** - Critical contraindication or plausibility flags
  - Example: Drug interaction detected
  - Example: Clinically implausible vital signs
  - **Action Required:** Immediate review, high priority

- **VALIDATION_FLAG** - Warning-level flags
  - Example: Borderline values requiring clinical judgment
  - Example: Minor inconsistencies in assessment data
  - **Action Required:** Review within SLA timeframe

#### 2.2 Safety Check Results (Layer 2)
- **SAFETY_BLOCK** - AI safety check recommends blocking
  - Example: Potentially harmful medical advice detected
  - Example: Inappropriate tone or content
  - **Action Required:** Immediate review, **must** be approved before patient sees report

- **SAFETY_FLAG** - AI detected potential concerns
  - Example: Ambiguous phrasing requiring clarification
  - Example: Safety score below threshold
  - **Action Required:** Review within SLA timeframe

- **SAFETY_UNKNOWN** - Safety check failed or returned error
  - Example: AI service unavailable
  - Example: Unexpected response format
  - **Action Required:** Manual review required (fail-safe behavior)

#### 2.3 Quality Assurance Sampling
- **SAMPLED** - Selected for quality assurance review
  - Deterministically selected based on job ID + sampling salt
  - Default: 10% of all passing jobs
  - **Action Required:** Review within extended SLA (lower priority)

#### 2.4 Manual Review
- **MANUAL_REVIEW** - Manually added by clinician or admin
  - Example: Post-release quality concern
  - Example: Patient complaint investigation
  - **Action Required:** Review according to priority set by requester

---

## 3. Sampling Rules

### Deterministic Sampling

The system uses **deterministic sampling** to ensure:
- Same job + configuration → same sampling decision (reproducible)
- No random selection (auditable, testable)
- Configurable percentage (0-100%)

### Sampling Configuration

**Default Settings:**
```
Sampling Percentage: 10%
Sampling Salt: v05-i05-7-default-salt
Config Version: v1.0.0
```

**Environment Variables:**
```bash
REVIEW_SAMPLING_PERCENTAGE=10  # 0-100
REVIEW_SAMPLING_SALT=v1-salt   # String for hash computation
```

### Sampling Algorithm

1. Compute SHA-256 hash: `hash = SHA256(job_id + salt)`
2. Convert hash to integer (modulo 100): `value = hash % 100`
3. Sample if: `value < sampling_percentage`

**Example:**
- If sampling_percentage = 10
- Job sampled if hash % 100 < 10
- Results in exactly ~10% of jobs sampled

### Adjusting Sampling Rate

**When to Increase:**
- Quality issues detected in production
- New validation rules deployed
- Post-incident increased monitoring

**When to Decrease:**
- High queue backlog
- Resource constraints
- Stable quality metrics

**Change Process:**
1. QA Lead requests change with justification
2. Administrator updates environment variable
3. Change logged in audit trail
4. Monitor impact for 48 hours

---

## 4. SLA Targets

### Priority Levels

| Priority | Trigger | Target Review Time | Max Time |
|----------|---------|-------------------|----------|
| **P0 - Critical** | SAFETY_BLOCK, VALIDATION_FAIL | 2 hours | 4 hours |
| **P1 - High** | SAFETY_FLAG, SAFETY_UNKNOWN | 8 hours | 24 hours |
| **P2 - Standard** | VALIDATION_FLAG, MANUAL_REVIEW | 24 hours | 48 hours |
| **P3 - Low** | SAMPLED (quality check) | 72 hours | 7 days |

### Business Hours

- **Weekdays:** 08:00 - 18:00 (CET)
- **Weekends:** Emergency coverage only (P0/P1)
- **Holidays:** Emergency coverage only (P0/P1)

### SLA Calculation

- **Start Time:** When review record is created (`created_at`)
- **End Time:** When decision is made (`decided_at`)
- **Paused Time:** N/A (currently no pause mechanism)
- **Business Hours Only:** No (24/7 clock for all priorities)

### SLA Compliance Targets

| Metric | Target |
|--------|--------|
| P0 within 2h | ≥ 95% |
| P1 within 8h | ≥ 90% |
| P2 within 24h | ≥ 85% |
| P3 within 72h | ≥ 80% |
| Overall compliance | ≥ 90% |

---

## 5. Workflow Procedures

### 5.1 Daily Queue Review

**Frequency:** Start of each shift, every 4 hours during shift

**Steps:**
1. Log into clinician dashboard: `/clinician/review-queue`
2. Review queue summary:
   - Total pending items
   - Overdue items (red flag)
   - Items approaching SLA (amber warning)
3. Prioritize work:
   - P0 items first (SAFETY_BLOCK, VALIDATION_FAIL)
   - P1 items second (SAFETY_FLAG, SAFETY_UNKNOWN)
   - P2 items third (VALIDATION_FLAG, MANUAL_REVIEW)
   - P3 items last (SAMPLED)

### 5.2 Reviewing a Flagged Item

**Steps:**
1. Open review item from queue
2. Review **QA Review Panel** containing:
   - **Review Metadata:** Queue reasons, sampling status, iteration number
   - **Layer 1 - Medical Validation:**
     - Overall status (pass/flag/fail)
     - Rules evaluated count
     - Flags breakdown (critical/warning/info)
   - **Layer 2 - Safety Check:**
     - Overall action (PASS/FLAG/BLOCK/UNKNOWN)
     - Safety score (0-100)
     - Findings breakdown (critical/high/medium/low)
3. Access full assessment data (if needed):
   - Navigate to patient detail page
   - Review complete assessment answers
   - Check patient history and context
4. Make clinical judgment
5. Document decision with appropriate reason code
6. Add optional notes (max 500 chars, PHI-free)
7. Submit decision

### 5.3 Decision Guidelines

#### Approve Decision

**When to Approve:**
- ✅ Flag is a false positive (validation/safety check incorrect)
- ✅ Content is clinically safe despite flag
- ✅ Risk is acceptable with appropriate context
- ✅ Sampled item meets quality standards

**Reason Codes:**
- `APPROVED_SAFE` - Content is safe to proceed
- `APPROVED_FALSE_POSITIVE` - Flag was incorrect
- `APPROVED_ACCEPTABLE_RISK` - Risk acceptable in context
- `APPROVED_SAMPLED_OK` - Quality sample passed

**Example:**
```
Status: APPROVED
Reason: APPROVED_FALSE_POSITIVE
Notes: "Validation flagged drug interaction, but patient explicitly 
        documented they stopped previous medication. Safe to proceed."
```

#### Reject Decision

**When to Reject:**
- ❌ Content has genuine safety concerns
- ❌ Contraindication is real and blocking
- ❌ Plausibility issue cannot be resolved
- ❌ Quality does not meet standards
- ❌ Policy violation detected

**Reason Codes:**
- `REJECTED_UNSAFE` - Safety concerns present
- `REJECTED_CONTRAINDICATION` - Contraindication detected
- `REJECTED_PLAUSIBILITY` - Plausibility issue
- `REJECTED_QUALITY` - Quality not acceptable
- `REJECTED_POLICY` - Policy violation

**Example:**
```
Status: REJECTED
Reason: REJECTED_CONTRAINDICATION
Notes: "Patient has documented allergy to beta-blockers. Report 
        recommendation is inappropriate and potentially harmful."
```

#### Request Changes

**When to Request Changes:**
- 🔄 Content needs minor adjustments
- 🔄 Clarification required
- 🔄 Tone adjustment needed
- 🔄 Content revision needed

**Reason Codes:**
- `CHANGES_NEEDED_CLARIFICATION` - Needs clarification
- `CHANGES_NEEDED_TONE` - Tone adjustment
- `CHANGES_NEEDED_CONTENT` - Content revision

**Example:**
```
Status: CHANGES_REQUESTED
Reason: CHANGES_NEEDED_TONE
Notes: "Report tone is too alarmist. Recommend rephrasing stress 
        level explanation to be more supportive and actionable."
```

**Note:** Currently, CHANGES_REQUESTED requires manual re-processing. System does not auto-regenerate reports.

### 5.4 Special Cases

#### Case: Safety Unknown (Layer 2 Failure)

**Scenario:** AI safety check failed or returned UNKNOWN

**Procedure:**
1. Manually review the content thoroughly
2. Apply clinical judgment (treat as if safety check succeeded)
3. If content appears safe → APPROVE with reason `APPROVED_SAFE`
4. If uncertain → REJECT with reason `REJECTED_QUALITY`
5. Document in notes: "Manual review performed due to safety check failure"
6. **Escalate** if pattern of SAFETY_UNKNOWN detected

#### Case: Duplicate Flags

**Scenario:** Both Layer 1 and Layer 2 flagged same issue

**Procedure:**
1. Review both validation results and safety check
2. Determine root cause of flags
3. Make single decision addressing both concerns
4. Document in notes which layers flagged and why
5. Decision applies to entire review (not per-layer)

#### Case: Borderline Safety Score

**Scenario:** Safety score between 60-75 (ambiguous zone)

**Procedure:**
1. Review detailed safety findings
2. Check for critical or high severity findings
3. Consider patient context and history
4. If ≥70 and no critical findings → likely APPROVE
5. If <65 or any critical findings → likely REJECT
6. Document reasoning in notes

---

## 6. Operational Checklist

### Daily Shift Checklist

**Start of Shift:**
- [ ] Log into clinician dashboard
- [ ] Check queue summary for overdue items
- [ ] Identify P0/P1 items requiring immediate attention
- [ ] Check system status (no errors/alerts)
- [ ] Review any overnight escalations

**During Shift (every 4 hours):**
- [ ] Refresh queue and check for new P0/P1 items
- [ ] Monitor SLA compliance (green/amber/red indicators)
- [ ] Process minimum of X items (based on queue depth)
- [ ] Document any blockers or technical issues

**End of Shift:**
- [ ] Update queue status summary
- [ ] Handoff any pending P0/P1 items to next shift
- [ ] Log any unresolved technical issues
- [ ] Report SLA metrics to QA Lead (if applicable)

### Weekly QA Lead Checklist

- [ ] Review SLA compliance metrics
- [ ] Identify trends in queue reasons (validation vs safety)
- [ ] Check sampling rate effectiveness
- [ ] Review decision reason distribution
- [ ] Escalate systematic issues (e.g., high false positive rate)
- [ ] Report weekly metrics to management
- [ ] Adjust sampling configuration if needed

### Monthly Administrator Checklist

- [ ] Audit review decisions for compliance
- [ ] Review access logs and user activity
- [ ] Check database performance (review_records table size)
- [ ] Archive old review records (if retention policy)
- [ ] Update documentation based on process improvements
- [ ] Review and update SOP if needed

---

## 7. Escalation Procedures

### When to Escalate

**Technical Issues:**
- System errors preventing reviews
- Database connectivity issues
- API failures (GET /api/review/queue returns errors)
- Performance degradation (slow load times)

**Process Issues:**
- SLA breach on P0 items (>4 hours)
- Queue backlog >50 items
- Systematic false positives (>20% of reviews)
- Unclear edge cases requiring policy decision

**Safety Issues:**
- Pattern of SAFETY_BLOCK on seemingly safe content
- Patient complaints about blocked reports
- Suspected bug in validation or safety layers

### Escalation Contacts

| Issue Type | First Contact | Second Contact | Response Time |
|-----------|--------------|----------------|---------------|
| **Technical** | DevOps Team | Engineering Lead | 1 hour (P0), 4 hours (P1) |
| **Process** | QA Lead | Clinical Director | 4 hours (P0), 24 hours (P1) |
| **Safety** | Clinical Director | Medical Advisor | Immediate (P0), 2 hours (P1) |

### Escalation Template

```
Subject: [P0/P1/P2] Queue Escalation - [Brief Description]

Issue Type: [Technical/Process/Safety]
Priority: [P0/P1/P2]
Detected At: [Timestamp]
Reporter: [Name/Role]

Description:
[Detailed description of the issue]

Impact:
- Number of items affected: X
- SLA breach: Yes/No
- Patient impact: Yes/No

Current Status:
[What has been done so far]

Requested Action:
[What needs to happen]

Attachments:
- Review ID(s): [UUIDs]
- Screenshots: [If applicable]
- Error logs: [If applicable]
```

---

## 8. Reporting & Metrics

### Daily Metrics

**Tracked Automatically:**
- Total pending reviews
- Items by priority (P0/P1/P2/P3)
- Average review time by priority
- SLA compliance rate
- Decision distribution (Approved/Rejected/Changes Requested)

**Reporting Location:**
- Queue dashboard: `/clinician/review-queue`
- API endpoint: `GET /api/review/queue?counts=true`

### Weekly Report

**Generated By:** QA Lead  
**Recipients:** Clinical Director, Management

**Contents:**
1. **Queue Summary:**
   - Total reviews processed
   - SLA compliance by priority
   - Average review time
2. **Quality Metrics:**
   - Sampling rate effectiveness
   - False positive rate (approvals of flagged items)
   - Validation vs safety distribution
3. **Trends:**
   - Week-over-week changes
   - Common queue reasons
   - Common decision reasons
4. **Action Items:**
   - Process improvements
   - Configuration changes
   - Training needs

### Monthly Report

**Generated By:** Administrator  
**Recipients:** Management, Compliance Officer

**Contents:**
1. **Compliance:**
   - SLA achievement vs targets
   - Audit trail completeness
   - Access control review
2. **Performance:**
   - Reviewer productivity
   - Queue throughput
   - System performance
3. **Quality:**
   - Patient satisfaction impact
   - Error/incident rate
   - Improvement initiatives
4. **Recommendations:**
   - Policy updates
   - System enhancements
   - Resource allocation

---

## 9. Revision History

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 1.0.0 | 2026-01-08 | GitHub Copilot | Initial SOP creation for V05-I10.4 |

---

## 10. References

### Related Documentation
- **V05-I05.7 Implementation:** Review Queue System Architecture
- **lib/review/README.md:** Technical API documentation
- **CONTENT_QA_CHECKLIST.md:** Quality assurance testing procedures

### System Endpoints
- Queue Dashboard: `/clinician/review-queue`
- Queue API: `GET /api/review/queue`
- Review Details: `GET /api/review/{reviewId}/details`
- Decision API: `POST /api/review/{reviewId}/decide`

### Database Tables
- `review_records` - Review queue entries
- `medical_validation_results` - Layer 1 validation data
- `safety_check_results` - Layer 2 safety data
- `processing_jobs` - Job orchestration data

---

**END OF SOP**
