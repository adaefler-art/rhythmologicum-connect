# How to Triage — Clinician Guide

**Version:** 1.0  
**Last Updated:** 2026-02-07  
**Epic:** E78.9

## Table of Contents

1. [Overview](#overview)
2. [Accessing the Triage Inbox](#accessing-the-triage-inbox)
3. [Understanding Case States](#understanding-case-states)
4. [Attention Items and Priority](#attention-items-and-priority)
5. [Next Actions](#next-actions)
6. [Filtering and Searching](#filtering-and-searching)
7. [Working with Cases](#working-with-cases)
8. [Workflows and Best Practices](#workflows-and-best-practices)

## Overview

The Triage Inbox is a centralized dashboard for clinicians to monitor and manage patient assessments. It provides:

- **Real-time view** of all active cases across your organization
- **Automatic prioritization** based on risk, urgency, and SLA deadlines
- **Smart filtering** to focus on what needs attention
- **Clear next actions** for each case

## Accessing the Triage Inbox

### URL

Navigate to: `/clinician/triage`

### Permissions Required

- **Role:** Clinician or Admin
- **Access:** You see only cases for patients in your organization (RLS enforced)

### First-Time Setup

1. Ensure you have a clinician role assigned (contact admin if not)
2. Navigate to the triage inbox URL
3. You'll see all active cases sorted by priority

## Understanding Case States

Each case in the inbox is in one of five states:

### 1. `needs_input` 🟡
**Meaning:** Patient has started the assessment but needs to provide more data.

**What it looks like:**
- Assessment is in progress
- Missing data fields identified
- Waiting for patient action

**Your Action:** Usually none required unless patient needs help.

---

### 2. `in_progress` 🔵
**Meaning:** Patient is actively working on the assessment.

**What it looks like:**
- Assessment started but not completed
- No blockers detected
- Normal progress expected

**Your Action:** Monitor for overdue/stuck cases.

---

### 3. `ready_for_review` 🟢
**Meaning:** Assessment completed, awaiting your review.

**What it looks like:**
- Patient has completed all questions
- Report generated
- Awaiting clinician decision

**Your Action:** **Review the assessment and approve/reject.**

---

### 4. `resolved` ✅
**Meaning:** Case closed. Report reviewed/delivered.

**What it looks like:**
- Review approved by clinician, OR
- Report delivered to patient

**Your Action:** None. Case is complete.

**Note:** Resolved cases are hidden by default (use `activeOnly=false` to see them).

---

### 5. `snoozed` ⏸️
**Meaning:** Temporarily hidden until a specified date.

**What it looks like:**
- Clinician manually snoozed the case
- `snoozed_until` timestamp set

**Your Action:** Case will reappear automatically after snooze period.

**Note:** Not implemented in v1. Reserved for future use.

---

## Attention Items and Priority

### Attention Items

Cases can have multiple attention items that highlight specific concerns:

| Item | Icon | Meaning | Action Required |
|------|------|---------|-----------------|
| **critical_flag** | 🔴 | High risk detected or safety block | **Review immediately** |
| **overdue** | ⚠️ | SLA deadline exceeded | Review/contact patient |
| **stuck** | 🛑 | Processing error or patient abandoned | Investigate and resolve |
| **review_ready** | 📋 | Completed, awaiting review | Review when able |
| **missing_data** | ℹ️ | Required data fields missing | Monitor or contact patient |

### Attention Levels

The overall attention level is the **highest** level among all attention items:

- 🔴 **critical** — Immediate action required (contains `critical_flag`)
- ⚠️ **warn** — Moderate priority (contains `overdue` or `stuck`)
- ℹ️ **info** — Low priority (contains other items)
- ⚪ **none** — No attention required

### Priority Score

Cases are automatically sorted by a computed priority score (0-1000):

**Factors contributing to priority:**
1. **Attention level** (0-500 points)
   - Critical: +500
   - Warn: +300
   - Info: +100
2. **Case state** (0-200 points)
   - Ready for review: +200
   - Needs input: +150
   - In progress: +50
3. **Age** (0-100 points)
   - +2 points per day since started
4. **Specific items** (0-200 points)
   - Critical flag: +200
   - Stuck: +150
   - Overdue: +100

**Default sort:** Priority DESC, then oldest first (assigned_at ASC).

## Next Actions

Each case displays a recommended next action:

### Patient Actions

| Next Action | Icon | What It Means | Route |
|-------------|------|---------------|-------|
| `patient_continue` | ▶️ | Patient should continue assessment | `/patient/assessments/{id}` |
| `patient_provide_data` | 📝 | Patient needs to provide missing data | `/patient/assessments/{id}` |

### Clinician Actions

| Next Action | Icon | What It Means | Route |
|-------------|------|---------------|-------|
| `clinician_review` | 📋 | **You should review this assessment** | `/clinician/triage/{id}/review` |
| `clinician_contact` | 📞 | **You should contact the patient** | `/clinician/patient/{patient_id}` |

### System/Admin Actions

| Next Action | Icon | What It Means | Route |
|-------------|------|---------------|-------|
| `system_retry` | 🔄 | System will retry failed processing | `/api/admin/processing/retry/{job_id}` |
| `admin_investigate` | 🔍 | Admin needs to investigate stuck case | `/admin/diagnostics/case/{id}` |
| `none` | ✅ | No action required (resolved) | N/A |

## Filtering and Searching

### Default View

By default, the inbox shows:
- ✅ **Active cases only** (`activeOnly=true`)
- ✅ **Sorted by priority** (high to low)
- ✅ **All case states** except resolved

### Available Filters

#### 1. Active Only (`activeOnly`)
- **Default:** `true`
- **Values:** `true`, `false`
- **Effect:** When `true`, hides resolved and currently snoozed cases

**URL:** `/clinician/triage?activeOnly=false` (show all cases)

#### 2. Case State (`status`)
- **Valid values:** `needs_input`, `in_progress`, `ready_for_review`, `resolved`, `snoozed`
- **Effect:** Show only cases in specified state

**URL:** `/clinician/triage?status=ready_for_review` (review queue)

#### 3. Attention Level (`attention`)
- **Valid values:** `critical`, `warn`, `info`, `none`
- **Effect:** Show only cases with specified attention level

**URL:** `/clinician/triage?attention=critical` (critical cases only)

#### 4. Search (`q`)
- **Searches:** Patient name, patient ID, funnel slug
- **Case-insensitive**
- **Partial match supported**

**URL:** `/clinician/triage?q=stress` (find stress assessments)

### Common Filter Combinations

#### Critical cases only
```
/clinician/triage?attention=critical
```

#### Review queue (ready for my review)
```
/clinician/triage?status=ready_for_review
```

#### Overdue cases
```
/clinician/triage?attention=warn
```

#### All resolved cases
```
/clinician/triage?activeOnly=false&status=resolved
```

#### Search specific patient
```
/clinician/triage?q=John+Doe
```

## Working with Cases

### Step 1: Open Triage Inbox
Navigate to `/clinician/triage`

### Step 2: Scan Priority Cases
- Look for 🔴 **critical** attention level first
- Then ⚠️ **warn** cases (overdue/stuck)
- Finally ℹ️ **info** cases (review ready)

### Step 3: Review a Case
1. Click on a case with `next_action: clinician_review`
2. Review assessment results and reports
3. Make a decision:
   - ✅ **Approve** → Case moves to `resolved`
   - ❌ **Reject** → Case returns to patient for revision
   - 📞 **Contact patient** → Add notes, schedule call

### Step 4: Handle Stuck Cases
If you see `stuck` or `admin_investigate`:
1. Check processing job status
2. Review error logs
3. Contact admin if needed
4. May need to manually retry or escalate

### Step 5: Contact Patients (Optional)
For `clinician_contact` cases:
1. Click to open patient detail page
2. View patient history
3. Send message or schedule appointment
4. Update case notes

## Workflows and Best Practices

### Daily Triage Workflow

**Morning Routine (10 minutes):**
1. Open triage inbox
2. Filter by `attention=critical`
3. Review and resolve all critical cases
4. Filter by `status=ready_for_review`
5. Review as many as time allows

**Afternoon Check (5 minutes):**
1. Check for new `critical` cases
2. Review `warn` (overdue) cases
3. Contact patients if needed

**End of Day (5 minutes):**
1. Review any remaining `ready_for_review` cases
2. Triage `stuck` cases for admin follow-up

### Best Practices

#### ✅ Do's
- **Prioritize critical cases** — Always review critical flags first
- **Set aside time** — Block 10-15 minutes daily for triage
- **Use filters** — Don't scroll through everything, use smart filters
- **Add notes** — Document decisions and patient contacts
- **Follow SLA** — Aim to review within 2 days of completion

#### ❌ Don'ts
- **Don't ignore stuck cases** — Escalate to admin promptly
- **Don't bypass critical cases** — They need immediate attention
- **Don't snooze repeatedly** — If a case is stuck, resolve it
- **Don't leave cases unreviewed** — Patients are waiting

### Keyboard Shortcuts (Future)

Not yet implemented, but planned:
- `J/K` — Navigate up/down
- `R` — Mark as reviewed
- `C` — Add comment
- `S` — Snooze case
- `?` — Show help

### Performance Tips

- **Use bookmarks** for common filters
- **Review in batches** for efficiency
- **Set up browser notifications** for critical cases (future)
- **Delegate** — Assign cases to other clinicians if supported

## Troubleshooting

### I don't see any cases
- Check `activeOnly=false` to see resolved cases
- Verify you have clinician role
- Ensure patients in your organization have assessments

### Cases not updating
- Refresh the page (cases update in real-time in future)
- Check database connection
- Contact admin if issue persists

### Missing fields in case details
- Ensure database view `triage_cases_v1` is up to date
- Run migrations if schema changed
- Contact admin

### Wrong priority order
- Verify `priority_score` is computed correctly
- Check SLA configuration
- Default sort is `priority_score DESC, assigned_at ASC`

## See Also

- [How to Interpret Statuses](./how-to-interpret-statuses.md) — Detailed status definitions
- [How to Configure SLA](./how-to-configure-sla.md) — SLA setup and customization
- [Inbox Logic Spec](./inbox-v1.md) — Technical specification

## Support

For questions or issues:
- **Technical:** Contact admin or DevOps
- **Clinical:** Contact medical director
- **Bugs:** File issue in repository

---

**Last Updated:** 2026-02-07  
**Version:** 1.0  
**Related Epic:** E78.9
