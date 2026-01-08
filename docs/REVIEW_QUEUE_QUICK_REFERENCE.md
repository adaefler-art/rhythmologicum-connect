# Review Queue - Quick Reference Guide

**For:** Clinicians & QA Team  
**Version:** 1.0.0  
**Last Updated:** 2026-01-08

---

## 🚨 Priority Quick Reference

| Priority | Examples | Target Time | What to Do |
|----------|----------|-------------|------------|
| **P0** 🔴 | SAFETY_BLOCK, VALIDATION_FAIL | **2 hours** | Drop everything, review immediately |
| **P1** 🟠 | SAFETY_FLAG, SAFETY_UNKNOWN | **8 hours** | Review today, high priority |
| **P2** 🟡 | VALIDATION_FLAG, MANUAL | **24 hours** | Review within 1 business day |
| **P3** 🟢 | SAMPLED (QA) | **72 hours** | Review when time permits |

---

## ⚡ Quick Decision Guide

### ✅ When to APPROVE

- ✅ Flag is false positive (system wrong)
- ✅ Content is safe despite warning
- ✅ Risk is acceptable with context
- ✅ Quality sample meets standards

**Most Common Reasons:**
- `APPROVED_SAFE` - Content safe to proceed
- `APPROVED_FALSE_POSITIVE` - Flag incorrect
- `APPROVED_ACCEPTABLE_RISK` - Risk acceptable

### ❌ When to REJECT

- ❌ Real safety concern exists
- ❌ Genuine contraindication
- ❌ Cannot resolve plausibility issue
- ❌ Quality below standards

**Most Common Reasons:**
- `REJECTED_UNSAFE` - Safety concern
- `REJECTED_CONTRAINDICATION` - Medical contraindication
- `REJECTED_QUALITY` - Quality issue

### 🔄 When to REQUEST CHANGES

- 🔄 Minor adjustments needed
- 🔄 Tone needs improvement
- 🔄 Content needs revision

**Most Common Reasons:**
- `CHANGES_NEEDED_CLARIFICATION` - Needs clarity
- `CHANGES_NEEDED_TONE` - Tone adjustment
- `CHANGES_NEEDED_CONTENT` - Content revision

---

## 📋 Daily Checklist

### Start of Shift ☀️
- [ ] Open queue: `/clinician/review-queue`
- [ ] Check for **overdue** items (red)
- [ ] Identify **P0/P1** items (orange/red)
- [ ] Note total pending count

### Every 4 Hours 🔄
- [ ] Refresh queue
- [ ] Check for new **P0** items
- [ ] Process at least 5-10 items
- [ ] Monitor SLA indicators

### End of Shift 🌙
- [ ] Update queue status
- [ ] Handoff **P0/P1** to next shift
- [ ] Log any blockers

---

## 🔍 Review Panel Quick Guide

### What You'll See

1. **Review Metadata**
   - Why it's in queue (reasons)
   - Sampling status
   - Review iteration

2. **Layer 1: Medical Validation**
   - Status: Pass/Flag/Fail
   - Rules evaluated
   - Flags: Critical/Warning/Info

3. **Layer 2: Safety Check**
   - Action: PASS/FLAG/BLOCK/UNKNOWN
   - Safety Score: 0-100
   - Findings: Critical/High/Medium/Low

4. **Decision History** (if previously reviewed)

### How to Review

1. **Read** validation + safety results
2. **Access** full assessment (if needed)
3. **Decide** approve/reject/changes
4. **Select** reason code from dropdown
5. **Add** notes (optional, max 500 chars)
6. **Submit** decision

---

## 🎯 Common Scenarios

### Scenario: SAFETY_BLOCK 🔴

**What:** AI flagged content as potentially harmful  
**Priority:** P0 (2 hour SLA)  
**Action:**
1. Review content carefully
2. Check for genuinely harmful advice
3. If safe → APPROVE (reason: `APPROVED_FALSE_POSITIVE`)
4. If unsafe → REJECT (reason: `REJECTED_UNSAFE`)
5. Document reasoning

### Scenario: VALIDATION_FAIL 🔴

**What:** Critical contraindication or implausibility  
**Priority:** P0 (2 hour SLA)  
**Action:**
1. Check specific validation flags
2. Review patient data context
3. If flag incorrect → APPROVE (reason: `APPROVED_FALSE_POSITIVE`)
4. If flag correct → REJECT (reason: `REJECTED_CONTRAINDICATION` or `REJECTED_PLAUSIBILITY`)

### Scenario: SAMPLED (QA) 🟢

**What:** Random quality assurance sample  
**Priority:** P3 (72 hour SLA)  
**Action:**
1. Review as if normal patient report
2. Check for quality, tone, accuracy
3. If good → APPROVE (reason: `APPROVED_SAMPLED_OK`)
4. If issues → REJECT or CHANGES_REQUESTED

### Scenario: SAFETY_UNKNOWN 🟠

**What:** AI safety check failed  
**Priority:** P1 (8 hour SLA)  
**Action:**
1. **Manual review required** (no AI assistance)
2. Read report as if you're the patient
3. Check for safety, clarity, appropriateness
4. If safe → APPROVE (reason: `APPROVED_SAFE`)
5. Add note: "Manual review - safety check unavailable"

---

## 🚩 When to Escalate

### Escalate Immediately if:
- ❗ System error prevents reviews
- ❗ P0 item >4 hours old
- ❗ Queue backlog >50 items
- ❗ Suspected safety system bug

### How to Escalate:
1. **Technical issues** → DevOps Team (Slack/Email)
2. **Process issues** → QA Lead
3. **Safety concerns** → Clinical Director

---

## 💡 Pro Tips

### Efficiency
- ✨ Use keyboard shortcuts (if available)
- ✨ Start with P0/P1 items (highest impact)
- ✨ Batch similar items when possible
- ✨ Keep notes concise but clear

### Quality
- 🎯 Always document reasoning
- 🎯 When in doubt, err on side of safety
- 🎯 Consistency matters (similar cases → similar decisions)
- 🎯 Learn from peer decisions

### Compliance
- 📊 Log any technical issues immediately
- 📊 Don't let P0 items age >2 hours
- 📊 Keep SLA compliance >90%
- 📊 Document edge cases for SOP updates

---

## 📊 SLA Targets (Remember These!)

| Priority | Target | Max | Compliance Goal |
|----------|--------|-----|-----------------|
| P0 | 2h | 4h | ≥95% |
| P1 | 8h | 24h | ≥90% |
| P2 | 24h | 48h | ≥85% |
| P3 | 72h | 7d | ≥80% |

---

## 🔗 Quick Links

- **Queue Dashboard:** `/clinician/review-queue` (TBD)
- **Full SOP:** `docs/CONTENT_SAFETY_OPS_SOP.md`
- **Technical Docs:** `lib/review/README.md`
- **Queue API:** `GET /api/review/queue`

---

## 📞 Emergency Contacts

| Issue | Contact | Response |
|-------|---------|----------|
| System Down | DevOps | 1 hour |
| P0 Overdue | QA Lead | 30 min |
| Safety Concern | Clinical Director | Immediate |

---

**Questions?** Check full SOP or contact QA Lead

**END OF QUICK REFERENCE**
