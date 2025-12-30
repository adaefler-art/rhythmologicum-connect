# Code Review Checklist

**Type:** Canon  
**Purpose:** Ensure consistent, high-quality code reviews  
**Audience:** All reviewers and contributors

---

## Pre-Review: Author Checklist

Before requesting review, verify:

- [ ] Code builds without errors
- [ ] All existing tests pass
- [ ] New functionality has appropriate tests (if testing infrastructure exists)
- [ ] Code follows existing style and conventions
- [ ] Documentation updated (if applicable)
- [ ] Security vulnerabilities addressed
- [ ] No console.log or debugging code left in
- [ ] Commit messages are clear and descriptive

---

## 1. Functional Correctness

- [ ] **Does it work?** Feature meets requirements as specified
- [ ] **Edge cases handled?** Null values, empty arrays, invalid inputs
- [ ] **Error handling?** Graceful degradation and helpful messages
- [ ] **Data validation?** User inputs validated on server side

---

## 2. Security

- [ ] **Authentication checked?** Protected routes verify user auth
- [ ] **Authorization enforced?** Role checks for privileged operations
- [ ] **SQL injection safe?** Using parameterized queries (Supabase client)
- [ ] **XSS prevention?** User input sanitized before rendering
- [ ] **RLS policies?** Database changes include appropriate RLS
- [ ] **Secrets protected?** No API keys or passwords in code

---

## 3. Architecture & Design

- [ ] **Follows principles?** Aligns with docs/canon/PRINCIPLES.md
- [ ] **Data-driven?** Configuration in database, not hard-coded
- [ ] **Single source of truth?** No duplicate state or data
- [ ] **Minimal changes?** Smallest possible modification to achieve goal
- [ ] **Separation of concerns?** Clear boundaries between components

---

## 4. Code Quality

- [ ] **TypeScript strict?** No `any` types without justification
- [ ] **Readable?** Clear variable/function names, logical structure
- [ ] **DRY principle?** No unnecessary code duplication
- [ ] **Comments appropriate?** Explains "why" not "what"
- [ ] **Consistent style?** Matches Prettier config and existing patterns

---

## 5. Performance

- [ ] **Database queries optimized?** No N+1 queries, appropriate indexes
- [ ] **Bundle size?** No unnecessarily large dependencies
- [ ] **Lazy loading?** Heavy components loaded when needed
- [ ] **Caching considered?** Appropriate use of React Query, SWR, etc.
- [ ] **Mobile performance?** Works well on slower connections

---

## 6. Testing & Verification

- [ ] **Tests exist?** New features have corresponding tests
- [ ] **Tests pass?** All tests green in CI/CD
- [ ] **Manual testing?** Author verified changes work as expected
- [ ] **Regression tested?** Existing features still work
- [ ] **Accessibility tested?** Keyboard navigation, screen reader compatible

---

## 7. Documentation

- [ ] **Code documented?** Complex logic has explanatory comments
- [ ] **API documented?** New endpoints described in relevant docs
- [ ] **README updated?** If feature affects setup or usage
- [ ] **Migration guide?** If breaking changes introduced
- [ ] **Changelog updated?** Significant changes noted

---

## 8. Database Changes

- [ ] **Migration file?** Changes in timestamped migration
- [ ] **Idempotent?** Can run migration multiple times safely
- [ ] **Schema updated?** `schema/schema.sql` reflects changes
- [ ] **RLS policies?** Appropriate policies for new tables/columns
- [ ] **Backward compatible?** Existing data handled gracefully

---

## 9. UI/UX (if applicable)

- [ ] **Mobile-first?** Works well on small screens
- [ ] **Responsive?** Adapts to different viewport sizes
- [ ] **Touch-friendly?** Minimum 44px touch targets
- [ ] **Loading states?** Clear feedback during async operations
- [ ] **Error states?** Helpful messages when things go wrong
- [ ] **Consistent design?** Uses design tokens and standard components

---

## 10. Deployment Readiness

- [ ] **Environment variables?** New vars documented in .env.example
- [ ] **Feature flags?** Progressive rollout for risky changes
- [ ] **Rollback plan?** Can revert if issues discovered
- [ ] **Monitoring?** Appropriate logging for production debugging
- [ ] **Breaking changes?** Clearly communicated and coordinated

---

## Review Feedback Guidelines

### For Reviewers

- Be constructive and specific
- Explain the "why" behind suggestions
- Distinguish between blockers and nice-to-haves
- Approve when ready, even if minor improvements possible
- Use GitHub's review features (approve, request changes, comment)

### For Authors

- Respond to all comments
- Ask for clarification when needed
- Don't take feedback personally
- Fix blockers before merge
- Update PR description if scope changes

---

## Severity Levels

| Level | Description | Action |
|-------|-------------|--------|
| 🔴 **Blocker** | Must fix before merge | Request changes |
| 🟡 **Major** | Should fix before merge | Request changes or comment |
| 🟢 **Minor** | Nice to have, can fix later | Comment only |
| 💡 **Suggestion** | Optional improvement | Comment only |

---

## Related Documentation

- [Principles](PRINCIPLES.md) - Core development principles
- [Contracts](CONTRACTS.md) - API and component contracts
- [Database Migrations](DB_MIGRATIONS.md) - Migration guidelines
