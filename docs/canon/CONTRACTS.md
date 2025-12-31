# API and Component Contracts

**Type:** Canon  
**Purpose:** Standardized interfaces and response formats  
**Audience:** Backend and frontend developers

---

## API Response Format

All API endpoints MUST return responses in this standard format:

```typescript
type ApiResponse<T> = {
  success: boolean
  data?: T
  error?: {
    code: string
    message: string
  }
}
```

### Success Response

```typescript
{
  "success": true,
  "data": {
    // Response payload
  }
}
```

### Error Response

```typescript
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "User-friendly error message"
  }
}
```

### Standard Error Codes

| Code | HTTP Status | Meaning |
|------|-------------|---------|
| `AUTHENTICATION_REQUIRED` | 401 | User not logged in |
| `AUTHORIZATION_FAILED` | 403 | User lacks permission |
| `NOT_FOUND` | 404 | Resource doesn't exist |
| `VALIDATION_ERROR` | 400 | Invalid input data |
| `CONFLICT` | 409 | Resource conflict (e.g., duplicate) |
| `INTERNAL_ERROR` | 500 | Server-side error |
| `SERVICE_UNAVAILABLE` | 503 | External service down |

---

## V0.5 Database Enums and Status Values

### User Roles

```sql
CREATE TYPE public.user_role AS ENUM ('patient', 'clinician', 'nurse', 'admin');
```

**Values:**
- `patient` - Patient/end user
- `clinician` - Medical professional with full access
- `nurse` - Care coordinator with task management
- `admin` - System administrator

### Assessment States

```sql
CREATE TYPE public.assessment_state AS ENUM ('draft', 'in_progress', 'completed', 'archived');
```

**Values:**
- `draft` - Assessment created but not started
- `in_progress` - Assessment actively being filled out
- `completed` - Assessment finished by patient
- `archived` - Historical assessment no longer active

### Report Status

```sql
CREATE TYPE public.report_status AS ENUM ('pending', 'generating', 'completed', 'failed');
```

**Values:**
- `pending` - Report queued for generation
- `generating` - AI currently generating report
- `completed` - Report successfully generated
- `failed` - Report generation encountered error

### Task Status

```sql
CREATE TYPE public.task_status AS ENUM ('pending', 'in_progress', 'completed', 'cancelled');
```

**Values:**
- `pending` - Task created, not yet started
- `in_progress` - Task actively being worked on
- `completed` - Task finished successfully
- `cancelled` - Task no longer needed

### Document Parsing Status

```sql
CREATE TYPE public.parsing_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'partial');
```

**Values:**
- `pending` - Document uploaded, awaiting processing
- `processing` - AI actively extracting data
- `completed` - All data successfully extracted
- `failed` - Extraction failed completely
- `partial` - Some data extracted, manual review needed

### Notification Status

```sql
CREATE TYPE public.notification_status AS ENUM ('scheduled', 'sent', 'failed', 'cancelled');
```

**Values:**
- `scheduled` - Notification queued to send
- `sent` - Successfully delivered
- `failed` - Delivery failed (retry may occur)
- `cancelled` - Notification no longer needed

### Patient Funnel Status

```sql
-- TEXT CHECK constraint, not enum
CHECK (status IN ('active', 'paused', 'completed', 'archived'))
```

**Values:**
- `active` - Patient actively engaged with funnel
- `paused` - Temporarily suspended by patient/clinician
- `completed` - Patient finished all funnel steps
- `archived` - Historical funnel instance

---

## Funnel Runtime Endpoints

### Start Assessment

```
POST /api/funnels/{slug}/assessments
```

**Request Body:**
```typescript
{
  funnel_slug: string
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    assessmentId: string // UUID
    currentStep: {
      id: string
      type: 'QUESTION' | 'CONTENT_PAGE'
      order_index: number
    }
  }
}
```

---

### Get Assessment Status

```
GET /api/funnels/{slug}/assessments/{assessmentId}
```

**Response:**
```typescript
{
  success: true,
  data: {
    id: string
    status: 'in_progress' | 'completed'
    currentStep: {
      id: string
      type: 'QUESTION' | 'CONTENT_PAGE'
      order_index: number
      // ... step details
    }
    nextStep: {
      id: string
      // ... or null if last step
    } | null
    progress: {
      current: number
      total: number
      percentage: number
    }
  }
}
```

---

### Validate Step

```
POST /api/funnels/{slug}/assessments/{assessmentId}/steps/{stepId}/validate
```

**Request Body:**
```typescript
{
  answers: Array<{
    question_id: string
    value: any
  }>
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    valid: boolean
    errors?: Array<{
      question_id: string
      message: string
    }>
    nextStep?: {
      id: string
      // ... step details
    }
  }
}
```

---

### Save Answers

```
POST /api/assessment-answers/save
```

**Request Body:**
```typescript
{
  assessment_id: string
  answers: Array<{
    question_id: string
    funnel_step_id: string
    answer_value: any
  }>
}
```

**Response:**
```typescript
{
  success: true,
  data: {
    saved: number // count of saved answers
  }
}
```

---

### Complete Assessment

```
POST /api/funnels/{slug}/assessments/{assessmentId}/complete
```

**Response:**
```typescript
{
  success: true,
  data: {
    assessment_id: string
    status: 'completed'
    report_id?: string // If report generated
    redirect_url?: string // Where to send user next
  }
}
```

---

## Component Contracts

### QuestionRenderer

Required props:

```typescript
interface QuestionRendererProps {
  question: {
    id: string
    question_text: string
    answer_type: 'scale' | 'single_choice' | 'multiple_choice' | 'text'
    options?: Array<{
      id: string
      label: string
      value: string | number
    }>
    validation?: {
      required: boolean
      min?: number
      max?: number
      pattern?: string
    }
  }
  value?: any
  onChange: (value: any) => void
  error?: string
  disabled?: boolean
}
```

---

### StepNavigator

Required props:

```typescript
interface StepNavigatorProps {
  currentStep: number
  totalSteps: number
  canGoNext: boolean
  canGoBack: boolean
  onNext: () => Promise<void>
  onBack: () => void
  loading?: boolean
}
```

---

### ContentPageRenderer

Required props:

```typescript
interface ContentPageRendererProps {
  content: {
    id: string
    slug: string
    title: string
    body: string // Markdown
    category: 'intro' | 'info' | 'result'
  }
  onContinue?: () => void
  showContinueButton?: boolean
}
```

---

## Database Schema Contracts

### Assessments Table

```sql
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  funnel_id UUID NOT NULL REFERENCES public.funnels(id),
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed')),
  current_step_id UUID REFERENCES public.funnel_steps(id),
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ
);
```

### Assessment Answers Table

```sql
CREATE TABLE public.assessment_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.questions(id),
  funnel_step_id UUID NOT NULL REFERENCES public.funnel_steps(id),
  answer_value JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ,
  UNIQUE(assessment_id, question_id, funnel_step_id)
);
```

---

## Authentication Contract

### User Session

```typescript
interface UserSession {
  user: {
    id: string
    email: string
    role: 'patient' | 'clinician' | 'admin'
  }
  expires_at: string
}
```

### Server-Side Auth Check

```typescript
// Required in all protected routes
const user = await getCurrentUser()
if (!user) {
  return NextResponse.json(
    { success: false, error: { code: 'AUTHENTICATION_REQUIRED', message: 'Please log in' } },
    { status: 401 }
  )
}

// For clinician-only routes
if (!hasClinicianRole(user)) {
  return NextResponse.json(
    { success: false, error: { code: 'AUTHORIZATION_FAILED', message: 'Access denied' } },
    { status: 403 }
  )
}
```

---

## V0.5 RLS Policy Contract

All tables with user data MUST have RLS enabled and appropriate policies for multi-tenant isolation.

### Organization-Based Access Rules

**Patient Role:**
- Can SELECT/INSERT/UPDATE only their own data
- Identified by: `patient_id = public.get_my_patient_profile_id()` or `user_id = auth.uid()`
- Cannot access any other patient's data
- Cannot access organization configuration

**Clinician Role:**
- Can SELECT data for patients in same organization(s)
- Can SELECT data for explicitly assigned patients (cross-org via `clinician_patient_assignments`)
- Can INSERT/UPDATE limited tables (reports review, tasks)
- Cannot access patients from other organizations unless explicitly assigned

**Nurse Role:**
- Can SELECT patients and assessments in same organization(s)
- Can SELECT/UPDATE tasks where `assigned_to_role = 'nurse'`
- Can add support notes to patient records
- Same org-scoping as clinicians

**Admin Role:**
- Can SELECT/UPDATE organization settings within their org
- Can manage `user_org_membership` for their org
- Can manage `funnels_catalog` and `funnel_versions` (global)
- **NO ACCESS** to patient health data (PHI) by default
- Exception: Can view `audit_log` for compliance purposes

### Helper Functions (use in policies)

```typescript
// Get user's organization IDs
public.get_user_org_ids() => UUID[]

// Check if user is member of specific org
public.is_member_of_org(org_id: UUID) => boolean

// Get user's role in specific org
public.current_user_role(org_id: UUID) => 'patient' | 'clinician' | 'nurse' | 'admin'

// Check if user has role in any org
public.has_any_role(role: 'patient' | 'clinician' | 'nurse' | 'admin') => boolean

// Check if clinician assigned to patient
public.is_assigned_to_patient(patient_user_id: UUID) => boolean

// Get current user's patient_profile.id (legacy, patients only)
public.get_my_patient_profile_id() => UUID | null

// Check if user is clinician (legacy, deprecated - use has_any_role)
public.is_clinician() => boolean
```

### Policy Templates

**Patient Data Table:**
```sql
ALTER TABLE public.patient_data_table ENABLE ROW LEVEL SECURITY;

-- Patient sees own data
CREATE POLICY "Patients can view own data"
  ON public.patient_data_table
  FOR SELECT
  USING (patient_id = public.get_my_patient_profile_id());

-- Staff sees org or assigned patients
CREATE POLICY "Staff can view org patient data"
  ON public.patient_data_table
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.patient_profiles pp
      JOIN public.user_org_membership uom1 ON pp.user_id = uom1.user_id
      WHERE pp.id = patient_data_table.patient_id
        AND EXISTS (
          SELECT 1 FROM public.user_org_membership uom2
          WHERE uom2.user_id = auth.uid()
            AND uom2.organization_id = uom1.organization_id
            AND uom2.is_active = true
            AND (uom2.role IN ('clinician', 'nurse'))
        )
    )
    OR EXISTS (
      SELECT 1 FROM public.patient_profiles pp
      WHERE pp.id = patient_data_table.patient_id
        AND public.is_assigned_to_patient(pp.user_id)
    )
  );

-- Patient can insert own data
CREATE POLICY "Patients can insert own data"
  ON public.patient_data_table
  FOR INSERT
  WITH CHECK (patient_id = public.get_my_patient_profile_id());
```

**Organization Config Table:**
```sql
ALTER TABLE public.config_table ENABLE ROW LEVEL SECURITY;

-- Users can view their org config
CREATE POLICY "Users can view own org config"
  ON public.config_table
  FOR SELECT
  USING (organization_id = ANY(public.get_user_org_ids()));

-- Admins can update their org config
CREATE POLICY "Admins can update org config"
  ON public.config_table
  FOR UPDATE
  USING (public.current_user_role(organization_id) = 'admin')
  WITH CHECK (public.current_user_role(organization_id) = 'admin');
```

**Service Role Handling:**

Server-side operations use Supabase `service_role` key which **bypasses RLS entirely**. No RLS policies needed for server operations.

```typescript
// Server-side: service_role bypasses ALL RLS policies
const serviceSupabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!  // Bypasses RLS
)

// This works regardless of RLS policies
await serviceSupabase.from('reports').insert({ ... })
await serviceSupabase.from('audit_log').insert({ ... })
```

**Important:** 
- Service role key must NEVER be exposed to client-side code
- RLS policies only apply to authenticated users (JWT-based)
- Backend APIs should use service role for system operations
- Client-side code uses anon/authenticated keys (subject to RLS)

### Assignment Table

**V0.5 Default:** Assignments are enforced within the same organization only.

```sql
CREATE TABLE public.clinician_patient_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  clinician_user_id UUID NOT NULL REFERENCES auth.users(id),
  patient_user_id UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  UNIQUE(organization_id, clinician_user_id, patient_user_id),
  -- Constraint: Both users must be members of the same organization
  CHECK (
    EXISTS (
      SELECT 1 FROM user_org_membership
      WHERE user_id = clinician_user_id
        AND organization_id = clinician_patient_assignments.organization_id
        AND role IN ('clinician', 'nurse', 'admin')
    )
    AND EXISTS (
      SELECT 1 FROM user_org_membership
      WHERE user_id = patient_user_id
        AND organization_id = clinician_patient_assignments.organization_id
        AND role = 'patient'
    )
  )
);
```

### V0.5 Tables with RLS Enabled

- ✅ `organizations` - Org config, admins only
- ✅ `user_profiles` - User can see own + staff see org
- ✅ `user_org_membership` - User sees own + admins manage org
- ✅ `patient_profiles` - Patient isolation + org/assignment access
- ✅ `funnels_catalog` - Read-only for authenticated, admins manage
- ✅ `funnel_versions` - Read-only for authenticated, admins manage
- ✅ `patient_funnels` - Patient-owned, staff view org
- ✅ `assessments` - Patient-owned, staff view org
- ✅ `assessment_events` - Follows assessment access
- ✅ `assessment_answers` - Follows assessment access
- ✅ `documents` - Patient upload/view, staff view org
- ✅ `calculated_results` - Patient view own, staff view org
- ✅ `reports` - Patient view own, staff view org, service manages
- ✅ `report_sections` - Follows report access
- ✅ `tasks` - Role-based (nurse/clinician), org-scoped
- ✅ `notifications` - User sees own, service manages
- ✅ `audit_log` - Admins only, service inserts
- ✅ `clinician_patient_assignments` - Clinician sees own, admins manage org

### Testing RLS Policies

Verification queries documented in migration `20251231072347_v05_rls_verification_tests.sql`.

Quick smoke test:
```sql
-- Verify all tables have RLS enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename LIKE ANY(ARRAY['%patient%', '%assessment%', '%org%', '%funnel%', '%task%', '%report%', '%document%', '%audit%']);

-- Count policies per table
SELECT tablename, COUNT(*) as policy_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY policy_count DESC;
```

---

## RLS Policy Contract (Legacy Pre-V0.5)

**DEPRECATED:** Legacy single-org RLS patterns below. Use V0.5 multi-tenant patterns above.

All tables with user data MUST have RLS enabled and policies:

```sql
-- Enable RLS
ALTER TABLE public.my_table ENABLE ROW LEVEL SECURITY;

-- Patient can see own data
CREATE POLICY "patient_select_own" 
  ON public.my_table
  FOR SELECT
  USING (auth.uid() = user_id);

-- Clinician can see all data
CREATE POLICY "clinician_select_all"
  ON public.my_table
  FOR SELECT
  USING (public.is_clinician());

-- Service role has full access (for API operations)
CREATE POLICY "service_role_all"
  ON public.my_table
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');
```

---

## V0.5 JSONB Field Schemas

### Funnel Version Configuration

**questionnaire_config JSONB:**
```typescript
{
  steps: Array<{
    id: string
    order: number
    questions: Array<{
      id: string
      type: 'scale' | 'single_choice' | 'multiple_choice' | 'text'
      required: boolean
      validation?: object
    }>
  }>
  branching_rules?: Array<{
    condition: object
    target_step: string
  }>
}
```

**content_manifest JSONB:**
```typescript
{
  pages: Array<{
    id: string
    slug: string
    flow_step: 'intro' | 'result' | 'info'
    order: number
  }>
  media: Array<{
    id: string
    type: 'image' | 'video'
    url: string
  }>
}
```

### Document Extraction Data

**extracted_data JSONB:**
```typescript
{
  fields: Array<{
    key: string
    value: any
    confidence: number // 0-1
    location?: { page: number, bbox: [x, y, w, h] }
  }>
  metadata: {
    pages: number
    format: string
    extracted_at: string
  }
}
```

**confidence JSONB:**
```typescript
{
  overall: number // 0-1
  per_field: {
    [field_key: string]: number
  }
}
```

### Calculated Results

**scores JSONB:**
```typescript
{
  primary_score: number
  subscores?: {
    [category: string]: number
  }
  percentile?: number
}
```

**risk_models JSONB:**
```typescript
{
  risk_level: 'low' | 'medium' | 'high' | 'critical'
  risk_factors: Array<{
    factor: string
    severity: number
    explanation: string
  }>
}
```

**priority_ranking JSONB:**
```typescript
{
  priority: 'low' | 'medium' | 'high' | 'urgent'
  urgency_score: number
  recommended_actions: string[]
}
```

### Report Citations

**citations_meta JSONB:**
```typescript
{
  sources: Array<{
    id: string
    type: 'research' | 'guideline' | 'internal'
    title: string
    url?: string
    year?: number
  }>
  inline_citations: Array<{
    text_segment: string
    source_ids: string[]
  }>
}
```

### Task Payloads

**task payload JSONB:**
```typescript
{
  task_specific_data: any
  priority: 'low' | 'medium' | 'high'
  metadata: {
    created_by: string
    reason: string
  }
}
```

### Notification Payloads

**notification payload JSONB:**
```typescript
{
  template_variables: {
    [key: string]: any
  }
  preferences: {
    locale?: string
    timezone?: string
  }
}
```

### Audit Log Diff

**diff JSONB:**
```typescript
{
  before: object | null
  after: object | null
  changed_fields: string[]
}
```

---

## Logging Contract

### Structured Log Format

```typescript
interface LogEntry {
  timestamp: string // ISO 8601
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  context?: {
    user_id?: string
    assessment_id?: string
    funnel_slug?: string
    [key: string]: any
  }
  error?: {
    name: string
    message: string
    stack?: string
  }
}
```

### Usage

```typescript
// Info log
console.log(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'info',
  message: 'Assessment started',
  context: { user_id: user.id, funnel_slug: 'stress' }
}))

// Error log
console.error(JSON.stringify({
  timestamp: new Date().toISOString(),
  level: 'error',
  message: 'Failed to save answer',
  context: { assessment_id: id },
  error: { name: err.name, message: err.message }
}))
```

---

## Migration Contract

### File Naming

```
YYYYMMDDHHMMSS_description.sql
```

Example: `20251230164500_add_sleep_funnel.sql`

### File Structure

```sql
-- Migration: <Brief description>
-- Created: YYYY-MM-DD
-- Author: <Name>

-- 1. Tables
-- 2. Indexes
-- 3. Foreign Keys
-- 4. RLS Policies
-- 5. Functions
-- 6. Triggers
-- 7. Data Migrations
```

### Idempotency Required

All statements must be idempotent (safe to run multiple times):
- Use `CREATE TABLE IF NOT EXISTS`
- Use `CREATE INDEX IF NOT EXISTS`
- Wrap policies in `DO $$ IF NOT EXISTS` blocks

---

## Versioning Contract

### Overview

All processing outputs (scores, rankings, reports, sections) MUST be traceable to specific version references:
- **funnel_version**: Which questionnaire/content version was used
- **algorithm_version**: Which scoring/analysis algorithm bundle was used
- **prompt_version**: Which AI prompt template version was used
- **report_version**: Composite version identifier for the entire report

This enables **reproducibility**: "What did the system know when this output was generated?"

### Version Fields in Database

#### calculated_results Table

```typescript
{
  algorithm_version: string        // NOT NULL - e.g., "v1.0.0"
  funnel_version_id: UUID          // FK to funnel_versions
  computed_at: timestamp           // NOT NULL - when computed
  inputs_hash: string              // SHA256 of normalized inputs
}
```

**Unique constraint:** `(assessment_id, algorithm_version)` - ensures idempotent re-runs

#### reports Table

```typescript
{
  report_version: string           // NOT NULL - composite version
  prompt_version: string           // NOT NULL - AI prompt version
  algorithm_version: string        // Algorithm used for scoring
  funnel_version_id: UUID          // FK to funnel_versions
}
```

**Unique constraint:** `(assessment_id, report_version)` - ensures retry safety

#### report_sections Table

```typescript
{
  section_key: string              // Section identifier
  prompt_version: string           // AI prompt version for this section
  content: text                    // Generated content
  citations_meta: jsonb            // Citation metadata
}
```

**Unique constraint:** `(report_id, section_key)` - one section per report+key

### Version Generation Rules

**report_version Pattern:**
```
{funnelVersion}-{algorithmVersion}-{promptVersion}-{inputsHashPrefix}
```

Example: `1.0.0-v1.0.0-1.0-abc12345`

This deterministic format ensures:
- No date dependency (fully reproducible)
- Uniqueness through inputs hash
- Same inputs = same version (idempotent)

**Inputs Hash Definition:**

The `inputs_hash` is a SHA256 hash of normalized inputs that MUST include:
- `assessment_id` - Which assessment this is for
- `funnel_version_id` - Which funnel version was used
- `algorithm_version` - Which algorithm version was used
- `prompt_version` - Which prompt version was used
- `answers` or confirmed data/document IDs - The actual input data

This ensures that:
1. Same inputs produce same hash (idempotency)
2. Different inputs produce different hash (uniqueness)
3. Hash is deterministic and reproducible

**Implementation:**
```typescript
import { 
  generateReportVersion, 
  CURRENT_ALGORITHM_VERSION, 
  CURRENT_PROMPT_VERSION,
  computeInputsHash,
  getHashPrefix,
} from '@/lib/versioning/constants'

// Compute inputs hash from assessment context
const inputsForHash = {
  assessment_id: assessmentId,
  algorithm_version: CURRENT_ALGORITHM_VERSION,
  prompt_version: CURRENT_PROMPT_VERSION,
  answers: normalizedAnswers,
}
const inputsHash = await computeInputsHash(inputsForHash)
const inputsHashPrefix = getHashPrefix(inputsHash, 8) // First 8 chars

const reportVersion = generateReportVersion({
  funnelVersion: '1.0.0',
  algorithmVersion: CURRENT_ALGORITHM_VERSION,
  promptVersion: CURRENT_PROMPT_VERSION,
  inputsHashPrefix,
})
// Returns: "1.0.0-v1.0.0-1.0-abc12345"
```

### Inputs Hash

To detect equivalent runs (same inputs), use `inputs_hash`:

```typescript
import { computeInputsHash } from '@/lib/versioning/constants'

const inputsHash = await computeInputsHash(normalizedAnswers)
```

This enables:
- Caching: Skip re-computation if hash matches
- Debugging: Find assessments with identical inputs
- Auditing: Verify data integrity

### Usage in Processing Pipeline

**When generating calculated_results:**

```typescript
const inputsForHash = {
  assessment_id: assessmentId,
  algorithm_version: CURRENT_ALGORITHM_VERSION,
  answers: normalizedAnswers,
}
const inputsHash = await computeInputsHash(inputsForHash)

await supabase.from('calculated_results').insert({
  assessment_id: assessmentId,
  algorithm_version: CURRENT_ALGORITHM_VERSION,
  funnel_version_id: funnelVersionId,
  scores: { ... },
  computed_at: new Date().toISOString(),
  inputs_hash: inputsHash,
})
```

**When generating reports:**

```typescript
// Compute inputs hash for deterministic versioning
const inputsForHash = {
  assessment_id: assessmentId,
  funnel_version_id: funnelVersionId,
  algorithm_version: CURRENT_ALGORITHM_VERSION,
  prompt_version: CURRENT_PROMPT_VERSION,
  answers: normalizedAnswers,
}
const inputsHash = await computeInputsHash(inputsForHash)
const inputsHashPrefix = getHashPrefix(inputsHash, 8)

const reportVersion = generateReportVersion({
  funnelVersion: funnel.version,
  algorithmVersion: CURRENT_ALGORITHM_VERSION,
  promptVersion: CURRENT_PROMPT_VERSION,
  inputsHashPrefix,
})

await supabase.from('reports').insert({
  assessment_id: assessmentId,
  report_version: reportVersion,
  prompt_version: CURRENT_PROMPT_VERSION,
  algorithm_version: CURRENT_ALGORITHM_VERSION,
  funnel_version_id: funnelVersionId,
  // ... other fields
})
```

**When generating report_sections:**

```typescript
await supabase.from('report_sections').insert({
  report_id: reportId,
  section_key: 'summary',
  prompt_version: CURRENT_PROMPT_VERSION,
  content: generatedContent,
})
```

### Updating Version Constants

When changing scoring logic or prompts, update:

```typescript
// lib/versioning/constants.ts

export const CURRENT_ALGORITHM_VERSION = 'v1.1.0' // ← Increment when algorithm changes
export const CURRENT_PROMPT_VERSION = '1.1'       // ← Increment when prompts change
```

**Versioning Rules:**
- **algorithm_version**: Use semantic versioning (MAJOR.MINOR.PATCH)
  - MAJOR: Breaking changes in scoring methodology
  - MINOR: New features, backward compatible
  - PATCH: Bug fixes, no output changes expected
  
- **prompt_version**: Use simple versioning (MAJOR.MINOR)
  - MAJOR: Significant prompt restructuring
  - MINOR: Refinements, adjustments

### Benefits

✅ **Reproducibility**: Can recreate exact output with same versions  
✅ **Debugging**: Know which version produced which result  
✅ **A/B Testing**: Compare outputs from different versions  
✅ **Rollback Safety**: Identify reports needing regeneration  
✅ **Auditing**: Full traceability for compliance  
✅ **Idempotency**: Unique constraints prevent duplicate runs

---

## Versioning Contract

### Semantic Versioning

```
MAJOR.MINOR.PATCH

MAJOR: Breaking changes
MINOR: New features, backward compatible
PATCH: Bug fixes, backward compatible
```

Current: `v0.4.0`  
Next: `v0.5.0` (new features planned)

---

## Related Documentation

- [Principles](PRINCIPLES.md) - Core development principles
- [Database Migrations](DB_MIGRATIONS.md) - Migration guidelines
- [Glossary](GLOSSARY.md) - Project terminology
- [Review Checklist](REVIEW_CHECKLIST.md) - Code review standards
