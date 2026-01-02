# External Client Registry

## Overview

This document tracks all external clients that access Rhythmologicum Connect API endpoints. "External" means any client outside the main Next.js web application codebase, including mobile apps, scripts, integrations, and third-party services.

**Purpose:** Prevent accidental removal of API endpoints that appear "unused" in repository code searches but are actively used by external clients.

**Maintenance:** When adding a new external client or integration, add an entry to this registry.

---

## Active External Clients

### Mobile Application (iOS/Android)

**Owner:** Mobile Development Team  
**Contact:** [TBD]  
**Environment:** Production, Preview  
**Authentication Method:** Supabase Auth (cookie-based sessions)  
**API Base URL:** Same as web app (`NEXT_PUBLIC_SUPABASE_URL`)

**Endpoints Used:**
- `GET /api/funnels/active` - List available assessment funnels
- `POST /api/funnels/[slug]/assessments` - Start new assessment
- `GET /api/funnels/[slug]/assessments/[assessmentId]` - Get assessment state
- `POST /api/funnels/[slug]/assessments/[assessmentId]/steps/[stepId]` - Validate step
- `POST /api/assessment-answers/save` - Save answers
- `POST /api/funnels/[slug]/assessments/[assessmentId]/complete` - Complete assessment
- `GET /api/funnels/[slug]/assessments/[assessmentId]/result` - Get results
- `GET /api/patient-measures/history` - Get patient history
- `POST /api/patient-measures/export` - Export patient data

**Notes:**
- Mobile app shares authentication with web app
- Uses same Supabase backend
- All endpoints require authentication

---

### Administrative Scripts

**Owner:** DevOps / Operations Team  
**Contact:** [TBD]  
**Environment:** Production  
**Authentication Method:** Service Role Key (server-side)  
**API Base URL:** Production API URL

**Endpoints Used:**
- `GET /api/admin/usage` - Usage telemetry for monitoring (requires admin role)
- `GET /api/admin/diagnostics/pillars-sot` - System diagnostics

**Notes:**
- Uses `SUPABASE_SERVICE_ROLE_KEY` for authentication
- Runs on scheduled basis (cron jobs)
- Critical for operational monitoring

---

### AI Report Generation (AMY)

**Owner:** Clinical AI Team  
**Contact:** [TBD]  
**Environment:** Production, Development  
**Authentication Method:** Anthropic API Key (server-side)  
**API Base URL:** Internal use only

**Endpoints Used:**
- `POST /api/amy/stress-report` - Generate AI-powered stress assessment reports
- `POST /api/amy/stress-summary` - Generate assessment summaries

**Notes:**
- Currently marked as potentially unused in cleanup audit (TV05_CLEANUP_AUDIT_UNUSED)
- Uses Anthropic Claude API for report generation
- **ACTION REQUIRED:** Verify if these endpoints are still needed or have been superseded by Funnel Runtime system
- May be used by future integrations or clinician dashboard features

---

### Integration Partners (Future)

**Owner:** Integration Team  
**Contact:** [TBD]  
**Environment:** TBD  
**Authentication Method:** TBD  

**Endpoints Used:**
- TBD - To be documented when partnerships are established

**Notes:**
- Placeholder for future third-party integrations
- Document here before going live

---

## Deprecated/Inactive Clients

### Legacy Consent Flow (Deprecated)

**Owner:** N/A  
**Status:** Potentially deprecated  
**Last Used:** Unknown  
**Replacement:** Onboarding server actions

**Endpoints:**
- `POST /api/consent/record` - Record user consent
- `GET /api/consent/status` - Get consent status

**Notes:**
- Marked in cleanup audit as potentially superseded by onboarding server actions
- **ACTION REQUIRED:** Confirm deprecation status before removal
- See TV05_CLEANUP_BACKLOG.md item #2

---

## Client Registry Maintenance Process

### Adding a New External Client

1. **Before Deployment:**
   - Add client details to this document
   - List all endpoints the client will use
   - Mark those endpoints in `API_ROUTE_OWNERSHIP.md` as `externalAllowed: yes`

2. **Documentation Template:**
   ```markdown
   ### [Client Name]
   
   **Owner:** [Team/Person]
   **Contact:** [Email/Slack]
   **Environment:** [Production/Preview/Development]
   **Authentication Method:** [Auth type]
   **API Base URL:** [URL]
   
   **Endpoints Used:**
   - `[METHOD] /api/[route]` - [Description]
   
   **Notes:**
   - [Any special considerations]
   ```

3. **Update Related Documentation:**
   - Update `API_ROUTE_OWNERSHIP.md` for each endpoint
   - Update cleanup audit scripts to exclude these endpoints from "unused" reports
   - Add to monitoring/alerting if critical

### Removing a Client

1. **Deprecation Process:**
   - Move client entry to "Deprecated/Inactive Clients" section
   - Document deprecation date and reason
   - Keep entry for 6 months minimum

2. **Endpoint Cleanup:**
   - Check if endpoints are used by other clients
   - If endpoint is only used by deprecated client, mark for removal in `API_ROUTE_OWNERSHIP.md`
   - Follow standard deprecation process (see `TV05_CLEANUP_BACKLOG.md`)

### Quarterly Review

1. **Review Schedule:** Every 3 months
2. **Review Checklist:**
   - [ ] Verify all listed clients are still active
   - [ ] Check for new external clients not yet documented
   - [ ] Update contact information if changed
   - [ ] Remove deprecated entries older than 6 months
   - [ ] Cross-reference with `API_ROUTE_OWNERSHIP.md`

---

## Integration with Cleanup Audit

**Reference:** `docs/CLEANUP_AUDIT_README.md`

Before marking any API endpoint as "unused" or "safe to remove":

1. **Check this registry** - Is the endpoint used by an external client?
2. **Check route ownership** - See `API_ROUTE_OWNERSHIP.md` for ownership details
3. **Verify with owners** - Contact the listed owner before removal
4. **Update telemetry** - Check `/api/admin/usage` for actual usage data

**Cleanup Decision Matrix:**

| Condition | Action |
|-----------|--------|
| Used by external client | **DO NOT REMOVE** - Keep endpoint |
| Not in registry + zero usage telemetry | **VERIFY** - Check with team before removal |
| Marked as deprecated + 6+ months old | **SAFE TO REMOVE** - Follow deprecation process |
| Uncertain ownership | **ESCALATE** - Discuss in architecture review |

---

## Related Documentation

- [API Route Ownership](./API_ROUTE_OWNERSHIP.md) - Detailed route-by-route ownership
- [Cleanup Audit README](./CLEANUP_AUDIT_README.md) - Cleanup process and methodology
- [TV05 Cleanup Audit Unused](./TV05_CLEANUP_AUDIT_UNUSED.md) - Potentially unused endpoints report
- [Usage Telemetry](./USAGE_TELEMETRY.md) - Runtime usage tracking documentation

---

**Last Updated:** 2026-01-02  
**Next Review:** 2026-04-02  
**Maintained By:** Architecture Team
