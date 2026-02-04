# Security Model

**Version:** 1.0  
**Status:** Active  
**Scope:** E76 — MCP Integration & E76.9 — System-wide Security  
**Last Updated:** 2026-02-04

---

## Overview

This document defines the security model for the Rhythmologicum Connect system, with specific focus on the MCP (Model Context Protocol) server integration. It covers authentication, authorization, data protection, and threat mitigations.

**Security Principle:** Defense in Depth
- Multiple layers of security controls
- Fail-closed by default (deny unless explicitly allowed)
- Least privilege access
- Audit all security-relevant events

---

## Authentication Model

### User Authentication

**Provider:** Supabase Auth  
**Method:** Cookie-based sessions (SSR-compatible)  
**Token Type:** JWT (JSON Web Tokens)

#### Session Management

```typescript
// Server-side session validation
import { createServerClient } from '@supabase/ssr'

const supabase = createServerClient(...)
const { data: { user } } = await supabase.auth.getUser()

if (!user) {
  // Not authenticated
  return new Response('Unauthorized', { status: 401 })
}
```

**Session Properties:**
- Stored in HTTP-only cookies (not accessible to JavaScript)
- Expires after 1 hour of inactivity
- Auto-refresh when < 5 minutes remaining
- Revocable server-side

#### Token Claims

JWT tokens include:
```json
{
  "sub": "user-uuid",
  "email": "user@example.com",
  "role": "authenticated",
  "app_metadata": {
    "role": "clinician",
    "organization_id": "org-uuid"
  },
  "exp": 1707070800
}
```

---

### API Authentication

**All API routes MUST authenticate requests:**

```typescript
// apps/rhythm-studio-ui/app/api/mcp/route.ts
export async function POST(request: Request) {
  const supabase = createServerClient(...)
  const { data: { user }, error } = await supabase.auth.getUser()
  
  if (error || !user) {
    return NextResponse.json(
      { 
        success: false, 
        error: { code: 'AUTH_ERROR', message: 'Not authenticated' }
      },
      { status: 401 }
    )
  }
  
  // Proceed with authenticated request
}
```

**Error Codes:**
- `401 Unauthorized` - No valid session
- `403 Forbidden` - Authenticated but insufficient permissions

---

## Authorization Model

### Role-Based Access Control (RBAC)

**Supported Roles:**
- `patient` - Can access own data only
- `clinician` - Can access assigned patient data
- `admin` - Can access all data in their organization

**Role Storage:**
- Stored in `auth.users.raw_app_meta_data.role`
- Immutable by user (only admin can change)
- Checked on every request

#### Role Verification

```typescript
import { hasClinicianRole } from '@/lib/supabaseServer'

// Verify clinician or admin role
const isClinician = await hasClinicianRole(supabase)
if (!isClinician) {
  return NextResponse.json(
    { 
      success: false, 
      error: { code: 'AUTH_ERROR', message: 'Insufficient permissions' }
    },
    { status: 403 }
  )
}
```

---

### Row Level Security (RLS)

**All user data tables MUST have RLS enabled.**

RLS policies enforce access control at the database level, providing defense-in-depth even if API checks fail.

#### Example: Patient Profiles

```sql
-- Patients can view own profile
CREATE POLICY "Patients can view own profile"
ON public.patient_profiles
FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Clinicians can view assigned patients
CREATE POLICY "Clinicians can view assigned patients"
ON public.patient_profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clinician_patient_assignments cpa
    WHERE cpa.patient_user_id = user_id
      AND cpa.clinician_user_id = auth.uid()
  )
);

-- Admins can view patients in their org
CREATE POLICY "Admins can view org patients"
ON public.patient_profiles
FOR SELECT
TO authenticated
USING (
  public.current_user_role(organization_id) = 'admin'::public.user_role
);
```

**See also:** `docs/anamnesis/SECURITY_MODEL.md` for detailed RLS examples

---

### Clinician-Patient Assignment

**Access Rule:** Clinicians can ONLY access data for patients they are explicitly assigned to.

**Assignment Table:**
```sql
CREATE TABLE clinician_patient_assignments (
  id UUID PRIMARY KEY,
  clinician_user_id UUID NOT NULL,
  patient_user_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(clinician_user_id, patient_user_id, organization_id)
);
```

**Verification:**
```typescript
// Check if clinician is assigned to patient
const { data: assignment } = await supabase
  .from('clinician_patient_assignments')
  .select('id')
  .eq('clinician_user_id', user.id)
  .eq('patient_user_id', patientId)
  .single()

if (!assignment) {
  return NextResponse.json(
    { 
      success: false, 
      error: { code: 'AUTH_ERROR', message: 'Not assigned to this patient' }
    },
    { status: 403 }
  )
}
```

---

## Data Protection

### Sensitive Data Categories

1. **Personal Identifiable Information (PII)**
   - Name, email, phone, address
   - Date of birth, gender
   - Patient ID (pseudonymized UUID)

2. **Protected Health Information (PHI)**
   - Assessment responses
   - Diagnosis data
   - Medical history (anamnesis)
   - Clinical notes

3. **Authentication Credentials**
   - Password hashes (stored by Supabase)
   - Session tokens
   - API keys

### Encryption

**At Rest:**
- Database: AES-256 encryption (Supabase managed)
- File storage: Server-side encryption
- Backups: Encrypted with separate keys

**In Transit:**
- HTTPS/TLS 1.3 for all external traffic
- Internal services: mTLS (mutual TLS) recommended

### Secret Management

**Never commit secrets to repository:**
```bash
# .gitignore
.env
.env.local
.env.*.local
*.key
*.pem
```

**Environment Variables:**
```bash
# Supabase credentials
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...  # Safe to expose
SUPABASE_SERVICE_ROLE_KEY=eyJhbGc...     # NEVER expose to client

# LLM API keys
LLM_API_KEY=sk-ant-api...                # Redacted in logs

# Session secrets
NEXTAUTH_SECRET=random-secret-here       # Min 32 chars
```

**Log Redaction:**
```typescript
// packages/mcp-server/src/logger.ts
function redactSensitiveData(obj: any): any {
  const sensitive = ['api_key', 'password', 'token', 'secret']
  // Replace sensitive fields with [REDACTED]
}
```

---

## MCP Server Security

### Network Isolation

**MCP server MUST NOT be directly exposed to the internet.**

```
Internet → HTTPS → Main App → HTTP → MCP Server (localhost)
```

**Configuration:**
```bash
# MCP server binds to localhost only
MCP_SERVER_HOST=127.0.0.1  # NOT 0.0.0.0
MCP_SERVER_PORT=3001
```

**Firewall Rules:**
```bash
# Allow only from main app (local connections)
iptables -A INPUT -p tcp --dport 3001 -s 127.0.0.1 -j ACCEPT
iptables -A INPUT -p tcp --dport 3001 -j DROP
```

---

### API Proxy Pattern

**Main app acts as authenticated gateway:**

```typescript
// apps/rhythm-studio-ui/app/api/mcp/route.ts
export async function POST(request: Request) {
  // 1. Authenticate user
  const { user } = await supabase.auth.getUser()
  if (!user) return unauthorized()
  
  // 2. Authorize role
  const isClinician = await hasClinicianRole(supabase)
  if (!isClinician) return forbidden()
  
  // 3. Validate input
  const body = await request.json()
  // ... validate with Zod
  
  // 4. Forward to MCP server
  const mcpResponse = await fetch(process.env.MCP_SERVER_URL + '/tools', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  
  // 5. Return response
  return NextResponse.json(await mcpResponse.json())
}
```

**Security Benefits:**
- MCP server does not need auth logic
- Centralized access control
- Rate limiting at gateway
- Audit logging at gateway
- MCP server isolated from internet

---

### Input Validation

**ALWAYS validate inputs before processing:**

```typescript
import { GetPatientContextInputSchema } from './tools'

const input = await request.json()
const result = GetPatientContextInputSchema.safeParse(input)

if (!result.success) {
  return NextResponse.json({
    success: false,
    error: {
      code: 'VALIDATION_ERROR',
      message: 'Invalid input',
      details: result.error.errors,
    }
  }, { status: 400 })
}

// Safe to use result.data
const { patient_id } = result.data
```

**Validation Rules:**
- Use Zod schemas (see ARTIFACT_SCHEMA_V1.md)
- Reject unknown fields
- Enforce type constraints
- Validate UUIDs, timestamps, enums
- Return specific error messages

---

## Threat Model

### Threat: Unauthorized Data Access

**Attack Vectors:**
1. Patient A tries to access Patient B's data
2. Clinician tries to access non-assigned patient
3. Admin tries to access data from other organization

**Mitigations:**
- ✅ RLS policies on all tables
- ✅ API-level role checks
- ✅ Assignment table enforcement
- ✅ Organization scoping

**Detection:**
- Audit log all access attempts
- Alert on repeated 403 errors
- Monitor assignment changes

---

### Threat: Session Hijacking

**Attack Vectors:**
1. Session token stolen via XSS
2. Session token stolen via network sniffing
3. Session cookie stolen via CSRF

**Mitigations:**
- ✅ HTTP-only cookies (not accessible to JS)
- ✅ HTTPS only (TLS encryption)
- ✅ CSRF tokens on state-changing requests
- ✅ Short session expiry (1 hour)
- ✅ SameSite cookie attribute

**Detection:**
- Monitor for concurrent sessions from different IPs
- Alert on session token reuse after logout
- Anomaly detection on login patterns

---

### Threat: SQL Injection

**Attack Vectors:**
1. Unsanitized user input in SQL queries
2. Dynamic query construction

**Mitigations:**
- ✅ Use Supabase client (parameterized queries)
- ✅ Never concatenate user input into SQL
- ✅ Use RLS policies (defense-in-depth)
- ✅ Input validation with Zod

**Example (SAFE):**
```typescript
// ✅ Safe - parameterized query
const { data } = await supabase
  .from('assessments')
  .select('*')
  .eq('patient_id', patientId)  // Automatically escaped
```

**Example (UNSAFE):**
```typescript
// ❌ NEVER DO THIS
const query = `SELECT * FROM assessments WHERE patient_id = '${patientId}'`
await supabase.rpc('unsafe_query', { query })
```

---

### Threat: Secret Exposure in Logs

**Attack Vectors:**
1. API keys logged in debug messages
2. Session tokens logged in error traces
3. PHI logged in application logs

**Mitigations:**
- ✅ Automatic redaction in logger
- ✅ Whitelist of loggable fields
- ✅ Separate error logs (no PHI)
- ✅ Log levels (debug disabled in production)

**Example:**
```typescript
// packages/mcp-server/src/logger.ts
logger.info({ 
  api_key: process.env.LLM_API_KEY  // Automatically shows [REDACTED]
})

logger.info({
  patient_id: 'uuid',  // OK - pseudonymized
  patient_name: 'John Doe'  // ❌ PHI - should not be logged
})
```

---

### Threat: LLM Prompt Injection

**Attack Vectors:**
1. User includes malicious instructions in assessment responses
2. Attacker embeds prompt override in patient name/data

**Mitigations:**
- ✅ Input sanitization before LLM
- ✅ Prompt template with clear boundaries
- ✅ Output validation with Zod schemas
- ✅ LLM response filtering

**Example:**
```typescript
// Sanitize before sending to LLM
function sanitizeForLLM(input: string): string {
  // Remove potential prompt injection patterns
  return input
    .replace(/ignore previous instructions/gi, '')
    .replace(/system:/gi, '')
    .slice(0, 5000)  // Truncate long inputs
}
```

**Future Enhancement:**
- Content Safety API for input/output filtering
- Prompt injection detection
- LLM guardrails (e.g., Anthropic Constitutional AI)

---

## Audit Logging

### Audit Events

**Security-relevant events that MUST be logged:**

1. **Authentication:**
   - Login success/failure
   - Logout
   - Session expiry
   - Token refresh

2. **Authorization:**
   - Access denied (403)
   - Role check failures
   - Assignment violations

3. **Data Access:**
   - Patient record access
   - Assessment retrieval
   - Diagnosis execution
   - Anamnesis queries

4. **Data Modification:**
   - Assessment creation/update
   - Diagnosis creation
   - Anamnesis entry changes
   - User role changes

### Audit Log Schema

```typescript
interface AuditLogEntry {
  id: string
  timestamp: string
  event_type: string
  actor_user_id: string
  organization_id: string
  entity_type?: string
  entity_id?: string
  action: string
  result: 'success' | 'failure'
  metadata: Record<string, unknown>
  ip_address?: string
  user_agent?: string
}
```

### Audit Log Example

```json
{
  "id": "log-uuid",
  "timestamp": "2026-02-04T19:00:00.000Z",
  "event_type": "data_access",
  "actor_user_id": "clinician-uuid",
  "organization_id": "org-uuid",
  "entity_type": "patient_profile",
  "entity_id": "patient-uuid",
  "action": "view",
  "result": "success",
  "metadata": {
    "patient_id": "patient-uuid",
    "assignment_id": "assignment-uuid"
  },
  "ip_address": "192.168.1.1",
  "user_agent": "Mozilla/5.0..."
}
```

---

## Security Checklist

### For New API Endpoints

- [ ] Authenticate user with Supabase
- [ ] Verify user role (patient/clinician/admin)
- [ ] Check assignment if accessing patient data
- [ ] Validate input with Zod schema
- [ ] Use parameterized queries (Supabase client)
- [ ] Return appropriate error codes (401, 403, 400)
- [ ] Log access attempt to audit log
- [ ] Redact sensitive data in logs
- [ ] Test with unauthorized user
- [ ] Test with different organizations
- [ ] Add to endpoint allowlist if external

### For New Database Tables

- [ ] Enable RLS on table
- [ ] Create policy for patient access
- [ ] Create policy for clinician access
- [ ] Create policy for admin access
- [ ] Add organization_id column
- [ ] Add audit trigger
- [ ] Test RLS with different roles
- [ ] Verify cross-org isolation
- [ ] Document in SECURITY_MODEL.md

### For MCP Server Changes

- [ ] Validate all inputs with Zod
- [ ] Validate all outputs with Zod
- [ ] Redact secrets in logs
- [ ] Update ARTIFACT_SCHEMA_V1.md
- [ ] Test with malformed input
- [ ] Test error handling
- [ ] Run verification script (verify:e76-1)

---

## Compliance

### GDPR

**Right to Access:**
- API endpoints for user to retrieve their data
- Export functionality (JSON format)

**Right to Erasure:**
- Cascade delete on user account deletion
- Retention policy documented

**Consent Management:**
- Consent recorded in database
- Timestamp and version tracked
- User can withdraw consent

### HIPAA (if applicable)

**Covered Entities:**
- Healthcare providers using the system
- Business Associate Agreement (BAA) required

**Required Controls:**
- ✅ Access control (RBAC + RLS)
- ✅ Audit logging
- ✅ Encryption (at rest + in transit)
- ✅ Data integrity (version history)
- ✅ PHI minimization

---

## Incident Response

### Security Incident Types

1. **Data Breach** - Unauthorized access to PHI/PII
2. **Account Compromise** - User account taken over
3. **Denial of Service** - System unavailable
4. **Insider Threat** - Authorized user misuses access

### Response Procedure

1. **Detect & Confirm**
   - Review audit logs
   - Verify scope of incident
   - Identify affected users/data

2. **Contain**
   - Revoke compromised sessions
   - Disable compromised accounts
   - Block malicious IPs
   - Take system offline if necessary

3. **Eradicate**
   - Remove malicious code/data
   - Patch vulnerabilities
   - Reset credentials

4. **Recover**
   - Restore from backups if needed
   - Verify system integrity
   - Resume normal operations

5. **Post-Incident**
   - Document incident
   - Notify affected users
   - Report to authorities (if required)
   - Update security controls

---

## References

- **Supabase Auth Docs:** https://supabase.com/docs/guides/auth
- **Supabase RLS Docs:** https://supabase.com/docs/guides/auth/row-level-security
- **Anamnesis Security:** `docs/anamnesis/SECURITY_MODEL.md`
- **MCP Server:** `docs/runbooks/MCP_SERVER.md`
- **Troubleshooting:** `docs/runbooks/TROUBLESHOOTING.md`
- **OWASP Top 10:** https://owasp.org/www-project-top-ten/

---

**Security Model Version:** 1.0  
**Author:** GitHub Copilot  
**Epic:** E76.9 — Docs & Developer Runbook
