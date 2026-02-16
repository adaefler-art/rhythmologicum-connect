# NV5 Release Readiness Report (Draft)

Stand: 2026-02-16

Ziel:
- Strukturierter Vorab-Report für das NV5-Release-Gate.
- Sammelpunkt für technische, klinische und operative Readiness-Evidenz.

## 1) Executive Summary

- Gesamtstatus: `in Arbeit`
- Empfehlung: `offen`
- Blocker (Top 3):
  1. _offen_
  2. _offen_
  3. _offen_

## 2) Gate-Status Übersicht

| Gate | Status | Evidence | Restaufwand |
|---|---|---|---|
| NV1 Qualität | teilweise erfüllt | Golden-Set 30/30 | Defect-Open-Count final prüfen |
| NV2 UX/Testready | in Arbeit | UX-Katalog + E2E + manuelle Checkliste | manuelle Vollabdeckung abschließen |
| NV3 Shadow Mode | in Arbeit | Runbook + Thresholds + Weekly Template | 2-Wochen-Stabilitätsnachweis |
| Safety | in Arbeit | Policy/Monitoring vorhanden | offene kritische Fälle final prüfen |
| Compliance/Export | in Arbeit | Export-/Audit-Pfade vorhanden | Abschlusscheck dokumentieren |

## 3) KPI Snapshot (zu ergänzen)

| KPI | Ist | Ziel/Schwelle | Status |
|---|---:|---:|---|
| `golden_set_pass_rate` | 1.00 | >= 0.95 | erfüllt |
| `followup_repeat_question_rate` | 0.00 | <= 0.05 | erfüllt |
| `objective_reask_violation_count` | 0 | = 0 | erfüllt |
| `clarification_loop_rate` | _offen_ | _offen_ | offen |
| `resolved_followup_rate` | _offen_ | _offen_ | offen |

## 4) Risiko-Register

| Risiko | Auswirkung | Wahrscheinlichkeit | Gegenmaßnahme | Owner |
|---|---|---|---|---|
| _offen_ | _offen_ | _offen_ | _offen_ | _offen_ |

## 5) Go/No-Go Vorbereitung

- Eingesetztes Template: `docs/cre/V0_8_GO_NO_GO_TEMPLATE.md`
- Geplanter Termin:
- Entscheidungsgrundlage vollständig? `ja/nein`

## 6) Nächste Schritte

1. NV2 manuelle Checklist vollständig durchführen.
2. NV3 2-Wochen-Stabilität dokumentieren.
3. Finalen Go/No-Go Termin mit Sign-off vorbereiten.
