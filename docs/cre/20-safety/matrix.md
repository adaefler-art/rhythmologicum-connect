# Safety Escalation Matrix

## Levels

### Level A (Immediate)
- Patient UI: hard-stop banner; chat input disabled.
- Clinician UI: prominent Level A badge and red flag list.
- Action: immediate clinical escalation recommended.

### Level B (High Priority)
- Patient UI: chat continues; no hard stop.
- Clinician UI: Level B badge + review note.
- Action: clinician review required soon.

### Level C (Follow-Up)
- Patient UI: chat continues.
- Clinician UI: Level C badge if shown.
- Action: targeted safety questions recommended.

## Deterministic Inputs

- Red flag detection is rules-only.
- Time/dynamics rules are parsed from structured data (no LLM safety decisions).

## UI Behavior Summary

- Level A -> block chat and show safety banner.
- Level B -> show clinician review note; do not block chat.
- Level C -> keep chat open; prompt safety follow-ups where needed.
