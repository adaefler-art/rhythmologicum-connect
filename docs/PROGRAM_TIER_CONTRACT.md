# Program Tier Contract Documentation

**Issue**: TV05_01D - TIERS-TO-PILLARS-CONTRACT  
**Date**: 2026-01-02  
**Status**: ✅ Complete

---

## Overview

The **Program Tier Contract** system bridges Thomas' 3-Tier Patient Journey model (Tier 1/2.5/2) with the platform's Pillar/Funnel architecture. This contract-based approach makes the tier-driven patient experience configurable, versionable, and deterministic.

### Purpose

Thomas' Standard Operating Procedure (SOP) is tier-driven, while the platform modules are organized around Pillars and Funnels. The Program Tier Contract provides the missing link:

- **Tier 1 (Essential)**: Baseline stress/resilience assessment, self-service
- **Tier 2.5 (Enhanced)**: Regular monitoring with nurse touchpoints
- **Tier 2 (Comprehensive)**: Full program with intensive clinical support across all pillars

### Key Features

- ✅ **Configurable**: Each tier defines which pillars and funnels are active
- ✅ **Versionable**: Contracts can be versioned independently
- ✅ **Deterministic**: Clear mapping from tier to patient experience
- ✅ **No Magic Strings**: All identifiers come from centralized registry
- ✅ **PHI-Free**: Contains only configuration data, no patient information

---

## Architecture

### Contract Structure

```typescript
type ProgramTierContract = {
  tier: ProgramTier                      // Tier level (1, 2.5, 2)
  version: string                        // Contract version
  name: string                           // Human-readable name
  description: string                    // Tier description
  pillars: PillarConfig[]                // Active/inactive pillars
  funnels: FunnelVersionConstraint[]     // Allowed funnels with versions
  schedule?: ScheduleTouchpoint[]        // Optional touchpoint schedule
  metadata?: Record<string, any>         // Optional metadata
}
```

### File Organization

```
lib/contracts/
├── programTier.ts              # Contract types and validation
├── registry.ts                 # Updated with PROGRAM_TIER constants
└── tiers/
    ├── index.ts                # Central export
    ├── tier1-essential.ts      # Tier 1 configuration
    ├── tier2-5-enhanced.ts     # Tier 2.5 configuration (placeholder)
    ├── tier2-comprehensive.ts  # Tier 2 configuration (placeholder)
    └── __tests__/
        └── programTier.test.ts # Comprehensive tests
```

---

## Implementation Details

### 1. Contract Types (`lib/contracts/programTier.ts`)

**Core Types**:
- `ProgramTierContract`: Complete tier configuration
- `PillarConfig`: Pillar activation with priority
- `FunnelVersionConstraint`: Funnel with semver constraints
- `ScheduleTouchpoint`: Touchpoint placeholder for scheduling

**Validation**:
- Zod schemas for runtime validation
- Type guards for type safety
- Helper functions for querying contracts

**Helper Functions**:
- `getActivePillars(contract)`: Get active pillars for a tier
- `getRecommendedFunnels(contract)`: Get recommended funnels
- `getAllowedFunnels(contract)`: Get all allowed funnels
- `isFunnelAllowedInTier(contract, slug)`: Check funnel permission
- `isPillarActiveInTier(contract, key)`: Check pillar activation

### 2. Registry Updates (`lib/contracts/registry.ts`)

Added tier level constants:

```typescript
export const PROGRAM_TIER = {
  TIER_1_ESSENTIAL: 'tier-1-essential',
  TIER_2_5_ENHANCED: 'tier-2-5-enhanced',
  TIER_2_COMPREHENSIVE: 'tier-2-comprehensive',
} as const

export type ProgramTier = typeof PROGRAM_TIER[keyof typeof PROGRAM_TIER]

// Type guard
export function isValidProgramTier(value: unknown): value is ProgramTier
```

### 3. Tier Configurations (`lib/contracts/tiers/`)

#### Tier 1 Essential (Production Ready)

**Focus**: Baseline stress/resilience assessment  
**Active Pillars**: Mental Health only  
**Funnels**: stress-assessment v1.0.0  
**Schedule**: Single self-assessment  
**Support Level**: Self-service

```typescript
import { TIER_1_ESSENTIAL } from '@/lib/contracts/tiers'

// Example usage
const activePillars = getActivePillars(TIER_1_ESSENTIAL)
// => [PILLAR_KEY.MENTAL_HEALTH]

const funnels = getRecommendedFunnels(TIER_1_ESSENTIAL)
// => [FUNNEL_SLUG.STRESS_ASSESSMENT]
```

#### Tier 2.5 Enhanced (Placeholder for V05)

**Focus**: Extended monitoring with nurse touchpoints  
**Active Pillars**: Mental Health, Sleep  
**Funnels**: stress-assessment, sleep-quality  
**Schedule**: Multiple nurse visits and follow-ups  
**Support Level**: Nurse-supported

**Status**: Placeholder - requires V05 nurse scheduling implementation

#### Tier 2 Comprehensive (Placeholder for V05)

**Focus**: Full program with intensive clinical support  
**Active Pillars**: All 7 pillars  
**Funnels**: All available funnels  
**Schedule**: Clinician reviews, nurse visits, calls  
**Support Level**: Intensive clinical support

**Status**: Placeholder - requires V05 clinician workflow implementation

### 4. Catalog API Integration

**Endpoint**: `GET /api/funnels/catalog?tier={tier-level}`

**Behavior**:
- Without `tier` param: Returns all active funnels (backward compatible)
- With `tier` param: Filters to tier-allowed funnels and pillars
- Invalid tier param: Ignores filter, returns all (fail-safe)

**Example**:

```typescript
// Fetch catalog for Tier 1
const response = await fetch('/api/funnels/catalog?tier=tier-1-essential')
const { data } = await response.json()

// Returns only:
// - Mental Health pillar
// - stress-assessment funnel
// - tier field in response: 'tier-1-essential'
```

**Response Structure**:

```json
{
  "success": true,
  "data": {
    "pillars": [
      {
        "pillar": {
          "id": "...",
          "key": "mental-health",
          "title": "Mentale Gesundheit & Stressmanagement",
          "sort_order": 4
        },
        "funnels": [
          {
            "slug": "stress-assessment",
            "title": "Stress Assessment",
            "is_active": true,
            "default_version": "1.0.0"
          }
        ]
      }
    ],
    "uncategorized_funnels": [],
    "tier": "tier-1-essential"
  }
}
```

---

## Testing

### Test Coverage

**File**: `lib/contracts/tiers/__tests__/programTier.test.ts`

**Test Suites**:
1. **Contract Validation** (9 tests)
   - Valid/invalid contract detection
   - Zod schema validation
   - Safe parsing with error handling

2. **Helper Functions** (12 tests)
   - Active pillar extraction
   - Recommended/allowed funnel queries
   - Tier filtering logic

3. **Tier Configurations** (12 tests)
   - Tier 1/2.5/2 structure validation
   - PHI/PII absence verification
   - Schedule touchpoint verification

4. **Schema Validation** (7 tests)
   - Required fields enforcement
   - Optional fields handling

**Total**: 40 tests, all passing

### Running Tests

```bash
npm test -- lib/contracts/tiers/__tests__/programTier.test.ts
npm test -- lib/contracts/__tests__/registry.test.ts
```

---

## Usage Guide

### 1. Basic Usage

```typescript
import { TIER_1_ESSENTIAL, getTierContract } from '@/lib/contracts/tiers'
import { getActivePillars, getAllowedFunnels } from '@/lib/contracts/programTier'

// Get tier contract
const tier = getTierContract('tier-1-essential')
// or: const tier = TIER_1_ESSENTIAL

// Get active pillars
const pillars = getActivePillars(tier)
console.log(pillars) // ['mental-health']

// Get allowed funnels
const funnels = getAllowedFunnels(tier)
console.log(funnels) // ['stress-assessment']

// Check permissions
const isAllowed = isFunnelAllowedInTier(tier, 'stress-assessment')
console.log(isAllowed) // true
```

### 2. Catalog Filtering

```typescript
// Client-side example
async function fetchCatalogForTier(tier: string) {
  const response = await fetch(`/api/funnels/catalog?tier=${tier}`)
  const { data } = await response.json()
  return data
}

// Usage
const catalog = await fetchCatalogForTier('tier-1-essential')
// Returns filtered catalog with only tier-allowed content
```

### 3. Contract Validation

```typescript
import { validateProgramTierContract } from '@/lib/contracts/programTier'

const isValid = validateProgramTierContract(someContract)
if (!isValid) {
  console.error('Invalid tier contract')
}

// Or with error details
import { parseProgramTierContract } from '@/lib/contracts/programTier'

try {
  const contract = parseProgramTierContract(unknownData)
  // Use contract...
} catch (error) {
  console.error('Validation error:', error)
}
```

---

## Future Extensions (V05 Issues)

The tier contract system is designed to be extended in future V05 issues:

### 1. Triage Workflow Integration

**Issue**: TV05_TRIAGE_WORKFLOW  
**Extension**: Add triage rules to tier contracts

```typescript
// Future extension example
type ProgramTierContract = {
  // ... existing fields ...
  triageRules?: {
    conditions: TriageCondition[]
    pillarActivation: Record<PillarKey, boolean>
    escalationTiers?: ProgramTier[]
  }
}
```

### 2. Nurse Scheduling

**Issue**: TV05_NURSE_SCHEDULING  
**Extension**: Expand schedule touchpoints with actual scheduling data

```typescript
// Future extension example
type ScheduleTouchpoint = {
  // ... existing fields ...
  nurseId?: string
  scheduledTime?: string
  duration?: number
  videoEnabled?: boolean
}
```

### 3. Patient Settings/Preferences

**Issue**: TV05_PATIENT_SETTINGS  
**Extension**: Add patient preference overrides to tier selection

```typescript
// Future extension example
type PatientTierAssignment = {
  tier: ProgramTier
  assignedBy: 'clinician' | 'triage' | 'patient'
  assignedAt: string
  preferences?: {
    notificationFrequency?: string
    communicationChannel?: string
  }
}
```

### 4. Dynamic Pillar Activation

**Issue**: TV05_DYNAMIC_PILLARS  
**Extension**: Add rules for adaptive pillar activation based on assessment results

```typescript
// Future extension example
type PillarConfig = {
  // ... existing fields ...
  activationRules?: {
    trigger: 'always' | 'triage' | 'assessment_score'
    conditions?: {
      assessmentSlug?: string
      scoreThreshold?: number
      operator?: 'gt' | 'gte' | 'lt' | 'lte'
    }[]
  }
}
```

---

## Migration Guide

### From No Tier System

If your code currently doesn't use tiers:

**Before**:
```typescript
// Fetch all funnels
const catalog = await fetch('/api/funnels/catalog')
```

**After**:
```typescript
// Still works (backward compatible)
const catalog = await fetch('/api/funnels/catalog')

// Or with tier filtering
const catalog = await fetch('/api/funnels/catalog?tier=tier-1-essential')
```

### Adding New Tier Levels

To add a new tier level (e.g., Tier 0 Screening):

1. **Update Registry**:
```typescript
// lib/contracts/registry.ts
export const PROGRAM_TIER = {
  // ... existing tiers ...
  TIER_0_SCREENING: 'tier-0-screening',
} as const
```

2. **Create Configuration**:
```typescript
// lib/contracts/tiers/tier0-screening.ts
export const TIER_0_SCREENING: ProgramTierContract = {
  tier: PROGRAM_TIER.TIER_0_SCREENING,
  version: '1.0.0',
  name: 'Screening',
  description: 'Initial screening assessment',
  // ... configuration ...
}
```

3. **Update Index**:
```typescript
// lib/contracts/tiers/index.ts
export { TIER_0_SCREENING } from './tier0-screening'

export const ALL_TIER_CONTRACTS: Record<string, ProgramTierContract> = {
  // ... existing ...
  [PROGRAM_TIER.TIER_0_SCREENING]: TIER_0_SCREENING,
}
```

4. **Add Tests**: Update `programTier.test.ts` with tests for new tier

---

## Security & Compliance

### No PHI/PII

All tier contracts are verified to contain **zero PHI/PII**:

- ✅ No patient names, emails, or identifiers
- ✅ No sensitive health data
- ✅ Only configuration and workflow definitions
- ✅ Automated tests verify PHI absence

### Versioning

Contracts support versioning for:
- Tracking changes over time
- Rolling back problematic configurations
- A/B testing tier effectiveness
- Compliance auditing

---

## API Reference

### Types

See complete type definitions in:
- `lib/contracts/programTier.ts` - Contract types and validation
- `lib/contracts/registry.ts` - Tier level constants

### Functions

**Validation**:
- `validateProgramTierContract(contract)`: Boolean validation
- `parseProgramTierContract(contract)`: Parse with error throwing
- `safeParseProgramTierContract(contract)`: Safe parse returning null on error

**Queries**:
- `getActivePillars(contract)`: Extract active pillar keys
- `getRecommendedFunnels(contract)`: Extract recommended funnel slugs
- `getAllowedFunnels(contract)`: Extract all allowed funnel slugs
- `isFunnelAllowedInTier(contract, slug)`: Check funnel permission
- `isPillarActiveInTier(contract, key)`: Check pillar activation

**Lookups**:
- `getTierContract(tier)`: Get contract by tier level
- `getDefaultTierContract()`: Get default tier (Tier 1)

---

## Troubleshooting

### Common Issues

**Q: Tier filtering not working in catalog API?**  
A: Ensure the tier parameter matches registry constants exactly (case-sensitive). Invalid tier params are ignored (fail-safe).

**Q: How do I know which pillars are active for a tier?**  
A: Use `getActivePillars(tierContract)` - it returns sorted array of active pillar keys.

**Q: Can I modify tier contracts at runtime?**  
A: Contracts are immutable TypeScript objects. To change tier configuration, create a new contract version.

**Q: How do I add a new funnel to a tier?**  
A: Edit the tier configuration file (e.g., `tier1-essential.ts`), add the funnel to the `funnels` array with version constraint and priority.

---

## References

- **Issue**: [TV05_01D - TIERS-TO-PILLARS-CONTRACT](#)
- **Patient Journey SOP**: Thomas' 3-Tier Journey Model
- **Platform Architecture**: [TV05_CLEANUP_AUDIT_ISSUE_MAP](#)
- **Funnel System**: [Epic B Consolidation](./EPIC_B_CONSOLIDATION.md)
- **Pillar Catalog**: [Pillars SOT Audit](./PILLARS_SOT_AUDIT.md)

---

## Summary

The Program Tier Contract system successfully bridges Thomas' tier-driven SOP with the platform's pillar/funnel architecture. Key achievements:

✅ **Configurable tier contracts** with validation  
✅ **Tier 1 Essential** production-ready configuration  
✅ **Tier 2.5 and 2** placeholders for V05 expansion  
✅ **Catalog API** tier filtering (backward compatible)  
✅ **Comprehensive tests** (40 tests, all passing)  
✅ **PHI-free** verified  
✅ **Documentation** complete with usage guide and future extension plan

The system is ready for:
- Immediate use with Tier 1 (Essential)
- Extension in V05 issues (Triage, Nurse, Settings)
- Production deployment without breaking changes

---

**Implementation completed successfully on 2026-01-02** ✅
