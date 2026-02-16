# NV3 Shadow-Mode Operation Runbook

Stand: 2026-02-16

Ziel:
- Operationaler Start des Controlled-Pilot-Betriebs im Shadow Mode (ohne Primärsteuerung der Versorgung).
- Einheitlicher Ablauf für Fallaufnahme, Monitoring, Eskalation und Evidence-Dokumentation.

## 1) Betriebsmodell

- Modus: Shadow Mode (CRE läuft parallel, klinische Primärentscheidung bleibt menschlich).
- Geltungsbereich: Patient-Dialog + klinischer Intake-Review-Flow.
- Laufzeitfenster initial: 2 Wochen als Stabilitätsfenster.

## 2) Rollen

- **Medical Lead**: klinische Bewertung, Freigaben, Risikoentscheid.
- **Backend Owner**: technische Stabilität, KPI/Alert-Verfolgung.
- **Ops Owner**: Monitoring-Routine, Evidence-Protokoll, Weekly-Review-Protokolle.

## 3) Fallvolumen-Plan (Start)

- Woche 1: 10-15 Fälle/Tag (kontrollierter Ramp-up)
- Woche 2: 15-25 Fälle/Tag (bei stabilen Alerts)
- Regel: Erhöhung nur, wenn keine unadressierten `critical` Alerts offen sind.

## 4) Täglicher Betriebsablauf

1. Monitoring abrufen (`/api/admin/metrics/cre-monitoring?days=7`)
2. Alerts nach Severity priorisieren (`critical` > `warning` > `ok`)
3. Kritische Fälle in Triage-Board erfassen (Owner + ETA)
4. Änderungen/Entscheidungen im Tageslog dokumentieren

## 5) Weekly Review (verbindliche Agenda)

1. KPI-Review (7 Tage + Trendvergleich)
2. `critical` und `warning` Alert-Rückblick
3. Top Root-Causes und Gegenmaßnahmen
4. Entscheidung: Volumen halten / erhöhen / reduzieren
5. Offene Risiken + nächste Validierungsaufgaben

## 6) Eskalationslogik

- `critical` Alert:
  - sofortige Prüfung durch Medical Lead + Backend Owner
  - ggf. temporäre Drosselung des Fallvolumens
  - Ursache + Maßnahme im Evidence-Log erfassen
- `warning` Alert:
  - Bearbeitung im nächsten Weekly Review
  - klare Owner-Zuweisung und Frist

## 7) Exit-Kriterien für NV3 (operativ)

- KPI-Stabilität über 2 Wochen nachweisbar
- kein unadressierter `critical` Alert
- klinisches Kurzreview bestätigt Alltagstauglichkeit

## 8) Artefakte

- KPI-Kalibrierungsblatt: `docs/cre/NV3_KPI_THRESHOLD_CALIBRATION_2026-02-16.md`
- Go/No-Go Vorlage: `docs/cre/V0_8_GO_NO_GO_TEMPLATE.md`
- v0.8 Tracking: `docs/cre/V0_8_EXECUTION_CHECKLIST_2026-02-15.md`