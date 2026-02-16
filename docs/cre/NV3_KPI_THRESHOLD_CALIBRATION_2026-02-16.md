# NV3 KPI Threshold Calibration (Startblatt)

Stand: 2026-02-16

Zweck:
- Einheitliche Erstkalibrierung und Nachschärfung der NV3-KPIs im Shadow Mode.
- Arbeitsdokument für Weekly Reviews und Threshold-Entscheidungen.

## 1) KPI-Set

Primär (NV3):
- `cre_followup_yield`
- `cre_upload_completion_rate`
- `cre_hard_stop_rate`
- `cre_review_approval_rate`
- `clarification_loop_rate`
- `resolved_followup_rate`

## 2) Start-Schwellen (Initial)

| KPI | Richtung | Green | Warning | Critical |
|---|---|---|---|---|
| `cre_followup_yield` | höher besser | >= 0.60 | 0.45-0.59 | < 0.45 |
| `cre_upload_completion_rate` | höher besser | >= 0.50 | 0.35-0.49 | < 0.35 |
| `cre_hard_stop_rate` | niedriger besser | < 0.20 | 0.20-0.29 | >= 0.30 |
| `cre_review_approval_rate` | höher besser | > 0.50 | 0.40-0.50 | < 0.40 |
| `clarification_loop_rate` | niedriger besser | < 0.15 | 0.15-0.24 | >= 0.25 |
| `resolved_followup_rate` | höher besser | >= 0.70 | 0.55-0.69 | < 0.55 |

## 3) Baseline-Erhebung (Woche 1)

| KPI | 7d Ist | 30d Ist | Delta vs. Vorwoche | Status |
|---|---|---|---|---|
| `cre_followup_yield` | _offen_ | _offen_ | _offen_ | _offen_ |
| `cre_upload_completion_rate` | _offen_ | _offen_ | _offen_ | _offen_ |
| `cre_hard_stop_rate` | _offen_ | _offen_ | _offen_ | _offen_ |
| `cre_review_approval_rate` | _offen_ | _offen_ | _offen_ | _offen_ |
| `clarification_loop_rate` | _offen_ | _offen_ | _offen_ | _offen_ |
| `resolved_followup_rate` | _offen_ | _offen_ | _offen_ | _offen_ |

## 4) Kalibrierungsregeln

- Schwellen nur im Weekly Review anpassen (kein ad-hoc Drift).
- Änderungen müssen enthalten:
  - auslösende KPI/Alert
  - Begründung (medizinisch + technisch)
  - erwarteter Effekt
  - Prüfzeitpunkt (7/30 Tage)
- Bei `critical` immer sofortige Gegenmaßnahme + Dokumentation.

## 5) Änderungsprotokoll

| Datum | KPI | Alter Wert | Neuer Wert | Grund | Owner |
|---|---|---|---|---|---|
| _offen_ | _offen_ | _offen_ | _offen_ | _offen_ | _offen_ |

## 6) Verknüpfung

- Monitoring Endpoint: `/api/admin/metrics/cre-monitoring?days=7|30`
- Threshold-Verwaltung: `/api/admin/kpi-thresholds`
- Operatives Runbook: `docs/cre/NV3_SHADOW_MODE_OPERATION_RUNBOOK.md`