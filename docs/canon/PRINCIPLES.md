# Rhythmologicum Connect: Core Principles

**Type:** Canon  
**Audience:** All developers, maintainers, and contributors  
**Status:** Living Document

---

## 1. Data-Driven Architecture

**Principle:** Configuration belongs in the database, not in code.

- Funnels, steps, questions, and validation rules are stored in the database
- Frontend components render based on data, not hard-coded logic
- Changes to assessment flows do not require code deployments

**Why:** Enables clinicians to manage content and flows without developer intervention.

---

## 2. Security First

**Principle:** Security is non-negotiable and built-in from the start.

- Row Level Security (RLS) on all Supabase tables
- Server-side authentication and authorization checks
- No sensitive data in client-side code or logs
- Regular dependency updates and security audits

**Why:** Patient health data requires the highest level of protection.

---

## 3. Mobile-First Design

**Principle:** Design and develop for mobile devices first, then scale up.

- Touch-optimized components (44px minimum touch targets)
- Responsive layouts using mobile-first breakpoints
- Progressive enhancement for desktop features
- Performance budgets for mobile networks

**Why:** Patients primarily complete assessments on smartphones.

---

## 4. Type Safety

**Principle:** Use TypeScript strictly to catch errors at compile time.

- TypeScript strict mode enabled
- Explicit types over `any`
- Database schema types generated and synchronized
- Runtime validation for external data

**Why:** Reduces bugs and improves developer experience and code quality.

---

## 5. Minimal Changes

**Principle:** Make the smallest possible change to achieve the goal.

- Surgical edits over large refactors
- Preserve working code unless necessary to change
- Test-driven modifications
- Clear commit messages explaining the "why"

**Why:** Reduces risk, simplifies reviews, and maintains stability.

---

## 6. Documentation as Code

**Principle:** Documentation is as important as code and must be maintained.

- Update docs alongside code changes
- Include examples and diagrams
- Use markdown for version control
- Canonical docs (this folder) contain timeless knowledge

**Why:** Enables onboarding, maintenance, and knowledge transfer.

---

## 7. Fail Gracefully

**Principle:** Systems should degrade gracefully, not catastrophically.

- Fallback responses for API failures
- Error boundaries in UI components
- Helpful error messages for users
- Structured logging for debugging

**Why:** Maintains user trust and enables rapid issue resolution.

---

## 8. Accessibility Matters

**Principle:** Build for all users, including those with disabilities.

- Semantic HTML structure
- ARIA labels where needed
- Keyboard navigation support
- Sufficient color contrast ratios

**Why:** Healthcare should be accessible to everyone.

---

## 9. Single Source of Truth

**Principle:** Every piece of data and configuration has one canonical location.

- Database schema in `schema/schema.sql`
- Design tokens in centralized configuration
- Migration-only database changes
- No duplicate state management

**Why:** Prevents inconsistencies and reduces maintenance burden.

---

## 10. Continuous Improvement

**Principle:** Learn from every incident and improve systematically.

- Post-incident reviews documented in memory/incidents/
- TODOs tracked and addressed in planning
- Regular code quality reviews
- Performance monitoring and optimization

**Why:** Quality is an ongoing journey, not a destination.

---

## Related Documentation

- [Review Checklist](REVIEW_CHECKLIST.md) - Code review standards
- [Database Migrations](DB_MIGRATIONS.md) - Migration best practices
- [Contracts](CONTRACTS.md) - API and component contracts
- [Glossary](GLOSSARY.md) - Project terminology
