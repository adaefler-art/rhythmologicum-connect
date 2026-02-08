# Assistant Identity Rules

## Overview

This document defines the rules for how the AI assistant's identity is managed throughout the application. The assistant name must be globally configurable without requiring code changes throughout the repository.

## Current Identity

- **Name**: PAT
- **Full Description**: Persönlicher Assistent für Stress und Resilienz  
- **Configuration Source**: `/lib/config/assistant.ts`

## Rules

### R-001: Single Source of Truth
**Description**: All assistant identity information (name, description, greetings) MUST be defined in `/lib/config/assistant.ts` and nowhere else.

**Rationale**: Ensures a single point of configuration for easy renaming.

**Validation**: Check script MUST verify that ASSISTANT_CONFIG is imported and used wherever assistant identity is displayed.

**Violations**:
- Hard-coded "AMY", "PAT", or any other assistant name in UI components
- Hard-coded assistant descriptions or greetings
- Duplicated configuration in multiple files

**Exceptions**:
- API route paths (`/api/amy/*`) - kept for backward compatibility
- Database table names (`amy_chat_messages`) - kept for backward compatibility  
- Environment variable names (`NEXT_PUBLIC_FEATURE_AMY_*`) - kept for backward compatibility
- File names (`amyFallbacks.ts`, `AmyInsightsSection.tsx`) - kept to minimize breaking changes
- Legacy documentation in `/docs/_archive*` directories
- Database migration files in `/supabase/migrations/` - historical data, not modified

---

### R-002: UI Components Must Use Config
**Description**: All React/Next.js components that display the assistant's name or description MUST import and use `ASSISTANT_CONFIG` from `/lib/config/assistant.ts`.

**Rationale**: Ensures consistent branding across all user-facing interfaces.

**Validation**: Check script MUST scan all `.tsx` and `.jsx` files for hard-coded assistant references.

**Valid Pattern**:
```tsx
import { ASSISTANT_CONFIG } from '@/lib/config/assistant'

function MyComponent() {
  return <h1>Chat with {ASSISTANT_CONFIG.name}</h1>
}
```

**Invalid Pattern**:
```tsx
function MyComponent() {
  return <h1>Chat with AMY</h1> // violates R-002
}
```

---

### R-003: LLM Prompts Must Use Config
**Description**: All LLM prompts and system messages MUST dynamically reference `ASSISTANT_CONFIG.personaName` instead of hard-coding the assistant name.

**Rationale**: Ensures the LLM responds with the correct assistant identity.

**Validation**: Check script MUST verify that prompt generation functions import and use ASSISTANT_CONFIG.

**Valid Pattern**:
```ts
import { ASSISTANT_CONFIG } from '@/lib/config/assistant'

export function getPrompt(): string {
  return `Du bist ${ASSISTANT_CONFIG.personaName} und hilfst Patienten...`
}
```

**Invalid Pattern**:
```ts
export function getPrompt(): string {
  return `Du bist AMY und hilfst Patienten...` // violates R-003
}
```

---

### R-004: Documentation Must Reference Config
**Description**: User-facing documentation MUST either reference the config file or use generic terms like "AI assistant" or "assistant" instead of hard-coding names.

**Rationale**: Documentation should not become outdated when identity changes.

**Validation**: Check script SHOULD warn about hard-coded names in `/docs` (excluding archived docs).

**Valid Patterns**:
- "The AI assistant can help you..."
- "For configuration, see `/lib/config/assistant.ts`"
- "The assistant (currently configured as PAT) will..."

**Invalid Pattern**:
- "AMY is your personal assistant..." (without referencing config) // violates R-004

---

### R-005: Comments May Reference Historical Names
**Description**: Code comments MAY reference historical names (e.g., "AMY") when explaining backward compatibility or referencing legacy systems.

**Rationale**: Provides context for future developers about naming evolution.

**Validation**: Check script MUST NOT flag comments as violations unless they mislead about current configuration.

**Valid Pattern**:
```ts
// Feature flag kept as AMY_ENABLED for backward compatibility
// Actual identity configured in /lib/config/assistant.ts
export const featureFlags = {
  AMY_ENABLED: resolveFlag(env.NEXT_PUBLIC_FEATURE_AMY_ENABLED, true)
}
```

---

### R-006: API Routes and DB Names Exempted
**Description**: API route paths (e.g., `/api/amy/*`) and database object names (tables, columns) are EXEMPT from identity rules to maintain backward compatibility.

**Rationale**: Renaming API routes or database schemas would break existing integrations and require complex migrations.

**Validation**: Check script MUST NOT flag API routes or database migrations as violations.

**Examples of Exempt Items**:
- `/api/amy/chat/route.ts` - API route path
- `amy_chat_messages` - database table name
- `20260129064300_e73_8_create_amy_chat_messages.sql` - migration file
- `/apps/rhythm-legacy/app/api/amy/*` - legacy API routes

---

## Validation Matrix

| Rule ID | Description | Check Script | CI Enforcement |
|---------|-------------|--------------|----------------|
| R-001 | Single source of truth | `check-assistant-config.mjs` | ✅ Required |
| R-002 | UI components use config | `check-assistant-config.mjs` | ✅ Required |
| R-003 | LLM prompts use config | `check-assistant-config.mjs` | ✅ Required |
| R-004 | Documentation references config | `check-assistant-config.mjs` | ⚠️ Warning |
| R-005 | Comments may reference history | N/A (manual review) | ❌ Not enforced |
| R-006 | API/DB names exempted | `check-assistant-config.mjs` | ✅ Verified exempt |

## Check Script Requirements

The validation script (`check-assistant-config.mjs`) MUST:

1. Scan all `.tsx`, `.ts`, `.jsx`, `.js` files (excluding node_modules, .git, build artifacts)
2. Detect hard-coded references to assistant names ("AMY", "Amy", "PAT", "Pat")
3. Exclude allowed patterns (API routes, database files, comments with "backward compatibility")
4. Report violations with:
  - File path
  - Line number
  - Rule ID violated (e.g., "violates R-002")
  - Context snippet
5. Scan `/docs` markdown files (excluding archives) and emit warnings for hard-coded names (R-004)
6. Exit with code 1 if violations found (for CI integration)
7. Exit with code 0 if only warnings (R-004) or no issues

## Future Renaming Process

To rename the assistant in the future:

1. Update `/lib/config/assistant.ts` with new values
2. Run `npm run check:assistant-identity` to verify no hard-coded references
3. Update any documentation referencing the old name
4. No code changes should be needed if rules are followed

## See Also

- `/lib/config/assistant.ts` - Source of truth for identity
- `RULES_VS_CHECKS_MATRIX.md` - Full mapping of rules to checks
- `/scripts/ci/check-assistant-config.mjs` - Validation script
