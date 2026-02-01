# Canonical Funnel Definition Schema v1

**Version:** 1.0  
**Status:** Canonical (Production)  
**Last Updated:** 2026-02-01  

## Purpose

This document defines the **Canonical Funnel Definition Schema v1**, the authoritative contract for all funnel configurations in the Rhythmologicum Connect platform. This schema governs both the questionnaire configuration and content manifest structures stored in the database.

All funnel definitions must conform to this schema to be accepted by the system. The schema is enforced at multiple layers:
- **Database:** Stored in JSONB fields (`questionnaire_config`, `content_manifest`)
- **Validation:** Runtime validation via `lib/validators/funnelDefinition.ts`
- **Studio Editor:** Pre-publish validation prevents invalid schemas
- **Patient API:** Only serves validated v1 schemas
- **CI/CD:** Automated checks ensure compliance

## Schema Version

All funnel definitions **MUST** include `schema_version: "v1"` in both:
- `questionnaire_config`
- `content_manifest`

This enables:
- Backwards compatibility detection
- Migration path for future schema versions
- Runtime validation and type safety

## Structure Overview

A complete funnel definition consists of two main components:

```typescript
interface FunnelDefinition {
  questionnaire_config: FunnelQuestionnaireConfig  // Assessment flow
  content_manifest: FunnelContentManifest          // Educational content
  algorithm_bundle_version: string                 // Scoring algorithm
  prompt_version: string                           // AI report generation
}
```

---

## 1. Questionnaire Config

The questionnaire config defines the assessment flow: steps, questions, validation rules, and conditional logic.

### Schema

```typescript
interface FunnelQuestionnaireConfig {
  schema_version: "v1"                    // REQUIRED: Schema version
  steps: QuestionnaireStep[]              // REQUIRED: Assessment steps
  metadata?: Record<string, any>          // Optional metadata
}

interface QuestionnaireStep {
  id: string                              // REQUIRED: Unique step identifier
  title: string                           // REQUIRED: Step title
  description?: string                    // Optional step description
  questions: QuestionConfig[]             // REQUIRED: Questions in this step
  orderIndex?: number                     // Optional: Step ordering (default: array order)
}

interface QuestionConfig {
  id: string                              // REQUIRED: Unique question identifier
  key: string                             // REQUIRED: Unique question key (for answer storage)
  type: QuestionType                      // REQUIRED: Question type
  label: string                           // REQUIRED: Question label/prompt
  helpText?: string | null                // Optional help text
  required?: boolean                      // Optional: Default false
  options?: QuestionOption[]              // REQUIRED for radio/checkbox
  validation?: QuestionValidation         // Optional validation rules
  minValue?: number                       // Optional: For number/scale/slider
  maxValue?: number                       // Optional: For number/scale/slider
  conditionalLogic?: ConditionalRule[]    // Optional: Show/hide conditions
}

type QuestionType = 
  | "radio"           // Single choice
  | "checkbox"        // Multiple choice
  | "text"            // Short text input
  | "textarea"        // Long text input
  | "number"          // Numeric input
  | "scale"           // Likert scale
  | "slider"          // Range slider

interface QuestionOption {
  value: string                           // REQUIRED: Option value
  label: string                           // REQUIRED: Option label
  helpText?: string | null                // Optional help text
}

interface QuestionValidation {
  required?: boolean                      // Is answer required?
  min?: number                            // Minimum value/length
  max?: number                            // Maximum value/length
  pattern?: string                        // Regex pattern
  message?: string                        // Custom error message
}

interface ConditionalRule {
  questionId: string                      // REQUIRED: Reference question ID
  operator: "equals" | "not_equals" | "contains" | "not_contains" | "greater_than" | "less_than"
  value: any                              // Comparison value
  action: "show" | "hide"                 // Action when condition is met
}
```

### Validation Rules

The following rules are enforced by `lib/validators/funnelDefinition.ts`:

#### Schema Structure Rules
- **R-E74-001:** Schema version must be "v1" (Error: `DEF_INVALID_SCHEMA_VERSION`, `DEF_MISSING_SCHEMA_VERSION`)
- **R-E74-002:** Schema must be valid according to Zod schema (Error: `DEF_INVALID_SCHEMA`)

#### Step Rules
- **R-E74-003:** Steps array must exist and not be empty (Error: `DEF_MISSING_STEPS`, `DEF_EMPTY_STEPS`)
- **R-E74-004:** Each step must have a unique ID (Error: `DEF_MISSING_STEP_ID`, `DEF_DUPLICATE_STEP_ID`)
- **R-E74-005:** Each step must have a title (Error: `DEF_MISSING_STEP_TITLE`)
- **R-E74-006:** Each step must have at least one question (Error: `DEF_MISSING_QUESTIONS`, `DEF_EMPTY_QUESTIONS`)

#### Question Rules
- **R-E74-007:** Each question must have a unique ID (Error: `DEF_MISSING_QUESTION_ID`, `DEF_DUPLICATE_QUESTION_ID`)
- **R-E74-008:** Each question must have a unique key (Error: `DEF_MISSING_QUESTION_KEY`, `DEF_DUPLICATE_QUESTION_KEY`)
- **R-E74-009:** Each question must have a type (Error: `DEF_MISSING_QUESTION_TYPE`, `DEF_INVALID_QUESTION_TYPE`)
- **R-E74-010:** Each question must have a label (Error: `DEF_MISSING_QUESTION_LABEL`)
- **R-E74-011:** Radio and checkbox questions must have options (Error: `DEF_MISSING_OPTIONS_FOR_CHOICE`, `DEF_EMPTY_OPTIONS_FOR_CHOICE`)

#### Conditional Logic Rules
- **R-E74-012:** Conditional logic must reference existing questions (Error: `DEF_INVALID_CONDITIONAL_REFERENCE`)
- **R-E74-013:** Conditional logic must not forward-reference questions (Error: `DEF_CONDITIONAL_FORWARD_REFERENCE`)

### Example: Stress Assessment Questionnaire Config

```json
{
  "schema_version": "v1",
  "steps": [
    {
      "id": "step-1",
      "title": "General Well-being",
      "description": "Let's start with some general questions about your well-being",
      "questions": [
        {
          "id": "q1",
          "key": "stress_level",
          "type": "scale",
          "label": "How would you rate your current stress level?",
          "helpText": "1 = No stress, 10 = Extreme stress",
          "required": true,
          "minValue": 1,
          "maxValue": 10
        },
        {
          "id": "q2",
          "key": "stress_frequency",
          "type": "radio",
          "label": "How often do you feel stressed?",
          "required": true,
          "options": [
            { "value": "rarely", "label": "Rarely" },
            { "value": "sometimes", "label": "Sometimes" },
            { "value": "often", "label": "Often" },
            { "value": "constantly", "label": "Constantly" }
          ]
        },
        {
          "id": "q3",
          "key": "stress_triggers",
          "type": "checkbox",
          "label": "What are your main stress triggers?",
          "helpText": "Select all that apply",
          "options": [
            { "value": "work", "label": "Work" },
            { "value": "family", "label": "Family" },
            { "value": "health", "label": "Health" },
            { "value": "finances", "label": "Finances" },
            { "value": "relationships", "label": "Relationships" }
          ],
          "conditionalLogic": [
            {
              "questionId": "q2",
              "operator": "equals",
              "value": "rarely",
              "action": "hide"
            }
          ]
        }
      ]
    },
    {
      "id": "step-2",
      "title": "Sleep & Energy",
      "questions": [
        {
          "id": "q4",
          "key": "sleep_quality",
          "type": "radio",
          "label": "How would you describe your sleep quality?",
          "required": true,
          "options": [
            { "value": "excellent", "label": "Excellent" },
            { "value": "good", "label": "Good" },
            { "value": "fair", "label": "Fair" },
            { "value": "poor", "label": "Poor" }
          ]
        },
        {
          "id": "q5",
          "key": "sleep_hours",
          "type": "number",
          "label": "How many hours do you typically sleep per night?",
          "required": true,
          "minValue": 0,
          "maxValue": 24,
          "validation": {
            "min": 0,
            "max": 24,
            "message": "Please enter a value between 0 and 24"
          }
        }
      ]
    }
  ]
}
```

---

## 2. Content Manifest

The content manifest defines educational content pages, sections, and assets displayed to users.

### Schema

```typescript
interface FunnelContentManifest {
  schema_version: "v1"                    // REQUIRED: Schema version
  version?: string                        // Optional: Content version (default: "1.0")
  pages: ContentPage[]                    // REQUIRED: Content pages
  assets?: ContentAsset[]                 // Optional: Media assets
  metadata?: Record<string, any>          // Optional metadata
}

interface ContentPage {
  slug: string                            // REQUIRED: Unique page identifier (lowercase, hyphens)
  title: string                           // REQUIRED: Page title
  description?: string                    // Optional page description
  sections: ContentSection[]              // REQUIRED: Page sections
  metadata?: Record<string, any>          // Optional metadata
}

interface ContentSection {
  key: string                             // REQUIRED: Section key
  type: SectionType                       // REQUIRED: Section type
  contentRef?: string                     // Optional: Reference to asset
  content?: Record<string, any>           // Optional: Inline content
  orderIndex?: number                     // Optional: Section ordering
}

type SectionType = 
  | "hero"            // Hero banner with background image
  | "text"            // Text content
  | "image"           // Image display
  | "video"           // Video player
  | "markdown"        // Markdown content
  | "cta"             // Call-to-action button
  | "divider"         // Visual separator

interface ContentAsset {
  key: string                             // REQUIRED: Unique asset key
  type: "image" | "video" | "audio" | "document"
  url: string                             // REQUIRED: Asset URL (validated for safety)
  metadata?: Record<string, any>          // Optional metadata
}
```

### Validation Rules

#### Content Manifest Rules
- **R-E74-014:** Pages array must exist and not be empty (Error: `DEF_MISSING_PAGES`, `DEF_EMPTY_PAGES`)
- **R-E74-015:** Each page must have a unique slug (Error: `DEF_MISSING_PAGE_SLUG`, `DEF_DUPLICATE_PAGE_SLUG`)
- **R-E74-016:** Each page must have a title (Error: `DEF_MISSING_PAGE_TITLE`)
- **R-E74-017:** Each page must have at least one section (Error: `DEF_MISSING_SECTIONS`, `DEF_EMPTY_SECTIONS`)
- **R-E74-018:** Asset keys must be unique (Error: `DEF_DUPLICATE_ASSET_KEY`)

### Security: Safe URL Validation

All URLs in the content manifest are validated against dangerous protocols:
- ✅ Allowed: `http:`, `https:`, `mailto:`, `tel:`, relative paths
- ❌ Blocked: `javascript:`, `data:`, `vbscript:`, `file:`

This prevents XSS attacks via content injection.

### Example: Stress Assessment Content Manifest

```json
{
  "schema_version": "v1",
  "version": "1.0",
  "pages": [
    {
      "slug": "welcome",
      "title": "Welcome to Your Stress Assessment",
      "description": "Understanding your stress levels is the first step to better well-being",
      "sections": [
        {
          "key": "hero-1",
          "type": "hero",
          "content": {
            "title": "Stress & Resilience Assessment",
            "subtitle": "Take a few minutes to understand your stress patterns",
            "backgroundImage": "/images/hero-stress.jpg"
          },
          "orderIndex": 0
        },
        {
          "key": "intro-text",
          "type": "text",
          "content": {
            "text": "This assessment will help you identify your stress levels, triggers, and resilience factors. It takes about 10 minutes to complete."
          },
          "orderIndex": 1
        },
        {
          "key": "cta-start",
          "type": "cta",
          "content": {
            "text": "Begin Assessment",
            "href": "/questionnaire/step-1",
            "variant": "primary"
          },
          "orderIndex": 2
        }
      ]
    },
    {
      "slug": "understanding-stress",
      "title": "Understanding Stress",
      "sections": [
        {
          "key": "stress-info",
          "type": "markdown",
          "content": {
            "markdown": "# What is Stress?\n\nStress is your body's natural response to challenges...\n\n## Common Signs of Stress\n- Physical tension\n- Difficulty sleeping\n- Changes in appetite\n- Irritability"
          }
        },
        {
          "key": "stress-video",
          "type": "video",
          "contentRef": "stress-explainer-video"
        }
      ]
    },
    {
      "slug": "results",
      "title": "Your Assessment Results",
      "sections": [
        {
          "key": "results-hero",
          "type": "hero",
          "content": {
            "title": "Your Personalized Results",
            "subtitle": "Based on your responses"
          }
        }
      ]
    }
  ],
  "assets": [
    {
      "key": "stress-explainer-video",
      "type": "video",
      "url": "https://example.com/videos/stress-explained.mp4",
      "metadata": {
        "duration": 180,
        "caption": "Understanding stress and its impact"
      }
    },
    {
      "key": "hero-background",
      "type": "image",
      "url": "/images/hero-stress.jpg",
      "metadata": {
        "alt": "Calm nature scene",
        "width": 1920,
        "height": 1080
      }
    }
  ]
}
```

---

## Validation

### Runtime Validation

Use the canonical validator to validate funnel definitions:

```typescript
import { 
  validateFunnelVersion, 
  formatValidationErrors 
} from '@/lib/validators/funnelDefinition'

const result = validateFunnelVersion({
  questionnaire_config: questionnaireConfig,
  content_manifest: contentManifest,
})

if (!result.valid) {
  console.error('Validation failed:')
  console.error(formatValidationErrors(result.errors))
  // Each error includes:
  // - code: Deterministic error code (e.g., "DEF_MISSING_STEPS")
  // - message: Human-readable description
  // - path: JSON path to the error
}
```

### CI/CD Validation

The CI/CD pipeline includes automated checks:

```bash
# Validate all funnel definitions in database
npm run verify:funnel-definitions
```

This script:
1. Connects to the database
2. Loads all `funnel_versions` rows
3. Validates each `questionnaire_config` and `content_manifest`
4. Reports violations with rule IDs (e.g., "violates R-E74-001")
5. Exits with code 1 if any violations found

---

## Error Codes Reference

All validation errors follow the pattern: `DEF_<CATEGORY>_<SPECIFIC_ERROR>`

### Schema Structure Errors
- `DEF_INVALID_SCHEMA` - Schema validation failed (Zod)
- `DEF_INVALID_SCHEMA_VERSION` - Schema version is not "v1"
- `DEF_MISSING_SCHEMA_VERSION` - Schema version field is missing

### Questionnaire Errors
- `DEF_MISSING_STEPS` - Steps array is missing
- `DEF_EMPTY_STEPS` - Steps array is empty
- `DEF_MISSING_STEP_TITLE` - Step is missing title
- `DEF_MISSING_STEP_ID` - Step is missing ID
- `DEF_DUPLICATE_STEP_ID` - Duplicate step ID found
- `DEF_MISSING_QUESTIONS` - Questions array is missing
- `DEF_EMPTY_QUESTIONS` - Questions array is empty
- `DEF_MISSING_QUESTION_ID` - Question is missing ID
- `DEF_MISSING_QUESTION_KEY` - Question is missing key
- `DEF_MISSING_QUESTION_TYPE` - Question is missing type
- `DEF_MISSING_QUESTION_LABEL` - Question is missing label
- `DEF_DUPLICATE_QUESTION_ID` - Duplicate question ID found
- `DEF_DUPLICATE_QUESTION_KEY` - Duplicate question key found
- `DEF_INVALID_QUESTION_TYPE` - Question type is invalid
- `DEF_MISSING_OPTIONS_FOR_CHOICE` - Radio/checkbox question missing options
- `DEF_EMPTY_OPTIONS_FOR_CHOICE` - Radio/checkbox question has empty options
- `DEF_INVALID_CONDITIONAL_REFERENCE` - Conditional references non-existent question
- `DEF_CONDITIONAL_FORWARD_REFERENCE` - Conditional references future question

### Content Manifest Errors
- `DEF_MISSING_PAGES` - Pages array is missing
- `DEF_EMPTY_PAGES` - Pages array is empty
- `DEF_MISSING_PAGE_SLUG` - Page is missing slug
- `DEF_MISSING_PAGE_TITLE` - Page is missing title
- `DEF_DUPLICATE_PAGE_SLUG` - Duplicate page slug found
- `DEF_MISSING_SECTIONS` - Sections array is missing
- `DEF_EMPTY_SECTIONS` - Sections array is empty
- `DEF_DUPLICATE_ASSET_KEY` - Duplicate asset key found

---

## Migration from Legacy Formats

If you have funnel definitions in older formats, follow these steps:

1. **Add schema_version field**
   ```json
   {
     "schema_version": "v1",
     "steps": [...]
   }
   ```

2. **Normalize question types**
   - `single_choice` → `radio`
   - `multi_choice` → `checkbox`
   - `short_text` → `text`
   - `long_text` → `textarea`

3. **Validate with canonical validator**
   ```bash
   npm run verify:funnel-definitions
   ```

4. **Fix any validation errors** using error codes as guidance

---

## Related Documentation

- **Validation Implementation:** `lib/validators/funnelDefinition.ts`
- **Schema Contracts:** `lib/contracts/funnelManifest.ts`
- **Rules vs Checks Matrix:** `/docs/RULES_VS_CHECKS_MATRIX.md`
- **Start/Resume Semantics:** `/docs/funnels/START_RESUME_SEMANTICS.md`
- **Studio Publishing:** `/docs/funnels/STUDIO_PUBLISH_GATES.md`
- **E74.1 Implementation:** `/docs/E74_1_IMPLEMENTATION_SUMMARY.md`

---

## Version History

- **v1 (2026-02-01):** Initial canonical schema
  - Added `schema_version` field to both configs
  - Established 18 validation rules
  - Implemented deterministic error codes
  - Added CI/CD integration
