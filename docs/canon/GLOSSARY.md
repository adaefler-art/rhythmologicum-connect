# Project Glossary

**Type:** Canon  
**Purpose:** Consistent terminology across the project  
**Audience:** All team members

---

## Core Concepts

### Assessment
A complete session where a patient answers questions in a funnel. Has a lifecycle: `in_progress`, `completed`, `abandoned`.

### Funnel
A structured flow of steps (questions and content) that guides a patient through an assessment. Examples: Stress Assessment, Sleep Assessment.

### Step
A single unit within a funnel. Can be a `QUESTION` step or a `CONTENT_PAGE` step.

### Question
An individual question presented to the patient, with a specific answer type (scale, choice, text, etc.).

### Answer
A patient's response to a question. Stored in `assessment_answers` table.

### Report
AI-generated analysis of a completed assessment, including risk scores and recommendations.

---

## User Roles

### Patient
Default role for all users. Can:
- Complete assessments
- View own history
- Access own reports

### Clinician
Healthcare provider role. Can:
- View all patient assessments
- Manage funnels and content
- Access all reports
- Administer the platform

### Admin
(Future role) Super-user with system-wide permissions.

---

## Funnel Architecture

### Funnel Runtime
Server-side system that manages assessment lifecycle, validation, and navigation.

### Step Navigation
Logic that determines which step comes next based on current step, answers, and rules.

### Validation
Process of checking if required questions are answered and answers meet constraints.

### Session Recovery
Automatic restoration of in-progress assessment when user returns.

---

## Content System

### Content Page
Editorial content shown within a funnel. Types:
- **Intro** (`intro-*`): Shown before/during assessment
- **Info** (`info-*`): Additional context available throughout
- **Result** (`result-*`): Next steps shown after completion

### Slug
URL-friendly identifier for content pages (e.g., `intro-stress-welcome`).

### Status Workflow
Content lifecycle: `draft` → `published` → `archived`.

### Category
Content grouping (e.g., `intro`, `info`, `result`) for organization and filtering.

---

## Database

### RLS (Row Level Security)
PostgreSQL feature enforcing data access rules at the database level.

### Migration
Timestamped SQL file in `supabase/migrations/` that modifies database schema.

### Canonical Schema
The file `schema/schema.sql` - single source of truth for database structure.

### Idempotent
Safe to run multiple times without side effects (e.g., `CREATE TABLE IF NOT EXISTS`).

---

## Design System

### Design Token
Named variable for design decisions (colors, spacing, typography). Centralized in config.

### Component
Reusable UI building block (e.g., Button, Card, QuestionRenderer).

### Layout
Page structure template (e.g., PatientLayout, ClinicianLayout).

### Theme
Visual style mode (light, dark) with corresponding color schemes.

---

## API & Contracts

### Endpoint
HTTP API route (e.g., `/api/funnels/{slug}/assessments`).

### Response Format
Standard JSON structure:
```typescript
{
  success: boolean
  data?: T
  error?: { code: string; message: string }
}
```

### Server Action
Next.js server-side function callable from client components.

### Middleware
Code that runs before route handlers (e.g., authentication checks).

---

## Assessment Lifecycle

### States
- **`in_progress`**: User actively completing
- **`completed`**: All required questions answered
- **`abandoned`**: User left without completing (inactive for X days)

### Current Step
The step the user is currently on in their assessment.

### Next Step
The step to navigate to when user clicks "Next" or "Continue".

### Completion
Finalizing an assessment, triggering report generation.

---

## Development

### Epic
Large feature area (e.g., Epic B: Funnel Runtime).

### Issue
Specific task or bug tracked in GitHub Issues.

### PR (Pull Request)
Proposed code changes for review and merge.

### Canon
Timeless documentation in `docs/canon/`.

### Release
Version-specific artifacts in `docs/releases/`.

### Memory
Project learnings stored in `docs/memory/`.

---

## Technical Terms

### SSR (Server-Side Rendering)
Generating HTML on the server before sending to client.

### SSG (Static Site Generation)
Pre-generating HTML at build time.

### RSC (React Server Components)
React components that run only on the server.

### Hydration
Process of making server-rendered HTML interactive in the browser.

### Cookie-Based Auth
Authentication using HTTP-only cookies (more secure than localStorage).

---

## Metrics & Analytics

### Session
User's visit to the application from entry to exit.

### Funnel Completion Rate
Percentage of started assessments that are completed.

### Drop-off Point
Step where users most commonly abandon assessments.

### Risk Score
Calculated value indicating patient's stress/health risk level.

---

## Quality Assurance

### Smoke Test
Quick test of critical paths to verify basic functionality.

### Regression Test
Testing existing features to ensure they still work after changes.

### Manual Test
Human tester following test plan, not automated.

### Acceptance Criteria
Conditions that must be met for a feature to be considered complete.

---

## Deployment

### Environment
Deployment target: `local`, `staging`, `production`.

### Migration Run
Applying pending database migrations to an environment.

### Feature Flag
Toggle to enable/disable features without code deployment.

### Rollback
Reverting to previous version if issues discovered.

---

## Security

### Authentication
Verifying who the user is (login).

### Authorization
Verifying what the user can do (permissions).

### CSRF (Cross-Site Request Forgery)
Attack where malicious site submits requests as authenticated user.

### XSS (Cross-Site Scripting)
Attack injecting malicious scripts into web pages.

### SQL Injection
Attack inserting SQL commands through user input.

---

## Common Abbreviations

| Term | Meaning |
|------|---------|
| **AI** | Artificial Intelligence (Claude API for reports) |
| **API** | Application Programming Interface |
| **ARIA** | Accessible Rich Internet Applications |
| **CMS** | Content Management System |
| **DB** | Database |
| **DX** | Developer Experience |
| **FK** | Foreign Key |
| **JSON** | JavaScript Object Notation |
| **JWT** | JSON Web Token |
| **PK** | Primary Key |
| **RLS** | Row Level Security |
| **SPA** | Single Page Application |
| **SQL** | Structured Query Language |
| **TS** | TypeScript |
| **UI** | User Interface |
| **UX** | User Experience |
| **UUID** | Universally Unique Identifier |

---

## Related Documentation

- [Principles](PRINCIPLES.md) - Core development principles
- [Contracts](CONTRACTS.md) - API and interface specifications
- [Review Checklist](REVIEW_CHECKLIST.md) - Code review standards
