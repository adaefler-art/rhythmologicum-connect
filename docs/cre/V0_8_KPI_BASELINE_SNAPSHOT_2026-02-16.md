# v0.8 KPI Baseline Snapshot (Initial)

Stand: 2026-02-16

Zweck:
- Erste, dokumentierte KPI-Baseline für v0.8 Meta-Gate.
- Arbeitsgrundlage für NV3 Weekly Reviews und spätere Go/No-Go Entscheidung.

Einschränkung:
- Dieser Snapshot basiert auf aktuell verfügbaren lokalen/Mock-Evidenzen.
- Für finalen Gate-Status sind produktionsnahe Shadow-Mode-Daten nachzuführen.

## 1) Baseline-Werte (Initial)

| KPI | Wert | Quelle | Kommentar |
|---|---:|---|---|
| `golden_set_pass_rate` | `1.00` | `docs/cre/golden-set/latest.json` | 30/30 Szenarien bestanden |
| `followup_repeat_question_rate` | `0.00` | `docs/cre/golden-set/latest.json` | keine Frage-Duplikate im Golden-Set |
| `objective_reask_violation_count` | `0` | `docs/cre/golden-set/latest.json` | keine Objective-Reask-Verletzungen |
| `golden_set_total_cases` | `30` | `docs/cre/golden-set/latest.json` | Ausbauziel für NV1 v1 erreicht |

## 2) NV2/NV3 ergänzende Evidenz (qualitativ)

| Bereich | Beobachtung | Quelle |
|---|---|---|
| NV2 Dialog-Stabilität | Kernpfad inkl. Back/Reload/Mobile im Mock-Mode regressionsstabil nachgewiesen | `docs/cre/V0_8_EXECUTION_CHECKLIST_2026-02-15.md` |
| NV3 Operations-Readiness | Shadow-Mode-Runbook + Weekly-Template + Threshold-Kalibrierung vorhanden | `docs/cre/NV3_SHADOW_MODE_OPERATION_RUNBOOK.md`, `docs/cre/NV3_WEEKLY_MONITORING_REVIEW_TEMPLATE.md`, `docs/cre/NV3_KPI_THRESHOLD_CALIBRATION_2026-02-16.md` |

## 3) Noch offene Baselines (für finalen Gate-Status)

Diese KPIs müssen im Shadow-Mode mit realem Fallvolumen erhoben werden:

- `cre_followup_yield`
- `cre_upload_completion_rate`
- `cre_hard_stop_rate`
- `cre_review_approval_rate`
- `clarification_loop_rate`
- `resolved_followup_rate`

## 4) Nächste Schritte

1. Erste Weekly-Monitoring-Runde mit 7d/30d Export durchführen.
2. Tabelle in `docs/cre/NV3_KPI_THRESHOLD_CALIBRATION_2026-02-16.md` mit Ist-Werten befüllen.
3. Meta-Gate „KPI-Baselines erhoben und dokumentiert“ von `in Arbeit` auf `erledigt` heben, sobald Shadow-Mode-Istwerte dokumentiert sind.
