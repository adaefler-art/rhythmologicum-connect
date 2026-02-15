# Klinische Validierung Phase I/II (E4-03)

## Ziel
Safety- und Nutzenhypothesen für CRE operational evaluieren (retrospektiv + shadow mode).

## Studiendesign

### Phase I – Retrospektiv
- Datengrundlage: historische, de-identifizierte Intake-Fälle
- Vergleich: CRE-Ausgabe vs. klinischer Goldstandard
- Primäre Endpunkte:
  - Safety Recall (red-flag relevante Fälle)
  - Safety Precision
  - Review Approval Rate

### Phase II – Shadow Mode
- Laufende Fälle mit paralleler CRE-Auswertung ohne Primärsteuerung
- Endpunkte:
  - Follow-up Yield
  - Upload Completion Rate
  - Hard Stop Rate
  - Reviewer-Discordance-Rate

## KPI-Schwellen (initial)
- `cre_followup_yield` target >= 0.60
- `cre_upload_completion_rate` target >= 0.50
- `cre_hard_stop_rate` warning >= 0.30
- `cre_review_approval_rate` warning <= 0.50

## Fehleranalyse-Prozess
1. Wöchentliche Triage der kritischen Fälle
2. Labeling: FP/FN/Unklar + Domäne
3. Root-Cause-Tagging (Rule, Prompt, Mapping, Missing Data)
4. Feedback in versionierte Regel-/Reasoning-Configs

## Artefakte
- Monitoring API: `/api/admin/metrics/cre-monitoring`
- Admin KPI-Thresholds: `/api/admin/kpi-thresholds`
- Audit Events: `patient_events`
