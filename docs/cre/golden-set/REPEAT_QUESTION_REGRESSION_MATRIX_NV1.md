# NV1 Follow-up Repeat-Fragen Regression-Matrix

Stand: 2026-02-15

## Ziel

Diese Matrix dokumentiert die Regression-Absicherung gegen wiederholte Follow-up-Fragen
(Question-Echo/Re-Ask) im Golden-Set-Runner.

## Prüfkriterien

- `forbid_duplicate_questions = true`
  - Keine doppelte Frage (normalisiert) innerhalb `followup.next_questions`
- `forbid_duplicate_objective_ids = true`
  - Keine doppelte `objective_id` innerhalb `followup.next_questions`
- KPI-Referenzen (Runner-Output):
  - `followup_repeat_question_rate`
  - `objective_reask_violation_count`

## Abdeckung in Fixtures

| Scenario ID | Fixture | Fokus | Negative Variante | Duplicate Assertions |
|---|---|---|---|---|
| S11 | `11-medication-negative-nein-no-repeat.json` | Medikation verneint | `nein` | question + objective_id |
| S12 | `12-medication-negative-nei-typo-no-repeat.json` | Medikation verneint (Typo) | `nei` | question + objective_id |
| S13 | `13-medication-negative-nope-no-repeat.json` | Medikation verneint (EN Variante) | `nope` | question + objective_id |

## Ausführung

```bash
npm run cre:golden-set
```

## Erwartetes Ergebnis

- Alle Matrix-Szenarien im Report auf `✅`
- `followup_repeat_question_rate = 0`
- `objective_reask_violation_count = 0`

## Artefakte

- Report: `docs/cre/golden-set/latest.md`
- JSON: `docs/cre/golden-set/latest.json`
- Runner: `scripts/cre/run-coherence-battery.ts`
