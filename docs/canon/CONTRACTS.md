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
    status: 'in_progress' | 'completed' | 'abandoned'
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
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'abandoned')),
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

## RLS Policy Contract

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
