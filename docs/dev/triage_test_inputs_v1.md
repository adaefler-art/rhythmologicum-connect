# Triage Test Inputs v1 — Deterministic Canned Examples

**Version:** 1.0.0  
**Epic:** E6.6.9  
**Status:** ✅ Active

## Overview

This document defines **deterministic canned input examples** for testing the Rhythmologicum Connect triage system. These inputs cover all router paths (INFO, ASSESSMENT, ESCALATE) and produce predictable `nextAction` results.

**Key Principles:**
- **Deterministic**: Same input → same output every time
- **Coverage**: All triage tiers and router paths covered
- **Testable**: Each input has clear expected behavior
- **Bilingual**: German and English examples included
- **Dev harness ready**: Can be used in automated tests and dev UI

---

## Test Input Catalog

### INFO Tier Examples (nextAction: SHOW_CONTENT)

Informational queries that should navigate to content tiles on dashboard.

#### Input 1: Basic Info Query (German)
```json
{
  "inputText": "Was ist Stress und wie wirkt er sich auf meine Gesundheit aus?",
  "expectedTier": "INFO",
  "expectedNextAction": "SHOW_CONTENT",
  "expectedRedFlags": [],
  "description": "Simple informational question about stress"
}
```

#### Input 2: Info Query with "How Does" Pattern (English)
```json
{
  "inputText": "How does meditation help with anxiety and stress management?",
  "expectedTier": "INFO",
  "expectedNextAction": "SHOW_CONTENT",
  "expectedRedFlags": [],
  "description": "Educational query about meditation techniques"
}
```

#### Input 3: Learning Request (German)
```json
{
  "inputText": "Ich möchte gerne mehr wissen über Stressmanagement und Entspannungstechniken.",
  "expectedTier": "INFO",
  "expectedNextAction": "SHOW_CONTENT",
  "expectedRedFlags": [],
  "description": "Request to learn more about stress management"
}
```

---

### ASSESSMENT Tier Examples (nextAction: START_FUNNEL_A)

Concerns that require structured assessment via stress-resilience funnel.

#### Input 4: Stress Concern (German)
```json
{
  "inputText": "Ich fühle mich sehr gestresst und erschöpft in letzter Zeit. Es fällt mir schwer, mich zu konzentrieren.",
  "expectedTier": "ASSESSMENT",
  "expectedNextAction": "START_FUNNEL_A",
  "expectedRedFlags": [],
  "description": "Stress and exhaustion requiring assessment"
}
```

#### Input 5: Sleep Problems (German)
```json
{
  "inputText": "Ich habe seit Wochen Schlafprobleme. Ich kann nicht einschlafen und wache nachts oft auf.",
  "expectedTier": "ASSESSMENT",
  "expectedNextAction": "START_FUNNEL_A",
  "expectedRedFlags": [],
  "description": "Sleep issues requiring structured assessment"
}
```

#### Input 6: Anxiety and Worry (English)
```json
{
  "inputText": "I've been feeling very anxious and worried lately. I'm constantly stressed about work and my health.",
  "expectedTier": "ASSESSMENT",
  "expectedNextAction": "START_FUNNEL_A",
  "expectedRedFlags": [],
  "description": "Anxiety symptoms requiring funnel assessment"
}
```

#### Input 7: Overwhelmed State (German)
```json
{
  "inputText": "Ich bin total überfordert mit allem. Die Arbeit, die Familie, alles ist zu viel. Ich bin ständig müde.",
  "expectedTier": "ASSESSMENT",
  "expectedNextAction": "START_FUNNEL_A",
  "expectedRedFlags": [],
  "description": "Overwhelmed state needing assessment"
}
```

---

### ESCALATE Tier Examples (nextAction: SHOW_ESCALATION)

Emergency or critical situations requiring immediate escalation to support.

#### Input 8: Suicidal Ideation (German)
```json
{
  "inputText": "Ich habe Suizidgedanken und weiß nicht mehr weiter. Alles fühlt sich hoffnungslos an.",
  "expectedTier": "ESCALATE",
  "expectedNextAction": "SHOW_ESCALATION",
  "expectedRedFlags": ["answer_pattern"],
  "description": "Suicidal thoughts - immediate escalation required"
}
```

#### Input 9: Chest Pain Emergency (German)
```json
{
  "inputText": "Ich habe seit einer Stunde starke Brustschmerzen und Druck auf der Brust. Mir ist schwindelig.",
  "expectedTier": "ESCALATE",
  "expectedNextAction": "SHOW_ESCALATION",
  "expectedRedFlags": ["answer_pattern"],
  "description": "Chest pain - potential cardiac emergency"
}
```

#### Input 10: Severe Breathing Difficulty (English)
```json
{
  "inputText": "I can't breathe properly and I'm gasping for air. This is an emergency situation.",
  "expectedTier": "ESCALATE",
  "expectedNextAction": "SHOW_ESCALATION",
  "expectedRedFlags": ["answer_pattern"],
  "description": "Severe dyspnea - immediate escalation"
}
```

---

## Usage in Tests

### Example: Testing All Canned Inputs

```typescript
import { runTriageEngine } from '@/lib/triage/engine'
import { TRIAGE_TIER, TRIAGE_NEXT_ACTION } from '@/lib/api/contracts/triage'

describe('Triage Test Inputs v1 - Deterministic Canned Examples', () => {
  it('Input 1: Info query about stress → INFO tier', () => {
    const result = runTriageEngine({
      inputText: 'Was ist Stress und wie wirkt er sich auf meine Gesundheit aus?',
    })
    
    expect(result.tier).toBe(TRIAGE_TIER.INFO)
    expect(result.nextAction).toBe(TRIAGE_NEXT_ACTION.SHOW_CONTENT)
    expect(result.redFlags).toEqual([])
  })
  
  it('Input 4: Stress concern → ASSESSMENT tier', () => {
    const result = runTriageEngine({
      inputText: 'Ich fühle mich sehr gestresst und erschöpft in letzter Zeit. Es fällt mir schwer, mich zu konzentrieren.',
    })
    
    expect(result.tier).toBe(TRIAGE_TIER.ASSESSMENT)
    expect(result.nextAction).toBe(TRIAGE_NEXT_ACTION.START_FUNNEL_A)
    expect(result.redFlags).toEqual([])
  })
  
  it('Input 8: Suicidal ideation → ESCALATE tier', () => {
    const result = runTriageEngine({
      inputText: 'Ich habe Suizidgedanken und weiß nicht mehr weiter. Alles fühlt sich hoffnungslos an.',
    })
    
    expect(result.tier).toBe(TRIAGE_TIER.ESCALATE)
    expect(result.nextAction).toBe(TRIAGE_NEXT_ACTION.SHOW_ESCALATION)
    expect(result.redFlags).toContain('answer_pattern')
  })
})
```

---

## Usage in Dev UI (Optional Quick-Fill)

### Environment Gate

Dev UI quick-fill buttons should only appear when:
- `NODE_ENV !== 'production'` OR
- Custom env flag: `NEXT_PUBLIC_DEV_HARNESS_ENABLED=true`

### Example Component Integration

```tsx
const DEV_QUICK_FILLS = [
  {
    label: '💬 Info: Was ist Stress?',
    text: 'Was ist Stress und wie wirkt er sich auf meine Gesundheit aus?',
    tier: 'INFO',
  },
  {
    label: '📋 Assessment: Gestresst',
    text: 'Ich fühle mich sehr gestresst und erschöpft in letzter Zeit. Es fällt mir schwer, mich zu konzentrieren.',
    tier: 'ASSESSMENT',
  },
  {
    label: '🚨 Escalate: Suizidgedanken',
    text: 'Ich habe Suizidgedanken und weiß nicht mehr weiter. Alles fühlt sich hoffnungslos an.',
    tier: 'ESCALATE',
  },
]

// Only show in dev environments
const showDevHarness = 
  process.env.NODE_ENV !== 'production' ||
  process.env.NEXT_PUBLIC_DEV_HARNESS_ENABLED === 'true'
```

---

## Coverage Matrix

| Tier | German Examples | English Examples | Total |
|------|----------------|------------------|-------|
| INFO | 2 | 1 | 3 |
| ASSESSMENT | 3 | 1 | 4 |
| ESCALATE | 2 | 1 | 3 |
| **TOTAL** | **7** | **3** | **10** |

### Router Path Coverage

✅ **INFO → SHOW_CONTENT**: Inputs 1, 2, 3  
✅ **ASSESSMENT → START_FUNNEL_A**: Inputs 4, 5, 6, 7  
✅ **ESCALATE → SHOW_ESCALATION**: Inputs 8, 9, 10

### Red Flag Type Coverage

✅ **No Red Flags**: Inputs 1-7  
✅ **Suicidal Ideation**: Input 8  
✅ **Chest Pain**: Input 9  
✅ **Severe Dyspnea**: Input 10

---

## Acceptance Criteria Verification

### ✅ AC1: Each input produces expected nextAction in tests
- All 10 inputs have explicit `expectedNextAction` defined
- Test suite validates actual output matches expected output
- Deterministic behavior guaranteed by triage engine v1

### ✅ AC2: Dev UI only in non-prod
- Environment gate checks `NODE_ENV !== 'production'`
- Optional flag: `NEXT_PUBLIC_DEV_HARNESS_ENABLED`
- Production deployments will not show dev UI unless explicitly enabled

---

## Integration Points

### Triage Engine
- **File**: `lib/triage/engine.ts`
- **Function**: `runTriageEngine(input: TriageEngineInput): TriageResultV1`

### Triage Router
- **File**: `lib/triage/router.ts`
- **Function**: `mapNextActionToRoute(nextAction, triageResult): TriageRoute`

### AMY Composer (Optional Dev UI)
- **File**: `app/patient/dashboard/components/AMYComposer.tsx`
- **Integration**: Quick-fill buttons with environment gate

---

## Maintenance

### Adding New Test Inputs

When adding new test inputs:
1. Follow the JSON schema format
2. Include both German and English examples where applicable
3. Ensure input covers a unique edge case or path
4. Add corresponding test case to test suite
5. Update coverage matrix in this document
6. Increment patch version (e.g., `1.0.0` → `1.0.1`)

### Versioning

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2026-01-16 | Initial catalog with 10 deterministic inputs | System |

---

## References

- **Epic**: E6.6.9 — Dev Harness: Deterministic Triage Test Inputs
- **Triage Engine**: `lib/triage/engine.ts`
- **Triage Router**: `lib/triage/router.ts`
- **Triage Contracts**: `lib/api/contracts/triage/index.ts`
- **Red Flag Catalog**: `docs/clinical/triage_red_flags_v1.md`
- **Test File**: `lib/triage/__tests__/cannedInputs.test.ts`

---

## Emergency Disclaimer

**For users experiencing red flag symptoms:**

🚨 **Germany Emergency:** 112  
🚨 **US Emergency:** 911  
🚨 **Suicide Prevention Germany:** 0800 111 0 111  
🚨 **Suicide Prevention US:** 988

**Disclaimer:** This triage system is NOT a substitute for professional medical advice. If you are experiencing a medical emergency, call emergency services immediately.
