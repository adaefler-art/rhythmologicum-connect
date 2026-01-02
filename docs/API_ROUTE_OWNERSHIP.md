# API Route Ownership Registry

## Overview

This document provides a comprehensive mapping of all API routes in Rhythmologicum Connect, documenting ownership, external access status, and maintenance notes.

**Purpose:**

- Establish clear ownership for each API endpoint
- Document which endpoints are safe for external access
- Provide context for cleanup and deprecation decisions

**Maintenance:** When adding a new API route, add an entry to this document.

---

## Route Registry Format

Each route entry follows this format:

```
### [METHOD] /api/route/path

**Owner:** [Team/Person responsible]
**External Allowed:** Yes/No
**Authentication Required:** Yes/No
**Authorization:** [Role requirements]
**Status:** Active/Deprecated/Experimental
**Used By:** [List of clients/features]
**Notes:** [Additional context]
```

---

## Admin Routes

### GET /api/admin/usage

**Owner:** DevOps / Monitoring Team  
**External Allowed:** Yes (administrative scripts)  
**Authentication Required:** Yes  
**Authorization:** Admin or Clinician role  
**Status:** Active  
**Used By:**

- Administrative monitoring scripts
- Clinician dashboard (future)
- Usage telemetry analysis tools

**Notes:**

- Returns aggregated usage metrics (PHI-free)
- Critical for operational monitoring
- Must remain accessible for cleanup audit decisions

---

### GET /api/admin/funnels

**Owner:** Clinical Team  
**External Allowed:** No  
**Authentication Required:** Yes  
**Authorization:** Admin or Clinician role  
**Status:** Active  
**Used By:**

- Clinician dashboard funnel management UI
- Internal admin tools

**Notes:**

- Lists all assessment funnels with metadata
- Web app only

---

### PUT /api/admin/funnels/[id]

**Owner:** Clinical Team  
**External Allowed:** No  
**Authentication Required:** Yes  
**Authorization:** Admin or Clinician role  
**Status:** Active  
**Used By:**

- Clinician dashboard funnel editor
- Funnel configuration tools

**Notes:**

- Update funnel metadata (name, active status, etc.)
- Web app only

---

### GET /api/admin/funnel-steps

**Owner:** Clinical Team  
**External Allowed:** No  
**Authentication Required:** Yes  
**Authorization:** Admin or Clinician role  
**Status:** Active  
**Used By:**

- Clinician dashboard step management
- Funnel configuration tools

**Notes:**

- Lists funnel steps with ordering
- Web app only

---

### PUT /api/admin/funnel-steps/[id]

**Owner:** Clinical Team  
**External Allowed:** No  
**Authentication Required:** Yes  
**Authorization:** Admin or Clinician role  
**Status:** Active  
**Used By:**

- Clinician dashboard step editor
- Step reordering functionality

**Notes:**

- Update step order and configuration
- Web app only

---

### PUT /api/admin/funnel-step-questions/[id]

**Owner:** Clinical Team  
**External Allowed:** No  
**Authentication Required:** Yes  
**Authorization:** Admin or Clinician role  
**Status:** Active  
**Used By:**

- Clinician dashboard question editor
- Question requirement toggle

**Notes:**

- Update question metadata (is_required, etc.)
- Web app only

---

### GET /api/admin/content-pages

**Owner:** Content Management Team  
**External Allowed:** No  
**Authentication Required:** Yes  
**Authorization:** Admin or Clinician role  
**Status:** Active  
**Used By:**

- Content management UI
- Clinician dashboard

**Notes:**

- Lists all content pages
- Web app only

---

### PUT /api/admin/content-pages/[id]

**Owner:** Content Management Team  
**External Allowed:** No  
**Authentication Required:** Yes  
**Authorization:** Admin or Clinician role  
**Status:** Active  
**Used By:**

- Content page editor
- Clinician dashboard

**Notes:**

- Update content page metadata
- Web app only

---

### POST /api/admin/content-pages/[id]/sections

**Owner:** Content Management Team  
**External Allowed:** No  
**Authentication Required:** Yes  
**Authorization:** Admin or Clinician role  
**Status:** Active  
**Used By:**

- Content section editor
- Clinician dashboard

**Notes:**

- Add new content sections
- Web app only

---

### PUT /api/admin/content-pages/[id]/sections/[sectionId]

**Owner:** Content Management Team  
**External Allowed:** No  
**Authentication Required:** Yes  
**Authorization:** Admin or Clinician role  
**Status:** Active  
**Used By:**

- Content section editor
- Clinician dashboard

**Notes:**

- Update content sections
- Web app only

---

### GET /api/admin/diagnostics/pillars-sot

**Owner:** DevOps Team  
**External Allowed:** Yes (monitoring scripts)  
**Authentication Required:** Yes  
**Authorization:** Admin or Clinician role  
**Status:** Active  
**Used By:**

- System health monitoring scripts
- Admin dashboard
- Automated alerts

**Notes:**

- Critical for database schema validation
- Used by CI/CD pipelines
- Must remain accessible

---

## Assessment & Funnel Routes

### GET /api/funnels/active

**Owner:** Product Team  
**External Allowed:** Yes  
**Authentication Required:** Yes  
**Authorization:** Any authenticated user  
**Status:** Active  
**Used By:**

- Web app patient flow
- Mobile app funnel selector
- External integrations (future)

**Notes:**

- Returns list of active assessment funnels
- Critical for mobile app
- High-priority endpoint (DO NOT REMOVE)

---

### GET /api/funnels/catalog

**Owner:** Product Team  
**External Allowed:** No  
**Authentication Required:** Yes  
**Authorization:** Any authenticated user  
**Status:** Active  
**Used By:**

- Web app catalog pages
- Patient flow UI

**Notes:**

- Full funnel catalog with metadata
- Web app only

---

### GET /api/funnels/catalog/[slug]

**Owner:** Product Team  
**External Allowed:** No  
**Authentication Required:** Yes  
**Authorization:** Any authenticated user  
**Status:** Active  
**Used By:**

- Web app funnel detail pages
- Patient flow UI

**Notes:**

- Single funnel details
- Web app only

---

### POST /api/funnels/[slug]/assessments

**Owner:** Product Team  
**External Allowed:** Yes  
**Authentication Required:** Yes  
**Authorization:** Any authenticated user  
**Status:** Active  
**Used By:**

- Web app assessment flow
- Mobile app assessment start
- Funnel Runtime system

**Notes:**

- Starts a new assessment session
- Part of Funnel Runtime (Epic B)
- Critical for mobile app

---

### GET /api/funnels/[slug]/assessments/[assessmentId]

**Owner:** Product Team  
**External Allowed:** Yes  
**Authentication Required:** Yes  
**Authorization:** Assessment owner only  
**Status:** Active  
**Used By:**

- Web app assessment flow
- Mobile app assessment resume
- Funnel Runtime system

**Notes:**

- Get current assessment state and progress
- Part of Funnel Runtime (Epic B)
- Critical for mobile app

---

### POST /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]

**Owner:** Product Team  
**External Allowed:** Yes  
**Authentication Required:** Yes  
**Authorization:** Assessment owner only  
**Status:** Active  
**Used By:**

- Web app step navigation
- Mobile app step validation
- Funnel Runtime system

**Notes:**

- Validate step before proceeding
- Step-skipping prevention
- Critical for mobile app

---

### POST /api/funnels/[slug]/assessments/[assessmentId]/complete

**Owner:** Product Team  
**External Allowed:** Yes  
**Authentication Required:** Yes  
**Authorization:** Assessment owner only  
**Status:** Active  
**Used By:**

- Web app assessment completion
- Mobile app assessment completion
- Funnel Runtime system

**Notes:**

- Finalizes assessment (makes read-only)
- Part of Funnel Runtime (Epic B)
- Critical for mobile app

---

### GET /api/funnels/[slug]/assessments/[assessmentId]/result

**Owner:** Product Team  
**External Allowed:** Yes  
**Authentication Required:** Yes  
**Authorization:** Assessment owner or clinician  
**Status:** Active  
**Used By:**

- Web app results page
- Mobile app results screen
- Clinician dashboard

**Notes:**

- Get completed assessment results
- Critical for mobile app
- Used for report display

---

### POST /api/funnels/[slug]/assessments/[assessmentId]/answers/save

**Owner:** Product Team  
**External Allowed:** Yes  
**Authentication Required:** Yes  
**Authorization:** Assessment owner only  
**Status:** Active  
**Used By:**

- Funnel Runtime answer persistence
- Mobile app answer saving

**Notes:**

- Alternative answer saving endpoint (Funnel Runtime specific)
- May overlap with /api/assessment-answers/save

---

### GET /api/funnels/[slug]/content-pages

**Owner:** Content Team  
**External Allowed:** No  
**Authentication Required:** Yes  
**Authorization:** Any authenticated user  
**Status:** Active  
**Used By:**

- Web app content display
- Funnel content pages

**Notes:**

- Lists content pages for a funnel
- Web app only

---

### GET /api/funnels/[slug]/definition

**Owner:** Product Team  
**External Allowed:** No  
**Authentication Required:** Yes  
**Authorization:** Any authenticated user  
**Status:** Active  
**Used By:**

- Web app funnel renderer
- Dynamic form generation

**Notes:**

- Returns complete funnel definition with steps and questions
- Web app only

---

## Assessment Routes (Legacy/Alternative)

### POST /api/assessment-answers/save

**Owner:** Product Team  
**External Allowed:** Yes  
**Authentication Required:** Yes  
**Authorization:** Assessment owner only  
**Status:** Active  
**Used By:**

- Mobile app answer submission
- Web app answer persistence
- Alternative to Funnel Runtime save endpoint

**Notes:**

- Original answer saving endpoint
- Still used by mobile app
- May be consolidated with Funnel Runtime endpoint in future

---

### POST /api/assessment-validation/validate-step

**Owner:** Product Team  
**External Allowed:** No  
**Authentication Required:** Yes  
**Authorization:** Assessment owner only  
**Status:** Active (potentially redundant)  
**Used By:**

- Potentially unused (superseded by Funnel Runtime validation)

**Notes:**

- **ACTION REQUIRED:** Verify if superseded by /api/funnels/.../steps/.../route validation
- See TV05_CLEANUP_BACKLOG.md

---

### GET /api/assessments/[id]/current-step

**Owner:** Product Team  
**External Allowed:** No  
**Authentication Required:** Yes  
**Authorization:** Assessment owner only  
**Status:** Active (potentially redundant)  
**Used By:**

- Web app navigation (legacy)

**Notes:**

- **ACTION REQUIRED:** Verify if superseded by Funnel Runtime
- May be consolidated

---

### GET /api/assessments/[id]/navigation

**Owner:** Product Team  
**External Allowed:** No  
**Authentication Required:** Yes  
**Authorization:** Assessment owner only  
**Status:** Active  
**Used By:**

- Web app step navigation
- Progress tracking

**Notes:**

- Part of navigation system
- Web app only

---

### POST /api/assessments/[id]/resume

**Owner:** Product Team  
**External Allowed:** No  
**Authentication Required:** Yes  
**Authorization:** Assessment owner only  
**Status:** Active  
**Used By:**

- Web app assessment resumption
- Session recovery

**Notes:**

- Resume incomplete assessment
- Web app only

---

## AI & Report Generation (AMY)

### POST /api/amy/stress-report

**Owner:** Clinical AI Team  
**External Allowed:** Uncertain (needs verification)  
**Authentication Required:** Yes  
**Authorization:** Assessment owner or clinician  
**Status:** Uncertain (potentially unused)  
**Used By:**

- **UNKNOWN** - No current references found

**Notes:**

- **CRITICAL ACTION REQUIRED:** Verify if this endpoint is still needed
- Uses Anthropic Claude API (incurs costs)
- May be superseded by Funnel Runtime report generation
- Zero usage references found in codebase
- See TV05_CLEANUP_AUDIT_UNUSED.md and TV05_CLEANUP_BACKLOG.md item #1
- **DO NOT REMOVE until verified with Clinical AI Team**

---

### POST /api/amy/stress-summary

**Owner:** Clinical AI Team  
**External Allowed:** Uncertain (needs verification)  
**Authentication Required:** Yes  
**Authorization:** Assessment owner or clinician  
**Status:** Uncertain (potentially unused)  
**Used By:**

- **UNKNOWN** - No current references found

**Notes:**

- **CRITICAL ACTION REQUIRED:** Verify if this endpoint is still needed
- Companion endpoint to stress-report
- Uses Anthropic Claude API (incurs costs)
- Zero usage references found in codebase
- See TV05_CLEANUP_AUDIT_UNUSED.md and TV05_CLEANUP_BACKLOG.md item #1
- **DO NOT REMOVE until verified with Clinical AI Team**

---

## Consent & Compliance

### POST /api/consent/record

**Owner:** Compliance Team  
**External Allowed:** Uncertain (needs verification)  
**Authentication Required:** Yes  
**Authorization:** User recording own consent  
**Status:** Uncertain (potentially deprecated)  
**Used By:**

- Potentially superseded by onboarding server actions

**Notes:**

- **ACTION REQUIRED:** Verify if deprecated
- May be replaced by server-side consent flow in onboarding
- See TV05_CLEANUP_AUDIT_UNUSED.md and TV05_CLEANUP_BACKLOG.md item #2
- Check with Compliance Team before removal

---

### GET /api/consent/status

**Owner:** Compliance Team  
**External Allowed:** No  
**Authentication Required:** Yes  
**Authorization:** User checking own status or clinician  
**Status:** Uncertain (potentially deprecated)  
**Used By:**

- Potentially superseded by onboarding server actions

**Notes:**

- **ACTION REQUIRED:** Verify if deprecated
- May be replaced by server-side consent status in onboarding
- See TV05_CLEANUP_AUDIT_UNUSED.md and TV05_CLEANUP_BACKLOG.md item #2

---

## Content Management

### GET /api/content-pages/[slug]

**Owner:** Content Team  
**External Allowed:** No  
**Authentication Required:** Yes  
**Authorization:** Any authenticated user  
**Status:** Active  
**Used By:**

- Web app content pages
- Dynamic content rendering

**Notes:**

- Fetches content page by slug
- Web app only

---

### GET /api/content-resolver/route

**Owner:** Content Team  
**External Allowed:** No  
**Authentication Required:** Uncertain  
**Authorization:** Uncertain  
**Status:** Uncertain (potentially redundant)  
**Used By:**

- Uncertain - potentially duplicate of /api/content/resolve

**Notes:**

- **ACTION REQUIRED:** Verify if duplicate of content/resolve
- See TV05_CLEANUP_AUDIT_UNUSED.md and TV05_CLEANUP_BACKLOG.md item #3
- May be legacy endpoint

---

### GET /api/content/resolve

**Owner:** Content Team  
**External Allowed:** No  
**Authentication Required:** Uncertain  
**Authorization:** Uncertain  
**Status:** Active (potentially redundant)  
**Used By:**

- Content resolution system
- Dynamic content loading

**Notes:**

- **ACTION REQUIRED:** Verify relationship with /api/content-resolver
- See TV05_CLEANUP_AUDIT_UNUSED.md and TV05_CLEANUP_BACKLOG.md item #3
- Consolidate if duplicate

---

## Patient Data & Export

### GET /api/patient-measures/history

**Owner:** Clinical Team  
**External Allowed:** Yes  
**Authentication Required:** Yes  
**Authorization:** Patient (own data) or clinician  
**Status:** Active  
**Used By:**

- Web app patient history
- Mobile app patient history
- Clinician dashboard

**Notes:**

- Returns patient assessment history
- Critical for mobile app
- PHI data - requires proper authorization

---

### POST /api/patient-measures/export

**Owner:** Clinical Team  
**External Allowed:** Yes  
**Authentication Required:** Yes  
**Authorization:** Patient (own data) or clinician  
**Status:** Active  
**Used By:**

- Mobile app data export (JSON format)
- Web app export functionality (future)

**Notes:**

- Exports patient data as JSON
- Critical for mobile app
- PHI data - requires proper authorization
- Part of iOS export feature

---

## Authentication

### GET /api/auth/callback

**Owner:** Auth Team  
**External Allowed:** Yes (OAuth flow)  
**Authentication Required:** No (part of auth flow)  
**Authorization:** N/A  
**Status:** Active  
**Used By:**

- Supabase OAuth callback
- Social login flows
- Magic link authentication

**Notes:**

- Critical authentication endpoint
- Required for Supabase Auth
- **DO NOT REMOVE**

---

## Route Addition Process

When adding a new API route:

1. **Create the route** - Implement in `/app/api/[route]/route.ts`
2. **Document ownership** - Add entry to this file with:
   - Owner (team/person)
   - External access status
   - Authentication/authorization requirements
   - List of clients that will use it
3. **Update external client registry** - If external access is allowed, add to `EXTERNAL_CLIENTS.md`
4. **Add usage tracking** - Consider adding to usage telemetry if high-value endpoint
5. **Update PR template** - Ensure PR includes ownership documentation

---

## Route Deprecation Process

When deprecating an API route:

1. **Update status** - Change status to "Deprecated" in this document
2. **Add deprecation date** - Document when deprecation starts
3. **Notify clients** - Alert all listed users/teams
4. **Implement deprecation headers** - Add `Deprecation` HTTP header to responses
5. **Monitor usage** - Check `/api/admin/usage` for continued use
6. **Wait for migration** - Minimum 30 days for internal, 90 days for external
7. **Remove route** - Only after zero usage confirmed
8. **Update documentation** - Move to deprecated section or remove

---

## Related Documentation

- [External Clients Registry](./EXTERNAL_CLIENTS.md) - External client documentation
- [Cleanup Audit README](./CLEANUP_AUDIT_README.md) - Cleanup process
- [Usage Telemetry](./USAGE_TELEMETRY.md) - Runtime usage tracking

---

**Last Updated:** 2026-01-02  
**Next Review:** 2026-04-02  
**Maintained By:** Architecture Team
