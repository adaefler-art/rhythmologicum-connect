# v0.8 Weekly Review Cadence Plan

Stand: 2026-02-16

Ziel:
- Operative Aktivierung einer verlässlichen CRE-Weekly-Review-Terminserie.
- Einheitlicher Ablauf über Med, BE, Product und Ops.

## 1) Rhythmus

- Frequenz: wöchentlich
- Dauer: 45 Minuten
- Standard-Slot: Dienstag, 10:00-10:45 (lokale Teamzeit)
- Gültigkeit: bis Abschluss v0.8

## 2) Teilnehmerkreis

- Medical Lead (Pflicht)
- Backend Lead (Pflicht)
- Product Owner (Pflicht)
- Ops/Monitoring Owner (Pflicht)
- Optional: Clinician Delegate bei klinischen Sonderfällen

## 3) Vorbereitungs-Checklist (bis T-24h)

- KPI Snapshot (7d/30d) exportiert
- Alert-Liste priorisiert (`critical`, `warning`, `ok`)
- Offene Maßnahmen mit Owner/ETA aktualisiert
- Entscheidungsbedarf für Volumen/Thresholds vorbereitet

## 4) Meeting-Agenda (45 Minuten)

1. KPI-Lagebild (10 min)
2. Alert-Triage + Risiken (10 min)
3. Maßnahmen-Review (10 min)
4. Entscheidungen (Volumen, Thresholds, Auflagen) (10 min)
5. ToDos + Owner/ETA bestätigen (5 min)

## 5) Outputs pro Woche

- Ausgefülltes Protokoll auf Basis:
  - `docs/cre/NV3_WEEKLY_MONITORING_REVIEW_TEMPLATE.md`
- Maßnahmenliste mit Owner/ETA
- Entscheidungslog (Volumen halten/erhöhen/reduzieren)

## 6) Governance

- Ausfallregel: Termin darf max. 1x in Folge ausfallen
- Eskalation: bei fehlendem Medical Lead oder `critical` Alert sofortiger Ersatztermin <= 48h
- Revision: Cadence-Plan alle 4 Wochen überprüfen

## 7) Referenzen

- `docs/cre/NV3_SHADOW_MODE_OPERATION_RUNBOOK.md`
- `docs/cre/NV3_KPI_THRESHOLD_CALIBRATION_2026-02-16.md`
- `docs/cre/V0_8_GO_NO_GO_TEMPLATE.md`
