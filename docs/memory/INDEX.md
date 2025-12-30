# Project Memory Index

**Purpose:** Track learnings, decisions, and incidents across the project lifecycle  
**Audience:** All team members, especially for onboarding and incident review

---

## Overview

This directory contains the institutional memory of the Rhythmologicum Connect project. It serves as a knowledge base for:

- **Learnings:** Key insights from implementation and operation
- **Decisions:** Why we chose certain approaches
- **Incidents:** What went wrong and how we fixed it
- **Patterns:** Successful solutions to recurring problems

---

## Structure

```
memory/
├── INDEX.md                 # This file
├── entries/                 # Knowledge entries
│   ├── 001_funnel_runtime_design.md
│   ├── 002_rls_patterns.md
│   └── ...
└── incidents/              # Post-incident reviews
    ├── 2025-12-15_migration_conflict.md
    ├── 2025-12-20_auth_cookie_issue.md
    └── ...
```

---

## Entries (Learnings & Decisions)

Entries document significant learnings, architectural decisions, and solutions to non-trivial problems.

### Entry Template

```markdown
# Entry XXX: [Title]

**Date:** YYYY-MM-DD  
**Category:** [Architecture | Performance | Security | UX | DevOps]  
**Tags:** [tag1, tag2, tag3]

## Context
Brief background on the situation or problem.

## Decision/Learning
What we decided or learned.

## Rationale
Why this approach was chosen.

## Outcomes
What resulted from this decision.

## Related
- Links to relevant code, docs, or issues
```

### Current Entries

No entries yet. This will be populated as the project evolves.

---

## Incidents (Post-Mortems)

Incidents document things that went wrong, root causes, and preventive measures.

### Incident Template

```markdown
# Incident: [Title]

**Date:** YYYY-MM-DD  
**Severity:** [Low | Medium | High | Critical]  
**Status:** [Investigating | Resolved | Monitoring]

## Summary
Brief description of what happened.

## Timeline
- **HH:MM** - First detection
- **HH:MM** - Investigation started
- **HH:MM** - Root cause identified
- **HH:MM** - Fix deployed
- **HH:MM** - Incident resolved

## Impact
Who/what was affected and to what extent.

## Root Cause
Technical explanation of what caused the issue.

## Resolution
How the issue was fixed.

## Prevention
What we're doing to prevent recurrence.

## Action Items
- [ ] Task 1 (Owner: @username)
- [ ] Task 2 (Owner: @username)

## Related
- Links to PRs, issues, or discussions
```

### Current Incidents

No incidents documented yet. This will be populated as incidents occur and are resolved.

---

## Guidelines

### When to Create an Entry

Create a memory entry when:
- You solve a non-obvious problem
- You make a significant architectural decision
- You discover a useful pattern worth sharing
- You learn something that would benefit future team members

### When to Document an Incident

Document an incident when:
- Production is affected
- Users experience degraded service
- Data integrity is at risk
- A significant bug is discovered
- A security issue is found

### Best Practices

1. **Be specific:** Include concrete details, not vague descriptions
2. **Be actionable:** Focus on what can be learned and applied
3. **Be honest:** Don't hide mistakes; they're valuable learning opportunities
4. **Link liberally:** Connect to related code, PRs, and documentation
5. **Update as needed:** Memory is living documentation

---

## Search & Discovery

### By Category

- **Architecture:** System design decisions
- **Performance:** Speed and optimization learnings
- **Security:** Security improvements and fixes
- **UX:** User experience insights
- **DevOps:** Deployment and operations

### By Tag

Common tags:
- `funnel-runtime`
- `authentication`
- `database`
- `rls`
- `migration`
- `api`
- `performance`
- `security`
- `mobile`
- `content-system`

### Full-Text Search

```bash
# Search all memory files
grep -r "search term" docs/memory/

# Search entries only
grep -r "search term" docs/memory/entries/

# Search incidents only
grep -r "search term" docs/memory/incidents/
```

---

## Contribution

Anyone can contribute to project memory:

1. Copy the appropriate template (entry or incident)
2. Fill in all sections thoroughly
3. Name file with appropriate prefix (number for entries, date for incidents)
4. Submit PR with memory update
5. Tag relevant team members for review

---

## Integration with Development

Memory informs:
- **Onboarding:** New team members read entries to understand context
- **Planning:** Past learnings guide future decisions
- **Reviews:** Incidents inform risk assessment
- **Documentation:** Canon docs reference key entries

---

## Archival Policy

- **Entries:** Never delete; update with "Superseded by" note if outdated
- **Incidents:** Keep all incidents; they're historical record
- **Cleanup:** Annually review and add "Historical" tag to old entries

---

## Related Documentation

- [Principles](../canon/PRINCIPLES.md) - Core development principles
- [Review Checklist](../canon/REVIEW_CHECKLIST.md) - Code review standards
- [Releases](../releases/CURRENT.md) - Version-specific information

---

## Meta

This index was created as part of issue I501 (E50) - Documentation reorganization. The memory system will grow organically as the project evolves.

**Last Updated:** 2025-12-30
