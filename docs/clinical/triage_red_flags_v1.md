# Triage Red Flags v1 Catalog

**Version:** 1.0.0  
**Epic:** E6.6.7  
**Status:** ✅ Active

## Overview

This document defines the **authoritative red flag catalog** for the Rhythmologicum Connect triage system. Red flags are clinical indicators that require immediate escalation to healthcare professionals.

**Key Principles:**
- **Allowlist-only**: Only flags defined in this catalog are permitted
- **Conservative approach**: Better to escalate unnecessarily than miss a real emergency
- **Red flag dominance**: Red flags always trigger ESCALATE tier, overriding all other routing logic
- **Versioned**: Changes to the catalog require version updates and governance approval

---

## Red Flag Allowlist

The following 8 clinical red flag types are the **ONLY** permitted red flags in the system:

| Red Flag Type | Code | Description |
|--------------|------|-------------|
| **Chest Pain** | `CHEST_PAIN` | Chest pain, pressure, or discomfort - potential cardiac emergency |
| **Syncope** | `SYNCOPE` | Loss of consciousness or near-syncope |
| **Severe Dyspnea** | `SEVERE_DYSPNEA` | Severe difficulty breathing |
| **Suicidal Ideation** | `SUICIDAL_IDEATION` | Suicidal thoughts or self-harm intentions |
| **Acute Psychiatric Crisis** | `ACUTE_PSYCHIATRIC_CRISIS` | Severe mental health crisis (panic attack, psychosis, breakdown) |
| **Severe Palpitations** | `SEVERE_PALPITATIONS` | Severe heart rhythm disturbances or uncontrolled tachycardia |
| **Acute Neurological** | `ACUTE_NEUROLOGICAL` | Acute neurological symptoms (stroke-like symptoms) |
| **Severe Uncontrolled Symptoms** | `SEVERE_UNCONTROLLED_SYMPTOMS` | Severe uncontrolled symptoms requiring immediate emergency care |

---

## Keyword Patterns

Each red flag type is associated with **conservative keyword patterns** in both German and English. These patterns are designed to be **sensitive** (prioritize false positives over false negatives).

### 1. CHEST_PAIN

**Clinical Rationale:** Chest pain can indicate cardiac emergencies (MI, angina, aortic dissection). Immediate escalation is required.

**German Keywords:**
- brustschmerz, brustschmerzen
- herzschmerz, herzschmerzen
- schmerz in der brust, schmerzen in der brust
- brust druck, brustdruck
- herzenge
- angina pectoris
- stechen in der brust
- brennen in der brust
- engegefühl brust

**English Keywords:**
- chest pain
- chest discomfort
- chest pressure
- heart pain
- angina
- tightness in chest
- crushing chest
- squeezing chest

**Examples:**
- ✅ "Ich habe Brustschmerzen seit einer Stunde"
- ✅ "Starker Druck in der Brust"
- ✅ "I have chest pain and feel dizzy"

---

### 2. SYNCOPE

**Clinical Rationale:** Loss of consciousness can indicate cardiac arrhythmias, neurological events, or severe metabolic disturbances.

**German Keywords:**
- ohnmacht
- bewusstlos, bewusstlosigkeit
- umgekippt
- kollabiert
- zusammengebrochen
- black out
- schwarz vor augen
- bewusstsein verloren
- synkope

**English Keywords:**
- syncope
- fainted
- passed out
- lost consciousness
- blacked out
- collapsed
- blackout

**Examples:**
- ✅ "Bin heute ohnmächtig geworden"
- ✅ "Plötzlich bewusstlos"
- ✅ "I passed out at work"

---

### 3. SEVERE_DYSPNEA

**Clinical Rationale:** Severe breathing difficulty can indicate respiratory failure, cardiac decompensation, or pulmonary embolism.

**German Keywords:**
- atemnot
- keine luft
- nicht atmen
- erstick
- luftnot
- schwer zu atmen
- kann nicht atmen
- bekomme keine luft
- kurzatmig
- dyspnoe

**English Keywords:**
- cant breathe, cannot breathe
- shortness of breath
- difficulty breathing
- gasping for air
- suffocating
- dyspnea
- severe breathlessness

**Examples:**
- ✅ "Ich kann nicht atmen"
- ✅ "Bekomme keine Luft mehr"
- ✅ "I cant breathe properly"

---

### 4. SUICIDAL_IDEATION

**Clinical Rationale:** Suicidal thoughts or self-harm intentions require immediate psychiatric assessment and intervention.

**German Keywords:**
- suizid
- selbstmord
- umbringen
- sterben will
- nicht mehr leben
- selbstverletzung
- verletze mich
- selbstschädigung
- leben beenden
- suizidgedanken
- todesgedanken

**English Keywords:**
- suicide
- kill myself
- end my life
- self-harm, self harm
- hurt myself
- suicidal
- want to die
- better off dead

**Examples:**
- ✅ "Ich habe Suizidgedanken"
- ✅ "Will mein Leben beenden"
- ✅ "I want to kill myself"

---

### 5. ACUTE_PSYCHIATRIC_CRISIS

**Clinical Rationale:** Severe psychiatric crises (panic attacks, psychosis, hallucinations) require urgent psychiatric evaluation.

**German Keywords:**
- panikattacke
- akute panik
- totale panik
- nervenzusammenbruch
- psychose
- halluzinationen
- stimmen hören
- wahnvorstellungen
- akute krise
- psychiatrischer notfall

**English Keywords:**
- panic attack
- severe panic
- psychotic
- hallucinations
- hearing voices
- delusions
- nervous breakdown
- psychiatric emergency
- mental breakdown

**Examples:**
- ✅ "Ich habe eine Panikattacke"
- ✅ "Höre Stimmen seit gestern"
- ✅ "Having a severe panic attack"

---

### 6. SEVERE_PALPITATIONS

**Clinical Rationale:** Severe, uncontrolled heart rhythm disturbances can indicate dangerous arrhythmias requiring immediate evaluation.

**German Keywords:**
- herzrasen extrem
- herz rast unkontrolliert
- herzrhythmusstörung
- arrhythmie
- herzstolpern stark
- puls über 150
- puls sehr schnell
- herzjagen

**English Keywords:**
- heart racing uncontrollably
- severe palpitations
- arrhythmia
- irregular heartbeat severe
- heart rate over 150
- tachycardia severe

**Examples:**
- ✅ "Mein Herz rast unkontrolliert"
- ✅ "Puls über 150 seit 20 Minuten"
- ✅ "Heart racing uncontrollably"

---

### 7. ACUTE_NEUROLOGICAL

**Clinical Rationale:** Stroke-like symptoms (FAST criteria: Face, Arm, Speech, Time) require immediate emergency care.

**German Keywords:**
- schlaganfall
- lähmung
- gesichtslähmung
- sprachstörung plötzlich
- sehstörung plötzlich
- kribbeln halbseitig
- taubheit halbseitig
- kann nicht sprechen
- koordinationsverlust

**English Keywords:**
- stroke
- paralysis
- facial droop
- sudden speech difficulty
- sudden vision loss
- one-sided numbness
- one-sided weakness
- cannot speak suddenly
- loss of coordination

**Examples:**
- ✅ "Plötzliche Gesichtslähmung rechts"
- ✅ "Kann plötzlich nicht mehr sprechen"
- ✅ "One-sided weakness in left arm"

---

### 8. SEVERE_UNCONTROLLED_SYMPTOMS

**Clinical Rationale:** General emergency keywords indicating severe, uncontrolled symptoms requiring immediate care.

**German Keywords:**
- notfall
- akute gefahr
- unerträglich
- unkontrollierbar
- sofort hilfe
- dringend hilfe
- notaufnahme
- krankenwagen
- rettungsdienst
- 112

**English Keywords:**
- emergency
- acute danger
- unbearable
- uncontrollable
- immediate help
- urgent help
- emergency room
- ambulance
- 911

**Examples:**
- ✅ "Notfall - brauche sofort Hilfe"
- ✅ "Unerträgliche Schmerzen"
- ✅ "Emergency - need immediate help"

---

## Implementation

### Source of Truth

**File:** `lib/triage/redFlagCatalog.ts`

This TypeScript module contains:
- `CLINICAL_RED_FLAG` - Allowlist enum
- `RED_FLAG_PATTERNS` - Keyword mappings
- `detectClinicalRedFlags()` - Detection function
- `hasAnyRedFlag()` - Fast detection function
- `getRedFlagDescription()` - Human-readable descriptions

### Detection Logic

```typescript
import { detectClinicalRedFlags, hasAnyRedFlag } from '@/lib/triage/redFlagCatalog'

// Normalize input (lowercase, trim)
const normalizedInput = inputText.toLowerCase().trim()

// Check for any red flag (fast path)
if (hasAnyRedFlag(normalizedInput)) {
  // Trigger ESCALATE tier
  tier = TRIAGE_TIER.ESCALATE
}

// Get specific red flags detected
const detectedFlags = detectClinicalRedFlags(normalizedInput)
// Returns: ['CHEST_PAIN', 'SEVERE_DYSPNEA']
```

### Red Flag Dominance

**Rule:** If ANY red flag is detected, the triage result MUST be:
- `tier: TRIAGE_TIER.ESCALATE`
- `nextAction: TRIAGE_NEXT_ACTION.SHOW_ESCALATION`

This overrides all other classification logic (INFO vs ASSESSMENT).

---

## Testing

### Test File

**File:** `lib/triage/__tests__/redFlagCatalog.test.ts`

### Coverage Requirements

Each red flag type MUST have:
1. ✅ At least 5 German keyword tests
2. ✅ At least 5 English keyword tests
3. ✅ Negative test cases (non-detection)
4. ✅ Edge case tests (empty, whitespace, long input)

### Test Execution

```bash
npm test -- lib/triage/__tests__/redFlagCatalog.test.ts
```

---

## Governance

### Catalog Changes

Any change to the red flag catalog requires:

1. **Version Update**: Increment `RED_FLAG_CATALOG_VERSION`
2. **Documentation Update**: Update this document
3. **Test Update**: Add/modify tests for changed patterns
4. **Review**: Clinical review of new patterns
5. **Approval**: Security and compliance approval
6. **Migration**: Plan for handling existing triage sessions

### Adding a New Red Flag Type

To add a new red flag type (e.g., `SEVERE_BLEEDING`):

1. Add to `CLINICAL_RED_FLAG` enum
2. Add keyword patterns to `RED_FLAG_PATTERNS`
3. Add `getRedFlagDescription()` case
4. Add comprehensive tests (≥10 test cases)
5. Update this documentation
6. Increment version to `1.1.0`

### Modifying Existing Patterns

To modify keyword patterns for existing red flags:

1. Add/remove keywords in `RED_FLAG_PATTERNS`
2. Update tests to match new patterns
3. Document rationale in PR description
4. Increment patch version (e.g., `1.0.0` → `1.0.1`)

---

## Conservative Approach Rationale

The red flag catalog uses a **conservative (sensitive) approach**:

✅ **Better:** Escalate a non-emergency (false positive)  
❌ **Worse:** Miss a real emergency (false negative)

**Implications:**
- Keywords are broad and inclusive
- Borderline cases trigger escalation
- Bilingual support (German + English)
- No complex pattern matching (simple substring)

**Example:**
- Input: "leichter Brustdruck"
- Decision: **ESCALATE** (even though "leicht" suggests mild)
- Rationale: Chest pressure can indicate cardiac issues regardless of perceived severity

---

## Integration with Triage Engine

The red flag catalog integrates with the triage engine v1 (`lib/triage/engine.ts`):

```typescript
// Step 1: Normalize input
const normalizedInput = normalizeInput(input.inputText)

// Step 2: Check for red flags (from catalog)
const hasRedFlag = hasAnyRedFlag(normalizedInput)

// Step 3: Determine tier (red flags dominate)
if (hasRedFlag) {
  tier = TRIAGE_TIER.ESCALATE
} else {
  tier = classifyTier(normalizedInput)
}

// Step 4: Get specific flags for logging
const detectedFlags = detectClinicalRedFlags(normalizedInput)
```

---

## Acceptance Criteria Verification

### ✅ AC1: Allowlist is the only source of truth
- `CLINICAL_RED_FLAG` enum defines all permitted types
- `RED_FLAG_PATTERNS` maps keywords for each type
- No ad-hoc red flags in codebase
- Source file: `lib/triage/redFlagCatalog.ts`

### ✅ AC2: Patterns are conservative; redFlag dominance enforced
- Conservative keyword selection (broad, inclusive)
- Bilingual support (German + English)
- At least 5 patterns per red flag type
- Red flag detection triggers ESCALATE tier (dominates INFO/ASSESSMENT)
- Tests verify dominance behavior

### ✅ AC3: Docs exist and match implementation
- This document: `docs/clinical/triage_red_flags_v1.md`
- Documents all 8 red flag types
- Lists all keyword patterns
- Explains implementation and usage
- Includes governance procedures

---

## Audit Trail

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0.0 | 2025-01-16 | Initial red flag catalog with 8 clinical types | System |

---

## References

- **Implementation:** `lib/triage/redFlagCatalog.ts`
- **Tests:** `lib/triage/__tests__/redFlagCatalog.test.ts`
- **Integration:** `lib/triage/engine.ts`
- **Epic:** E6.6.7 — Red Flag Catalog v1

---

## Emergency Contact Information

**For users experiencing red flag symptoms:**

🚨 **Germany Emergency:** 112  
🚨 **US Emergency:** 911  
🚨 **Suicide Prevention Germany:** 0800 111 0 111  
🚨 **Suicide Prevention US:** 988

**Disclaimer:** This triage system is NOT a substitute for professional medical advice. If you are experiencing a medical emergency, call emergency services immediately.
