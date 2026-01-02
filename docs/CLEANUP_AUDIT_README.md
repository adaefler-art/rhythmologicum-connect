# TV05-CLEANUP & AUDIT — Repository Cleanup Audit

## Overview

This directory contains the comprehensive cleanup audit for Rhythmologicum Connect v0.5.x, including automated scripts and detailed reports identifying unused code, mapping GitHub issues to implementation artifacts, and providing a prioritized cleanup backlog.

## Generated Reports

### 1. V05_CLEANUP_AUDIT_UNUSED.md

**Purpose:** Identifies implemented but potentially unused or unintegrated code artifacts.

**Contents:**
- Unused API routes (4 identified)
- Unreachable page routes (all verified as reachable)
- Unused server actions (all verified as in use)
- Recommendations with risk levels

**Key Findings:**
- ⚠️ AMY endpoints (`/api/amy/*`) - 0 usage references
- ⚠️ Consent APIs (`/api/consent/*`) - may be superseded by server actions
- ⚠️ Content resolvers - possible duplication
- ✅ All pages properly integrated (false positives clarified)

### 2. V05_CLEANUP_AUDIT_ISSUE_MAP.md

**Purpose:** Maps V05 canonical issue IDs to their implementation in the repository.

**Contents:**
- 8 V05 issues tracked and mapped
- 100% implementation rate
- File-level mapping (migrations, docs, code)
- Epic organization and quality metrics

**Key Findings:**
- ✅ All V05 issues fully implemented
- ✅ 7/8 issues include database migrations
- ✅ 8/8 issues have comprehensive documentation
- ✅ Production-ready quality across all issues

### 3. V05_CLEANUP_BACKLOG.md

**Purpose:** Provides prioritized cleanup tasks derived from audit findings.

**Contents:**
- 10 cleanup items with detailed specifications
- Priority levels (High: 3, Medium: 4, Low: 3)
- Acceptance criteria and verification steps
- Estimated effort (~18 hours total)

**Top Priorities:**
1. Verify AMY integration status (4h, HIGH)
2. Consolidate consent flow implementation (2h, HIGH)
3. Review content resolver consolidation (2h, HIGH)

## Audit Scripts

### scripts/cleanup-audit.sh (Bash)

**Purpose:** Automated data collection for audit analysis.

**Usage:**
```bash
cd /path/to/rhythmologicum-connect
bash scripts/cleanup-audit.sh
```

**Output:**
- Terminal output with statistics
- Data files in `docs/cleanup_audit_*.txt`

**What it analyzes:**
- API routes and their usage counts
- Page routes and navigation references
- Server actions and their callers
- V05 issue IDs and their file locations

### scripts/cleanup-audit.ps1 (PowerShell)

**Purpose:** Same as bash script but for PowerShell environments.

**Usage:**
```powershell
cd C:\path\to\rhythmologicum-connect
pwsh -File scripts/cleanup-audit.ps1
```

**Note:** May have platform-specific issues on Linux/macOS. Use bash script instead if encountering errors.

## How to Use This Audit

### For Project Managers

1. **Read V05_CLEANUP_AUDIT_ISSUE_MAP.md first**
   - Understand what has been implemented
   - Verify all V05 issues are complete
   - Celebrate 100% implementation rate!

2. **Review V05_CLEANUP_BACKLOG.md**
   - Understand cleanup priorities
   - Plan sprint capacity for cleanup tasks
   - Create GitHub issues from backlog items

3. **Monitor Progress**
   - Track completion of backlog items
   - Re-run audit after significant changes
   - Update reports as needed

### For Developers

1. **Read V05_CLEANUP_AUDIT_UNUSED.md first**
   - Understand what code may be unused
   - Review recommendations for your area
   - Investigate flagged items before removing

2. **Pick a Backlog Item**
   - Start with high-priority items
   - Follow acceptance criteria
   - Complete verification steps

3. **Create Pull Requests**
   - One backlog item per PR
   - Reference backlog item number (e.g., TV05-CLEANUP-1)
   - Include verification evidence in PR description

### For Architects

1. **Review All Three Reports**
   - Understand architectural patterns
   - Identify duplicate implementations
   - Make architectural decisions (AMY, consent flow, etc.)

2. **Update Architecture Docs**
   - Document canonical patterns
   - Explain design decisions
   - Update diagrams if needed

3. **Guide Team**
   - Review cleanup PRs
   - Ensure consistency
   - Update audit reports after major changes

## Methodology

### Static Code Analysis

The audit uses static code search (`grep`) to find references:

```bash
# Example: Search for API route usage
grep -r "/api/amy/stress-report" \
  app/ lib/ \
  --include="*.ts" --include="*.tsx" \
  --exclude-dir=__tests__ --exclude="*.test.*"
```

### Limitations

**False Positives:**
- Dynamic string construction may not be detected
- Template literals (`` `api/${endpoint}` ``) miss exact matches
- External clients (mobile apps, etc.) won't show usage

**False Negatives:**
- Commented code counted as "unused"
- Build-time usage may not be detected
- Programmatic route construction may be missed

### Verification

All flagged items were manually reviewed to reduce false positives:
- Dynamic routes verified via code inspection
- Programmatic navigation confirmed
- Git history reviewed for recent usage

## Re-Running the Audit

### When to Re-Run

- After completing cleanup backlog items
- Before major releases
- After significant refactoring
- Quarterly for ongoing maintenance

### How to Re-Run

1. **Run Scripts:**
   ```bash
   bash scripts/cleanup-audit.sh
   ```

2. **Review Output:**
   - Check terminal statistics
   - Compare to previous run
   - Note new flagged items

3. **Update Reports:**
   - Update UNUSED report with new findings
   - Update ISSUE_MAP if new issues added
   - Update BACKLOG with new tasks

4. **Commit Changes:**
   ```bash
   git add docs/V05_CLEANUP_*.md
   git commit -m "Update cleanup audit reports"
   ```

## Cleanup Execution Strategy

### Week 1: High Priority (Architecture Decisions)

**Goal:** Make critical architectural decisions

**Tasks:**
- [ ] TV05-CLEANUP-1: Verify AMY integration status
- [ ] TV05-CLEANUP-2: Consolidate consent flow
- [ ] TV05-CLEANUP-3: Review content resolvers

**Success Criteria:**
- All architectural questions answered
- Decisions documented
- No duplicate implementations

### Week 2: Medium Priority (Integration)

**Goal:** Integrate features, consolidate APIs

**Tasks:**
- [ ] TV05-CLEANUP-4: Add export button
- [ ] TV05-CLEANUP-5: Document navigation patterns
- [ ] TV05-CLEANUP-6: Consolidate funnel result APIs

**Success Criteria:**
- Features fully integrated in UI
- APIs consolidated
- Documentation complete

### Week 3: Low Priority (Polish)

**Goal:** Complete documentation and minor enhancements

**Tasks:**
- [ ] TV05-CLEANUP-7: Update design system docs
- [ ] TV05-CLEANUP-8: Add funnel nav link
- [ ] TV05-CLEANUP-9: Verify validation integration
- [ ] TV05-CLEANUP-10: Clean up test data seeding

**Success Criteria:**
- All documentation updated
- UI enhancements complete
- Test data organized

## Success Metrics

### Cleanup Completion

- [ ] All high-priority items completed (3/3)
- [ ] All medium-priority items completed (4/4)
- [ ] All low-priority items completed (3/3)
- [ ] No breaking changes introduced
- [ ] All tests passing
- [ ] Documentation updated

### Code Quality

- [ ] Reduced API endpoint count (remove unused)
- [ ] Single implementation per feature (no duplicates)
- [ ] Comprehensive documentation
- [ ] Clear architectural patterns

### Team Satisfaction

- [ ] Developers understand navigation patterns
- [ ] Architects confident in architecture decisions
- [ ] Project managers have clear roadmap

## Related Documentation

- [CHANGES.md](../CHANGES.md) - Change log with V0.4 and V0.5 history
- [IMPLEMENTATION_SUMMARY.md](../IMPLEMENTATION_SUMMARY.md) - V0.4 implementation details
- [PR_SUMMARY_V05.md](../PR_SUMMARY_V05.md) - V05 PR summary
- [docs/canon/CONTRACTS.md](canon/CONTRACTS.md) - Architectural contracts
- [docs/V05_I03_1_IMPLEMENTATION.md](V05_I03_1_IMPLEMENTATION.md) - Onboarding implementation

## FAQ

### Q: Are the flagged "unused" items actually unused?

**A:** Not necessarily. The audit uses static code search which has limitations:
- Dynamic routes are accessed programmatically (clicks, etc.)
- Template literals may hide references
- External clients won't show in codebase

Always manually verify before removing code. Check the "Evidence & Analysis" sections in the UNUSED report.

### Q: Should I remove all unused code immediately?

**A:** No. Follow this process:
1. Verify it's truly unused (manual testing)
2. Check git history for recent usage
3. Ask team if anyone is using it
4. Create issue for removal with deprecation period
5. Remove only after consensus

### Q: How accurate is the issue mapping?

**A:** Very accurate. V05 issues were manually reviewed and verified:
- Migration files checked
- Documentation reviewed
- Code changes confirmed
- Test coverage validated

### Q: What if I find a bug in the audit?

**A:** Please update the reports:
1. Fix the finding in the relevant report
2. Document the correction
3. Commit the update
4. Consider updating scripts if systemic issue

### Q: How often should we run the audit?

**A:** Recommended schedule:
- **After major features:** Re-run audit
- **Quarterly:** Regular maintenance check
- **Before releases:** Ensure clean state
- **After refactoring:** Verify no orphaned code

## Contributing

### Updating Reports

If you find inaccuracies or want to add findings:

1. Edit the relevant markdown file in `docs/`
2. Add your findings with evidence
3. Update statistics if needed
4. Commit with descriptive message

### Improving Scripts

Script improvements welcome:

1. Add better detection patterns
2. Reduce false positives
3. Improve performance
4. Add new analysis types

## License

Same as main repository (Rhythmologicum Connect).

## Contact

For questions about this audit:
- Create GitHub issue with `cleanup-audit` label
- Tag issue with relevant backlog item (TV05-CLEANUP-*)
- Reference specific report section

---

**Last Updated:** 2026-01-02  
**Audit Version:** 1.0.0  
**Next Review:** After Week 3 cleanup completion
