# NV4 KPI Comparison Report Template (Vorher/Nachher)

Stand: 2026-02-17

Zweck:
- Standardisierte Gegenueberstellung der NV4-Ziel-KPIs gegen Wave-5/Wave-6 Baselines.
- Entscheidungsgrundlage fuer NV4 Exit-Gates.

## 1) Report-Metadaten

- Report-ID:
- Datum/Uhrzeit:
- Zeitraum "Vorher" (Baseline):
- Zeitraum "Nachher" (Current):
- Datenquelle(n):
- Build/Release-Referenz:
- Owner:

## 2) Baseline-Referenz

- Wave-5 Baseline Quelle:
- Wave-6 Baseline Quelle:
- Hinweis zu Abweichungen in Datengrundlage (falls vorhanden):

## 3) KPI Vergleichstabelle

| KPI | Baseline (Vorher) | Aktuell (Nachher) | Delta absolut | Delta relativ | Zielkriterium | Status |
|---|---:|---:|---:|---:|---|---|
| `repeat_question_rate` | _offen_ | _offen_ | _offen_ | _offen_ | `>= 50% Reduktion ggü. Wave-5` | _offen_ |
| `clarification_loop_rate` | _offen_ | _offen_ | _offen_ | _offen_ | `signifikant reduziert ggü. Wave-5` | _offen_ |
| `resolved_followup_rate` | _offen_ | _offen_ | _offen_ | _offen_ | `stabil im Zielkorridor` | _offen_ |
| `objective_reask_violation_count` | _offen_ | _offen_ | _offen_ | _offen_ | `= 0 im Golden-Set` | _offen_ |
| `patient_dialog_dropoff_rate` | _offen_ | _offen_ | _offen_ | _offen_ | `verbessert ggü. Wave-6` | _offen_ |

Formeln:
- `Delta absolut = Nachher - Vorher`
- `Delta relativ = (Nachher - Vorher) / Vorher`

## 4) Qualitäts- und Signifikanzhinweise

- Stichprobengroesse (n):
- Ausreisserbehandlung:
- Konfidenz/Signifikanz-Methode:
- Einschränkungen:

## 5) Qualitative Klinik-Rueckmeldung

| Quelle | Kernaussage | Relevanz fuer KPI | Konsequenz |
|---|---|---|---|
| _offen_ | _offen_ | _offen_ | _offen_ |

## 6) Gate-Bewertung NV4

- [ ] Wiederholfragen um >= 50% ggü. Wave-5-Baseline reduziert
- [ ] `clarification_loop_rate` signifikant ggü. Wave-5-Baseline reduziert
- [ ] `resolved_followup_rate` im Zielkorridor stabil
- [ ] `objective_reask_violation_count = 0` im Golden-Set
- [ ] `patient_dialog_dropoff_rate` ggü. Wave-6-Baseline verbessert
- [ ] Positive qualitative UX-Rückmeldung klinisch dokumentiert

Gesamtvotum: `Go` / `Hold` / `Rework`

## 7) Maßnahmenliste bei Abweichung

| KPI | Gap | Maßnahme | Owner | ETA | Recheck-Fenster |
|---|---|---|---|---|---|
| _offen_ | _offen_ | _offen_ | _offen_ | _offen_ | _offen_ |

## 8) Evidence-Links

- Golden-Set Report:
- Monitoring Export:
- Ticket-/Issue-Links:
- Klinisches Review-Protokoll:

## Verknuepfte Artefakte

- `docs/cre/V0_8_KPI_BASELINE_SNAPSHOT_2026-02-16.md`
- `docs/cre/NV3_WEEKLY_MONITORING_REVIEW_TEMPLATE.md`
- `docs/cre/V0_8_EXECUTION_CHECKLIST_2026-02-15.md`
