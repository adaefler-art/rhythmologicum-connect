# Rule Tuning (Safety Red Flags)

This document summarizes the qualifier-based tuning added to reduce overly aggressive red flag triggers while keeping high-risk detections intact.

## Scope

- CHEST_PAIN now requires at least one qualifier to count as a verified red flag.
- SEVERE_PALPITATIONS now requires at least one qualifier to count as a verified red flag.
- SUICIDAL_IDEATION stays in the safety set, but A-level escalation requires intent/plan/means language.

## Qualifiers and Exclusions

### CHEST_PAIN

Requires any of the following qualifiers:
- acute or sudden onset
- new symptom
- exertion (effort or stairs)
- dyspnea (shortness of breath)
- syncope
- radiation to arm, jaw, or back
- pain at rest

Contradiction phrases always exclude qualification (for example, "no chest pain").

### SEVERE_PALPITATIONS

Requires any of the following qualifiers:
- syncope
- chest pain
- dyspnea
- persistent and strong palpitations

Anxiety and stress phrasing does not qualify on its own.

### SUICIDAL_IDEATION

- Baseline detection still flags as a red flag.
- A-level escalation requires clear intent, plan, preparation, or means language.

## Test Coverage

- Chest pain without qualifiers does not raise a verified red flag.
- Chest pain with qualifiers raises a Level B red flag.
- Passive suicidal ideation is downgraded to Level B.
- Active suicidal intent escalates to Level A.
- Palpitations without qualifiers (anxiety/stress only) do not raise a verified red flag.
- Palpitations with syncope remain Level B.

## References

- Tuning logic: lib/cre/safety/redFlags.ts
- Patterns: lib/triage/redFlagCatalog.ts
- Tests: lib/cre/safety/__tests__/evaluateRedFlags.test.ts
