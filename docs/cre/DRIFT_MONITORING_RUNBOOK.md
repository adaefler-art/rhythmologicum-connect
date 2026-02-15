# Drift- & Safety-Monitoring Runbook (E4-04)

## Zweck
Kontinuierliche Überwachung von Safety/Qualität mit Alerting und Feedback-Loop.

## Datenquellen
- `patient_events`
- `clinical_intake_reviews`
- `kpi_thresholds`

## Monitoring API
- Endpoint: `/api/admin/metrics/cre-monitoring?days=7|30`
- Output:
  - `metrics`
  - `alerts` (`ok|warning|critical`)
  - `generated_at`

## Standard-Routine
- Frequenz: wöchentlich (7 Tage) + monatlich (30 Tage)
- Verantwortlich: Backend + Ops + Med Lead
- Schritte:
  1. Monitoring API abrufen
  2. Alerts priorisieren (`critical` zuerst)
  3. Fälle aus Audit/Review nachziehen
  4. Maßnahmen im Change-Log dokumentieren

## Alert-Policy
- `critical`: sofortige Safety-Review + ggf. Rule Override
- `warning`: in nächster Weekly-Review adressieren
- `ok`: beobachten, keine Eskalation

## Feedback-Loop in Versionierung
- Jede Regel-/Reasoning-Änderung muss enthalten:
  - Triggernde KPI/Alert
  - betroffene Domäne
  - erwarteter Effekt
  - Validierungsfenster (7/30 Tage)
