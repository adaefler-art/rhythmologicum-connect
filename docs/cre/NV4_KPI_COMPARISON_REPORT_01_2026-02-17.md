# NV4 KPI Comparison Report — Run 01 (Vorher/Nachher)

Stand: 2026-02-17
Template: `docs/cre/NV4_KPI_COMPARISON_REPORT_TEMPLATE.md`

## 1) Report-Metadaten

- Report-ID: `NV4-KPI-REPORT-01-2026-02-17`
- Datum/Uhrzeit: `2026-02-17 _offen_`
- Zeitraum "Vorher" (Baseline): `Wave-5 _offen_`
- Zeitraum "Nachher" (Current): `Wave-6/v0.8 _offen_`
- Datenquelle(n): `Golden-Set + Monitoring Exporte + klinisches Review`
- Build/Release-Referenz: `_offen_`
- Owner: `_offen_`

## 2) Baseline-Referenz

- Wave-5 Baseline Quelle: `_offen_`
- Wave-6 Baseline Quelle: `_offen_`
- Hinweis zu Abweichungen in Datengrundlage (falls vorhanden):
  - Initial liegt ein Baseline-Snapshot vor, operative Shadow-Mode-Istwerte sind noch nachzufuehren.
  - Referenz: `docs/cre/V0_8_KPI_BASELINE_SNAPSHOT_2026-02-16.md`

## 3) KPI Vergleichstabelle

| KPI | Baseline (Vorher) | Aktuell (Nachher) | Delta absolut | Delta relativ | Zielkriterium | Status |
|---|---:|---:|---:|---:|---|---|
| `repeat_question_rate` | _offen_ | _offen_ | _offen_ | _offen_ | `>= 50% Reduktion ggü. Wave-5` | _offen_ |
| `clarification_loop_rate` | _offen_ | _offen_ | _offen_ | _offen_ | `signifikant reduziert ggü. Wave-5` | _offen_ |
| `resolved_followup_rate` | _offen_ | _offen_ | _offen_ | _offen_ | `stabil im Zielkorridor` | _offen_ |
| `objective_reask_violation_count` | `0` | _offen_ | _offen_ | _offen_ | `= 0 im Golden-Set` | _offen_ |
| `patient_dialog_dropoff_rate` | _offen_ | _offen_ | _offen_ | _offen_ | `verbessert ggü. Wave-6` | _offen_ |

Formeln:
- `Delta absolut = Nachher - Vorher`
- `Delta relativ = (Nachher - Vorher) / Vorher`

## 4) Qualitäts- und Signifikanzhinweise

- Stichprobengroesse (n): `_offen_`
- Ausreisserbehandlung: `_offen_`
- Konfidenz/Signifikanz-Methode: `_offen_`
- Einschraenkungen:
  - Derzeit liegt fuer mehrere operative KPIs noch kein 2-Wochen-Shadow-Mode-Nachweis vor.

## 5) Qualitative Klinik-Rueckmeldung

| Quelle | Kernaussage | Relevanz fuer KPI | Konsequenz |
|---|---|---|---|
| _offen_ | _offen_ | _offen_ | _offen_ |

## 6) Gate-Bewertung NV4

- [ ] Wiederholfragen um >= 50% ggü. Wave-5-Baseline reduziert
- [ ] `clarification_loop_rate` signifikant ggü. Wave-5-Baseline reduziert
- [ ] `resolved_followup_rate` im Zielkorridor stabil
- [~] `objective_reask_violation_count = 0` im Golden-Set (lokal dokumentiert)
- [ ] `patient_dialog_dropoff_rate` ggü. Wave-6-Baseline verbessert
- [ ] Positive qualitative UX-Rückmeldung klinisch dokumentiert

Gesamtvotum: `Hold`

## 7) Maßnahmenliste bei Abweichung

| KPI | Gap | Maßnahme | Owner | ETA | Recheck-Fenster |
|---|---|---|---|---|---|
| `repeat_question_rate` | Baseline/Current fehlt | Wave-5/6 Referenzwerte aus Monitoring fixieren | _offen_ | _offen_ | 7 Tage |
| `clarification_loop_rate` | Signifikanznachweis fehlt | Vergleichsfenster + Methode in Weekly Review festlegen | _offen_ | _offen_ | 7 Tage |
| `resolved_followup_rate` | Zielkorridor nicht belegt | Shadow-Mode-Daten aggregieren | _offen_ | _offen_ | 14 Tage |
| `patient_dialog_dropoff_rate` | Delta ggü. Wave-6 fehlt | Dropoff-Definition und Query konsolidieren | _offen_ | _offen_ | 7 Tage |

## 8) Evidence-Links

- Golden-Set Report: `docs/cre/golden-set/latest.md`
- Baseline Snapshot: `docs/cre/V0_8_KPI_BASELINE_SNAPSHOT_2026-02-16.md`
- Monitoring Review Template: `docs/cre/NV3_WEEKLY_MONITORING_REVIEW_TEMPLATE.md`
- Klinisches Review-Protokoll: `_offen_`

## Verknuepfte Artefakte

- `docs/cre/V0_8_KPI_BASELINE_SNAPSHOT_2026-02-16.md`
- `docs/cre/NV3_WEEKLY_MONITORING_REVIEW_TEMPLATE.md`
- `docs/cre/V0_8_EXECUTION_CHECKLIST_2026-02-15.md`
