# Safety Matrix (A/B/C)

## Level A (Immediate)

- Criteria: life-threatening or urgent red flags.
- Patient UI: chat hard-stop + safety banner.
- Clinician UI: Level A badge + red flag list.
 - Policy: `chatAction = hard_stop`

## Level B (High Priority)

- Criteria: significant risk or urgent follow-up.
- Patient UI: chat continues.
- Clinician UI: Level B badge + "requires physician review" note.
 - Policy: `chatAction = warn`

## Level C (Follow-Up)

- Criteria: uncertainty or missing safety signals.
- Patient UI: chat continues.
- Clinician UI: optional safety questions.
 - Policy: `chatAction = warn`

## Deterministic Rules

- Escalation is rules-only; LLM output does not decide levels.
- Time/dynamics are parsed from structured intake fields (OPQRST/10W style).

## Overrides

- Clinicians can override escalation level and chat action per intake.
- Overrides are stored with reason, user id, and timestamp for auditability.
