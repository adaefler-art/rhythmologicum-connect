# Safety Matrix (A/B/C)

## Level A (Immediate)

- Criteria: life-threatening or urgent red flags.
- Patient UI: chat hard-stop + safety banner.
- Clinician UI: Level A badge + red flag list.

## Level B (High Priority)

- Criteria: significant risk or urgent follow-up.
- Patient UI: chat continues.
- Clinician UI: Level B badge + "requires physician review" note.

## Level C (Follow-Up)

- Criteria: uncertainty or missing safety signals.
- Patient UI: chat continues.
- Clinician UI: optional safety questions.

## Deterministic Rules

- Escalation is rules-only; LLM output does not decide levels.
- Time/dynamics are parsed from structured intake fields (OPQRST/10W style).
